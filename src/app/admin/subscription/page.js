"use client";

import { useState, useEffect, useRef } from "react";
import { Crown, Clock, Zap, Check, X, Star, Shield, CreditCard, Lock } from "lucide-react";
import { useAdminSession } from "../AdminSessionContext";
import { PLAN_COMPARISON } from "@/lib/plan-limits";

const PLAN_FEATURES = {
  basic: [
    "Sınırsız rezervasyon",
    "Sınırsız paket/hizmet",
    "Portfolyo yönetimi (20 fotoğraf)",
    "E-posta bildirimleri",
    "Online ödeme entegrasyonu",
    "100 MB içerik yükleme",
    "Standart destek",
  ],
  pro: [
    "Basic'teki her şey +",
    "Sınırsız portfolyo fotoğrafı",
    "10 GB içerik yükleme",
    "SMS bildirimleri",
    "AI Chatbot asistanı",
    "Arka plan özelleştirme",
    "Özel alan adı (domain)",
    "Gelişmiş analitik",
    "Öncelikli destek",
  ],
};

function buildPlans(prices) {
  return [
    {
      id: "basic_monthly", tier: "basic", name: "Basic", period: "Aylık",
      price: prices.basic_monthly || 1499, periodLabel: "/ay",
      color: "#8b5cf6", popular: false, savings: null,
      features: PLAN_FEATURES.basic,
    },
    {
      id: "basic_yearly", tier: "basic", name: "Basic", period: "Yıllık",
      price: prices.basic_yearly || 14999, periodLabel: "/yıl",
      monthlyEquiv: Math.round((prices.basic_yearly || 14999) / 12),
      color: "#8b5cf6", popular: false,
      savings: Math.round(100 - ((prices.basic_yearly || 14999) / ((prices.basic_monthly || 1499) * 12)) * 100),
      features: PLAN_FEATURES.basic,
    },
    {
      id: "pro_monthly", tier: "pro", name: "Pro", period: "Aylık",
      price: prices.pro_monthly || 2999, periodLabel: "/ay",
      color: "#f59e0b", popular: false, savings: null,
      features: PLAN_FEATURES.pro,
    },
    {
      id: "pro_yearly", tier: "pro", name: "Pro", period: "Yıllık",
      price: prices.pro_yearly || 29999, periodLabel: "/yıl",
      monthlyEquiv: Math.round((prices.pro_yearly || 29999) / 12),
      color: "#f59e0b", popular: true,
      savings: Math.round(100 - ((prices.pro_yearly || 29999) / ((prices.pro_monthly || 2999) * 12)) * 100),
      features: PLAN_FEATURES.pro,
    },
  ];
}

const PLAN_DETAILS = {
  trial: { name: "Deneme", color: "#38bdf8" },
  basic: { name: "Basic", color: "#8b5cf6" },
  pro: { name: "Pro", color: "#f59e0b" },
};

export default function SubscriptionPage() {
  const { session: adminSession } = useAdminSession();
  const tenantInfo = adminSession?.tenant || null;
  const [plans, setPlans] = useState(buildPlans({}));
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState("yearly");
  const [showComparison, setShowComparison] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const handleStartPayment = async (planId) => {
    setSelectedPlan(planId);
    const p = plans.find(x => x.id === planId);
    if (!p || !tenantInfo?.id) return;

    // Update selectedPlan in DB
    const periodType = planId.includes("yearly") ? "yearly" : "monthly";
    try {
      setPaymentLoading(true);
      await fetch("/api/auth/update-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenantInfo.id, selectedPlan: periodType }),
      });

      // PayTR iFrame Token al ve yönlendir
      const res = await fetch("/api/paytr/subscription-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenantInfo.id }),
      });
      const data = await res.json();
      
      if (!data.success) {
        alert(data.error || "Hata oluştu");
        setPaymentLoading(false);
        return;
      }
      
      // PayTR güvenli ödeme sayfasına yönlendir
      window.location.href = data.iframeUrl;
    } catch (e) {
      alert("Ödeme başlatılamadı: " + e.message);
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const pricingRes = await fetch("/api/pricing");
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
      <div style={{ width: 24, height: 24, border: "2px solid rgba(0,0,0,0.1)", borderTop: "2px solid #000000", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
    </div>
  );

  const plan = tenantInfo?.plan || "trial";
  const pd = PLAN_DETAILS[plan] || PLAN_DETAILS.trial;
  const expiresAt = tenantInfo?.planExpiresAt ? new Date(tenantInfo.planExpiresAt) : null;
  const now = new Date();
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))) : null;

  // Filter plans by billing cycle and group by tier
  const filteredPlans = plans.filter(p => p.period === (billingCycle === "yearly" ? "Yıllık" : "Aylık"));

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", color: "#1a1a1a" }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", margin: 0 }}>
          Abonelik
        </h1>
      </div>

      {/* Current Plan Status */}
      {(plan === "trial" || plan === "basic") && daysLeft !== null && (
        <div style={{
          background: daysLeft <= 3 ? "rgba(255,100,100,0.06)" : `${pd.color}08`,
          border: daysLeft <= 3 ? "1px solid rgba(255,100,100,0.15)" : `1px solid ${pd.color}20`,
          padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Clock size={16} style={{ color: daysLeft <= 3 ? "#ff6464" : pd.color }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {plan === "trial" ? "Deneme Süresi" : "Basic Plan"}: <span style={{ color: daysLeft <= 3 ? "#ff6464" : pd.color }}>{daysLeft} gün kaldı</span>
              </div>
              <div style={{ fontSize: 11, color: "rgba(0,0,0,0.35)" }}>
                {plan === "trial" ? "Süre dolmadan bir plan seçin." : "Süreniz dolmadan yenileyebilirsiniz."}
              </div>
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
            <div style={{ fontSize: 11, color: "rgba(0,0,0,0.35)" }}>
              {expiresAt ? `Bitiş: ${expiresAt.toLocaleDateString("tr-TR")}` : "Tüm özelliklere erişiminiz var."}
            </div>
          </div>
        </div>
      )}

      {/* Billing Cycle — Şu an sadece yıllık aktif (Non3D onayı bekleniyor) */}
      <div style={{
        display: "flex", justifyContent: "center", gap: 0, marginBottom: 28,
        background: "rgba(0,0,0,0.04)", padding: 4, width: "fit-content", margin: "0 auto 28px",
        borderRadius: 8,
      }}>
        <button
          style={{
            padding: "8px 24px", fontSize: 12, fontWeight: 700,
            background: "rgba(0,0,0,0.12)",
            color: "#1a1a1a",
            border: "none", cursor: "default", borderRadius: 6,
          }}
        >
          Yıllık
          <span style={{ marginLeft: 6, fontSize: 10, color: "#4ade80", fontWeight: 800 }}>Tasarruf</span>
        </button>
      </div>

      {/* Plans Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {filteredPlans.map((p) => (
          <div key={p.id} style={{
            background: selectedPlan === p.id ? `${p.color}08` : "rgba(0,0,0,0.02)",
            border: selectedPlan === p.id ? `2px solid ${p.color}40` : p.popular ? `2px solid ${p.color}25` : "1px solid rgba(0,0,0,0.06)",
            padding: 0, position: "relative", cursor: "pointer", transition: "all 0.2s",
            borderRadius: 0,
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
                Tavsiye Edilen
              </div>
            )}

            <div style={{ padding: "24px 20px" }}>
              {/* Tier badge */}
              <div style={{
                display: "inline-block", background: `${p.color}15`, border: `1px solid ${p.color}25`,
                padding: "3px 10px", fontSize: 10, fontWeight: 800, color: p.color, marginBottom: 12,
                textTransform: "uppercase", letterSpacing: "0.08em",
              }}>
                {p.name}
              </div>

              {/* Price */}
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.03em" }}>
                  {p.price.toLocaleString("tr-TR")}
                </span>
                <span style={{ fontSize: 14, color: "rgba(0,0,0,0.4)", marginLeft: 4 }}>₺</span>
                <span style={{ fontSize: 12, color: "rgba(0,0,0,0.3)", marginLeft: 6 }}>{p.periodLabel}</span>
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
                  display: "inline-block", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)",
                  padding: "3px 8px", fontSize: 10, fontWeight: 700, color: "#4ade80", marginBottom: 16
                }}>
                  %{p.savings} TASARRUF
                </div>
              )}

              {!p.savings && <div style={{ height: 16 }} />}

              {/* Features */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                {p.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(0,0,0,0.55)" }}>
                    <Check size={13} style={{ color: p.color, flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={(e) => { e.stopPropagation(); handleStartPayment(p.id); }}
                style={{
                  width: "100%", marginTop: 24, padding: "12px 0",
                  background: selectedPlan === p.id ? p.color : "rgba(0,0,0,0.06)",
                  color: selectedPlan === p.id ? "#000" : "#fff",
                  border: `1px solid ${selectedPlan === p.id ? p.color : "rgba(0,0,0,0.1)"}`,
                  fontSize: 13, fontWeight: 800, cursor: "pointer", transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                }}
              >
                <Zap size={14} />
                {paymentLoading && selectedPlan === p.id 
                  ? "Yönlendiriliyor..." 
                  : plan === p.tier ? "Planı Yenile" : plan === "pro" && p.tier === "basic" ? "Basic'e Geç" : "Planı Seç"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Toggle */}
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <button
          onClick={() => setShowComparison(!showComparison)}
          style={{
            background: "none", border: "1px solid rgba(0,0,0,0.1)",
            color: "rgba(0,0,0,0.5)", padding: "10px 24px", fontSize: 12,
            fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
          }}
        >
          {showComparison ? "Karşılaştırmayı Gizle" : "Planları Karşılaştır"}
        </button>
      </div>

      {/* Comparison Table */}
      {showComparison && (
        <div style={{ marginTop: 20, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ padding: "12px 16px", fontSize: 11, fontWeight: 800, color: "rgba(0,0,0,0.3)", textTransform: "uppercase" }}>Özellik</div>
            <div style={{ padding: "12px 8px", fontSize: 11, fontWeight: 800, color: "#8b5cf6", textTransform: "uppercase", textAlign: "center" }}>Basic</div>
            <div style={{ padding: "12px 8px", fontSize: 11, fontWeight: 800, color: "#f59e0b", textTransform: "uppercase", textAlign: "center" }}>Pro</div>
          </div>
          {/* Rows */}
          {PLAN_COMPARISON.map((row, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "1fr 100px 100px",
              borderBottom: i < PLAN_COMPARISON.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
            }}>
              <div style={{ padding: "10px 16px", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{row.feature}</div>
              <div style={{ padding: "10px 8px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {row.basic === true ? <Check size={14} style={{ color: "#8b5cf6" }} /> :
                 row.basic === false ? <X size={14} style={{ color: "rgba(0,0,0,0.15)" }} /> :
                 <span style={{ fontSize: 11, color: "rgba(0,0,0,0.5)" }}>{row.basic}</span>}
              </div>
              <div style={{ padding: "10px 8px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {row.pro === true ? <Check size={14} style={{ color: "#f59e0b" }} /> :
                 row.pro === false ? <X size={14} style={{ color: "rgba(0,0,0,0.15)" }} /> :
                 <span style={{ fontSize: 11, color: "rgba(0,0,0,0.5)" }}>{row.pro}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div style={{ textAlign: "center", padding: "24px 0", color: "rgba(0,0,0,0.2)", fontSize: 11, lineHeight: 1.6 }}>
        Tüm planlar KDV dahildir. Tüm planlar 7 gün ücretsiz deneme ile başlar.<br />
        Ödeme işlemleri güvenli altyapı üzerinden gerçekleşir. İptal ve iade koşulları için destek ile iletişime geçin.
      </div>

      {/* Referral Section */}
      {tenantInfo?.referralCode && (
        <div style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", padding: "24px", marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, background: "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>🎁</div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Arkadaşını Getir</h3>
              <p style={{ fontSize: 11, color: "rgba(0,0,0,0.35)", margin: 0 }}>Her başarılı kayıt için ek süre kazanın.</p>
            </div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.1)", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(0,0,0,0.35)", textTransform: "uppercase", marginBottom: 4 }}>Referans Kodunuz</div>
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "0.1em" }}>{tenantInfo.referralCode}</div>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(tenantInfo.referralCode).then(() => alert("Kod kopyalandı!"))}
              style={{ background: "rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.12)", color: "#1a1a1a", padding: "8px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
            >
              Kopyala
            </button>
          </div>
          {tenantInfo.referralCount > 0 && (
            <div style={{ fontSize: 12, color: "rgba(0,0,0,0.4)" }}>
              Şu ana kadar <strong style={{ color: "#1a1a1a" }}>{tenantInfo.referralCount}</strong> kişi sizin referansınızla katıldı.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
