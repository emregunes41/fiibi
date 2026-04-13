"use client";

import Link from "next/link";
import GalleryClient from "@/app/gallery/GalleryClient";
import BannerCarousel from "@/components/BannerCarousel";
import ContentBlockCarousel from "@/components/ContentBlockCarousel";
import Image from "next/image";
import { optimizeCloudinaryUrl, thumbnailUrl } from "@/lib/image-utils";

export default function MinimalTheme({ siteConfig, categories, packages, banners, contentBlocks, preloadUrls, FooterSection }) {
  const accent = siteConfig?.accentColor || "#fff";

  return (
    <main className="relative min-h-screen w-full">
      {preloadUrls.map((url, i) => <link key={i} rel="preload" as="image" href={url} />)}

      {/* Minimal: Hero yok — doğrudan isim + galeri */}
      <section style={{ padding: "180px 5vw 40px", maxWidth: 800 }}>
        <h1 style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", fontWeight: 400, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
          {siteConfig?.businessName || "Studio"}
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.2)", maxWidth: 320, lineHeight: 1.6 }}>
          {siteConfig?.heroSubtitle || "Photography"}
        </p>
      </section>

      {/* İnce çizgi */}
      <div style={{ margin: "0 5vw 60px", height: 1, background: "rgba(255,255,255,0.06)" }} />

      {/* Portfolyo — tek sütun, büyük resimler, çok boşluk */}
      <section id="portfolio" style={{ padding: "0 5vw 80px" }}>
        {categories?.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 80 }}>
            {categories.map((cat, idx) => {
              const photo = cat.photos?.[0]?.url;
              return (
                <Link key={cat.id} href={`/gallery/${cat.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ display: "grid", gridTemplateColumns: idx % 2 === 0 ? "1.5fr 1fr" : "1fr 1.5fr", gap: 40, alignItems: "center" }}>
                    <div style={{ order: idx % 2 === 0 ? 0 : 1 }}>
                      {photo && (
                        <div style={{ position: "relative", width: "100%", paddingBottom: "120%", overflow: "hidden" }}>
                          <Image src={optimizeCloudinaryUrl(photo, 900)} alt={cat.name} fill style={{ objectFit: "cover" }} />
                        </div>
                      )}
                    </div>
                    <div style={{ order: idx % 2 === 0 ? 1 : 0, padding: "0 20px" }}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", letterSpacing: "0.2em", marginBottom: 12, textTransform: "uppercase" }}>
                        {String(idx + 1).padStart(2, "0")}
                      </div>
                      <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 300, letterSpacing: "-0.02em", marginBottom: 12, color: "#fff" }}>
                        {cat.name}
                      </h2>
                      <div style={{ width: 24, height: 1, background: accent, opacity: 0.4, marginBottom: 12 }} />
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                        {cat.photos?.length || 0} fotoğraf →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Content Blocks — tam genişlik, minimalist */}
      {contentBlocks && contentBlocks.filter(b => b.isActive).length > 0 && (
        <section style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          {contentBlocks.filter(b => b.isActive).map((block, idx) => (
            <div key={block.id} style={{ padding: "80px 5vw", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ maxWidth: 600, margin: idx % 2 === 0 ? "0" : "0 0 0 auto" }}>
                {block.title && <h3 style={{ fontSize: 14, fontWeight: 400, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>{block.title}</h3>}
                {block.description && <p style={{ fontSize: 15, lineHeight: 2, color: "rgba(255,255,255,0.35)", margin: 0, whiteSpace: "pre-line" }}>{block.description}</p>}
              </div>
              {block.imageUrls && block.imageUrls.length > 0 && (
                <div style={{ marginTop: 40 }}><ContentBlockCarousel images={block.imageUrls} /></div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Banner — alt kısımda ince */}
      {banners && banners.length > 0 && (
        <section style={{ padding: "40px 5vw", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <BannerCarousel banners={banners} />
        </section>
      )}

      {FooterSection}
    </main>
  );
}
