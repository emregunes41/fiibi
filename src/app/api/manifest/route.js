import { getSiteConfig } from "@/app/admin/core-actions";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request) {
  let siteConfig = null;
  try {
    siteConfig = await getSiteConfig();
  } catch (e) {
    console.error("Manifest getSiteConfig error:", e);
  }

  const businessName = siteConfig?.businessName || "Fiibi Yönetim Paneli";
  const logoUrl = siteConfig?.logoUrl || "/fiibi-logo-dark.svg";

  // Check if logoUrl is a cloud URL or absolute path, usually it's from Cloudinary
  // A standard manifest needs valid icon URLs.
  
  const manifest = {
    name: businessName,
    short_name: businessName.substring(0, 12),
    description: `${businessName} Yönetim Sistemi`,
    start_url: "/admin/reservations",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: logoUrl,
        sizes: "any",
        type: logoUrl.endsWith('.svg') ? "image/svg+xml" : "image/png",
        purpose: "any maskable"
      },
      // Keep a fallback Fiibi icon just in case the OS demands a standard square icon
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png"
      }
    ]
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
