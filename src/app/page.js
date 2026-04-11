import { getPackages, getSiteConfig } from "./admin/core-actions";
import { getPortfolioCategories } from "./admin/portfolio-actions";
import { getActiveBanners } from "./admin/banner-actions";
import { getContentBlocks } from "./admin/content-actions";
import BookingFlow from "@/components/BookingFlow";
import GalleryClient from "./gallery/GalleryClient";
import Image from "next/image";
import Link from "next/link";
import AIChatBot from "@/components/AIChatBot";
import BannerCarousel from "@/components/BannerCarousel";
import { optimizeCloudinaryUrl } from "@/lib/image-utils";
import { ArrowDown, Instagram, Mail, Phone, MapPin, MessageCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function PinowedPage() {
  const packages = await getPackages();
  const portfolioRes = await getPortfolioCategories();
  const categories = portfolioRes.success ? portfolioRes.categories : [];
  const siteConfig = await getSiteConfig();
  const banners = await getActiveBanners();
  const contentBlocks = await getContentBlocks();

  // Helper to render newlines as <br/>
  const renderTitle = (text) => {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i !== text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <main className="relative min-h-screen w-full">
      
      {/* 1. Cinematic Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <span className="text-[0.7rem] uppercase tracking-[0.5em] text-white/40 mb-6 block">
            {siteConfig?.heroSubtitle || "Premium Photography Service"}
          </span>
          <h1 className="text-5xl md:text-8xl font-serif text-white mb-8 leading-[1.1] text-justify-balanced">
            {renderTitle(siteConfig?.heroTitle || "Anları Sanata \n Dönüştürüyoruz")}
          </h1>
          <div className="h-20 w-[1px] bg-gradient-to-b from-white/40 to-transparent mx-auto mb-8 hidden md:block" />
          <Link 
            href="#portfolio" 
            className="group flex items-center justify-center gap-4 text-white hover:text-white/70 transition-colors no-underline"
          >
            <span className="text-[0.8rem] uppercase tracking-[0.3em] font-jakarta">Galeriyi Keşfet</span>
            <div className="w-10 h-10 rounded-none border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
              <ArrowDown size={14} className="group-hover:-rotate-45 transition-transform" />
            </div>
          </Link>
        </div>
      </section>


      {/* 2. Banner Carousel */}
      {banners && banners.length > 0 && (
        <section className="py-12 pb-4 border-t border-white/5">
          <div className="section-container">
            <BannerCarousel banners={banners} />
          </div>
        </section>
      )}

      {/* 2.5 Content Blocks */}
      {contentBlocks && contentBlocks.filter(b => b.isActive).length > 0 && (
        <section className="py-16 border-t border-white/5">
          <div className="section-container">
            <div style={{ display: "flex", flexDirection: "column", gap: "4rem" }}>
              {contentBlocks.filter(b => b.isActive).map((block, idx) => (
                <div key={block.id} style={{
                  display: "flex", flexDirection: idx % 2 === 0 ? "row" : "row-reverse",
                  gap: "2.5rem", alignItems: "center",
                  flexWrap: "wrap",
                }}>
                  {block.imageUrl && (
                    <div style={{ flex: "1 1 300px", minWidth: 0 }}>
                      <img
                        src={optimizeCloudinaryUrl(block.imageUrl, { width: 800 })}
                        alt={block.title || ""}
                        style={{ width: "100%", height: "auto", maxHeight: 400, objectFit: "cover", display: "block" }}
                      />
                    </div>
                  )}
                  {(block.title || block.description) && (
                    <div style={{ flex: "1 1 300px", minWidth: 0 }}>
                      {block.title && (
                        <h3 style={{
                          fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 800, letterSpacing: "-0.02em",
                          color: "#fff", margin: "0 0 1rem", lineHeight: 1.2,
                          fontFamily: "'Playfair Display', serif",
                        }}>
                          {block.title}
                        </h3>
                      )}
                      {block.description && (
                        <p style={{
                          fontSize: "0.9rem", lineHeight: 1.8, color: "rgba(255,255,255,0.45)",
                          margin: 0, whiteSpace: "pre-line",
                        }}>
                          {block.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. Portfolio Glimpse */}
      <section id="portfolio" className="py-20 border-t border-white/5">
        <div className="section-container mb-16 overflow-hidden">
          <GalleryClient categories={categories} />
        </div>
      </section>

      {/* 4. Contact & Footer */}
      <footer id="contact" className="border-t border-white/[0.06]">
        {/* Main Footer Content */}
        <div className="section-container py-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8">

            {/* Left — Brand */}
            <div className="md:col-span-5">
              <h3 className="font-serif text-4xl md:text-5xl tracking-tight text-white mb-4" style={{ lineHeight: 1.1 }}>
                Pinowed<span className="text-white/20">.</span>
              </h3>
              <p className="text-white/25 text-[13px] leading-relaxed max-w-[280px]">
                Hayatınızın en özel anlarını, sanatsal bir dokunuşla ölümsüzleştiriyoruz.
              </p>
            </div>

            {/* Right — Contact */}
            <div className="md:col-span-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                
                {/* İletişim */}
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-white/25 mb-5 font-semibold">İletişim</div>
                  <div className="flex flex-col gap-3">
                    <a href={`tel:${(siteConfig?.phone || "0539 205 20 41").replace(/\s/g, '')}`} className="group text-[13px] text-white/50 hover:text-white transition-all no-underline flex items-center gap-3">
                      <span className="w-8 h-8 rounded-none bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-white/10 transition-all flex-shrink-0">
                        <Phone size={13} strokeWidth={1.5} />
                      </span>
                      {siteConfig?.phone || "0539 205 20 41"}
                    </a>
                    <a href={`mailto:${siteConfig?.email || "hello@pinowed.com"}`} className="group text-[13px] text-white/50 hover:text-white transition-all no-underline flex items-center gap-3">
                      <span className="w-8 h-8 rounded-none bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-white/10 transition-all flex-shrink-0">
                        <Mail size={13} strokeWidth={1.5} />
                      </span>
                      {siteConfig?.email || "hello@pinowed.com"}
                    </a>
                    {siteConfig?.address && (
                      <div className="text-[13px] text-white/50 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-none bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                          <MapPin size={13} strokeWidth={1.5} />
                        </span>
                        {siteConfig.address}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bağlantılar */}
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-white/25 mb-5 font-semibold">Bağlantılar</div>
                  <div className="flex flex-col gap-3">
                    {siteConfig?.whatsapp && (
                      <a href={`https://wa.me/${siteConfig.whatsapp}?text=Merhaba%2C%20bilgi%20almak%20istiyorum.`} target="_blank" rel="noopener noreferrer" className="group text-[13px] text-white/50 hover:text-white transition-all no-underline flex items-center gap-3">
                        <span className="w-8 h-8 rounded-none bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-[#25D366]/20 group-hover:border-[#25D366]/30 transition-all flex-shrink-0">
                          <MessageCircle size={13} strokeWidth={1.5} />
                        </span>
                        WhatsApp
                      </a>
                    )}
                    {siteConfig?.instagram && (
                      <a href={siteConfig.instagram} target="_blank" rel="noopener noreferrer" className="group text-[13px] text-white/50 hover:text-white transition-all no-underline flex items-center gap-3">
                        <span className="w-8 h-8 rounded-none bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-[#E1306C]/20 group-hover:border-[#E1306C]/30 transition-all flex-shrink-0">
                          <Instagram size={13} strokeWidth={1.5} />
                        </span>
                        Instagram
                      </a>
                    )}
                    {siteConfig?.googleMapsUrl && (
                      <a href={siteConfig.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="group text-[13px] text-white/50 hover:text-white transition-all no-underline flex items-center gap-3">
                        <span className="w-8 h-8 rounded-none bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-[#4285F4]/20 group-hover:border-[#4285F4]/30 transition-all flex-shrink-0">
                          <MapPin size={13} strokeWidth={1.5} />
                        </span>
                        Yol Tarifi
                      </a>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Copyright Bar */}
        <div className="border-t border-white/[0.04]">
          <div className="section-container py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[10px] text-white/20 uppercase tracking-[0.2em]">© 2026 Pinowed Studio</span>
            <span className="text-[10px] text-white/10 tracking-wider">pinowed.com</span>
          </div>
        </div>
      </footer>

      {/* Floating Chat - sadece anasayfada, settings'den aktifse */}
      {siteConfig?.chatbotEnabled !== false && <AIChatBot />}

    </main>
  );
}

