"use client";

import { ArrowDown } from "lucide-react";
import Link from "next/link";
import GalleryClient from "@/app/gallery/GalleryClient";

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

      {/* Portfolyo — 2 sütun temiz grid */}
      <section id="portfolio" style={{ padding: "60px 5vw 80px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <GalleryClient categories={categories} />
      </section>

      {/* Footer */}
      {FooterSection}
    </main>
  );
}
