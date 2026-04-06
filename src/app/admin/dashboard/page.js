import { LayoutDashboard, Users, Package, Calendar, Clock, ChevronRight, Bell, CheckCircle, Wallet, Banknote, CreditCard, ArrowUpRight, ArrowDownRight, TrendingUp, PiggyBank } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { markNotificationAsRead, clearAllNotifications } from "../notification-actions";
import NotificationList from "../components/NotificationList";

export default async function AdminDashboard() {
  // Fetch quick stats
  const totalPackages = await prisma.photographyPackage.count();
  const totalReservations = await prisma.reservation.count({ where: { status: { not: "DELETED" } } });
  const pendingReservations = await prisma.reservation.count({ where: { status: "PENDING" } });
  const totalMembers = await prisma.user.count();

  // Fetch recent reservations
  const recentReservations = await prisma.reservation.findMany({
    where: { status: { not: "DELETED" } },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { packages: true }
  });

  // Fetch recent notifications
  const notifications = await prisma.adminNotification.findMany({
    orderBy: { createdAt: "desc" },
    take: 10
  });

  // Fetch upcoming deliveries
  const upcomingDeliveries = await prisma.reservation.findMany({
    where: { 
      status: "CONFIRMED", 
      workflowStatus: { not: "COMPLETED" },
      deliveryDate: { not: null }
    },
    orderBy: { deliveryDate: "asc" },
    take: 5,
    include: { packages: true }
  });

  const getDaysLeftInfo = (date) => {
    if (!date) return { text: "-", color: "gray" };
    const diffTime = new Date(date).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: `${Math.abs(diffDays)} GÜN GECİKTİ`, color: "#EF4444" };
    if (diffDays === 0) return { text: "BUGÜN TESLİM", color: "#F59E0B" };
    if (diffDays <= 3) return { text: `${diffDays} GÜN KALDI`, color: "#F59E0B" };
    return { text: `${diffDays} GÜN KALDI`, color: "#10B981" };
  };

  // ──────────── MUHASEBE VERİLERİ ────────────
  // Fetch ALL payments
  const allPayments = await prisma.payment.findMany({
    include: { reservation: { select: { status: true, brideName: true, totalAmount: true } } }
  });

  // Only count payments from non-deleted reservations
  const validPayments = allPayments.filter(p => p.reservation?.status !== "DELETED");

  // Total cash in (all payments received)
  const totalCashIn = validPayments.reduce((sum, p) => sum + p.amount, 0);

  // Break down by method
  const byMethod = {
    CASH: 0,
    BANK_TRANSFER: 0,
    CREDIT_CARD: 0,
    ONLINE: 0,
  };
  validPayments.forEach(p => {
    const m = p.method || "CASH";
    if (byMethod[m] !== undefined) byMethod[m] += p.amount;
    else byMethod.CASH += p.amount;
  });

  // This month's payments
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthPayments = validPayments.filter(p => new Date(p.createdAt) >= startOfMonth);
  const thisMonthTotal = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);

  // Last month's payments for comparison
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastMonthPayments = validPayments.filter(p => {
    const d = new Date(p.createdAt);
    return d >= startOfLastMonth && d <= endOfLastMonth;
  });
  const lastMonthTotal = lastMonthPayments.reduce((sum, p) => sum + p.amount, 0);
  const monthChange = lastMonthTotal > 0 ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100) : (thisMonthTotal > 0 ? 100 : 0);

  // Outstanding balance (total expected - total paid)
  const allActiveReservations = await prisma.reservation.findMany({
    where: { status: { in: ["PENDING", "CONFIRMED"] } },
    select: { totalAmount: true },
    
  });
  const totalExpected = allActiveReservations.reduce((sum, r) => {
    const amt = parseFloat(r.totalAmount?.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || '0');
    return sum + amt;
  }, 0);
  const totalOutstanding = Math.max(0, totalExpected - totalCashIn);

  // Recent payments (last 6)
  const recentPayments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    include: { reservation: { select: { brideName: true, groomName: true } } }
  });

  const monthNames = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
  const fmt = (n) => n.toLocaleString("tr-TR");
  const methodLabels = { CASH: "Nakit", BANK_TRANSFER: "Havale/EFT", CREDIT_CARD: "Kredi Kartı", ONLINE: "Online" };
  const methodIcons = { CASH: "💵", BANK_TRANSFER: "🏦", CREDIT_CARD: "💳", ONLINE: "🌐" };
  const methodColors = { CASH: "#4ade80", BANK_TRANSFER: "#60a5fa", CREDIT_CARD: "#f59e0b", ONLINE: "#a78bfa" };

  return (
    <div style={{ color: "#fff" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "clamp(1.2rem, 4vw, 1.8rem)", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: "4px" }}>Genel Bakış</h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.75rem" }}>Pinowed yönetim paneli</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "1.5rem" }}>
        
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "12px", borderRadius: "10px" }}>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.6rem", fontWeight: 800, marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px", textTransform: "uppercase" }}>
            <Package size={11} /> Paket
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{totalPackages}</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "12px", borderRadius: "10px" }}>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.6rem", fontWeight: 800, marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px", textTransform: "uppercase" }}>
            <Calendar size={11} /> Randevu
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{totalReservations}</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "12px", borderRadius: "10px" }}>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.6rem", fontWeight: 800, marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px", textTransform: "uppercase" }}>
            <Users size={11} /> Üye
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{totalMembers}</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", padding: "12px", borderRadius: "10px" }}>
          <div style={{ color: "#fff", fontSize: "0.6rem", fontWeight: 900, marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px", textTransform: "uppercase" }}>
            <Clock size={11} /> Bekleyen
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{pendingReservations}</div>
        </div>
      </div>

      {/* Notifications Widget */}
      <NotificationList notifications={notifications} />

      {/* MUHASEBE + SON REZERVASYONLAR (2 sütun) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px", marginBottom: "1.25rem" }}>
        
        {/* ══════ MUHASEBE PANELİ ══════ */}
        <div style={{ background: "linear-gradient(145deg, #0d1117 0%, #000 100%)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: "14px", padding: "18px", display: "flex", flexDirection: "column", gap: "14px" }}>
          
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(74,222,128,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PiggyBank size={14} style={{ color: "#4ade80" }} />
              </div>
              <span style={{ fontWeight: 900, fontSize: "0.85rem", color: "#fff" }}>Muhasebe</span>
            </div>
            <span style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>TÜM ZAMANLAR</span>
          </div>

          {/* Toplam Gelir */}
          <div style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.12)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(74,222,128,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Toplam Gelen Para
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#4ade80", letterSpacing: "-0.02em" }}>
              {fmt(Math.round(totalCashIn))} <span style={{ fontSize: "0.8rem", fontWeight: 700, opacity: 0.7 }}>₺</span>
            </div>
            <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
              {validPayments.length} adet ödeme işlemi
            </div>
          </div>

          {/* Bu Ay vs Geçen Ay */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px" }}>
              <div style={{ fontSize: "0.55rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 4 }}>
                {monthNames[now.getMonth()]}
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#fff" }}>{fmt(Math.round(thisMonthTotal))}₺</div>
              {monthChange !== 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 2, marginTop: 4, fontSize: "0.55rem", fontWeight: 800, color: monthChange > 0 ? "#4ade80" : "#ef4444" }}>
                  {monthChange > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  %{Math.abs(monthChange)} {monthChange > 0 ? "artış" : "azalış"}
                </div>
              )}
            </div>
            <div style={{ background: "rgba(250,204,21,0.04)", border: "1px solid rgba(250,204,21,0.1)", borderRadius: 10, padding: "12px" }}>
              <div style={{ fontSize: "0.55rem", fontWeight: 800, color: "rgba(250,204,21,0.6)", textTransform: "uppercase", marginBottom: 4 }}>
                Kalan Bakiye
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#facc15" }}>{fmt(Math.round(totalOutstanding))}₺</div>
              <div style={{ fontSize: "0.5rem", color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
                Aktif rezervasyonlardan
              </div>
            </div>
          </div>

          {/* Ödeme Yöntemine Göre Dağılım */}
          <div>
            <div style={{ fontSize: "0.55rem", fontWeight: 800, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Yönteme Göre Dağılım
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Object.entries(byMethod).filter(([_, v]) => v > 0).map(([method, amount]) => {
                const pct = totalCashIn > 0 ? (amount / totalCashIn) * 100 : 0;
                return (
                  <div key={method}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: "0.7rem" }}>{methodIcons[method]}</span>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{methodLabels[method]}</span>
                      </div>
                      <span style={{ fontSize: "0.65rem", fontWeight: 800, color: methodColors[method] }}>{fmt(Math.round(amount))}₺</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 2, background: methodColors[method], width: `${pct}%`, transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                );
              })}
              {Object.values(byMethod).every(v => v === 0) && (
                <div style={{ textAlign: "center", padding: "10px", color: "rgba(255,255,255,0.3)", fontSize: "0.65rem" }}>Henüz ödeme yok</div>
              )}
            </div>
          </div>

          {/* Son Ödemeler */}
          <div>
            <div style={{ fontSize: "0.55rem", fontWeight: 800, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Son Ödemeler
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {recentPayments.map(p => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderRadius: 6, background: "rgba(255,255,255,0.03)" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.reservation?.brideName || "—"}
                    </div>
                    <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.4)" }}>
                      {methodLabels[p.method] || p.method} · {new Date(p.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                  <span style={{ fontSize: "0.7rem", fontWeight: 900, color: "#4ade80", flexShrink: 0 }}>+{fmt(Math.round(p.amount))}₺</span>
                </div>
              ))}
              {recentPayments.length === 0 && (
                <div style={{ textAlign: "center", padding: "10px", color: "rgba(255,255,255,0.3)", fontSize: "0.65rem" }}>Henüz ödeme yok</div>
              )}
            </div>
          </div>
        </div>

        {/* ══════ SON REZERVASYONLAR ══════ */}
        <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontWeight: 900, fontSize: "0.8rem" }}>Son Rezervasyonlar</span>
            <Link href="/admin/reservations" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.6rem", fontWeight: 800, textDecoration: "none", display: "flex", alignItems: "center", gap: "2px" }}>
              TÜMÜ <ChevronRight size={10} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {recentReservations.map((res) => (
              <div key={res.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.08)" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700 }}>{res.brideName}</div>
                  <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.5)" }}>{new Date(res.eventDate).toLocaleDateString("tr-TR")}</div>
                </div>
                <span style={{
                  padding: "2px 6px", borderRadius: "4px", fontSize: "0.55rem", fontWeight: 800,
                  background: res.status === "CONFIRMED" ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)",
                  color: res.status === "CONFIRMED" ? "#34d399" : "rgba(255,255,255,0.4)",
                }}>{res.status === "CONFIRMED" ? "ONAYLI" : "BEKLEMEDE"}</span>
              </div>
            ))}
            {recentReservations.length === 0 && (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>Kayıt yok</div>
            )}
          </div>
        </div>
      </div>

      {/* Yaklaşan Teslimatlar */}
      <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,191,36,0.2)", borderRadius: "12px", padding: "14px", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
          <Calendar size={13} style={{ color: "#FBBF24" }} />
          <span style={{ fontWeight: 900, fontSize: "0.8rem", color: "#FBBF24" }}>Yaklaşan Teslimatlar</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {upcomingDeliveries.map((res) => {
            const info = getDaysLeftInfo(res.deliveryDate);
            const statusMap = { "PENDING": "Çekim Bekleniyor", "SHOT_DONE": "Düzenlemede", "EDITING": "Düzenlemede", "SELECTION_PENDING": "Seçim Bekleniyor", "DELIVERED": "Teslim Edildi" };
            return (
              <div key={res.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{res.brideName} {res.groomName ? `& ${res.groomName}` : ''}</div>
                  <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.5)" }}>
                    {new Date(res.eventDate).toLocaleDateString("tr-TR")} → {new Date(res.deliveryDate).toLocaleDateString("tr-TR")}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px", flexShrink: 0 }}>
                  <span style={{ fontSize: "0.6rem", fontWeight: 900, color: info.color }}>{info.text}</span>
                  <span style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.5)" }}>{statusMap[res.workflowStatus] || res.workflowStatus}</span>
                </div>
              </div>
            );
          })}
          {upcomingDeliveries.length === 0 && (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>Yaklaşan teslimat yok 🎉</div>
          )}
        </div>
      </div>
    </div>
  );
}
