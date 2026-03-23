import { NextResponse } from "next/server";
import { verifyAuth } from "./lib/auth";

export async function middleware(req) {
  const adminToken = req.cookies.get("admin_token")?.value;
  const userToken = req.cookies.get("auth_token")?.value;
  const { pathname } = req.nextUrl;

  // 1. Protect all /admin routes except /admin/login
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!adminToken) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    try {
      const payload = await verifyAuth(adminToken);
      if (payload.adminId) return NextResponse.next();
      return NextResponse.redirect(new URL("/admin/login", req.url));
    } catch (err) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // 2. Protect /profile route
  if (pathname.startsWith("/profile")) {
    if (!userToken) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    try {
      await verifyAuth(userToken);
      return NextResponse.next();
    } catch (err) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*"],
};

