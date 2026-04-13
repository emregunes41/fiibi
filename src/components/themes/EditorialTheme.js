"use client";

import Link from "next/link";
import GalleryClient from "@/app/gallery/GalleryClient";
import Image from "next/image";
import { optimizeCloudinaryUrl } from "@/lib/image-utils";
import BannerCarousel from "@/components/BannerCarousel";
import ContentBlockCarousel from "@/components/ContentBlockCarousel";

export default function EditorialTheme({ siteConfig, categories, packages, banners, contentBlocks, preloadUrls, FooterSection }) {
  const accent = siteConfig?.accentColor || "#fff";
  const renderTitle = (text) => text.split('\n').map((line, i) => <span key={i}>{line}{i !== text.split('\n').length - 1 && <br />}</span>);
  const firstCat = categories?.[0];
  const coverUrl = firstCat?.photos?.[0]?.url;

  return (
    <main className="relative min-h-screen w-full">
      {preloadUrls.map((url, i) => <link key={i} rel="preload" as="image" href={url} />)}

      {/* Editorial Hero — sol metin, sağ görsel */}
      <section style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px 5vw 80px 5vw" }}>
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", marginBottom: 20 }}>
            {siteConfig?.heroSubtitle || "Photography Studio"}
          </span>
          <h1 style={{ fontSize: "clamp(2.5rem, 4vw, 4rem)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.1, color: "#fff", marginBottom: 24 }}>
            {renderTitle(siteConfig?.heroTitle || "Anları Sanata\nDönüştürüyoruz")}
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, maxWidth: 360, marginBottom: 32 }}>
            {siteConfig?.footerTagline || "Profesyonel fotoğrafçılık hizmetleri ile en özel anlarınızı ölümsüzleştiriyoruz."}
          </p>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <Link href="/booking" style={{ padding: "12px 24px", background: accent, color: "#000", fontSize: 12, fontWeight: 700, textDecoration: "none", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Randevu Al
            </Link>
            <Link href="#portfolio" style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textDecoration: "none", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Portfolio →
            </Link>
          </div>
        </div>
        <div style={{ position: "relative", overflow: "hidden" }}>
          {coverUrl ? (
            <Image src={optimizeCloudinaryUrl(coverUrl, 1200)} alt="Hero" fill style={{ objectFit: "cover" }} priority />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.03)" }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 30%)" }} />
        </div>
      </section>

      {/* Banner Carousel */}
      {banners && banners.length > 0 && (
        <section className="py-12 pb-8 border-t border-white/5">
          <div className="section-container">
            <BannerCarousel banners={banners} />
          </div>
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

      {/* Portfolyo */}
      <section id="portfolio" style={{ padding: "80px 5vw", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ marginBottom: 48 }}>
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.25em", color: "rgba(255,255,255,0.25)", display: "block", marginBottom: 8 }}>Çalışmalar</span>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>Portfolyo</h2>
        </div>
        <GalleryClient categories={categories} />
      </section>

      {/* Footer */}
      {FooterSection}
    </main>
  );
}
