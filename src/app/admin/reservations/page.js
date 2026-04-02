"use client";

import { useState, useEffect } from "react";
import { Plus, Calendar, Phone, Settings2, X, Edit2, Eye, Mail, User, Package, Clock, FileText, CreditCard, ChevronDown, ChevronUp, Instagram, ExternalLink, Trash2, Banknote, DollarSign, List, CalendarDays, ChevronLeft, ChevronRight, ArrowUpDown, Filter, Search } from "lucide-react";
import { getReservations, getPackages, createManualReservation, updateReservation, updateReservationStatus, updateReservationWorkflow, addPayment, deletePayment } from "../core-actions";

const inp = {
  padding: "0.7rem 0.8rem", borderRadius: "0.6rem", fontSize: "0.8rem",
  border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.08)",
  color: "#fff", outline: "none", width: "100%", boxSizing: "border-box",
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [packages, setPackages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    brideName: "", bridePhone: "", brideEmail: "",
    groomName: "", groomPhone: "", groomEmail: "",
    eventDate: "", eventTime: "10:00", packageIds: [], notes: "",
    selectedAddons: [], totalAmount: ""
  });
  const [workflowModal, setWorkflowModal] = useState({ isOpen: false, data: null });
  const [editModal, setEditModal] = useState({ isOpen: false, data: null });
  const [workflowData, setWorkflowData] = useState({ workflowStatus: "PENDING", deliveryLink: "" });
  const [expandedSelections, setExpandedSelections] = useState([]);
  const [detailModal, setDetailModal] = useState({ isOpen: false, data: null });
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "CASH", note: "" });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // "list" | "calendar"
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [sortMode, setSortMode] = useState("newest");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  async function loadData() {
    const [resData, pkgData] = await Promise.all([getReservations(), getPackages()]);
    setReservations(resData);
    setPackages(pkgData);
  }

  const toggleSelectionExpand = (id) => {
    setExpandedSelections(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    let res;
    if (editModal.isOpen) {
      res = await updateReservation(editModal.data.id, formData);
    } else {
      res = await createManualReservation(formData);
    }

    if (res.success) {
      setIsModalOpen(false);
      setEditModal({ isOpen: false, data: null });
      setFormData({ brideName: "", bridePhone: "", brideEmail: "", groomName: "", groomPhone: "", groomEmail: "", eventDate: "", eventTime: "10:00", packageIds: [], notes: "", selectedAddons: [], totalAmount: "" });
      loadData();
    } else { alert("Hata: " + res.error); }
    setIsLoading(false);
  };

  const handleStatusChange = async (id, status) => {
    await updateReservationStatus(id, status);
    loadData();
  };

  const openWorkflowModal = (res) => {
    setWorkflowData({ workflowStatus: res.workflowStatus || "PENDING", deliveryLink: res.deliveryLink || "" });
    setWorkflowModal({ isOpen: true, data: res });
  };

  const openEditModal = (res) => {
    setFormData({
      id: res.id,
      brideName: res.brideName || "", bridePhone: res.bridePhone || "", brideEmail: res.brideEmail || "",
      groomName: res.groomName || "", groomPhone: res.groomPhone || "", groomEmail: res.groomEmail || "",
      eventDate: res.eventDate ? new Date(res.eventDate).toISOString().split('T')[0] : "",
      eventTime: res.eventTime || "10:00",
      packageIds: res.packages.map(p => p.id),
      notes: res.notes || "",
      selectedAddons: res.selectedAddons || [],
      totalAmount: res.totalAmount || ""
    });
    setEditModal({ isOpen: true, data: res });
  };

  const handleWorkflowSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await updateReservationWorkflow(workflowModal.data.id, workflowData);
    setWorkflowModal({ isOpen: false, data: null });
    loadData();
    setIsLoading(false);
  };

  const statusLabel = (s) => {
    const m = { CONFIRMED: "Onaylı", PENDING: "Bekliyor", COMPLETED: "Tamamlandı", CANCELLED: "İptal" };
    return m[s] || s;
  };
  const statusColor = (s) => {
    if (s === "CONFIRMED") return { bg: "rgba(52,211,153,0.15)", c: "#34d399", b: "1px solid rgba(52,211,153,0.25)" };
    if (s === "COMPLETED") return { bg: "rgba(96,165,250,0.12)", c: "#60a5fa", b: "1px solid rgba(96,165,250,0.2)" };
    if (s === "CANCELLED") return { bg: "rgba(239,68,68,0.1)", c: "#ef4444", b: "1px solid rgba(239,68,68,0.15)" };
    return { bg: "rgba(255,255,255,0.05)", c: "rgba(255,255,255,0.5)", b: "1px solid rgba(255,255,255,0.08)" };
  };

  return (
    <div style={{ color: "#fff" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", gap: "0.75rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.2rem, 4vw, 1.8rem)", fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>Rezervasyonlar</h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem", margin: "4px 0 0" }}>{reservations.length} kayıt</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ 
            background: "#fff", color: "#000", padding: "0.5rem 1rem", 
            borderRadius: "0.6rem", border: "none", fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.7rem",
          }}
        >
          <Plus size={14} /> YENİ
        </button>
      </div>

      {/* View Mode Toggle */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "14px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "4px", width: "fit-content" }}>
        <button
          onClick={() => setViewMode("list")}
          style={{
            padding: "7px 14px", borderRadius: "8px", border: "none", cursor: "pointer",
            background: viewMode === "list" ? "rgba(255,255,255,0.12)" : "transparent",
            color: viewMode === "list" ? "#fff" : "rgba(255,255,255,0.4)",
            fontWeight: 700, fontSize: "0.68rem", display: "flex", alignItems: "center", gap: "6px",
            transition: "all 0.2s",
          }}
        >
          <List size={13} /> Liste
        </button>
        <button
          onClick={() => setViewMode("calendar")}
          style={{
            padding: "7px 14px", borderRadius: "8px", border: "none", cursor: "pointer",
            background: viewMode === "calendar" ? "rgba(255,255,255,0.12)" : "transparent",
            color: viewMode === "calendar" ? "#fff" : "rgba(255,255,255,0.4)",
            fontWeight: 700, fontSize: "0.68rem", display: "flex", alignItems: "center", gap: "6px",
            transition: "all 0.2s",
          }}
        >
          <CalendarDays size={13} /> Takvim
        </button>
      </div>

      {/* ═══ CALENDAR VIEW ═══ */}
      {viewMode === "calendar" && (() => {
        const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
        const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
        
        const firstDay = new Date(calYear, calMonth, 1);
        const lastDay = new Date(calYear, calMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        let startWeekday = firstDay.getDay() - 1;
        if (startWeekday < 0) startWeekday = 6;
        
        const today = new Date();
        const isToday = (d) => d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();

        // Group reservations by day
        const resByDay = {};
        reservations.forEach(r => {
          const d = new Date(r.eventDate);
          if (d.getMonth() === calMonth && d.getFullYear() === calYear) {
            const day = d.getDate();
            if (!resByDay[day]) resByDay[day] = [];
            resByDay[day].push(r);
          }
        });

        const cells = [];
        for (let i = 0; i < startWeekday; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);

        const prevMonth = () => {
          if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
          else setCalMonth(calMonth - 1);
        };
        const nextMonth = () => {
          if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
          else setCalMonth(calMonth + 1);
        };
        const goToday = () => { setCalMonth(today.getMonth()); setCalYear(today.getFullYear()); };

        return (
          <div>
            {/* Month Navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={prevMonth} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex" }}>
                  <ChevronLeft size={14} />
                </button>
                <h2 style={{ fontSize: "1rem", fontWeight: 800, margin: 0, minWidth: 140, textAlign: "center" }}>
                  {monthNames[calMonth]} {calYear}
                </h2>
                <button onClick={nextMonth} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex" }}>
                  <ChevronRight size={14} />
                </button>
              </div>
              <button onClick={goToday} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "5px 12px", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: "0.65rem", fontWeight: 700 }}>
                Bugün
              </button>
            </div>

            {/* Day Headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 2 }}>
              {dayNames.map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", padding: "8px 0" }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {cells.map((day, idx) => {
                if (day === null) return <div key={`e${idx}`} style={{ minHeight: 70, background: "rgba(255,255,255,0.01)", borderRadius: 6 }} />;
                
                const dayRes = resByDay[day] || [];
                const hasRes = dayRes.length > 0;
                const todayStyle = isToday(day);

                return (
                  <div key={day} style={{
                    minHeight: 70, borderRadius: 6, padding: "4px 5px",
                    background: todayStyle ? "rgba(59,130,246,0.08)" : hasRes ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)",
                    border: todayStyle ? "1px solid rgba(59,130,246,0.25)" : "1px solid rgba(255,255,255,0.04)",
                    cursor: hasRes ? "pointer" : "default",
                    transition: "all 0.15s",
                  }}>
                    <div style={{ fontSize: "0.7rem", fontWeight: todayStyle ? 800 : 600, color: todayStyle ? "#60a5fa" : hasRes ? "#fff" : "rgba(255,255,255,0.3)", marginBottom: 3 }}>
                      {day}
                    </div>
                    {dayRes.slice(0, 3).map((r) => {
                      const sc = statusColor(r.status);
                      return (
                        <div
                          key={r.id}
                          onClick={() => setDetailModal({ isOpen: true, data: r })}
                          style={{
                            fontSize: "0.55rem", fontWeight: 700, padding: "2px 4px",
                            borderRadius: 4, marginBottom: 2, cursor: "pointer",
                            background: sc.bg, color: sc.c, whiteSpace: "nowrap",
                            overflow: "hidden", textOverflow: "ellipsis",
                            transition: "all 0.15s",
                          }}
                          title={`${r.brideName} - ${r.packages.map(p => p.name).join(", ")}`}
                        >
                          {r.eventTime ? `${r.eventTime} ` : ""}{r.brideName?.split(" ")[0]}
                        </div>
                      );
                    })}
                    {dayRes.length > 3 && (
                      <div style={{ fontSize: "0.5rem", color: "rgba(255,255,255,0.35)", fontWeight: 700, paddingLeft: 2 }}>
                        +{dayRes.length - 3} daha
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Day detail panel - reservations for selected month summary */}
            {(() => {
              const monthRes = reservations.filter(r => {
                const d = new Date(r.eventDate);
                return d.getMonth() === calMonth && d.getFullYear() === calYear;
              }).sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

              if (monthRes.length === 0) return null;
              return (
                <div style={{ marginTop: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px" }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 8 }}>
                    {monthNames[calMonth]} Rezervasyonları ({monthRes.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {monthRes.map(r => {
                      const sc = statusColor(r.status);
                      const d = new Date(r.eventDate);
                      return (
                        <div
                          key={r.id}
                          onClick={() => setDetailModal({ isOpen: true, data: r })}
                          style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
                            transition: "all 0.15s",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                            <div style={{ width: 32, textAlign: "center", flexShrink: 0 }}>
                              <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#fff", lineHeight: 1 }}>{d.getDate()}</div>
                              <div style={{ fontSize: "0.5rem", color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
                                {["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"][d.getDay()]}
                              </div>
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {r.brideName}{r.groomName ? ` & ${r.groomName}` : ""}
                              </div>
                              <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}>
                                {r.eventTime || ""} · {r.packages.map(p => p.name).join(", ")}
                              </div>
                            </div>
                          </div>
                          <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: "0.52rem", fontWeight: 800, textTransform: "uppercase", background: sc.bg, color: sc.c, flexShrink: 0 }}>
                            {statusLabel(r.status)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* ═══ LIST VIEW ═══ */}
      {viewMode === "list" && (
      <>
      {/* Sort & Filter Bar */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
        <input
          type="text"
          placeholder="İsim ile ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 34px",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8, color: "#fff", fontSize: "0.75rem", outline: "none",
            transition: "all 0.2s",
          }}
        />
      </div>
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginRight: 4 }}>
          <ArrowUpDown size={11} style={{ color: "rgba(255,255,255,0.3)" }} />
          <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Sırala:</span>
        </div>
        {[
          { key: "newest", label: "En Yeni" },
          { key: "event_soon", label: "📅 Randevu Yakın" },
          { key: "delivery_soon", label: "📦 Teslim Yakın" },
          { key: "amount_high", label: "💰 Yüksek Tutar" },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setSortMode(s.key)}
            style={{
              padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer",
              background: sortMode === s.key ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
              color: sortMode === s.key ? "#fff" : "rgba(255,255,255,0.4)",
              fontWeight: 700, fontSize: "0.6rem", transition: "all 0.15s",
            }}
          >
            {s.label}
          </button>
        ))}
        
        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />
        
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginRight: 4 }}>
          <Filter size={11} style={{ color: "rgba(255,255,255,0.3)" }} />
        </div>
        {[
          { key: "ALL", label: "Tümü", color: null },
          { key: "PENDING", label: "Bekleyen", color: "rgba(255,255,255,0.5)" },
          { key: "CONFIRMED", label: "Onaylı", color: "#34d399" },
          { key: "COMPLETED", label: "Tamam", color: "#60a5fa" },
          { key: "CANCELLED", label: "İptal", color: "#ef4444" },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            style={{
              padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer",
              background: filterStatus === f.key ? (f.color ? `${f.color}15` : "rgba(255,255,255,0.12)") : "rgba(255,255,255,0.04)",
              color: filterStatus === f.key ? (f.color || "#fff") : "rgba(255,255,255,0.35)",
              fontWeight: 700, fontSize: "0.6rem", transition: "all 0.15s",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Reservation Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {(() => {
          const now = new Date();
          let sorted = [...reservations];
          
          // Search
          if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            sorted = sorted.filter(r =>
              (r.brideName || "").toLowerCase().includes(q) ||
              (r.groomName || "").toLowerCase().includes(q) ||
              (r.bridePhone || "").includes(q) ||
              (r.brideEmail || "").toLowerCase().includes(q)
            );
          }
          
          // Filter
          if (filterStatus !== "ALL") {
            sorted = sorted.filter(r => r.status === filterStatus);
          }
          
          // Sort
          if (sortMode === "newest") {
            sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          } else if (sortMode === "event_soon") {
            sorted.sort((a, b) => {
              const da = Math.abs(new Date(a.eventDate) - now);
              const db = Math.abs(new Date(b.eventDate) - now);
              // Future events first, then past
              const aFuture = new Date(a.eventDate) >= now;
              const bFuture = new Date(b.eventDate) >= now;
              if (aFuture && !bFuture) return -1;
              if (!aFuture && bFuture) return 1;
              return aFuture ? da - db : db - da;
            });
          } else if (sortMode === "delivery_soon") {
            sorted.sort((a, b) => {
              if (!a.deliveryDate && !b.deliveryDate) return 0;
              if (!a.deliveryDate) return 1;
              if (!b.deliveryDate) return -1;
              return new Date(a.deliveryDate) - new Date(b.deliveryDate);
            });
          } else if (sortMode === "amount_high") {
            sorted.sort((a, b) => {
              const amtA = parseFloat(a.totalAmount?.replace(/[^0-9.-]/g, '') || '0');
              const amtB = parseFloat(b.totalAmount?.replace(/[^0-9.-]/g, '') || '0');
              return amtB - amtA;
            });
          }
          
          return sorted;
        })().map((res) => {
          const sc = statusColor(res.status);
          return (
            <div key={res.id} style={{
              padding: "12px 14px", borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
            }}>
              {/* Row 1: Name + Status */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <div 
                  onClick={() => setDetailModal({ isOpen: true, data: res })}
                  style={{ fontWeight: 700, fontSize: "0.85rem", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Eye size={12} style={{ opacity: 0.4, flexShrink: 0 }} />
                  {res.brideName} {res.groomName ? `& ${res.groomName}` : ""}
                </div>
                <span style={{
                  padding: "3px 8px", borderRadius: "6px", fontSize: "0.6rem", fontWeight: 800,
                  textTransform: "uppercase", letterSpacing: "0.03em", flexShrink: 0,
                  background: sc.bg, color: sc.c, border: sc.b,
                }}>
                  {statusLabel(res.status)}
                </span>
              </div>

              {res.selectedPhotos && (
                <div 
                  onClick={() => toggleSelectionExpand(res.id)}
                  style={{ 
                    marginBottom: "8px", padding: "6px 10px", 
                    background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)", 
                    borderRadius: "8px", display: "flex", flexDirection: "column", gap: "6px", 
                    cursor: "pointer", transition: "all 0.2s"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.65rem", color: "#a855f7", fontWeight: 700 }}>
                    <Edit2 size={10} /> 
                    {expandedSelections.includes(res.id) ? "Seçimi Kapat" : "Seçim Yapıldı (Görmek için tıklayın)"}
                  </div>
                  
                  {expandedSelections.includes(res.id) ? (
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.5, wordBreak: "break-all", background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      {res.selectedPhotos}
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      {res.selectedPhotos}
                    </div>
                  )}
                </div>
              )}

              {/* Row 2: Date + Package + Amount */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", alignItems: "center", fontSize: "0.75rem", color: "rgba(255,255,255,0.65)", marginBottom: "8px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                  <Calendar size={11} /> {new Date(res.eventDate).toLocaleDateString('tr-TR')}
                  {res.eventTime && ` · ${res.eventTime}`}
                </span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {res.packages.map(p => p.name).join(", ")}
                </span>
                <span style={{ fontWeight: 800, color: "#fff" }}>
                  {res.totalAmount || "0"} TL
                  {res.selectedAddons?.length > 0 && <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.3)", marginLeft: "4px" }}>+{res.selectedAddons.length}</span>}
                </span>
                {(() => {
                  const ps = res.paymentStatus;
                  if (ps === "PAID") return <span style={{ fontSize: "0.55rem", fontWeight: 800, background: "rgba(74,222,128,0.12)", color: "#4ade80", padding: "2px 6px", borderRadius: "4px" }}>ÖDENDİ</span>;
                  if (ps === "PARTIAL") return <span style={{ fontSize: "0.55rem", fontWeight: 800, background: "rgba(250,204,21,0.12)", color: "#facc15", padding: "2px 6px", borderRadius: "4px" }}>KISMİ</span>;
                  return <span style={{ fontSize: "0.55rem", fontWeight: 800, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)", padding: "2px 6px", borderRadius: "4px" }}>ÖDENMEDİ</span>;
                })()}
              </div>

              {/* Row 3: Phone + Actions */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: "3px" }}>
                  <Phone size={10} /> {res.bridePhone}
                </span>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <select 
                    value={res.status}
                    onChange={(e) => handleStatusChange(res.id, e.target.value)}
                    style={{
                      padding: "4px 6px", borderRadius: "6px", fontSize: "0.68rem",
                      border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)",
                      color: "#fff", outline: "none",
                    }}
                  >
                    <option value="PENDING">Bekleyen</option>
                    <option value="CONFIRMED">Onayla</option>
                    <option value="COMPLETED">Tamamlandı</option>
                    <option value="CANCELLED">İptal Et</option>
                  </select>
                    <button 
                      onClick={() => openEditModal(res)}
                      style={{
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.5)", padding: "4px", borderRadius: "6px",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                      title="Düzenle"
                    >
                      <Edit2 size={12} />
                    </button>
                  {res.status === "CONFIRMED" && (
                    <button 
                      onClick={() => openWorkflowModal(res)}
                      style={{
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.5)", padding: "4px", borderRadius: "6px",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                      title="İş Akışı"
                    >
                      <Settings2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {reservations.length === 0 && (
          <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: "0.8rem" }}>
            Henüz kayıt yok.
          </div>
        )}
      </div>
      </>
      )}

      {/* ── New / Edit Reservation Modal ── */}
      {(isModalOpen || editModal.isOpen) && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 1000, padding: "1rem", overflowY: "auto" }}>
          <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "1rem", width: "100%", maxWidth: "420px", padding: "1.25rem", position: "relative", margin: "2rem 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 900, margin: 0 }}>{editModal.isOpen ? "Rezervasyonu Düzenle" : "Yeni Rezervasyon"}</h2>
              <button onClick={() => { setIsModalOpen(false); setEditModal({isOpen: false, data: null}); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                <input placeholder="Gelin Adı *" required style={inp} value={formData.brideName} onChange={(e) => setFormData({...formData, brideName: e.target.value})} />
                <input placeholder="Damat Adı *" required style={inp} value={formData.groomName} onChange={(e) => setFormData({...formData, groomName: e.target.value})} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                <input placeholder="Gelin Telefon *" required style={inp} value={formData.bridePhone} onChange={(e) => setFormData({...formData, bridePhone: e.target.value})} />
                <input placeholder="Gelin E-posta *" type="email" required style={inp} value={formData.brideEmail} onChange={(e) => setFormData({...formData, brideEmail: e.target.value})} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                <input type="date" required style={{ ...inp, colorScheme: "dark" }} value={formData.eventDate} onChange={(e) => setFormData({...formData, eventDate: e.target.value})} />
                <input type="time" required style={{ ...inp, colorScheme: "dark" }} value={formData.eventTime} onChange={(e) => setFormData({...formData, eventTime: e.target.value})} />
              </div>

              {/* Packages */}
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "6px" }}>Paketler</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {packages.map(pkg => {
                    const on = formData.packageIds.includes(pkg.id);
                    return (
                      <button key={pkg.id} type="button" onClick={() => {
                        const ids = on ? formData.packageIds.filter(id => id !== pkg.id) : [...formData.packageIds, pkg.id];
                        let newAddons = [...formData.selectedAddons];
                        if (on && pkg.addons) { const titlesToRemove = pkg.addons.map(a => a.title); newAddons = newAddons.filter(a => !titlesToRemove.includes(a.title)); }
                        setFormData({...formData, packageIds: ids, selectedAddons: newAddons});
                      }} style={{
                        padding: "5px 10px", borderRadius: "6px", fontSize: "0.7rem", cursor: "pointer",
                        border: on ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.08)",
                        background: on ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)",
                        color: on ? "#fff" : "rgba(255,255,255,0.55)", fontWeight: on ? 700 : 500,
                      }}>
                        {pkg.name}
                      </button>
                    );
                  })}
                </div>
                {/* Addons for selected packages */}
                {packages.filter(p => formData.packageIds.includes(p.id) && p.addons?.length > 0).map(pkg => (
                  <div key={pkg.id} style={{ marginTop: "6px", paddingLeft: "8px" }}>
                    {pkg.addons.map((addon, idx) => {
                      const isSelected = formData.selectedAddons.some(a => a.title === addon.title);
                      return (
                        <label key={idx} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.7rem", color: "rgba(255,255,255,0.6)", cursor: "pointer", marginBottom: "2px" }}>
                          <input type="checkbox" checked={isSelected} onChange={(e) => {
                            let cur = [...formData.selectedAddons];
                            if (e.target.checked) cur.push(addon); else cur = cur.filter(a => a.title !== addon.title);
                            setFormData({...formData, selectedAddons: cur});
                          }} style={{ width: "12px", height: "12px" }} />
                          +{addon.title} ({addon.price}₺)
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>

              <input placeholder="Toplam Fiyat (TL)" style={inp} value={formData.totalAmount} onChange={(e) => setFormData({...formData, totalAmount: e.target.value})} />
              <textarea placeholder="Notlar" style={{ ...inp, minHeight: "50px", resize: "none" }} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "4px" }}>
                <button type="button" onClick={() => { setIsModalOpen(false); setEditModal({isOpen: false, data: null}); }} style={{ flex: 1, padding: "0.7rem", borderRadius: "0.6rem", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.5)", fontWeight: 700, cursor: "pointer", fontSize: "0.75rem" }}>İPTAL</button>
                <button type="submit" disabled={isLoading} style={{ flex: 2, padding: "0.7rem", borderRadius: "0.6rem", border: "none", background: "#fff", color: "#000", fontWeight: 900, cursor: "pointer", fontSize: "0.75rem" }}>{isLoading ? "..." : (editModal.isOpen ? "GÜNCELLE" : "KAYDET")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Workflow Modal ── */}
      {workflowModal.isOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 1000, padding: "1rem", overflowY: "auto" }}>
          <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "1rem", width: "100%", maxWidth: "380px", padding: "1.25rem", margin: "2rem 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 900, margin: 0 }}>İş Akışı</h2>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.72rem", margin: "2px 0 0" }}>{workflowModal.data.brideName} & {workflowModal.data.groomName}</p>
              </div>
              <button onClick={() => setWorkflowModal({isOpen: false, data: null})} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}><X size={16} /></button>
            </div>
            <form onSubmit={handleWorkflowSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "5px" }}>CRM Durumu</div>
                <select value={workflowData.workflowStatus} onChange={(e) => setWorkflowData({...workflowData, workflowStatus: e.target.value})} style={inp}>
                  <option value="PENDING">Çekim Bekleniyor</option>
                  <option value="SHOT_DONE">Çekim Tamamlandı</option>
                  <option value="EDITING">Düzenleniyor</option>
                  <option value="SELECTION_PENDING">Seçim Bekleniyor</option>
                  <option value="ALBUM_PREPARING">Albüm Hazırlanıyor</option>
                  <option value="DELIVERED">Teslim Edildi (Bitti)</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "5px" }}>Teslimat Linki</div>
                <input type="url" placeholder="https://drive.google.com/..." style={inp} value={workflowData.deliveryLink} onChange={(e) => setWorkflowData({...workflowData, deliveryLink: e.target.value})} />
                <p style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.45)", marginTop: "4px" }}>Müşteri panelinde "Teslimat Klasörü" butonu olarak görünür.</p>
              </div>
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "5px" }}>Müşteri Seçimi (Foto Numaraları)</div>
                <div style={{ ...inp, minHeight: "60px", fontSize: "0.75rem", color: workflowModal.data.selectedPhotos ? "#4ade80" : "rgba(255,255,255,0.2)", border: "1px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", cursor: "default", overflowY: "auto" }}>
                  {workflowModal.data.selectedPhotos || "Henüz seçim yapılmadı."}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="button" onClick={() => setWorkflowModal({isOpen: false, data: null})} style={{ flex: 1, padding: "0.65rem", borderRadius: "0.6rem", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.5)", fontWeight: 700, cursor: "pointer", fontSize: "0.72rem" }}>İPTAL</button>
                <button type="submit" disabled={isLoading} style={{ flex: 2, padding: "0.65rem", borderRadius: "0.6rem", border: "none", background: "#fff", color: "#000", fontWeight: 900, cursor: "pointer", fontSize: "0.72rem" }}>{isLoading ? "..." : "GÜNCELLE"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {detailModal.isOpen && detailModal.data && (() => {
        const r = detailModal.data;
        const wfLabels = {
          PENDING: "Çekim Bekleniyor", SHOT_DONE: "Çekim Tamamlandı",
          EDITING: "Düzenleniyor", SELECTION_PENDING: "Seçim Bekleniyor",
          ALBUM_PREPARING: "Albüm Hazırlanıyor", DELIVERED: "Teslim Edildi",
        };
        const statusLabels = { PENDING: "Bekleyen", CONFIRMED: "Onaylı", COMPLETED: "Tamamlandı", CANCELLED: "İptal" };
        const sc = statusColor(r.status);
        
        const DetailRow = ({ icon: Icon, label, value, color }) => (
          value ? (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <Icon size={13} style={{ color: color || "rgba(255,255,255,0.4)" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: "0.82rem", color: "#fff", wordBreak: "break-word", lineHeight: 1.5 }}>{value}</div>
              </div>
            </div>
          ) : null
        );

        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 1000, padding: "1rem", overflowY: "auto" }}>
            <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "1rem", width: "100%", maxWidth: "520px", padding: "0", margin: "2rem 0", overflow: "hidden" }}>
              
              {/* Header */}
              <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 900, margin: 0 }}>Rezervasyon Detayı</h2>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.7rem", margin: "3px 0 0" }}>ID: {r.id.slice(0, 12)}...</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", background: sc.bg, color: sc.c, border: sc.b }}>
                    {statusLabels[r.status] || r.status}
                  </span>
                  <button onClick={() => setDetailModal({ isOpen: false, data: null })} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", padding: "6px", borderRadius: "8px", cursor: "pointer", display: "flex" }}>
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div style={{ padding: "8px 24px 24px" }}>
                
                {/* ── İletişim Bilgileri ── */}
                <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "16px 0 4px", marginBottom: 0 }}>👤 İletişim Bilgileri</div>
                <DetailRow icon={User} label="Gelin" value={r.brideName} color="#f472b6" />
                <DetailRow icon={Phone} label="Gelin Telefon" value={r.bridePhone} color="#f472b6" />
                <DetailRow icon={Mail} label="Gelin E-posta" value={r.brideEmail} color="#f472b6" />
                <DetailRow icon={User} label="Damat" value={r.groomName} color="#60a5fa" />
                <DetailRow icon={Phone} label="Damat Telefon" value={r.groomPhone} color="#60a5fa" />

                {/* ── Etkinlik Detayları ── */}
                <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "20px 0 4px" }}>📅 Etkinlik Detayları</div>
                <DetailRow icon={Calendar} label="Tarih" value={new Date(r.eventDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })} />
                <DetailRow icon={Clock} label="Saat" value={r.eventTime} />
                <DetailRow icon={CreditCard} label="Toplam Tutar" value={r.totalAmount ? `${r.totalAmount} TL` : null} />
                <DetailRow icon={CreditCard} label="Ödenen Tutar" value={r.paidAmount && r.paidAmount !== "0" ? `${r.paidAmount} TL` : null} />
                
                {/* ── Paketler ── */}
                <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "20px 0 8px" }}>📦 Seçilen Paketler</div>
                {r.packages && r.packages.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {r.packages.map((pkg) => (
                      <div key={pkg.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "12px 14px" }}>
                        <div style={{ fontWeight: 700, fontSize: "0.82rem", marginBottom: 4 }}>{pkg.name}</div>
                        <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>{pkg.description}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          <span style={{ fontSize: "0.6rem", fontWeight: 700, background: "rgba(255,255,255,0.06)", padding: "2px 7px", borderRadius: "4px", color: "rgba(255,255,255,0.55)" }}>{pkg.price}₺</span>
                          <span style={{ fontSize: "0.6rem", fontWeight: 700, background: "rgba(255,255,255,0.06)", padding: "2px 7px", borderRadius: "4px", color: "rgba(255,255,255,0.55)" }}>{pkg.category}</span>
                          <span style={{ fontSize: "0.6rem", fontWeight: 700, background: "rgba(255,255,255,0.06)", padding: "2px 7px", borderRadius: "4px", color: "rgba(255,255,255,0.55)" }}>{pkg.timeType}</span>
                        </div>
                        {pkg.features && pkg.features.length > 0 && (
                          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: "4px 10px" }}>
                            {pkg.features.map((f, i) => (
                              <span key={i} style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)" }}>• {f}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>Paket seçilmemiş</p>
                )}

                {/* ── Ek Hizmetler ── */}
                {r.selectedAddons && r.selectedAddons.length > 0 && (
                  <>
                    <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "20px 0 8px" }}>➕ Ek Hizmetler</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {r.selectedAddons.map((addon, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "10px 14px" }}>
                          <span style={{ fontSize: "0.78rem", color: "#fff", fontWeight: 600 }}>{addon.title}</span>
                          <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>{addon.price}₺</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* ── Özel Alan Cevapları ── */}
                {r.customFieldAnswers && r.customFieldAnswers.length > 0 && (
                  <>
                    <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "20px 0 8px" }}>📝 Müşteri Detay Cevapları</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {r.customFieldAnswers.map((answer, i) => (
                        <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "10px 14px" }}>
                          <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>{answer.label}</div>
                          <div style={{ fontSize: "0.82rem", color: "#fff", fontWeight: 600 }}>
                            {answer.type === "checkbox" ? (answer.value ? "✅ Evet" : "❌ Hayır") : (answer.value || "—")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* ── Notlar ── */}
                <DetailRow icon={FileText} label="Notlar" value={r.notes} />

                {/* ── Ödeme Takibi ── */}
                {(() => {
                  const totalAmount = parseFloat(r.totalAmount?.replace(/[^0-9.-]/g, '') || '0');
                  const payments = r.payments || [];
                  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
                  const remaining = Math.max(0, totalAmount - totalPaid);
                  const pct = totalAmount > 0 ? Math.min(100, (totalPaid / totalAmount) * 100) : 0;
                  const isPaid = totalPaid >= totalAmount && totalAmount > 0;
                  const methodLabels = { CASH: "Nakit", BANK_TRANSFER: "Havale/EFT", CREDIT_CARD: "Kredi Kartı", ONLINE: "Online" };
                  const methodColors = { CASH: "#4ade80", BANK_TRANSFER: "#60a5fa", CREDIT_CARD: "#f59e0b", ONLINE: "#a78bfa" };

                  const handleAddPayment = async () => {
                    if (!paymentForm.amount || paymentLoading) return;
                    setPaymentLoading(true);
                    const res = await addPayment(r.id, paymentForm);
                    if (res.success) {
                      setPaymentForm({ amount: "", method: "CASH", note: "" });
                      const updated = await getReservations();
                      const freshRes = updated.find(x => x.id === r.id);
                      if (freshRes) setDetailModal({ isOpen: true, data: freshRes });
                    }
                    setPaymentLoading(false);
                  };

                  const handleDeletePayment = async (paymentId) => {
                    if (!confirm("Ödemeyi silmek istediğinize emin misiniz?")) return;
                    const res = await deletePayment(paymentId);
                    if (res.success) {
                      const updated = await getReservations();
                      const freshRes = updated.find(x => x.id === r.id);
                      if (freshRes) setDetailModal({ isOpen: true, data: freshRes });
                    }
                  };

                  return (
                    <>
                      <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "20px 0 8px" }}>💰 Ödeme Takibi</div>
                      
                      {/* Summary Card */}
                      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "16px", marginBottom: "10px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 4 }}>Toplam</div>
                            <div style={{ fontSize: "1rem", fontWeight: 800, color: "#fff" }}>{totalAmount.toLocaleString('tr-TR')}₺</div>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "rgba(74,222,128,0.6)", textTransform: "uppercase", marginBottom: 4 }}>Ödenen</div>
                            <div style={{ fontSize: "1rem", fontWeight: 800, color: "#4ade80" }}>{totalPaid.toLocaleString('tr-TR')}₺</div>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "0.58rem", fontWeight: 700, color: isPaid ? "rgba(74,222,128,0.6)" : "rgba(250,204,21,0.6)", textTransform: "uppercase", marginBottom: 4 }}>Kalan</div>
                            <div style={{ fontSize: "1rem", fontWeight: 800, color: isPaid ? "#4ade80" : "#facc15" }}>{remaining.toLocaleString('tr-TR')}₺</div>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 3, background: isPaid ? "#4ade80" : pct > 0 ? "linear-gradient(90deg, #4ade80, #facc15)" : "transparent", width: `${pct}%`, transition: "width 0.5s ease" }} />
                        </div>
                        <div style={{ textAlign: "center", marginTop: 6, fontSize: "0.62rem", fontWeight: 700, color: isPaid ? "#4ade80" : "rgba(255,255,255,0.4)" }}>
                          {isPaid ? "✅ Tamamen Ödendi" : `%${Math.round(pct)} ödendi`}
                        </div>
                      </div>

                      {/* Add Payment Form */}
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "12px", marginBottom: "10px" }}>
                        <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", marginBottom: 8 }}>Ödeme Ekle</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: 8 }}>
                          <input 
                            type="number" 
                            placeholder="Tutar (₺)" 
                            value={paymentForm.amount} 
                            onChange={(e) => setPaymentForm(p => ({ ...p, amount: e.target.value }))} 
                            style={{ ...inp, fontSize: "0.78rem" }} 
                          />
                          <select 
                            value={paymentForm.method} 
                            onChange={(e) => setPaymentForm(p => ({ ...p, method: e.target.value }))} 
                            style={{ ...inp, fontSize: "0.72rem" }}
                          >
                            <option value="CASH">Nakit</option>
                            <option value="BANK_TRANSFER">Havale/EFT</option>
                            <option value="CREDIT_CARD">Kredi Kartı</option>
                            <option value="ONLINE">Online</option>
                          </select>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input 
                            type="text" 
                            placeholder="Not (isteğe bağlı)" 
                            value={paymentForm.note} 
                            onChange={(e) => setPaymentForm(p => ({ ...p, note: e.target.value }))} 
                            style={{ ...inp, fontSize: "0.72rem", flex: 1 }} 
                          />
                          <button 
                            onClick={handleAddPayment} 
                            disabled={!paymentForm.amount || paymentLoading}
                            style={{ 
                              padding: "8px 16px", borderRadius: "0.6rem", border: "none",
                              background: paymentForm.amount ? "#4ade80" : "rgba(255,255,255,0.06)",
                              color: paymentForm.amount ? "#000" : "rgba(255,255,255,0.3)",
                              fontWeight: 800, fontSize: "0.72rem", cursor: paymentForm.amount ? "pointer" : "not-allowed",
                              flexShrink: 0,
                            }}
                          >
                            {paymentLoading ? "..." : "+ Ekle"}
                          </button>
                        </div>
                      </div>

                      {/* Payment History */}
                      {payments.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 2 }}>Ödeme Geçmişi ({payments.length})</div>
                          {payments.map((p) => (
                            <div key={p.id} style={{ 
                              display: "flex", justifyContent: "space-between", alignItems: "center",
                              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                              borderRadius: "8px", padding: "8px 12px",
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
                                <div style={{ 
                                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                                  background: methodColors[p.method] || "#888",
                                }} />
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#fff" }}>
                                    {p.amount.toLocaleString('tr-TR')}₺
                                    <span style={{ fontSize: "0.62rem", fontWeight: 500, color: methodColors[p.method] || "#888", marginLeft: 6 }}>
                                      {methodLabels[p.method] || p.method}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.35)" }}>
                                    {new Date(p.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    {p.note && <span style={{ marginLeft: 6, color: "rgba(255,255,255,0.45)" }}>• {p.note}</span>}
                                  </div>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleDeletePayment(p.id)}
                                style={{ background: "none", border: "none", color: "rgba(255,68,68,0.4)", cursor: "pointer", padding: 4, display: "flex", flexShrink: 0 }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* ── İş Akışı ── */}
                <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "20px 0 8px" }}>⚙️ İş Akışı</div>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>CRM Durumu</span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#4ade80" }}>{wfLabels[r.workflowStatus] || r.workflowStatus}</span>
                  </div>
                  {r.deliveryLink && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>Teslimat Linki</span>
                      <a href={r.deliveryLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.72rem", color: "#60a5fa", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                        <ExternalLink size={11} /> Aç
                      </a>
                    </div>
                  )}
                  {r.deliveryDate && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>Teslim Tarihi</span>
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#fff" }}>{new Date(r.deliveryDate).toLocaleDateString('tr-TR')}</span>
                    </div>
                  )}
                </div>

                {/* ── Fotoğraf Seçimi ── */}
                {r.selectedPhotos && (
                  <>
                    <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "20px 0 8px" }}>📸 Müşteri Fotoğraf Seçimi</div>
                    <div style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)", borderRadius: "10px", padding: "14px", fontSize: "0.78rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.6, wordBreak: "break-all" }}>
                      {r.selectedPhotos}
                    </div>
                  </>
                )}

                {/* ── Meta ── */}
                <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>
                  <span>Oluşturulma: {new Date(r.createdAt).toLocaleDateString('tr-TR')}</span>
                  <span>Güncelleme: {new Date(r.updatedAt).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
