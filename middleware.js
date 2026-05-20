import { NextResponse } from "next/server";

export function middleware(request) {
  // PayTR callback ve API route'larını hiçbir şekilde redirect etme
  // Doğrudan devam ettir
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/paytr/:path*",
    "/api/cron/:path*",
  ],
};
