"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, CalendarDays, LogOut, Book, Users, Image, Menu, X, Settings, Plus, Wallet } from "lucide-react";
import { logoutAdmin } from "@/app/admin/actions";
import { useState, useEffect } from "react";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // If we are on the login page, don't render the sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Paketler", href: "/admin/packages", icon: Package },
    { name: "Albüm Modelleri", href: "/admin/album-models", icon: Book },
    { name: "Rezervasyonlar", href: "/admin/reservations", icon: CalendarDays },
    { name: "Muhasebe", href: "/admin/muhasebe", icon: Wallet },
    { name: "Portfolyo", href: "/admin/portfolio", icon: Image },
    { name: "Üyeler", href: "/admin/members", icon: Users },
    { name: "Ayarlar", href: "/admin/settings", icon: Settings },
  ];

  const sidebarContent = (
    <>
      <div style={{ fontWeight: 900, fontSize: "1.75rem", letterSpacing: "-0.04em", marginBottom: "3.5rem", paddingLeft: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>PINOWED.<span style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.1rem" }}>admin</span></span>
        {/* Close button only on mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden"
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: "4px" }}
        >
          <X size={20} />
        </button>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1 }}>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.name} href={item.href} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", borderRadius: 0,
                background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                color: isActive ? "#fff" : "rgba(255,255,255,0.65)",
                fontWeight: isActive ? 700 : 500,
                transition: "all 0.2s",
                border: isActive ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent"
              }} className="hover:bg-white/5">
                <item.icon size={20} color={isActive ? "#fff" : "rgba(255,255,255,0.5)"} />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Logout via Server Action */}
      <form action={logoutAdmin}>
        <button type="submit" style={{ 
          display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", 
          width: "100%", background: "transparent", border: "none", color: "#FF4D4D", 
          fontWeight: 700, cursor: "pointer", borderRadius: 0, transition: "all 0.2s",
          marginTop: "auto", textAlign: "left"
        }} className="hover:bg-white/80/10">
          <LogOut size={20} /> Çıkış Yap
        </button>
      </form>
    </>
  );

  return (
    <div className="pinowed-theme" style={{ display: "flex", minHeight: "100vh", background: "#000", color: "#fff" }}>
      
      {/* Mobile Top Bar */}
      <div className="md:hidden" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "#000", borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "14px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button
          onClick={() => setSidebarOpen(true)}
          style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: "4px" }}
        >
          <Menu size={22} />
        </button>
        <span style={{ fontWeight: 800, fontSize: "0.9rem", letterSpacing: "-0.02em" }}>
          PINOWED<span style={{ color: "rgba(255,255,255,0.45)", fontWeight: 400 }}>.admin</span>
        </span>
        <div style={{ width: "30px" }} /> {/* spacer */}
      </div>

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="md:hidden"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 55,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* Desktop Sidebar Background */}
      <div className="hidden md:block" style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: "280px", zIndex: 0, overflow: "hidden", borderRight: "1px solid rgba(255,255,255,0.1)" }}>
         <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.95))", zIndex: 1 }} />
      </div>

      {/* Sidebar Content - Desktop: static, Mobile: slide-over */}
      <aside
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
        style={{ 
          width: "280px", 
          position: "fixed",
          top: 0, left: 0, bottom: 0,
          zIndex: 60,
          padding: "2.5rem 1.5rem", 
          display: "flex", flexDirection: "column",
          background: "#000",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          transition: "transform 0.3s ease",
          overflowY: "auto",
        }}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar spacer */}
      <div className="hidden md:block" style={{ width: "280px", flexShrink: 0 }} />

      {/* Main Content Area */}
      <main style={{ 
        flex: 1, 
        position: "relative", overflowY: "auto", overflowX: "hidden",
        background: "rgba(255,255,255,0.03)",
        minWidth: 0, // prevents overflow on mobile
      }}>
        {/* Mobile top padding for the top bar */}
        <div className="md:hidden" style={{ height: "72px" }} />
        <div style={{ padding: "clamp(16px, 4vw, 56px)", maxWidth: "1200px", margin: "0 auto" }}>
          {children}
        </div>
      </main>

    </div>
  );
}
