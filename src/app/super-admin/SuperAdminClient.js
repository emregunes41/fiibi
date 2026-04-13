"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, Users, Building2, CreditCard, Snowflake, Trash2,
  RefreshCw, LogOut, ExternalLink, Crown, AlertTriangle, Check, BarChart, Database, Cloud, Mail, HardDrive, Image, Zap
} from "lucide-react";
import {
  getAllTenants, getPlatformStats, toggleTenantFreeze,
  changeTenantPlan, deleteTenant, superAdminLogout
} from "@/app/actions/super-admin";
import { getCloudinaryUsage, getDbUsage, getResendUsage, getVercelUsage } from "@/app/actions/platform-usage";

export default function SuperAdminClient() {
  const [tenants, setTenants] = useState([]);
  const [stats, setStats] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const router = useRouter();

  const domain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "localhost:3000";

  async function loadData() {
    setLoading(true);
    const [t, s, cloudinary, db, resend, vercel] = await Promise.all([
      getAllTenants(), getPlatformStats(),
      getCloudinaryUsage(), getDbUsage(), getResendUsage(), getVercelUsage()
    ]);
    if (!t.error) setTenants(t);
    if (!s.error) setStats(s);
    setUsage({ cloudinary, db, resend, vercel });
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleFreeze(id) {
    setActionLoading(id);
    await toggleTenantFreeze(id);
    await loadData();
    setActionLoading(null);
  }

  async function handlePlanChange(id, plan) {
    setActionLoading(id);
    await changeTenantPlan(id, plan);
    await loadData();
    setActionLoading(null);
  }

  async function handleDelete(id, name) {
    if (!confirm(`"${name}" tenant'ını ve TÜM verilerini kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) return;
    if (!confirm("Son kez onaylayın: Bu tenant'a ait tüm rezervasyonlar, müşteriler, paketler ve ayarlar silinecek.")) return;
    setActionLoading(id);
    await deleteTenant(id);
    await loadData();
    setActionLoading(null);
  }

  async function handleLogout() {
    await superAdminLogout();
    router.push("/super-admin/login");
  }

  const planColors = {
    trial: { bg: "rgba(250,204,21,0.1)", border: "rgba(250,204,21,0.2)", text: "#facc15" },
    pro: { bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.2)", text: "#8b5cf6" },
  };

  function renderUsageBar(label, Icon, color, current, limit, unit, sub, pct) {
    const p = Math.min(100, Math.round(pct || (limit ? (current / limit) * 100 : 0)));
    const isWarning = p > 70;
    const isDanger = p > 90;
    return (
      <div style={usageCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon size={14} style={{ color }} />
            <span style={usageLabel}>{label}</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: isDanger ? "#f87171" : isWarning ? "#fbbf24" : "rgba(255,255,255,0.4)" }}>
            {p}%
          </span>
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

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", padding: "24px 16px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%", background: "rgba(139,92,246,0.1)",
              border: "1px solid rgba(139,92,246,0.2)", display: "flex",
              alignItems: "center", justifyContent: "center"
            }}>
              <Shield size={20} style={{ color: "#8b5cf6" }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>Super Admin</h1>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>Platform Yönetim Paneli</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={loadData} style={iconBtn}><RefreshCw size={16} /></button>
            <button onClick={handleLogout} style={{ ...iconBtn, color: "#f87171" }}><LogOut size={16} /></button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 32 }}>
            {[
              { label: "Toplam Stüdyo", value: stats.tenantCount, icon: Building2, color: "#8b5cf6" },
              { label: "Aktif", value: stats.activeCount, icon: Check, color: "#4ade80" },
              { label: "Dondurulmuş", value: stats.frozenCount, icon: Snowflake, color: "#38bdf8" },
              { label: "Trial", value: stats.trialCount, icon: CreditCard, color: "#facc15" },
              { label: "Toplam Rez.", value: stats.totalReservations, icon: Crown, color: "#f472b6" },
              { label: "Toplam Üye", value: stats.totalUsers, icon: Users, color: "#a78bfa" },
            ].map((s, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                padding: "16px 18px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <s.icon size={14} style={{ color: s.color }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Kaynak Kullanımı — Gerçek API Verileri */}
        {usage && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <BarChart size={15} style={{ color: "rgba(255,255,255,0.4)" }} />
              Kaynak Kullanımı
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>

              {/* Vercel */}
              {usage.vercel && !usage.vercel.error && (
                <>
                  {renderUsageBar("Vercel Bandwidth", HardDrive, "#4ade80",
                    usage.vercel.bandwidth.usedGB, usage.vercel.bandwidth.limitGB, "GB",
                    `${usage.vercel.plan === "pro" ? "Pro" : "Hobby"} · ~${usage.vercel.estimatedPageViews.toLocaleString("tr-TR")} sayfa/ay`,
                    usage.vercel.bandwidth.pct
                  )}
                  <div style={usageCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Zap size={14} style={{ color: "#4ade80" }} />
                        <span style={usageLabel}>Serverless Functions</span>
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

              {/* Cloudinary Storage */}
              {usage.cloudinary?.error ? (
                <div style={usageCard}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Cloud size={14} style={{ color: "#f472b6" }} />
                    <span style={usageLabel}>Cloudinary Depolama</span>
                    <span style={{ fontSize: 9, color: "#f87171", marginLeft: "auto", textTransform: "uppercase" }}>
                      {usage.cloudinary.missing ? "API Bağlı Değil" : "Hata"}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
                    .env dosyasına CLOUDINARY_API_KEY ve CLOUDINARY_API_SECRET ekleyin
                  </div>
                </div>
              ) : (
                <>
                  {renderUsageBar("Cloudinary Depolama", Cloud, "#f472b6",
                    usage.cloudinary.storage.usedGB, usage.cloudinary.storage.limitGB, "GB",
                    `Plan: ${usage.cloudinary.plan}`, usage.cloudinary.storage.pct
                  )}
                  {renderUsageBar("Cloudinary Bandwidth", HardDrive, "#a78bfa",
                    usage.cloudinary.bandwidth.usedGB, usage.cloudinary.bandwidth.limitGB, "GB",
                    "Aylık transfer", usage.cloudinary.bandwidth.pct
                  )}
                  {renderUsageBar("Dönüşümler", Image, "#38bdf8",
                    usage.cloudinary.transformations.used, usage.cloudinary.transformations.limit, "",
                    `${usage.cloudinary.objects.used} dosya`, usage.cloudinary.transformations.pct
                  )}
                </>
              )}

              {/* DB */}
              {usage.db?.error ? (
                <div style={usageCard}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Database size={14} style={{ color: "#8b5cf6" }} />
                    <span style={usageLabel}>Veritabanı</span>
                    <span style={{ fontSize: 9, color: "#f87171", marginLeft: "auto" }}>Hata</span>
                  </div>
                </div>
              ) : (
                <>
                  {renderUsageBar("Veritabanı Boyutu", Database, "#8b5cf6",
                    usage.db.estimatedSizeMB, usage.db.limitMB, "MB",
                    `${usage.db.totalRows.toLocaleString("tr-TR")} satır`, usage.db.pct
                  )}
                </>
              )}

              {/* Resend */}
              {usage.resend?.error ? (
                <div style={usageCard}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Mail size={14} style={{ color: "#facc15" }} />
                    <span style={usageLabel}>E-posta (Resend)</span>
                    <span style={{ fontSize: 9, color: "#f87171", marginLeft: "auto", textTransform: "uppercase" }}>
                      {usage.resend.missing ? "API Bağlı Değil" : "Hata"}
                    </span>
                  </div>
                </div>
              ) : (
                renderUsageBar("E-posta (Resend)", Mail, "#facc15",
                  usage.resend.emailsThisMonth, usage.resend.monthlyLimit, "",
                  `Günlük limit: ${usage.resend.dailyLimit}`, usage.resend.pct
                )
              )}

            </div>
          </div>
        )}

        {/* Tenant List */}
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Stüdyolar</h2>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{tenants.length} kayıt</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "rgba(255,255,255,0.3)" }}>Yükleniyor...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tenants.map(t => {
              const pc = planColors[t.plan] || planColors.trial;
              const daysLeft = t.planExpiresAt ? Math.ceil((new Date(t.planExpiresAt) - new Date()) / (1000*60*60*24)) : null;
              const isExpired = daysLeft !== null && daysLeft <= 0;

              return (
                <div key={t.id} style={{
                  background: t.isFrozen ? "rgba(56,189,248,0.03)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${t.isFrozen ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.06)"}`,
                  padding: "16px 20px", display: "flex", flexWrap: "wrap",
                  gap: "12px 20px", alignItems: "center"
                }}>
                  {/* Info */}
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

                  {/* Stats */}
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                    <span>{t.reservationCount} rez</span>
                    <span>{t.userCount} üye</span>
                    <span>{t.packageCount} paket</span>
                  </div>

                  {/* Plan Badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      background: pc.bg, border: `1px solid ${pc.border}`, color: pc.text,
                      padding: "4px 10px", fontSize: 11, fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.05em"
                    }}>
                      {t.plan}
                    </span>
                    {daysLeft !== null && (
                      <span style={{ fontSize: 11, color: isExpired ? "#f87171" : "rgba(255,255,255,0.3)" }}>
                        {isExpired ? "Süresi doldu" : `${daysLeft}g`}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <a href={`http://${t.slug}.${domain}/admin`} target="_blank" rel="noopener" style={smallBtn}>
                      <ExternalLink size={13} />
                    </a>
                    <select
                      value={t.plan}
                      onChange={e => handlePlanChange(t.id, e.target.value)}
                      disabled={actionLoading === t.id}
                      style={{ ...smallBtn, width: 80, cursor: "pointer", appearance: "none", textAlign: "center" }}
                    >
                      <option value="trial">Trial</option>
                      <option value="pro">Pro</option>
                    </select>
                    <button
                      onClick={() => handleFreeze(t.id)}
                      disabled={actionLoading === t.id}
                      title={t.isFrozen ? "Aktifleştir" : "Dondur"}
                      style={{ ...smallBtn, color: t.isFrozen ? "#4ade80" : "#38bdf8" }}
                    >
                      <Snowflake size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id, t.businessName)}
                      disabled={actionLoading === t.id}
                      title="Sil"
                      style={{ ...smallBtn, color: "#f87171" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}

            {tenants.length === 0 && (
              <div style={{ textAlign: "center", padding: 48, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
                Henüz hiç stüdyo oluşturulmamış.
              </div>
            )}
          </div>
        )}
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

const usageCard = {
  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
  padding: "16px 18px"
};

const usageLabel = {
  fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)"
};
