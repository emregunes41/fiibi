import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import CartWrapper from "@/components/CartWrapper";
import HeroBackground from "@/components/HeroBackground";
import PageTracker from "@/components/PageTracker";
import { getSiteConfig } from "@/app/admin/core-actions";
import { headers } from "next/headers";
import { getPalette } from "@/lib/palettes";
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

  const siteConfig = await getSiteConfig();
  const businessName = siteConfig?.businessName || "Studio";
  const seoTitle = siteConfig?.seoTitle || businessName;
  const seoDescription = siteConfig?.seoDescription || `${businessName} — Online randevu ve hizmet yönetimi.`;
  
  return { title: seoTitle, description: seoDescription };
}

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

  const siteConfig = await getSiteConfig();
  const accentColor = siteConfig?.accentColor || "#ffffff";
  const fontFamily = siteConfig?.fontFamily || "geist";
  const fontCSS = FONT_MAP[fontFamily] || FONT_MAP.geist;
  const googleFontUrl = GOOGLE_FONTS[fontFamily] ? `https://fonts.googleapis.com/css2?family=${GOOGLE_FONTS[fontFamily]}&display=swap` : null;

  // Palette
  const DEFAULT_ASSETS = ["/assets/hero.mp4", "/assets/hero.jpg", ""];
  const SECTOR_TEXTURES = ["photographer","doctor","dentist","psychologist","dietitian","coach","beauty","veterinarian","physiotherapist","tutor","lawyer","consultant","fitness","veterinary"];
  const hasCustomBg = siteConfig?.heroBgUrl && siteConfig.heroBgUrl.length > 0 && !DEFAULT_ASSETS.includes(siteConfig.heroBgUrl);
  const businessType = siteConfig?._tenant?.businessType || "other";
  const usingSectorTexture = !hasCustomBg && SECTOR_TEXTURES.includes(businessType);

  let palette = getPalette(siteConfig?.siteTheme || "dark");
  const forceDark = siteConfig?.forceDarkMode === true;
  
  // Sektör texture'ları beyaz arka planlı → otomatik light mode (forceDarkMode kapalıysa)
  if (usingSectorTexture && !forceDark) {
    palette = { bg: "#ffffff", text: "#1a1a1a", isDark: false };
  }

  return (
    <html suppressHydrationWarning
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      {...(!palette.isDark ? { "data-light": "" } : {})}
      style={{
        "--bg": palette.bg,
        "--text": palette.text,
        "--accent": usingSectorTexture ? "#1a1a1a" : accentColor,
        "--font-site": fontCSS,
      }}
    >
      <head>
        {googleFontUrl && <link rel="stylesheet" href={googleFontUrl} />}
      </head>
      <body suppressHydrationWarning
        className="min-h-full flex flex-col font-sans"
        style={{ fontFamily: fontCSS, color: palette.text }}
      >
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
        </CartWrapper>
      </body>
    </html>
  );
}
