"use client";

import { useState, useEffect } from "react";
import { CreditCard, Banknote, X, AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import { convertToCreditCardPermanent } from "@/app/admin/core-actions";

const methodLabels = { CASH: "Nakit", BANK_TRANSFER: "Havale/EFT", CREDIT_CARD: "Kredi Kartı", ONLINE: "Online" };
const methodColors = { CASH: "#4ade80", BANK_TRANSFER: "#60a5fa", CREDIT_CARD: "#f59e0b", ONLINE: "#a78bfa" };

export default function PaymentSection({ reservation, compactMode = false }) {
  const [showPayModal, setShowPayModal] = useState(false);
  const [showConversionConfirm, setShowConversionConfirm] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);
  
  // Local active session indicator before page reload sets it permanently
  const [isConvertedToCard, setIsConvertedToCard] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  
  const [paymentMode, setPaymentMode] = useState("full"); // "full" | "partial"
  const [payAmount, setPayAmount] = useState("");
  const [iframeToken, setIframeToken] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const isCashOnly = reservation.paymentPreference === "CASH";

  const originalTotalAmount = parseFloat(reservation.totalAmount?.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || '0');
  const payments = reservation.payments || [];
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  
  const baseRemaining = Math.max(0, originalTotalAmount - totalPaid);
  const cardRemaining = isCashOnly ? Math.round(baseRemaining * 1.15) : baseRemaining;

  // If user selected to convert within THIS active session, display +15% pricing 
  const currentRemaining = (isCashOnly && isConvertedToCard) ? cardRemaining : baseRemaining;
  const currentTotalAmount = (isCashOnly && isConvertedToCard) ? originalTotalAmount + (cardRemaining - baseRemaining) : originalTotalAmount;
  
  const pct = currentTotalAmount > 0 ? Math.min(100, (totalPaid / currentTotalAmount) * 100) : 0;
  const isPaid = totalPaid >= currentTotalAmount && currentTotalAmount > 0;

  // Make sure payAmount stays updated with full amount if mode is "full"
  useEffect(() => {
    if (paymentMode === "full") {
      setPayAmount(currentRemaining.toString());
    }
  }, [paymentMode, currentRemaining]);

  const startPayment = async () => {
    const finalAmount = paymentMode === "full" ? currentRemaining : parseFloat(payAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) return;
    if (loading) return;

    setLoading(true);
    try {
      const oid = `${reservation.id}_${Date.now()}`;
      const packageNames = reservation.packages.map(p => p.name).join(", ");
      const baseBasketStr = JSON.stringify([[packageNames, String(Math.round(finalAmount)), "1"]]);
      const basket = btoa(encodeURIComponent(baseBasketStr).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)));

      const res = await fetch("/api/paytr/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_oid: reservation.id, 
          email: reservation.brideEmail,
          payment_amount: Math.round(finalAmount * 100), 
          user_name: reservation.brideName,
          user_phone: reservation.bridePhone,
          user_address: "Türkiye",
          user_basket: basket,
        }),
      });

      const data = await res.json();
      if (data.token) {
        setIframeToken(data.token);
      } else {
        alert("Ödeme başlatılamadı: " + (data.error || "Bilinmeyen hata"));
      }
    } catch (err) {
      alert("Bir hata oluştu: " + err.message);
    }
    setLoading(false);
  };

  const renderConversionConfirmModal = () => showConversionConfirm ? (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24 }}>
      <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, width: "100%", maxWidth: 440, padding: 28, animation: "popIn 0.3s ease" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(250,204,21,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertTriangle size={32} style={{ color: "#facc15" }} />
          </div>
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 16px 0", textAlign: "center" }}>Kredi Kartı ile Ödeme</h3>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, textAlign: "center", lineHeight: 1.6, marginBottom: 24 }}>
          Kredi kartıyla ödemeyi seçtiğinizde, kalan bakiye tutarınıza yasal işlem/komisyon bedeli olarak <strong>+%15</strong> yansıtılacaktır.<br/><br/>
          Kalan Bakiye: <span style={{ textDecoration: "line-through", opacity: 0.6 }}>{baseRemaining.toLocaleString('tr-TR')}₺</span> → <strong style={{ color: "#facc15", fontSize: 16 }}>{cardRemaining.toLocaleString('tr-TR')}₺</strong> olacaktır.<br/><br/>
          Onaylıyor musunuz?
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button 
            disabled={isConverting}
            onClick={() => setShowConversionConfirm(false)}
            style={{ flex: 1, padding: 14, borderRadius: 12, background: "rgba(255,255,255,0.05)", color: "#fff", border: "none", fontWeight: 700, cursor: isConverting ? "not-allowed" : "pointer" }}>
            İptal
          </button>
          <button 
            disabled={isConverting}
            onClick={async () => {
              setIsConverting(true);
              const newTotalNumeric = originalTotalAmount + (cardRemaining - baseRemaining);
              const newTotalStr = newTotalNumeric.toLocaleString('tr-TR') + '₺';
              // Make server call to save permanently
              await convertToCreditCardPermanent(reservation.id, newTotalStr);
              // Instantly update visual local UI 
              setIsConvertedToCard(true);
              setShowConversionConfirm(false);
              setIsConverting(false);
            }}
            style={{ flex: 1, padding: 14, borderRadius: 12, background: "#facc15", color: "#000", border: "none", fontWeight: 700, cursor: isConverting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: isConverting ? 0.7 : 1 }}>
            {isConverting ? "Kayıt Ediliyor..." : "Evet, Onaylıyorum"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const renderRevertConfirmModal = () => showRevertConfirm ? (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24 }}>
      <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, width: "100%", maxWidth: 440, padding: 28, animation: "popIn 0.3s ease" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(74,222,128,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Banknote size={32} style={{ color: "#4ade80" }} />
          </div>
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 16px 0", textAlign: "center" }}>Nakite Geri Dönüş Talebi</h3>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, textAlign: "center", lineHeight: 1.6, marginBottom: 24 }}>
          Mevcut bakiyenizdeki %15'lik komisyon kesintisi kaldırılarak nakit ödeme fiyatınıza geri dönecektir.<br/><br/>
          İşlemi onayladığınızda ekibimiz sizinle IBAN bilgileri için iletişime geçecektir.<br/><br/>
          Emin misiniz?
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button 
            disabled={isReverting}
            onClick={() => setShowRevertConfirm(false)}
            style={{ flex: 1, padding: 14, borderRadius: 12, background: "rgba(255,255,255,0.05)", color: "#fff", border: "none", fontWeight: 700, cursor: isReverting ? "not-allowed" : "pointer" }}>
            İptal
          </button>
          <button 
            disabled={isReverting}
            onClick={async () => {
              setIsReverting(true);
              const { revertToCashPayment } = await import('@/app/admin/core-actions');
              await revertToCashPayment(reservation.id);
              window.location.reload();
            }}
            style={{ flex: 1, padding: 14, borderRadius: 12, background: "#4ade80", color: "#000", border: "none", fontWeight: 700, cursor: isReverting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: isReverting ? 0.7 : 1 }}>
            {isReverting ? "İşleniyor..." : "Evet, Döndür"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const renderModal = () => showPayModal ? (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24 }}>
      <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, width: "100%", maxWidth: 440, maxHeight: "90vh", overflow: "auto" }}>
        
        {!iframeToken ? (
          <div style={{ padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Ödeme Tutarı Belirle</h3>
              <button onClick={() => { setShowPayModal(false); setIframeToken(null); }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: 6, cursor: "pointer", color: "rgba(255,255,255,0.5)" }}>
                <X size={16} />
              </button>
            </div>

            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 20 }}>
              Kalan bakiye: <strong style={{ color: "#facc15" }}>{currentRemaining.toLocaleString('tr-TR')}₺</strong>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {/* Option 1: Full Payment */}
              <button 
                onClick={() => setPaymentMode("full")}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px", borderRadius: 14, border: paymentMode === "full" ? "1px solid #fff" : "1px solid rgba(255,255,255,0.1)",
                  background: paymentMode === "full" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                  cursor: "pointer", transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {paymentMode === "full" ? <CheckCircle2 size={20} style={{ color: "#fff" }} /> : <Circle size={20} style={{ color: "rgba(255,255,255,0.2)" }} />}
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>Tamamını Öde</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{currentRemaining.toLocaleString('tr-TR')}₺</span>
              </button>

              {/* Option 2: Partial Payment */}
              <button 
                onClick={() => setPaymentMode("partial")}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px", borderRadius: 14, border: paymentMode === "partial" ? "1px solid #fff" : "1px solid rgba(255,255,255,0.1)",
                  background: paymentMode === "partial" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                  cursor: "pointer", transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {paymentMode === "partial" ? <CheckCircle2 size={20} style={{ color: "#fff" }} /> : <Circle size={20} style={{ color: "rgba(255,255,255,0.2)" }} />}
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>Farklı Tutar Gir</span>
                </div>
              </button>

              {paymentMode === "partial" && (
                <div style={{ marginTop: 4 }}>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="Miktar belirleyin (₺)"
                    autoFocus
                    style={{
                      width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 12, padding: "16px", fontSize: 16, color: "#fff", outline: "none",
                      boxSizing: "border-box", fontWeight: 600,
                    }}
                  />
                  {parseFloat(payAmount) > currentRemaining && (
                    <div style={{ color: "#ef4444", fontSize: 12, marginTop: 8 }}>Belirtilen tutar kalan bakiyeden ({currentRemaining}₺) fazla olamaz.</div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={startPayment}
              disabled={loading || (paymentMode === "partial" && (!payAmount || parseFloat(payAmount) <= 0 || parseFloat(payAmount) > currentRemaining))}
              style={{
                width: "100%", padding: 16, borderRadius: 14, border: "none",
                background: "#fff", color: "#000",
                fontWeight: 700, fontSize: 15, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: loading || (paymentMode === "partial" && (!payAmount || parseFloat(payAmount) <= 0 || parseFloat(payAmount) > currentRemaining)) ? 0.5 : 1
              }}
            >
              {loading ? "İşleniyor..." : (
                <>
                  <CreditCard size={16} />
                  Devam Et
                </>
              )}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Kredi Kartı ile Öde</h3>
              <button onClick={() => { setShowPayModal(false); setIframeToken(null); }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: 6, cursor: "pointer", color: "rgba(255,255,255,0.5)" }}>
                <X size={16} />
              </button>
            </div>
            <iframe
              src={`https://www.paytr.com/odeme/guvenli/${iframeToken}`}
              style={{ width: "100%", height: 460, border: "none" }}
              frameBorder="0"
            />
          </div>
        )}
      </div>
    </div>
  ) : null;

  const handlePrimaryPayClick = () => {
    if (isCashOnly && !isConvertedToCard) {
      setShowConversionConfirm(true);
    } else {
      setPaymentMode("full");
      setShowPayModal(true);
    }
  };

  // In compact mode, only show the pay button (summary is handled by parent)
  if (compactMode) {
    return (
      <>
        {baseRemaining > 0 && (
          <button
            onClick={handlePrimaryPayClick}
            style={{
              width: "100%", padding: 14, borderRadius: 12, border: "none",
              background: "#fff", color: "#000", fontWeight: 700, fontSize: 14,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s",
            }}
          >
            <CreditCard size={16} />
            {isCashOnly && !isConvertedToCard ? `Kredi Kartı ile Öde (+%15)` : "Ödeme Yap"}
          </button>
        )}

        {/* Modals */}
        {renderConversionConfirmModal()}
        {renderModal()}
      </>
    );
  }

  if (isPaid) {
    return (
      <div style={{ background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.1)", borderRadius: 20, padding: "20px 24px", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <CreditCard size={16} style={{ color: "#4ade80" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "#4ade80" }}>✅ Ödeme Tamamlandı</span>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
          Toplam {totalPaid.toLocaleString('tr-TR')}₺ ödendi · {payments.length} işlem
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "20px 24px", overflow: "hidden", position: "relative" }}>
        {/* Is Converted Overlay/Indicator */}
        {isCashOnly && isConvertedToCard && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #facc15, #f59e0b)" }} />
        )}
        
        {/* Summary */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Banknote size={16} style={{ color: "#facc15" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>Ödeme Durumu</span>
          {isCashOnly && isConvertedToCard && (
             <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(250,204,21,0.2)", color: "#facc15", padding: "2px 8px", borderRadius: 100 }}>Kredi Kartı Fiyatlandırması Akif Edildi</span>
          )}
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div style={{ textAlign: "center", background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 6px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 4 }}>Toplam</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{currentTotalAmount.toLocaleString('tr-TR')}₺</div>
          </div>
          <div style={{ textAlign: "center", background: "rgba(74,222,128,0.05)", borderRadius: 10, padding: "10px 6px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(74,222,128,0.5)", textTransform: "uppercase", marginBottom: 4 }}>Ödenen</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#4ade80" }}>{totalPaid.toLocaleString('tr-TR')}₺</div>
          </div>
          <div style={{ textAlign: "center", background: (isCashOnly && isConvertedToCard) ? "rgba(250,204,21,0.15)" : "rgba(250,204,21,0.05)", border: (isCashOnly && isConvertedToCard) ? "1px solid rgba(250,204,21,0.3)" : "none", borderRadius: 10, padding: "10px 6px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: (isCashOnly && isConvertedToCard) ? "#facc15" : "rgba(250,204,21,0.5)", textTransform: "uppercase", marginBottom: 4 }}>Kalan</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#facc15" }}>{currentRemaining.toLocaleString('tr-TR')}₺</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginBottom: 6 }}>
          <div style={{ height: "100%", borderRadius: 3, background: pct > 0 ? "linear-gradient(90deg, #4ade80, #facc15)" : "transparent", width: `${pct}%`, transition: "width 0.5s ease" }} />
        </div>
        <div style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", marginBottom: 16 }}>
          %{Math.round(pct)} ödendi
        </div>

        {/* Unified Payment & Action Timeline */}
        {(() => {
          const rawLogs = reservation.paymentLogs || [];
          // Inject legacy payments that were recorded prior to the semantic logging system
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
               case "ADD_PAYMENT": return <CreditCard size={12} style={{ color: "#4ade80" }} />;
               case "DELETE_PAYMENT": return <X size={12} style={{ color: "#ef4444" }} />;
               case "CARD_CONVERSION": return <CreditCard size={12} style={{ color: "#facc15" }} />;
               case "EXTRA_FEE": return <AlertTriangle size={12} style={{ color: "#f97316" }} />;
               case "CASH_REVERSION": return <Banknote size={12} style={{ color: "#a78bfa" }} />;
               default: return <Circle size={12} style={{ color: "#888" }} />;
             }
          };

          return (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 12 }}>Hesap Hareketleri</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "relative" }}>
                {/* Vertical timeline line */}
                <div style={{ position: "absolute", left: 15, top: 10, bottom: 10, width: 2, background: "rgba(255,255,255,0.05)", zIndex: 0 }} />
                
                {timeline.map((log) => {
                  const isPositive = log.amount && log.amount.includes("+");
                  const isNegative = log.amount && log.amount.includes("-");
                  return (
                  <div key={log.id} style={{ display: "flex", gap: 12, position: "relative", zIndex: 1 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#111", border: "2px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {getLogIcon(log.type)}
                    </div>
                    <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>{log.description}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: isPositive ? "#4ade80" : (isNegative ? "#ef4444" : "#fff"), whiteSpace: "nowrap", marginLeft: 12 }}>{log.amount}</span>
                      </div>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>
                        {new Date(log.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })} · {new Date(log.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          );
        })()}

        {/* Action Buttons */}
        {currentRemaining > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 24 }}>
            <button
              onClick={handlePrimaryPayClick}
              style={{
                width: "100%", padding: 14, borderRadius: 12, border: "none",
                background: "#fff", color: "#000", fontWeight: 700, fontSize: 14,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.2s",
              }}
            >
              <CreditCard size={16} />
              {isCashOnly && !isConvertedToCard 
                ? `Kredi Kartı ile Öde (+%15)`
                : `Ödeme Yap`
              }
            </button>

            {(!isCashOnly || isConvertedToCard) && (
              <button
                onClick={() => setShowRevertConfirm(true)}
                style={{
                  width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(74,222,128,0.3)",
                  background: "rgba(74,222,128,0.05)", color: "#4ade80", fontWeight: 700, fontSize: 13,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.2s",
                }}
              >
                <Banknote size={15} />
                Nakit Ödemek İstiyorum
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {renderConversionConfirmModal()}
      {renderRevertConfirmModal()}
      {renderModal()}
    </>
  );
}
