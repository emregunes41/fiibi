"use client";

import { useState, useEffect } from "react";
import { Plus, Calendar, Phone, Settings2, X, Edit2, Eye, Mail, User, Package, Clock, FileText, CreditCard, ChevronDown, ChevronUp, Instagram, ExternalLink, Trash2, Banknote, DollarSign, List, CalendarDays, ChevronLeft, ChevronRight, ArrowUpDown, Filter, Search, Star, Ban } from "lucide-react";
import { getReservations, getPackages, createManualReservation, updateReservation, updateReservationStatus, updateReservationWorkflow, addPayment, deletePayment, softDeleteReservation, hardDeleteReservation, createQuickEvent, getBlockedDays, toggleBlockedDay, getSiteConfig } from "../core-actions";
import { sendContractReminder, resendCredentials } from "../reminder-actions";
import { getBusinessType } from "@/lib/business-types";
import { useAdminSession } from "../AdminSessionContext";
import Link from "next/link";
import ReservationHubModal from "../components/ReservationHubModal";

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
    venueName: "", meetingLink: ""
  });

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
  const [quickEventForm, setQuickEventForm] = useState({ venueName: "", phone: "", eventDate: "", startTime: "", endTime: "", notes: "", totalAmount: "", initialPaymentAmount: "", paymentMethod: "CASH" });
  const [quickEventLoading, setQuickEventLoading] = useState(false);
  const [reminderLoading, setReminderLoading] = useState("");
  const [reminderResult, setReminderResult] = useState(null);
  const [dayPopup, setDayPopup] = useState(null);
  const [blockedDays, setBlockedDays] = useState([]);
  const [dayActionMenu, setDayActionMenu] = useState(null); // { dateStr, x, y }
  const { session: adminSession } = useAdminSession();
  const businessType = adminSession?.tenant?.businessType || null;

  const bt = getBusinessType(businessType);
  const { terms } = bt;
  const isPhotographer = businessType === "photographer";
  const [paymentMode, setPaymentMode] = useState("cash");

  async function loadData() {
    try {
      const [resData, pkgData, blocked, sc] = await Promise.all([
        getReservations(),
        getPackages(),
        getBlockedDays(),
        getSiteConfig()
      ]);
      setReservations(resData || []);
      setPackages(pkgData || []);
      setBlockedDays(blocked || []);
      setPaymentMode(sc?.paymentMode || "cash");
    } catch (e) {}
  }

  const toggleSelectionExpand = (id) => {
    setExpandedSelections(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const displayName = (r) => {
    if (isPhotographer) return `${r.brideName}${r.groomName ? ` & ${r.groomName}` : ''}`;
    return r.brideName || '';
  };

  useEffect(() => {
    loadData();
    getBlockedDays().then(setBlockedDays).catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && reservations.length > 0 && !detailModal.isOpen) {
      const searchParams = new URLSearchParams(window.location.search);
      const modalId = searchParams.get("open_modal");
      if (modalId) {
        const res = reservations.find(r => r.id === modalId);
        if (res) {
          setDetailModal({ isOpen: true, data: res });
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
    }
  }, [reservations, detailModal.isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await createManualReservation(formData);

    if (res.success) {
      setIsModalOpen(false);
      setFormData({ brideName: "", bridePhone: "", brideEmail: "", groomName: "", groomPhone: "", groomEmail: "", eventDate: "", eventTime: "", packageIds: [], notes: "", selectedAddons: [], customFieldAnswers: [], totalAmount: "", venueName: "", meetingLink: "" });
      loadData();
    } else { alert("Hata: " + res.error); }
    setIsLoading(false);
  };

  const handleStatusChange = async (id, status) => {
    await updateReservationStatus(id, status);
    loadData();
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
    if (s === "CONFIRMED") return { bg: "rgba(34,197,94,0.12)", c: "#4ade80", b: "1px solid rgba(34,197,94,0.25)" };
    if (s === "COMPLETED") return { bg: "rgba(16,185,129,0.10)", c: "#6ee7b7", b: "1px solid rgba(16,185,129,0.2)" };
    if (s === "CANCELLED") return { bg: "rgba(255,255,255,0.04)", c: "rgba(255,255,255,0.4)", b: "1px solid rgba(255,255,255,0.08)" };
    if (s === "DELETED") return { bg: "rgba(107,114,128,0.15)", c: "#9ca3af", b: "1px solid rgba(107,114,128,0.3)" };
    return { bg: "rgba(34,197,94,0.06)", c: "rgba(34,197,94,0.7)", b: "1px solid rgba(34,197,94,0.15)" };
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
            background: "#22c55e", color: "#000", padding: "0.5rem 1rem", 
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
                <button onClick={() => { setQuickEventForm({ venueName: "", phone: "", eventDate: "", startTime: "", endTime: "", notes: "", totalAmount: "", initialPaymentAmount: "", paymentMethod: "CASH" }); setQuickEventModal(true); }} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, padding: "5px 12px", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: "0.65rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "85px", gap: 2, overflowX: "hidden" }}>
              {cells.map((day, idx) => {
                if (day === null) return <div key={`e${idx}`} style={{ background: "rgba(255,255,255,0.01)", borderRadius: 0 }} />;
                
                const dayRes = resByDay[day] || [];
                const hasRes = dayRes.length > 0;
                const todayStyle = isToday(day);
                const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isDayBlocked = blockedDays.includes(dateStr);

                return (
                  <div key={day} onClick={(e) => {
                    e.stopPropagation();
                    setDayActionMenu({ dateStr, x: e.clientX, y: e.clientY, day });
                  }} style={{
                    height: "100%", borderRadius: 0, padding: "3px 4px",
                    background: isDayBlocked ? "rgba(255,60,60,0.06)" : todayStyle ? "rgba(255,255,255,0.04)" : hasRes ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)",
                    border: isDayBlocked ? "1px solid rgba(255,60,60,0.2)" : todayStyle ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.04)",
                    cursor: "pointer", overflow: "hidden",
                    transition: "all 0.15s", position: "relative",
                  }}>
                    <div style={{ fontSize: "0.7rem", fontWeight: todayStyle ? 800 : 600, color: isDayBlocked ? "rgba(255,80,80,0.7)" : todayStyle ? "rgba(255,255,255,0.5)" : hasRes ? "#fff" : "rgba(255,255,255,0.3)", marginBottom: 3, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      {day}
                      {isDayBlocked && <span style={{ fontSize: "0.45rem", fontWeight: 900, color: "rgba(255,80,80,0.6)", textTransform: "uppercase" }}>KAPALI</span>}
                    </div>
                    {dayRes.slice(0, dayRes.length <= 3 ? 3 : 2).map((r) => {
                      const sc = statusColor(r.status);
                      return (
                        <div
                          key={r.id}
                          onClick={(e) => { e.stopPropagation(); setReminderResult(null); setDetailModal({ isOpen: true, data: r }); }}
                          style={{
                            fontSize: "0.55rem", fontWeight: 700, padding: "2px 4px",
                            borderRadius: 0, marginBottom: 2, cursor: "pointer",
                            background: sc.bg, color: sc.c, whiteSpace: "nowrap",
                            overflow: "hidden", textOverflow: "ellipsis",
                            transition: "all 0.15s",
                          }}
                          title={(() => {
                            if (!isPhotographer) return displayName(r);
                            const venueLabels = ["mekan", "konum", "salon", "yer", "adres", "lokasyon", "düğün salonu", "nerede", "alanı", "alan"];
                            const cfa = r.customFieldAnswers || [];
                            const venueField = cfa.find(a => a.value && venueLabels.some(l => a.label?.toLowerCase().includes(l)));
                            return venueField?.value || r.venueName || displayName(r);
                          })()}
                        >
                          {(() => {
                            if (!isPhotographer) return displayName(r);
                            const venueLabels = ["mekan", "konum", "salon", "yer", "adres", "lokasyon", "düğün salonu", "nerede", "alanı", "alan"];
                            const cfa = r.customFieldAnswers || [];
                            const venueField = cfa.find(a => a.value && venueLabels.some(l => a.label?.toLowerCase().includes(l)));
                            return venueField?.value || r.venueName || displayName(r);
                          })()}
                        </div>
                      );
                    })}
                    {dayRes.length > 3 && (
                      <div onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDayPopup({ day, reservations: dayRes, x: rect.left, y: rect.bottom + 4 });
                      }} style={{ fontSize: "0.48rem", color: "rgba(34,197,94,0.8)", fontWeight: 700, paddingLeft: 2, cursor: "pointer" }}>
                        +{dayRes.length - 2} daha
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Day Popup - tüm rezervasyonlar */}
            {dayPopup && (
              <>
                <div onClick={() => setDayPopup(null)} style={{ position: "fixed", inset: 0, zIndex: 999 }} />
                <div style={{
                  position: "fixed", left: Math.min(dayPopup.x, window.innerWidth - 260), top: Math.min(dayPopup.y, window.innerHeight - 200),
                  zIndex: 1000, background: "#111", border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 0, padding: "10px 12px", minWidth: 220, maxWidth: 280, maxHeight: 250, overflowY: "auto",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 8 }}>
                    {dayPopup.day} {monthNames[calMonth]} — {dayPopup.reservations.length} Rezervasyon
                  </div>
                  {dayPopup.reservations.map((r) => {
                    const sc = statusColor(r.status);
                    return (
                      <div key={r.id} onClick={() => { setDayPopup(null); setReminderResult(null); setDetailModal({ isOpen: true, data: r }); }}
                        style={{
                          padding: "6px 8px", marginBottom: 4, cursor: "pointer",
                          background: sc.bg, border: `1px solid ${sc.b.split('solid ')[1]}`,
                          fontSize: "0.65rem", fontWeight: 700, color: sc.c,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          transition: "all 0.15s",
                        }}>
                        {displayName(r)}
                        {r.eventTime && <span style={{ color: "rgba(255,255,255,0.3)", marginLeft: 6 }}>{r.eventTime}</span>}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

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
                          onClick={() => { setReminderResult(null); setDetailModal({ isOpen: true, data: r }); }}
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
                                {displayName(r)}
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
          { key: "event_soon", label: `📅 ${isPhotographer ? "Etkinlik" : terms.appointment} Yakın` },
          ...(isPhotographer ? [{ key: "delivery_soon", label: "📦 Teslim Yakın" }] : []),
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
                  onClick={() => { setReminderResult(null); setDetailModal({ isOpen: true, data: res }); }}
                  style={{ fontWeight: 700, fontSize: "0.85rem", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Eye size={12} style={{ opacity: 0.4, flexShrink: 0 }} />
                  {displayName(res)}
                </div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  {isPhotographer && (res.contractApproved ? (
                    <span style={{ padding: "3px 6px", borderRadius: 0, fontSize: "0.55rem", fontWeight: 800, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(74,222,128,0.3)" }}>📝 Sözleşme ✓</span>
                  ) : (
                    <span style={{ padding: "3px 6px", borderRadius: 0, fontSize: "0.55rem", fontWeight: 800, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.12)" }}>📝 Onay Yok</span>
                  ))}
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
                        onClick={() => { setReminderResult(null); setDetailModal({ isOpen: true, data: res }); }}
                        style={{
                          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.5)", padding: "4px", borderRadius: 0,
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                        title="Düzenle"
                      >
                        <Edit2 size={12} />
                      </button>

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

      {/* ── New Reservation Modal ── */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 1000, padding: "1rem", overflowY: "auto" }}>
          <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 0, width: "100%", maxWidth: "420px", padding: "1.25rem", position: "relative", margin: "2rem 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 900, margin: 0 }}>Yeni Rezervasyon</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

              {/* Mekan / Detay */}
              <div>
                <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{isPhotographer ? "Mekan Adı" : "Detay / Not"}</div>
                <input placeholder={isPhotographer ? "Opsiyonel: Salon adı, konum vb." : "Opsiyonel not"} style={inp} value={formData.venueName} onChange={(e) => setFormData({...formData, venueName: e.target.value})} />
              </div>

              {/* Online Görüşme Linki */}
              <div>
                <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Online Görüşme Linki</div>
                <input placeholder="Örn: https://zoom.us/j/... veya Google Meet linki" style={inp} value={formData.meetingLink} onChange={(e) => setFormData({...formData, meetingLink: e.target.value})} />
              </div>

              {/* İletişim Bilgileri */}
              <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "-4px" }}>İletişim Bilgileri</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <input placeholder={isPhotographer ? "Gelin Adı *" : `${terms.client} Adı *`} required style={inp} value={formData.brideName} onChange={(e) => setFormData({...formData, brideName: e.target.value})} />
                <input placeholder={isPhotographer ? "Damat Adı *" : "İkinci Kişi Adı"} required={isPhotographer} style={inp} value={formData.groomName} onChange={(e) => setFormData({...formData, groomName: e.target.value})} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <input placeholder={isPhotographer ? "Gelin Telefon *" : `${terms.client} Telefon *`} required style={inp} value={formData.bridePhone} onChange={(e) => setFormData({...formData, bridePhone: e.target.value})} />
                <input placeholder={isPhotographer ? "Damat Telefon" : "İkinci Kişi Telefon"} style={inp} value={formData.groomPhone} onChange={(e) => setFormData({...formData, groomPhone: e.target.value})} />
              </div>
              <input placeholder={isPhotographer ? "Gelin E-posta *" : `${terms.client} E-posta *`} type="email" required style={inp} value={formData.brideEmail} onChange={(e) => setFormData({...formData, brideEmail: e.target.value})} />

              {/* Tarih */}
              <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "4px", marginBottom: "-4px" }}>{isPhotographer ? "Etkinlik Tarihi" : `${terms.appointment} Tarihi`}</div>
              <input type="date" required style={{ ...inp, colorScheme: "dark" }} value={formData.eventDate} onChange={(e) => setFormData({...formData, eventDate: e.target.value})} />

              {/* Paket Seçimi - Detaylı */}
              <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "4px", marginBottom: "-4px" }}>Paket Seçimi</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {(() => {
                  const catLabels = { DIS_CEKIM: "Dış Çekim", DUGUN: "Düğün", NISAN: "Nişan", STANDARD: "Standart", CUSTOM_DURATION: "Randevu" };
                  const timeLabels = { SLOT_2H: "2 Saatlik", SLOT_4H: "4 Saatlik", WEDDING: "Düğün Boyunca", FULL_DAY: "Tam Gün", CUSTOM_DURATION: "Süreye Göre" };
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
                  <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "4px", marginBottom: "-4px" }}>{isPhotographer ? "Çekim Bilgileri" : "Ek Bilgiler"}</div>
                  {formData.customFieldAnswers.map((cfa, idx) => (
                    <div key={idx}>
                      <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", marginBottom: "3px" }}>
                        {cfa.packageName} — {cfa.label} {cfa.required ? "*" : ""}
                      </div>
                      {cfa.type === "dropdown" ? (() => {
                        const opts = (cfa.options || "").split(",").map(o => o.trim()).filter(Boolean);
                        const isOther = cfa.value === "__OTHER__" || (cfa.value && !opts.includes(cfa.value) && cfa.value !== "");
                        return (
                          <>
                            <select value={isOther ? "__OTHER__" : cfa.value} onChange={(e) => {
                              const arr = [...formData.customFieldAnswers];
                              arr[idx] = {...arr[idx], value: e.target.value === "__OTHER__" ? "__OTHER__" : e.target.value};
                              setFormData({...formData, customFieldAnswers: arr});
                            }} style={inp}>
                              <option value="" style={{ background: "#111" }}>Seçiniz...</option>
                              {opts.map((o, oi) => (
                                <option key={oi} value={o} style={{ background: "#111" }}>{o}</option>
                              ))}
                              <option value="__OTHER__" style={{ background: "#111" }}>Diğer...</option>
                            </select>
                            {isOther && (
                              <input placeholder="Lütfen belirtiniz..." value={cfa.value === "__OTHER__" ? "" : cfa.value} onChange={(e) => {
                                const arr = [...formData.customFieldAnswers];
                                arr[idx] = {...arr[idx], value: e.target.value || "__OTHER__"};
                                setFormData({...formData, customFieldAnswers: arr});
                              }} style={{...inp, marginTop: "4px"}} autoFocus />
                            )}
                          </>
                        );
                      })() : cfa.type === "checkbox" ? (
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
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: "0.7rem", borderRadius: 0, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.5)", fontWeight: 700, cursor: "pointer", fontSize: "0.75rem" }}>İPTAL</button>
                <button type="submit" disabled={isLoading} style={{ flex: 2, padding: "0.7rem", borderRadius: 0, border: "none", background: "#fff", color: "#000", fontWeight: 900, cursor: "pointer", fontSize: "0.75rem" }}>{isLoading ? "..." : "KAYDET"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ReservationHubModal 
        isOpen={detailModal.isOpen} 
        reservation={detailModal.data} 
        onClose={() => setDetailModal({ isOpen: false, data: null })} 
        onUpdate={async () => {
          await loadData();
        }}
        isPhotographer={isPhotographer}
        terms={terms}
        paymentMode={paymentMode}
        onDelete={handleDeleteReservation}
      />

      {/* ── Day Action Menu ── */}
      {dayActionMenu && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999 }} onClick={() => setDayActionMenu(null)}>
          <div style={{
            position: "fixed",
            left: Math.min(dayActionMenu.x, window.innerWidth - 200),
            top: Math.min(dayActionMenu.y, window.innerHeight - 120),
            background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.15)",
            padding: "4px", minWidth: 180, zIndex: 1001,
          }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => {
              setQuickEventForm({ venueName: "", phone: "", eventDate: dayActionMenu.dateStr, startTime: "", endTime: "", notes: "", totalAmount: "", initialPaymentAmount: "", paymentMethod: "CASH" });
              setQuickEventModal(true);
              setDayActionMenu(null);
            }} style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", color: "#fff", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
              <Plus size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
              {isPhotographer ? "Olay Ekle" : `${terms.appointment} Ekle`}
            </button>
            <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "2px 0" }} />
            <button onClick={async () => {
              const res = await toggleBlockedDay(dayActionMenu.dateStr);
              if (res.success) {
                setBlockedDays(res.blockedDays);
              }
              setDayActionMenu(null);
            }} style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", color: blockedDays.includes(dayActionMenu.dateStr) ? "rgba(100,255,100,0.8)" : "rgba(255,100,100,0.8)", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
              <Ban size={14} />
              {blockedDays.includes(dayActionMenu.dateStr) ? "Günü Aç" : "Günü Kapat"}
            </button>
          </div>
        </div>
      )}

      {/* ── Quick Event Modal ── */}
      {quickEventModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 1000, padding: "1rem", overflowY: "auto" }}>
          <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 0, width: "100%", maxWidth: "380px", padding: "1.25rem", position: "relative", margin: "3rem 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 900, margin: 0 }}>
                <Star size={16} style={{ marginRight: 6, verticalAlign: "middle", color: "rgba(255,255,255,0.5)" }} />
                {isPhotographer ? "Hızlı Olay Ekle" : `Hızlı ${terms.appointment} Ekle`}
              </h2>
              <button onClick={() => setQuickEventModal(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setQuickEventLoading(true);
              const res = await createQuickEvent(quickEventForm);
              if (res.success) {
                setQuickEventModal(false);
                setQuickEventForm({ venueName: "", phone: "", eventDate: "", startTime: "", endTime: "", notes: "", totalAmount: "", initialPaymentAmount: "", paymentMethod: "CASH" });
                loadData();
              } else {
                alert("Hata: " + res.error);
              }
              setQuickEventLoading(false);
            }} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>
                  {isPhotographer ? "Başlık / Mekan Adı *" : `${terms.client} Adı *`}
                </label>
                <input required placeholder={isPhotographer ? "Örn: Mekan Adı" : `Örn: ${terms.client} adı`} style={inp} value={quickEventForm.venueName} onChange={(e) => setQuickEventForm({...quickEventForm, venueName: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>Telefon</label>
                <input type="tel" placeholder="05XX XXX XX XX" style={inp} value={quickEventForm.phone} onChange={(e) => setQuickEventForm({...quickEventForm, phone: e.target.value})} />
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
                      ...(paymentMode !== "cash" ? [{ v: "CREDIT_CARD", l: "💳 Kart" }] : []),
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
