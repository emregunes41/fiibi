"use client";

import { useState, useEffect } from "react";
import { Crown, Clock, Zap, Check, Shield, Star, Infinity } from "lucide-react";

const PLAN_FEATURES = {
  monthly: [
    "Tüm özellikler aktif",
    "Sınırsız rezervasyon",
    "Portfolyo yönetimi",
    "E-posta & SMS bildirimleri",
    "Online ödeme entegrasyonu",
    "Destek",
  ],
  yearly: [
    "Tüm aylık özellikler",
    "Custom domain desteği",
    "Öncelikli destek",
    "AI Chatbot",
    "Gelişmiş analitik",
    "Yıllık fatura ile tasarruf",
  ],
  lifetime: [
    "Tüm yıllık özellikler",
    "Ömür boyu erişim",
    "Tüm gelecek güncellemeler",
    "VIP destek",
    "Sınırsız kullanım süresi",
    "Abonelik derdi yok",
  ],
};

function buildPlans(prices) {
  return [
    {
      id: "monthly", name: "Aylık", price: prices.monthly,
      period: "/ay", color: "#8b5cf6", popular: false, savings: null,
      features: PLAN_FEATURES.monthly,
    },
    {
      id: "yearly", name: "Yıllık", price: prices.yearly,
      period: "/yıl", monthlyEquiv: Math.round(prices.yearly / 12),
      color: "#f59e0b", popular: true,
      savings: Math.round(100 - (prices.yearly / (prices.monthly * 12)) * 100),
      features: PLAN_FEATURES.yearly,
    },
    {
      id: "lifetime", name: "Ömürlük", price: prices.lifetime,
      period: "tek seferlik", color: "#4ade80", popular: false, savings: null,
      features: PLAN_FEATURES.lifetime,
    },
  ];
}

const PLAN_DETAILS = {
  trial: { name: "Deneme", color: "#38bdf8" },
  pro: { name: "Pro", color: "#f59e0b" },
};

export default function SubscriptionPage() {
  const [tenantInfo, setTenantInfo] = useState(null);
  const [plans, setPlans] = useState(buildPlans({ monthly: 2499, yearly: 24999, lifetime: 69500 }));
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [sessionRes, pricingRes] = await Promise.all([
          fetch("/api/auth/session"),
          fetch("/api/pricing"),
        ]);
        if (sessionRes.ok) {
          const data = await sessionRes.json();
          setTenantInfo(data.tenant || null);
        }
        if (pricingRes.ok) {
          const prices = await pricingRes.json();
          setPlans(buildPlans(prices));
        }
      } catch (e) {}
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
  const expiresAt = tenantInfo?.planExpiresAt ? new Date(tenantInfo.planExpiresAt) : null;
  const now = new Date();
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))) : null;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", color: "#fff" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 4 }}>Abonelik</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>Plan bilgileriniz ve yükseltme seçenekleri.</p>
      </div>

      {/* Current Plan Status */}
      {plan === "trial" && daysLeft !== null && (
        <div style={{
          background: daysLeft <= 3 ? "rgba(255,100,100,0.06)" : "rgba(56,189,248,0.06)",
          border: daysLeft <= 3 ? "1px solid rgba(255,100,100,0.15)" : "1px solid rgba(56,189,248,0.15)",
          padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Clock size={16} style={{ color: daysLeft <= 3 ? "#ff6464" : "#38bdf8" }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                Deneme Süresi: <span style={{ color: daysLeft <= 3 ? "#ff6464" : "#38bdf8" }}>{daysLeft} gün kaldı</span>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Süre dolmadan bir plan seçin.</div>
            </div>
          </div>
        </div>
      )}

      {plan === "pro" && (
        <div style={{
          background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)",
          padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10
        }}>
          <Crown size={18} style={{ color: "#f59e0b" }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>Pro Plan Aktif</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
              {expiresAt ? `Bitiş: ${expiresAt.toLocaleDateString("tr-TR")}` : "Tüm özelliklere erişiminiz var."}
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
        {plans.map((p) => (
          <div key={p.id} style={{
            background: selectedPlan === p.id ? `${p.color}08` : "rgba(255,255,255,0.02)",
            border: selectedPlan === p.id ? `2px solid ${p.color}40` : p.popular ? `2px solid ${p.color}25` : "1px solid rgba(255,255,255,0.06)",
            padding: 0, position: "relative", cursor: "pointer", transition: "all 0.2s",
          }}
            onClick={() => setSelectedPlan(p.id)}
          >
            {/* Popular badge */}
            {p.popular && (
              <div style={{
                background: p.color, color: "#000", fontSize: 10, fontWeight: 800,
                padding: "5px 14px", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.08em"
              }}>
                <Star size={10} style={{ marginRight: 4, verticalAlign: "middle" }} />
                En Popüler
              </div>
            )}

            <div style={{ padding: "24px 20px" }}>
              {/* Plan name */}
              <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {p.name}
              </div>

              {/* Price */}
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.03em" }}>
                  {p.price.toLocaleString("tr-TR")}
                </span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>₺</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginLeft: 6 }}>{p.period}</span>
              </div>

              {/* Monthly equivalent */}
              {p.monthlyEquiv && (
                <div style={{ fontSize: 11, color: p.color, marginBottom: 4 }}>
                  Aylık ~{p.monthlyEquiv.toLocaleString("tr-TR")} ₺
                </div>
              )}

              {/* Savings */}
              {p.savings && (
                <div style={{
                  display: "inline-block", background: `${p.color}15`, border: `1px solid ${p.color}25`,
                  padding: "3px 8px", fontSize: 10, fontWeight: 700, color: p.color, marginBottom: 16
                }}>
                  %{p.savings} TASARRUF
                </div>
              )}

              {!p.savings && <div style={{ height: 16 }} />}

              {/* Features */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                {p.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                    <Check size={13} style={{ color: p.color, flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedPlan(p.id); alert(`${p.name} plan ödeme entegrasyonu yakında aktif olacak.`); }}
                style={{
                  width: "100%", marginTop: 24, padding: "12px 0",
                  background: selectedPlan === p.id ? p.color : "rgba(255,255,255,0.06)",
                  color: selectedPlan === p.id ? "#000" : "#fff",
                  border: `1px solid ${selectedPlan === p.id ? p.color : "rgba(255,255,255,0.1)"}`,
                  fontSize: 13, fontWeight: 800, cursor: "pointer", transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                }}
              >
                {p.id === "lifetime" ? <Infinity size={15} /> : <Zap size={14} />}
                {plan === "pro" ? "Planı Değiştir" : "Planı Seç"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div style={{ textAlign: "center", padding: "24px 0", color: "rgba(255,255,255,0.2)", fontSize: 11, lineHeight: 1.6 }}>
        Tüm planlar KDV dahildir. Ödeme işlemleri güvenli altyapı üzerinden gerçekleşir.<br />
        İptal ve iade koşulları için destek ile iletişime geçin.
      </div>
    </div>
  );
}
