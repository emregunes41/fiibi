"use client";

import { useState, useEffect } from "react";
import { CreditCard, Banknote, X, AlertTriangle, CheckCircle2, Circle } from "lucide-react";

const methodLabels = { CASH: "Nakit", BANK_TRANSFER: "Havale/EFT", CREDIT_CARD: "Kredi Kartı", ONLINE: "Online" };

export default function PaymentSection({ reservation, compactMode = false, allowPaymentMethodChange = false }) {
  const [showPayModal, setShowPayModal] = useState(false);
  const [showConversionConfirm, setShowConversionConfirm] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);
  const [isConvertedToCard, setIsConvertedToCard] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [paymentMode, setPaymentMode] = useState("full");
  const [partialAmountInput, setPartialAmountInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [iframeToken, setIframeToken] = useState(null);
  const [loading, setLoading] = useState(false);

  const originalTotalAmount = parseFloat(reservation.totalAmount?.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || '0');
  const payments = reservation.payments || [];
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const currentRemaining = Math.max(0, originalTotalAmount - totalPaid);
  const currentTotalAmount = originalTotalAmount;
  const pct = currentTotalAmount > 0 ? Math.min(100, (totalPaid / currentTotalAmount) * 100) : 0;
  const isPaid = totalPaid >= currentTotalAmount && currentTotalAmount > 0;

  useEffect(() => {
    if (paymentMode === "full") {
      setPayAmount(currentRemaining.toString());
    }
    const handleMessage = (e) => {
      if (typeof e.data === 'string' && e.data.startsWith('paytr_')) {
        const height = e.data.split('_')[1];
        const iframe = document.getElementById('paytriframe_profile');
        if (iframe && height) iframe.style.height = height + 'px';
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [paymentMode, currentRemaining]);

  const startPayment = async () => {
    const finalAmount = paymentMode === "full" ? currentRemaining : parseFloat(payAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) return;
    if (loading) return;
    setLoading(true);
    try {
      const oid = `${reservation.id}X${Date.now()}`;
      const packageNames = reservation.packages.map(p => p.name).join(", ");
      const baseBasketStr = JSON.stringify([[packageNames, String(Math.round(finalAmount)), "1"]]);
      const basket = btoa(encodeURIComponent(baseBasketStr).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)));
      const res = await fetch("/api/paytr/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_oid: oid,
          email: reservation.brideEmail,
          payment_amount: Math.round(finalAmount * 100),
          user_name: reservation.brideName,
          user_phone: reservation.bridePhone,
          user_address: "Türkiye",
          user_basket: basket,
        }),
      });
      const data = await res.json();
      if (data.iframeUrl) {
        setIframeToken(data.iframeUrl);
      } else if (data.token) {
        setIframeToken(`https://fiibi.co/api/paytr/iframe/${data.token}`);
      } else {
        alert("Ödeme başlatılamadı: " + (data.error || "Bilinmeyen hata"));
      }
    } catch (err) {
      alert("Bir hata oluştu: " + err.message);
    }
    setLoading(false);
  };

  const renderConversionConfirmModal = () => null;
  const renderRevertConfirmModal = () => null;

  const renderModal = () => showPayModal ? (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24 }}>
      <div style={{ background: "var(--bg, #fff)", border: "1px solid var(--border, rgba(0,0,0,0.1))", borderRadius: 0, width: "100%", maxWidth: 440, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>

        {!iframeToken ? (
          <div style={{ padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--text, #1a1a1a)" }}>Ödeme Tutarı Belirle</h3>
              <button onClick={() => { setShowPayModal(false); setIframeToken(null); }} style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 0, padding: 6, cursor: "pointer", color: "rgba(0,0,0,0.4)" }}>
                <X size={16} />
              </button>
            </div>

            <p style={{ color: "rgba(0,0,0,0.5)", fontSize: 13, marginBottom: 20 }}>
              Kalan bakiye: <strong style={{ color: "var(--text, #1a1a1a)" }}>{currentRemaining.toLocaleString('tr-TR')}₺</strong>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {/* Option 1: Full Payment */}
              <button
                onClick={() => setPaymentMode("full")}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px", borderRadius: 0,
                  border: paymentMode === "full" ? "2px solid var(--text, #1a1a1a)" : "1px solid rgba(0,0,0,0.1)",
                  background: paymentMode === "full" ? "rgba(0,0,0,0.04)" : "transparent",
                  cursor: "pointer", transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {paymentMode === "full" ? <CheckCircle2 size={20} style={{ color: "var(--text, #1a1a1a)" }} /> : <Circle size={20} style={{ color: "rgba(0,0,0,0.2)" }} />}
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text, #1a1a1a)" }}>Tamamını Öde</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text, #1a1a1a)" }}>{currentRemaining.toLocaleString('tr-TR')}₺</span>
              </button>

              {/* Option 2: Partial Payment */}
              <button
                onClick={() => setPaymentMode("partial")}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px", borderRadius: 0,
                  border: paymentMode === "partial" ? "2px solid var(--text, #1a1a1a)" : "1px solid rgba(0,0,0,0.1)",
                  background: paymentMode === "partial" ? "rgba(0,0,0,0.04)" : "transparent",
                  cursor: "pointer", transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {paymentMode === "partial" ? <CheckCircle2 size={20} style={{ color: "var(--text, #1a1a1a)" }} /> : <Circle size={20} style={{ color: "rgba(0,0,0,0.2)" }} />}
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text, #1a1a1a)" }}>Farklı Tutar Gir</span>
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
                      width: "100%", background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.12)",
                      borderRadius: 0, padding: "16px", fontSize: 16, color: "var(--text, #1a1a1a)", outline: "none",
                      boxSizing: "border-box", fontWeight: 600,
                    }}
                  />
                  {parseFloat(payAmount) > currentRemaining && (
                    <div style={{ color: "rgba(0,0,0,0.5)", fontSize: 12, marginTop: 8 }}>Belirtilen tutar kalan bakiyeden ({currentRemaining}₺) fazla olamaz.</div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={startPayment}
              disabled={loading || (paymentMode === "partial" && (!payAmount || parseFloat(payAmount) <= 0 || parseFloat(payAmount) > currentRemaining))}
              className="payment-btn-white"
              style={{
                width: "100%", padding: 16, borderRadius: 0, border: "none",
                background: "var(--text, #1a1a1a)",

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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text, #1a1a1a)" }}>Kredi Kartı ile Öde</h3>
              <button onClick={() => { setShowPayModal(false); setIframeToken(null); }} style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 0, padding: 6, cursor: "pointer", color: "rgba(0,0,0,0.4)" }}>
                <X size={16} />
              </button>
            </div>
            <iframe
              id="paytriframe_profile"
              src={iframeToken.startsWith("http") ? iframeToken : `https://fiibi.co/api/paytr/iframe/${iframeToken}`}
              style={{ width: "100%", height: 700, minHeight: 700, border: "none" }}
              frameBorder="0"
              scrolling="yes"
            />
          </div>
        )}
      </div>
    </div>
  ) : null;

  const handlePrimaryPayClick = () => {
    setPaymentMode("full");
    setShowPayModal(true);
  };

  if (compactMode) {
    return (
      <>
        <style>{`
          .payment-btn-white, .payment-btn-white * { color: #ffffff !important; }
        `}</style>
        {currentRemaining > 0 && (
          <button
            onClick={handlePrimaryPayClick}
            className="payment-btn-white"
            style={{
              width: "100%", padding: 14, borderRadius: 0, border: "none",
              background: "var(--text, #1a1a1a)", fontWeight: 700, fontSize: 14,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s",
            }}
          >
            <CreditCard size={16} />
            Ödeme Yap
          </button>
        )}
        {renderConversionConfirmModal()}
        {renderModal()}
      </>
    );
  }

  if (isPaid) {
    return (
      <div style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 0, padding: "20px 24px", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <CreditCard size={16} style={{ color: "var(--text, #1a1a1a)" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text, #1a1a1a)" }}>✅ Ödeme Tamamlandı</span>
        </div>
        <div style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
          Toplam {totalPaid.toLocaleString('tr-TR')}₺ ödendi · {payments.length} işlem
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .payment-btn-white, .payment-btn-white * { color: #ffffff !important; }
      `}</style>
      <div style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 0, padding: "20px 24px", overflow: "hidden", position: "relative" }}>
        {/* Summary */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Banknote size={16} style={{ color: "rgba(0,0,0,0.5)" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text, #1a1a1a)" }}>Ödeme Durumu</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 12, marginBottom: 14 }}>
          <div style={{ textAlign: "center", background: "rgba(0,0,0,0.02)", borderRadius: 0, padding: "10px 6px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(0,0,0,0.4)", textTransform: "uppercase", marginBottom: 4 }}>Toplam</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text, #1a1a1a)" }}>{currentTotalAmount.toLocaleString('tr-TR')}₺</div>
          </div>
          <div style={{ textAlign: "center", background: "rgba(0,0,0,0.04)", borderRadius: 0, padding: "10px 6px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(0,0,0,0.4)", textTransform: "uppercase", marginBottom: 4 }}>Ödenen</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#22c55e" }}>{totalPaid.toLocaleString('tr-TR')}₺</div>
          </div>
          <div style={{ textAlign: "center", background: "rgba(0,0,0,0.02)", border: "none", borderRadius: 0, padding: "10px 6px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(0,0,0,0.4)", textTransform: "uppercase", marginBottom: 4 }}>Kalan</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text, #1a1a1a)" }}>{currentRemaining.toLocaleString('tr-TR')}₺</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, borderRadius: 0, background: "rgba(0,0,0,0.06)", overflow: "hidden", marginBottom: 6 }}>
          <div style={{ height: "100%", borderRadius: 0, background: pct > 0 ? "linear-gradient(90deg, var(--text, #1a1a1a), rgba(0,0,0,0.5))" : "transparent", width: `${pct}%`, transition: "width 0.5s ease" }} />
        </div>
        <div style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "rgba(0,0,0,0.35)", marginBottom: 16 }}>
          %{Math.round(pct)} ödendi
        </div>

        {/* Payment Timeline */}
        {(() => {
          const rawLogs = reservation.paymentLogs || [];
          const legacyPayments = payments.filter(p => {
            const pTime = new Date(p.createdAt).getTime();
            return !rawLogs.some(l => l.type === "ADD_PAYMENT" && Math.abs(new Date(l.date).getTime() - pTime) < 5000);
          }).map(p => ({
            id: p.id,
            date: p.createdAt,
            type: "ADD_PAYMENT",
            amount: `+ ${p.amount.toLocaleString('tr-TR')}₺`,
            description: `${methodLabels[p.method] || p.method} ödemesi`,
            _rawAmount: p.amount
          }));

          let chronologicalTimeline = [...rawLogs, ...legacyPayments].sort((a, b) => new Date(a.date) - new Date(b.date));

          let runningTotal = 0;
          let runningPaid = 0;
          let isFirst = true;

          chronologicalTimeline = chronologicalTimeline.map(log => {
            if (log.totalSnapshot !== undefined) runningTotal = log.totalSnapshot;
            if (log.paidSnapshot !== undefined) runningPaid = log.paidSnapshot;
            if (log.totalSnapshot === undefined && log.paidSnapshot === undefined) {
              if (isFirst) { runningTotal = currentTotalAmount; isFirst = false; }
              if (log.type === "EXTRA_FEE" && log._rawAmount) runningTotal += log._rawAmount;
              else if (log.type === "ADD_PAYMENT") {
                const amt = log._rawAmount !== undefined ? log._rawAmount : (typeof log.amount === 'number' ? log.amount : parseFloat(log.amount?.replace(/[^0-9,-]+/g, "").replace(",", ".") || 0));
                runningPaid += amt;
              } else if (log.type === "DELETE_PAYMENT") {
                const amt = log._rawAmount !== undefined ? log._rawAmount : (typeof log.amount === 'number' ? log.amount : parseFloat(log.amount?.replace(/[^0-9,-]+/g, "").replace(",", ".") || 0));
                runningPaid -= amt;
              }
            }
            return { ...log, _dynamicTotal: runningTotal, _dynamicPaid: runningPaid };
          });

          const displayTimeline = chronologicalTimeline.sort((a, b) => new Date(b.date) - new Date(a.date));
          if (displayTimeline.length === 0) return null;

          const getLogIcon = (type) => {
            switch (type) {
              case "ADD_PAYMENT": return <CreditCard size={12} style={{ color: "var(--text, #1a1a1a)" }} />;
              case "DELETE_PAYMENT": return <X size={12} style={{ color: "rgba(0,0,0,0.4)" }} />;
              case "CARD_CONVERSION": return <CreditCard size={12} style={{ color: "rgba(0,0,0,0.5)" }} />;
              case "EXTRA_FEE": return <AlertTriangle size={12} style={{ color: "rgba(0,0,0,0.4)" }} />;
              case "CASH_REVERSION": return <Banknote size={12} style={{ color: "rgba(0,0,0,0.5)" }} />;
              default: return <Circle size={12} style={{ color: "rgba(0,0,0,0.3)" }} />;
            }
          };

          const limitedTimeline = showAllLogs ? displayTimeline : displayTimeline.slice(0, 4);

          return (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(0,0,0,0.35)", textTransform: "uppercase", marginBottom: 12 }}>Hesap Hareketleri</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "relative" }}>
                <div style={{ position: "absolute", left: 15, top: 10, bottom: 10, width: 2, background: "rgba(0,0,0,0.05)", zIndex: 0 }} />
                {limitedTimeline.map((log) => {
                  const isPositive = log.amount && typeof log.amount === 'string' && log.amount.includes("+");
                  const isNegative = log.amount && typeof log.amount === 'string' && log.amount.includes("-");
                  const amtDisplay = typeof log.amount === 'string' ? log.amount : (log.amount ? log.amount.toLocaleString('tr-TR') + "₺" : "");

                  return (
                    <div key={log.id} style={{ display: "flex", gap: 12, position: "relative", zIndex: 1 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 0, background: "var(--bg, #fff)", border: "2px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {getLogIcon(log.type)}
                      </div>
                      <div style={{ flex: 1, background: "rgba(0,0,0,0.02)", borderRadius: 0, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text, #1a1a1a)", lineHeight: 1.4 }}>{log.description}</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: isPositive ? "#22c55e" : (isNegative ? "rgba(0,0,0,0.4)" : "var(--text, #1a1a1a)"), whiteSpace: "nowrap", marginLeft: 12 }}>{amtDisplay}</span>
                        </div>
                        <span style={{ fontSize: 10, color: "rgba(0,0,0,0.3)", fontWeight: 500 }}>
                          {new Date(log.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })} · {new Date(log.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div style={{ display: "flex", gap: 8, marginTop: 6, paddingTop: 6, borderTop: "1px dashed rgba(0,0,0,0.06)", flexWrap: "wrap" }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(0,0,0,0.4)" }}>
                            <span style={{ color: "rgba(0,0,0,0.25)" }}>TOPLAM:</span> {Math.round(log._dynamicTotal || 0).toLocaleString('tr-TR')}₺
                          </div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: "#22c55e" }}>
                            <span style={{ color: "rgba(0,0,0,0.4)" }}>ÖDENEN:</span> {Math.round(log._dynamicPaid || 0).toLocaleString('tr-TR')}₺
                          </div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text, #1a1a1a)" }}>
                            <span style={{ color: "rgba(0,0,0,0.35)" }}>KALAN:</span> {Math.max(0, Math.round((log._dynamicTotal || 0) - (log._dynamicPaid || 0))).toLocaleString('tr-TR')}₺
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!showAllLogs && displayTimeline.length > 4 && (
                <button
                  onClick={() => setShowAllLogs(true)}
                  style={{ width: "100%", background: "transparent", border: "1px solid rgba(0,0,0,0.1)", color: "rgba(0,0,0,0.5)", padding: "8px", borderRadius: 0, fontSize: 12, fontWeight: 600, cursor: "pointer", marginTop: 12, transition: "all 0.2s" }}
                >
                  Tüm Ödeme Geçmişini Gör ({displayTimeline.length - 4} Daha)
                </button>
              )}
            </div>
          );
        })()}

        {/* Action Buttons */}
        {currentRemaining > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 24 }}>
            <button
              onClick={handlePrimaryPayClick}
              className="payment-btn-white"
              style={{
                width: "100%", padding: 14, borderRadius: 0, border: "none",
                background: "var(--text, #1a1a1a)", fontWeight: 700, fontSize: 14,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.2s",
              }}
            >
              <CreditCard size={16} />
              Ödeme Yap
            </button>
          </div>
        )}
      </div>

      {renderConversionConfirmModal()}
      {renderRevertConfirmModal()}
      {renderModal()}
    </>
  );
}
