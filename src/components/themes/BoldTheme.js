"use client";

import Link from "next/link";
import GalleryClient from "@/app/gallery/GalleryClient";

export default function BoldTheme({ siteConfig, categories, packages, banners, contentBlocks, renderTitle, preloadUrls, FooterSection }) {
  const accent = siteConfig?.accentColor || "#fff";
  const title = siteConfig?.heroTitle || "Anları Sanata\nDönüştürüyoruz";
  const lines = title.split("\n");

  return (
    <main className="relative min-h-screen w-full">
      {preloadUrls.map((url, i) => <link key={i} rel="preload" as="image" href={url} />)}

      {/* Bold Hero — dev tipografi */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "120px 5vw 80px" }}>
        <div style={{ marginBottom: 32 }}>
          {lines.map((line, i) => (
            <h1 key={i} style={{
              fontSize: "clamp(3.5rem, 12vw, 10rem)",
              fontWeight: 900,
              letterSpacing: "-0.05em",
              lineHeight: 0.95,
              color: i === 0 ? "#fff" : "rgba(255,255,255,0.15)",
              margin: 0,
              textTransform: "uppercase",
            }}>
              {line}
            </h1>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, paddingLeft: 4 }}>
          <div style={{ width: 60, height: 2, background: accent }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            {siteConfig?.heroSubtitle || "Photography"}
          </span>
        </div>
        <div style={{ marginTop: 48 }}>
          <Link href="/booking" style={{ 
            display: "inline-block", padding: "16px 32px",
            border: `1px solid ${accent}`, color: accent,
            fontSize: 11, fontWeight: 700, textDecoration: "none",
            letterSpacing: "0.2em", textTransform: "uppercase",
            transition: "all 0.3s"
          }}>
            Randevu Al
          </Link>
        </div>
      </section>

      {/* Sayılar şeridi */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
          {[
            { val: categories?.length || 0, label: "Koleksiyon" },
            { val: packages?.length || 0, label: "Paket" },
            { val: "+500", label: "Mutlu Müşteri" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "32px 24px", textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.03em", color: accent }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Portfolyo */}
      <section id="portfolio" style={{ padding: "100px 5vw", }}>
        <div style={{ marginBottom: 64 }}>
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,255,255,0.2)", display: "block", marginBottom: 12 }}>Portfolio</span>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: 900, letterSpacing: "-0.04em", textTransform: "uppercase" }}>Çalışmalar</h2>
        </div>
        <GalleryClient categories={categories} />
      </section>

      {/* Footer */}
      {FooterSection}
    </main>
  );
}
