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
import { prisma } from "@/lib/prisma";
import { optimizeCloudinaryUrl, thumbnailUrl } from "@/lib/image-utils";
import { ArrowDown, Instagram, Mail, Phone, MapPin, MessageCircle, Calendar, Clock, Shield } from "lucide-react";
import { redirect } from "next/navigation";
import { getTemplate } from "@/lib/templates";


export const dynamic = 'force-dynamic';

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

  let posts = [];
  try {
    posts = await prisma.post.findMany({
      where: { tenantId: activeTenantId, isPublished: true },
      orderBy: { publishedAt: "desc" }
    });
  } catch (e) { console.error("Posts query error:", e); }

  const upcomingEvents = (events || []).filter(e => e.isActive && new Date(e.date) >= new Date());
  const bt = getBusinessType(tenant?.businessType || "photographer");
  const { features, terms } = bt;

  // Hero text: use DB values directly, fallback to sector defaults only if empty
  const heroSubtitle = siteConfig?.heroSubtitle || bt.heroSub;
  const heroTitle = siteConfig?.heroTitle || bt.heroTitle;

  const heroText = "var(--text)";
  const heroAccent = "color-mix(in srgb, var(--text) 40%, transparent)";
  const tpl = getTemplate(siteConfig?.siteTemplate || "classic");

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
  const heroCTA = { text: `Şimdi ${terms.appointment} Oluştur`, href: "/booking" };

  // Default footer tagline based on sector
  const footerTagline = siteConfig?.footerTagline || bt.defaultSlogan;

  // Section ordering
  const DEFAULT_ORDER = ["events", "banners", "content", "portfolio", "blog", "services"];
  let sectionOrder = DEFAULT_ORDER;
  try {
    const saved = siteConfig?.sectionOrder;
    if (saved && Array.isArray(saved) && saved.length > 0) sectionOrder = saved;
  } catch (e) {}
  // Ensure all sections are present (in case new ones were added)
  DEFAULT_ORDER.forEach(s => { if (!sectionOrder.includes(s)) sectionOrder.push(s); });

  const modules = siteConfig || { moduleReservations: true, moduleEvents: true };

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

    blog: () => posts.length > 0 ? (
      <section key="blog" id="blog" className="py-20 border-t border-white/5">
        <div className="section-container">
          <div style={{ marginBottom: "3rem", textAlign: "center" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>BLOG & HABERLER</div>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 8px 0" }}>
              Güncel Yazılar
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", margin: 0 }}>Sektörel haberler ve faydalı ipuçları</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 24 }}>
            {posts.map(post => (
              <Link key={post.id} href={`/blog/${post.slug}`} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", textDecoration: "none", color: "var(--text)", display: "flex", flexDirection: "column", transition: "transform 0.3s, border-color 0.3s", width: "100%", maxWidth: "350px", flex: "1 1 300px" }} className="hover:border-white/20 hover:-translate-y-1">
                {post.imageUrl ? (
                  <div style={{ width: "100%", height: 200, overflow: "hidden" }}>
                    <img src={post.imageUrl} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ) : (
                  <div style={{ width: "100%", height: 200, background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 40, opacity: 0.1 }}>📝</span>
                  </div>
                )}
                <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
                  <div suppressHydrationWarning style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <Calendar size={12} />
                    {new Date(post.publishedAt || post.createdAt).toLocaleDateString("tr-TR", { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 12px 0", lineHeight: 1.3 }}>{post.title}</h3>
                  {post.excerpt && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "0 0 20px 0", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", flex: 1 }}>{post.excerpt}</p>}
                  <div style={{ marginTop: "auto", fontSize: 13, fontWeight: 700, color: "var(--accent)", display: "flex", alignItems: "center", gap: 4 }}>
                    Devamını Oku <span style={{ fontSize: 16 }}>&rarr;</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    ) : null,

    services: () => (!features.categories && modules.moduleReservations !== false && packages.length > 0) ? (
      <section key="services" id="services" className={tpl.sectionBorder ? "border-t border-white/5" : ""} style={{ padding: `var(--section-spacing) 24px` }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>{terms.services}</div>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: "var(--heading-weight)", letterSpacing: "-0.03em", marginBottom: 48 }}>
            Sunduğumuz {terms.services}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: tpl.cardStyle === "editorial" ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))", gap: tpl.radius > 10 ? 16 : 12 }}>
            {packages.map(pkg => (
              <div key={pkg.id} style={{
                background: tpl.cardStyle === "glass" ? "rgba(255,255,255,0.03)" : tpl.cardStyle === "elevated" ? "var(--bg-card)" : "rgba(255,255,255,0.02)",
                border: tpl.cardStyle === "glass" ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.06)",
                padding: `var(--card-padding)`,
                borderRadius: `var(--radius)`,
                backdropFilter: tpl.cardStyle === "glass" ? "blur(20px)" : "none",
                boxShadow: tpl.cardStyle === "elevated" ? "0 4px 20px rgba(0,0,0,0.15)" : "none",
                display: tpl.cardStyle === "editorial" ? "flex" : "block",
                gap: tpl.cardStyle === "editorial" ? 24 : 0,
                alignItems: tpl.cardStyle === "editorial" ? "center" : "stretch",
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 17, fontWeight: "var(--heading-weight)", marginBottom: 8 }}>{pkg.name}</h3>
                  {pkg.description && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: 16 }}>{pkg.description}</p>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 22, fontWeight: 900 }}>{pkg.price?.toLocaleString("tr-TR")} ₺</span>
                  <Link href="/booking" style={{
                    background: tpl.buttonStyle === "outline" ? "transparent" : tpl.buttonStyle === "pill" ? "var(--accent)" : "rgba(255,255,255,0.08)",
                    border: tpl.buttonStyle === "outline" ? "1px solid rgba(255,255,255,0.3)" : tpl.buttonStyle === "text" ? "none" : "1px solid rgba(255,255,255,0.12)",
                    padding: tpl.buttonStyle === "pill" ? "8px 22px" : "8px 18px",
                    color: tpl.buttonStyle === "pill" ? "var(--btn-text)" : "#fff",
                    fontSize: 12, fontWeight: 700, textDecoration: tpl.buttonStyle === "text" ? "underline" : "none",
                    borderRadius: tpl.buttonStyle === "pill" ? 999 : tpl.buttonStyle === "rounded" ? 8 : `var(--radius)`,
                  }}>
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
            <Link href="/booking" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: tpl.buttonStyle === "outline" ? "transparent" : "var(--btn-bg)",
              color: tpl.buttonStyle === "outline" ? "var(--text)" : "var(--btn-text)",
              border: tpl.buttonStyle === "outline" ? "2px solid var(--text)" : "none",
              padding: tpl.buttonStyle === "pill" ? "14px 36px" : "14px 32px",
              fontWeight: 700, fontSize: 14, textDecoration: "none",
              borderRadius: tpl.buttonStyle === "pill" ? 999 : tpl.buttonStyle === "rounded" ? 12 : `var(--radius)`,
            }}>
              <Calendar size={16} /> {terms.appointment} Oluştur
            </Link>
          </div>
        </div>
      </section>
    ) : null,
  };

  return (
    <main className="relative min-h-screen w-full">
      {preloadUrls.map((url, i) => (
        <link key={i} rel="preload" as="image" href={url} />
      ))}
      
      {/* Hero Section */}
      <section className={`relative flex flex-col items-center justify-center text-center px-6 overflow-hidden ${tpl.heroStyle === "cinematic" ? "min-h-screen" : tpl.heroStyle === "centered" ? "min-h-[80vh]" : tpl.heroStyle === "playful" ? "min-h-[70vh]" : "h-screen"}`}>
        <div className={`relative z-10 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000 ${tpl.heroStyle === "editorial" ? "text-left ml-0 mr-auto pl-4" : ""}`}>
          <span className="uppercase mb-6 block" style={{ color: heroAccent, fontSize: "var(--hero-sub-size)", letterSpacing: tpl.heroStyle === "magazine" ? "0.25em" : "0.5em", fontWeight: "var(--body-weight)" }}>
            {heroSubtitle}
          </span>
          <h1 className="font-serif mb-8 leading-[1.1] text-justify-balanced" style={{ color: heroText, fontSize: "var(--hero-title-size)", fontWeight: "var(--heading-weight)", letterSpacing: tpl.heroStyle === "cinematic" ? "-0.04em" : "-0.02em" }}>
            {renderTitle(heroTitle)}
          </h1>
          {tpl.showDividerLine && <div className="h-20 w-[1px] mx-auto mb-8 hidden md:block" style={{ background: `linear-gradient(to bottom, ${heroAccent}, transparent)` }} />}
          <Link 
            href={heroCTA.href} 
            className="group flex items-center justify-center gap-4 transition-colors no-underline"
            style={{ color: heroText }}
          >
            <span className="uppercase font-jakarta" style={{ fontSize: "0.8rem", letterSpacing: "0.3em" }}>{heroCTA.text}</span>
            <div className="w-10 h-10 flex items-center justify-center transition-all" style={{ border: `1px solid ${heroAccent}`, borderRadius: `var(--radius)` }}>
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
      <footer id="contact" className={`mt-16 ${tpl.sectionBorder ? "border-t border-white/[0.06]" : ""}`} style={{ background: tpl.footerStyle === "fun" ? "var(--bg-card)" : "transparent" }}>
        <div className="section-container py-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8">
            <div className={`md:col-span-5 ${tpl.footerStyle === "centered" ? "md:col-span-12 text-center flex flex-col items-center" : ""}`}>
              <h3 className="font-serif text-4xl md:text-5xl tracking-tight text-white mb-4" style={{ lineHeight: 1.1 }}>
                {siteConfig?.businessName || "Studio"}<span className="text-white/20">.</span>
              </h3>
              <p className={`text-white/25 text-[13px] leading-relaxed max-w-[280px] ${tpl.footerStyle === "centered" ? "text-center" : ""}`}>
                {footerTagline}
              </p>
            </div>
            <div className={`md:col-span-7 ${tpl.footerStyle === "centered" ? "md:col-span-12 flex justify-center w-full mt-8" : ""}`}>
              {siteConfig?.showContactOnHome !== false && (
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-10 ${tpl.footerStyle === "centered" ? "w-full max-w-lg" : ""}`}>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-white/25 mb-5 font-semibold">İletişim</div>
                  <div className="flex flex-col gap-3">
                    {siteConfig?.showPhoneOnHome !== false && (
                      <a href={`tel:${(siteConfig?.phone || "").replace(/\s/g, '')}`} className="group text-[13px] text-white/50 hover:text-white transition-all no-underline flex items-center gap-3">
                        <span className="w-8 h-8 flex items-center justify-center group-hover:bg-white/10 transition-all flex-shrink-0" style={{ borderRadius: `var(--radius)`, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}><Phone size={13} strokeWidth={1.5} /></span>
                        {siteConfig?.phone || ""}
                      </a>
                    )}
                    {siteConfig?.showEmailOnHome !== false && (
                      <a href={`mailto:${siteConfig?.email || ""}`} className="group text-[13px] text-white/50 hover:text-white transition-all no-underline flex items-center gap-3">
                        <span className="w-8 h-8 flex items-center justify-center group-hover:bg-white/10 transition-all flex-shrink-0" style={{ borderRadius: `var(--radius)`, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}><Mail size={13} strokeWidth={1.5} /></span>
                        {siteConfig?.email || ""}
                      </a>
                    )}
                    {siteConfig?.showAddressOnHome !== false && siteConfig?.address && (
                      <div className="text-[13px] text-white/50 flex items-center gap-3">
                        <span className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ borderRadius: `var(--radius)`, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}><MapPin size={13} strokeWidth={1.5} /></span>
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
                        <span className="w-8 h-8 flex items-center justify-center group-hover:bg-[#25D366]/20 group-hover:border-[#25D366]/30 transition-all flex-shrink-0" style={{ borderRadius: `var(--radius)`, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}><MessageCircle size={13} strokeWidth={1.5} /></span>
                        WhatsApp
                      </a>
                    )}
                    {siteConfig?.instagram && (
                      <a href={siteConfig.instagram} target="_blank" rel="noopener noreferrer" className="group text-[13px] text-white/50 hover:text-white transition-all no-underline flex items-center gap-3">
                        <span className="w-8 h-8 flex items-center justify-center group-hover:bg-[#E1306C]/20 group-hover:border-[#E1306C]/30 transition-all flex-shrink-0" style={{ borderRadius: `var(--radius)`, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}><Instagram size={13} strokeWidth={1.5} /></span>
                        Instagram
                      </a>
                    )}
                    {siteConfig?.googleMapsUrl && (
                      <a href={siteConfig.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="group text-[13px] text-white/50 hover:text-white transition-all no-underline flex items-center gap-3">
                        <span className="w-8 h-8 flex items-center justify-center group-hover:bg-[#4285F4]/20 group-hover:border-[#4285F4]/30 transition-all flex-shrink-0" style={{ borderRadius: `var(--radius)`, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}><MapPin size={13} strokeWidth={1.5} /></span>
                        Yol Tarifi
                      </a>
                    )}
                  </div>
                </div>
              </div>
              )}
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
