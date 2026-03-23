"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, User, Phone, Mail, ChevronRight, CreditCard, Clock, Info, Check, ShoppingCart, X, Plus } from "lucide-react";
import { savePendingReservation, checkAvailability } from "@/app/admin/core-actions";

export default function BookingFlow({ initialPackages }) {
  const [step, setStep] = useState(1); // 1: Package Selection, 2: Details/Addons, 3: Payment Type, 4: iFrame
  const [activeCategory, setActiveCategory] = useState("Hepsi");
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [formData, setFormData] = useState({ 
    brideName: "", bridePhone: "", brideEmail: "", 
    groomName: "", groomPhone: "", groomEmail: "",
    date: "", time: "10:00", notes: "" 
  });
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityErrors, setAvailabilityErrors] = useState({});
  const [contractAccepted, setContractAccepted] = useState(false);
  const [paymentType, setPaymentType] = useState("deposit");
  const [customAmount, setCustomAmount] = useState("");
  const [paytrToken, setPaytrToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Price Calculations
  const getPackagesPrice = () => selectedPackages.reduce((sum, p) => sum + (parseInt(p.price.replace(/[^0-9]/g, "")) || 0), 0);
  const getAddonsPrice = () => selectedAddons.reduce((sum, a) => sum + (parseInt(a.price) || 0), 0);
  const getTotalPrice = () => getPackagesPrice() + getAddonsPrice();
  const getMinDeposit = () => Math.round(getTotalPrice() * 0.2);

  const calculateFinalAmount = () => {
    if (paymentType === "full") return getTotalPrice();
    if (paymentType === "deposit") return getMinDeposit();
    return parseInt(customAmount) || getMinDeposit();
  };

  // Availability Check
  const verifyAllAvailability = useCallback(async () => {
    setIsCheckingAvailability(true);
    const errors = {};
    for (const pkg of selectedPackages) {
      const res = await checkAvailability(formData.date, pkg.id, formData.time);
      if (!res.available) {
        errors[pkg.id] = `${pkg.name} için kapasite doldu.`;
      }
    }
    setAvailabilityErrors(errors);
    setIsCheckingAvailability(false);
  }, [formData.date, formData.time, selectedPackages]);

  useEffect(() => {
    if (formData.date && selectedPackages.length > 0) {
      verifyAllAvailability();
    }
  }, [formData.date, formData.time, selectedPackages, verifyAllAvailability]);

  const togglePackage = (pkg) => {
    if (selectedPackages.find(p => p.id === pkg.id)) {
      setSelectedPackages(selectedPackages.filter(p => p.id !== pkg.id));
    } else {
      setSelectedPackages([...selectedPackages, pkg]);
    }
  };

  const toggleAddon = (addon) => {
    if (selectedAddons.find(a => a.title === addon.title)) {
      setSelectedAddons(selectedAddons.filter(a => a.title !== addon.title));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const startPayment = async () => {
    if (!contractAccepted) return alert("Lütfen sözleşmeyi onaylayın.");
    if (Object.keys(availabilityErrors).length > 0) return alert("Bazı paketler seçilen tarihte uygun değil.");
    
    const finalPrice = calculateFinalAmount();
    if (finalPrice < getMinDeposit()) return alert(`Minimum ödeme tutarı ${getMinDeposit()} TL'dir.`);

    setIsLoading(true);

    try {
      const saveRes = await savePendingReservation({
        ...formData,
        packageIds: selectedPackages.map(p => p.id),
        totalAmount: `${getTotalPrice()} TL`,
        paidAmount: `${finalPrice} TL`,
        selectedAddons: selectedAddons
      });

      if (!saveRes.success) throw new Error(saveRes.error);

      const res = await fetch("/api/paytr/checkout", {
        method: "POST",
        body: JSON.stringify({
          merchant_oid: saveRes.id,
          email: formData.brideEmail,
          payment_amount: finalPrice * 100,
          user_name: `${formData.brideName} & ${formData.groomName}`,
          user_phone: formData.bridePhone,
          user_address: `Packages: ${selectedPackages.map(p => p.name).join(", ")} | Date: ${formData.date}`,
          user_basket: JSON.stringify(selectedPackages.map(p => [p.name, p.price, 1]))
        })
      });

      const data = await res.json();
      if (data.token) {
        setPaytrToken(data.token);
        setStep(4);
      } else {
        alert("Ödeme başlatılamadı: " + data.error);
      }
    } catch (err) {
      alert("Hata: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: "5rem" }}>
      
      {/* Progress Stepper */}
      <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "3rem" }}>
        {[1, 2, 3, 4].map((s) => (
          <div key={s} style={{ 
            width: "35px", height: "35px", borderRadius: "50%", 
            display: "flex", alignItems: "center", justifyContent: "center",
            background: step >= s ? "var(--primary)" : "var(--bg-card)",
            color: step >= s ? "#fff" : "var(--text-muted)",
            fontWeight: 700, border: "1px solid var(--border)",
            fontSize: "0.85rem"
          }}>
            {s}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          >
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <h1 style={{ fontSize: "2.5rem", fontWeight: 900, marginBottom: "1rem" }}>Paketinizi Seçin</h1>
              <p style={{ color: "var(--text-muted)" }}>Birden fazla paket seçerek sepetinizi oluşturabilirsiniz.</p>
            </div>

            {/* Category Tabs */}
            <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "3rem", flexWrap: "wrap" }}>
              {["Hepsi", ...new Set(initialPackages.map(p => p.category))].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: "0.6rem 1.2rem", borderRadius: "2rem", border: "1px solid",
                    borderColor: activeCategory === cat ? "var(--primary)" : "var(--border)",
                    background: activeCategory === cat ? "var(--primary)" : "transparent",
                    color: activeCategory === cat ? "#fff" : "var(--text)",
                    fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", transition: "all 0.2s"
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
              {initialPackages
                .filter(p => activeCategory === "Hepsi" || p.category === activeCategory)
                .map((pkg) => {
                const isSelected = selectedPackages.find(p => p.id === pkg.id);
                return (
                  <div 
                    key={pkg.id} 
                    onClick={() => togglePackage(pkg)}
                    style={{ 
                      background: isSelected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', 
                      border: isSelected ? '3px solid #fff' : '1px solid rgba(255,255,255,0.1)', 
                      padding: '2rem', borderRadius: '1.5rem', cursor: 'pointer', transition: 'all 0.2s',
                      position: "relative",
                      color: "#fff"
                    }}
                    className="glass-hover"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{pkg.name}</h3>
                      {isSelected && <div style={{ background: "#fff", color: "#000", padding: "0.4rem", borderRadius: "50%" }}><Check size={16} /></div>}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, background: "rgba(255,255,255,0.2)", color: "#fff", padding: "0.2rem 0.5rem", borderRadius: "0.5rem" }}>{pkg.price} TL</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", padding: "0.2rem 0.5rem", borderRadius: "0.5rem" }}>{pkg.timeType === "SLOT" ? "2 Saat" : "Tüm Gün"}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', minHeight: "3rem" }}>{pkg.description}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                      {pkg.features.slice(0, 3).map((f, i) => (
                        <span key={i} style={{ fontSize: "0.7rem", background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", padding: "0.2rem 0.5rem", borderRadius: "0.4rem" }}>{f}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Floating Cart Bar */}
            {selectedPackages.length > 0 && (
              <motion.div 
                initial={{ y: 100 }} animate={{ y: 0 }}
                style={{ 
                  position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
                  background: "rgba(255,255,255,0.1)", backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.2)", padding: "1rem 2rem",
                  borderRadius: "2rem", boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                  display: "flex", alignItems: "center", gap: "2rem", zIndex: 100, width: "90%", maxWidth: "600px",
                  color: "#fff"
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>SEPETİNİZ ({selectedPackages.length} Paket)</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>TOPLAM: {getPackagesPrice()} TL</div>
                </div>
                <button 
                  onClick={() => setStep(2)}
                  style={{ background: "#fff", color: "#000", border: "none", padding: "0.8rem 1.5rem", borderRadius: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  Devam Et <ChevronRight size={18} />
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            style={{ maxWidth: '950px', margin: '0 auto', background: 'var(--bg)', padding: '2.5rem', borderRadius: '2rem', border: '1px solid var(--border)' }}
          >
            <h2 style={{ fontSize: "1.8rem", fontWeight: 900, marginBottom: "2rem", textAlign: "center" }}>Rezervasyon Detayları</h2>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2.5rem" }}>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                {/* Contact Info */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)" }}>GELİN ADI SOYADI</label>
                    <input style={{ padding: "0.9rem", borderRadius: "1rem", border: "1px solid var(--border)", fontSize: "0.95rem" }} 
                      value={formData.brideName} onChange={e => setFormData({...formData, brideName: e.target.value})} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)" }}>DAMAT ADI SOYADI</label>
                    <input style={{ padding: "0.9rem", borderRadius: "1rem", border: "1px solid var(--border)", fontSize: "0.95rem" }} 
                      value={formData.groomName} onChange={e => setFormData({...formData, groomName: e.target.value})} />
                  </div>
                  <input placeholder="Gelin Telefon" style={{ padding: "0.9rem", borderRadius: "1rem", border: "1px solid var(--border)" }} 
                    value={formData.bridePhone} onChange={e => setFormData({...formData, bridePhone: e.target.value})} />
                  <input placeholder="Gelin E-posta" type="email" style={{ padding: "0.9rem", borderRadius: "1rem", border: "1px solid var(--border)" }} 
                    value={formData.brideEmail} onChange={e => setFormData({...formData, brideEmail: e.target.value})} />
                </div>

                {/* Scheduling */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)" }}>ETKİNLİK TARİHİ</label>
                    <input type="date" style={{ padding: "0.9rem", borderRadius: "1rem", border: "1px solid var(--border)" }} 
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                  {selectedPackages.some(p => p.timeType === "SLOT") && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)" }}>SAAT PERİYODU (SLOT TARZI PAKETLER İÇİN)</label>
                      <select style={{ padding: "0.9rem", borderRadius: "1rem", border: "1px solid var(--border)" }}
                        value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})}>
                        {["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                <textarea 
                  placeholder="Ekstra notlar, istekler veya bilmemiz gereken detaylar..." 
                  style={{ padding: "1.2rem", borderRadius: "1.2rem", border: "1px solid var(--border)", minHeight: "100px" }}
                  value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              {/* Sidebar: Summary & Addons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ background: "var(--bg-card)", padding: "1.5rem", borderRadius: "1.5rem", border: "1px solid var(--border)" }}>
                  <h3 style={{ fontSize: "0.9rem", fontWeight: 900, marginBottom: "1.2rem", color: "var(--primary)" }}>MÜSAİTLİK VE ÖZET</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {selectedPackages.map(pkg => (
                      <div key={pkg.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                        <span style={{ fontWeight: 600 }}>{pkg.name}</span>
                        {availabilityErrors[pkg.id] ? (
                          <span style={{ color: "#EF4444", fontWeight: 700 }}>DOLU!</span>
                        ) : (
                          <span style={{ color: "#10B981", fontWeight: 700 }}>UYGUN</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: "var(--bg-card)", padding: "1.5rem", borderRadius: "1.5rem", border: "1px solid var(--border)" }}>
                  <h3 style={{ fontSize: "0.9rem", fontWeight: 900, marginBottom: "1.2rem", color: "var(--primary)" }}>PAKET EKSTRALARI</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {selectedPackages.flatMap(p => p.addons || []).map((addon, i) => (
                      <div 
                        key={i} 
                        onClick={() => toggleAddon(addon)}
                        style={{ 
                          padding: "0.8rem", borderRadius: "0.75rem", border: "1px solid var(--border)", 
                          background: selectedAddons.find(a => a.title === addon.title) ? "#fff" : "transparent",
                          cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center"
                        }}
                      >
                        <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{addon.title}</span>
                        <span style={{ fontSize: "0.8rem", fontWeight: 800 }}>+{addon.price} TL</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "3rem" }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: "1rem", borderRadius: "1rem", border: "1px solid var(--border)", background: "transparent", fontWeight: 700 }}>Geri</button>
              <button onClick={() => setStep(3)} disabled={!formData.date || Object.keys(availabilityErrors).length > 0} 
                style={{ flex: 2, padding: "1rem", borderRadius: "1rem", border: "none", background: "var(--primary)", color: "#fff", fontWeight: 800 }}>
                Ödeme Adımına Geç ({getTotalPrice()} TL)
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            style={{ maxWidth: '650px', margin: '0 auto', background: 'var(--bg)', padding: '3rem', borderRadius: '2.5rem', border: '1px solid var(--border)' }}
          >
            <h2 style={{ fontSize: "1.8rem", fontWeight: 900, marginBottom: "2rem", textAlign: "center" }}>Ödeme Yöntemi</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div onClick={() => setPaymentType("deposit")} style={{ padding: "1.5rem", borderRadius: "1.5rem", border: "2px solid", borderColor: paymentType === "deposit" ? "var(--primary)" : "var(--border)", background: paymentType === "deposit" ? "var(--primary-muted)" : "transparent", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><div style={{ fontWeight: 800 }}>%20 Rezervasyon Ücreti (Kapora)</div><div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Kalan tutar etkinlik günü ödenir.</div></div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900 }}>{getMinDeposit()} TL</div>
              </div>
              <div onClick={() => setPaymentType("full")} style={{ padding: "1.5rem", borderRadius: "1.5rem", border: "2px solid", borderColor: paymentType === "full" ? "var(--primary)" : "var(--border)", background: paymentType === "full" ? "var(--primary-muted)" : "transparent", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><div style={{ fontWeight: 800 }}>Tam Ödeme</div><div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Tüm paket fiyatını şimdi öde.</div></div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900 }}>{getTotalPrice()} TL</div>
              </div>
            </div>

            <div style={{ marginTop: "2rem", padding: "1.2rem", background: "var(--bg-card)", borderRadius: "1.2rem", border: "1px solid var(--border)" }}>
              <label style={{ display: "flex", gap: "0.75rem", cursor: "pointer", fontSize: "0.9rem", color: "var(--text)" }}>
                <input type="checkbox" checked={contractAccepted} onChange={e => setContractAccepted(e.target.checked)} style={{ width: "18px", height: "18px" }} />
                <span>Hizmet sözleşmesini ve KVKK politikalarını onaylıyorum.</span>
              </label>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: "1.1rem", borderRadius: "1.2rem", border: "1px solid var(--border)", background: "transparent", fontWeight: 700 }}>Geri</button>
              <button onClick={startPayment} disabled={isLoading} style={{ flex: 2, padding: "1.1rem", borderRadius: "1.2rem", border: "none", background: "var(--primary)", color: "#fff", fontWeight: 800, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}>
                {isLoading ? "Hazırlanıyor..." : `${calculateFinalAmount()} TL Öde`} <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && paytrToken && (
          <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: "100%", background: "#fff", borderRadius: "2rem", overflow: "hidden", minHeight: "700px" }}>
            <iframe src={`https://www.paytr.com/odeme/guvenli/${paytrToken}`} id="paytriframe" frameBorder="0" scrolling="no" style={{ width: "100%", height: "700px" }}></iframe>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
