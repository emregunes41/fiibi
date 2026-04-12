import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import CartWrapper from "@/components/CartWrapper";
import HeroBackground from "@/components/HeroBackground";
import { getSiteConfig } from "@/app/admin/core-actions";
import { headers } from "next/headers";

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

export async function generateMetadata() {
  const headersList = await headers();
  const pathname = headersList.get("x-next-pathname") || headersList.get("x-invoke-path") || "";

  // Platform sayfaları için ayrı metadata
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
  
  return {
    title: seoTitle,
    description: seoDescription,
  };
}

export default async function RootLayout({ children }) {
  const headersList = await headers();
  const pathname = headersList.get("x-next-pathname") || headersList.get("x-invoke-path") || "";
  const isPlatform = PLATFORM_PATHS.some(p => pathname.startsWith(p));

  // Platform sayfaları: temiz, studio chrome'suz layout
  if (isPlatform) {
    return (
      <html
        lang="tr"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body style={{ margin: 0, background: "#000", color: "#fff", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
          {children}
        </body>
      </html>
    );
  }

  // Studio sayfaları: Navbar + Hero + Cart
  const siteConfig = await getSiteConfig();

  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-white font-sans">
        <HeroBackground 
          bgType={siteConfig?.heroBgType || (siteConfig?.heroBgUrl ? "video" : "color")} 
          bgUrl={siteConfig?.heroBgUrl || ""} 
          bgColor={siteConfig?.heroBgColor || "#000000"} 
        />

        <CartWrapper>
          <Navbar businessName={siteConfig?.businessName || "Studio"} logoUrl={siteConfig?.logoUrl} />
          {children}
          <div className="md:hidden h-32 shrink-0 w-full" />
        </CartWrapper>
      </body>
    </html>
  );
}
