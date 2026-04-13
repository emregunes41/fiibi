"use client";

import Link from "next/link";
import GalleryClient from "@/app/gallery/GalleryClient";
import BannerCarousel from "@/components/BannerCarousel";
import ContentBlockCarousel from "@/components/ContentBlockCarousel";

export default function MinimalTheme({ siteConfig, categories, packages, banners, contentBlocks, preloadUrls, FooterSection }) {
  const accent = siteConfig?.accentColor || "#fff";

  return (
    <main className="relative min-h-screen w-full">
      {preloadUrls.map((url, i) => <link key={i} rel="preload" as="image" href={url} />)}

      {/* Hero: kısa, sol hizalı, zarif */}
      <section style={{ minHeight: "60vh", display: "flex", alignItems: "flex-end", padding: "160px 5vw 80px", maxWidth: 1440, margin: "0 auto" }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 20 }}>
            {siteConfig?.heroSubtitle || "Photography"}
          </div>
          <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", fontWeight: 300, letterSpacing: "-0.03em", lineHeight: 1.15, color: "#fff", margin: "0 0 24px" }}>
            {(siteConfig?.heroTitle || "Anları Sanata\nDönüştürüyoruz").split('\n').map((l, i, a) => (
              <span key={i}>{l}{i < a.length - 1 && <br />}</span>
            ))}
          </h1>
          <div style={{ width: 40, height: 1, background: accent, opacity: 0.5, marginBottom: 24 }} />
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", maxWidth: 380, lineHeight: 1.7, margin: "0 0 32px" }}>
            {siteConfig?.footerTagline || "Profesyonel fotoğrafçılık hizmetleri."}
          </p>
          <Link href="#portfolio" style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 4 }}>
            Galeriyi Keşfet ↓
          </Link>
        </div>
      </section>

      {/* Banner */}
      {banners && banners.length > 0 && (
        <section className="py-12 pb-8 border-t border-white/5">
          <div className="section-container"><BannerCarousel banners={banners} /></div>
        </section>
      )}

      {/* Content Blocks */}
      {contentBlocks && contentBlocks.filter(b => b.isActive).length > 0 && (
        <section style={{ paddingTop: 20, paddingBottom: 40, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="section-container">
            <div style={{ display: "flex", flexDirection: "column", gap: "4rem" }}>
              {contentBlocks.filter(b => b.isActive).map((block, idx) => (
                <div key={block.id} style={{ display: "flex", flexDirection: idx % 2 === 0 ? "row" : "row-reverse", gap: "2.5rem", alignItems: "center", flexWrap: "wrap" }}>
                  {block.imageUrls && block.imageUrls.length > 0 && (
                    <div style={{ flex: "1 1 300px", minWidth: 0 }}><ContentBlockCarousel images={block.imageUrls} /></div>
                  )}
                  {(block.title || block.description) && (
                    <div style={{ flex: "1 1 300px", minWidth: 0 }}>
                      {block.title && <h3 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 300, letterSpacing: "-0.01em", color: "#fff", margin: "0 0 1rem", lineHeight: 1.3 }}>{block.title}</h3>}
                      {block.description && <p style={{ fontSize: "0.9rem", lineHeight: 1.8, color: "rgba(255,255,255,0.4)", margin: 0, whiteSpace: "pre-line" }}>{block.description}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Portfolio */}
      <section id="portfolio" className="py-20 border-t border-white/5">
        <div className="section-container mb-16 overflow-hidden">
          <GalleryClient categories={categories} />
        </div>
      </section>

      {FooterSection}
    </main>
  );
}
