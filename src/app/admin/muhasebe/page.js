import { prisma } from "@/lib/prisma";
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Banknote, CreditCard, PiggyBank, Receipt, Calendar, Users } from "lucide-react";

export default async function MuhasebePage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // ─── ALL PAYMENTS ───
  const allPayments = await prisma.payment.findMany({
    include: { 
      reservation: { 
        select: { status: true, brideName: true, groomName: true, totalAmount: true, paymentPreference: true, packages: { select: { name: true, category: true } } } 
      } 
    },
    orderBy: { createdAt: "desc" }
  });

  const validPayments = allPayments.filter(p => p.reservation?.status !== "DELETED");

  // ─── TOPLAM GELİR ───
  const totalCashIn = validPayments.reduce((sum, p) => sum + p.amount, 0);

  // ─── YÖNTEME GÖRE DAĞILIM ───
  const byMethod = { CASH: 0, BANK_TRANSFER: 0, CREDIT_CARD: 0, ONLINE: 0 };
  const byMethodCount = { CASH: 0, BANK_TRANSFER: 0, CREDIT_CARD: 0, ONLINE: 0 };
  validPayments.forEach(p => {
    const m = p.method || "CASH";
    if (byMethod[m] !== undefined) { byMethod[m] += p.amount; byMethodCount[m]++; }
    else { byMethod.CASH += p.amount; byMethodCount.CASH++; }
  });

  // ─── AYLIK DAĞILIM (Bu yıl) ───
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: i,
    total: 0,
    count: 0,
  }));
  validPayments.forEach(p => {
    const d = new Date(p.createdAt);
    if (d.getFullYear() === currentYear) {
      monthlyData[d.getMonth()].total += p.amount;
      monthlyData[d.getMonth()].count++;
    }
  });
  const maxMonthly = Math.max(...monthlyData.map(m => m.total), 1);

  // ─── BU AY vs GEÇEN AY ───
  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
  const endOfLastMonth = new Date(currentYear, currentMonth, 0);

  const thisMonthPayments = validPayments.filter(p => new Date(p.createdAt) >= startOfMonth);
  const thisMonthTotal = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);

  const lastMonthPayments = validPayments.filter(p => {
    const d = new Date(p.createdAt);
    return d >= startOfLastMonth && d <= endOfLastMonth;
  });
  const lastMonthTotal = lastMonthPayments.reduce((sum, p) => sum + p.amount, 0);
  const monthChange = lastMonthTotal > 0 ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100) : (thisMonthTotal > 0 ? 100 : 0);

  // ─── KALAN BAKİYELER ───
  const activeReservations = await prisma.reservation.findMany({
    where: { status: { in: ["PENDING", "CONFIRMED"] } },
    select: { 
      id: true, brideName: true, groomName: true, totalAmount: true, 
      paymentPreference: true, eventDate: true, 
      packages: { select: { name: true } },
      payments: { select: { amount: true } }
    }
  });

  const reservationBalances = activeReservations.map(r => {
    const total = parseFloat(r.totalAmount?.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || '0');
    const paid = r.payments.reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(0, total - paid);
    return { ...r, total, paid, remaining };
  }).filter(r => r.remaining > 0).sort((a, b) => a.eventDate - b.eventDate);

  const totalExpected = reservationBalances.reduce((s, r) => s + r.total, 0);
  const totalOutstanding = reservationBalances.reduce((s, r) => s + r.remaining, 0);

  // ─── KATEGORİYE GÖRE GELİR ───
  const byCategory = {};
  validPayments.forEach(p => {
    const cats = p.reservation?.packages?.map(pkg => pkg.category) || ["DİĞER"];
    const uniqueCats = [...new Set(cats)];
    const share = p.amount / uniqueCats.length;
    uniqueCats.forEach(c => {
      if (!byCategory[c]) byCategory[c] = 0;
      byCategory[c] += share;
    });
  });

  // ─── SON 20 ÖDEME ───
  const recentPayments = validPayments.slice(0, 20);

  // ─── HELPERS ───
  const fmt = (n) => Math.round(n).toLocaleString("tr-TR");
  const monthNames = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
  const methodLabels = { CASH: "Nakit", BANK_TRANSFER: "Havale / EFT", CREDIT_CARD: "Kredi Kartı", ONLINE: "Online Ödeme" };
  const methodIcons = { CASH: "💵", BANK_TRANSFER: "🏦", CREDIT_CARD: "💳", ONLINE: "🌐" };
  const methodColors = { CASH: "#fff", BANK_TRANSFER: "rgba(255,255,255,0.5)", CREDIT_CARD: "#f59e0b", ONLINE: "rgba(255,255,255,0.6)" };
  const catLabels = { DIS_CEKIM: "Dış Çekim", DUGUN: "Düğün", NISAN: "Nişan" };
  const catColors = { DIS_CEKIM: "#f59e0b", DUGUN: "#fb7185", NISAN: "#67e8f9" };

  return (
    <div style={{ color: "#fff", maxWidth: "100%", overflowX: "hidden" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <div style={{ width: 36, height: 36, borderRadius: 0, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PiggyBank size={18} style={{ color: "#fff" }} />
          </div>
          <h1 style={{ fontSize: "clamp(1.2rem, 4vw, 1.8rem)", fontWeight: 900, letterSpacing: "-0.04em", margin: 0 }}>Muhasebe</h1>
        </div>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.75rem", margin: 0 }}>Finansal genel bakış ve ödeme takibi</p>
      </div>

      {/* ═══ TOP SUMMARY CARDS ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "1.5rem" }}>
        
        {/* Toplam Gelir */}
        <div style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.4) 100%)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 0, padding: "18px" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
            <TrendingUp size={10} /> Toplam Gelir
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#fff" }}>{fmt(totalCashIn)}<span style={{ fontSize: "0.8rem", opacity: 0.7 }}>₺</span></div>
          <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{validPayments.length} ödeme işlemi</div>
        </div>

        {/* Bu Ay */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, padding: "18px" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            {monthNames[currentMonth]} Geliri
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#fff" }}>{fmt(thisMonthTotal)}<span style={{ fontSize: "0.8rem", opacity: 0.5 }}>₺</span></div>
          {monthChange !== 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 4, fontSize: "0.6rem", fontWeight: 800, color: monthChange > 0 ? "#fff" : "rgba(255,255,255,0.5)" }}>
              {monthChange > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              %{Math.abs(monthChange)} {monthChange > 0 ? "artış" : "azalış"} · geçen aya göre
            </div>
          )}
        </div>

        {/* Tahsil Edilecek */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 0, padding: "18px" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
            <Receipt size={10} /> Tahsil Edilecek
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "rgba(255,255,255,0.7)" }}>{fmt(totalOutstanding)}<span style={{ fontSize: "0.8rem", opacity: 0.7 }}>₺</span></div>
          <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{reservationBalances.length} açık rezervasyon</div>
        </div>

        {/* Beklenen Toplam */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, padding: "18px" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Aktif Toplam Tutar
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#fff" }}>{fmt(totalExpected)}<span style={{ fontSize: "0.8rem", opacity: 0.5 }}>₺</span></div>
          <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Aktif rezervasyonlar toplamı</div>
        </div>
      </div>

      {/* ═══ AYLIK GRAFİK + YÖNTEM DAĞILIMI ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px", marginBottom: "1.5rem" }}>
        
        {/* Aylık Gelir Grafiği */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, padding: "18px" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 900, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
            <Calendar size={13} style={{ color: "rgba(255,255,255,0.5)" }} />
            Aylık Gelir — {currentYear}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120 }}>
            {monthlyData.map((m, i) => {
              const h = maxMonthly > 0 ? (m.total / maxMonthly) * 100 : 0;
              const isCurrentMonth = i === currentMonth;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: "0.5rem", fontWeight: 800, color: m.total > 0 ? "#fff" : "rgba(255,255,255,0.2)" }}>
                    {m.total > 0 ? `${fmt(m.total / 1000)}K` : ""}
                  </div>
                  <div style={{ 
                    width: "100%", maxWidth: 28, borderRadius: "4px 4px 2px 2px", 
                    height: `${Math.max(h, 2)}%`, minHeight: 3,
                    background: isCurrentMonth 
                      ? "linear-gradient(180deg, #fff, #22c55e)" 
                      : m.total > 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.04)",
                    transition: "height 0.5s ease",
                    boxShadow: isCurrentMonth ? "0 0 12px rgba(74,222,128,0.3)" : "none"
                  }} />
                  <div style={{ 
                    fontSize: "0.5rem", fontWeight: 700, 
                    color: isCurrentMonth ? "#fff" : "rgba(255,255,255,0.3)" 
                  }}>
                    {monthNames[i].substring(0, 3)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ödeme Yöntemi Dağılımı */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, padding: "18px" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 900, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
            <Wallet size={13} style={{ color: "rgba(255,255,255,0.5)" }} />
            Ödeme Yöntemi Dağılımı
          </div>
          
          {/* Pie-like visual bar */}
          {totalCashIn > 0 && (
            <div style={{ display: "flex", height: 10, borderRadius: 0, overflow: "hidden", marginBottom: 16 }}>
              {Object.entries(byMethod).filter(([_, v]) => v > 0).map(([method, amount]) => (
                <div key={method} style={{ width: `${(amount / totalCashIn) * 100}%`, background: methodColors[method], transition: "width 0.5s" }} />
              ))}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(byMethod).map(([method, amount]) => {
              const pct = totalCashIn > 0 ? ((amount / totalCashIn) * 100).toFixed(1) : "0";
              return (
                <div key={method} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: "1.1rem", width: 28, textAlign: "center" }}>{methodIcons[method]}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>{methodLabels[method]}</span>
                      <span style={{ fontSize: "0.7rem", fontWeight: 900, color: methodColors[method] }}>{fmt(amount)}₺</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ flex: 1, height: 4, borderRadius: 0, background: "rgba(255,255,255,0.06)" }}>
                        <div style={{ height: "100%", borderRadius: 0, background: methodColors[method], width: `${pct}%`, transition: "width 0.5s" }} />
                      </div>
                      <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", width: 28, textAlign: "right" }}>%{pct}</span>
                    </div>
                    <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{byMethodCount[method]} işlem</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ KATEGORİ GELİRİ + AÇIK BAKİYELER ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px", marginBottom: "1.5rem" }}>

        {/* Kategoriye Göre Gelir */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, padding: "18px" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 900, marginBottom: 16 }}>Hizmet Kategorisine Göre</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => {
              const label = catLabels[cat] || cat;
              const color = catColors[cat] || "#888";
              const pct = totalCashIn > 0 ? (amount / totalCashIn) * 100 : 0;
              return (
                <div key={cat}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 0, background: color }} />
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>{label}</span>
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 900, color }}>{fmt(amount)}₺</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 0, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 0, background: `linear-gradient(90deg, ${color}, ${color}88)`, width: `${pct}%`, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(byCategory).length === 0 && (
              <div style={{ textAlign: "center", padding: "20px", color: "rgba(255,255,255,0.3)", fontSize: "0.7rem" }}>Veri yok</div>
            )}
          </div>
        </div>

        {/* Açık Bakiyeler */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 0, padding: "18px" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 900, marginBottom: 4, color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 6 }}>
            <Receipt size={13} />
            Açık Bakiyeler
          </div>
          <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>Ödenmemiş kalan tutarlar</div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {reservationBalances.slice(0, 10).map(r => {
              const paidPct = r.total > 0 ? (r.paid / r.total) * 100 : 0;
              return (
                <div key={r.id} style={{ padding: "10px 12px", borderRadius: 0, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.brideName} {r.groomName ? `& ${r.groomName}` : ''}
                      </div>
                      <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.4)" }}>
                        {new Date(r.eventDate).toLocaleDateString("tr-TR")} · {r.packages?.map(p => p.name).join(', ')}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 900, color: "rgba(255,255,255,0.7)" }}>{fmt(r.remaining)}₺</div>
                      <div style={{ fontSize: "0.5rem", color: "rgba(255,255,255,0.3)" }}>/ {fmt(r.total)}₺</div>
                    </div>
                  </div>
                  <div style={{ height: 4, borderRadius: 0, background: "rgba(255,255,255,0.06)" }}>
                    <div style={{ height: "100%", borderRadius: 0, background: paidPct >= 100 ? "#fff" : "linear-gradient(90deg, #fff, rgba(255,255,255,0.7))", width: `${Math.min(paidPct, 100)}%` }} />
                  </div>
                  <div style={{ fontSize: "0.5rem", color: "rgba(255,255,255,0.3)", marginTop: 3, textAlign: "right" }}>%{Math.round(paidPct)} ödendi</div>
                </div>
              );
            })}
            {reservationBalances.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px", color: "rgba(255,255,255,0.3)", fontSize: "0.7rem" }}>Tüm bakiyeler ödenmiş 🎉</div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ TÜM ÖDEME GEÇMİŞİ ═══ */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, padding: "18px" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 900, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <Banknote size={13} style={{ color: "rgba(255,255,255,0.5)" }} />
          Son 20 Ödeme
        </div>
        
        {/* Table Header */}
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 4 }} />

        <div style={{ display: "flex", flexDirection: "column" }}>
          {recentPayments.map((p, i) => (
            <div key={p.id} style={{ 
              display: "flex", flexWrap: "wrap", gap: "4px 12px", alignItems: "center", justifyContent: "space-between",
              padding: "10px 8px", 
              borderBottom: i < recentPayments.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
            }}>
              <div style={{ minWidth: 0, flex: "1 1 120px" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.reservation?.brideName || "—"}
                </div>
                {p.note && <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.note}</div>}
              </div>
              <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>
                {new Date(p.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
              </div>
              <span style={{ 
                fontSize: "0.55rem", fontWeight: 700, padding: "2px 6px", borderRadius: 0, flexShrink: 0,
                background: `${methodColors[p.method] || "#888"}15`, 
                color: methodColors[p.method] || "#888" 
              }}>
                {methodLabels[p.method] || p.method}
              </span>
              <div style={{ fontSize: "0.8rem", fontWeight: 900, color: "#fff", flexShrink: 0 }}>
                +{fmt(p.amount)}₺
              </div>
            </div>
          ))}
          {recentPayments.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px", color: "rgba(255,255,255,0.3)", fontSize: "0.7rem" }}>Henüz ödeme kaydı yok</div>
          )}
        </div>
      </div>
    </div>
  );
}
