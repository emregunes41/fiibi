"use client";

import { ArrowDown } from "lucide-react";
import Link from "next/link";
import GalleryClient from "@/app/gallery/GalleryClient";
import BannerCarousel from "@/components/BannerCarousel";
import ContentBlockCarousel from "@/components/ContentBlockCarousel";

export default function MinimalTheme({ siteConfig, categories, packages, banners, contentBlocks, preloadUrls, FooterSection }) {
  const accent = siteConfig?.accentColor || "#fff";
  const renderTitle = (text) => text.split('\n').map((line, i) => <span key={i}>{line}{i !== text.split('\n').length - 1 && <br />}</span>);

  return (
    <main className="relative min-h-screen w-full">
      {preloadUrls.map((url, i) => <link key={i} rel="preload" as="image" href={url} />)}

      {/* Minimal Hero — küçük, sol hizalı, bol boşluk */}
      <section style={{ minHeight: "70vh", display: "flex", alignItems: "flex-end", padding: "0 5vw 80px" }}>
        <div style={{ maxWidth: 600 }}>
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 16 }}>
            {siteConfig?.heroSubtitle || "Photography"}
          </span>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 300, letterSpacing: "-0.03em", lineHeight: 1.15, color: "#fff", marginBottom: 20 }}>
            {renderTitle(siteConfig?.heroTitle || "Anları Sanata\nDönüştürüyoruz")}
          </h1>
          <div style={{ width: 40, height: 1, background: accent, marginBottom: 20, opacity: 0.6 }} />
          <Link href="#portfolio" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>
            Galeri ↓
          </Link>
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
      <section id="portfolio" style={{ padding: "60px 5vw 80px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <GalleryClient categories={categories} />
      </section>

      {/* Footer */}
      {FooterSection}
    </main>
  );
}
