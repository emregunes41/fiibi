"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, CalendarDays, LogOut, Book, Users, Image, Menu, X, Settings, Plus, Wallet, Crown, AlertTriangle, Gift, Ticket, ShoppingBag, Box, ChevronRight } from "lucide-react";
import { logoutAdmin } from "@/app/admin/actions";
import { useState, useEffect } from "react";
import { getBusinessType } from "@/lib/business-types";
import { AdminSessionProvider, useAdminSession } from "./AdminSessionContext";

export default function AdminLayout({ children }) {
  return (
    <AdminSessionProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminSessionProvider>
  );
}

function AdminLayoutInner({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { session, loading: sessionLoading } = useAdminSession();

  const brandName = (session?.tenant?.businessName || "STUDIO").toUpperCase();
  const businessType = session?.tenant?.businessType || null;
  const trialDays = (session?.tenant?.planExpiresAt && session?.tenant?.plan === "trial")
    ? Math.max(0, Math.ceil((new Date(session.tenant.planExpiresAt) - new Date()) / (1000*60*60*24)))
    : null;

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // If we are on the login page, don't render the sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Wait for session before rendering any sector-specific UI
  if (sessionLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0a0a0a" }}>
        <div style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.1)", borderTop: "2px solid rgba(255,255,255,0.5)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const bt = getBusinessType(businessType);
  const { features, terms } = bt;

  const navItems = businessType ? [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Hizmet & Katalog", icon: Package, children: [
        { name: terms.services, href: "/admin/packages" },
        features.albumModels && { name: "Albüm Modelleri", href: "/admin/album-models" },
    ].filter(Boolean) },
    { name: "Mağaza", icon: ShoppingBag, children: [
        { name: "Ürünler", href: "/admin/products" },
        { name: "Siparişler", href: "/admin/orders" },
    ]},
    { name: terms.appointments, href: "/admin/reservations", icon: CalendarDays },
    features.events && { name: "Etkinlikler", href: "/admin/events", icon: Ticket },
    { name: "Muhasebe", href: "/admin/muhasebe", icon: Wallet },
    { name: "Sistem", icon: Settings, children: [
        { name: "Genel Ayarlar", href: "/admin/settings" },
        { name: terms.clients, href: "/admin/members" },
        { name: "Abonelik", href: "/admin/subscription" },
    ]},
  ].filter(Boolean) : [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Ayarlar", href: "/admin/settings", icon: Settings },
  ];

  function NavItem({ item, depth = 0 }) {
    const [isOpen, setIsOpen] = useState(true); // Default open if active inside? Let's just default true for now
    
    // Check if active
    const isActive = item.href ? pathname.startsWith(item.href) : (item.children && item.children.some(c => pathname.startsWith(c.href)));

    useEffect(() => {
      if (isActive && item.children) setIsOpen(true);
    }, [isActive, item.children]);

    if (item.children) {
      return (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div 
            onClick={() => setIsOpen(!isOpen)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", 
              padding: `0.85rem 1.25rem`, paddingLeft: `calc(1.25rem + ${depth * 15}px)`,
              color: "rgba(255,255,255,0.45)", fontWeight: 700, fontSize: "0.75rem",
              textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer",
              marginTop: depth === 0 ? "0.5rem" : "0"
            }} 
            className="hover:text-white transition-colors"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {item.icon && <item.icon size={16} />}
              {item.name}
            </div>
            <span style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><ChevronRight size={14} /></span>
          </div>
          {isOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginTop: "0.25rem" }}>
              {item.children.map(child => <NavItem key={child.name} item={child} depth={depth + 1} />)}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link href={item.href} style={{ textDecoration: "none" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "1rem", 
          padding: `0.85rem 1.25rem`, paddingLeft: `calc(1.25rem + ${depth * 15}px)`,
          borderRadius: 0,
          background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
          color: isActive ? "#fff" : "rgba(255,255,255,0.65)",
          fontWeight: isActive ? 700 : 500,
          transition: "all 0.2s",
          border: isActive ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent"
        }} className="hover:bg-white/5">
          {item.icon && <item.icon size={20} color={isActive ? "#fff" : "rgba(255,255,255,0.5)"} />}
          {!item.icon && depth > 0 && <span style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? "#fff" : "rgba(255,255,255,0.2)", marginLeft: 6, marginRight: 8 }} />}
          <span style={{ fontSize: depth > 0 ? "0.85rem" : "1rem" }}>{item.name}</span>
        </div>
      </Link>
    );
  }

  const sidebarContent = (
    <>
      <div style={{ fontWeight: 900, fontSize: "1.75rem", letterSpacing: "-0.04em", marginBottom: "2.5rem", paddingLeft: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{brandName}<span style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.1rem" }}>.{terms.brandSuffix}</span></span>
        {/* Close button only on mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden"
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: "4px" }}
        >
          <X size={20} />
        </button>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
        {navItems.map((item) => <NavItem key={item.name} item={item} />)}
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
    <div className="admin-theme" style={{ display: "flex", minHeight: "100vh", background: "var(--bg, #0a0a0a)", color: "var(--text, #fff)" }}>
      
      {/* Mobile Top Bar */}
      <div className="md:hidden" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "var(--bg, #0a0a0a)", borderBottom: "1px solid rgba(255,255,255,0.08)",
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
          {brandName}<span style={{ color: "rgba(255,255,255,0.45)", fontWeight: 400 }}>.{bt?.terms?.brandSuffix || "panel"}</span>
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
         <div style={{ position: "absolute", inset: 0, background: "var(--bg, #0a0a0a)", opacity: 0.95, zIndex: 1 }} />
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
          background: "var(--bg, #0a0a0a)",
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
        {trialDays !== null && (
          <Link href="/admin/subscription" style={{ textDecoration: "none" }}>
            <div style={{
              background: trialDays <= 2 ? "rgba(248,113,113,0.1)" : "rgba(250,204,21,0.08)",
              borderBottom: `1px solid ${trialDays <= 2 ? "rgba(248,113,113,0.2)" : "rgba(250,204,21,0.15)"}`,
              padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              color: trialDays <= 2 ? "#f87171" : "#facc15"
            }}>
              <AlertTriangle size={14} />
              {trialDays === 0
                ? "Deneme süreniz doldu! Plan seçmek için tıklayın."
                : `Deneme süreniz ${trialDays} gün sonra bitiyor. Plan seçin →`
              }
            </div>
          </Link>
        )}
        <div style={{ padding: "clamp(16px, 4vw, 56px)", maxWidth: "1200px", margin: "0 auto" }}>
          {children}
        </div>
      </main>

    </div>
  );
}
