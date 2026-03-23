"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  // Don't show anything on admin pages
  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[100] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-black text-2xl tracking-tighter text-white no-underline">
            PINOWED.
          </Link>
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
