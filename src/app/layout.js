import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartWrapper from "@/components/CartWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Pinowed Photography | Profesyonel Düğün ve Dış Çekim",
  description: "Anılarınızı ölümsüzleştiren profesyonel fotoğrafçılık hizmetleri. Düğün hikayesi, dış çekim ve daha fazlası.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-white font-sans">
        {/* Global Background Video */}
        <video 
          autoPlay muted loop playsInline 
          className="global-video-bg"
        >
          <source src="/assets/hero.mp4" type="video/mp4" />
        </video>
        <div className="global-video-overlay" />

        <CartWrapper>
          <Navbar />
          {children}
        </CartWrapper>
      </body>
    </html>
  );
}
