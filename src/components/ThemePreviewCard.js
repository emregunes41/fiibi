"use client";

/**
 * ThemePreviewCard — Her tema için gerçekçi mini site önizlemesi
 * Navbar, hero, kartlar ve buton gerçek metin içerir
 */
export default function ThemePreviewCard({ template, selected, onClick, businessName = "Studio" }) {
  const t = template;
  const p = t.preview;

  const fonts = {
    geist: "system-ui, -apple-system, sans-serif",
    inter: "'Inter', system-ui, sans-serif",
    montserrat: "'Montserrat', system-ui, sans-serif",
    playfair: "'Playfair Display', Georgia, serif",
    poppins: "'Poppins', system-ui, sans-serif",
    cormorant: "'Cormorant Garamond', Georgia, serif",
  };
  const font = fonts[t.fontFamily] || fonts.geist;

  const btnRadius = t.buttonStyle === "pill" ? 99 : (t.buttonStyle === "rounded" ? 8 : t.radius);
  const isOutline = t.buttonStyle === "outline";
  const isDark = p.bg.startsWith("#0") || p.bg.startsWith("#1") || p.bg === "#0d0d0d";
  const mutedText = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  return (
    <button onClick={onClick} className="theme-preview-card" style={{
      padding: 0, cursor: "pointer", textAlign: "left", overflow: "hidden",
      transition: "all 0.2s", width: "100%",
      border: selected ? "2px solid #f97316" : "1px solid rgba(255,255,255,0.1)",
      background: "transparent", position: "relative",
    }}>
      {/* Gerçekçi Mini Site */}
      <div style={{
        fontFamily: font,
        background: p.bg,
        color: p.text,
        padding: 0,
        overflow: "hidden",
        fontSize: 10,
        lineHeight: 1.4,
        minHeight: 180,
      }}>
        {/* ── Navbar ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 12px",
          background: t.navStyle === "solid" ? (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)") : "transparent",
          borderBottom: t.navStyle === "solid" ? `1px solid ${borderColor}` : "none",
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "-0.02em", color: p.accent }}>
            {businessName}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 6, color: mutedText, fontWeight: 500 }}>Hizmetler</span>
            <span style={{ fontSize: 6, color: mutedText, fontWeight: 500 }}>Hakkımda</span>
            <span style={{ fontSize: 6, color: mutedText, fontWeight: 500 }}>İletişim</span>
          </div>
        </div>

        {/* ── Hero ── */}
        <div style={{
          padding: t.heroStyle === "cinematic" ? "28px 12px 20px" : "18px 12px 14px",
          textAlign: t.heroStyle === "editorial" ? "left" : "center",
          borderBottom: t.showDividerLine ? `1px solid ${borderColor}` : "none",
        }}>
          <div style={{
            fontSize: t.heroStyle === "cinematic" ? 18 : (t.heroStyle === "playful" ? 13 : 15),
            fontWeight: t.fontWeight.heading,
            letterSpacing: "-0.03em",
            color: p.text,
            marginBottom: 4,
            lineHeight: 1.1,
          }}>
            {t.heroStyle === "playful" ? "✨ " : ""}Profesyonel Hizmetler
          </div>
          <div style={{
            fontSize: 7,
            color: mutedText,
            fontWeight: t.fontWeight.body,
            maxWidth: t.heroStyle === "editorial" ? "70%" : "100%",
            marginBottom: 8,
          }}>
            Online randevu alın, hizmetlerimizi keşfedin
          </div>
          <div style={{
            display: "inline-block",
            padding: "3px 10px",
            fontSize: 6,
            fontWeight: 700,
            borderRadius: btnRadius,
            background: isOutline ? "transparent" : p.accent,
            color: isOutline ? p.accent : (isDark ? p.bg : "#fff"),
            border: isOutline ? `1px solid ${p.accent}` : "none",
          }}>
            Randevu Al
          </div>
        </div>

        {/* ── Kartlar ── */}
        <div style={{
          padding: "10px 12px 12px",
        }}>
          <div style={{
            fontSize: 7, fontWeight: 700, color: mutedText,
            textTransform: "uppercase", letterSpacing: "0.06em",
            marginBottom: 8,
            textAlign: t.heroStyle === "editorial" ? "left" : "center",
          }}>
            Hizmetler
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["Danışmanlık", "Paket"].map((name, i) => (
              <div key={i} style={{
                flex: 1,
                padding: "8px 8px 6px",
                borderRadius: t.radius,
                background: t.cardStyle === "glass"
                  ? (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)")
                  : (t.cardStyle === "colorful"
                    ? (isDark ? "rgba(255,255,255,0.06)" : (i === 0 ? "#f0f4ff" : "#fef3e7"))
                    : p.card),
                border: t.cardStyle === "bordered" ? `1px solid ${borderColor}` : (t.cardStyle === "flat" ? `1px solid ${borderColor}` : "none"),
                boxShadow: t.cardStyle === "elevated" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
              }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: p.text, marginBottom: 2 }}>
                  {name}
                </div>
                <div style={{ fontSize: 6, color: mutedText, marginBottom: 4, lineHeight: 1.3 }}>
                  {i === 0 ? "60 dk · ₺500" : "3 seans · ₺1.200"}
                </div>
                <div style={{
                  fontSize: 5, fontWeight: 700,
                  padding: "2px 6px", display: "inline-block",
                  borderRadius: btnRadius,
                  background: isOutline ? "transparent" : p.accent,
                  color: isOutline ? p.accent : (isDark ? p.bg : "#fff"),
                  border: isOutline ? `1px solid ${p.accent}50` : "none",
                  opacity: 0.85,
                }}>
                  İncele
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="theme-preview-label" style={{
        padding: "10px 14px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: selected ? "rgba(255,255,255,0.04)" : "transparent",
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
          {t.emoji} {t.name} {selected && "✓"}
        </div>
        <div style={{ fontSize: 10, opacity: 0.5, lineHeight: 1.4 }}>{t.desc}</div>
      </div>
    </button>
  );
}
