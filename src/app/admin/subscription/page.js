"use client";

import { useState, useEffect } from "react";
import { Crown, Clock, Zap, Check, AlertTriangle, Shield } from "lucide-react";

const PLAN_DETAILS = {
  trial: { name: "Deneme", color: "#38bdf8", features: ["14 gün ücretsiz", "Tüm özellikler aktif", "Sınırsız rezervasyon"] },
  pro: { name: "Pro", color: "#f59e0b", features: ["Sınırsız rezervasyon", "Custom domain", "E-posta bildirimleri", "Portfolyo yönetimi", "Online ödeme", "Öncelikli destek"] },
};

export default function SubscriptionPage() {
  const [tenantInfo, setTenantInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setTenantInfo(data.tenant || null);
      } catch (e) {
        // Fallback: no tenant info available
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ width: 24, height: 24, border: "2px solid rgba(255,255,255,0.1)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
    </div>
  );

  const plan = tenantInfo?.plan || "trial";
  const planInfo = PLAN_DETAILS[plan] || PLAN_DETAILS.trial;
  const expiresAt = tenantInfo?.planExpiresAt ? new Date(tenantInfo.planExpiresAt) : null;
  const now = new Date();
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))) : null;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", color: "#fff" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 4 }}>Abonelik</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>Plan bilgileriniz ve yönetimi.</p>
      </div>

      {/* Current Plan Card */}
      <div style={{
        background: "rgba(255,255,255,0.04)", border: `1px solid ${planInfo.color}33`,
        padding: 28, marginBottom: 20
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, background: `${planInfo.color}15`, border: `1px solid ${planInfo.color}30`,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Crown size={20} style={{ color: planInfo.color }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: planInfo.color }}>{planInfo.name}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Mevcut Plan</div>
            </div>
          </div>

          {plan === "trial" && daysLeft !== null && (
            <div style={{
              padding: "8px 14px", background: daysLeft <= 3 ? "rgba(255,100,100,0.1)" : "rgba(255,255,255,0.05)",
              border: daysLeft <= 3 ? "1px solid rgba(255,100,100,0.2)" : "1px solid rgba(255,255,255,0.1)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={13} style={{ color: daysLeft <= 3 ? "#ff6464" : "rgba(255,255,255,0.5)" }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: daysLeft <= 3 ? "#ff6464" : "rgba(255,255,255,0.6)" }}>
                  {daysLeft} GÜN KALDI
                </span>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {planInfo.features.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
              <Check size={14} style={{ color: planInfo.color, flexShrink: 0 }} />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Options */}
      {plan !== "pro" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{
            background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)",
            padding: 24, display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                Pro Plan <Shield size={14} style={{ color: "#f59e0b" }} />
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Sınırsız kullanım, custom domain, öncelikli destek.</div>
            </div>
            <button style={{
              padding: "10px 20px", background: "#f59e0b", color: "#000", border: "none",
              fontWeight: 800, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6
            }}>
              <Zap size={14} /> Yükselt
            </button>
          </div>

          <div style={{ textAlign: "center", padding: 16, color: "rgba(255,255,255,0.2)", fontSize: 11 }}>
            Ödeme sistemi yakında aktif olacak. Şu an tüm özellikler ücretsiz kullanılabilir.
          </div>
        </div>
      )}

      {plan === "pro" && (
        <div style={{ textAlign: "center", padding: 28, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Crown size={28} style={{ color: "#f59e0b", margin: "0 auto 12px" }} />
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>En üst planda!</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Tüm özelliklere erişiminiz var.</div>
        </div>
      )}
    </div>
  );
}
