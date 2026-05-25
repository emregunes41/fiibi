"use client";

import { useState, useEffect, useRef } from "react";
import { getBusinessTypeList } from "@/lib/business-types";

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
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all"); // all, package, event
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

  const filtered = typeFilter === "all" ? items : items.filter(i => i.type === typeFilter);

  if (loading && items.length === 0) return null;
  if (!loading && items.length === 0) return null;

  return (
    <section id="kesfet" style={{ padding: "100px 32px", background: C.white }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
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

        {/* Type Filters */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
          {[
            { key: "all", label: "Tümü", icon: "🔍" },
            { key: "package", label: "Hizmetler", icon: "📦" },
            { key: "event", label: "Etkinlikler", icon: "🎫" },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key)}
              style={{
                padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                border: typeFilter === t.key ? `2px solid ${C.black}` : "1px solid rgba(0,0,0,0.08)",
                background: typeFilter === t.key ? C.black : "transparent",
                color: typeFilter === t.key ? C.white : C.secondary,
                fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Category Filters */}
        <div ref={scrollRef} style={{ display: "flex", gap: 6, marginBottom: 40, overflowX: "auto", paddingBottom: 8 }}>
          <button
            onClick={() => setFilter("all")}
            style={{
              padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
              border: filter === "all" ? `2px solid ${C.orange}` : "1px solid rgba(0,0,0,0.08)",
              background: filter === "all" ? "rgba(255,95,31,0.06)" : "transparent",
              color: filter === "all" ? C.orange : C.secondary,
              whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
            }}
          >
            Tüm Sektörler
          </button>
          {allTypes.filter(t => t.id !== "other").map(bt => (
            <button
              key={bt.id}
              onClick={() => setFilter(bt.id)}
              style={{
                padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                border: filter === bt.id ? `2px solid ${C.orange}` : "1px solid rgba(0,0,0,0.08)",
                background: filter === bt.id ? "rgba(255,95,31,0.06)" : "transparent",
                color: filter === bt.id ? C.orange : C.secondary,
                whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif",
                display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
              }}
            >
              <span>{bt.icon}</span> {bt.name}
            </button>
          ))}
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
          <div className="fiibi-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 2 }}>
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
                  display: "block", textDecoration: "none", color: C.black,
                  background: C.cream, transition: "all 0.2s", position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.cream; e.currentTarget.style.boxShadow = "none"; }}
              >
                {/* Event Cover Image */}
                {item.type === "event" && item.imageUrl && (
                  <div style={{ width: "100%", height: 160, overflow: "hidden" }}>
                    <img src={item.imageUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}

                <div style={{ padding: "24px" }}>
                  {/* Type Badge + Pro Badge */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em",
                      padding: "3px 10px",
                      background: item.type === "event" ? "rgba(168,85,247,0.1)" : "rgba(59,130,246,0.08)",
                      color: item.type === "event" ? "#7c3aed" : "#2563eb",
                    }}>
                      {item.type === "event" ? "🎫 Etkinlik" : "📦 Hizmet"}
                    </span>
                    {item.tenant.plan === "pro" && (
                      <span style={{
                        fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em",
                        padding: "3px 10px",
                        background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.15))",
                        color: "#d97706",
                      }}>
                        ⭐ PRO
                      </span>
                    )}
                  </div>

                  {/* Tenant Info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    {item.tenant.logoUrl ? (
                      <img
                        src={item.tenant.logoUrl}
                        alt={item.tenant.businessName}
                        style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(0,0,0,0.06)" }}
                      />
                    ) : (
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: C.orange, color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, fontWeight: 800,
                      }}>
                        {item.tenant.businessName?.charAt(0) || "?"}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.black }}>{item.tenant.businessName}</div>
                      <div style={{ fontSize: 10, color: C.muted, textTransform: "capitalize" }}>
                        {allTypes.find(t => t.id === item.tenant.businessType)?.name || item.tenant.businessType}
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: C.black, marginBottom: 6, letterSpacing: "-0.01em" }}>
                    {item.name}
                  </h3>

                  {/* Event Date Info */}
                  {item.type === "event" && item.date && (
                    <div style={{ display: "flex", gap: 12, marginBottom: 10, fontSize: 12, fontWeight: 600, color: C.orange }}>
                      <span>📅 {formatDate(item.date)}</span>
                      <span>🕐 {formatTime(item.date)}</span>
                      <span>⏱ {item.durationMinutes} dk</span>
                    </div>
                  )}

                  {/* Description */}
                  <p style={{
                    fontSize: 13, color: C.secondary, lineHeight: 1.6, marginBottom: 16,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {item.description}
                  </p>

                  {/* Event: kontenjan bilgisi */}
                  {item.type === "event" && (
                    <div style={{ display: "flex", gap: 8, marginBottom: 16, fontSize: 11, fontWeight: 600 }}>
                      {item.isOnline && (
                        <span style={{ background: "rgba(59,130,246,0.08)", color: "#2563eb", padding: "4px 10px" }}>
                          📹 Online
                        </span>
                      )}
                      {item.location && (
                        <span style={{ background: "rgba(0,0,0,0.04)", color: C.secondary, padding: "4px 10px" }}>
                          📍 {item.location}
                        </span>
                      )}
                      <span style={{
                        background: item.registrationCount >= item.maxParticipants ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
                        color: item.registrationCount >= item.maxParticipants ? "#dc2626" : "#16a34a",
                        padding: "4px 10px",
                      }}>
                        👥 {item.registrationCount}/{item.maxParticipants}
                        {item.registrationCount >= item.maxParticipants ? " (Dolu)" : ""}
                      </span>
                    </div>
                  )}

                  {/* Package: features */}
                  {item.type === "package" && item.features && item.features.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
                      {item.features.slice(0, 3).map((f, i) => (
                        <span key={i} style={{ fontSize: 10, fontWeight: 600, color: C.secondary, background: "rgba(0,0,0,0.04)", padding: "3px 8px" }}>
                          {f}
                        </span>
                      ))}
                      {item.features.length > 3 && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: C.muted, padding: "3px 8px" }}>+{item.features.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Price + CTA */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    <div>
                      {item.price === "0" ? (
                        <span style={{ fontSize: 20, fontWeight: 900, color: "#16a34a" }}>Ücretsiz</span>
                      ) : (
                        <>
                          <span style={{ fontSize: 24, fontWeight: 900, color: C.black, letterSpacing: "-0.02em" }}>
                            {Number(item.price?.replace(/\./g, ''))?.toLocaleString("tr-TR") || item.price}
                          </span>
                          <span style={{ fontSize: 14, color: C.muted, marginLeft: 2 }}>₺</span>
                        </>
                      )}
                    </div>
                    <span style={{
                      background: item.type === "event" ? "#7c3aed" : C.orange,
                      color: "#fff", padding: "10px 20px", fontSize: 12, fontWeight: 700,
                      display: "inline-flex", alignItems: "center", gap: 6,
                    }}>
                      {item.type === "event" ? "Katıl →" : "İncele →"}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 15, fontWeight: 600 }}>Bu filtrede henüz listelenmiş içerik yok.</p>
          </div>
        )}
      </div>
    </section>
  );
}
