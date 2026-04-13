"use client";

import Link from "next/link";
import Image from "next/image";
import { optimizeCloudinaryUrl } from "@/lib/image-utils";
import GalleryClient from "@/app/gallery/GalleryClient";
import BannerCarousel from "@/components/BannerCarousel";
import ContentBlockCarousel from "@/components/ContentBlockCarousel";

export default function BoldTheme({ siteConfig, categories, packages, banners, contentBlocks, preloadUrls, FooterSection }) {
  const accent = siteConfig?.accentColor || "#fff";
  const title = siteConfig?.heroTitle || "Anları Sanata\nDönüştürüyoruz";
  const firstPhoto = categories?.[0]?.photos?.[0]?.url;

  return (
    <main style={{ minHeight: "100vh", width: "100%" }}>
      {preloadUrls.map((url, i) => <link key={i} rel="preload" as="image" href={url} />)}

      {/* ───── HERO: Fotoğraf arka plan + alt kısımda dev başlık ───── */}
      <section style={{ position: "relative", height: "100vh", overflow: "hidden" }}>
        {firstPhoto && (
          <>
            <Image src={optimizeCloudinaryUrl(firstPhoto, 1920)} alt="" fill style={{ objectFit: "cover" }} priority />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.15) 100%)" }} />
          </>
        )}
        <div style={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 5vw 60px" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 16 }}>
            {siteConfig?.heroSubtitle || "Photography"}
          </div>
          <h1 style={{ fontSize: "clamp(3rem, 8vw, 7rem)", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 0.95, color: "#fff", margin: "0 0 24px", textTransform: "uppercase" }}>
            {title.split('\n').map((l, i, a) => (
              <span key={i}>{l}{i < a.length - 1 && <br />}</span>
            ))}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
            <div style={{ width: 60, height: 2, background: accent }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em" }}>{siteConfig?.businessName || "Studio"}</span>
          </div>
          <Link href="/booking" style={{ display: "inline-block", width: "fit-content", padding: "16px 40px", border: `1px solid ${accent}`, color: accent, fontSize: 10, fontWeight: 700, textDecoration: "none", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Randevu Al
          </Link>
        </div>
      </section>

      {/* ───── SAYAÇ ───── */}
      <section style={{ borderTop: `2px solid ${accent}22`, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", maxWidth: 1440, margin: "0 auto" }}>
          {[
            { val: categories?.length || 0, label: "Koleksiyon" },
            { val: packages?.length || 0, label: "Paket" },
            { val: "+500", label: "Mutlu Müşteri" },
            { val: "24/7", label: "Destek" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "32px 20px", textAlign: "center", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.04em", color: accent }}>{s.val}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── BANNER ───── */}
      {banners && banners.length > 0 && (
        <section className="py-12 pb-8 border-t border-white/5">
          <div className="section-container"><BannerCarousel banners={banners} /></div>
        </section>
      )}

      {/* ───── İÇERİK BLOKLARI: Full-width, cesur başlıklar ───── */}
      {contentBlocks && contentBlocks.filter(b => b.isActive).length > 0 && (
        <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {contentBlocks.filter(b => b.isActive).map((block, idx) => (
            <div key={block.id} style={{ padding: "80px 5vw", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: idx % 2 === 0 ? "row" : "row-reverse", gap: "3rem", alignItems: "center", flexWrap: "wrap", maxWidth: 1440, margin: "0 auto" }}>
              {block.imageUrls && block.imageUrls.length > 0 && (
                <div style={{ flex: "1 1 380px", minWidth: 0 }}><ContentBlockCarousel images={block.imageUrls} /></div>
              )}
              {(block.title || block.description) && (
                <div style={{ flex: "1 1 300px", minWidth: 0 }}>
                  {block.title && <h3 style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 900, letterSpacing: "-0.03em", color: "#fff", margin: "0 0 1rem", lineHeight: 1.15, textTransform: "uppercase" }}>{block.title}</h3>}
                  <div style={{ width: 40, height: 2, background: accent, opacity: 0.4, margin: "0 0 16px" }} />
                  {block.description && <p style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,0.4)", margin: 0, whiteSpace: "pre-line" }}>{block.description}</p>}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* ───── PORTFOLYO: Cesur başlık ───── */}
      <section id="portfolio" style={{ padding: "100px 5vw 0" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto 60px" }}>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: 900, letterSpacing: "-0.04em", textTransform: "uppercase", margin: 0 }}>Portfolyo</h2>
          <div style={{ width: 60, height: 3, background: accent, marginTop: 16 }} />
        </div>
      </section>
      <section className="pb-20">
        <div className="section-container overflow-hidden">
          <GalleryClient categories={categories} />
        </div>
      </section>

      {FooterSection}
    </main>
  );
}
