"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, CalendarDays, LogOut, Users } from "lucide-react";
import { logoutAdmin } from "@/app/admin/actions";

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  // If we are on the login page, don't render the sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Paketler", href: "/admin/packages", icon: Package },
    { name: "Rezervasyonlar", href: "/admin/reservations", icon: CalendarDays },
    { name: "Üyeler", href: "/admin/members", icon: Users },
  ];

  return (
    <div className="pinowed-theme" style={{ display: "flex", minHeight: "100vh", background: "#000", color: "#fff" }}>
      
      {/* Cinematic Static Sidebar Background */}
      <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: "280px", zIndex: 0, overflow: "hidden", borderRight: "1px solid rgba(255,255,255,0.1)" }}>
         <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.95))", zIndex: 1 }} />
      </div>

      {/* Sidebar Content */}
      <aside style={{ 
        width: "280px", position: "relative", zIndex: 10,
        padding: "2.5rem 1.5rem", display: "flex", flexDirection: "column" 
      }}>
        <div style={{ fontWeight: 900, fontSize: "1.75rem", letterSpacing: "-0.04em", marginBottom: "3.5rem", paddingLeft: "0.5rem" }}>
          PINOWED.<span style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.1rem" }}>admin</span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1 }}>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.name} href={item.href} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", borderRadius: "1rem",
                  background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
                  fontWeight: isActive ? 700 : 500,
                  transition: "all 0.2s",
                  border: isActive ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent"
                }} className="hover:bg-white/5">
                  <item.icon size={20} color={isActive ? "#fff" : "rgba(255,255,255,0.4)"} />
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
            fontWeight: 700, cursor: "pointer", borderRadius: "1rem", transition: "all 0.2s",
            marginTop: "auto", textAlign: "left"
          }} className="hover:bg-red-500/10">
            <LogOut size={20} /> Çıkış Yap
          </button>
        </form>
      </aside>

      {/* Main Content Area */}
      <main style={{ 
        flex: 1, padding: "3.5rem", position: "relative", zIndex: 5, overflowY: "auto",
        background: "rgba(255,255,255,0.02)"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {children}
        </div>
      </main>

    </div>
  );
}
