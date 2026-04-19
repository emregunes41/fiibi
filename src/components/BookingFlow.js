"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowLeft, Check, Calendar,
  ChevronLeft, ChevronRight, Camera, Heart, Gem,
  ShoppingBag, Plus, Clock, AlertCircle,
} from "lucide-react";
import {
  checkAvailability,
  getMonthlyPrices,
  getSlotAvailability,
} from "@/app/admin/core-actions";
import { useCart } from "./CartContext";
import { getBusinessType } from "@/lib/business-types";

/* ─── constants ─── */
const CATS = [
  { value: "DIS_CEKIM", label: "Dış Çekim", Icon: Camera, color: "#f59e0b",
    desc: "Doğa ve şehir manzaralarında unutulmaz kareler" },
  { value: "DUGUN", label: "Düğün", Icon: Heart, color: "#fb7185",
    desc: "Hayatınızın en özel gününü ölümsüzleştiriyoruz" },
  { value: "NISAN", label: "Nişan", Icon: Gem, color: "#67e8f9",
    desc: "Nişanınızı sanatsal karelerle taçlandırıyoruz" },
];
const MS = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
const MF = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

const ALL_SLOTS_2H = [
  { value: "08:00", label: "08:00 – 10:00" },
  { value: "10:00", label: "10:00 – 12:00" },
  { value: "12:00", label: "12:00 – 14:00" },
  { value: "14:00", label: "14:00 – 16:00" },
  { value: "16:00", label: "16:00 – 18:00" },
  { value: "18:00", label: "18:00 – 20:00" },
  { value: "20:00", label: "20:00 – 22:00" },
];

const ALL_SLOTS_4H = [
  { value: "08:00-12:00", label: "08:00 – 12:00" },
  { value: "10:00-14:00", label: "10:00 – 14:00" },
  { value: "12:00-16:00", label: "12:00 – 16:00" },
  { value: "14:00-18:00", label: "14:00 – 18:00" },
  { value: "16:00-20:00", label: "16:00 – 20:00" },
  { value: "18:00-22:00", label: "18:00 – 22:00" },
];

const WEDDING_OPTIONS = [
  { value: "GUNDUZ", label: "Gündüz" },
  { value: "AKSAM", label: "Akşam" },
];

const TIME_TYPE_LABELS = {
  FULL_DAY: "Tüm Gün",
  SLOT_2H: "2 Saatlik",
  SLOT_4H: "4 Saatlik",
  WEDDING: "Düğün Boyunca",
  CUSTOM_DURATION: "Süreye Göre",
  GUNDUZ: "Gündüz",
  AKSAM: "Akşam",
  // Legacy support
  MORNING: "Gündüz (08:00-14:00)",
  EVENING: "Akşam (16:00-22:00)",
  FIVE_HOURS: "5 Saatlik",
  SLOT: "2 Saatlik Periyot",
};

const anim = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
};

/* ─── shared styles ─── */
const S = {
  card: (on) => ({
    width: "100%",
    textAlign: "left",
    padding: "20px",
    borderRadius: 0,
    border: `1px solid ${on ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)"}`,
    background: on ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.025)",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
  }),
  btn: (active, bg = "#fff", fg = "#000") => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "14px 32px",
    borderRadius: 0,
    fontWeight: 600,
    fontSize: "14px",
    background: active ? bg : "rgba(255,255,255,0.04)",
    color: active ? fg : "rgba(255,255,255,0.15)",
    border: "none",
    cursor: active ? "pointer" : "not-allowed",
    transition: "all 0.2s",
    width: "100%",
  }),
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 0,
    padding: "14px 16px",
    fontSize: "14px",
    color: "#fff",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  },
  label: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.55)",
    fontWeight: 600,
    display: "block",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  },
  tag: {
    fontSize: "11px",
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: 0,
    lineHeight: 1,
  },
  section: { marginBottom: "48px" },
};

/* ─── component ─── */
export default function BookingFlow({ initialPackages, isAdmin = false }) {
  const cart = useCart();
  const [step, setStep] = useState(null); // null until businessType loads
  const [cat, setCat] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(null);
  const [prices, setPrices] = useState([]);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [businessType, setBusinessType] = useState(null);

  const bt = getBusinessType(businessType || "photographer");
  const hasCategories = bt.features.categories;

  // Auto-fill from URL parameters (Upsell integration)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const pkgId = params.get("upsellPkg");
      const urlM = parseInt(params.get("m"), 10);
      const urlY = parseInt(params.get("y"), 10);

      if (pkgId && urlM && urlY) {
        const pkg = initialPackages.find(p => p.id === pkgId);
        if (pkg) {
          setCat(pkg.category);
          setYear(urlY);
          setMonth(urlM);
          setSelectedPkg(pkg);
          setStep(3);
          
          // Clear URL to prevent re-triggering
          window.history.replaceState({}, '', '/booking');
        }
      }
    }
  }, [initialPackages]);

  // Load business type
  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(data => {
      const bType = data?.tenant?.businessType || "photographer";
      setBusinessType(bType);
      const btConfig = getBusinessType(bType);
      // Set initial step based on sector
      if (btConfig.features.categories) {
        setStep(1); // photographer: start with category selection
      } else {
        setStep(2); // others: skip to month/package selection
      }
    }).catch(() => {
      setBusinessType("photographer");
      setStep(1);
    });
  }, []);

  // Details form state (step 3)
  const [detailForm, setDetailForm] = useState({
    date: "", time: "", notes: "",
    customFieldAnswers: [], // [{ label, value }]
    selectedAddons: [],
  });
  const [slotAvail, setSlotAvail] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  // Free calendar navigation for non-photographer sectors (when month is null)
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const fmt = (n) => n.toLocaleString("tr-TR");
  const packs = hasCategories ? initialPackages.filter((p) => p.category === cat) : initialPackages;
  const disc = (m) => isAdmin ? 0 : (prices.find((p) => p.month === m)?.discountPercentage || 0);

  // O ayın en ucuz paket fiyatını hesapla
  const minPrice = (m) => {
    if (!packs.length) return null;
    const d = isAdmin ? 0 : (prices.find((p) => p.month === m)?.discountPercentage || 0);
    const basePrices = packs.map(pkg => {
      const b = parseInt(pkg.price.replace(/\D/g, "")) || 0;
      return Math.round(b * (1 + d / 100));
    });
    return Math.min(...basePrices);
  };

  const price = useCallback((pkg) => {
    const b = parseInt(pkg.price.replace(/\D/g, "")) || 0;
    if (!month || !prices.length || isAdmin) return b;
    const c = prices.find((p) => p.month === month);
    if (!c?.discountPercentage) return b;
    return Math.round(b * (1 + c.discountPercentage / 100));
  }, [month, prices, isAdmin]);

  const topRef = useRef(null);

  const go = (s) => {
    setStep(s);
    // Scroll the step bar into view after React renders the new step
    setTimeout(() => {
      if (topRef.current) {
        topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  /* effects */
  useEffect(() => {
    if (!cat) return;
    (async () => setPrices((await getMonthlyPrices(cat, year)) || []))();
  }, [cat, year]);

  // When date changes in detail form, check slot availability
  useEffect(() => {
    if (!detailForm.date || !cat) return;
    setLoadingSlots(true);
    getSlotAvailability(detailForm.date, cat).then((av) => {
      setSlotAvail(av);
      setLoadingSlots(false);
    });
  }, [detailForm.date, cat]);

  // Initialize custom field answers when a package is selected
  useEffect(() => {
    if (!selectedPkg) return;
    const fields = selectedPkg.customFields || [];
    setDetailForm((prev) => ({
      ...prev,
      date: "", time: "", notes: "",
      customFieldAnswers: fields.map((f) => ({ label: f.label, type: f.type, value: f.type === "checkbox" ? false : "" })),
      selectedAddons: [],
    }));
  }, [selectedPkg]);

  const handleSelectPackage = (pkg) => {
    setSelectedPkg(pkg);
    go(3);
  };

  const isSlotFull = (slotValue) => {
    if (!slotAvail) return false;
    const count = slotAvail.slotCounts[slotValue] || 0;
    return count >= slotAvail.maxCapacity;
  };

  const getAvailableSlotsForPkg = () => {
    if (!selectedPkg) return [];
    const tt = selectedPkg.timeType;
    const configured = selectedPkg.availableSlots || [];
    if (tt === "SLOT_2H") return ALL_SLOTS_2H.filter(s => configured.includes(s.value));
    if (tt === "SLOT_4H") return ALL_SLOTS_4H.filter(s => configured.includes(s.value));
    if (tt === "WEDDING") return WEDDING_OPTIONS;
    return [];
  };

  const needsTimeSelection = selectedPkg && (selectedPkg.timeType === "SLOT_2H" || selectedPkg.timeType === "SLOT_4H" || selectedPkg.timeType === "WEDDING" || selectedPkg.timeType === "SLOT");

  const isDetailFormValid = () => {
    if (!detailForm.date) return false;
    if (needsTimeSelection && !detailForm.time) return false;
    // Check required custom fields
    const fields = selectedPkg?.customFields || [];
    for (let i = 0; i < fields.length; i++) {
      if (fields[i].required) {
        const ans = detailForm.customFieldAnswers[i];
        if (!ans) return false;
        if (fields[i].type === "checkbox" && !ans.value) return false;
        if (fields[i].type !== "checkbox" && !ans.value) return false;
      }
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!isDetailFormValid() || !selectedPkg) return;
    const p = price(selectedPkg);
    let timeLabel;
    if (needsTimeSelection) {
      const allSlots = [...ALL_SLOTS_2H, ...ALL_SLOTS_4H, ...WEDDING_OPTIONS];
      timeLabel = allSlots.find((s) => s.value === detailForm.time)?.label || detailForm.time;
    } else {
      timeLabel = TIME_TYPE_LABELS[selectedPkg.timeType] || selectedPkg.timeType;
    }

    cart.addItem(selectedPkg, cat, month, year, p, detailForm.selectedAddons, {
      date: detailForm.date,
      time: detailForm.time || selectedPkg.timeType,
      timeLabel,
      notes: detailForm.notes,
      customFieldAnswers: detailForm.customFieldAnswers.filter((a) => a.value !== "" && a.value !== false && a.value !== "__OTHER__"),
    });

    setAddedFeedback(true);
  };

  const toggleDetailAddon = (addon) => {
    setDetailForm((prev) => {
      const has = prev.selectedAddons.find((a) => a.title === addon.title);
      return {
        ...prev,
        selectedAddons: has
          ? prev.selectedAddons.filter((a) => a.title !== addon.title)
          : [...prev.selectedAddons, addon],
      };
    });
  };

  const pkgPrice = selectedPkg ? price(selectedPkg) : 0;
  const addonTotal = detailForm.selectedAddons.reduce((s, a) => s + (parseInt(a.price) || 0), 0);
  const itemTotal = pkgPrice + addonTotal;

  // ──────────────────────────────────────
  //  RENDER
  // ──────────────────────────────────────
  // Wait for businessType to load before rendering
  if (step === null) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)" }}>
        <div style={{ width: 24, height: 24, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "rgba(255,255,255,0.5)", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: "100%", overflowX: "hidden" }}>

      {/* Step bar */}
      <div ref={topRef} style={{ display: "flex", gap: "8px", marginBottom: "48px", scrollMarginTop: "120px" }}>
        {["Hizmet","Paket","Detaylar"].map((l, i) => {
          const n = i + 1;
          const done = step > n;
          const active = step === n;
          return (
            <button
              key={n}
              onClick={() => n < step && go(n)}
              style={{
                flex: 1,
                padding: "12px 0",
                borderRadius: 0,
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: done ? "pointer" : "default",
                background: active ? "#fff" : done ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                color: active ? "#000" : done ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)",
                transition: "all 0.3s",
              }}
            >
              {l}
            </button>
          );
        })}
      </div>

      {/* Floating cart indicator */}
      {cart.itemCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: "fixed",
            bottom: "100px",
            right: "24px",
            zIndex: 90,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 20px",
            borderRadius: 0,
            background: "rgba(10,10,15,0.9)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            cursor: "pointer",
          }}
          onClick={() => cart.setIsOpen(true)}
        >
          <ShoppingBag size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
          <div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{cart.itemCount} paket</div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>{fmt(cart.cartTotal())}₺</div>
          </div>
          <div style={{
            width: "32px", height: "32px", borderRadius: 0, background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ArrowRight size={14} style={{ color: "#000" }} />
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">

        {/* ═══ STEP 1: Hizmet Seçimi (sadece fotoğrafçılar) ═══ */}
        {step === 1 && hasCategories && (
          <motion.div key="s1" {...anim}>
            <div style={S.section}>
              <div style={S.label}>Hizmet Türü</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                {CATS.map((c) => {
                  const on = cat === c.value;
                  const Icon = c.Icon;
                  return (
                    <button
                      key={c.value}
                      onClick={() => { setCat(c.value); setMonth(null); }}
                      style={{
                        textAlign: "left", padding: "20px", borderRadius: 0,
                        border: `1px solid ${on ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)"}`,
                        background: on ? `linear-gradient(135deg, ${c.color}22 0%, transparent 60%)` : "rgba(255,255,255,0.04)",
                        cursor: "pointer", transition: "all 0.3s", position: "relative",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                        <div style={{
                          width: "40px", height: "40px", borderRadius: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: on ? `${c.color}25` : "rgba(255,255,255,0.06)",
                        }}>
                          <Icon size={18} style={{ color: on ? c.color : "rgba(255,255,255,0.45)" }} />
                        </div>
                        {on && (
                          <div style={{
                            width: "24px", height: "24px", borderRadius: 0,
                            background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <Check size={12} style={{ color: "#000" }} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "4px", color: "#fff" }}>{c.label}</div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{c.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Months */}
            {cat && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={S.section}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <div style={S.label}>Dönem Seçimi</div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "4px",
                    background: "rgba(255,255,255,0.03)", borderRadius: 0,
                    padding: "4px 8px", border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <button onClick={() => setYear(y => y - 1)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", padding: "4px" }}>
                      <ChevronLeft size={14} />
                    </button>
                    <span style={{ fontSize: "13px", fontWeight: 700, width: "44px", textAlign: "center", color: "#fff" }}>{year}</span>
                    <button onClick={() => setYear(y => y + 1)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", padding: "4px" }}>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: "8px", marginBottom: "24px" }}>
                  {MF.map((name, i) => {
                    const m = i + 1;
                    const d = disc(m);
                    const sel = month === m;
                    const past = year === new Date().getFullYear() && m < new Date().getMonth() + 1;
                    return (
                      <button
                        key={m}
                        disabled={past}
                        onClick={() => { setMonth(m); go(2); }}
                        style={{
                          padding: "14px 4px", borderRadius: 0,
                          border: sel ? "2px solid #fff" : d < 0 ? "1px solid rgba(217,181,120,0.18)" : "1px solid rgba(255,255,255,0.06)",
                          background: sel ? "#fff" : d < 0 ? "rgba(217,181,120,0.05)" : "rgba(255,255,255,0.02)",
                          cursor: past ? "not-allowed" : "pointer",
                          opacity: past ? 0.15 : 1, transition: "all 0.25s", textAlign: "center",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        {/* İndirimli ay alt çizgi */}
                        {!sel && d < 0 && (
                          <div style={{
                            position: "absolute", bottom: 0, left: "20%", right: "20%", height: "2px",
                            background: "linear-gradient(90deg, transparent, rgba(217,181,120,0.5), transparent)",
                            borderRadius: 0,
                          }} />
                        )}
                        <div style={{ fontSize: "13px", fontWeight: 700, color: sel ? "#000" : "rgba(255,255,255,0.6)" }}>{name}</div>
                        {(() => {
                          const mp = minPrice(m);
                          if (mp === null) return null;
                          return (
                            <div style={{
                              fontSize: "8px", fontWeight: 500, marginTop: "4px",
                              color: sel ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.4)",
                              letterSpacing: "0.01em",
                            }}>
                              <span style={{ fontWeight: 800 }}>{fmt(mp)} TL</span>'den başlayan fiyatlarla
                            </div>
                          );
                        })()}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ═══ STEP 2: Paket Seçimi ═══ */}
        {step === 2 && (
          <motion.div key="s2" {...anim}>
            {/* breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px", flexWrap: "wrap" }}>
              {hasCategories && (
                <>
                  <button onClick={() => go(1)} style={{
                    background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: "13px",
                  }}>← Geri</button>
                  <span style={{ color: "rgba(255,255,255,0.08)" }}>|</span>
                  <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)" }}>{CATS.find(c => c.value === cat)?.label}</span>
                  <span style={{ color: "rgba(255,255,255,0.08)" }}>·</span>
                  <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>{MF[month - 1]} {year}</span>
                  {disc(month) !== 0 && (
                    <span style={{
                      ...S.tag,
                      background: disc(month) < 0 ? "rgba(255,255,255,0.06)" : "rgba(251,146,60,0.1)",
                      color: disc(month) < 0 ? "rgba(255,255,255,0.7)" : "#fb923c",
                    }}>
                      {disc(month) < 0 ? `%${Math.abs(disc(month))} İndirim` : `+%${disc(month)}`}
                    </span>
                  )}
                </>
              )}
            </div>

            <h2 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px", color: "#fff" }}>Paket Seçin</h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.35)", marginBottom: "32px" }}>
              Bir paket seçerek detaylarını doldurun ve sepetinize ekleyin.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
              {packs.map((pkg) => {
                const inCart = cart.hasItem(pkg.id);
                const base = parseInt(pkg.price.replace(/\D/g, "")) || 0;
                const cur = price(pkg);
                const diff = cur !== base;
                return (
                  <button key={pkg.id} onClick={() => handleSelectPackage(pkg)} style={{
                    ...S.card(inCart),
                    position: "relative",
                  }}>
                    <div style={{
                      width: "32px", height: "32px", borderRadius: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: inCart ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.04)",
                      color: inCart ? "#000" : "rgba(255,255,255,0.15)",
                      flexShrink: 0, marginTop: "2px", transition: "all 0.3s",
                    }}>
                      {inCart ? <Check size={14} strokeWidth={3} /> : <ArrowRight size={14} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "6px" }}>
                        <span style={{ fontSize: "15px", fontWeight: 600, color: "#fff" }}>{pkg.name}</span>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          {diff && <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", textDecoration: "line-through", display: "block" }}>{fmt(base)}₺</span>}
                          <span style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>{fmt(cur)}<span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", fontWeight: 400, marginLeft: "2px" }}>₺</span></span>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {pkg.features.slice(0, 4).map((f, i) => (
                          <span key={i} style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>• {f}</span>
                        ))}
                        {pkg.features.length > 4 && <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.12)" }}>+{pkg.features.length - 4} daha</span>}
                      </div>
                      {inCart && (
                        <div style={{
                          marginTop: "8px", fontSize: "11px", fontWeight: 600,
                          color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: "4px",
                        }}>
                          <Check size={10} strokeWidth={3} /> Sepette
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Cart summary bar */}
            {cart.itemCount > 0 && (
              <div style={{
                padding: "20px", borderRadius: 0,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.015)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>{cart.itemCount} paket sepette</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>{fmt(cart.cartTotal())}₺</div>
                </div>
                <button
                  onClick={() => cart.setIsOpen(true)}
                  style={{
                    padding: "14px 28px", borderRadius: 0,
                    background: "#fff", border: "none", color: "#000",
                    fontSize: "13px", fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "8px",
                    transition: "all 0.2s",
                  }}
                >
                  <ShoppingBag size={14} /> Sepeti Görüntüle
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ STEP 3: Paket Detayları ═══ */}
        {step === 3 && selectedPkg && (
          <motion.div key="s3" {...anim}>
            <button onClick={() => go(2)} style={{
              background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer",
              fontSize: "13px", marginBottom: "32px", display: "block",
            }}>← Paketlere Dön</button>

            {/* Package summary */}
            <div style={{
              padding: "20px", borderRadius: 0, marginBottom: "32px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: `linear-gradient(135deg, ${(hasCategories ? CATS.find(c => c.value === cat)?.color : null) || "#888"}12 0%, transparent 60%)`,
              display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
            }}>
              <div>
                {hasCategories && (
                  <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: CATS.find(c => c.value === cat)?.color, opacity: 0.7, marginBottom: "4px" }}>
                    {CATS.find(c => c.value === cat)?.label} · {MF[month - 1]} {year}
                  </div>
                )}
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>{selectedPkg.name}</div>
              </div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "#fff" }}>
                {fmt(price(selectedPkg))}<span style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", fontWeight: 400, marginLeft: "2px" }}>₺</span>
              </div>
            </div>

            <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px", color: "#fff" }}>Paket Detayları</h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.35)", marginBottom: "32px" }}>
              Bu paket için gerekli bilgileri doldurun, ardından sepetinize ekleyin.
            </p>

            {/* Date — Calendar */}
            <div style={{ marginBottom: "24px", maxWidth: "100%", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <Calendar size={14} style={{ color: "rgba(255,255,255,0.25)" }} />
                <span style={S.label}>{bt.terms.appointment} Tarihi *</span>
              </div>

              {/* Month header with nav */}
              {(() => {
                const cm = month || calMonth;
                const cy = month ? year : calYear;
                const canGoBack = !month;
                const canGoForward = !month;

                const goCalPrev = () => { if (cm === 1) { setCalMonth(12); setCalYear(cy - 1); } else { setCalMonth(cm - 1); } };
                const goCalNext = () => { if (cm === 12) { setCalMonth(1); setCalYear(cy + 1); } else { setCalMonth(cm + 1); } };

                const totalDays = new Date(cy, cm, 0).getDate();
                const firstDow = new Date(cy, cm - 1, 1).getDay();
                const startOffset = firstDow === 0 ? 6 : firstDow - 1;
                const minBookable = new Date();
                minBookable.setDate(minBookable.getDate() + (isAdmin ? 0 : 2));
                minBookable.setHours(0, 0, 0, 0);

                // Working days filter
                const workingDays = selectedPkg?.workingDays || null;

                const cells = [];
                for (let i = 0; i < startOffset; i++) cells.push(<div key={`e${i}`} />);
                for (let day = 1; day <= totalDays; day++) {
                  const dateObj = new Date(cy, cm - 1, day);
                  const dateStr = `${cy}-${String(cm).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                  const isPast = dateObj < minBookable;
                  const isSelected = detailForm.date === dateStr;
                  const isSunday = dateObj.getDay() === 0;
                  const dayOfWeek = dateObj.getDay();
                  const isDisabledDay = workingDays && !workingDays.includes(dayOfWeek);

                  cells.push(
                    <button
                      key={day}
                      disabled={isPast || isDisabledDay}
                      onClick={() => { if (!isPast && !isDisabledDay) setDetailForm(p => ({ ...p, date: dateStr, time: "" })); }}
                      style={{
                        aspectRatio: "1", borderRadius: 0,
                        border: isSelected ? "2px solid #fff" : "1px solid rgba(255,255,255,0.06)",
                        background: isSelected ? "#fff" : (isPast || isDisabledDay) ? "transparent" : "rgba(255,255,255,0.03)",
                        color: isSelected ? "#000" : (isPast || isDisabledDay) ? "rgba(255,255,255,0.12)" : isSunday ? "rgba(255,100,100,0.6)" : "rgba(255,255,255,0.7)",
                        fontSize: "13px", fontWeight: isSelected ? 800 : 600,
                        cursor: (isPast || isDisabledDay) ? "not-allowed" : "pointer",
                        transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                      }}
                    >{day}</button>
                  );
                }

                return (
                  <>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: "12px" }}>
                      {canGoBack && <button onClick={goCalPrev} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 4 }}><ChevronLeft size={16} /></button>}
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#fff", minWidth: 120, textAlign: "center" }}>{MF[cm - 1]} {cy}</span>
                      {canGoForward && <button onClick={goCalNext} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 4 }}><ChevronRight size={16} /></button>}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "6px" }}>
                      {["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"].map(d => (
                        <div key={d} style={{ textAlign: "center", fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.25)", padding: "4px 0" }}>{d}</div>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>{cells}</div>
                  </>
                );
              })()}

              {/* Selected date display */}
              {detailForm.date && (
                <div style={{ marginTop: "12px", textAlign: "center", fontSize: "13px", fontWeight: 600, color: "#fff", padding: "8px", background: "rgba(255,255,255,0.04)", borderRadius: 0, border: "1px solid rgba(255,255,255,0.08)" }}>
                  📅 {new Date(detailForm.date).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </div>
              )}
            </div>

            {/* Time Slot Selection */}
            {detailForm.date && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <Clock size={14} style={{ color: "rgba(255,255,255,0.25)" }} />
                  <span style={S.label}>
                    Saat Dilimi {needsTimeSelection ? "*" : ""}
                  </span>
                  {loadingSlots && <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>kontrol ediliyor...</span>}
                </div>

                {needsTimeSelection ? (
                  // Show slot/option buttons
                  <div style={{ display: "grid", gridTemplateColumns: selectedPkg.timeType === "WEDDING" ? "repeat(auto-fill, minmax(130px, 1fr))" : "repeat(auto-fill, minmax(100px, 1fr))", gap: "8px" }}>
                    {getAvailableSlotsForPkg().map((slot) => {
                      const full = isSlotFull(slot.value);
                      const sel = detailForm.time === slot.value;
                      return (
                        <button
                          key={slot.value}
                          disabled={full}
                          onClick={() => setDetailForm(p => ({ ...p, time: slot.value }))}
                          style={{
                            padding: "14px 8px", borderRadius: 0,
                            border: sel ? "2px solid #fff" : `1px solid ${full ? "rgba(255,60,60,0.15)" : "rgba(255,255,255,0.06)"}`,
                            background: sel ? "#fff" : full ? "rgba(255,60,60,0.04)" : "rgba(255,255,255,0.02)",
                            cursor: full ? "not-allowed" : "pointer",
                            opacity: full ? 0.5 : 1,
                            transition: "all 0.2s", textAlign: "center",
                          }}
                        >
                          <div style={{ fontSize: "13px", fontWeight: 600, color: sel ? "#000" : full ? "rgba(255,60,60,0.6)" : "rgba(255,255,255,0.5)" }}>
                            {slot.label}
                          </div>
                          {full && (
                            <div style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,60,60,0.6)", marginTop: "2px", display: "flex", alignItems: "center", justifyContent: "center", gap: "3px" }}>
                              <AlertCircle size={10} /> Dolu
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  // Show single time type info (FULL_DAY)
                  <div style={{
                    padding: "14px 16px", borderRadius: 0,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.02)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>
                        {TIME_TYPE_LABELS[selectedPkg.timeType] || selectedPkg.timeType}
                      </div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", marginTop: "2px" }}>
                        Bu paket için sabit saat dilimi
                      </div>
                    </div>
                    {isSlotFull(selectedPkg.timeType) ? (
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <AlertCircle size={14} /> Bu tarih dolu
                      </div>
                    ) : (
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                        <Check size={14} /> Uygun
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Addons */}
            {selectedPkg.addons && Array.isArray(selectedPkg.addons) && selectedPkg.addons.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <div style={S.label}>Ekstra Hizmetler</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {selectedPkg.addons.map((a, i) => {
                    const on = detailForm.selectedAddons.some(sa => sa.title === a.title);
                    return (
                      <button key={i} onClick={() => toggleDetailAddon(a)} style={{
                        padding: "10px 16px", borderRadius: 0, fontSize: "12px", fontWeight: 600,
                        border: `1px solid ${on ? "#fff" : "rgba(255,255,255,0.06)"}`,
                        background: on ? "#fff" : "rgba(255,255,255,0.02)",
                        color: on ? "#000" : "rgba(255,255,255,0.35)",
                        cursor: "pointer", transition: "all 0.2s",
                      }}>
                        {a.title} <span style={{ opacity: 0.5, marginLeft: "4px" }}>+{a.price}₺</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Fields */}
            {selectedPkg.customFields && selectedPkg.customFields.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <div style={S.label}>Ek Bilgiler</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {selectedPkg.customFields.map((field, idx) => {
                    const answer = detailForm.customFieldAnswers[idx];
                    if (!answer) return null;

                    if (field.type === "text") {
                      return (
                        <div key={idx}>
                          <label style={{ ...S.label, fontSize: "11px" }}>
                            {field.label} {field.required && "*"}
                          </label>
                          <input
                            type="text"
                            placeholder={field.placeholder || ""}
                            value={answer.value}
                            onChange={(e) => {
                              const arr = [...detailForm.customFieldAnswers];
                              arr[idx] = { ...arr[idx], value: e.target.value };
                              setDetailForm(p => ({ ...p, customFieldAnswers: arr }));
                            }}
                            style={S.input}
                          />
                        </div>
                      );
                    }

                    if (field.type === "dropdown") {
                      const opts = (field.options || "").split(",").map(o => o.trim()).filter(Boolean);
                      const isOther = answer.value === "__OTHER__" || (answer.value && !opts.includes(answer.value) && answer.value !== "");
                      return (
                        <div key={idx}>
                          <label style={{ ...S.label, fontSize: "11px" }}>
                            {field.label} {field.required && "*"}
                          </label>
                          <select
                            value={isOther ? "__OTHER__" : answer.value}
                            onChange={(e) => {
                              const arr = [...detailForm.customFieldAnswers];
                              if (e.target.value === "__OTHER__") {
                                arr[idx] = { ...arr[idx], value: "__OTHER__" };
                              } else {
                                arr[idx] = { ...arr[idx], value: e.target.value };
                              }
                              setDetailForm(p => ({ ...p, customFieldAnswers: arr }));
                            }}
                            style={{ ...S.input, appearance: "none", WebkitAppearance: "none", cursor: "pointer" }}
                          >
                            <option value="" style={{ background: "#0a0a0f" }}>Seçiniz...</option>
                            {opts.map((o, oi) => (
                              <option key={oi} value={o} style={{ background: "#0a0a0f" }}>{o}</option>
                            ))}
                            <option value="__OTHER__" style={{ background: "#0a0a0f" }}>Diğer...</option>
                          </select>
                          {isOther && (
                            <input
                              type="text"
                              placeholder="Lütfen belirtiniz..."
                              value={answer.value === "__OTHER__" ? "" : answer.value}
                              onChange={(e) => {
                                const arr = [...detailForm.customFieldAnswers];
                                arr[idx] = { ...arr[idx], value: e.target.value || "__OTHER__" };
                                setDetailForm(p => ({ ...p, customFieldAnswers: arr }));
                              }}
                              style={{ ...S.input, marginTop: "8px" }}
                              autoFocus
                            />
                          )}
                        </div>
                      );
                    }

                    if (field.type === "checkbox") {
                      return (
                        <label key={idx} style={{
                          display: "flex", alignItems: "center", gap: "12px",
                          padding: "16px", borderRadius: 0, background: "rgba(255,255,255,0.015)",
                          border: `1px solid ${answer.value ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}`,
                          cursor: "pointer", transition: "all 0.2s",
                        }}>
                          <input
                            type="checkbox"
                            checked={answer.value || false}
                            onChange={(e) => {
                              const arr = [...detailForm.customFieldAnswers];
                              arr[idx] = { ...arr[idx], value: e.target.checked };
                              setDetailForm(p => ({ ...p, customFieldAnswers: arr }));
                            }}
                            style={{ width: "18px", height: "18px", accentColor: "#fff", flexShrink: 0 }}
                          />
                          <span style={{ fontSize: "13px", color: answer.value ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)" }}>
                            {field.label} {field.required && <span style={{ color: "rgba(255,255,255,0.15)" }}>*</span>}
                          </span>
                        </label>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            <div style={{ marginBottom: "32px" }}>
              <label style={S.label}>Notlar (opsiyonel)</label>
              <textarea
                value={detailForm.notes}
                onChange={(e) => setDetailForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Eklemek istediğiniz detaylar..."
                style={{ ...S.input, minHeight: "80px", resize: "none" }}
              />
            </div>

            {/* Total + Add to Cart */}
            <div style={{
              padding: "20px", borderRadius: 0,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.015)",
              marginBottom: "20px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: addonTotal > 0 ? "12px" : "0" }}>
                <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>{selectedPkg.name}</span>
                <span style={{ fontSize: "16px", fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{fmt(pkgPrice)}₺</span>
              </div>
              {detailForm.selectedAddons.map((a, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)" }}>+ {a.title}</span>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)" }}>{a.price}₺</span>
                </div>
              ))}
              {addonTotal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)" }}>Toplam</span>
                  <span style={{ fontSize: "20px", fontWeight: 700, color: "#fff" }}>{fmt(itemTotal)}<span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", fontWeight: 400, marginLeft: "2px" }}>₺</span></span>
                </div>
              )}
            </div>

            {/* Added feedback */}
            <AnimatePresence>
              {addedFeedback && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={{ display: "flex", flexDirection: "column", gap: "12px" }}
                >
                  <div style={{
                    padding: "16px", borderRadius: 0,
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.7)", fontSize: "14px", fontWeight: 600,
                    textAlign: "center",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  }}>
                    <Check size={16} strokeWidth={3} /> Sepete eklendi!
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => { setAddedFeedback(false); go(1); }}
                      style={{
                        flex: 1, padding: "14px", borderRadius: 0,
                        border: "1px solid rgba(255,255,255,0.08)", background: "transparent",
                        color: "rgba(255,255,255,0.5)", fontSize: "13px", fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                      }}
                    >
                      <ArrowLeft size={14} /> Alışverişe Devam Et
                    </button>
                    <button
                      onClick={() => { setAddedFeedback(false); cart.setIsOpen(true); }}
                      style={{
                        flex: 1, padding: "14px", borderRadius: 0,
                        border: "none", background: "#fff", color: "#000",
                        fontSize: "13px", fontWeight: 700, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                      }}
                    >
                      <ShoppingBag size={14} /> Sepeti Görüntüle
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!addedFeedback && (
              <button
                onClick={handleAddToCart}
                disabled={!isDetailFormValid()}
                style={{
                  ...S.btn(isDetailFormValid()),
                  padding: "16px 32px",
                  fontSize: "15px",
                }}
              >
                <ShoppingBag size={16} /> Sepete Ekle — {fmt(itemTotal)}₺
              </button>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
