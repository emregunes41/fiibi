"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, User, UserCircle, Menu, X as CloseIcon, ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "./CartContext";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { itemCount, setIsOpen: openCart } = useCart();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session');
        const session = await res.json();
        if (session && session.user) {
          setUser(session.user);
        }
      } catch (err) {
        console.error("Session fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, [pathname]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled ? "py-4" : "py-8"}`}>
        <div className={`max-w-[1440px] mx-auto px-6 md:px-12 flex items-center justify-between transition-all duration-500 ${scrolled ? "bg-black/40 backdrop-blur-md py-4 rounded-full border border-white/5 mx-6" : ""}`}>
          
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3 no-underline">
            <div className="w-10 h-10 bg-white text-black flex items-center justify-center rounded-sm font-serif text-xl transition-transform group-hover:rotate-12">
              P
            </div>
            <span className="font-serif text-2xl tracking-[0.2em] text-white hidden sm:block uppercase">Pinowed</span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-10 font-jakarta">
            <Link href="/booking" className="text-[0.7rem] uppercase tracking-[0.3em] font-bold text-white bg-white/10 px-5 py-2.5 rounded-sm border border-white/20 hover:bg-white hover:text-black transition-all no-underline">
              Online Rezervasyon
            </Link>
            <Link href="/#portfolio" className="text-[0.7rem] uppercase tracking-[0.3em] text-white/50 hover:text-white transition-colors no-underline">
              Portfolyo
            </Link>
            <Link href="/#contact" className="text-[0.7rem] uppercase tracking-[0.3em] text-white/50 hover:text-white transition-colors no-underline">
              İletişim
            </Link>

            {/* Cart Icon */}
            <button
              onClick={() => openCart(true)}
              className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
              aria-label="Sepetim"
            >
              <ShoppingBag size={16} className="text-white/50 group-hover:text-white transition-colors" />
              {itemCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold bg-white text-black px-1"
                  style={{ animation: "cartBadgePop 0.3s ease" }}
                >
                  {itemCount}
                </span>
              )}
            </button>

            {!loading && (
              user ? (
                <Link 
                  href="/profile" 
                  className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.2em] text-white bg-white/5 hover:bg-white/10 transition-all no-underline px-6 py-3 rounded-sm border border-white/10"
                >
                  <UserCircle size={14} /> Panel
                </Link>
              ) : (
                <Link 
                  href="/login" 
                  className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors no-underline"
                >
                  <User size={14} /> Müşteri Girişi
                </Link>
              )
            )}
          </nav>

          {/* Mobile Right Section */}
          <div className="flex items-center gap-3 md:hidden">
            {/* Mobile Cart */}
            <button
              onClick={() => openCart(true)}
              className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 transition-all cursor-pointer"
              aria-label="Sepetim"
            >
              <ShoppingBag size={16} className="text-white/50" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold bg-white text-black px-1">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile Toggle */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-white/70 hover:text-white transition-colors"
            >
              {isMenuOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Overlay */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-[99] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-12 animate-in fade-in duration-500">
            <button onClick={() => setIsMenuOpen(false)} className="absolute top-8 right-6 text-white/50 hover:text-white">
              <CloseIcon size={32} />
            </button>
            <Link href="/booking" className="font-serif text-3xl text-white no-underline border-b border-white/10 pb-4 mb-2">Online Rezervasyon</Link>
            <Link href="/#portfolio" className="font-serif text-3xl text-white no-underline">Portfolyo</Link>
            <Link href="/#contact" className="font-serif text-4xl text-white no-underline">İletişim</Link>
            <button
              onClick={() => { setIsMenuOpen(false); openCart(true); }}
              className="font-jakarta text-sm uppercase tracking-[0.3em] text-white/60 no-underline flex items-center gap-3 bg-transparent border-none cursor-pointer"
            >
              <ShoppingBag size={18} /> Sepetim {itemCount > 0 && `(${itemCount})`}
            </button>
            {!loading && !user && (
              <Link href="/login" className="font-jakarta text-sm uppercase tracking-[0.3em] text-white/40 no-underline">Müşteri Girişi</Link>
            )}
            {user && (
              <Link href="/profile" className="font-jakarta text-sm uppercase tracking-[0.3em] text-white no-underline">Hesabım</Link>
            )}
          </div>
        )}
      </header>

      {/* Glassy Admin Button - only on login page */}
      {pathname === "/login" && (
        <div className="fixed bottom-28 md:bottom-10 right-6 md:right-10 z-[100]">
          <Link 
            href="/admin/dashboard" 
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 backdrop-blur-lg border border-white/10 text-white/20 hover:text-white hover:bg-white/10 transition-all hover:scale-110 shadow-2xl"
          >
            <Lock size={16} />
          </Link>
        </div>
      )}
      {/* Sticky Mobile CTA */}
      <div className="md:hidden fixed bottom-8 left-6 right-6 z-[100] animate-in slide-in-from-bottom-10 duration-700">
        <Link 
          href="/booking" 
          className="w-full h-14 bg-white text-black flex items-center justify-center gap-3 no-underline rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.4)] active:scale-95 transition-transform"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
          <span className="text-[0.75rem] uppercase tracking-[0.3em] font-jakarta font-extrabold">Online Rezervasyon</span>
        </Link>
      </div>

      {/* Cart badge animation */}
      <style jsx global>{`
        @keyframes cartBadgePop {
          0% { transform: scale(0.5); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </>
  );
}
