import { getPackages, getSiteConfig } from "./admin/core-actions";
import { getPortfolioCategories } from "./admin/portfolio-actions";
import BookingFlow from "@/components/BookingFlow";
import GalleryClient from "./gallery/GalleryClient";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, Instagram, Mail, Phone, MapPin, MessageCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function PinowedPage() {
  const packages = await getPackages();
  const portfolioRes = await getPortfolioCategories();
  const categories = portfolioRes.success ? portfolioRes.categories : [];
  const siteConfig = await getSiteConfig();

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
            <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
              <ArrowDown size={14} className="group-hover:-rotate-45 transition-transform" />
            </div>
          </Link>
        </div>
      </section>


      {/* 3. Portfolio Glimpse */}
      <section id="portfolio" className="py-20 border-t border-white/5">
        <div className="section-container mb-16 overflow-hidden">
          <h2 className="text-[0.75rem] uppercase tracking-[0.4em] text-white/40 mb-12 flex items-center gap-4">
            <span className="w-12 h-[1px] bg-white/20" /> Seçili Çalışmalar
          </h2>
          <GalleryClient categories={categories} />
        </div>
      </section>

      {/* 4. Contact Section */}
      <section id="contact" className="section-container py-24 border-t border-white/5">
        <div className="max-w-md mx-auto text-center">
          <h3 className="font-serif text-2xl mb-2 tracking-[0.15em] uppercase">Pinowed.</h3>
          <p className="text-white/30 text-xs mb-10">{siteConfig?.address || "Moda, Kadıköy / İstanbul"}</p>

          <div className="flex flex-col items-center gap-4 mb-10">
            <a href={`tel:${(siteConfig?.phone || "0539 205 20 41").replace(/\s/g, '')}`} className="text-sm text-white/60 hover:text-white transition-colors no-underline flex items-center gap-2">
              <Phone size={14} strokeWidth={1.5} /> {siteConfig?.phone || "0539 205 20 41"}
            </a>
            <a href={`mailto:${siteConfig?.email || "hello@pinowed.com"}`} className="text-sm text-white/60 hover:text-white transition-colors no-underline flex items-center gap-2">
              <Mail size={14} strokeWidth={1.5} /> {siteConfig?.email || "hello@pinowed.com"}
            </a>
          </div>

          <div className="w-8 h-[1px] bg-white/10 mx-auto mb-8" />

          <div className="flex items-center justify-center gap-3 flex-wrap">
            {siteConfig?.whatsapp && (
              <a href={`https://wa.me/${siteConfig.whatsapp}?text=Merhaba%2C%20bilgi%20almak%20istiyorum.`} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.03] text-white/50 text-xs hover:bg-white/10 hover:text-white transition-all no-underline flex items-center gap-2">
                <MessageCircle size={13} /> WhatsApp
              </a>
            )}
            {siteConfig?.instagram && (
              <a href={siteConfig.instagram} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.03] text-white/50 text-xs hover:bg-white/10 hover:text-white transition-all no-underline flex items-center gap-2">
                <Instagram size={13} /> Instagram
              </a>
            )}
            {siteConfig?.googleMapsUrl && (
              <a href={siteConfig.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.03] text-white/50 text-xs hover:bg-white/10 hover:text-white transition-all no-underline flex items-center gap-2">
                <MapPin size={13} /> Yol Tarifi
              </a>
            )}
          </div>

          <p className="text-[10px] text-white/15 mt-12 uppercase tracking-[0.3em]">© 2026 Pinowed Studio</p>
        </div>
      </section>

    </main>
  );
}

