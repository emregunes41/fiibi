"use client";

import { useState, useEffect, useRef } from "react";
import { getBusinessTypeList } from "@/lib/business-types";
import { Search, SlidersHorizontal, MapPin, Video, DollarSign } from "lucide-react";

const C = {
  orange: "#FF5F1F", orangeLight: "#FFAA4C",
  cream: "#FFF6F2", bg: "#F5F5F4", black: "#1A1A1A",
  muted: "#A3A3A3", secondary: "#555555", white: "#FFFFFF",
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "short" });
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export default function DiscoverSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Basic Filters
  const [filter, setFilter] = useState("all"); // category
  const [typeFilter, setTypeFilter] = useState("all"); // all, package, event
  
  // Advanced Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [eventMode, setEventMode] = useState("all"); // all, online, offline
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const scrollRef = useRef(null);
  const allTypes = getBusinessTypeList();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/discover?category=${filter}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter]);

  // Apply all filters
  const filtered = items.filter(item => {
    // 1. Type Filter
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    
    // 2. Search Query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchName = item.name?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchBiz = item.tenant?.businessName?.toLowerCase().includes(q);
      const matchLoc = item.location?.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchBiz && !matchLoc) return false;
    }
    
    // 3. Price Range
    const priceNum = item.price === "0" ? 0 : Number(item.price?.toString().replace(/\./g, '') || 0);
    if (minPrice && priceNum < Number(minPrice)) return false;
    if (maxPrice && priceNum > Number(maxPrice)) return false;
    
    // 4. Event Mode
    if (item.type === "event" && eventMode !== "all") {
      if (eventMode === "online" && !item.isOnline) return false;
      if (eventMode === "offline" && item.isOnline) return false;
    }
    
    return true;
  });

  if (loading && items.length === 0) return null;
  if (!loading && items.length === 0) return null;

  return (
    <section id="kesfet" style={{ padding: "100px 32px", background: C.white }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        {/* Header */}
        <div style={{ marginBottom: 48, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: "0.12em" }}>
              KEŞFET
            </span>
            <h2 style={{ fontSize: 44, fontWeight: 800, color: C.black, letterSpacing: "-0.03em", marginTop: 12, lineHeight: 1.1 }}>
              Hizmet & Etkinlik Bul
            </h2>
            <p style={{ fontSize: 16, color: C.secondary, marginTop: 16, lineHeight: 1.7, maxWidth: 520 }}>
              Fiibi üzerindeki profesyonellerin sunduğu hizmet ve etkinlikleri keşfedin.
            </p>
          </div>
        </div>

        {/* --- FILTER BAR --- */}
        <div style={{ background: C.cream, padding: 24, borderRadius: 24, marginBottom: 48 }}>
          
          {/* Top Row: Search & Type */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: showAdvanced ? 24 : 0 }}>
            {/* Search Input */}
            <div style={{ flex: "1 1 300px", position: "relative" }}>
              <Search size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
              <input 
                type="text" 
                placeholder="Hizmet, etkinlik, işletme adı veya konum ara..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: "100%", padding: "14px 16px 14px 44px", borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.08)", fontSize: 15, fontFamily: "'DM Sans', sans-serif",
                  outline: "none", transition: "all 0.2s"
                }}
                onFocus={e => e.target.style.borderColor = C.orange}
                onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.08)"}
              />
            </div>
            
            {/* Type Filters */}
            <div style={{ display: "flex", gap: 4, background: "#fff", padding: 4, borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }}>
              {[
                { key: "all", label: "Tümü", icon: "🔍" },
                { key: "package", label: "Hizmetler", icon: "📦" },
                { key: "event", label: "Etkinlikler", icon: "🎫" },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setTypeFilter(t.key)}
                  style={{
                    padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    borderRadius: 8, border: "none",
                    background: typeFilter === t.key ? C.black : "transparent",
                    color: typeFilter === t.key ? C.white : C.secondary,
                    fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "0 20px",
                background: showAdvanced ? "rgba(255,95,31,0.1)" : "#fff", 
                color: showAdvanced ? C.orange : C.black,
                border: `1px solid ${showAdvanced ? C.orange : "rgba(0,0,0,0.08)"}`, borderRadius: 12,
                fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <SlidersHorizontal size={18} />
              Filtreler
            </button>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", paddingTop: 24, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              {/* Category Filter */}
              <div style={{ flex: "1 1 200px" }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Kategori</label>
                <select 
                  value={filter} 
                  onChange={e => setFilter(e.target.value)}
                  style={{ 
                    width: "100%", padding: "12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)", 
                    background: "#fff", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none"
                  }}
                >
                  <option value="all">Tüm Sektörler</option>
                  {allTypes.filter(t => t.id !== "other").map(bt => (
                    <option key={bt.id} value={bt.id}>{bt.name}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div style={{ flex: "1 1 200px" }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Fiyat Aralığı (₺)</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <DollarSign size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
                    <input 
                      type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                      style={{ width: "100%", padding: "10px 10px 10px 30px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)", fontSize: 14, outline: "none" }}
                    />
                  </div>
                  <div style={{ position: "relative", flex: 1 }}>
                    <DollarSign size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
                    <input 
                      type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                      style={{ width: "100%", padding: "10px 10px 10px 30px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)", fontSize: 14, outline: "none" }}
                    />
                  </div>
                </div>
              </div>

              {/* Event Mode (only relevant if events are shown) */}
              {(typeFilter === "all" || typeFilter === "event") && (
                <div style={{ flex: "1 1 200px" }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>Etkinlik Türü</label>
                  <div style={{ display: "flex", background: "#fff", padding: 4, borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)" }}>
                    {[
                      { key: "all", label: "Farketmez" },
                      { key: "online", label: "Online", icon: <Video size={14}/> },
                      { key: "offline", label: "Yüzyüze", icon: <MapPin size={14}/> },
                    ].map(m => (
                      <button
                        key={m.key}
                        onClick={() => setEventMode(m.key)}
                        style={{
                          flex: 1, padding: "8px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                          borderRadius: 6, border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                          background: eventMode === m.key ? "rgba(0,0,0,0.04)" : "transparent",
                          color: eventMode === m.key ? C.black : C.muted,
                        }}
                      >
                        {m.icon} {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
            <div style={{ width: 32, height: 32, border: "3px solid rgba(0,0,0,0.06)", borderTopColor: C.orange, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* Items Grid */}
        {!loading && (
          <div className="fiibi-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
            {filtered.map(item => (
              <a
                key={`${item.type}-${item.id}`}
                href={item.type === "event"
                  ? `https://${item.tenant.slug}.fiibi.co/#events`
                  : `https://${item.tenant.slug}.fiibi.co/booking`
                }
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", flexDirection: "column", textDecoration: "none", color: C.black,
                  background: "#fff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.08)"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.06)"; }}
              >
                {/* Event Cover Image */}
                {item.type === "event" && item.imageUrl && (
                  <div style={{ width: "100%", height: 180, overflow: "hidden", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                    <img src={item.imageUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}

                <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column" }}>
                  {/* Top Bar: Badges */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em",
                      padding: "4px 10px", borderRadius: 20,
                      background: item.type === "event" ? "rgba(168,85,247,0.1)" : "rgba(59,130,246,0.08)",
                      color: item.type === "event" ? "#7c3aed" : "#2563eb",
                    }}>
                      {item.type === "event" ? "🎫 Etkinlik" : "📦 Hizmet"}
                    </span>
                    {item.tenant.plan === "pro" && (
                      <span style={{
                        fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em",
                        padding: "4px 10px", borderRadius: 20,
                        background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.15))",
                        color: "#d97706",
                      }}>
                        ⭐ PRO
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: C.black, marginBottom: 8, letterSpacing: "-0.02em", lineHeight: 1.3 }}>
                    {item.name}
                  </h3>

                  {/* Event Date Info */}
                  {item.type === "event" && item.date && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12, fontSize: 13, fontWeight: 600, color: C.orangeDark }}>
                      <span>📅 {formatDate(item.date)}</span>
                      <span>🕐 {formatTime(item.date)}</span>
                    </div>
                  )}

                  {/* Description */}
                  <p style={{
                    fontSize: 14, color: C.secondary, lineHeight: 1.6, marginBottom: 20,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    flex: 1
                  }}>
                    {item.description}
                  </p>

                  {/* Event: kontenjan & lokasyon bilgisi */}
                  {item.type === "event" && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20, fontSize: 12, fontWeight: 600 }}>
                      {item.isOnline && (
                        <span style={{ background: "rgba(59,130,246,0.08)", color: "#2563eb", padding: "6px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 4 }}>
                          <Video size={14}/> Online
                        </span>
                      )}
                      {item.location && (
                        <span style={{ background: C.bg, color: C.secondary, padding: "6px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 4, maxWidth: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <MapPin size={14} style={{ flexShrink: 0 }}/> {item.location}
                        </span>
                      )}
                      <span style={{
                        background: item.registrationCount >= item.maxParticipants ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
                        color: item.registrationCount >= item.maxParticipants ? "#dc2626" : "#16a34a",
                        padding: "6px 12px", borderRadius: 8,
                      }}>
                        👥 {item.registrationCount}/{item.maxParticipants}
                        {item.registrationCount >= item.maxParticipants ? " (Dolu)" : ""}
                      </span>
                    </div>
                  )}

                  {/* Package: features */}
                  {item.type === "package" && item.features && item.features.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                      {item.features.slice(0, 3).map((f, i) => (
                        <span key={i} style={{ fontSize: 11, fontWeight: 600, color: C.secondary, background: C.bg, padding: "4px 10px", borderRadius: 6 }}>
                          {f}
                        </span>
                      ))}
                      {item.features.length > 3 && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, padding: "4px 10px", borderRadius: 6 }}>+{item.features.length - 3}</span>
                      )}
                    </div>
                  )}
                  
                  {/* Tenant Info Mini */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", background: C.bg, borderRadius: 12, marginBottom: 20 }}>
                    {item.tenant.logoUrl ? (
                      <img src={item.tenant.logoUrl} alt={item.tenant.businessName} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.orange, color: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800 }}>
                        {item.tenant.businessName?.charAt(0) || "?"}
                      </div>
                    )}
                    <div style={{ overflow: "hidden" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.black, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.tenant.businessName}</div>
                      <div style={{ fontSize: 11, color: C.muted, textTransform: "capitalize" }}>
                        {allTypes.find(t => t.id === item.tenant.businessType)?.name || item.tenant.businessType}
                      </div>
                    </div>
                  </div>

                  {/* Price + CTA */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    <div>
                      {item.price === "0" ? (
                        <span style={{ fontSize: 22, fontWeight: 900, color: "#16a34a" }}>Ücretsiz</span>
                      ) : (
                        <>
                          <span style={{ fontSize: 26, fontWeight: 900, color: C.black, letterSpacing: "-0.03em" }}>
                            {Number(item.price?.replace(/\./g, ''))?.toLocaleString("tr-TR") || item.price}
                          </span>
                          <span style={{ fontSize: 15, color: C.muted, marginLeft: 2, fontWeight: 600 }}>₺</span>
                        </>
                      )}
                    </div>
                    <span style={{
                      background: item.type === "event" ? "#7c3aed" : C.orange,
                      color: "#1a1a1a", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                      display: "inline-flex", alignItems: "center", gap: 6, transition: "transform 0.2s"
                    }}>
                      {item.type === "event" ? "Kayıt Ol" : "Hemen Al"}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0", background: C.cream, borderRadius: 24, marginTop: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: C.black, marginBottom: 8 }}>Sonuç Bulunamadı</h3>
            <p style={{ fontSize: 15, color: C.secondary, maxWidth: 400, margin: "0 auto" }}>
              Arama kriterlerinize uyan bir hizmet veya etkinlik bulamadık. Lütfen filtreleri değiştirerek tekrar deneyin.
            </p>
            <button 
              onClick={() => { setSearchQuery(""); setMinPrice(""); setMaxPrice(""); setEventMode("all"); setFilter("all"); setTypeFilter("all"); }}
              style={{ marginTop: 24, padding: "12px 24px", background: C.black, color: "#1a1a1a", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
            >
              Filtreleri Temizle
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
