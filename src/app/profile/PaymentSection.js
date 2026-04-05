"use client";

import { useState } from "react";
import { CreditCard, Banknote, X, AlertTriangle, ArrowLeft } from "lucide-react";

const methodLabels = { CASH: "Nakit", BANK_TRANSFER: "Havale/EFT", CREDIT_CARD: "Kredi Kartı", ONLINE: "Online" };
const methodColors = { CASH: "#4ade80", BANK_TRANSFER: "#60a5fa", CREDIT_CARD: "#f59e0b", ONLINE: "#a78bfa" };

export default function PaymentSection({ reservation, compactMode = false }) {
  const [showPayModal, setShowPayModal] = useState(false);
  const [showConversionConfirm, setShowConversionConfirm] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);
  const [isConvertedToCard, setIsConvertedToCard] = useState(false);
  
  const [payAmount, setPayAmount] = useState("");
  const [iframeToken, setIframeToken] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const isCashOnly = reservation.paymentPreference === "CASH";

  const originalTotalAmount = parseFloat(reservation.totalAmount?.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || '0');
  const payments = reservation.payments || [];
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  
  const baseRemaining = Math.max(0, originalTotalAmount - totalPaid);
  const cardRemaining = isCashOnly ? Math.round(baseRemaining * 1.15) : baseRemaining;

  // If user selected to convert, display the +15% pricing 
  const currentRemaining = (isCashOnly && isConvertedToCard) ? cardRemaining : baseRemaining;
  const currentTotalAmount = (isCashOnly && isConvertedToCard) ? originalTotalAmount + (cardRemaining - baseRemaining) : originalTotalAmount;
  
  const pct = currentTotalAmount > 0 ? Math.min(100, (totalPaid / currentTotalAmount) * 100) : 0;
  const isPaid = totalPaid >= currentTotalAmount && currentTotalAmount > 0;

  const startPayment = async () => {
    if (!payAmount || loading) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) return;

    setLoading(true);
    try {
      const oid = `${reservation.id}_${Date.now()}`;
      const packageNames = reservation.packages.map(p => p.name).join(", ");
      const basket = btoa(JSON.stringify([[packageNames, String(Math.round(amount)), "1"]]));

      const res = await fetch("/api/paytr/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_oid: reservation.id, 
          email: reservation.brideEmail,
          payment_amount: Math.round(amount * 100), 
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
            onClick={() => setShowConversionConfirm(false)}
            style={{ flex: 1, padding: 14, borderRadius: 12, background: "rgba(255,255,255,0.05)", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>
            İptal
          </button>
          <button 
            onClick={() => {
              setShowConversionConfirm(false);
              setIsConvertedToCard(true);
              setPayAmount(cardRemaining.toString());
              setShowPayModal(true);
            }}
            style={{ flex: 1, padding: 14, borderRadius: 12, background: "#facc15", color: "#000", border: "none", fontWeight: 700, cursor: "pointer" }}>
            Evet, Onaylıyorum
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const renderRevertConfirmModal = () => showRevertConfirm ? (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24 }}>
      <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, width: "100%", maxWidth: 440, padding: 28 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px 0", textAlign: "center" }}>Nakit Fiyatına Dön</h3>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, textAlign: "center", lineHeight: 1.6, marginBottom: 24 }}>
          Kredi kartı tercihinden vazgeçip nakit/havale fiyatına (<strong>{baseRemaining.toLocaleString('tr-TR')}₺</strong>) geri dönmek istediğinize emin misiniz?
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button 
            onClick={() => setShowRevertConfirm(false)}
            style={{ flex: 1, padding: 14, borderRadius: 12, background: "rgba(255,255,255,0.05)", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>
            Vazgeç
          </button>
          <button 
            onClick={() => {
              setShowRevertConfirm(false);
              setIsConvertedToCard(false);
            }}
            style={{ flex: 1, padding: 14, borderRadius: 12, background: "#fff", color: "#000", border: "none", fontWeight: 700, cursor: "pointer" }}>
            Evet, Nakite Dön
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
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Ödeme Tutarı</h3>
              <button onClick={() => { setShowPayModal(false); setIframeToken(null); }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: 6, cursor: "pointer", color: "rgba(255,255,255,0.5)" }}>
                <X size={16} />
              </button>
            </div>

            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 20 }}>
              Kalan bakiye: <strong style={{ color: "#facc15" }}>{currentRemaining.toLocaleString('tr-TR')}₺</strong>. 
              Tamamını veya bir kısmını ödeyebilirsiniz.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {currentRemaining > 0 && (
                <button onClick={() => setPayAmount(currentRemaining.toString())} style={{
                  padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  border: payAmount === currentRemaining.toString() ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.1)",
                  background: payAmount === currentRemaining.toString() ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                  color: "#fff",
                }}>
                  Tamamı ({currentRemaining.toLocaleString('tr-TR')}₺)
                </button>
              )}
              {currentTotalAmount > 0 && currentRemaining > currentTotalAmount * 0.5 && (
                <button onClick={() => setPayAmount(Math.round(currentTotalAmount * 0.5).toString())} style={{
                  padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#fff",
                }}>
                  %50 ({Math.round(currentTotalAmount * 0.5).toLocaleString('tr-TR')}₺)
                </button>
              )}
            </div>

            <input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="Ödenecek tutar (₺)"
              style={{
                width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 12, padding: "14px 16px", fontSize: 15, color: "#fff", outline: "none",
                boxSizing: "border-box", marginBottom: 16,
              }}
            />

            <button
              onClick={startPayment}
              disabled={!payAmount || loading}
              style={{
                width: "100%", padding: 16, borderRadius: 14, border: "none",
                background: payAmount ? "#fff" : "rgba(255,255,255,0.05)",
                color: payAmount ? "#000" : "rgba(255,255,255,0.2)",
                fontWeight: 700, fontSize: 15, cursor: payAmount ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {loading ? "İşleniyor..." : (
                <>
                  <CreditCard size={16} />
                  {payAmount ? `${parseFloat(payAmount).toLocaleString('tr-TR')}₺ Öde` : "Tutar Girin"}
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
      setPayAmount(currentRemaining.toString());
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
        {renderRevertConfirmModal()}
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
             <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(250,204,21,0.2)", color: "#facc15", padding: "2px 8px", borderRadius: 100 }}>Kredi Kartı Fiyatlandırması</span>
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
          <div style={{ textAlign: "center", background: isConvertedToCard ? "rgba(250,204,21,0.15)" : "rgba(250,204,21,0.05)", border: isConvertedToCard ? "1px solid rgba(250,204,21,0.3)" : "none", borderRadius: 10, padding: "10px 6px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: isConvertedToCard ? "#facc15" : "rgba(250,204,21,0.5)", textTransform: "uppercase", marginBottom: 4 }}>Kalan</div>
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

        {/* Payment History */}
        {payments.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 8 }}>Ödeme Geçmişi</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {payments.map((p) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: methodColors[p.method] || "#888" }} />
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{p.amount.toLocaleString('tr-TR')}₺</span>
                      <span style={{ fontSize: 11, fontWeight: 500, color: methodColors[p.method] || "#888", marginLeft: 6 }}>{methodLabels[p.method] || p.method}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                    {new Date(p.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

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
                : `Ödeme Yap — ${currentRemaining.toLocaleString('tr-TR')}₺`
              }
            </button>
            
            {/* Nakite Dön Button if they converted */}
            {isCashOnly && isConvertedToCard && (
               <button
               onClick={() => setShowRevertConfirm(true)}
               style={{
                 width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)",
                 background: "transparent", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 13,
                 cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                 transition: "all 0.2s",
               }}
               className="hover:bg-white/5 hover:text-white"
             >
               <ArrowLeft size={14} />
               Nakite Dön (Eski Fiyattan Havale/EFT)
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
