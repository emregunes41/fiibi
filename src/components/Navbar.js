"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, User, UserCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
  }, [pathname]); // Check on every navigation

  // Don't show anything on admin pages
  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[100] px-6 py-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between border-b border-white/5 pb-6 backdrop-blur-xl bg-black/10 rounded-3xl px-8">
          {/* Logo */}
          <Link href="/" className="font-black text-2xl tracking-tighter text-white no-underline hover:opacity-80 transition-opacity flex items-center gap-2">
            <span className="w-8 h-8 bg-white text-black flex items-center justify-center rounded-lg text-lg">P</span>
            PINOWED.
          </Link>

          {/* Dynamic Client Link */}
          {!loading && (
            user ? (
              <Link 
                href="/profile" 
                className="flex items-center gap-2 text-sm font-bold text-white bg-white/10 hover:bg-white/20 transition-all no-underline px-5 py-2.5 rounded-full border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
              >
                <UserCircle size={18} className="text-white/70" /> {user.name.split(' ')[0]} (Panel)
              </Link>
            ) : (
              <Link 
                href="/login" 
                className="flex items-center gap-2 text-sm font-bold text-white/50 hover:text-white transition-colors no-underline px-5 py-2.5 rounded-full border border-white/5 hover:bg-white/5"
              >
                <User size={16} /> Müşteri Girişi
              </Link>
            )
          )}
        </div>
      </header>

      {/* Admin Login Button - Restored to Bottom Right */}
      <div className="fixed bottom-8 right-8 z-50">
        <Link 
          href="/admin/dashboard" 
          className="flex items-center justify-center w-10 h-10 rounded-full border border-white/5 bg-black/20 backdrop-blur-xl hover:bg-white/10 transition-all group active:scale-95 shadow-2xl"
          title="Yönetici Paneli"
        >
          <Lock size={16} className="text-white/20 group-hover:text-white transition-colors" />
        </Link>
      </div>
    </>
  );
}
