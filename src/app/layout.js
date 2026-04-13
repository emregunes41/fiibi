import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import CartWrapper from "@/components/CartWrapper";
import HeroBackground from "@/components/HeroBackground";
import PageTracker from "@/components/PageTracker";
import { getSiteConfig } from "@/app/admin/core-actions";
import { headers } from "next/headers";
import { getPalette } from "@/lib/palettes";

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
      title: "Profesyonel Fotoğrafçılık CRM Platformu",
      description: "2 dakikada kendi CRM'inizi kurun. Rezervasyon, ödeme, müşteri yönetimi tek platformda.",
    };
  }

  const siteConfig = await getSiteConfig();
  const businessName = siteConfig?.businessName || "Studio";
  const seoTitle = siteConfig?.seoTitle || `${businessName} | Profesyonel Fotoğrafçılık`;
  const seoDescription = siteConfig?.seoDescription || "Profesyonel fotoğrafçılık hizmetleri.";
  
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
  const palette = getPalette(siteConfig?.siteTheme || "dark");

  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{
        "--bg": palette.bg,
        "--text": palette.text,
        "--accent": accentColor,
        "--font-site": fontCSS,
      }}
    >
      <head>
        {googleFontUrl && <link rel="stylesheet" href={googleFontUrl} />}
      </head>
      <body
        className="min-h-full flex flex-col font-sans"
        style={{ fontFamily: fontCSS, color: palette.text }}
      >
        <HeroBackground 
          bgType={siteConfig?.heroBgType || (siteConfig?.heroBgUrl ? "video" : "color")} 
          bgUrl={siteConfig?.heroBgUrl || ""} 
          bgColor={siteConfig?.heroBgColor || palette.bg} 
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
