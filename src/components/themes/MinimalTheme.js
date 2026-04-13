"use client";

import Link from "next/link";
import Image from "next/image";
import { optimizeCloudinaryUrl, thumbnailUrl } from "@/lib/image-utils";
import GalleryClient from "@/app/gallery/GalleryClient";
import BannerCarousel from "@/components/BannerCarousel";
import ContentBlockCarousel from "@/components/ContentBlockCarousel";

export default function MinimalTheme({ siteConfig, categories, packages, banners, contentBlocks, preloadUrls, FooterSection }) {
  const accent = siteConfig?.accentColor || "#fff";

  return (
    <main style={{ minHeight: "100vh", width: "100%" }}>
      {preloadUrls.map((url, i) => <link key={i} rel="preload" as="image" href={url} />)}

      {/* ───── HERO: Sadece isim, hiçbir şey fazla ───── */}
      <section style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div>
          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", fontWeight: 200, letterSpacing: "0.15em", textTransform: "uppercase", color: "#fff", margin: 0 }}>
            {siteConfig?.businessName || "Studio"}
          </h1>
          <div style={{ width: 1, height: 48, background: "rgba(255,255,255,0.12)", margin: "32px auto" }} />
          <p style={{ fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", margin: 0 }}>
            {siteConfig?.heroSubtitle || "Photography"}
          </p>
        </div>
      </section>

      {/* ───── VİTRİN: Öne çıkan 3 fotoğraf, yatay şerit ───── */}
      {categories && categories.length > 0 && (
        <section style={{ padding: "0 5vw 100px" }}>
          <div style={{ display: "grid", gridTemplateColumns: categories.length >= 3 ? "2fr 1fr 1fr" : "1fr 1fr", gap: 4, height: "70vh", maxHeight: 700 }}>
            {categories.slice(0, 3).map((cat, idx) => {
              const photo = cat.photos?.[0]?.url;
              if (!photo) return null;
              return (
                <Link key={cat.id} href={`/gallery/${cat.id}`} style={{ position: "relative", overflow: "hidden", display: "block", textDecoration: "none" }}>
                  <Image src={optimizeCloudinaryUrl(photo, idx === 0 ? 1200 : 800)} alt={cat.name} fill style={{ objectFit: "cover", transition: "transform 0.8s ease" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 40%)" }} />
                  <div style={{ position: "absolute", bottom: 20, left: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 300, color: "#fff", letterSpacing: "0.05em" }}>{cat.name}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 4 }}>{cat.photos?.length || 0} fotoğraf</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ───── AÇIKLAMA ───── */}
      <section style={{ padding: "80px 5vw", textAlign: "center" }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <div style={{ width: 1, height: 40, background: "rgba(255,255,255,0.08)", margin: "0 auto 32px" }} />
          <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 2, color: "rgba(255,255,255,0.4)", margin: 0 }}>
            {siteConfig?.footerTagline || "Profesyonel fotoğrafçılık hizmetleri ile en özel anlarınızı ölümsüzleştiriyoruz."}
          </p>
          <div style={{ width: 1, height: 40, background: "rgba(255,255,255,0.08)", margin: "32px auto 0" }} />
        </div>
      </section>

      {/* ───── BANNER ───── */}
      {banners && banners.length > 0 && (
        <section style={{ padding: "0 5vw 60px" }}>
          <BannerCarousel banners={banners} />
        </section>
      )}

      {/* ───── İÇERİK BLOKLARI: Minimal — tek sütun, ortalanmış ───── */}
      {contentBlocks && contentBlocks.filter(b => b.isActive).length > 0 && (
        <section style={{ padding: "60px 5vw 80px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            {contentBlocks.filter(b => b.isActive).map((block) => (
              <div key={block.id} style={{ marginBottom: 80, textAlign: "center" }}>
                {block.imageUrls && block.imageUrls.length > 0 && (
                  <div style={{ marginBottom: 32 }}><ContentBlockCarousel images={block.imageUrls} /></div>
                )}
                {block.title && <h3 style={{ fontSize: 18, fontWeight: 300, letterSpacing: "0.1em", color: "#fff", margin: "0 0 16px" }}>{block.title}</h3>}
                {block.description && <p style={{ fontSize: 13, lineHeight: 2, color: "rgba(255,255,255,0.35)", margin: 0, whiteSpace: "pre-line" }}>{block.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ───── PORTFOLYO ───── */}
      <section id="portfolio" style={{ padding: "80px 5vw" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 8 }}>Portfolyo</div>
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)", margin: "0 auto" }} />
        </div>
        <GalleryClient categories={categories} />
      </section>

      {FooterSection}
    </main>
  );
}
