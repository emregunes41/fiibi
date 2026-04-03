"use client";

import { useState } from "react";
import { CreditCard, Banknote, X } from "lucide-react";

const methodLabels = { CASH: "Nakit", BANK_TRANSFER: "Havale/EFT", CREDIT_CARD: "Kredi Kartı", ONLINE: "Online" };
const methodColors = { CASH: "#4ade80", BANK_TRANSFER: "#60a5fa", CREDIT_CARD: "#f59e0b", ONLINE: "#a78bfa" };

export default function PaymentSection({ reservation, compactMode = false }) {
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [iframeToken, setIframeToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const isCashOnly = reservation.paymentPreference === "CASH";

  const totalAmount = parseFloat(reservation.totalAmount?.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || '0');
  const payments = reservation.payments || [];
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, totalAmount - totalPaid);
  const pct = totalAmount > 0 ? Math.min(100, (totalPaid / totalAmount) * 100) : 0;
  const isPaid = totalPaid >= totalAmount && totalAmount > 0;

  const startPayment = async () => {
    if (!payAmount || loading) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) return;

    setLoading(true);
    try {
      // merchant_oid needs to be unique for each payment attempt
      const oid = `${reservation.id}_${Date.now()}`;
      const packageNames = reservation.packages.map(p => p.name).join(", ");
      const basket = btoa(JSON.stringify([[packageNames, String(Math.round(amount)), "1"]]));

      const res = await fetch("/api/paytr/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_oid: reservation.id, // Use reservation ID so callback can find it
          email: reservation.brideEmail,
          payment_amount: Math.round(amount * 100), // kuruş
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
              Kalan bakiye: <strong style={{ color: "#facc15" }}>{remaining.toLocaleString('tr-TR')}₺</strong>. 
              Tamamını veya bir kısmını ödeyebilirsiniz.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {remaining > 0 && (
                <button onClick={() => setPayAmount(remaining.toString())} style={{
                  padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  border: payAmount === remaining.toString() ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.1)",
                  background: payAmount === remaining.toString() ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                  color: "#fff",
                }}>
                  Tamamı ({remaining.toLocaleString('tr-TR')}₺)
                </button>
              )}
              {totalAmount > 0 && remaining > totalAmount * 0.5 && (
                <button onClick={() => setPayAmount(Math.round(totalAmount * 0.5).toString())} style={{
                  padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#fff",
                }}>
                  %50 ({Math.round(totalAmount * 0.5).toLocaleString('tr-TR')}₺)
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

  // In compact mode, only show the pay button (summary is handled by parent)
  if (compactMode) {
    return (
      <>
        {remaining > 0 && !isCashOnly && (
          <button
            onClick={() => { setPayAmount(remaining.toString()); setShowPayModal(true); }}
            style={{
              width: "100%", padding: 14, borderRadius: 12, border: "none",
              background: "#fff", color: "#000", fontWeight: 700, fontSize: 14,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s",
            }}
          >
            <CreditCard size={16} />
            Ödeme Yap
          </button>
        )}

        {/* Payment Modal */}
        {showPayModal && renderModal()}
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
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "20px 24px", overflow: "hidden" }}>
        {/* Summary */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Banknote size={16} style={{ color: "#facc15" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>Ödeme Durumu</span>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div style={{ textAlign: "center", background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 6px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 4 }}>Toplam</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{totalAmount.toLocaleString('tr-TR')}₺</div>
          </div>
          <div style={{ textAlign: "center", background: "rgba(74,222,128,0.05)", borderRadius: 10, padding: "10px 6px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(74,222,128,0.5)", textTransform: "uppercase", marginBottom: 4 }}>Ödenen</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#4ade80" }}>{totalPaid.toLocaleString('tr-TR')}₺</div>
          </div>
          <div style={{ textAlign: "center", background: "rgba(250,204,21,0.05)", borderRadius: 10, padding: "10px 6px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(250,204,21,0.5)", textTransform: "uppercase", marginBottom: 4 }}>Kalan</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#facc15" }}>{remaining.toLocaleString('tr-TR')}₺</div>
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

        {/* Pay Button */}
        {remaining > 0 && !isCashOnly && (
          <button
            onClick={() => { setPayAmount(remaining.toString()); setShowPayModal(true); }}
            style={{
              width: "100%", padding: 14, borderRadius: 12, border: "none",
              background: "#fff", color: "#000", fontWeight: 700, fontSize: 14,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s",
            }}
          >
            <CreditCard size={16} />
            Ödeme Yap — {remaining.toLocaleString('tr-TR')}₺
          </button>
        )}
        {remaining > 0 && isCashOnly && (
          <div style={{ textAlign: "center", padding: "10px 16px", borderRadius: 12, background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.1)" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Banknote size={14} style={{ color: "#4ade80" }} />
              Nakit / Havale ile ödeme yapılacaktır
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {renderModal()}
    </>
  );
}
