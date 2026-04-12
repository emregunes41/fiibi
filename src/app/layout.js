import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartWrapper from "@/components/CartWrapper";
import HeroBackground from "@/components/HeroBackground";
import { getSiteConfig } from "@/app/admin/core-actions";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata() {
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
  const siteConfig = await getSiteConfig();

  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-white font-sans">
        {/* Dynamic Background */}
        <HeroBackground 
          bgType={siteConfig?.heroBgType || "video"} 
          bgUrl={siteConfig?.heroBgUrl || "/assets/hero.mp4"} 
          bgColor={siteConfig?.heroBgColor || "#000000"} 
        />

        <CartWrapper>
          <Navbar businessName={siteConfig?.businessName || "Studio"} logoUrl={siteConfig?.logoUrl} />
          {children}
          {/* Global Mobile Bottom Spacer for Floating CTA */}
          <div className="md:hidden h-32 shrink-0 w-full" />
        </CartWrapper>
      </body>
    </html>
  );
}
