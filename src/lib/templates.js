/**
 * Site Şablonları — Her şablon sayfanın tüm yapısını, hissini ve düzenini değiştirir.
 * Renk paletinden bağımsız çalışır (her şablon her renk paketiyle kullanılabilir).
 */

export const TEMPLATES = {
  // ── 1. KLASİK — Mevcut varsayılan (mevcut tenant'lar bunu kullanıyor) ──
  classic: {
    id: "classic",
    name: "Klasik",
    desc: "Minimal, keskin hatlar, tam ekran hero",
    emoji: "◼",
    radius: 0,
    heroStyle: "fullscreen",
    cardStyle: "flat",
    sectionSpacing: 80,
    fontWeight: { heading: 800, body: 400 },
    heroTitleSize: "clamp(2.8rem, 8vw, 6rem)",
    heroSubSize: "0.7rem",
    cardPadding: 28,
    navStyle: "transparent",
    footerStyle: "grid",
    buttonStyle: "solid",
    showDividerLine: true,
    sectionBorder: true,
    fontFamily: "geist",
    googleFont: null,
    // Mini mockup preview renkleri
    preview: {
      bg: "#0a0a0a",
      card: "#161616",
      accent: "#ffffff",
      text: "#ffffff",
      radius: 0,
    },
  },

  // ── 2. SİNEMATİK — Dramatik ve görsel ağırlıklı ──
  cinematic: {
    id: "cinematic",
    name: "Sinematik",
    desc: "Dramatik tipografi, büyük görsel alanlar",
    emoji: "🎬",
    radius: 0,
    heroStyle: "cinematic",
    cardStyle: "glass",
    sectionSpacing: 120,
    fontWeight: { heading: 900, body: 400 },
    heroTitleSize: "clamp(3.5rem, 10vw, 8rem)",
    heroSubSize: "0.85rem",
    cardPadding: 32,
    navStyle: "transparent",
    footerStyle: "minimal",
    buttonStyle: "outline",
    showDividerLine: true,
    sectionBorder: false,
    fontFamily: "montserrat",
    googleFont: "Montserrat:wght@300;400;500;600;700;800;900",
    preview: {
      bg: "#0d0d0d",
      card: "rgba(0,0,0,0.04)",
      accent: "#e2e2e2",
      text: "#ffffff",
      radius: 0,
    },
  },

  // ── 3. MODERN — Yuvarlak köşeler, ferah ──
  modern: {
    id: "modern",
    name: "Modern",
    desc: "Yumuşak köşeler, geniş boşluklar, ferah",
    emoji: "✨",
    radius: 16,
    heroStyle: "centered",
    cardStyle: "elevated",
    sectionSpacing: 100,
    fontWeight: { heading: 700, body: 400 },
    heroTitleSize: "clamp(2.2rem, 6vw, 4.5rem)",
    heroSubSize: "0.9rem",
    cardPadding: 24,
    navStyle: "solid",
    footerStyle: "centered",
    buttonStyle: "rounded",
    showDividerLine: false,
    sectionBorder: false,
    fontFamily: "inter",
    googleFont: "Inter:wght@300;400;500;600;700;800;900",
    preview: {
      bg: "#fafafa",
      card: "#ffffff",
      accent: "#6366f1",
      text: "#1a1a1a",
      radius: 16,
    },
  },

  // ── 4. BUTIK — Lüks, zarif, altın detaylar ──
  boutique: {
    id: "boutique",
    name: "Butik",
    desc: "Lüks his, serif tipografi, zarif çizgiler",
    emoji: "💎",
    radius: 2,
    heroStyle: "editorial",
    cardStyle: "bordered",
    sectionSpacing: 100,
    fontWeight: { heading: 600, body: 300 },
    heroTitleSize: "clamp(2.5rem, 7vw, 5.5rem)",
    heroSubSize: "0.75rem",
    cardPadding: 32,
    navStyle: "transparent",
    footerStyle: "elegant",
    buttonStyle: "outline",
    showDividerLine: true,
    sectionBorder: true,
    fontFamily: "playfair",
    googleFont: "Playfair+Display:wght@400;500;600;700;800;900",
    preview: {
      bg: "#f8f5f0",
      card: "#ffffff",
      accent: "#8b7355",
      text: "#2c2420",
      radius: 2,
    },
  },

  // ── 5. ENERJİK — Eğlenceli, renkli, dinamik ──
  energetic: {
    id: "energetic",
    name: "Enerjik",
    desc: "Eğlenceli, yuvarlak, dinamik animasyonlar",
    emoji: "🔥",
    radius: 24,
    heroStyle: "playful",
    cardStyle: "colorful",
    sectionSpacing: 60,
    fontWeight: { heading: 800, body: 500 },
    heroTitleSize: "clamp(2rem, 6vw, 4rem)",
    heroSubSize: "1rem",
    cardPadding: 20,
    navStyle: "solid",
    footerStyle: "fun",
    buttonStyle: "pill",
    showDividerLine: false,
    sectionBorder: false,
    fontFamily: "poppins",
    googleFont: "Poppins:wght@300;400;500;600;700;800;900",
    preview: {
      bg: "#ffffff",
      card: "#f0f4ff",
      accent: "#f97316",
      text: "#1a1a1a",
      radius: 24,
    },
  },

  // ── 6. MAGAZIN — Editöryal, asimetrik ──
  magazine: {
    id: "magazine",
    name: "Magazin",
    desc: "Editöryal düzen, gazete hissi, yazı odaklı",
    emoji: "📰",
    radius: 4,
    heroStyle: "magazine",
    cardStyle: "editorial",
    sectionSpacing: 60,
    fontWeight: { heading: 900, body: 400 },
    heroTitleSize: "clamp(2.8rem, 8vw, 6rem)",
    heroSubSize: "0.8rem",
    cardPadding: 24,
    navStyle: "transparent",
    footerStyle: "newspaper",
    buttonStyle: "text",
    showDividerLine: true,
    sectionBorder: true,
    fontFamily: "cormorant",
    googleFont: "Cormorant+Garamond:wght@300;400;500;600;700",
    preview: {
      bg: "#f5f1eb",
      card: "#ffffff",
      accent: "#1a1a1a",
      text: "#1a1a1a",
      radius: 4,
    },
  },
};

export function getTemplate(id) {
  return TEMPLATES[id] || TEMPLATES.classic;
}

export function getTemplateList() {
  return Object.values(TEMPLATES);
}
