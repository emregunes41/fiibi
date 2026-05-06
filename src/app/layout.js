import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import CartWrapper from "@/components/CartWrapper";
import HeroBackground from "@/components/HeroBackground";
import PageTracker from "@/components/PageTracker";
import { getSiteConfig } from "@/app/admin/core-actions";
import { headers } from "next/headers";
import { getPalette } from "@/lib/palettes";
import { getTemplate } from "@/lib/templates";
import { PLATFORM } from "@/lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Platform sayfaları — studio chrome (Navbar, Hero, Cart) gösterilmez
const PLATFORM_PATHS = ["/onboarding", "/super-admin", "/suspended"];

const FONT_MAP = {
  geist: "var(--font-geist-sans), system-ui, sans-serif",
  inter: "'Inter', system-ui, sans-serif",
  playfair: "'Playfair Display', Georgia, serif",
  poppins: "'Poppins', system-ui, sans-serif",
  montserrat: "'Montserrat', system-ui, sans-serif",
  lora: "'Lora', Georgia, serif",
  raleway: "'Raleway', system-ui, sans-serif",
  cormorant: "'Cormorant Garamond', Georgia, serif",
};

const GOOGLE_FONTS = {
  inter: "Inter:wght@300;400;500;600;700;800;900",
  playfair: "Playfair+Display:wght@400;500;600;700;800;900",
  poppins: "Poppins:wght@300;400;500;600;700;800;900",
  montserrat: "Montserrat:wght@300;400;500;600;700;800;900",
  lora: "Lora:wght@400;500;600;700",
  raleway: "Raleway:wght@300;400;500;600;700;800;900",
  cormorant: "Cormorant+Garamond:wght@300;400;500;600;700",
};

export async function generateMetadata() {
  const headersList = await headers();
  const pathname = headersList.get("x-next-pathname") || headersList.get("x-invoke-path") || "";

  if (PLATFORM_PATHS.some(p => pathname.startsWith(p))) {
    return {
      title: `${PLATFORM.name} | Profesyonel CRM Platformu`,
      description: "2 dakikada kendi CRM'inizi kurun. Rezervasyon, ödeme, müşteri yönetimi tek platformda.",
    };
  }

  let siteConfig = null;
  try {
    siteConfig = await getSiteConfig();
  } catch (e) {
    console.error("Metadata getSiteConfig error:", e);
  }
  const businessName = siteConfig?.businessName || "Studio";
  const seoTitle = siteConfig?.seoTitle || businessName;
  const seoDescription = siteConfig?.seoDescription || `${businessName} — Online randevu ve hizmet yönetimi.`;
  
  // Calculate canonical URL
  const host = headersList.get("host") || "fiibi.co";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;
  const canonicalUrl = `${baseUrl}${pathname}`;

  return { 
    title: seoTitle, 
    description: seoDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
      siteName: businessName,
      images: [
        {
          url: siteConfig?.logoUrl || `${baseUrl}/og-image.jpg`, // Fallback resim düşünülebilir
          width: 1200,
          height: 630,
          alt: businessName,
        },
      ],
      locale: "tr_TR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
      images: [siteConfig?.logoUrl || `${baseUrl}/og-image.jpg`],
    },
  };
}

import { LanguageProvider } from "@/components/LanguageContext";

export default async function RootLayout({ children }) {
  const headersList = await headers();
  const pathname = headersList.get("x-next-pathname") || headersList.get("x-invoke-path") || "";
  const isPlatform = PLATFORM_PATHS.some(p => pathname.startsWith(p));

  if (isPlatform) {
    return (
      <html lang="tr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
        <body style={{ margin: 0, background: "#000", color: "#fff", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
          <PageTracker />
          {children}
        </body>
      </html>
    );
  }

  // Tenant kontrolü — fiibi.co ana sayfa mı?
  let currentTenant = null;
  try {
    const { getCurrentTenant } = await import("@/lib/tenant");
    currentTenant = await getCurrentTenant();
  } catch (e) {}

  // fiibi.co ana sayfa — tenant yoksa temiz layout (Navbar/Video/Cart yok)
  if (!currentTenant) {
    return (
      <html lang="tr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
        <head>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap" />
        </head>
        <body style={{ margin: 0, background: "#fff", color: "#1a1a1a", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          <LanguageProvider>
            <PageTracker />
            {children}
          </LanguageProvider>
        </body>
      </html>
    );
  }

  let siteConfig = null;
  try {
    siteConfig = await getSiteConfig();
  } catch (e) {
    console.error("Layout getSiteConfig error:", e);
  }

  const accentColor = siteConfig.accentColor || "#ffffff";
  const fontFamily = siteConfig.fontFamily || "geist";
  const fontCSS = FONT_MAP[fontFamily] || FONT_MAP.geist;
  const googleFontUrl = GOOGLE_FONTS[fontFamily] ? `https://fonts.googleapis.com/css2?family=${GOOGLE_FONTS[fontFamily]}&display=swap` : null;

  // Palette
  const DEFAULT_ASSETS = ["/assets/hero.mp4", "/assets/hero.jpg", ""];
  const SECTOR_TEXTURES = ["photographer","doctor","dentist","psychologist","dietitian","coach","beauty","veterinarian","physiotherapist","tutor","lawyer","consultant","fitness","veterinary"];
  const hasCustomBg = siteConfig.heroBgUrl && siteConfig.heroBgUrl.length > 0 && !DEFAULT_ASSETS.includes(siteConfig.heroBgUrl);
  const businessType = siteConfig._tenant?.businessType || "other";
  const usingSectorTexture = !hasCustomBg && SECTOR_TEXTURES.includes(businessType);

  let palette = getPalette(siteConfig.siteTheme || "dark");
  const forceDark = siteConfig.forceDarkMode === true;
  
  // Sektör texture'ları beyaz arka planlı → otomatik light mode (forceDarkMode kapalıysa)
  if (usingSectorTexture && !forceDark) {
    palette = getPalette("light");
  }

  const tpl = getTemplate(siteConfig.siteTemplate || "classic");

  return (
    <html suppressHydrationWarning
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      {...(!palette.isDark ? { "data-light": "" } : {})}
      data-template={tpl.id}
      style={{
        "--bg": palette.bg,
        "--bg-card": palette.card || palette.bg,
        "--text": palette.text,
        "--text-muted": palette.muted || "rgba(255,255,255,0.45)",
        "--border": palette.border || "rgba(255,255,255,0.08)",
        "--accent": usingSectorTexture ? palette.accent : (accentColor || palette.accent || "#ffffff"),
        "--btn-bg": palette.buttonBg || palette.text,
        "--btn-text": palette.buttonText || palette.bg,
        "--font-site": fontCSS,
        "--radius": `${tpl.radius}px`,
        "--section-spacing": `${tpl.sectionSpacing}px`,
        "--card-padding": `${tpl.cardPadding}px`,
        "--heading-weight": tpl.fontWeight.heading,
        "--body-weight": tpl.fontWeight.body,
        "--hero-title-size": tpl.heroTitleSize,
        "--hero-sub-size": tpl.heroSubSize,
      }}
    >
      <head>
        {googleFontUrl && <link rel="stylesheet" href={googleFontUrl} />}
      </head>
      <body suppressHydrationWarning
        className="min-h-full flex flex-col font-sans"
        style={{ fontFamily: fontCSS, color: palette.text }}
      >
        <LanguageProvider>
          <HeroBackground 
            bgType={siteConfig?.heroBgType || (siteConfig?.heroBgUrl ? "video" : "color")} 
            bgUrl={siteConfig?.heroBgUrl || ""} 
            bgColor={siteConfig?.heroBgColor || palette.bg}
            businessType={siteConfig?._tenant?.businessType || "other"}
            forceDarkMode={forceDark}
          />

          <CartWrapper>
            <PageTracker />
            <Navbar businessName={siteConfig?.businessName || "Studio"} logoUrl={siteConfig?.logoUrl} accentColor={accentColor} />
            {children}
            <div className="md:hidden h-32 shrink-0 w-full" />
            <a 
              href="https://fiibi.co" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{
                display: "block",
                textAlign: "center",
                padding: "20px 16px",
                fontSize: "12px",
                color: "var(--text)",
                opacity: 0.6,
                textDecoration: "none",
                fontWeight: 500,
                borderTop: "1px solid rgba(128,128,128,0.15)",
                width: "100%",
                marginTop: "auto",
                position: "relative",
                zIndex: 40
              }}
            >
              Powered by <span style={{ fontWeight: 800 }}>Fiibi</span>
            </a>
          </CartWrapper>
        </LanguageProvider>
      </body>
    </html>
  );
}
