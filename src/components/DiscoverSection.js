"use client";

import { useState, useEffect, useRef } from "react";
import { getBusinessTypeList } from "@/lib/business-types";

const C = {
  orange: "#FF5F1F", orangeLight: "#FFAA4C",
  cream: "#FFF6F2", bg: "#F5F5F4", black: "#1A1A1A",
  muted: "#A3A3A3", secondary: "#555555", white: "#FFFFFF",
};

export default function DiscoverSection() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const scrollRef = useRef(null);

  const allTypes = getBusinessTypeList();

  useEffect(() => {
    fetch(`/api/discover?category=${filter}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setPackages(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter]);

  if (loading && packages.length === 0) {
    return null; // Don't render section until data loads
  }

  if (!loading && packages.length === 0) {
    return null; // No discoverable packages yet
  }

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
            Fiibi üzerindeki profesyonellerin sunduğu hizmetleri keşfedin.
          </p>
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
              whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.2s",
            }}
          >
            Tümü
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
                display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.2s",
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

        {/* Package Grid */}
        {!loading && (
          <div className="fiibi-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 2 }}>
            {packages.map(pkg => (
              <a
                key={pkg.id}
                href={`https://${pkg.tenant.slug}.fiibi.co/booking`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block", textDecoration: "none", color: C.black,
                  background: C.cream, padding: "28px 24px",
                  transition: "all 0.2s", position: "relative",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.cream; e.currentTarget.style.boxShadow = "none"; }}
              >
                {/* Pro Badge */}
                {pkg.tenant.plan === "pro" && (
                  <div style={{
                    position: "absolute", top: 12, right: 12,
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    color: "#fff", padding: "3px 10px", fontSize: 9, fontWeight: 800,
                    textTransform: "uppercase", letterSpacing: "0.08em",
                  }}>
                    PRO
                  </div>
                )}

                {/* Tenant Info */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  {pkg.tenant.logoUrl ? (
                    <img
                      src={pkg.tenant.logoUrl}
                      alt={pkg.tenant.businessName}
                      style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(0,0,0,0.06)" }}
                    />
                  ) : (
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: C.orange, color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, fontWeight: 800,
                    }}>
                      {pkg.tenant.businessName?.charAt(0) || "?"}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.black }}>{pkg.tenant.businessName}</div>
                    <div style={{ fontSize: 11, color: C.muted, textTransform: "capitalize" }}>
                      {allTypes.find(t => t.id === pkg.tenant.businessType)?.name || pkg.tenant.businessType}
                    </div>
                  </div>
                </div>

                {/* Package Info */}
                <h3 style={{ fontSize: 18, fontWeight: 800, color: C.black, marginBottom: 8, letterSpacing: "-0.01em" }}>
                  {pkg.name}
                </h3>
                <p style={{
                  fontSize: 13, color: C.secondary, lineHeight: 1.6, marginBottom: 16,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {pkg.description}
                </p>

                {/* Features */}
                {pkg.features && pkg.features.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
                    {pkg.features.slice(0, 3).map((f, i) => (
                      <span key={i} style={{
                        fontSize: 10, fontWeight: 600, color: C.secondary,
                        background: "rgba(0,0,0,0.04)", padding: "3px 8px",
                      }}>
                        {f}
                      </span>
                    ))}
                    {pkg.features.length > 3 && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: C.muted, padding: "3px 8px" }}>
                        +{pkg.features.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Price + CTA */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                  <div>
                    <span style={{ fontSize: 24, fontWeight: 900, color: C.black, letterSpacing: "-0.02em" }}>
                      {Number(pkg.price?.replace(/\./g, ''))?.toLocaleString("tr-TR") || pkg.price}
                    </span>
                    <span style={{ fontSize: 14, color: C.muted, marginLeft: 2 }}>₺</span>
                  </div>
                  <span style={{
                    background: C.orange, color: "#fff",
                    padding: "10px 20px", fontSize: 12, fontWeight: 700,
                    display: "inline-flex", alignItems: "center", gap: 6,
                  }}>
                    İncele →
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Empty state after filter */}
        {!loading && packages.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 15, fontWeight: 600 }}>Bu kategoride henüz listelenmiş hizmet yok.</p>
          </div>
        )}
      </div>
    </section>
  );
}
