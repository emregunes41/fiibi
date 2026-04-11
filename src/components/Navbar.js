"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, UserCircle, Menu, X as CloseIcon, ShoppingBag } from "lucide-react";
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
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: scrolled ? "10px 16px" : "24px 16px",
          transition: "padding 0.4s ease",
        }}
      >
        <nav
          style={{
            maxWidth: 1600,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            padding: scrolled ? "12px 28px" : "0 28px",
            borderRadius: 0,
            background: scrolled ? "rgba(0,0,0,0.5)" : "transparent",
            backdropFilter: scrolled ? "blur(20px)" : "none",
            WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
            border: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
            transition: "all 0.4s ease",
          }}
        >
          {/* ── Left: Logo ── */}
          <div style={{ display: "flex", alignItems: "center", flexShrink: 0, zIndex: 10 }}>
            <Link href="/" className="group" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
              <div
                style={{
                  width: 40, height: 40,
                  background: "#fff", color: "#000",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 0, fontFamily: "serif", fontSize: 20,
                  transition: "transform 0.3s",
                }}
                className="group-hover:rotate-12"
              >
                P
              </div>
              <span
                className="hidden sm:block"
                style={{ fontFamily: "serif", fontSize: 24, letterSpacing: "0.2em", color: "#fff", textTransform: "uppercase" }}
              >
                Pinowed
              </span>
            </Link>
          </div>

          {/* ── Center: Navigation Links (Desktop) ── */}
          <div
            className="hidden md:flex"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 10,
              alignItems: "center",
              gap: 6,
            }}
          >
            <Link href="/#portfolio" style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600, color: "rgba(255,255,255,0.5)", textDecoration: "none", padding: "10px 14px", transition: "color 0.3s" }} className="hover:!text-white">Portfolyo</Link>
            <Link href="/#contact" style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600, color: "rgba(255,255,255,0.5)", textDecoration: "none", padding: "10px 14px", transition: "color 0.3s" }} className="hover:!text-white">İletişim</Link>
            <Link
              href="/booking"
              style={{
                fontSize: "0.65rem",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                fontWeight: 700,
                color: "#fff",
                background: "rgba(255,255,255,0.1)",
                padding: "10px 20px",
                borderRadius: 0,
                border: "1px solid rgba(255,255,255,0.2)",
                textDecoration: "none",
                whiteSpace: "nowrap",
                transition: "all 0.3s",
              }}
              className="hover:!bg-white hover:!text-black"
            >
              Rezervasyon
            </Link>
          </div>

          {/* ── Right Section ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0, zIndex: 10 }}>

            {/* Desktop Right Items */}
            <div className="hidden md:flex" style={{ alignItems: "center", gap: 16 }}>
              {/* Cart */}
              <button
                onClick={() => openCart(true)}
                style={{
                  position: "relative",
                  width: 40, height: 40,
                  borderRadius: 0,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
                className="hover:!bg-white/10 hover:!border-white/20 group"
                aria-label="Sepetim"
              >
                <ShoppingBag size={16} style={{ color: "rgba(255,255,255,0.5)" }} className="group-hover:!text-white" />
                {itemCount > 0 && (
                  <span
                    style={{
                      position: "absolute", top: -4, right: -4,
                      minWidth: 18, height: 18,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: 0, fontSize: 10, fontWeight: 700,
                      background: "#fff", color: "#000", padding: "0 4px",
                      animation: "cartBadgePop 0.3s ease",
                    }}
                  >
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Login / Panel */}
              {!loading && (
                user ? (
                  <Link
                    href="/profile"
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.2em",
                      color: "#fff",
                      background: "rgba(255,255,255,0.05)",
                      padding: "10px 20px",
                      borderRadius: 0,
                      border: "1px solid rgba(255,255,255,0.1)",
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                      transition: "all 0.3s",
                    }}
                    className="hover:!bg-white/10"
                  >
                    <UserCircle size={14} /> Panel
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.2em",
                      color: "rgba(255,255,255,0.4)",
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                      transition: "all 0.3s",
                    }}
                    className="hover:!text-white"
                  >
                    <User size={14} /> Müşteri Girişi
                  </Link>
                )
              )}
            </div>

            {/* Mobile Right Items */}
            <div className="flex md:hidden" style={{ alignItems: "center", gap: 10 }}>
              {/* Cart */}
              <button
                onClick={() => openCart(true)}
                style={{
                  position: "relative",
                  width: 40, height: 40,
                  borderRadius: 0,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}
                aria-label="Sepetim"
              >
                <ShoppingBag size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
                {itemCount > 0 && (
                  <span style={{
                    position: "absolute", top: -4, right: -4,
                    minWidth: 18, height: 18,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 0, fontSize: 10, fontWeight: 700,
                    background: "#fff", color: "#000", padding: "0 4px",
                  }}>
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Hamburger */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{ padding: 8, background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}
              >
                {isMenuOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
              </button>
            </div>

          </div>
        </nav>

        {/* ── Mobile Fullscreen Menu ── */}
        {isMenuOpen && (
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 99,
              background: "rgba(0,0,0,0.95)",
              backdropFilter: "blur(40px)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 48,
            }}
            className="animate-in fade-in duration-500"
          >
            <button
              onClick={() => setIsMenuOpen(false)}
              style={{ position: "absolute", top: 32, right: 24, background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
            >
              <CloseIcon size={32} />
            </button>

            <Link href="/booking" onClick={() => setIsMenuOpen(false)} style={{ fontFamily: "serif", fontSize: 30, color: "#fff", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16 }}>
              Online Rezervasyon
            </Link>

            <Link href="/#portfolio" onClick={() => setIsMenuOpen(false)} style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>
              Portfolyo
            </Link>

            <Link href="/#contact" onClick={() => setIsMenuOpen(false)} style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>
              İletişim
            </Link>

            <button
              onClick={() => { setIsMenuOpen(false); openCart(true); }}
              style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,255,255,0.6)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
            >
              <ShoppingBag size={18} /> Sepetim {itemCount > 0 && `(${itemCount})`}
            </button>

            {!loading && !user && (
              <Link href="/login" onClick={() => setIsMenuOpen(false)} style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>
                Müşteri Girişi
              </Link>
            )}
            {user && (
              <Link href="/profile" onClick={() => setIsMenuOpen(false)} style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: "0.3em", color: "#fff", textDecoration: "none" }}>
                Hesabım
              </Link>
            )}
          </div>
        )}
      </header>



      {/* Sticky Mobile CTA - hidden on booking/login/register/profile */}
      {!['/booking', '/login', '/register', '/profile'].some(p => pathname.startsWith(p)) && (
        <div className="md:hidden fixed bottom-8 left-6 right-6 z-[100] animate-in slide-in-from-bottom-10 duration-700">
          <Link
            href="/booking"
            style={{
              width: "100%", height: 56,
              background: "#fff", color: "#000",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
              textDecoration: "none",
              borderRadius: 0,
              boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
              transition: "transform 0.2s",
            }}
            className="active:scale-95"
          >
            <div style={{ width: 6, height: 6, borderRadius: 0, background: "#000", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.3em", fontWeight: 800 }}>
              Online Rezervasyon
            </span>
          </Link>
        </div>
      )}

      {/* Animations */}
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
