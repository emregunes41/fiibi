import { getPackages, getSiteConfig } from "./admin/core-actions";
import { getPortfolioCategories } from "./admin/portfolio-actions";
import { getActiveBanners } from "./admin/banner-actions";
import { getContentBlocks } from "./admin/content-actions";
import { getEvents } from "./admin/events/actions";
import { getCurrentTenant } from "@/lib/tenant";
import { getBusinessType } from "@/lib/business-types";
import BookingFlow from "@/components/BookingFlow";
import GalleryClient from "./gallery/GalleryClient";
import FiibiLanding from "@/components/FiibiLanding";
import Image from "next/image";
import Link from "next/link";
import AIChatBot from "@/components/AIChatBot";
import BannerCarousel from "@/components/BannerCarousel";
import ContentBlockCarousel from "@/components/ContentBlockCarousel";
import EventsSection from "@/components/EventsSection";
import ShopStorefront from "@/components/ShopStorefront";
import { prisma } from "@/lib/prisma";
import { optimizeCloudinaryUrl, thumbnailUrl } from "@/lib/image-utils";
import { ArrowDown, Instagram, Mail, Phone, MapPin, MessageCircle, Calendar, Clock, Shield } from "lucide-react";
import { redirect } from "next/navigation";


export const revalidate = 60; // cache for 60 seconds

export default async function HomePage() {
  let tenant = null;
  try {
    tenant = await getCurrentTenant();
  } catch (e) {
    console.error("Tenant detection error:", e);
  }

  // Dondurulmuş veya süresi dolmuş hesap → /suspended sayfasına yönlendir
  if (tenant) {
    const isFrozen = tenant.isFrozen === true;
    const isExpiredTrial = tenant.plan === "trial" && tenant.planExpiresAt && new Date(tenant.planExpiresAt) < new Date();
    if (isFrozen || isExpiredTrial) {
      redirect("/suspended");
    }
  }

  const activeTenantId = tenant?.id || "NONE";

  // fiibi.co ana sayfası — tenant yoksa SaaS landing page göster
  if (!tenant) {
    return <FiibiLanding />;
  }

  let packages = [];
  try {
    packages = await prisma.photographyPackage.findMany({
      where: { tenantId: activeTenantId },
      orderBy: { createdAt: 'desc' }
    });
  } catch (e) { console.error("Packages query error:", e); }

  let categories = [];
  try {
    categories = await prisma.portfolioCategory.findMany({
      where: { tenantId: activeTenantId },
      include: { photos: true },
      orderBy: { createdAt: "asc" }
    }) || [];
  } catch (e) { console.error("Portfolio query error:", e); }

  let siteConfig = null;
  try {
    siteConfig = await prisma.globalSettings.findFirst({
      where: { tenantId: activeTenantId }
    });
  } catch (e) { console.error("SiteConfig query error:", e); }

  let banners = [];
  try {
    banners = await prisma.banner.findMany({
      where: { isActive: true, tenantId: activeTenantId },
      orderBy: { order: "asc" },
    });
  } catch (e) { console.error("Banners query error:", e); }

  let contentBlocks = [];
  try {
    contentBlocks = await prisma.contentBlock.findMany({
      where: { isActive: true, tenantId: activeTenantId },
      orderBy: { order: "asc" },
    });
  } catch (e) { console.error("ContentBlocks query error:", e); }

  let events = [];
  try {
    events = await prisma.event.findMany({
      where: { tenantId: activeTenantId },
      orderBy: { date: "asc" }
    });
  } catch (e) { console.error("Events query error:", e); }

  const upcomingEvents = (events || []).filter(e => e.isActive && new Date(e.date) >= new Date());
  const bt = getBusinessType(tenant?.businessType || "photographer");
  const { features, terms } = bt;

  let products = [];
  try {
    if (tenant) {
      products = await prisma.product.findMany({
        where: { tenantId: tenant.id, isActive: true },
        include: { category: true },
        orderBy: { createdAt: 'desc' }
      });
    }
  } catch (e) { console.error("Products query error:", e); }

  let productCategories = [];
  try {
    if (tenant) {
      productCategories = await prisma.productCategory.findMany({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: 'desc' }
      });
    }
  } catch (e) { console.error("ProductCategories query error:", e); }

  // Hero text: use DB values directly, fallback to sector defaults only if empty
  const heroSubtitle = siteConfig?.heroSubtitle || bt.heroSub;
  const heroTitle = siteConfig?.heroTitle || bt.heroTitle;

  const heroText = "var(--text)";
  const heroAccent = "color-mix(in srgb, var(--text) 40%, transparent)";

  // Helper to render newlines as <br/>
  const renderTitle = (text) => {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i !== text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  // Preload portfolio cover photos
  const preloadUrls = categories.slice(0, 8).map(cat => {
    if (cat.photos && cat.photos.length > 0) return thumbnailUrl(cat.photos[0].url, 600);
    return null;
  }).filter(Boolean);

  // Dynamic hero CTA text & link
  const heroCTA = features.portfolio
    ? { text: "Galeriyi Keşfet", href: "#portfolio" }
    : { text: `${terms.appointment} Al`, href: "/booking" };

  // Default footer tagline based on sector
  const footerTagline = siteConfig?.footerTagline || bt.defaultSlogan;

  // Section ordering
  const DEFAULT_ORDER = ["events", "banners", "content", "portfolio", "services", "shop"];
  let sectionOrder = DEFAULT_ORDER;
  try {
    const saved = siteConfig?.sectionOrder;
    if (saved && Array.isArray(saved) && saved.length > 0) sectionOrder = saved;
  } catch (e) {}
  // Ensure all sections are present (in case new ones were added)
  DEFAULT_ORDER.forEach(s => { if (!sectionOrder.includes(s)) sectionOrder.push(s); });

  const modules = siteConfig || { moduleReservations: true, moduleStore: true, moduleEvents: true };

  // Section renderers
  const sectionRenderers = {
    events: () => (modules.moduleEvents !== false && upcomingEvents.length > 0) ? (
      <section key="events" className="py-12 border-t border-white/5">
        <div className="section-container">
          <EventsSection events={upcomingEvents} />
        </div>
      </section>
    ) : null,

    banners: () => banners && banners.length > 0 ? (
      <section key="banners" className="py-12 pb-8 border-t border-white/5">
        <div className="section-container">
          <BannerCarousel banners={banners} />
        </div>
      </section>
    ) : null,

    content: () => contentBlocks && contentBlocks.filter(b => b.isActive).length > 0 ? (
      <section key="content" className="border-t border-white/5" style={{ paddingTop: 20, paddingBottom: 40 }}>
        <div className="section-container">
          <div style={{ display: "flex", flexDirection: "column", gap: "4rem" }}>
            {contentBlocks.filter(b => b.isActive).map((block, idx) => (
              <div key={block.id} style={{
                display: "flex", flexDirection: idx % 2 === 0 ? "row" : "row-reverse",
                gap: "2.5rem", alignItems: "center",
                flexWrap: "wrap",
              }}>
                {block.imageUrls && block.imageUrls.length > 0 && (
                  <div style={{ flex: "1 1 300px", minWidth: 0 }}>
                    <ContentBlockCarousel images={block.imageUrls} />
                  </div>
                )}
                {(block.title || block.description) && (
                  <div style={{ flex: "1 1 300px", minWidth: 0 }}>
                    {block.title && (
                      <h3 style={{
                        fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 800, letterSpacing: "-0.02em",
                        color: "var(--text)", margin: "0 0 1rem", lineHeight: 1.2,
                        fontFamily: "'Playfair Display', serif",
                      }}>
                        {block.title}
                      </h3>
                    )}
                    {block.description && (
                      <p style={{
                        fontSize: "0.9rem", lineHeight: 1.8, color: "color-mix(in srgb, var(--text) 45%, transparent)",
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
    ) : null,

    portfolio: () => features.portfolio ? (
      <section key="portfolio" id="portfolio" className="py-20 border-t border-white/5">
        <div className="section-container mb-16 overflow-hidden">
          <GalleryClient categories={categories} />
        </div>
      </section>
    ) : null,

    services: () => (!features.categories && modules.moduleReservations !== false && packages.length > 0) ? (
      <section key="services" id="services" className="border-t border-white/5" style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>{terms.services}</div>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 48 }}>
            Sunduğumuz {terms.services}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {packages.map(pkg => (
              <div key={pkg.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "28px 24px" }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{pkg.name}</h3>
                {pkg.description && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: 16 }}>{pkg.description}</p>}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 22, fontWeight: 900 }}>{pkg.price?.toLocaleString("tr-TR")} ₺</span>
                  <Link href="/booking" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", padding: "8px 18px", color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                    {terms.appointment} Al
                  </Link>
                </div>
                {pkg.features && pkg.features.length > 0 && (
                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 6 }}>
                    {pkg.features.map((f, i) => (
                      <span key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>• {f}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link href="/booking" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: "#000", padding: "14px 32px", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
              <Calendar size={16} /> {terms.appointment} Oluştur
            </Link>
          </div>
        </div>
      </section>
    ) : null,

    shop: () => (modules.moduleStore !== false && products.length > 0) ? (
      <section key="shop" id="shop" className="border-t border-white/5" style={{ padding: "80px 24px", background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.01))" }}>
        <div className="section-container">
          <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>MAĞAZA</div>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 48 }}>
            Ürünlerimiz
          </h2>
          <ShopStorefront products={products} categories={productCategories} />
        </div>
      </section>
    ) : null,
  };

  return (
    <main className="relative min-h-screen w-full">
      {preloadUrls.map((url, i) => (
        <link key={i} rel="preload" as="image" href={url} />
      ))}
      
      {/* Hero Section — always first */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <div className="relative z-10 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <span className="text-[0.7rem] uppercase tracking-[0.5em] mb-6 block" style={{ color: heroAccent }}>
            {heroSubtitle}
          </span>
          <h1 className="text-5xl md:text-8xl font-serif mb-8 leading-[1.1] text-justify-balanced" style={{ color: heroText }}>
            {renderTitle(heroTitle)}
          </h1>
          <div className="h-20 w-[1px] mx-auto mb-8 hidden md:block" style={{ background: `linear-gradient(to bottom, ${heroAccent}, transparent)` }} />
          <Link 
            href={heroCTA.href} 
            className="group flex items-center justify-center gap-4 transition-colors no-underline"
            style={{ color: heroText }}
          >
            <span className="text-[0.8rem] uppercase tracking-[0.3em] font-jakarta">{heroCTA.text}</span>
            <div className="w-10 h-10 rounded-none flex items-center justify-center transition-all" style={{ border: `1px solid ${heroAccent}` }}>
              <ArrowDown size={14} className="group-hover:-rotate-45 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* Dynamic Sections — ordered by sectionOrder */}
      {sectionOrder.map(sectionId => {
        const renderer = sectionRenderers[sectionId];
        return renderer ? renderer() : null;
      })}

      {/* Footer — always last */}
      <footer id="contact" className="border-t border-white/[0.06]">
        <div className="section-container py-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8">
            <div className="md:col-span-5">
              <h3 className="font-serif text-4xl md:text-5xl tracking-tight text-white mb-4" style={{ lineHeight: 1.1 }}>
                {siteConfig?.businessName || "Studio"}<span className="text-white/20">.</span>
              </h3>
              <p className="text-white/25 text-[13px] leading-relaxed max-w-[280px]">
                {footerTagline}
              </p>
            </div>
            <div className="md:col-span-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-white/25 mb-5 font-semibold">İletişim</div>
                  <div className="flex flex-col gap-3">
                    <a href={`tel:${(siteConfig?.phone || "").replace(/\s/g, '')}`} className="group text-[13px] text-white/50 hover:text-white transition-all no-underline flex items-center gap-3">
                      <span className="w-8 h-8 rounded-none bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-white/10 transition-all flex-shrink-0"><Phone size={13} strokeWidth={1.5} /></span>
                      {siteConfig?.phone || ""}
                    </a>
                    <a href={`mailto:${siteConfig?.email || ""}`} className="group text-[13px] text-white/50 hover:text-white transition-all no-underline flex items-center gap-3">
                      <span className="w-8 h-8 rounded-none bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-white/10 transition-all flex-shrink-0"><Mail size={13} strokeWidth={1.5} /></span>
                      {siteConfig?.email || ""}
                    </a>
                    {siteConfig?.address && (
                      <div className="text-[13px] text-white/50 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-none bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0"><MapPin size={13} strokeWidth={1.5} /></span>
                        {siteConfig.address}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-white/25 mb-5 font-semibold">Bağlantılar</div>
                  <div className="flex flex-col gap-3">
                    {siteConfig?.whatsapp && (
                      <a href={`https://wa.me/${siteConfig.whatsapp}?text=Merhaba%2C%20bilgi%20almak%20istiyorum.`} target="_blank" rel="noopener noreferrer" className="group text-[13px] text-white/50 hover:text-white transition-all no-underline flex items-center gap-3">
                        <span className="w-8 h-8 rounded-none bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-[#25D366]/20 group-hover:border-[#25D366]/30 transition-all flex-shrink-0"><MessageCircle size={13} strokeWidth={1.5} /></span>
                        WhatsApp
                      </a>
                    )}
                    {siteConfig?.instagram && (
                      <a href={siteConfig.instagram} target="_blank" rel="noopener noreferrer" className="group text-[13px] text-white/50 hover:text-white transition-all no-underline flex items-center gap-3">
                        <span className="w-8 h-8 rounded-none bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-[#E1306C]/20 group-hover:border-[#E1306C]/30 transition-all flex-shrink-0"><Instagram size={13} strokeWidth={1.5} /></span>
                        Instagram
                      </a>
                    )}
                    {siteConfig?.googleMapsUrl && (
                      <a href={siteConfig.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="group text-[13px] text-white/50 hover:text-white transition-all no-underline flex items-center gap-3">
                        <span className="w-8 h-8 rounded-none bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-[#4285F4]/20 group-hover:border-[#4285F4]/30 transition-all flex-shrink-0"><MapPin size={13} strokeWidth={1.5} /></span>
                        Yol Tarifi
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/[0.04]">
          <div className="section-container py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[10px] text-white/20 uppercase tracking-[0.2em]">© {new Date().getFullYear()} {siteConfig?.businessName || "Studio"}</span>
          </div>
        </div>
      </footer>

      {siteConfig?.chatbotEnabled !== false && <AIChatBot />}
    </main>
  );
}
