"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Calendar, Settings, LogOut, Menu, X } from "lucide-react";
import { logoutUser } from "../user-actions";

export default function ProfileLayoutClient({ user, children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const getInitials = (name) => {
    if (!name) return "";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const navItems = [
    { name: "Rezervasyonlarım", href: "/profile", icon: Calendar, exact: true },
    { name: "Ayarlar", href: "/profile/settings", icon: Settings, exact: false },
  ];

  const sidebarContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", paddingBottom: "20px" }}>
      <div style={{ fontWeight: 900, fontSize: "1.5rem", letterSpacing: "-0.04em", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ textDecoration: "none", color: "inherit", position: "relative", zIndex: 10 }}>
          <span>PINOWED.<span style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.1rem" }}>client</span></span>
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden"
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: "4px" }}
        >
          <X size={20} />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "2rem" }}>
        {/* Avatar */}
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{getInitials(user?.name)}</span>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{user?.name}</h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 20 }}>{user?.email}</p>
        
        {/* Stats */}
        <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
            <span style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Randevu</span>
            <span style={{ fontSize: 20, fontWeight: 700 }}>{user?.reservations?.length || 0}</span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
            <span style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Puan</span>
            <span style={{ fontSize: 20, fontWeight: 700 }}>0</span>
          </div>
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1 }}>
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.name} href={item.href} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", borderRadius: "1rem",
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

      {/* Logout */}
      <form action={logoutUser}>
        <button type="submit" style={{ 
          display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", 
          width: "100%", background: "transparent", border: "none", color: "#FF4D4D", 
          fontWeight: 700, cursor: "pointer", borderRadius: "1rem", transition: "all 0.2s",
          marginTop: "auto", textAlign: "left"
        }} className="hover:bg-red-500/10">
          <LogOut size={20} /> Çıkış Yap
        </button>
      </form>
    </div>
  );

  return (
    <div className="pinowed-theme" style={{ display: "flex", minHeight: "100vh", background: "#000", color: "#fff" }}>
      
      {/* Mobile Top Bar */}
      <div className="md:hidden" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "14px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button
          onClick={() => setSidebarOpen(true)}
          style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: "4px" }}
        >
          <Menu size={22} />
        </button>
        <Link href="/" style={{ textDecoration: "none", color: "inherit", fontWeight: 800, fontSize: "0.9rem", letterSpacing: "-0.02em" }}>
          PINOWED<span style={{ color: "rgba(255,255,255,0.45)", fontWeight: 400 }}>.client</span>
        </Link>
        <div style={{ width: "30px" }} /> {/* spacer */}
      </div>

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="md:hidden"
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 105, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        />
      )}

      {/* Desktop Sidebar Background */}
      <div className="hidden md:block" style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: "280px", zIndex: 0, overflow: "hidden", borderRight: "1px solid rgba(255,255,255,0.1)" }}>
         <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.95))", zIndex: 1 }} />
      </div>

      {/* Sidebar Content */}
      <aside
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
        style={{ 
          width: "280px", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 110,
          padding: "2.5rem 1.5rem", display: "flex", flexDirection: "column",
          background: "#000", borderRight: "1px solid rgba(255,255,255,0.08)",
          transition: "transform 0.3s ease", overflowY: "auto",
        }}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar spacer */}
      <div className="hidden md:block" style={{ width: "280px", flexShrink: 0 }} />

      {/* Main Content Area */}
      <main style={{ flex: 1, position: "relative", zIndex: 5, overflowY: "auto", background: "rgba(255,255,255,0.03)", minWidth: 0 }}>
        {/* Mobile top padding */}
        <div className="md:hidden" style={{ height: "76px" }} />
        <div style={{ padding: "clamp(16px, 4vw, 56px)", maxWidth: "1200px", margin: "0 auto", marginTop: "20px" }}>
          {children}
          {/* Mobile Bottom Spacer for Global CTA */}
          <div className="md:hidden" style={{ height: "120px" }} />
        </div>
      </main>

    </div>
  );
}
