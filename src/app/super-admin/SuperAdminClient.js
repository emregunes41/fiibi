"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, Users, Building2, CreditCard, Snowflake, Trash2,
  RefreshCw, LogOut, ExternalLink, Crown, AlertTriangle, Check,
  BarChart, Database, Cloud, Mail, HardDrive, Image, Zap,
  DollarSign, Save, LayoutDashboard, Percent, CheckCircle2, XCircle, Clock, Key, Eye, X, FileText, Phone, Globe, Calendar,
  Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Banknote, Receipt, PiggyBank, ChevronDown, ChevronUp, Filter,
} from "lucide-react";
import {
  getAllTenants, getPlatformStats, toggleTenantFreeze,
  changeTenantPlan, deleteTenant, superAdminLogout,
  getPlatformPricing, updatePlatformPricing,
  updateTenantCommission, updateSubMerchantStatus, resetTenantAdminPassword,
  updateTenantField, impersonateTenant, getAccountingData
} from "@/app/actions/super-admin";
import { getCloudinaryUsage, getDbUsage, getResendUsage, getVercelUsage } from "@/app/actions/platform-usage";

const TABS = [
  { id: "overview", label: "Genel Bakış", icon: LayoutDashboard },
  { id: "accounting", label: "Muhasebe", icon: Wallet },
  { id: "usage", label: "Kaynak Kullanımı", icon: BarChart },
  { id: "pricing", label: "Fiyatlandırma", icon: DollarSign },
  { id: "tenants", label: "Kullanıcılar", icon: Users },
];

export default function SuperAdminClient() {
  const [tab, setTab] = useState("overview");
  const [tenants, setTenants] = useState([]);
  const [stats, setStats] = useState(null);
  const [usage, setUsage] = useState(null);
  const [pricing, setPricing] = useState({ 
    bio_monthly: 499, bio_yearly: 4999,
    basic_monthly: 1499, basic_yearly: 14999, 
    pro_monthly: 2999, pro_yearly: 29999 
  });
  const [pricingSaved, setPricingSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [infoModal, setInfoModal] = useState(null);
  const [accounting, setAccounting] = useState(null);
  const [accountingLoading, setAccountingLoading] = useState(false);
  const [accountingSort, setAccountingSort] = useState({ field: "totalSales", dir: "desc" });
  const [accountingFilter, setAccountingFilter] = useState("all"); // all, overdue, active, frozen
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

  async function loadAccounting() {
    setAccountingLoading(true);
    try {
      const data = await getAccountingData();
      if (data && !data.error) setAccounting(data);
    } catch (err) { console.error("accounting error:", err); }
    setAccountingLoading(false);
  }

  // Load accounting when tab switches to it
  useEffect(() => {
    if (tab === "accounting" && !accounting && !accountingLoading) {
      loadAccounting();
    }
  }, [tab]);

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
  async function handleResetPassword(id, name) {
    const newPass = prompt(`"${name}" adlı kullanıcının (admin paneli) yeni şifresini girin (en az 6 karakter):`);
    if (!newPass || newPass.length < 6) {
      if (newPass !== null) alert("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    setActionLoading(id);
    const res = await resetTenantAdminPassword(id, newPass);
    if (res.error) alert(res.error);
    else alert("Şifre başarıyla güncellendi.");
    setActionLoading(null);
  }
  // God Mode — generic field editor
  async function editField(id, field, label, currentValue) {
    const newVal = prompt(`${label} düzenle:`, currentValue || "");
    if (newVal === null || newVal === currentValue) return;
    setActionLoading(id);
    const res = await updateTenantField(id, field, newVal);
    if (res.error) alert(res.error);
    else { setInfoModal(prev => prev ? { ...prev, [field]: res.value } : null); await loadData(); }
    setActionLoading(null);
  }
  // God Mode — impersonate
  async function handleImpersonate(id) {
    setActionLoading(id);
    const res = await impersonateTenant(id);
    if (res.error) alert(res.error);
    else window.open(res.url, "_blank");
    setActionLoading(null);
  }

  const smStatusConfig = {
    NOT_STARTED: { label: "Başvuru Yok", color: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.06)" },
    PENDING: { label: "İnceleniyor", color: "#facc15", bg: "rgba(250,204,21,0.08)", border: "rgba(250,204,21,0.2)" },
    APPROVED: { label: "Onaylı", color: "#4ade80", bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.2)" },
    REJECTED: { label: "Reddedildi", color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" },
  };

  const planColors = {
    trial: { bg: "rgba(250,204,21,0.1)", border: "rgba(250,204,21,0.2)", text: "#facc15" },
    basic: { bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.2)", text: "#8b5cf6" },
    pro: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)", text: "#f59e0b" },
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
                    { label: "Toplam Kullanıcı", value: stats.tenantCount, icon: Users, color: "#8b5cf6" },
                    { label: "Aktif", value: stats.activeCount, icon: Check, color: "#4ade80" },
                    { label: "Dondurulmuş", value: stats.frozenCount, icon: Snowflake, color: "#38bdf8" },
                    { label: "Trial", value: stats.trialCount, icon: CreditCard, color: "#facc15" },
                    { label: "Toplam Rez.", value: stats.totalReservations, icon: Crown, color: "#f472b6" },
                    { label: "Toplam Üye", value: stats.totalUsers, icon: Users, color: "#a78bfa" },
                    { label: "Toplam Paket", value: stats.totalPackages, icon: Database, color: "#f87171" },
                    { label: "Toplam Foto", value: stats.totalPhotos, icon: Image, color: "#4ade80" },
                    { label: "Toplam Ödeme", value: stats.totalPayments, icon: Wallet, color: "#38bdf8" },
                    { label: "Toplam Banner", value: stats.totalBanners, icon: Image, color: "#fbbf24" },
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
              {usage && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                  {!usage.cloudinary?.error && renderUsageBar("Cloudinary", Cloud, "#f472b6", usage.cloudinary.storage.usedGB, usage.cloudinary.storage.limitGB, "GB", "Depolama", usage.cloudinary.storage.pct)}
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
                        : `~tahmini · ${usage.vercel.activeTenants} kullanıcı`,
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

          {/* ─── TAB: Muhasebe ─── */}
          {tab === "accounting" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={sectionTitle}>Muhasebe & Finans (Sadece Online Ödemeler)</h2>
                <button onClick={loadAccounting} disabled={accountingLoading} style={{ ...iconBtn, opacity: accountingLoading ? 0.5 : 1 }}>
                  <RefreshCw size={15} style={{ animation: accountingLoading ? "spin 1s linear infinite" : "none" }} />
                </button>
              </div>

              {accountingLoading && !accounting ? (
                <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>
                  <Wallet size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
                  <div style={{ fontSize: 13 }}>Muhasebe verileri yükleniyor...</div>
                </div>
              ) : accounting ? (
                <>
                  {/* Özet Kartlar */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 28 }}>
                    {[
                      { label: "Toplam Online Satış", value: `${accounting.summary.totalOnlinePayments.toLocaleString("tr-TR")}₺`, sub: "Tüm işletmeler (PayTR)", icon: Receipt, color: "#8b5cf6", gradient: "rgba(139,92,246,0.06)" },
                      { label: "PayTR Kesintisi", value: `${accounting.summary.totalPaytrFee.toLocaleString("tr-TR")}₺`, sub: `%${accounting.paytrFeeRate} komisyon`, icon: ArrowDownRight, color: "#f87171", gradient: "rgba(248,113,113,0.06)" },
                      { label: "Net Platform Kazancı", value: `${accounting.summary.totalNetPlatformEarning.toLocaleString("tr-TR")}₺`, sub: "PayTR kesintisi sonrası", icon: TrendingUp, color: "#4ade80", gradient: "rgba(74,222,128,0.06)" },
                      { label: "Valörde Bekleyen (Tenant)", value: `${accounting.summary.totalInValor.toLocaleString("tr-TR")}₺`, sub: "15 gün içinde aktarılacak", icon: Clock, color: "#facc15", gradient: "rgba(250,204,21,0.06)" },
                      { label: "Toplam Aktarılan", value: `${accounting.summary.totalTransferred.toLocaleString("tr-TR")}₺`, sub: "İşletmelere ödenen", icon: CheckCircle2, color: "#38bdf8", gradient: "rgba(56,189,248,0.06)" },
                      { label: "Ödeme Bekleyen Müşteriler", value: `${accounting.summary.totalPendingCollection.toLocaleString("tr-TR")}₺`, sub: "Online tahsilat bekleyen tutar", icon: AlertTriangle, color: "rgba(255,255,255,0.3)", gradient: "rgba(255,255,255,0.02)" },
                    ].map((c, i) => (
                      <div key={i} style={{ background: c.gradient, border: "1px solid rgba(255,255,255,0.06)", padding: "18px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                          <c.icon size={15} style={{ color: c.color }} />
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,255,255,0.4)" }}>{c.label}</span>
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{c.value}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{c.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Filtre + Sıralama */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                    <Filter size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                    {[
                      { id: "all", label: "Tümü" },
                      { id: "hasSales", label: "Online Satışı Var" },
                      { id: "hasValor", label: "Valörde Bekleyen Var" },
                      { id: "pendingCollection", label: "Tahsilat Bekleyen" },
                    ].map(f => (
                      <button key={f.id} onClick={() => setAccountingFilter(f.id)} style={{
                        padding: "6px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer",
                        background: accountingFilter === f.id ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${accountingFilter === f.id ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.06)"}`,
                        color: accountingFilter === f.id ? "#a78bfa" : "rgba(255,255,255,0.4)",
                        transition: "all 0.15s",
                      }}>{f.label}</button>
                    ))}
                  </div>

                  {/* Tenant Finans Tablosu */}
                  <div style={{ border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    {/* Header */}
                    <div style={{
                      display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr",
                      padding: "12px 16px", background: "rgba(255,255,255,0.03)",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                      color: "rgba(255,255,255,0.4)", gap: 8,
                    }}>
                      <span>İşletme</span>
                      {["onlineTotal", "netCommission", "inValor", "transferred", "pendingCollection"].map(field => {
                        const labels = { onlineTotal: "Toplam Online", netCommission: "Platform Net", inValor: "Valörde Bekleyen", transferred: "Aktarılan", pendingCollection: "Ödeme Bekleyen" };
                        const isActive = accountingSort.field === field;
                        return (
                          <button key={field} onClick={() => setAccountingSort(prev => ({ field, dir: prev.field === field && prev.dir === "desc" ? "asc" : "desc" }))} style={{
                            background: "none", border: "none", cursor: "pointer", padding: 0,
                            display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end",
                            fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                            color: isActive ? "#a78bfa" : "rgba(255,255,255,0.4)",
                          }}>
                            {labels[field]}
                            {isActive && (accountingSort.dir === "desc" ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                          </button>
                        );
                      })}
                    </div>

                    {/* Rows */}
                    {(() => {
                      let filtered = [...accounting.tenants];
                      if (accountingFilter === "hasSales") filtered = filtered.filter(t => t.onlineTotal > 0);
                      else if (accountingFilter === "hasValor") filtered = filtered.filter(t => t.inValor > 0);
                      else if (accountingFilter === "pendingCollection") filtered = filtered.filter(t => t.pendingCollection > 0);

                      // Update default sort field to avoid errors with new field names
                      const sortField = ["onlineTotal", "netCommission", "inValor", "transferred", "pendingCollection"].includes(accountingSort.field) ? accountingSort.field : "onlineTotal";

                      filtered.sort((a, b) => {
                        const dir = accountingSort.dir === "desc" ? -1 : 1;
                        return (a[sortField] - b[sortField]) * dir;
                      });

                      if (filtered.length === 0) return (
                        <div style={{ padding: 32, textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>Bu filtreye uygun işletme yok</div>
                      );

                      return filtered.map(t => {
                        return (
                          <div key={t.id} style={{
                            display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr",
                            padding: "14px 16px", gap: 8, alignItems: "center",
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                            background: "transparent",
                            transition: "background 0.15s",
                          }}>
                            {/* İşletme */}
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.businessName}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                                <span>{t.onlinePaymentCount} ödeme</span>
                                <span>Komisyon: %{t.commissionRate} (Net: %{t.netPlatformRate})</span>
                              </div>
                            </div>
                            {/* Toplam Online Satış */}
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: t.onlineTotal > 0 ? "#fff" : "rgba(255,255,255,0.2)" }}>{t.onlineTotal > 0 ? `${t.onlineTotal.toLocaleString("tr-TR")}₺` : "—"}</div>
                            </div>
                            {/* Platform Net Kazancı */}
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: t.netCommission > 0 ? "#4ade80" : "rgba(255,255,255,0.2)" }}>{t.netCommission > 0 ? `${t.netCommission.toLocaleString("tr-TR")}₺` : "—"}</div>
                            </div>
                            {/* Valörde */}
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: t.inValor > 0 ? "#facc15" : "rgba(255,255,255,0.15)" }}>{t.inValor > 0 ? `${t.inValor.toLocaleString("tr-TR")}₺` : "—"}</div>
                            </div>
                            {/* Aktarılan */}
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: t.transferred > 0 ? "#38bdf8" : "rgba(255,255,255,0.15)" }}>{t.transferred > 0 ? `${t.transferred.toLocaleString("tr-TR")}₺` : "—"}</div>
                            </div>
                            {/* Ödeme Bekleyen */}
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: t.pendingCollection > 0 ? "#f87171" : "rgba(255,255,255,0.12)" }}>{t.pendingCollection > 0 ? `${t.pendingCollection.toLocaleString("tr-TR")}₺` : "—"}</div>
                            </div>
                          </div>
                        );
                      });
                    })()}

                    {/* Footer Totals */}
                    <div style={{
                      display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr",
                      padding: "14px 16px", gap: 8, alignItems: "center",
                      borderTop: "2px solid rgba(255,255,255,0.1)",
                      background: "rgba(139,92,246,0.04)",
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>TOPLAM</div>
                      <div style={{ textAlign: "right", fontSize: 14, fontWeight: 800, color: "#fff" }}>{accounting.summary.totalOnlinePayments.toLocaleString("tr-TR")}₺</div>
                      <div style={{ textAlign: "right", fontSize: 14, fontWeight: 800, color: "#4ade80" }}>{accounting.summary.totalNetPlatformEarning.toLocaleString("tr-TR")}₺</div>
                      <div style={{ textAlign: "right", fontSize: 14, fontWeight: 800, color: "#facc15" }}>{accounting.summary.totalInValor.toLocaleString("tr-TR")}₺</div>
                      <div style={{ textAlign: "right", fontSize: 14, fontWeight: 800, color: "#38bdf8" }}>{accounting.summary.totalTransferred.toLocaleString("tr-TR")}₺</div>
                      <div style={{ textAlign: "right", fontSize: 14, fontWeight: 800, color: "#f87171" }}>{accounting.summary.totalPendingCollection.toLocaleString("tr-TR")}₺</div>
                    </div>
                  </div>
                </>
              ) : null}
            </>
          )}

          {/* ─── TAB: Fiyatlandırma ─── */}
          {tab === "pricing" && (
            <>
              <h2 style={sectionTitle}>Abonelik Fiyatları</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 16 }}>
                {[
                  { key: "bio_monthly", label: "Bio Aylık", suffix: "₺/ay", color: "#38bdf8" },
                  { key: "bio_yearly", label: "Bio Yıllık", suffix: "₺/yıl", color: "#38bdf8" },
                  { key: "basic_monthly", label: "Basic Aylık", suffix: "₺/ay", color: "#8b5cf6" },
                  { key: "basic_yearly", label: "Basic Yıllık", suffix: "₺/yıl", color: "#8b5cf6" },
                  { key: "pro_monthly", label: "Pro Aylık", suffix: "₺/ay", color: "#f59e0b" },
                  { key: "pro_yearly", label: "Pro Yıllık", suffix: "₺/yıl", color: "#f59e0b" },
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

          {/* ─── TAB: Kullanıcılar ─── */}
          {tab === "tenants" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ ...sectionTitle, marginBottom: 0 }}>Kullanıcılar</h2>
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
                            <option value="basic">Basic</option>
                            <option value="pro">Pro</option>
                          </select>
                          <button onClick={() => handleFreeze(t.id)} disabled={actionLoading === t.id} title={t.isFrozen ? "Aktifleştir" : "Dondur"} style={{ ...smallBtn, color: t.isFrozen ? "#4ade80" : "#38bdf8" }}>
                            <Snowflake size={13} />
                          </button>
                          <button onClick={() => handleResetPassword(t.id, t.businessName)} disabled={actionLoading === t.id} title="Şifre Sıfırla" style={{ ...smallBtn, color: "#a78bfa" }}>
                            <Key size={13} />
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
                          <button
                            onClick={() => setInfoModal(t)}
                            style={{ ...smallBtn, color: "#fff", background: "rgba(255,255,255,0.1)", padding: "4px 8px" }}
                            title="Bilgileri İncele"
                          >
                            <Eye size={13} />
                          </button>
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

                      {/* Abonelik & Ödeme Bilgileri */}
                      <div style={{
                        display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center",
                        paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.04)",
                        fontSize: 11, color: "rgba(255,255,255,0.35)",
                      }}>
                        <span title="Son Ödeme">💳 {t.lastPaymentAt ? new Date(t.lastPaymentAt).toLocaleDateString("tr-TR") : "—"}</span>
                        <span title="Sonraki Ödeme">📅 {t.nextPaymentAt ? new Date(t.nextPaymentAt).toLocaleDateString("tr-TR") : "—"}</span>
                        <span title="Kart Durumu" style={{ color: t.paytrCtoken ? "#4ade80" : "rgba(255,255,255,0.2)" }}>{t.paytrCtoken ? "🔒 Kart Kayıtlı" : "Kart Yok"}</span>
                        <span title="IBAN" style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{t.iban ? `TR••${t.iban.slice(-4)}` : "IBAN Yok"}</span>
                      </div>
                    </div>
                  );
                })}
                {tenants.length === 0 && (
                  <div style={{ textAlign: "center", padding: 48, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Henüz kullanıcı yok.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Info Modal */}
      {infoModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24
        }} onClick={() => setInfoModal(null)}>
          <div style={{
            background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 0,
            width: "100%", maxWidth: 600, padding: 24, maxHeight: "90vh", overflowY: "auto"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Shield size={20} style={{ color: "#f59e0b" }} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>God Mode — {infoModal.businessName}</h3>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleImpersonate(infoModal.id)} style={{ ...smallBtn, color: "#4ade80", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", padding: "6px 14px", fontSize: 11, fontWeight: 700, gap: 6, display: "flex", alignItems: "center" }}>
                  <ExternalLink size={12} /> Admin Panele Gir
                </button>
                <button onClick={() => setInfoModal(null)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}><X size={20} /></button>
              </div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* GENEL & İLETİŞİM — Tümü Düzenlenebilir */}
              <div>
                <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 8 }}>GENEL & İLETİŞİM</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {[
                    { field: "businessName", label: "İşletme Adı", value: infoModal.businessName },
                    { field: "ownerName", label: "Sahibi", value: infoModal.ownerName },
                    { field: "ownerEmail", label: "E-Posta", value: infoModal.ownerEmail },
                    { field: "ownerPhone", label: "Telefon", value: infoModal.ownerPhone },
                    { field: "businessType", label: "İşletme Türü", value: infoModal.businessType },
                    { field: "customDomain", label: "Özel Domain", value: infoModal.customDomain },
                  ].map((item) => (
                    <div key={item.field} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 1 }}>{item.label}</div>
                        <div style={{ fontSize: 13, color: "#fff", fontWeight: 500, wordBreak: "break-all" }}>{item.value || "—"}</div>
                      </div>
                      <button onClick={() => editField(infoModal.id, item.field, item.label, item.value)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", padding: 4, fontSize: 14 }} title="Düzenle">✏️</button>
                    </div>
                  ))}
                  {/* Slug — özel gösterim */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.1)" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 1 }}>Site Adresi (Slug)</div>
                      <div style={{ fontSize: 13, color: "#fff", fontWeight: 500, fontFamily: "monospace" }}>
                        <span style={{ color: "#8b5cf6" }}>{infoModal.slug}</span><span style={{ color: "rgba(255,255,255,0.25)" }}>.{domain}</span>
                      </div>
                    </div>
                    <button onClick={() => editField(infoModal.id, "slug", "Slug", infoModal.slug)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", padding: 4, fontSize: 14 }} title="Düzenle">✏️</button>
                  </div>
                </div>
              </div>

              {/* ABONELİK & DURUM */}
              <div>
                <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 8 }}>ABONELİK & DURUM</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {[
                    { label: "Mevcut Plan", value: infoModal.plan?.toUpperCase() },
                    { label: "Ödeme Periyodu", value: infoModal.selectedPlan === "yearly" ? "Yıllık" : infoModal.selectedPlan === "monthly" ? "Aylık" : "—" },
                    { label: "Başlangıç", value: infoModal.subscriptionStartedAt ? new Date(infoModal.subscriptionStartedAt).toLocaleDateString() : "—" },
                    { label: "Bitiş Tarihi", value: infoModal.planExpiresAt ? new Date(infoModal.planExpiresAt).toLocaleDateString() : "—" },
                    { label: "Kayıt Tarihi", value: new Date(infoModal.createdAt).toLocaleDateString() },
                    { label: "Durum", value: infoModal.isActive ? (infoModal.isFrozen ? "Dondurulmuş" : "Aktif") : "Pasif" },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: "8px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 1 }}>{item.label}</div>
                      <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ticari Bilgiler */}
              <div>
                <h4 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 8 }}>TİCARİ & VERGİ BİLGİLERİ</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {[
                    { label: "Resmi Ünvan", value: infoModal.legalName || "-" },
                    { label: "Şirket Tipi", value: infoModal.legalType === "personal" ? "Bireysel" : infoModal.legalType === "sole_proprietorship" ? "Şahıs Şirketi" : infoModal.legalType === "limited" ? "Limited" : infoModal.legalType === "joint_stock" ? "Anonim" : infoModal.legalType },
                    { label: "TCKN / VKN", value: infoModal.taxId || "-" },
                    { label: "Vergi Dairesi", value: infoModal.taxOffice || "-" },
                    { label: "IBAN", value: infoModal.iban || "-" },
                    { label: "Vergi Levhası", value: infoModal.taxPlateUrl ? <a href={infoModal.taxPlateUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#38bdf8", textDecoration: "underline" }}>Görüntüle</a> : "Yüklenmedi" },
                    { label: "Sözleşme Onayı", value: infoModal.sellerAgreementAccepted ? `Onaylandı (${new Date(infoModal.sellerAgreementDate).toLocaleDateString()})` : "Onaylanmadı" },
                    { label: "Resmi Adres", value: infoModal.legalAddress || "-", fullWidth: true },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: item.fullWidth ? "1 / -1" : "auto" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{item.label}</span>
                      <span style={{ fontSize: 14, color: "#fff", fontWeight: 500 }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {infoModal.subMerchantStatus === "PENDING" && (
              <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
                <button
                  onClick={async () => { await handleSubMerchantStatus(infoModal.id, "APPROVED"); setInfoModal(null); }}
                  style={{ flex: 1, padding: 12, background: "#4ade80", color: "#000", border: "none", fontWeight: 800, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
                >
                  <CheckCircle2 size={16} /> Onayla
                </button>
                <button
                  onClick={async () => { await handleSubMerchantStatus(infoModal.id, "REJECTED"); setInfoModal(null); }}
                  style={{ flex: 1, padding: 12, background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)", fontWeight: 800, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
                >
                  <XCircle size={16} /> Reddet
                </button>
              </div>
            )}
          </div>
        </div>
      )}
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
