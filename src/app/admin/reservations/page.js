"use client";

import { useState, useEffect } from "react";
import { Plus, Calendar, Phone, Settings2, X, Edit2, Eye, Mail, User, Package, Clock, FileText, CreditCard, ChevronDown, ChevronUp, Instagram, ExternalLink, Trash2, Banknote, DollarSign, List, CalendarDays, ChevronLeft, ChevronRight, ArrowUpDown, Filter, Search, Star } from "lucide-react";
import { getReservations, getPackages, createManualReservation, updateReservation, updateReservationStatus, updateReservationWorkflow, addPayment, deletePayment, softDeleteReservation, hardDeleteReservation, createQuickEvent } from "../core-actions";
import { sendContractReminder, resendCredentials } from "../reminder-actions";
import Link from "next/link";

const inp = {
  padding: "0.7rem 0.8rem", borderRadius: 0, fontSize: "0.8rem",
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
    eventDate: "", eventTime: "", packageIds: [], notes: "",
    selectedAddons: [], customFieldAnswers: [], totalAmount: "",
    venueName: ""
  });
  const [workflowModal, setWorkflowModal] = useState({ isOpen: false, data: null });
  const [editModal, setEditModal] = useState({ isOpen: false, data: null });
  const [workflowData, setWorkflowData] = useState({ workflowStatus: "PENDING", deliveryLink: "" });
  const [expandedSelections, setExpandedSelections] = useState([]);
  const [detailModal, setDetailModal] = useState({ isOpen: false, data: null });
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "CASH", note: "" });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [extraFeeModal, setExtraFeeModal] = useState({ isOpen: false, data: null });
  const [extraFeeForm, setExtraFeeForm] = useState({ amount: "", note: "" });
  const [extraFeeLoading, setExtraFeeLoading] = useState(false);
  const [viewMode, setViewMode] = useState("calendar"); // "list" | "calendar"
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [sortMode, setSortMode] = useState("newest");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickEventModal, setQuickEventModal] = useState(false);
  const [quickEventForm, setQuickEventForm] = useState({ venueName: "", eventDate: "", startTime: "", endTime: "", notes: "", totalAmount: "", initialPaymentAmount: "", paymentMethod: "CASH" });
  const [quickEventLoading, setQuickEventLoading] = useState(false);
  const [reminderLoading, setReminderLoading] = useState("");
  const [reminderResult, setReminderResult] = useState(null);

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
      setFormData({ brideName: "", bridePhone: "", brideEmail: "", groomName: "", groomPhone: "", groomEmail: "", eventDate: "", eventTime: "", packageIds: [], notes: "", selectedAddons: [], customFieldAnswers: [], totalAmount: "", venueName: "" });
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
      eventTime: res.eventTime || "",
      packageIds: res.packages.map(p => p.id),
      notes: res.notes || "",
      selectedAddons: res.selectedAddons || [],
      customFieldAnswers: res.customFieldAnswers || [],
      totalAmount: res.totalAmount || "",
      venueName: res.venueName || ""
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

  const handleDeleteReservation = async (id, brideName) => {
    if (window.confirm(`DİKKAT: ${brideName} isimli müşterinin rezervosyonunu Çöp Kutusuna taşımak istiyor musunuz?`)) {
      setIsLoading(true);
      await softDeleteReservation(id);
      await loadData();
      setIsLoading(false);
    }
  };

  const handleHardDeleteReservation = async (id, brideName) => {
    if (window.confirm(`SON ONAY: ${brideName} isimli müşterinin rezervosyonu TAMAMEN ve KALICI OLARAK silinecektir. Emin misiniz?`)) {
      setIsLoading(true);
      await hardDeleteReservation(id);
      await loadData();
      setIsLoading(false);
    }
  };

  const statusLabel = (s) => {
    const m = { CONFIRMED: "Onaylı", PENDING: "Bekliyor", COMPLETED: "Tamamlandı", CANCELLED: "İptal", DELETED: "Silindi" };
    return m[s] || s;
  };
  const statusColor = (s) => {
    if (s === "CONFIRMED") return { bg: "rgba(255,255,255,0.08)", c: "rgba(255,255,255,0.7)", b: "1px solid rgba(255,255,255,0.15)" };
    if (s === "COMPLETED") return { bg: "rgba(96,165,250,0.12)", c: "rgba(255,255,255,0.5)", b: "1px solid rgba(96,165,250,0.2)" };
    if (s === "CANCELLED") return { bg: "rgba(255,255,255,0.04)", c: "rgba(255,255,255,0.5)", b: "1px solid rgba(255,255,255,0.08)" };
    if (s === "DELETED") return { bg: "rgba(107,114,128,0.15)", c: "#9ca3af", b: "1px solid rgba(107,114,128,0.3)" };
    return { bg: "rgba(255,255,255,0.05)", c: "rgba(255,255,255,0.5)", b: "1px solid rgba(255,255,255,0.08)" };
  };

  return (
    <div style={{ color: "#fff", maxWidth: "100%", overflowX: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", gap: "0.75rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "clamp(1.2rem, 4vw, 1.8rem)", fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>Rezervasyonlar</h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem", margin: "4px 0 0" }}>{reservations.filter(r => r.status !== "DELETED").length} kayıt</p>
        </div>
        <Link href="/admin/new-reservation"
          style={{ 
            background: "#fff", color: "#000", padding: "0.5rem 1rem", 
            borderRadius: 0, border: "none", fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.7rem",
            textDecoration: "none",
          }}
        >
          <Plus size={14} /> YENİ
        </Link>
      </div>

      {/* View Mode Toggle */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "14px", background: "rgba(255,255,255,0.04)", borderRadius: 0, padding: "4px", width: "fit-content" }}>
        <button
          onClick={() => setViewMode("list")}
          style={{
            padding: "7px 14px", borderRadius: 0, border: "none", cursor: "pointer",
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
            padding: "7px 14px", borderRadius: 0, border: "none", cursor: "pointer",
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

        // Group reservations by day using eventDate as single source of truth
        const resByDay = {};
        reservations.filter(r => r.status !== "DELETED").forEach(r => {
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={prevMonth} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 0, padding: "6px 8px", cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex" }}>
                  <ChevronLeft size={14} />
                </button>
                <h2 style={{ fontSize: "1rem", fontWeight: 800, margin: 0, minWidth: 140, textAlign: "center" }}>
                  {monthNames[calMonth]} {calYear}
                </h2>
                <button onClick={nextMonth} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 0, padding: "6px 8px", cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex" }}>
                  <ChevronRight size={14} />
                </button>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => { setQuickEventForm({ venueName: "", eventDate: "", startTime: "", endTime: "", notes: "", totalAmount: "", initialPaymentAmount: "", paymentMethod: "CASH" }); setQuickEventModal(true); }} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, padding: "5px 12px", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: "0.65rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                  <Star size={11} /> Olay Ekle
                </button>
                <button onClick={goToday} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 0, padding: "5px 12px", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: "0.65rem", fontWeight: 700 }}>
                  Bugün
                </button>
              </div>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, overflowX: "hidden" }}>
              {cells.map((day, idx) => {
                if (day === null) return <div key={`e${idx}`} style={{ minHeight: 55, background: "rgba(255,255,255,0.01)", borderRadius: 0 }} />;
                
                const dayRes = resByDay[day] || [];
                const hasRes = dayRes.length > 0;
                const todayStyle = isToday(day);

                return (
                  <div key={day} onClick={() => {
                    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    setQuickEventForm({ venueName: "", eventDate: dateStr, startTime: "", endTime: "", notes: "", totalAmount: "", initialPaymentAmount: "", paymentMethod: "CASH" });
                    setQuickEventModal(true);
                  }} style={{
                    minHeight: 55, borderRadius: 0, padding: "3px 4px",
                    background: todayStyle ? "rgba(255,255,255,0.04)" : hasRes ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)",
                    border: todayStyle ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}>
                    <div style={{ fontSize: "0.7rem", fontWeight: todayStyle ? 800 : 600, color: todayStyle ? "rgba(255,255,255,0.5)" : hasRes ? "#fff" : "rgba(255,255,255,0.3)", marginBottom: 3 }}>
                      {day}
                    </div>
                    {dayRes.slice(0, 3).map((r) => {
                      const sc = statusColor(r.status);
                      return (
                        <div
                          key={r.id}
                          onClick={(e) => { e.stopPropagation(); setDetailModal({ isOpen: true, data: r }); }}
                          style={{
                            fontSize: "0.55rem", fontWeight: 700, padding: "2px 4px",
                            borderRadius: 0, marginBottom: 2, cursor: "pointer",
                            background: sc.bg, color: sc.c, whiteSpace: "nowrap",
                            overflow: "hidden", textOverflow: "ellipsis",
                            transition: "all 0.15s",
                          }}
                          title={(() => {
                            const venueLabels = ["mekan", "konum", "salon", "yer", "adres", "lokasyon", "düğün salonu", "nerede", "alanı", "alan"];
                            const cfa = r.customFieldAnswers || [];
                            const venueField = cfa.find(a => a.value && venueLabels.some(l => a.label?.toLowerCase().includes(l)));
                            return venueField?.value || r.venueName || "";
                          })()}
                        >
                          {(() => {
                            const venueLabels = ["mekan", "konum", "salon", "yer", "adres", "lokasyon", "düğün salonu", "nerede", "alanı", "alan"];
                            const cfa = r.customFieldAnswers || [];
                            const venueField = cfa.find(a => a.value && venueLabels.some(l => a.label?.toLowerCase().includes(l)));
                            return venueField?.value || r.venueName || "-";
                          })()}
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
                if (r.status === "DELETED") return false;
                const d = new Date(r.eventDate);
                return d.getMonth() === calMonth && d.getFullYear() === calYear;
              }).sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

              if (monthRes.length === 0) return null;
              return (
                <div style={{ marginTop: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, padding: "12px" }}>
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
                            padding: "8px 10px", borderRadius: 0, cursor: "pointer",
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
                                {r.eventTime || ""} · {(() => {
                                  const venueLabels = ["mekan", "konum", "salon", "yer", "adres", "lokasyon", "düğün salonu", "nerede", "alanı", "alan"];
                                  const cfa = r.customFieldAnswers || [];
                                  const venueField = cfa.find(a => a.value && venueLabels.some(l => a.label?.toLowerCase().includes(l)));
                                  return venueField?.value || r.venueName || r.packages.map(p => p.name).join(", ") || "";
                                })()}
                              </div>
                            </div>
                          </div>
                          <span style={{ padding: "2px 6px", borderRadius: 0, fontSize: "0.52rem", fontWeight: 800, textTransform: "uppercase", background: sc.bg, color: sc.c, flexShrink: 0 }}>
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
            borderRadius: 0, color: "#fff", fontSize: "0.75rem", outline: "none",
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
              padding: "5px 10px", borderRadius: 0, border: "none", cursor: "pointer",
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
          { key: "CONFIRMED", label: "Onaylı", color: "rgba(255,255,255,0.7)" },
          { key: "COMPLETED", label: "Tamam", color: "rgba(255,255,255,0.5)" },
          { key: "CANCELLED", label: "İptal", color: "rgba(255,255,255,0.5)" },
          { key: "DELETED", label: "Çöp Kutusu", color: "#9ca3af" },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            style={{
              padding: "5px 10px", borderRadius: 0, border: "none", cursor: "pointer",
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
          if (filterStatus === "ALL") {
            sorted = sorted.filter(r => r.status !== "DELETED");
          } else {
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
              const amtA = parseFloat(a.totalAmount?.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || '0');
              const amtB = parseFloat(b.totalAmount?.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || '0');
              return amtB - amtA;
            });
          }
          
          return sorted;
        })().map((res) => {
          const sc = statusColor(res.status);
          return (
            <div key={res.id} style={{
              padding: "12px 14px", borderRadius: 0,
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
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  {res.contractApproved ? (
                    <span style={{ padding: "3px 6px", borderRadius: 0, fontSize: "0.55rem", fontWeight: 800, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(74,222,128,0.3)" }}>📝 Sözleşme ✓</span>
                  ) : (
                    <span style={{ padding: "3px 6px", borderRadius: 0, fontSize: "0.55rem", fontWeight: 800, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.12)" }}>📝 Onay Yok</span>
                  )}
                  {res.paymentPreference === "CREDIT_CARD" && (
                    <span style={{ padding: "3px 6px", borderRadius: 0, fontSize: "0.55rem", fontWeight: 800, background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>💳 Kart</span>
                  )}
                  {res.paymentPreference === "CASH" && (
                    <span style={{ padding: "3px 6px", borderRadius: 0, fontSize: "0.55rem", fontWeight: 800, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(74,222,128,0.3)" }}>💵 Nakit</span>
                  )}
                  <span style={{
                    padding: "3px 8px", borderRadius: 0, fontSize: "0.6rem", fontWeight: 800,
                    textTransform: "uppercase", letterSpacing: "0.03em", flexShrink: 0,
                    background: sc.bg, color: sc.c, border: sc.b,
                  }}>
                    {statusLabel(res.status)}
                  </span>
                </div>
              </div>

              {res.selectedPhotos && (
                <div style={{ marginBottom: "8px" }}>
                  <div 
                    onClick={() => toggleSelectionExpand(res.id)}
                    style={{ 
                      padding: "6px 10px", 
                      background: res.selectionLocked ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.04)", 
                      border: `1px solid ${res.selectionLocked ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.08)"}`, 
                      borderRadius: 0, display: "flex", flexDirection: "column", gap: "6px", 
                      cursor: "pointer", transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.65rem", color: res.selectionLocked ? "#fff" : "rgba(255,255,255,0.5)", fontWeight: 700 }}>
                        <Edit2 size={10} /> 
                        {res.selectionLocked 
                          ? "✅ İşleme Alındı" 
                          : expandedSelections.includes(res.id) ? "Seçimi Kapat" : "Seçim Yapıldı (Görmek için tıklayın)"}
                      </div>
                      {res.selectedPhotos && !res.selectionLocked && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm("Seçimi işleme almak istediğinize emin misiniz? Müşteri artık seçimini değiştiremeyecek.")) return;
                            const { lockSelection } = await import("../core-actions");
                            await lockSelection(res.id);
                            loadData();
                          }}
                          style={{
                            padding: "4px 12px", borderRadius: 0, border: "none",
                            background: "rgba(255,255,255,0.5)", color: "#fff", fontSize: "0.62rem", fontWeight: 700,
                            cursor: "pointer", whiteSpace: "nowrap",
                          }}
                        >
                          İşleme Al
                        </button>
                      )}
                    </div>
                    
                    {expandedSelections.includes(res.id) ? (
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.5, wordBreak: "break-all", background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: 0, border: "1px solid rgba(255,255,255,0.05)" }}>
                        {res.selectedPhotos}
                      </div>
                    ) : (
                      <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {res.selectedPhotos}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Album Model Display */}
              {res.albumModel && (
                <div style={{ marginBottom: "8px", padding: "6px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 0, overflow: "hidden", background: "#000", flexShrink: 0 }}>
                    <img src={res.albumModel.imageUrl} alt="Album" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>Albüm Seçimi</div>
                    <div style={{ fontSize: "0.75rem", color: "#fff", fontWeight: 600 }}>{res.albumModel.name}</div>
                  </div>
                </div>
              )}
              {/* Row 2: Date + Package + Amount */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", alignItems: "center", fontSize: "0.75rem", color: "rgba(255,255,255,0.65)", marginBottom: "8px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                  <Calendar size={11} /> {new Date(res.eventDate).toLocaleDateString('tr-TR')}
                  {res.eventTime && ` · ${res.eventTime}`}
                </span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {res.packages.map(p => p.name).join(" + ")}
                </span>
                <span style={{ fontWeight: 800, color: "#fff" }}>
                  {res.totalAmount || "0"} TL
                  {res.selectedAddons?.length > 0 && <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.3)", marginLeft: "4px" }}>+{res.selectedAddons.length}</span>}
                </span>
                {(() => {
                  const ps = res.paymentStatus;
                  if (ps === "PAID") return <span style={{ fontSize: "0.55rem", fontWeight: 800, background: "rgba(255,255,255,0.08)", color: "#fff", padding: "2px 6px", borderRadius: 0 }}>ÖDENDİ</span>;
                  if (ps === "PARTIAL") return <span style={{ fontSize: "0.55rem", fontWeight: 800, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", padding: "2px 6px", borderRadius: 0 }}>KISMİ</span>;
                  return <span style={{ fontSize: "0.55rem", fontWeight: 800, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)", padding: "2px 6px", borderRadius: 0 }}>ÖDENMEDİ</span>;
                })()}
              </div>

              {/* Row 3: Phone + Actions */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: "3px" }}>
                  <Phone size={10} /> {res.bridePhone}
                </span>
                <div style={{ display: "flex", gap: "6px" }}>
                  {res.status === "DELETED" ? (
                    <>
                      <button 
                        onClick={() => handleStatusChange(res.id, "PENDING")}
                        style={{
                          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                          color: "rgba(255,255,255,0.7)", padding: "4px 8px", borderRadius: 0, fontSize: "0.65rem",
                          cursor: "pointer", fontWeight: 700
                        }}
                      >
                        Geri Yükle
                      </button>
                      <button 
                        onClick={() => handleHardDeleteReservation(res.id, res.brideName)}
                        style={{
                          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                          color: "rgba(255,255,255,0.5)", padding: "4px 8px", borderRadius: 0, fontSize: "0.65rem",
                          cursor: "pointer", display: "flex", gap: "4px", alignItems: "center"
                        }}
                        title="Kalıcı Olarak Sil"
                      >
                        <Trash2 size={12} /> Kalıcı Sil
                      </button>
                    </>
                  ) : (
                    <>
                      <select 
                        value={res.status}
                        onChange={(e) => handleStatusChange(res.id, e.target.value)}
                        style={{
                          padding: "4px 6px", borderRadius: 0, fontSize: "0.68rem",
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
                          color: "rgba(255,255,255,0.5)", padding: "4px", borderRadius: 0,
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
                            color: "rgba(255,255,255,0.5)", padding: "4px", borderRadius: 0,
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                          title="İş Akışı"
                        >
                          <Settings2 size={12} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteReservation(res.id, res.brideName)}
                        style={{
                          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                          color: "rgba(255,255,255,0.5)", padding: "4px", borderRadius: 0,
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                        title="Çöpe Taşı"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
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
          <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 0, width: "100%", maxWidth: "420px", padding: "1.25rem", position: "relative", margin: "2rem 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 900, margin: 0 }}>{editModal.isOpen ? "Rezervasyonu Düzenle" : "Yeni Rezervasyon"}</h2>
              <button onClick={() => { setIsModalOpen(false); setEditModal({isOpen: false, data: null}); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

              {/* Mekan Adı */}
              <div>
                <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Mekan Adı</div>
                <input placeholder="Opsiyonel: Salon adı, konum vb." style={inp} value={formData.venueName} onChange={(e) => setFormData({...formData, venueName: e.target.value})} />
              </div>

              {/* İletişim Bilgileri */}
              <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "-4px" }}>İletişim Bilgileri</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <input placeholder="Gelin Adı *" required style={inp} value={formData.brideName} onChange={(e) => setFormData({...formData, brideName: e.target.value})} />
                <input placeholder="Damat Adı *" required style={inp} value={formData.groomName} onChange={(e) => setFormData({...formData, groomName: e.target.value})} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <input placeholder="Gelin Telefon *" required style={inp} value={formData.bridePhone} onChange={(e) => setFormData({...formData, bridePhone: e.target.value})} />
                <input placeholder="Damat Telefon" style={inp} value={formData.groomPhone} onChange={(e) => setFormData({...formData, groomPhone: e.target.value})} />
              </div>
              <input placeholder="Gelin E-posta *" type="email" required style={inp} value={formData.brideEmail} onChange={(e) => setFormData({...formData, brideEmail: e.target.value})} />

              {/* Tarih */}
              <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "4px", marginBottom: "-4px" }}>Etkinlik Tarihi</div>
              <input type="date" required style={{ ...inp, colorScheme: "dark" }} value={formData.eventDate} onChange={(e) => setFormData({...formData, eventDate: e.target.value})} />

              {/* Paket Seçimi - Detaylı */}
              <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "4px", marginBottom: "-4px" }}>Paket Seçimi</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {(() => {
                  const catLabels = { DIS_CEKIM: "Dış Çekim", DUGUN: "Düğün", NISAN: "Nişan", STANDARD: "Standart" };
                  const timeLabels = { SLOT_2H: "2 Saatlik", SLOT_4H: "4 Saatlik", WEDDING: "Düğün Boyunca", FULL_DAY: "Tam Gün" };
                  const grouped = {};
                  packages.forEach(pkg => {
                    const cat = catLabels[pkg.category] || pkg.category;
                    if (!grouped[cat]) grouped[cat] = [];
                    grouped[cat].push(pkg);
                  });
                  return Object.entries(grouped).map(([catName, pkgs]) => (
                    <div key={catName}>
                      <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", marginBottom: "3px", marginTop: "2px" }}>{catName}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {pkgs.map(pkg => {
                          const on = formData.packageIds.includes(pkg.id);
                          return (
                            <button key={pkg.id} type="button" onClick={() => {
                              const ids = on ? formData.packageIds.filter(id => id !== pkg.id) : [...formData.packageIds, pkg.id];
                              let newAddons = [...formData.selectedAddons];
                              let newCFA = [...formData.customFieldAnswers];
                              if (on) {
                                if (pkg.addons) { const titles = pkg.addons.map(a => a.title); newAddons = newAddons.filter(a => !titles.includes(a.title)); }
                                newCFA = newCFA.filter(a => a.packageName !== pkg.name);
                              } else {
                                // Add custom field entries for this package
                                if (pkg.customFields?.length > 0) {
                                  pkg.customFields.forEach(f => {
                                    newCFA.push({ label: f.label, value: "", type: f.type, packageName: pkg.name, options: f.options || "", required: f.required });
                                  });
                                }
                              }
                              // Recalculate total
                              const selPkgs = packages.filter(p => ids.includes(p.id));
                              const pkgTotal = selPkgs.reduce((s, p) => s + (parseInt(p.price?.replace(/\./g, '').replace(/\D/g, '')) || 0), 0);
                              const addonTotal = newAddons.reduce((s, a) => s + (parseInt(a.price) || 0), 0);
                              const total = pkgTotal + addonTotal;
                              setFormData({...formData, packageIds: ids, selectedAddons: newAddons, customFieldAnswers: newCFA, totalAmount: total > 0 ? total.toLocaleString("tr-TR") : ""});
                            }} style={{
                              padding: "6px 10px", borderRadius: 0, fontSize: "0.68rem", cursor: "pointer",
                              border: on ? "1px solid rgba(255,255,255,0.35)" : "1px solid rgba(255,255,255,0.08)",
                              background: on ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.03)",
                              color: on ? "#fff" : "rgba(255,255,255,0.55)", fontWeight: on ? 700 : 500,
                              display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px",
                            }}>
                              <span>{pkg.name}</span>
                              <span style={{ fontSize: "0.55rem", color: on ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)" }}>
                                {pkg.price}₺ · {timeLabels[pkg.timeType] || pkg.timeType}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* Saat Dilimi - Dinamik (seçilen paketlere göre) */}
              {formData.packageIds.length > 0 && (() => {
                const selPkgs = packages.filter(p => formData.packageIds.includes(p.id));
                const needsSlot = selPkgs.some(p => ["SLOT_2H", "SLOT_4H", "WEDDING"].includes(p.timeType));
                if (!needsSlot) return null;

                const slotPkg = selPkgs.find(p => ["SLOT_2H", "SLOT_4H", "WEDDING"].includes(p.timeType));
                const ALL_SLOTS_2H = [
                  { value: "08:00", label: "08:00 – 10:00" }, { value: "10:00", label: "10:00 – 12:00" },
                  { value: "12:00", label: "12:00 – 14:00" }, { value: "14:00", label: "14:00 – 16:00" },
                  { value: "16:00", label: "16:00 – 18:00" }, { value: "18:00", label: "18:00 – 20:00" },
                  { value: "20:00", label: "20:00 – 22:00" },
                ];
                const ALL_SLOTS_4H = [
                  { value: "08:00-12:00", label: "08:00 – 12:00" }, { value: "10:00-14:00", label: "10:00 – 14:00" },
                  { value: "12:00-16:00", label: "12:00 – 16:00" }, { value: "14:00-18:00", label: "14:00 – 18:00" },
                  { value: "16:00-20:00", label: "16:00 – 20:00" }, { value: "18:00-22:00", label: "18:00 – 22:00" },
                ];
                const WEDDING_OPTIONS = [{ value: "GUNDUZ", label: "Gündüz" }, { value: "AKSAM", label: "Akşam" }];

                let slots = [];
                if (slotPkg.timeType === "SLOT_2H") {
                  const configured = slotPkg.availableSlots || [];
                  slots = configured.length > 0 ? ALL_SLOTS_2H.filter(s => configured.includes(s.value)) : ALL_SLOTS_2H;
                } else if (slotPkg.timeType === "SLOT_4H") {
                  const configured = slotPkg.availableSlots || [];
                  slots = configured.length > 0 ? ALL_SLOTS_4H.filter(s => configured.includes(s.value)) : ALL_SLOTS_4H;
                } else if (slotPkg.timeType === "WEDDING") {
                  slots = WEDDING_OPTIONS;
                }

                return (
                  <>
                    <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "4px", marginBottom: "-4px" }}>Saat Dilimi</div>
                    <div style={{ display: "grid", gridTemplateColumns: slotPkg.timeType === "WEDDING" ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: "4px" }}>
                      {slots.map(slot => {
                        const sel = formData.eventTime === slot.value;
                        return (
                          <button key={slot.value} type="button" onClick={() => setFormData({...formData, eventTime: slot.value})} style={{
                            padding: "10px 6px", borderRadius: 0,
                            border: sel ? "2px solid #fff" : "1px solid rgba(255,255,255,0.08)",
                            background: sel ? "#fff" : "rgba(255,255,255,0.03)",
                            color: sel ? "#000" : "rgba(255,255,255,0.5)", fontSize: "0.7rem", fontWeight: 600,
                            cursor: "pointer", transition: "all 0.2s", textAlign: "center",
                          }}>
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                  </>
                );
              })()}

              {/* Custom Field Alanları (seçilen paketlerin özel alanları) */}
              {formData.customFieldAnswers.length > 0 && (
                <>
                  <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "4px", marginBottom: "-4px" }}>Çekim Bilgileri</div>
                  {formData.customFieldAnswers.map((cfa, idx) => (
                    <div key={idx}>
                      <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", marginBottom: "3px" }}>
                        {cfa.packageName} — {cfa.label} {cfa.required ? "*" : ""}
                      </div>
                      {cfa.type === "dropdown" ? (
                        <select value={cfa.value} onChange={(e) => {
                          const arr = [...formData.customFieldAnswers]; arr[idx] = {...arr[idx], value: e.target.value};
                          setFormData({...formData, customFieldAnswers: arr});
                        }} style={inp}>
                          <option value="" style={{ background: "#111" }}>Seçiniz...</option>
                          {(cfa.options || "").split(",").map(o => o.trim()).filter(Boolean).map((o, oi) => (
                            <option key={oi} value={o} style={{ background: "#111" }}>{o}</option>
                          ))}
                        </select>
                      ) : cfa.type === "checkbox" ? (
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
                          <input type="checkbox" checked={cfa.value || false} onChange={(e) => {
                            const arr = [...formData.customFieldAnswers]; arr[idx] = {...arr[idx], value: e.target.checked};
                            setFormData({...formData, customFieldAnswers: arr});
                          }} style={{ width: "14px", height: "14px", accentColor: "#fff" }} />
                          {cfa.label}
                        </label>
                      ) : (
                        <input placeholder={cfa.label} value={cfa.value} onChange={(e) => {
                          const arr = [...formData.customFieldAnswers]; arr[idx] = {...arr[idx], value: e.target.value};
                          setFormData({...formData, customFieldAnswers: arr});
                        }} style={inp} />
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* Ek Hizmetler (seçilen paketlerin addon'ları) */}
              {packages.filter(p => formData.packageIds.includes(p.id) && p.addons?.length > 0).length > 0 && (
                <>
                  <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "4px", marginBottom: "-4px" }}>Ek Hizmetler</div>
                  {packages.filter(p => formData.packageIds.includes(p.id) && p.addons?.length > 0).map(pkg => (
                    <div key={pkg.id}>
                      <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", marginBottom: "3px" }}>{pkg.name}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {pkg.addons.map((addon, idx) => {
                          const isSelected = formData.selectedAddons.some(a => a.title === addon.title);
                          return (
                            <button key={idx} type="button" onClick={() => {
                              let cur = [...formData.selectedAddons];
                              if (isSelected) cur = cur.filter(a => a.title !== addon.title);
                              else cur.push({...addon, packageName: pkg.name});
                              // Recalculate total
                              const selPkgs = packages.filter(p => formData.packageIds.includes(p.id));
                              const pkgTotal = selPkgs.reduce((s, p) => s + (parseInt(p.price?.replace(/\./g, '').replace(/\D/g, '')) || 0), 0);
                              const addonTotal = cur.reduce((s, a) => s + (parseInt(a.price) || 0), 0);
                              const total = pkgTotal + addonTotal;
                              setFormData({...formData, selectedAddons: cur, totalAmount: total > 0 ? total.toLocaleString("tr-TR") : ""});
                            }} style={{
                              padding: "5px 10px", borderRadius: 0, fontSize: "0.65rem", cursor: "pointer",
                              border: isSelected ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(255,255,255,0.08)",
                              background: isSelected ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)",
                              color: isSelected ? "#fff" : "rgba(255,255,255,0.55)", fontWeight: isSelected ? 700 : 500,
                            }}>
                              + {addon.title} ({addon.price}₺)
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Fiyat ve Not */}
              <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "4px", marginBottom: "-4px" }}>Fiyat & Not</div>
              <input placeholder="Toplam Fiyat (TL)" style={inp} value={formData.totalAmount} onChange={(e) => setFormData({...formData, totalAmount: e.target.value})} />
              <textarea placeholder="Notlar (isteğe bağlı)" style={{ ...inp, minHeight: "50px", resize: "none" }} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "4px" }}>
                <button type="button" onClick={() => { setIsModalOpen(false); setEditModal({isOpen: false, data: null}); }} style={{ flex: 1, padding: "0.7rem", borderRadius: 0, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.5)", fontWeight: 700, cursor: "pointer", fontSize: "0.75rem" }}>İPTAL</button>
                <button type="submit" disabled={isLoading} style={{ flex: 2, padding: "0.7rem", borderRadius: 0, border: "none", background: "#fff", color: "#000", fontWeight: 900, cursor: "pointer", fontSize: "0.75rem" }}>{isLoading ? "..." : (editModal.isOpen ? "GÜNCELLE" : "KAYDET")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Workflow Modal ── */}
      {workflowModal.isOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 1000, padding: "1rem", overflowY: "auto" }}>
          <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 0, width: "100%", maxWidth: "380px", padding: "1.25rem", margin: "2rem 0" }}>
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
                  <option value="EDITING">Düzenleniyor</option>
                  <option value="SELECTION_PENDING">Seçim Bekleniyor</option>
                  <option value="PREPARING">Hazırlanıyor</option>
                  <option value="COMPLETED">Teslim Edildi</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "5px" }}>Teslimat Linki</div>
                <input type="url" placeholder="https://drive.google.com/..." style={inp} value={workflowData.deliveryLink} onChange={(e) => setWorkflowData({...workflowData, deliveryLink: e.target.value})} />
                <p style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.45)", marginTop: "4px" }}>Müşteri panelinde "Teslimat Klasörü" butonu olarak görünür.</p>
              </div>
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: "5px" }}>Müşteri Seçimi (Foto Numaraları)</div>
                <div style={{ ...inp, minHeight: "60px", fontSize: "0.75rem", color: workflowModal.data.selectedPhotos ? "#fff" : "rgba(255,255,255,0.2)", border: "1px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", cursor: "default", overflowY: "auto" }}>
                  {workflowModal.data.selectedPhotos || "Henüz seçim yapılmadı."}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="button" onClick={() => setWorkflowModal({isOpen: false, data: null})} style={{ flex: 1, padding: "0.65rem", borderRadius: 0, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.5)", fontWeight: 700, cursor: "pointer", fontSize: "0.72rem" }}>İPTAL</button>
                <button type="submit" disabled={isLoading} style={{ flex: 2, padding: "0.65rem", borderRadius: 0, border: "none", background: "#fff", color: "#000", fontWeight: 900, cursor: "pointer", fontSize: "0.72rem" }}>{isLoading ? "..." : "GÜNCELLE"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {detailModal.isOpen && detailModal.data && (() => {
        const r = detailModal.data;
        const wfLabels = {
          PENDING: "Çekim Bekleniyor",
          EDITING: "Düzenleniyor", SELECTION_PENDING: "Seçim Bekleniyor",
          PREPARING: "Hazırlanıyor", COMPLETED: "Teslim Edildi",
          // Legacy mappings
          SHOT_DONE: "Düzenleniyor", ALBUM_PREPARING: "Hazırlanıyor", DELIVERED: "Teslim Edildi",
        };
        const statusLabels = { PENDING: "Bekleyen", CONFIRMED: "Onaylı", COMPLETED: "Tamamlandı", CANCELLED: "İptal" };
        const sc = statusColor(r.status);
        
        const DetailRow = ({ icon: Icon, label, value, color }) => (
          value ? (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width: 28, height: 28, borderRadius: 0, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
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
            <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 0, width: "100%", maxWidth: "520px", padding: "0", margin: "2rem 0", overflow: "hidden", maxHeight: "90vh", overflowY: "auto" }}>
              
              {/* Header */}
              <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 900, margin: 0 }}>Rezervasyon Detayı</h2>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.7rem", margin: "3px 0 0" }}>ID: {r.id.slice(0, 12)}...</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ padding: "4px 10px", borderRadius: 0, fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", background: sc.bg, color: sc.c, border: sc.b }}>
                    {statusLabels[r.status] || r.status}
                  </span>
                  <button onClick={() => setDetailModal({ isOpen: false, data: null })} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", padding: "6px", borderRadius: 0, cursor: "pointer", display: "flex" }}>
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
                <DetailRow icon={User} label="Damat" value={r.groomName} color="rgba(255,255,255,0.5)" />
                <DetailRow icon={Phone} label="Damat Telefon" value={r.groomPhone} color="rgba(255,255,255,0.5)" />

                {/* ── Etkinlik Detayları ── */}
                <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "20px 0 4px" }}>📅 Etkinlik Detayları</div>
                <DetailRow icon={Calendar} label="Tarih" value={new Date(r.eventDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })} />
                <DetailRow icon={Clock} label="Saat" value={r.eventTime} />
                <DetailRow icon={CreditCard} label="Toplam Tutar" value={r.totalAmount ? `${r.totalAmount} TL` : null} />
                <DetailRow icon={CreditCard} label="Ödenen Tutar" value={r.paidAmount && r.paidAmount !== "0" ? `${r.paidAmount} TL` : null} />
                <div style={{ display: "flex", alignItems: "center", padding: "8px 0", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <FileText size={13} style={{ color: r.contractApproved ? "#fff" : "rgba(255,255,255,0.5)", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", minWidth: 110 }}>Sözleşme</span>
                  {r.contractApproved ? (
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>✅ Onaylandı</span>
                  ) : (
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>⚠️ Henüz Onaylanmadı</span>
                  )}
                </div>
                
                {/* ── Paketler ── */}
                <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "20px 0 8px" }}>📦 Seçilen Paketler ({r.packages?.length || 0})</div>
                {r.packages && r.packages.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {(() => {
                      const catLabels = { DIS_CEKIM: "Dış Çekim", DUGUN: "Düğün", NISAN: "Nişan", STANDARD: "Standart" };
                      const timeLabels = { SLOT_2H: "2 Saatlik Çekim", SLOT_4H: "4 Saatlik Çekim", WEDDING: "Düğün Boyunca", FULL_DAY: "Tam Gün", MORNING: "Sabah", EVENING: "Akşam", FIVE_HOURS: "5 Saat", SLOT: "Randevu" };
                      return r.packages.map((pkg, pkgIdx) => {
                        const pkgFields = (r.customFieldAnswers || []).filter(a => a.packageName === pkg.name && a.type !== "_hidden");
                        const pkgAddons = (r.selectedAddons || []).filter(a => a.packageName === pkg.name);
                        return (
                        <div key={pkg.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, padding: "14px 16px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: 2 }}>{pkgIdx + 1}. {pkg.name}</div>
                              <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>{pkg.description}</div>
                            </div>
                            <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#fff", flexShrink: 0, marginLeft: 12 }}>{pkg.price}₺</div>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: 8 }}>
                            <span style={{ fontSize: "0.58rem", fontWeight: 700, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", padding: "3px 8px", borderRadius: 0 }}>{catLabels[pkg.category] || pkg.category}</span>
                            <span style={{ fontSize: "0.58rem", fontWeight: 700, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", padding: "3px 8px", borderRadius: 0 }}>{timeLabels[pkg.timeType] || pkg.timeType}</span>
                            <span style={{ fontSize: "0.58rem", fontWeight: 700, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", padding: "3px 8px", borderRadius: 0 }}>{pkg.deliveryTimeDays || 14} gün içinde teslim</span>
                            {pkg.postSelectionDays > 0 && (
                              <span style={{ fontSize: "0.58rem", fontWeight: 700, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.7)", padding: "3px 8px", borderRadius: 0 }}>+{pkg.postSelectionDays} gün seçim süresi</span>
                            )}
                          </div>
                          {pkg.features && pkg.features.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                              {pkg.features.map((f, i) => (
                                <span key={i} style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)" }}>• {f}</span>
                              ))}
                            </div>
                          )}
                          {/* Package-specific custom fields */}
                          {pkgFields.length > 0 && (
                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                              <div style={{ fontSize: "0.55rem", fontWeight: 800, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 4 }}>Çekim Bilgileri</div>
                              {pkgFields.map((answer, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                                  <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>{answer.label}</span>
                                  <span style={{ fontSize: "0.78rem", color: "#fff", fontWeight: 700 }}>
                                    {answer.type === "checkbox" ? (answer.value ? "✅ Evet" : "❌ Hayır") : (answer.value || "—")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Package-specific addons */}
                          {pkgAddons.length > 0 && (
                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                              <div style={{ fontSize: "0.55rem", fontWeight: 800, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 4 }}>Ek Hizmetler</div>
                              {pkgAddons.map((addon, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                                  <span style={{ fontSize: "0.72rem", color: "#fff", fontWeight: 600 }}>+ {addon.title}</span>
                                  <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>{addon.price}₺</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                      });
                    })()}
                  </div>
                ) : (
                  <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>Paket seçilmemiş</p>
                )}

                {/* Unmatched custom fields & addons (legacy data without packageName) */}
                {(() => {
                  const unmatchedFields = (r.customFieldAnswers || []).filter(a => !a.packageName && a.type !== "_hidden");
                  const unmatchedAddons = (r.selectedAddons || []).filter(a => !a.packageName);
                  if (unmatchedFields.length === 0 && unmatchedAddons.length === 0) return null;
                  return (
                    <>
                      {unmatchedFields.length > 0 && (
                        <>
                          <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "20px 0 8px" }}>📝 Çekim Bilgileri</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {unmatchedFields.map((answer, i) => (
                              <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, padding: "10px 14px" }}>
                                <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>{answer.label}</div>
                                <div style={{ fontSize: "0.82rem", color: "#fff", fontWeight: 600 }}>
                                  {answer.type === "checkbox" ? (answer.value ? "✅ Evet" : "❌ Hayır") : (answer.value || "—")}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      {unmatchedAddons.length > 0 && (
                        <>
                          <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "20px 0 8px" }}>➕ Ek Hizmetler</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {unmatchedAddons.map((addon, i) => (
                              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, padding: "10px 14px" }}>
                                <span style={{ fontSize: "0.78rem", color: "#fff", fontWeight: 600 }}>{addon.title}</span>
                                <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>{addon.price}₺</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}

                {/* ── Notlar ── */}
                <DetailRow icon={FileText} label="Notlar" value={r.notes} />

                {/* ── Ödeme Takibi ── */}
                {(() => {
                  const totalAmount = parseFloat(r.totalAmount?.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || '0');
                  const payments = r.payments || [];
                  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
                  const remaining = Math.max(0, totalAmount - totalPaid);
                  const pct = totalAmount > 0 ? Math.min(100, (totalPaid / totalAmount) * 100) : 0;
                  const isPaid = totalPaid >= totalAmount && totalAmount > 0;
                  const methodLabels = { CASH: "Nakit", BANK_TRANSFER: "Havale/EFT", CREDIT_CARD: "Kredi Kartı", ONLINE: "Online" };
                  const methodColors = { CASH: "#fff", BANK_TRANSFER: "rgba(255,255,255,0.5)", CREDIT_CARD: "#f59e0b", ONLINE: "rgba(255,255,255,0.6)" };

                  const handleAddPayment = async (e) => {
                    e.preventDefault();
                    setPaymentLoading(true);
                    const res = await addPayment(detailModal.data.id, {
                      amount: parseFloat(paymentForm.amount),
                      method: paymentForm.method,
                      note: paymentForm.note
                    });
                    if (res.success) {
                      setPaymentForm({ amount: "", method: "CASH", note: "" });
                      loadData();
                      // Yalnızca arayüzü güncelle, modalı kapatma ki kullanıcı hemen sonucu görsün
                      const updatedRes = await getReservations();
                      setDetailModal({ isOpen: true, data: updatedRes.find(r => r.id === detailModal.data.id) });
                    } else {
                      alert("Ödeme eklenemedi: " + res.error);
                    }
                    setPaymentLoading(false);
                  };

                  const handleAddExtraFee = async (e) => {
                    e.preventDefault();
                    if (!detailModal.data) return;
                    setExtraFeeLoading(true);
                    try {
                      const { addReservationExtraFee } = await import('../core-actions');
                      const res = await addReservationExtraFee(detailModal.data.id, extraFeeForm.amount, extraFeeForm.note);
                      if (res.success) {
                        setExtraFeeForm({ amount: "", note: "" });
                        loadData();
                        const updatedRes = await getReservations();
                        setDetailModal({ isOpen: true, data: updatedRes.find(r => r.id === detailModal.data.id) });
                      } else {
                        alert("Ekstra fiyat eklenemedi: " + res.error);
                      }
                    } catch (err) {
                      console.error(err);
                      alert("Hata oluştu.");
                    }
                    setExtraFeeLoading(false);
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
                      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 0, padding: "16px", marginBottom: "10px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 4 }}>Toplam</div>
                            <div style={{ fontSize: "1rem", fontWeight: 800, color: "#fff" }}>{totalAmount.toLocaleString('tr-TR')}₺</div>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 4 }}>Ödenen</div>
                            <div style={{ fontSize: "1rem", fontWeight: 800, color: "#fff" }}>{totalPaid.toLocaleString('tr-TR')}₺</div>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "0.58rem", fontWeight: 700, color: isPaid ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 4 }}>Kalan</div>
                            <div style={{ fontSize: "1rem", fontWeight: 800, color: isPaid ? "#fff" : "rgba(255,255,255,0.7)" }}>{remaining.toLocaleString('tr-TR')}₺</div>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div style={{ height: 6, borderRadius: 0, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 0, background: isPaid ? "#fff" : pct > 0 ? "linear-gradient(90deg, #fff, rgba(255,255,255,0.7))" : "transparent", width: `${pct}%`, transition: "width 0.5s ease" }} />
                        </div>
                        <div style={{ textAlign: "center", marginTop: 6, fontSize: "0.62rem", fontWeight: 700, color: isPaid ? "#fff" : "rgba(255,255,255,0.4)" }}>
                          {isPaid ? "✅ Tamamen Ödendi" : `%${Math.round(pct)} ödendi`}
                        </div>
                      </div>

                      {/* Add Payment Form */}
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, padding: "12px", marginBottom: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>Ödeme Ekle</div>
                          {r.paymentPreference && (
                            <div style={{ fontSize: "0.55rem", fontWeight: 700, padding: "2px 8px", borderRadius: 0, background: r.paymentPreference === "CASH" ? "rgba(255,255,255,0.06)" : "rgba(96,165,250,0.1)", color: r.paymentPreference === "CASH" ? "#fff" : "rgba(255,255,255,0.5)", border: `1px solid ${r.paymentPreference === "CASH" ? "rgba(255,255,255,0.12)" : "rgba(96,165,250,0.2)"}` }}>
                              {r.paymentPreference === "CASH" ? "💵 Nakit Tercih" : "💳 Kart Tercih"}
                            </div>
                          )}
                        </div>
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
                              padding: "8px 16px", borderRadius: 0, border: "none",
                              background: paymentForm.amount ? "#fff" : "rgba(255,255,255,0.06)",
                              color: paymentForm.amount ? "#000" : "rgba(255,255,255,0.3)",
                              fontWeight: 800, fontSize: "0.72rem", cursor: paymentForm.amount ? "pointer" : "not-allowed",
                              flexShrink: 0,
                            }}
                          >
                            {paymentLoading ? "..." : "+ Ekle"}
                          </button>
                        </div>
                      </div>

                      {/* Add Extra Fee */}
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 0, padding: "14px", marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.05em" }}>➕ Ekstra Fiyat / Hizmet Ekle</span>
                        </div>
                        <div style={{ display: "flex", gap: "8px", marginBottom: 8 }}>
                          <input 
                            type="text" 
                            placeholder="Açıklama / Notlar" 
                            value={extraFeeForm.note} 
                            onChange={(e) => setExtraFeeForm(p => ({ ...p, note: e.target.value }))} 
                            style={{ ...inp, fontSize: "0.78rem", flex: 1 }} 
                          />
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input 
                            type="number" 
                            placeholder="Tutar (₺)" 
                            value={extraFeeForm.amount} 
                            onChange={(e) => setExtraFeeForm(p => ({ ...p, amount: e.target.value }))} 
                            style={{ ...inp, fontSize: "0.78rem", width: "120px" }} 
                          />
                          <button 
                            onClick={(e) => {
                               setExtraFeeModal({ isOpen: true, data: detailModal.data });
                               handleAddExtraFee(e);
                            }} 
                            disabled={!extraFeeForm.amount || !extraFeeForm.note || extraFeeLoading}
                            style={{ 
                              padding: "8px 16px", borderRadius: 0, border: "none",
                              background: (extraFeeForm.amount && extraFeeForm.note) ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.06)",
                              color: (extraFeeForm.amount && extraFeeForm.note) ? "#000" : "rgba(255,255,255,0.3)",
                              fontWeight: 800, fontSize: "0.72rem", cursor: (extraFeeForm.amount && extraFeeForm.note) ? "pointer" : "not-allowed",
                              flexShrink: 0, flex: 1
                            }}
                          >
                            {extraFeeLoading ? "..." : "Toplama Dahil Et ve Gözükmesini Sağla"}
                          </button>
                        </div>
                      </div>

                      {/* Unified Timeline Action Log */}
                      {(() => {
                        const rawLogs = r.paymentLogs || [];
                        const legacyPayments = payments.filter(p => {
                          const pTime = new Date(p.createdAt).getTime();
                          return !rawLogs.some(l => l.type === "ADD_PAYMENT" && Math.abs(new Date(l.date).getTime() - pTime) < 5000);
                        }).map(p => ({
                          id: p.id,
                          date: p.createdAt,
                          type: "ADD_PAYMENT",
                          amount: `+ ${p.amount.toLocaleString('tr-TR')}₺`,
                          description: `${methodLabels[p.method] || p.method} ödemesi (Eski Kayıt)`
                        }));
                        
                        const timeline = [...rawLogs, ...legacyPayments].sort((a, b) => new Date(b.date) - new Date(a.date));
                        
                        if (timeline.length === 0) return null;

                        const getLogIcon = (type) => {
                           switch(type) {
                             case "ADD_PAYMENT": return <CreditCard size={12} style={{ color: "#fff" }} />;
                             case "DELETE_PAYMENT": return <X size={12} style={{ color: "rgba(255,255,255,0.5)" }} />;
                             case "CARD_CONVERSION": return <CreditCard size={12} style={{ color: "rgba(255,255,255,0.7)" }} />;
                             case "EXTRA_FEE": return <AlertTriangle size={12} style={{ color: "#f97316" }} />;
                             case "CASH_REVERSION": return <Banknote size={12} style={{ color: "rgba(255,255,255,0.6)" }} />;
                             default: return <Circle size={12} style={{ color: "#888" }} />;
                           }
                        };

                        return (
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 12 }}>Tüm Hesap / Aksiyon Hareketleri</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "relative" }}>
                              {/* Vertical timeline line */}
                              <div style={{ position: "absolute", left: 15, top: 10, bottom: 10, width: 2, background: "rgba(255,255,255,0.05)", zIndex: 0 }} />
                              
                              {timeline.map((log) => {
                                const isPositive = log.amount && log.amount.includes("+");
                                const isNegative = log.amount && log.amount.includes("-");
                                return (
                                <div key={log.id} style={{ display: "flex", gap: 12, position: "relative", zIndex: 1 }}>
                                  <div style={{ width: 32, height: 32, borderRadius: 0, background: "#111", border: "2px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    {getLogIcon(log.type)}
                                  </div>
                                  <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 0, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                      <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>{log.description}</span>
                                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontSize: "0.7rem", fontWeight: 800, color: isPositive ? "#fff" : (isNegative ? "rgba(255,255,255,0.5)" : "#fff"), whiteSpace: "nowrap" }}>{log.amount}</span>
                                        {log.type === "ADD_PAYMENT" && log.paymentId && (
                                          <button 
                                            onClick={() => handleDeletePayment(log.paymentId)}
                                            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 4, display: "flex", flexShrink: 0 }}
                                            title="Ödemeyi Sil / İptal Et"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>
                                      {new Date(log.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })} · {new Date(log.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {log.totalSnapshot !== undefined && log.paidSnapshot !== undefined && (
                                      <div style={{ display: "flex", gap: 8, marginTop: 4, paddingTop: 4, borderTop: "1px dashed rgba(255,255,255,0.06)", flexWrap: "wrap" }}>
                                        <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>
                                          <span style={{color:"rgba(255,255,255,0.2)"}}>TOPLAM:</span> {log.totalSnapshot.toLocaleString('tr-TR')}₺
                                        </div>
                                        <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "#fff" }}>
                                          <span style={{color:"rgba(74,222,128,0.4)"}}>ÖDENEN:</span> {log.paidSnapshot.toLocaleString('tr-TR')}₺
                                        </div>
                                        <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
                                          <span style={{color:"rgba(255,255,255,0.35)"}}>KALAN:</span> {(Math.max(0, log.totalSnapshot - log.paidSnapshot)).toLocaleString('tr-TR')}₺
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )})}
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  );
                })()}

                {/* ── İş Akışı (Progress Bar) ── */}
                <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "20px 0 8px" }}>⚙️ İş Akışı</div>
                {(() => {
                  const wfSteps = [
                    { id: "PENDING", title: "Bekleniyor", desc: "Çekim Günü" },
                    { id: "EDITING", title: "Düzenleniyor", desc: "Fotoğraf İşleme" },
                    { id: "SELECTION_PENDING", title: "Seçim", desc: "Müşteri Seçimi" },
                    { id: "PREPARING", title: "Hazırlanıyor", desc: "Proje Hazırlık" },
                    { id: "COMPLETED", title: "Teslim Edildi", desc: "Tamamlandı" },
                  ];
                  // Map legacy statuses
                  const mappedStatus = r.workflowStatus === "SHOT_DONE" ? "EDITING" : r.workflowStatus === "ALBUM_PREPARING" ? "PREPARING" : r.workflowStatus === "DELIVERED" ? "COMPLETED" : r.workflowStatus;
                  const currentIdx = wfSteps.findIndex(s => s.id === mappedStatus);

                  return (
                    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, padding: "16px 14px" }}>
                      {/* Progress Bar */}
                      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                        {/* Background line */}
                        <div style={{ position: "absolute", top: 11, left: "10%", right: "10%", height: 2, background: "rgba(255,255,255,0.08)", borderRadius: 0 }} />
                        {/* Active line */}
                        <div style={{ position: "absolute", top: 11, left: "10%", height: 2, background: "rgba(255,255,255,0.5)", borderRadius: 0, transition: "all 0.5s", width: currentIdx >= 0 ? `${(currentIdx / 4) * 80}%` : "0%" }} />

                        {wfSteps.map((step, idx) => {
                          const isCompleted = currentIdx > idx;
                          const isCurrent = currentIdx === idx;
                          return (
                            <div key={step.id} style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textAlign: "center", flex: 1 }}>
                              <div style={{
                                width: 22, height: 22, borderRadius: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", fontWeight: 800, transition: "all 0.3s",
                                ...(isCompleted ? { background: "#fff", color: "#000" } :
                                  isCurrent ? { background: "#fff", color: "#000", boxShadow: "0 0 10px rgba(255,255,255,0.3)" } :
                                  { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" })
                              }}>
                                {isCompleted ? "✓" : (idx + 1)}
                              </div>
                              <div style={{ fontSize: "0.55rem", fontWeight: isCurrent ? 800 : 600, color: isCurrent ? "#fff" : isCompleted ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)", lineHeight: 1.2 }}>
                                {step.title}
                              </div>
                              <div style={{ fontSize: "0.45rem", color: "rgba(255,255,255,0.2)", lineHeight: 1.1 }}>
                                {step.desc}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Delivery info */}
                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                        {r.deliveryLink && (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)" }}>Teslimat Linki</span>
                            <a href={r.deliveryLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                              <ExternalLink size={11} /> Aç
                            </a>
                          </div>
                        )}
                        {r.deliveryDate && (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)" }}>Teslim Tarihi</span>
                            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#fff" }}>{new Date(r.deliveryDate).toLocaleDateString('tr-TR')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* ── Fotoğraf Seçimi ── */}
                {r.selectedPhotos && (
                  <>
                    <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "20px 0 8px" }}>📸 Müşteri Fotoğraf Seçimi</div>
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, padding: "14px", fontSize: "0.78rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.6, wordBreak: "break-all" }}>
                      {r.selectedPhotos}
                    </div>
                  </>
                )}

                {/* ── Albüm Modeli ── */}
                {r.albumModel && (
                  <>
                    <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "20px 0 8px" }}>📚 Albüm Seçimi</div>
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: 0, padding: "14px", display: "flex", gap: "12px", alignItems: "center" }}>
                      <div style={{ width: 48, height: 48, borderRadius: 0, overflow: "hidden", background: "#000", flexShrink: 0 }}>
                        <img src={r.albumModel.imageUrl} alt="Album" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.9rem", color: "#fff", fontWeight: 700 }}>{r.albumModel.name}</div>
                        {r.albumModel.description && <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{r.albumModel.description}</div>}
                      </div>
                    </div>
                  </>
                )}

                {/* ── Hatırlatma Gönder ── */}
                <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "20px 0 8px" }}>✉️ Hatırlatma Gönder</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {!r.contractApproved && (
                    <button
                      disabled={reminderLoading === "contract"}
                      onClick={async () => {
                        setReminderLoading("contract");
                        setReminderResult(null);
                        const res = await sendContractReminder(r.id);
                        setReminderResult(res.success ? { type: "success", msg: "Sözleşme hatırlatması gönderildi" } : { type: "error", msg: res.error });
                        setReminderLoading("");
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 0, color: "#fff", fontSize: "0.75rem", fontWeight: 700,
                        cursor: reminderLoading === "contract" ? "not-allowed" : "pointer",
                        opacity: reminderLoading === "contract" ? 0.5 : 1, transition: "all 0.2s",
                        textAlign: "left",
                      }}
                    >
                      <Mail size={14} style={{ flexShrink: 0 }} />
                      <div>
                        <div>{reminderLoading === "contract" ? "Gönderiliyor..." : "Sözleşme Onayı Hatırlat"}</div>
                        <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>Müşteriye sözleşmeyi onaylaması gerektiğini hatırlatır</div>
                      </div>
                    </button>
                  )}
                  <button
                    disabled={reminderLoading === "credentials"}
                    onClick={async () => {
                      if (!confirm("Müşteriye yeni şifre oluşturulup gönderilecek. Eski şifre geçersiz olacak. Devam edilsin mi?")) return;
                      setReminderLoading("credentials");
                      setReminderResult(null);
                      const res = await resendCredentials(r.id);
                      setReminderResult(res.success ? { type: "success", msg: "Giriş bilgileri gönderildi" } : { type: "error", msg: res.error });
                      setReminderLoading("");
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 0, color: "#fff", fontSize: "0.75rem", fontWeight: 700,
                      cursor: reminderLoading === "credentials" ? "not-allowed" : "pointer",
                      opacity: reminderLoading === "credentials" ? 0.5 : 1, transition: "all 0.2s",
                      textAlign: "left",
                    }}
                  >
                    <Mail size={14} style={{ flexShrink: 0 }} />
                    <div>
                      <div>{reminderLoading === "credentials" ? "Gönderiliyor..." : "Giriş Bilgilerini Tekrar Gönder"}</div>
                      <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>Yeni şifre oluşturur ve e-posta ile gönderir</div>
                    </div>
                  </button>
                  {reminderResult && (
                    <div style={{
                      padding: "8px 12px", fontSize: "0.72rem", fontWeight: 600,
                      background: reminderResult.type === "success" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${reminderResult.type === "success" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.1)"}`,
                      color: reminderResult.type === "success" ? "#fff" : "rgba(255,255,255,0.6)",
                    }}>
                      {reminderResult.type === "success" ? "✓" : "✕"} {reminderResult.msg}
                    </div>
                  )}
                </div>

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

      {/* ── Quick Event Modal ── */}
      {quickEventModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 1000, padding: "1rem", overflowY: "auto" }}>
          <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 0, width: "100%", maxWidth: "380px", padding: "1.25rem", position: "relative", margin: "3rem 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 900, margin: 0 }}>
                <Star size={16} style={{ marginRight: 6, verticalAlign: "middle", color: "rgba(255,255,255,0.5)" }} />
                Hızlı Olay Ekle
              </h2>
              <button onClick={() => setQuickEventModal(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setQuickEventLoading(true);
              const res = await createQuickEvent(quickEventForm);
              if (res.success) {
                setQuickEventModal(false);
                setQuickEventForm({ venueName: "", eventDate: "", startTime: "", endTime: "", notes: "", totalAmount: "", initialPaymentAmount: "", paymentMethod: "CASH" });
                loadData();
              } else {
                alert("Hata: " + res.error);
              }
              setQuickEventLoading(false);
            }} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>Başlık / Mekan Adı *</label>
                <input required placeholder="Örn: Hilton Düğün Salonu" style={inp} value={quickEventForm.venueName} onChange={(e) => setQuickEventForm({...quickEventForm, venueName: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>Tarih *</label>
                <input type="date" required style={{ ...inp, colorScheme: "dark" }} value={quickEventForm.eventDate} onChange={(e) => setQuickEventForm({...quickEventForm, eventDate: e.target.value})} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <div>
                  <label style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>Başlangıç</label>
                  <input type="time" style={{ ...inp, colorScheme: "dark" }} value={quickEventForm.startTime} onChange={(e) => setQuickEventForm({...quickEventForm, startTime: e.target.value})} />
                </div>
                <div>
                  <label style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>Bitiş</label>
                  <input type="time" style={{ ...inp, colorScheme: "dark" }} value={quickEventForm.endTime} onChange={(e) => setQuickEventForm({...quickEventForm, endTime: e.target.value})} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>Detay / Not</label>
                <textarea placeholder="Opsiyonel notlar..." style={{ ...inp, minHeight: 60, resize: "vertical" }} value={quickEventForm.notes} onChange={(e) => setQuickEventForm({...quickEventForm, notes: e.target.value})} />
              </div>

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12, marginTop: 4 }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>💰 Ödeme Bilgileri</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <div>
                    <label style={{ fontSize: "0.55rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 3 }}>Toplam Tutar</label>
                    <input type="text" placeholder="Örn: 15000" style={inp} value={quickEventForm.totalAmount} onChange={(e) => setQuickEventForm({...quickEventForm, totalAmount: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.55rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 3 }}>Ön Ödeme</label>
                    <input type="text" placeholder="Örn: 5000" style={inp} value={quickEventForm.initialPaymentAmount} onChange={(e) => setQuickEventForm({...quickEventForm, initialPaymentAmount: e.target.value})} />
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <label style={{ fontSize: "0.55rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 3 }}>Ödeme Yöntemi</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[
                      { v: "CASH", l: "💵 Nakit" },
                      { v: "BANK_TRANSFER", l: "🏦 Havale" },
                      { v: "CREDIT_CARD", l: "💳 Kart" },
                    ].map(m => (
                      <button key={m.v} type="button" onClick={() => setQuickEventForm({...quickEventForm, paymentMethod: m.v})}
                        style={{
                          padding: "6px 12px", borderRadius: 0, border: "none", cursor: "pointer",
                          background: quickEventForm.paymentMethod === m.v ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.05)",
                          color: quickEventForm.paymentMethod === m.v ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.4)",
                          fontWeight: 700, fontSize: "0.65rem", transition: "all 0.15s",
                        }}
                      >
                        {m.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button type="submit" disabled={quickEventLoading} style={{
                padding: "0.75rem", borderRadius: 0, border: "none",
                background: "rgba(255,255,255,0.5)", color: "#fff", fontWeight: 800, fontSize: "0.8rem",
                cursor: "pointer", opacity: quickEventLoading ? 0.6 : 1, transition: "all 0.2s",
                marginTop: 4,
              }}>
                {quickEventLoading ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
