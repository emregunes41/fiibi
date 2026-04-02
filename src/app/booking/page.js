import { getPackages } from "../admin/core-actions";
import BookingFlow from "@/components/BookingFlow";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const packages = await getPackages();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "transparent",
        paddingTop: "160px",
        paddingBottom: "100px",
        paddingLeft: "24px",
        paddingRight: "24px",
      }}
    >
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        {/* Page header */}
        <div style={{ marginBottom: "56px" }}>
          <Link
            href="/"
            style={{
              display: "inline-block",
              fontSize: "13px",
              color: "rgba(255,255,255,0.45)",
              textDecoration: "none",
              marginBottom: "40px",
              transition: "color 0.2s",
            }}
          >
            ← Ana Sayfa
          </Link>
          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              marginBottom: "12px",
              color: "#fff",
            }}
          >
            Randevunuzu Oluşturun
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.7,
              maxWidth: "480px",
            }}
          >
            Çekim türünüzü, döneminizi ve paketinizi seçerek birkaç dakikada
            randevunuzu tamamlayabilirsiniz.
          </p>
        </div>

        <BookingFlow initialPackages={packages} />
      </div>
    </main>
  );
}
