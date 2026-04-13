"use client";

import Link from "next/link";
import Image from "next/image";
import { optimizeCloudinaryUrl } from "@/lib/image-utils";
import GalleryClient from "@/app/gallery/GalleryClient";
import BannerCarousel from "@/components/BannerCarousel";
import ContentBlockCarousel from "@/components/ContentBlockCarousel";
import { useState, useEffect } from "react";

export default function EditorialTheme({ siteConfig, categories, packages, banners, contentBlocks, preloadUrls, FooterSection }) {
  const accent = siteConfig?.accentColor || "#fff";
  const photos = categories?.flatMap(c => (c.photos || []).slice(0, 2)) || [];
  const heroPhotos = photos.slice(0, 4);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (heroPhotos.length <= 1) return;
    const timer = setInterval(() => setCurrentSlide(p => (p + 1) % heroPhotos.length), 5000);
    return () => clearInterval(timer);
  }, [heroPhotos.length]);

  return (
    <main style={{ minHeight: "100vh", width: "100%" }}>
      {preloadUrls.map((url, i) => <link key={i} rel="preload" as="image" href={url} />)}

      {/* ───── HERO: Tam ekran slideshow + sol panel overlay ───── */}
      <section style={{ position: "relative", height: "100vh", overflow: "hidden" }}>
        {/* Slideshow */}
        {heroPhotos.map((photo, idx) => (
          <div key={photo.id || idx} style={{
            position: "absolute", inset: 0,
            opacity: currentSlide === idx ? 1 : 0,
            transition: "opacity 1.5s ease-in-out",
          }}>
            <Image src={optimizeCloudinaryUrl(photo.url, 1920)} alt="" fill style={{ objectFit: "cover" }} priority={idx === 0} />
          </div>
        ))}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.2) 100%)", zIndex: 1 }} />

        {/* Sol overlay metin */}
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "45%", zIndex: 2, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 60px" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 24 }}>
            {siteConfig?.heroSubtitle || "Photography"}
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 3.5vw, 3.2rem)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.12, color: "#fff", margin: "0 0 20px" }}>
            {(siteConfig?.heroTitle || "Anları Sanata\nDönüştürüyoruz").split('\n').map((l, i, a) => (
              <span key={i}>{l}{i < a.length - 1 && <br />}</span>
            ))}
          </h1>
          <div style={{ width: 40, height: 1, background: accent, opacity: 0.5, marginBottom: 16 }} />
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.8, maxWidth: 320, margin: "0 0 32px" }}>
            {siteConfig?.footerTagline || "Profesyonel fotoğrafçılık hizmetleri."}
          </p>
          <Link href="/booking" style={{ display: "inline-block", width: "fit-content", padding: "13px 32px", background: accent, color: "#000", fontSize: 10, fontWeight: 800, textDecoration: "none", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Randevu Al
          </Link>
        </div>

        {/* Slide indicator */}
        {heroPhotos.length > 1 && (
          <div style={{ position: "absolute", bottom: 32, left: 60, zIndex: 3, display: "flex", gap: 8 }}>
            {heroPhotos.map((_, idx) => (
              <button key={idx} onClick={() => setCurrentSlide(idx)} style={{
                width: currentSlide === idx ? 32 : 8, height: 2,
                background: currentSlide === idx ? accent : "rgba(255,255,255,0.2)",
                border: "none", padding: 0, cursor: "pointer",
                transition: "all 0.4s ease",
              }} />
            ))}
          </div>
        )}
      </section>

      {/* ───── HİZMET ŞERIT: Yatay paket kartları ───── */}
      {packages && packages.length > 0 && (
        <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(packages.length, 4)}, 1fr)`, maxWidth: 1440, margin: "0 auto" }}>
            {packages.slice(0, 4).map((pkg, i) => (
              <Link key={pkg.id} href="/booking" style={{ textDecoration: "none", color: "inherit", padding: "28px 24px", borderRight: i < Math.min(packages.length, 4) - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.05em", marginBottom: 4 }}>{pkg.name}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{pkg.basePrice ? `₺${pkg.basePrice.toLocaleString('tr-TR')}` : ""}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ───── BANNER ───── */}
      {banners && banners.length > 0 && (
        <section className="py-12 pb-8 border-t border-white/5">
          <div className="section-container"><BannerCarousel banners={banners} /></div>
        </section>
      )}

      {/* ───── İÇERİK BLOKLARI: Kareler + metin, editorial düzen ───── */}
      {contentBlocks && contentBlocks.filter(b => b.isActive).length > 0 && (
        <section style={{ padding: "60px 5vw 80px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "5rem" }}>
              {contentBlocks.filter(b => b.isActive).map((block, idx) => (
                <div key={block.id} style={{ display: "flex", flexDirection: idx % 2 === 0 ? "row" : "row-reverse", gap: "3rem", alignItems: "center", flexWrap: "wrap" }}>
                  {block.imageUrls && block.imageUrls.length > 0 && (
                    <div style={{ flex: "1 1 340px", minWidth: 0 }}><ContentBlockCarousel images={block.imageUrls} /></div>
                  )}
                  {(block.title || block.description) && (
                    <div style={{ flex: "1 1 300px", minWidth: 0 }}>
                      <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.15)", marginBottom: 16 }}>0{idx + 1}</div>
                      {block.title && <h3 style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "#fff", margin: "0 0 1rem", lineHeight: 1.25 }}>{block.title}</h3>}
                      {block.description && <p style={{ fontSize: 13, lineHeight: 1.9, color: "rgba(255,255,255,0.4)", margin: 0, whiteSpace: "pre-line" }}>{block.description}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───── PORTFOLYO ───── */}
      <section id="portfolio" className="py-20 border-t border-white/5">
        <div className="section-container" style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 8 }}>Koleksiyon</div>
              <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>Portfolyo</h2>
            </div>
            <Link href="/booking" style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 4 }}>
              Hepsini Gör →
            </Link>
          </div>
        </div>
        <div className="section-container overflow-hidden">
          <GalleryClient categories={categories} />
        </div>
      </section>

      {FooterSection}
    </main>
  );
}
