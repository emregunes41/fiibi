"use client";

import Link from "next/link";
import GalleryClient from "@/app/gallery/GalleryClient";
import Image from "next/image";
import { optimizeCloudinaryUrl } from "@/lib/image-utils";
import BannerCarousel from "@/components/BannerCarousel";
import ContentBlockCarousel from "@/components/ContentBlockCarousel";
import { useRef } from "react";

export default function EditorialTheme({ siteConfig, categories, packages, banners, contentBlocks, preloadUrls, FooterSection }) {
  const accent = siteConfig?.accentColor || "#fff";
  const scrollRef = useRef(null);

  const firstCat = categories?.[0];
  const coverUrl = firstCat?.photos?.[0]?.url;

  return (
    <main className="relative min-h-screen w-full">
      {preloadUrls.map((url, i) => <link key={i} rel="preload" as="image" href={url} />)}

      {/* Editorial Hero — bölünmüş: sol metin, sağ fotoğraf */}
      <section style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "120px 60px 80px" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 24 }}>
            Sayı 01 — {new Date().getFullYear()}
          </div>
          <h1 style={{ fontSize: "clamp(2.5rem, 4vw, 4rem)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.08, color: "#fff", marginBottom: 24 }}>
            {(siteConfig?.heroTitle || "Anları Sanata\nDönüştürüyoruz").split('\n').map((l, i) => <span key={i}>{l}{i === 0 && <br />}</span>)}
          </h1>
          <div style={{ width: 50, height: 1, background: accent, marginBottom: 24, opacity: 0.5 }} />
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.8, maxWidth: 320, marginBottom: 40 }}>
            {siteConfig?.footerTagline || "Profesyonel fotoğrafçılık hizmetleri."}
          </p>
          <div style={{ display: "flex", gap: 16 }}>
            <Link href="/booking" style={{ padding: "12px 28px", background: "#fff", color: "#000", fontSize: 10, fontWeight: 800, textDecoration: "none", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Randevu
            </Link>
            <Link href="#portfolio" style={{ padding: "12px 28px", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 700, textDecoration: "none", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Portfolyo
            </Link>
          </div>
        </div>
        <div style={{ position: "relative", overflow: "hidden" }}>
          {coverUrl ? (
            <Image src={optimizeCloudinaryUrl(coverUrl, 1200)} alt="Hero" fill style={{ objectFit: "cover" }} priority />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.02)" }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 40%)" }} />
          <div style={{ position: "absolute", bottom: 30, left: 30, fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            {firstCat?.name || ""}
          </div>
        </div>
      </section>

      {/* Banner */}
      {banners && banners.length > 0 && (
        <section className="py-12 border-t border-white/5">
          <div className="section-container"><BannerCarousel banners={banners} /></div>
        </section>
      )}

      {/* Content Blocks — dergi sayfası stili: numara + başlık + açıklama */}
      {contentBlocks && contentBlocks.filter(b => b.isActive).length > 0 && (
        <section style={{ padding: "60px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {contentBlocks.filter(b => b.isActive).map((block, idx) => (
            <div key={block.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.04)", minHeight: 300 }}>
              {/* Sol: numara */}
              <div style={{ borderRight: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 32, fontWeight: 200, color: "rgba(255,255,255,0.08)" }}>{String(idx + 1).padStart(2, "0")}</span>
              </div>
              {/* Orta: metin */}
              <div style={{ padding: "40px 32px", display: "flex", flexDirection: "column", justifyContent: "center", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
                {block.title && <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 12, color: "#fff" }}>{block.title}</h3>}
                {block.description && <p style={{ fontSize: 13, lineHeight: 1.8, color: "rgba(255,255,255,0.4)", margin: 0, whiteSpace: "pre-line" }}>{block.description}</p>}
              </div>
              {/* Sağ: görsel */}
              <div style={{ position: "relative", overflow: "hidden" }}>
                {block.imageUrls?.[0] ? (
                  <Image src={optimizeCloudinaryUrl(block.imageUrls[0], 800)} alt={block.title || ""} fill style={{ objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.02)" }} />
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Portfolyo — yatay scroll galeri */}
      <section id="portfolio" style={{ padding: "80px 0 80px 5vw", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40, paddingRight: "5vw" }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 8 }}>Koleksiyon</div>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>Portfolyo</h2>
          </div>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em" }}>KAYDIR →</span>
        </div>
        <div ref={scrollRef} style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 20, scrollbarWidth: "none" }}>
          {categories?.map(cat => {
            const photo = cat.photos?.[0]?.url;
            return (
              <Link key={cat.id} href={`/gallery/${cat.id}`} style={{ flexShrink: 0, width: 320, textDecoration: "none", color: "inherit" }}>
                {photo && (
                  <div style={{ position: "relative", width: 320, height: 420, overflow: "hidden", marginBottom: 12 }}>
                    <Image src={optimizeCloudinaryUrl(photo, 700)} alt={cat.name} fill style={{ objectFit: "cover", transition: "transform 0.5s" }} />
                  </div>
                )}
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{cat.name}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{cat.photos?.length || 0} fotoğraf</div>
              </Link>
            );
          })}
          <div style={{ flexShrink: 0, width: 100 }} />
        </div>
      </section>

      {FooterSection}
    </main>
  );
}
