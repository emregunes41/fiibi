"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, Users, Building2, CreditCard, Snowflake, Trash2,
  RefreshCw, LogOut, ExternalLink, Crown, AlertTriangle, Check,
  BarChart, Database, Cloud, Mail, HardDrive, Image, Zap,
  DollarSign, Save, LayoutDashboard, Percent, CheckCircle2, XCircle, Clock
} from "lucide-react";
import {
  getAllTenants, getPlatformStats, toggleTenantFreeze,
  changeTenantPlan, deleteTenant, superAdminLogout,
  getPlatformPricing, updatePlatformPricing,
  updateTenantCommission, updateSubMerchantStatus
} from "@/app/actions/super-admin";
import { getCloudinaryUsage, getDbUsage, getResendUsage, getVercelUsage } from "@/app/actions/platform-usage";

const TABS = [
  { id: "overview", label: "Genel Bakış", icon: LayoutDashboard },
  { id: "usage", label: "Kaynak Kullanımı", icon: BarChart },
  { id: "pricing", label: "Fiyatlandırma", icon: DollarSign },
  { id: "tenants", label: "Stüdyolar", icon: Building2 },
];

export default function SuperAdminClient() {
  const [tab, setTab] = useState("overview");
  const [tenants, setTenants] = useState([]);
  const [stats, setStats] = useState(null);
  const [usage, setUsage] = useState(null);
  const [pricing, setPricing] = useState({ monthly: 2499, yearly: 24999, lifetime: 69500 });
  const [pricingSaved, setPricingSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const router = useRouter();

  const domain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "localhost:3000";

  async function loadData() {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        getAllTenants(), getPlatformStats(),
        getCloudinaryUsage(), getDbUsage(), getResendUsage(), getVercelUsage(),
        getPlatformPricing(),
      ]);
      const val = (i) => results[i].status === "fulfilled" ? results[i].value : null;
      const t = val(0), s = val(1);
      if (t && !t.error) setTenants(t);
      if (s && !s.error) setStats(s);
      setUsage({
        cloudinary: val(2) || { error: "yüklenemedi" },
        db: val(3) || { error: "yüklenemedi" },
        resend: val(4) || { error: "yüklenemedi" },
        vercel: val(5) || { error: "yüklenemedi" },
      });
      const pr = val(6);
      if (pr && !pr.error) setPricing(pr);
    } catch (err) { console.error("loadData error:", err); }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleFreeze(id) { setActionLoading(id); await toggleTenantFreeze(id); await loadData(); setActionLoading(null); }
  async function handlePlanChange(id, plan) { setActionLoading(id); await changeTenantPlan(id, plan); await loadData(); setActionLoading(null); }
  async function handleDelete(id, name) {
    if (!confirm(`"${name}" tenant'ını ve TÜM verilerini kalıcı olarak silmek istediğinize emin misiniz?`)) return;
    if (!confirm("Son kez onaylayın: Bu tenant'a ait tüm veriler silinecek.")) return;
    setActionLoading(id); await deleteTenant(id); await loadData(); setActionLoading(null);
  }
  async function handleLogout() { await superAdminLogout(); router.push("/super-admin/login"); }
  async function handleCommission(id, rate) { setActionLoading(id); await updateTenantCommission(id, rate); await loadData(); setActionLoading(null); }
  async function handleSubMerchantStatus(id, status) { setActionLoading(id); await updateSubMerchantStatus(id, status); await loadData(); setActionLoading(null); }

  const smStatusConfig = {
    NOT_STARTED: { label: "Başvuru Yok", color: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.06)" },
    PENDING: { label: "İnceleniyor", color: "#facc15", bg: "rgba(250,204,21,0.08)", border: "rgba(250,204,21,0.2)" },
    APPROVED: { label: "Onaylı", color: "#4ade80", bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.2)" },
    REJECTED: { label: "Reddedildi", color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" },
  };

  const planColors = {
    trial: { bg: "rgba(250,204,21,0.1)", border: "rgba(250,204,21,0.2)", text: "#facc15" },
    pro: { bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.2)", text: "#8b5cf6" },
  };

  function renderUsageBar(label, Icon, color, current, limit, unit, sub, pct) {
    const p = Math.min(100, Math.round(pct || (limit ? (current / limit) * 100 : 0)));
    const isWarning = p > 70;
    const isDanger = p > 90;
    return (
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon size={14} style={{ color }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{label}</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: isDanger ? "#f87171" : isWarning ? "#fbbf24" : "rgba(255,255,255,0.4)" }}>{p}%</span>
        </div>
        <div style={{ height: 4, background: "rgba(255,255,255,0.06)", marginBottom: 8 }}>
          <div style={{ height: "100%", width: `${p}%`, background: isDanger ? "#f87171" : isWarning ? "#fbbf24" : color, transition: "width 0.5s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
            {current?.toLocaleString("tr-TR")}{unit ? ` ${unit}` : ""} / {limit?.toLocaleString("tr-TR")}{unit ? ` ${unit}` : ""}
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{sub}</span>
        </div>
      </div>
    );
  }

  if (loading && !stats) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <Shield size={32} style={{ color: "#8b5cf6", marginBottom: 12 }} />
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Platform yükleniyor...</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff" }}>

      {/* Top Bar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Shield size={20} style={{ color: "#8b5cf6" }} />
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>Super Admin</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={loadData} style={iconBtn} title="Yenile"><RefreshCw size={15} /></button>
          <button onClick={handleLogout} style={{ ...iconBtn, color: "#f87171" }} title="Çıkış"><LogOut size={15} /></button>
        </div>
      </div>

      <div style={{ display: "flex", maxWidth: 1200, margin: "0 auto" }}>

        {/* Sidebar Tabs */}
        <div style={{ width: 200, borderRight: "1px solid rgba(255,255,255,0.06)", padding: "16px 0", flexShrink: 0, minHeight: "calc(100vh - 60px)" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "12px 20px", border: "none", cursor: "pointer",
                background: tab === t.id ? "rgba(139,92,246,0.08)" : "transparent",
                borderRight: tab === t.id ? "2px solid #8b5cf6" : "2px solid transparent",
                color: tab === t.id ? "#fff" : "rgba(255,255,255,0.4)",
                fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
                transition: "all 0.15s",
              }}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "24px 32px", minWidth: 0 }}>

          {/* ─── TAB: Genel Bakış ─── */}
          {tab === "overview" && (
            <>
              <h2 style={sectionTitle}>Platform Özeti</h2>

              {stats && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 32 }}>
                  {[
                    { label: "Toplam Stüdyo", value: stats.tenantCount, icon: Building2, color: "#8b5cf6" },
                    { label: "Aktif", value: stats.activeCount, icon: Check, color: "#4ade80" },
                    { label: "Dondurulmuş", value: stats.frozenCount, icon: Snowflake, color: "#38bdf8" },
                    { label: "Trial", value: stats.trialCount, icon: CreditCard, color: "#facc15" },
                    { label: "Toplam Rez.", value: stats.totalReservations, icon: Crown, color: "#f472b6" },
                    { label: "Toplam Üye", value: stats.totalUsers, icon: Users, color: "#a78bfa" },
                  ].map((s, i) => (
                    <div key={i} style={cardStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <s.icon size={14} style={{ color: s.color }} />
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</span>
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 800 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick usage summary */}
              {usage && !usage.cloudinary?.error && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                  {renderUsageBar("Cloudinary", Cloud, "#f472b6", usage.cloudinary.storage.usedGB, usage.cloudinary.storage.limitGB, "GB", "Depolama", usage.cloudinary.storage.pct)}
                  {usage.vercel && !usage.vercel.error && renderUsageBar("Vercel BW", HardDrive, "#4ade80", usage.vercel.bandwidth.usedGB, usage.vercel.bandwidth.limitGB, "GB", "Tahmini", usage.vercel.bandwidth.pct)}
                  {!usage.db?.error && renderUsageBar("Veritabanı", Database, "#8b5cf6", usage.db.estimatedSizeMB, usage.db.limitMB, "MB", `${usage.db.totalRows.toLocaleString("tr-TR")} satır`, usage.db.pct)}
                </div>
              )}
            </>
          )}

          {/* ─── TAB: Kaynak Kullanımı ─── */}
          {tab === "usage" && usage && (
            <>
              <h2 style={sectionTitle}>Kaynak Kullanımı</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>

                {/* Vercel */}
                {usage.vercel && !usage.vercel.error && (
                  <>
                    {renderUsageBar("Vercel Bandwidth", HardDrive, "#4ade80",
                      usage.vercel.bandwidth.usedGB, usage.vercel.bandwidth.limitGB, "GB",
                      usage.vercel.hasRealData
                        ? `${usage.vercel.totalPageViews.toLocaleString("tr-TR")} sayfa (gerçek)`
                        : `~tahmini · ${usage.vercel.activeTenants} stüdyo`,
                      usage.vercel.bandwidth.pct
                    )}
                    <div style={cardStyle}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Zap size={14} style={{ color: "#4ade80" }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Serverless Functions</span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>tahmini</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                        <span>~{usage.vercel.functions.estimated} çağrı/ay</span>
                        <span>Limit: {usage.vercel.functions.limitLabel}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Cloudinary */}
                {usage.cloudinary?.error ? (
                  <div style={cardStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <Cloud size={14} style={{ color: "#f472b6" }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Cloudinary</span>
                      <span style={{ fontSize: 9, color: "#f87171", marginLeft: "auto", textTransform: "uppercase" }}>
                        {usage.cloudinary.missing ? "API Bağlı Değil" : "Hata"}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>.env → CLOUDINARY_API_KEY + SECRET</div>
                  </div>
                ) : (
                  <>
                    {renderUsageBar("Cloudinary Depolama", Cloud, "#f472b6", usage.cloudinary.storage.usedGB, usage.cloudinary.storage.limitGB, "GB", `Plan: ${usage.cloudinary.plan}`, usage.cloudinary.storage.pct)}
                    {renderUsageBar("Cloudinary Bandwidth", HardDrive, "#a78bfa", usage.cloudinary.bandwidth.usedGB, usage.cloudinary.bandwidth.limitGB, "GB", "Aylık transfer", usage.cloudinary.bandwidth.pct)}
                    {renderUsageBar("Dönüşümler", Image, "#38bdf8", usage.cloudinary.transformations.used, usage.cloudinary.transformations.limit, "", `${usage.cloudinary.objects.used} dosya`, usage.cloudinary.transformations.pct)}
                  </>
                )}

                {/* DB */}
                {usage.db?.error ? (
                  <div style={cardStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Database size={14} style={{ color: "#8b5cf6" }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Veritabanı</span>
                      <span style={{ fontSize: 9, color: "#f87171", marginLeft: "auto" }}>Hata</span>
                    </div>
                  </div>
                ) : (
                  renderUsageBar("Veritabanı Boyutu", Database, "#8b5cf6", usage.db.estimatedSizeMB, usage.db.limitMB, "MB", `${usage.db.totalRows.toLocaleString("tr-TR")} satır`, usage.db.pct)
                )}

                {/* Resend */}
                {usage.resend?.error ? (
                  <div style={cardStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Mail size={14} style={{ color: "#facc15" }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>E-posta (Resend)</span>
                      <span style={{ fontSize: 9, color: "#f87171", marginLeft: "auto", textTransform: "uppercase" }}>
                        {usage.resend.missing ? "API Bağlı Değil" : "Hata"}
                      </span>
                    </div>
                  </div>
                ) : (
                  renderUsageBar("E-posta (Resend)", Mail, "#facc15", usage.resend.emailsThisMonth, usage.resend.monthlyLimit, "", `Günlük limit: ${usage.resend.dailyLimit}`, usage.resend.pct)
                )}
              </div>
            </>
          )}

          {/* ─── TAB: Fiyatlandırma ─── */}
          {tab === "pricing" && (
            <>
              <h2 style={sectionTitle}>Abonelik Fiyatları</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 16 }}>
                {[
                  { key: "monthly", label: "Aylık", suffix: "₺/ay", color: "#8b5cf6" },
                  { key: "yearly", label: "Yıllık", suffix: "₺/yıl", color: "#f59e0b" },
                  { key: "lifetime", label: "Ömürlük", suffix: "₺", color: "#4ade80" },
                ].map((p) => (
                  <div key={p.key} style={cardStyle}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {p.label}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="number"
                        value={pricing[p.key]}
                        onChange={(e) => { setPricing({ ...pricing, [p.key]: e.target.value }); setPricingSaved(false); }}
                        style={{
                          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                          color: "#fff", padding: "10px 14px", width: "100%", fontSize: 22, fontWeight: 800,
                          outline: "none"
                        }}
                      />
                      <span style={{ fontSize: 13, color: p.color, whiteSpace: "nowrap", fontWeight: 700 }}>{p.suffix}</span>
                    </div>
                    {p.key === "yearly" && pricing.monthly > 0 && (
                      <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 6 }}>
                        ~{Math.round(pricing.yearly / 12).toLocaleString("tr-TR")} ₺/ay · %{Math.round(100 - (pricing.yearly / (pricing.monthly * 12)) * 100)} tasarruf
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={async () => {
                  const res = await updatePlatformPricing(pricing);
                  if (res.success) { setPricingSaved(true); setTimeout(() => setPricingSaved(false), 3000); }
                }}
                style={{
                  background: pricingSaved ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.06)",
                  border: pricingSaved ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,255,255,0.1)",
                  color: pricingSaved ? "#4ade80" : "#fff",
                  padding: "12px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s"
                }}
              >
                {pricingSaved ? <Check size={14} /> : <Save size={14} />}
                {pricingSaved ? "Kaydedildi!" : "Fiyatları Kaydet"}
              </button>
            </>
          )}

          {/* ─── TAB: Stüdyolar ─── */}
          {tab === "tenants" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ ...sectionTitle, marginBottom: 0 }}>Stüdyolar</h2>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{tenants.length} kayıt</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {tenants.map(t => {
                  const pc = planColors[t.plan] || planColors.trial;
                  const daysLeft = t.planExpiresAt ? Math.ceil((new Date(t.planExpiresAt) - new Date()) / (1000*60*60*24)) : null;
                  const isExpired = daysLeft !== null && daysLeft <= 0;
                  const sm = smStatusConfig[t.subMerchantStatus] || smStatusConfig.NOT_STARTED;
                  return (
                    <div key={t.id} style={{
                      background: t.isFrozen ? "rgba(56,189,248,0.03)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${t.isFrozen ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.06)"}`,
                      padding: "16px 20px",
                    }}>
                      {/* Üst satır: İsim + Plan + Aksiyonlar */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 20px", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ flex: "1 1 220px", minWidth: 200 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, fontSize: 15 }}>{t.businessName}</span>
                            {t.isFrozen && <Snowflake size={14} style={{ color: "#38bdf8" }} />}
                            {isExpired && <AlertTriangle size={14} style={{ color: "#f87171" }} />}
                          </div>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", display: "flex", gap: 12, flexWrap: "wrap" }}>
                            <span>{t.slug}.{domain}</span>
                            <span>{t.ownerEmail}</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                          <span>{t.reservationCount} rez</span>
                          <span>{t.userCount} üye</span>
                          <span>{t.packageCount} paket</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{
                            background: pc.bg, border: `1px solid ${pc.border}`, color: pc.text,
                            padding: "4px 10px", fontSize: 11, fontWeight: 700,
                            textTransform: "uppercase", letterSpacing: "0.05em"
                          }}>{t.plan}</span>
                          {daysLeft !== null && (
                            <span style={{ fontSize: 11, color: isExpired ? "#f87171" : "rgba(255,255,255,0.3)" }}>
                              {isExpired ? "Süresi doldu" : `${daysLeft}g`}
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <a href={`http://${t.slug}.${domain}/admin`} target="_blank" rel="noopener" style={smallBtn}><ExternalLink size={13} /></a>
                          <select value={t.plan} onChange={e => handlePlanChange(t.id, e.target.value)} disabled={actionLoading === t.id} style={{ ...smallBtn, width: 80, cursor: "pointer", appearance: "none", textAlign: "center" }}>
                            <option value="trial">Trial</option>
                            <option value="pro">Pro</option>
                          </select>
                          <button onClick={() => handleFreeze(t.id)} disabled={actionLoading === t.id} title={t.isFrozen ? "Aktifleştir" : "Dondur"} style={{ ...smallBtn, color: t.isFrozen ? "#4ade80" : "#38bdf8" }}>
                            <Snowflake size={13} />
                          </button>
                          <button onClick={() => handleDelete(t.id, t.businessName)} disabled={actionLoading === t.id} title="Sil" style={{ ...smallBtn, color: "#f87171" }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Alt satır: Komisyon + Sub-Merchant Durumu */}
                      <div style={{
                        display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center",
                        paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.04)",
                      }}>
                        {/* Komisyon Oranı */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Percent size={13} style={{ color: "rgba(255,255,255,0.35)" }} />
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>Komisyon:</span>
                          <input
                            type="number"
                            defaultValue={t.commissionRate ?? 5}
                            min={0} max={100} step={0.5}
                            onBlur={e => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val !== t.commissionRate) handleCommission(t.id, val);
                            }}
                            onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
                            disabled={actionLoading === t.id}
                            style={{
                              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                              color: "#fff", padding: "4px 8px", width: 56, fontSize: 13, fontWeight: 700,
                              textAlign: "center", outline: "none",
                            }}
                          />
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>%</span>
                        </div>

                        {/* Sub-Merchant Durumu */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
                          <span style={{
                            background: sm.bg, border: `1px solid ${sm.border}`, color: sm.color,
                            padding: "3px 10px", fontSize: 10, fontWeight: 700,
                            textTransform: "uppercase", letterSpacing: "0.04em",
                            display: "flex", alignItems: "center", gap: 4,
                          }}>
                            {t.subMerchantStatus === "APPROVED" ? <CheckCircle2 size={10} /> :
                             t.subMerchantStatus === "REJECTED" ? <XCircle size={10} /> :
                             t.subMerchantStatus === "PENDING" ? <Clock size={10} /> : null}
                            {sm.label}
                          </span>
                          {t.subMerchantStatus === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleSubMerchantStatus(t.id, "APPROVED")}
                                disabled={actionLoading === t.id}
                                title="Onayla"
                                style={{ ...smallBtn, color: "#4ade80", padding: "4px 8px" }}
                              >
                                <CheckCircle2 size={13} />
                              </button>
                              <button
                                onClick={() => handleSubMerchantStatus(t.id, "REJECTED")}
                                disabled={actionLoading === t.id}
                                title="Reddet"
                                style={{ ...smallBtn, color: "#f87171", padding: "4px 8px" }}
                              >
                                <XCircle size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {tenants.length === 0 && (
                  <div style={{ textAlign: "center", padding: 48, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Henüz stüdyo yok.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const iconBtn = {
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.5)", padding: 8, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center"
};
const smallBtn = {
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.5)", padding: "6px 10px", cursor: "pointer",
  fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
  textDecoration: "none"
};
const cardStyle = {
  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
  padding: "16px 18px"
};
const sectionTitle = {
  fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 20, color: "#fff"
};
