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
      <section id="contact" className="section-container py-32 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="col-span-1 md:col-span-1">
            <h3 className="font-serif text-3xl mb-8 tracking-[0.1em] uppercase">Pinowed.</h3>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              {siteConfig?.address || "Moda, Kadıköy / İstanbul"}
            </p>
          </div>
          
          <div className="flex flex-col gap-6">
            <span className="text-[0.65rem] uppercase tracking-[0.3em] text-white/30">İletişim Kurun</span>
            <a href={`mailto:${siteConfig?.email || "hello@pinowed.com"}`} className="text-xl font-jakarta text-white/80 hover:text-white transition-colors no-underline flex items-center gap-3">
              <Mail size={18} strokeWidth={1.5} /> {siteConfig?.email || "hello@pinowed.com"}
            </a>
            <a href={`tel:${siteConfig?.phone?.replace(/\s/g, '') || "+905550000000"}`} className="text-xl font-jakarta text-white/80 hover:text-white transition-colors no-underline flex items-center gap-3">
              <Phone size={18} strokeWidth={1.5} /> {siteConfig?.phone || "+90 555 000 00 00"}
            </a>
            <a href="https://wa.me/905525244988?text=Merhaba%2C%20bilgi%20almak%20istiyorum." target="_blank" rel="noopener noreferrer" className="text-xl font-jakarta text-white/80 hover:text-white transition-colors no-underline flex items-center gap-3">
              <MessageCircle size={18} strokeWidth={1.5} /> WhatsApp ile Yazın
            </a>
            <a href="https://maps.app.goo.gl/wrrKU2MM3xAdwCEK9" target="_blank" rel="noopener noreferrer" className="text-xl font-jakarta text-white/80 hover:text-white transition-colors no-underline flex items-center gap-3">
              <MapPin size={18} strokeWidth={1.5} /> Yol Tarifi Al
            </a>
          </div>

          <div className="flex flex-col gap-6">
            <span className="text-[0.65rem] uppercase tracking-[0.3em] text-white/30">Takip Edin</span>
            <div className="flex gap-6">
              {siteConfig?.instagram && (
                <a href={siteConfig.instagram} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-full border border-white/5 hover:bg-white hover:text-black transition-all">
                  <Instagram size={20} />
                </a>
              )}
              {siteConfig?.whatsapp && (
                <a href={`https://wa.me/${siteConfig.whatsapp}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-full border border-white/5 hover:bg-white hover:text-black transition-all">
                  <MessageCircle size={20} />
                </a>
              )}
              {!siteConfig?.instagram && !siteConfig?.whatsapp && (
                <p className="text-white/20 text-xs italic">Sosyal medya hesabı eklenmedi.</p>
              )}
            </div>
            <p className="text-xs text-white/20 mt-4 uppercase tracking-widest">© 2026 PINOWED Studio</p>
          </div>
        </div>
      </section>

    </main>
  );
}

