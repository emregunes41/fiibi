import { ImageResponse } from "next/og";
import { getSiteConfig } from "@/app/admin/core-actions";

export const runtime = "nodejs";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  let logoUrl = null;
  try {
    const config = await getSiteConfig();
    logoUrl = config?.faviconUrl || config?.logoUrl || null;
  } catch (e) {}

  // Logo varsa yuvarlak frame içinde göster
  if (logoUrl) {
    return new ImageResponse(
      (
        <div
          style={{
            width: 64,
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
          }}
        >
          <img
            src={logoUrl}
            width={60}
            height={60}
            style={{
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        </div>
      ),
      { ...size }
    );
  }

  // Logo yoksa işletme adının ilk harfini yuvarlak içinde göster
  let initial = "F";
  try {
    const config = await getSiteConfig();
    initial = (config?.businessName?.charAt(0) || "F").toUpperCase();
  } catch (e) {}

  return new ImageResponse(
    (
      <div
        style={{
          width: 64,
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          background: "#1a1a1a",
          color: "#ffffff",
          fontSize: 34,
          fontWeight: 800,
          fontFamily: "sans-serif",
        }}
      >
        {initial}
      </div>
    ),
    { ...size }
  );
}
