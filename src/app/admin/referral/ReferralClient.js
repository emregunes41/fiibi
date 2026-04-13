"use client";

import { useState } from "react";
import { Copy, Check, Gift } from "lucide-react";

export default function ReferralClient({ tenant, referrals }) {
  const [copied, setCopied] = useState(false);

  const code = tenant?.referralCode || "—";
  const domain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "photostudio.co";
  const referralLink = `https://${domain}/onboarding?ref=${code}`;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ color: "#fff" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "clamp(1.2rem, 4vw, 1.8rem)", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: 4 }}>
          Arkadaşını Getir
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
          Referans kodunuzu paylaşın. Davet ettiğiniz kişi ilk ödemesini yaptığında size <strong style={{ color: "#fff" }}>30 gün ücretsiz</strong> kullanım.
        </p>
      </div>

      {/* Referans Kodu */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "28px 24px", marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
          Referans Kodunuz
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <code style={{ fontSize: 32, fontWeight: 900, letterSpacing: "0.1em", color: "#fff" }}>{code}</code>
          <button onClick={() => handleCopy(code)} style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.5)", padding: "8px 14px", cursor: "pointer", fontSize: 12,
            fontWeight: 600, display: "flex", alignItems: "center", gap: 6
          }}>
            {copied ? <><Check size={14} /> Kopyalandı</> : <><Copy size={14} /> Kopyala</>}
          </button>
        </div>
      </div>

      {/* Link */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "16px 20px", marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
          Paylaşım Linki
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <code style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", wordBreak: "break-all", flex: 1 }}>{referralLink}</code>
          <button onClick={() => handleCopy(referralLink)} style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.4)", padding: "6px 10px", cursor: "pointer", fontSize: 11,
            display: "flex", alignItems: "center", gap: 4
          }}>
            <Copy size={12} />
          </button>
        </div>
      </div>

      {/* Nasıl Çalışır */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 32 }}>
        {[
          { step: "1", title: "Kodu Paylaşın", desc: "Referans kodunuzu veya linkinizi fotoğrafçı arkadaşlarınıza gönderin." },
          { step: "2", title: "Kayıt Olsunlar", desc: "Arkadaşınız kayıt olurken referans kodunu girsin." },
          { step: "3", title: "30 Gün Bonus", desc: "Davet ettiğiniz kişi ilk ödemesini yaptığında hesabınıza 30 gün eklenir." },
        ].map((s, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "20px 16px" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "rgba(255,255,255,0.06)", marginBottom: 8 }}>0{s.step}</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{s.title}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* İstatistik */}
      <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "16px 20px", flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 6 }}>Toplam Davet</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{tenant?.referralCount || 0}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "16px 20px", flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 6 }}>Kazanılan Süre</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{(tenant?.referralCount || 0) * 30} <span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>gün</span></div>
        </div>
      </div>

      {/* Davet Listesi */}
      {referrals.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 }}>
            <Gift size={14} /> Davet Ettikleriniz
          </div>
          {referrals.map((r, i) => (
            <div key={i} style={{ padding: "14px 20px", borderBottom: i < referrals.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{r.businessName}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{r.slug}.{domain}</div>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
                {new Date(r.createdAt).toLocaleDateString("tr-TR")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
