"use client";

import Link from "next/link";
import GalleryClient from "@/app/gallery/GalleryClient";
import Image from "next/image";
import { optimizeCloudinaryUrl } from "@/lib/image-utils";
import BannerCarousel from "@/components/BannerCarousel";
import ContentBlockCarousel from "@/components/ContentBlockCarousel";

export default function BoldTheme({ siteConfig, categories, packages, banners, contentBlocks, preloadUrls, FooterSection }) {
  const accent = siteConfig?.accentColor || "#fff";
  const title = siteConfig?.heroTitle || "Anları Sanata\nDönüştürüyoruz";
  const firstPhoto = categories?.[0]?.photos?.[0]?.url;

  return (
    <main className="relative min-h-screen w-full">
      {preloadUrls.map((url, i) => <link key={i} rel="preload" as="image" href={url} />)}

      {/* Hero: tam ekran arka plan fotoğraf + üstüne büyük başlık */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 5vw 80px", overflow: "hidden" }}>
        {firstPhoto && (
          <>
            <Image src={optimizeCloudinaryUrl(firstPhoto, 1920)} alt="" fill style={{ objectFit: "cover", zIndex: 0 }} priority />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.2) 100%)", zIndex: 1 }} />
          </>
        )}
        <div style={{ position: "relative", zIndex: 2, maxWidth: 1440 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 20 }}>
            {siteConfig?.heroSubtitle || "Photography"}
          </div>
          <h1 style={{ fontSize: "clamp(3rem, 8vw, 7rem)", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 0.95, color: "#fff", margin: "0 0 32px", textTransform: "uppercase" }}>
            {title.split('\n').map((l, i, a) => (
              <span key={i}>{l}{i < a.length - 1 && <br />}</span>
            ))}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
            <div style={{ width: 60, height: 2, background: accent }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em" }}>
              {siteConfig?.businessName || "Studio"}
            </span>
          </div>
          <Link href="/booking" style={{ display: "inline-block", padding: "15px 36px", border: `1px solid ${accent}`, color: accent, fontSize: 10, fontWeight: 700, textDecoration: "none", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Randevu Al
          </Link>
        </div>
      </section>

      {/* Sayaç çubuğu */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", maxWidth: 1200, margin: "0 auto" }}>
          {[
            { val: categories?.length || 0, label: "Koleksiyon" },
            { val: packages?.length || 0, label: "Paket" },
            { val: "+500", label: "Mutlu Müşteri" },
            { val: "24/7", label: "Destek" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "28px 16px", textAlign: "center", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.03em", color: accent }}>{s.val}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
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
                      {block.title && <h3 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 900, letterSpacing: "-0.02em", color: "#fff", margin: "0 0 1rem", lineHeight: 1.2, textTransform: "uppercase" }}>{block.title}</h3>}
                      {block.description && <p style={{ fontSize: "0.9rem", lineHeight: 1.8, color: "rgba(255,255,255,0.45)", margin: 0, whiteSpace: "pre-line" }}>{block.description}</p>}
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
