"use client";

import { useState } from "react";
import { X, FileText, CheckCircle2 } from "lucide-react";

export default function ContractPreviewModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        type="button" 
        onClick={(e) => { e.preventDefault(); setIsOpen(true); }} 
        className="hover:opacity-100"
        style={{ background: "transparent", border: "none", color: "#facc15", fontSize: 13, fontWeight: 600, textDecoration: "underline", opacity: 0.8, cursor: "pointer", transition: "opacity 0.2s", padding: 0 }}
      >
        Sözleşmeyi Oku
      </button>

      {isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          {/* Backdrop */}
          <div onClick={() => setIsOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }} />
          
          {/* Modal Content */}
          <div style={{ position: "relative", zIndex: 10, background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, width: "100%", maxWidth: 800, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 50px rgba(0,0,0,0.5)", animation: "popIn 0.3s ease-out" }}>
            
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(250,204,21,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileText size={20} style={{ color: "#facc15" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>Hizmet Sözleşmesi</h3>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, margin: 0 }}>Pinowed Fotoğrafçılık</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "rgba(255,255,255,0.6)", padding: 8, borderRadius: "50%", cursor: "pointer", display: "flex" }} className="hover:bg-white/10 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div style={{ padding: "24px", overflowY: "auto", color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 1.6, flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
              
              <p style={{ margin: 0 }}>Bu sözleşme, <strong>Pinowed Fotoğrafçılık</strong> ile siz değerli müşterimiz arasında yürürlüktedir.</p>

              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "#facc15" }}>1.</span> Hizmetin Kapsamı</h4>
                <p style={{ margin: 0 }}>Seçilen paket kapsamında belirtilen fotoğraf ve/veya video çekim hizmeti sunulacaktır.</p>
              </div>

              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "#facc15" }}>2.</span> Rezervasyon ve Kapora</h4>
                <p style={{ margin: 0 }}>Rezervasyon, kapora ödemesinin yapılması ile kesinleşir. Kapora ödemesi yapılmadan tarih rezerve edilmez.</p>
              </div>

              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "#facc15" }}>3.</span> Ödeme Koşulları</h4>
                <p style={{ margin: 0 }}>Kalan ödeme, çekim tarihinden en geç 3 gün önce tamamlanmalıdır. Kredi kartı ödemelerinde altyapı komisyonu uygulanır.</p>
              </div>

              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "#facc15" }}>4.</span> Tarih Değişikliği ve İptal</h4>
                <p style={{ margin: 0 }}>Değişiklik en geç 15 gün öncesinden bildirilmelidir ve 1 kez ücretsizdir. Müşteri kaynaklı iptallerde kapora iade edilmez.</p>
              </div>

              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "#facc15" }}>5.</span> Çekim Günleri</h4>
                <p style={{ margin: 0 }}>30 dakikayı aşan gecikmeler çekim süresinden düşülür.</p>
              </div>

              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "#facc15" }}>6.</span> Teslim Süresi ve Telif</h4>
                <p style={{ margin: 0 }}>Çekilen fotoğrafların telif hakkı Pinowed'e aittir. Tanıtım amaçlı kullanılmasını istemediğinizi yazılı olarak bildirebilirsiniz.</p>
              </div>
              
              <div style={{ marginTop: 8, padding: 16, background: "rgba(74,222,128,0.05)", borderRadius: 12, border: "1px solid rgba(74,222,128,0.15)", display: "flex", gap: 12 }}>
                <CheckCircle2 size={20} style={{ color: "#4ade80", flexShrink: 0 }} />
                <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                  Paneli kullanarak onay verdiğinizde yukarıdaki tüm maddeleri okuduğunuzu kabul edersiniz.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.08)", flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setIsOpen(false)} style={{ background: "#fff", color: "#000", fontWeight: 700, fontSize: 14, padding: "10px 24px", borderRadius: 10, border: "none", cursor: "pointer", transition: "all 0.2s" }} className="hover:opacity-90">
                Pencereyi Kapat
              </button>
            </div>

          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}} />
    </>
  );
}
