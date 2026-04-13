"use client";

import Link from "next/link";
import GalleryClient from "@/app/gallery/GalleryClient";
import Image from "next/image";
import { optimizeCloudinaryUrl } from "@/lib/image-utils";
import BannerCarousel from "@/components/BannerCarousel";
import ContentBlockCarousel from "@/components/ContentBlockCarousel";

export default function EditorialTheme({ siteConfig, categories, packages, banners, contentBlocks, preloadUrls, FooterSection }) {
  const accent = siteConfig?.accentColor || "#fff";
  const firstCat = categories?.[0];
  const coverUrl = firstCat?.photos?.[0]?.url;

  return (
    <main className="relative min-h-screen w-full">
      {preloadUrls.map((url, i) => <link key={i} rel="preload" as="image" href={url} />)}

      {/* Hero: bölünmüş layout — sol metin, sağ görsel */}
      <section style={{ minHeight: "100vh", display: "flex" }}>
        {/* Sol panel */}
        <div style={{ flex: "0 0 50%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "120px 60px 80px" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 32 }}>
            {siteConfig?.heroSubtitle || "Photography Studio"}
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 3.5vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.1, color: "#fff", margin: "0 0 24px" }}>
            {(siteConfig?.heroTitle || "Anları Sanata\nDönüştürüyoruz").split('\n').map((l, i, a) => (
              <span key={i}>{l}{i < a.length - 1 && <br />}</span>
            ))}
          </h1>
          <div style={{ width: 40, height: 1, background: accent, opacity: 0.4, marginBottom: 24 }} />
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.8, maxWidth: 340, margin: "0 0 40px" }}>
            {siteConfig?.footerTagline || "Profesyonel fotoğrafçılık hizmetleri."}
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/booking" style={{ padding: "13px 28px", background: "#fff", color: "#000", fontSize: 10, fontWeight: 800, textDecoration: "none", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Randevu Al
            </Link>
            <Link href="#portfolio" style={{ padding: "13px 28px", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 600, textDecoration: "none", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Portfolyo
            </Link>
          </div>
        </div>

        {/* Sağ panel — fotoğraf */}
        <div style={{ flex: "0 0 50%", position: "relative", overflow: "hidden" }}>
          {coverUrl ? (
            <Image src={optimizeCloudinaryUrl(coverUrl, 1200)} alt="Hero" fill style={{ objectFit: "cover" }} priority />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.02)" }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 40%)" }} />
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
                      {block.title && <h3 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "#fff", margin: "0 0 1rem", lineHeight: 1.2 }}>{block.title}</h3>}
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
