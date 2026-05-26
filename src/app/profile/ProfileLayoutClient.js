"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Settings, LogOut, Image as ImageIcon } from "lucide-react";
import { logoutUser } from "../user-actions";

export default function ProfileLayoutClient({ user, children }) {
  const pathname = usePathname();

  const getInitials = (name) => {
    if (!name) return "";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const navItems = [
    { name: "Rezervasyonlarım", href: "/profile", icon: Calendar, exact: true },
    { name: "Fotoğraflarım", href: "/profile/gallery", icon: ImageIcon, exact: false },
    { name: "Ayarlar", href: "/profile/settings", icon: Settings, exact: false },
  ];

  return (
    <div style={{ minHeight: "100vh", position: "relative", zIndex: 40, paddingTop: 80 }}>
      {/* Semi-transparent LIGHT overlay behind content */}
      <div style={{
        position: "fixed", inset: 0, zIndex: -1,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
      }} />

      {/* Sub Navigation Bar */}
      <div style={{
        position: "sticky", top: 80, zIndex: 50,
        background: "rgba(255,255,255,0.7)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        padding: "0 16px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 48 }}>
          {/* Left: Nav Items */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {navItems.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link key={item.name} href={item.href} style={{
                  textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: 6, fontSize: "0.75rem", fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#000" : "rgba(0,0,0,0.45)",
                  background: isActive ? "rgba(0,0,0,0.06)" : "transparent",
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
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(0,0,0,0.65)" }}>{getInitials(user?.name)}</span>
              </div>
              <span className="hidden sm:block" style={{ fontSize: 12, fontWeight: 600, color: "rgba(0,0,0,0.65)" }}>{user?.name}</span>
            </div>
            <form action={logoutUser}>
              <button type="submit" style={{
                display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)",
                borderRadius: 6, color: "rgba(0,0,0,0.6)", fontSize: 11, fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s",
              }}>
                <LogOut size={12} /> Çıkış
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ minHeight: "calc(100vh - 128px)" }}>
        <div style={{ padding: "clamp(16px, 4vw, 56px)", maxWidth: 1200, margin: "0 auto", marginTop: 20 }}>
          {children}
          {/* Mobile Bottom Spacer */}
          <div className="md:hidden" style={{ height: "120px" }} />
        </div>
      </main>
    </div>
  );
}
