import { NextResponse } from "next/server";
import { verifyAuth } from "./lib/auth";

export async function proxy(req) {
  const adminToken = req.cookies.get("admin_token")?.value;
  const userToken = req.cookies.get("auth_token")?.value;
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get("host") || "";
  const platformDomain = process.env.PLATFORM_DOMAIN || "localhost:3000";

  // ─── TENANT DETECTION ─────────────────────────────────────────
  const isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1");
  let slug = null;

  if (isLocalhost) {
    // tenant.localhost:3000 → slug = "tenant"
    const parts = hostname.split(".");
    if (parts.length > 1 && parts[0] !== "www") {
      slug = parts[0].split(":")[0];
    }
  } else {
    const domainParts = platformDomain.split(".");
    const hostParts = hostname.split(".");

    if (hostParts.length > domainParts.length) {
      const potentialSlug = hostParts[0];
      if (potentialSlug !== "www") {
        slug = potentialSlug;
      }
    } else if (hostname !== platformDomain && hostname !== `www.${platformDomain}`) {
      // Custom domain - don't return early, just flag it
      // Let the headers be set below
    }
  }

  // Set tenant slug, custom domain + pathname headers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-next-pathname", pathname);
  
  if (slug) {
    requestHeaders.set("x-tenant-slug", slug);
  } else if (hostname !== platformDomain && hostname !== `www.${platformDomain}`) {
    requestHeaders.set("x-custom-domain", hostname);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Platform sayfaları — slug olmadan erişilebilir (ama auth kontrollü)
  const isPlatformPath = pathname.startsWith("/suspended") || pathname.startsWith("/api") || pathname.startsWith("/_next");
  
  // ─── SUPER ADMIN AUTH ──────────────────────────────────────
  if (pathname.startsWith("/super-admin") && !pathname.startsWith("/super-admin/login")) {
    const superAdmin = req.cookies.get("super_admin")?.value;
    if (superAdmin !== "true") {
      return NextResponse.redirect(new URL("/super-admin/login", req.url));
    }
    return response;
  }

  if (isPlatformPath) {
    return response;
  }

  const isCustomDomain = hostname !== platformDomain && hostname !== `www.${platformDomain}` && !isLocalhost;

  // Subdomain veya Custom Domain yoksa → platform landing page kuralları
  if (!slug && !isCustomDomain) {
    // Ana domain root (fiibi.co/) → FiibiLanding sayfası gösterilsin
    if (pathname === "/") {
      return response;
    }
    // Diğer sayfalar → ana sayfaya yönlendir
    if (!pathname.startsWith("/admin") && !pathname.startsWith("/login") && !pathname.startsWith("/profile")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // ─── ADMIN AUTH ────────────────────────────────────────────────
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!adminToken) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    try {
      const payload = await verifyAuth(adminToken);
      if (payload.adminId) {
        // Admin auth başarılı — tenant header ile devam
        const reqHeaders = new Headers(req.headers);
        reqHeaders.set("x-next-pathname", pathname);
        if (slug) reqHeaders.set("x-tenant-slug", slug);
        return NextResponse.next({ request: { headers: reqHeaders } });
      }
      return NextResponse.redirect(new URL("/admin/login", req.url));
    } catch (err) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // ─── PROFILE AUTH ──────────────────────────────────────────────
  if (pathname.startsWith("/profile")) {
    if (!userToken) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    try {
      await verifyAuth(userToken);
      const reqHeaders = new Headers(req.headers);
      reqHeaders.set("x-next-pathname", pathname);
      if (slug) reqHeaders.set("x-tenant-slug", slug);
      return NextResponse.next({ request: { headers: reqHeaders } });
    } catch (err) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets/|uploads/).*)",
  ],
};
