"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Settings, LogOut, Home } from "lucide-react";
import { logoutUser } from "../user-actions";

export default function ProfileLayoutClient({ user, children }) {
  const pathname = usePathname();

  const getInitials = (name) => {
    if (!name) return "";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const navItems = [
    { name: "Rezervasyonlarım", href: "/profile", icon: Calendar, exact: true },
    { name: "Ayarlar", href: "/profile/settings", icon: Settings, exact: false },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff" }}>
      {/* Top Bar */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 16px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          {/* Left: Logo */}
          <Link href="/" style={{ textDecoration: "none", color: "inherit", fontWeight: 800, fontSize: "0.9rem", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 8 }}>
            <Home size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
            STUDIO
          </Link>

          {/* Center: Nav Items */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {navItems.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link key={item.name} href={item.href} style={{
                  textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 0, fontSize: "0.72rem", fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
                  background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                  border: isActive ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                  transition: "all 0.2s",
                }}>
                  <item.icon size={13} />
                  <span className="hidden sm:inline">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right: User + Logout */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 0, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{getInitials(user?.name)}</span>
              </div>
              <span className="hidden sm:block" style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{user?.name}</span>
            </div>
            <form action={logoutUser}>
              <button type="submit" style={{
                display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 0, color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s",
              }}>
                <LogOut size={12} /> Çıkış
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ paddingTop: 56, minHeight: "100vh", background: "rgba(255,255,255,0.02)" }}>
        <div style={{ padding: "clamp(16px, 4vw, 56px)", maxWidth: 1200, margin: "0 auto", marginTop: 20 }}>
          {children}
          {/* Mobile Bottom Spacer */}
          <div className="md:hidden" style={{ height: "120px" }} />
        </div>
      </main>
    </div>
  );
}
