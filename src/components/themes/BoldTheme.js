"use client";

import Link from "next/link";
import Image from "next/image";
import { optimizeCloudinaryUrl } from "@/lib/image-utils";
import BannerCarousel from "@/components/BannerCarousel";
import ContentBlockCarousel from "@/components/ContentBlockCarousel";

export default function BoldTheme({ siteConfig, categories, packages, banners, contentBlocks, preloadUrls, FooterSection }) {
  const accent = siteConfig?.accentColor || "#fff";
  const title = siteConfig?.heroTitle || "Anları Sanata\nDönüştürüyoruz";
  const lines = title.split("\n");
  const firstPhoto = categories?.[0]?.photos?.[0]?.url;

  return (
    <main className="relative min-h-screen w-full">
      {preloadUrls.map((url, i) => <link key={i} rel="preload" as="image" href={url} />)}

      {/* Bold Hero — tam ekran fotoğraf, üstüne dev yazı */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "flex-end", padding: "0 5vw 60px", overflow: "hidden" }}>
        {/* Arka plan fotoğraf */}
        {firstPhoto && (
          <>
            <Image src={optimizeCloudinaryUrl(firstPhoto, 1920)} alt="" fill style={{ objectFit: "cover", zIndex: 0 }} priority />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.1) 100%)", zIndex: 1 }} />
          </>
        )}
        <div style={{ position: "relative", zIndex: 2, width: "100%" }}>
          {lines.map((line, i) => (
            <h1 key={i} style={{
              fontSize: "clamp(4rem, 14vw, 12rem)",
              fontWeight: 900, letterSpacing: "-0.06em", lineHeight: 0.9,
              color: "#fff", margin: 0, textTransform: "uppercase",
              mixBlendMode: "difference",
            }}>
              {line}
            </h1>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 24 }}>
            <div style={{ width: 80, height: 2, background: accent }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
              {siteConfig?.heroSubtitle || "Photography"}
            </span>
          </div>
        </div>
      </section>

      {/* Sayaç şeridi */}
      <section style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", maxWidth: 1200, margin: "0 auto" }}>
          {[
            { val: categories?.length || 0, label: "Koleksiyon" },
            { val: packages?.length || 0, label: "Paket" },
            { val: "+500", label: "Mutlu Müşteri" },
            { val: "24/7", label: "Destek" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "36px 20px", textAlign: "center", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.04em", color: accent }}>{s.val}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.15em", marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Banner */}
      {banners && banners.length > 0 && (
        <section className="py-12 border-t border-white/5">
          <div className="section-container"><BannerCarousel banners={banners} /></div>
        </section>
      )}

      {/* Portfolyo — full-width kart, her biri tam genişlik + hover */}
      <section id="portfolio" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ padding: "80px 5vw 40px" }}>
          <h2 style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", fontWeight: 900, letterSpacing: "-0.05em", textTransform: "uppercase", marginBottom: 8 }}>Portfolyo</h2>
          <div style={{ width: 60, height: 3, background: accent, marginBottom: 60 }} />
        </div>
        {categories?.map((cat, idx) => {
          const photo = cat.photos?.[0]?.url;
          return (
            <Link key={cat.id} href={`/gallery/${cat.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
              <div style={{ 
                position: "relative", height: "50vh", minHeight: 350, overflow: "hidden",
                borderTop: "1px solid rgba(255,255,255,0.04)",
                cursor: "pointer",
              }}>
                {photo && <Image src={optimizeCloudinaryUrl(photo, 1600)} alt={cat.name} fill style={{ objectFit: "cover", opacity: 0.4, transition: "all 0.6s" }} />}
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 5vw" }}>
                  <div>
                    <div style={{ fontSize: 64, fontWeight: 900, letterSpacing: "-0.04em", color: "#fff", textTransform: "uppercase", lineHeight: 1 }}>{cat.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", marginTop: 8, textTransform: "uppercase" }}>
                      {cat.photos?.length || 0} fotoğraf — Koleksiyon {String(idx + 1).padStart(2, "0")}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      {/* Content Blocks — bold style: büyük başlıklar */}
      {contentBlocks && contentBlocks.filter(b => b.isActive).length > 0 && (
        <section style={{ padding: "100px 5vw", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 100 }}>
            {contentBlocks.filter(b => b.isActive).map((block, idx) => (
              <div key={block.id}>
                {block.title && (
                  <h3 style={{ fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: 900, letterSpacing: "-0.04em", textTransform: "uppercase", marginBottom: 20, color: "#fff" }}>
                    {block.title}
                  </h3>
                )}
                {block.description && (
                  <p style={{ fontSize: 15, lineHeight: 2, color: "rgba(255,255,255,0.4)", margin: "0 0 32px", maxWidth: 600, whiteSpace: "pre-line" }}>
                    {block.description}
                  </p>
                )}
                {block.imageUrls && block.imageUrls.length > 0 && <ContentBlockCarousel images={block.imageUrls} />}
              </div>
            ))}
          </div>
        </section>
      )}

      {FooterSection}
    </main>
  );
}
