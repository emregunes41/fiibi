import { LayoutDashboard, Users, Package, Calendar, Clock, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  // Fetch quick stats
  const totalPackages = await prisma.photographyPackage.count();
  const totalReservations = await prisma.reservation.count();
  const pendingReservations = await prisma.reservation.count({ where: { status: "PENDING" } });
  const totalMembers = await prisma.user.count();

  // Fetch recent reservations
  const recentReservations = await prisma.reservation.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { packages: true }
  });

  // Calculate total revenue from confirmed reservations
  const confirmedReservations = await prisma.reservation.findMany({
    where: { status: "CONFIRMED" },
    select: { paidAmount: true }
  });
  
  const totalRevenue = confirmedReservations.reduce((acc, res) => {
    const amount = parseFloat(res.paidAmount?.replace(/[^0-9.]/g, '') || "0");
    return acc + amount;
  }, 0);

  return (
    <div style={{ color: "#fff" }}>
      <div style={{ marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: "0.5rem" }}>Genel Bakış</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.1rem" }}>Pinowed yönetim paneline hoş geldin.</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
        
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", padding: "2rem", borderRadius: "1.5rem", backdropFilter: "blur(10px)" }}>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", fontWeight: 800, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <Package size={16} /> Toplam Paket
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 900 }}>{totalPackages}</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", padding: "2rem", borderRadius: "1.5rem", backdropFilter: "blur(10px)" }}>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", fontWeight: 800, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <Calendar size={16} /> Tüm Randevular
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 900 }}>{totalReservations}</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", padding: "2rem", borderRadius: "1.5rem", backdropFilter: "blur(10px)" }}>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", fontWeight: 800, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <Users size={16} /> Toplam Üye
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 900 }}>{totalMembers}</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #fff", padding: "2rem", borderRadius: "1.5rem", boxShadow: "0 0 30px rgba(255,255,255,0.1)" }}>
          <div style={{ color: "#fff", fontSize: "0.8rem", marginBottom: "1rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <Clock size={16} /> Bekleyen Onaylar
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 900 }}>{pendingReservations}</div>
        </div>
      </div>

      {/* Revenue & Recent Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "2rem", marginBottom: "3rem" }}>
        
        {/* Revenue Card */}
        <div style={{ background: "linear-gradient(145deg, #111 0%, #000 100%)", border: "1px solid rgba(255,255,255,0.1)", padding: "2.5rem", borderRadius: "2rem", display: "flex", flexDirection: "column" }}>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", fontWeight: 800, marginBottom: "2rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Hedef Kazanç İlerlemesi
          </div>
          <div style={{ fontSize: "3rem", fontWeight: 900, marginBottom: "0.5rem" }}>{totalRevenue.toLocaleString("tr-TR")} TL</div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", marginBottom: "2.5rem" }}>Onaylı rezervasyonlardan elde edilen toplam gelir.</p>
          
          <div style={{ marginTop: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 800, marginBottom: "0.75rem" }}>
              <span>HEDEF: 50.000 TL</span>
              <span>%{Math.min(100, Math.round((totalRevenue / 50000) * 100))}</span>
            </div>
            <div style={{ height: "12px", background: "rgba(255,255,255,0.1)", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ height: "100%", background: "#fff", width: `${Math.min(100, (totalRevenue / 50000) * 100)}%`, transition: "width 1s ease-out", boxShadow: "0 0 15px #fff" }} />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "2rem", overflow: "hidden" }}>
          <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontWeight: 900, fontSize: "1.2rem", letterSpacing: "-0.02em" }}>Son Rezervasyonlar</h3>
            <Link href="/admin/reservations" style={{ color: "#fff", fontSize: "0.8rem", fontWeight: 800, textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem", background: "rgba(255,255,255,0.1)", padding: "0.5rem 1rem", borderRadius: "2rem" }}>
              TÜMÜ <ChevronRight size={14} />
            </Link>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "rgba(255,255,255,0.02)", fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>
                <tr>
                  <th style={{ padding: "1rem 2rem", fontWeight: 800, textTransform: "uppercase" }}>Müşteri</th>
                  <th style={{ padding: "1rem 2rem", fontWeight: 800, textTransform: "uppercase" }}>Tarih</th>
                  <th style={{ padding: "1rem 2rem", fontWeight: 800, textTransform: "uppercase" }}>Tutar</th>
                  <th style={{ padding: "1rem 2rem", fontWeight: 800, textTransform: "uppercase" }}>Durum</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "0.9rem" }}>
                {recentReservations.map((res) => (
                  <tr key={res.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "1.25rem 2rem", fontWeight: 700 }}>{res.brideName}</td>
                    <td style={{ padding: "1.25rem 2rem", color: "rgba(255,255,255,0.6)" }}>{new Date(res.eventDate).toLocaleDateString("tr-TR")}</td>
                    <td style={{ padding: "1.25rem 2rem", fontWeight: 800 }}>{res.paidAmount}</td>
                    <td style={{ padding: "1.25rem 2rem" }}>
                      <span style={{ 
                        padding: "0.4rem 0.75rem", borderRadius: "2rem", fontSize: "0.7rem", fontWeight: 900,
                        background: res.status === "CONFIRMED" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
                        color: res.status === "CONFIRMED" ? "#fff" : "rgba(255,255,255,0.5)",
                        border: res.status === "CONFIRMED" ? "1px solid rgba(255,255,255,0.2)" : "1px solid transparent"
                      }}>
                        {res.status === "CONFIRMED" ? "ONAYLI" : "BEKLEMEDE"}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentReservations.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: "4rem", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.9rem" }}>Henüz bir kayıt bulunmuyor.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

