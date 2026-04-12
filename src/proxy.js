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
    // pinowed.localhost:3000 → slug = "pinowed"
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
      // Custom domain
      const response = NextResponse.next();
      response.headers.set("x-custom-domain", hostname);
      return response;
    }
  }

  // Set tenant slug header
  const response = NextResponse.next();
  if (slug) {
    response.headers.set("x-tenant-slug", slug);
  }

  if (pathname.startsWith("/onboarding") || pathname.startsWith("/super-admin") || pathname.startsWith("/suspended")) {
    return response;
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
        const authedResponse = NextResponse.next();
        if (slug) authedResponse.headers.set("x-tenant-slug", slug);
        return authedResponse;
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
      const authedResponse = NextResponse.next();
      if (slug) authedResponse.headers.set("x-tenant-slug", slug);
      return authedResponse;
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
