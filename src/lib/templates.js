/**
 * Site Şablonları — Her şablon sayfanın tüm yapısını, hissini ve düzenini değiştirir.
 * Renk paletinden bağımsız çalışır (her şablon her renk paketiyle kullanılabilir).
 */

export const TEMPLATES = {
  // ── 1. KLASİK — Mevcut varsayılan ──
  classic: {
    id: "classic",
    name: "Klasik",
    desc: "Minimal, keskin hatlar, tam ekran hero",
    emoji: "◼",
    radius: 0,
    heroStyle: "fullscreen",     // Tam ekran hero, ortada büyük başlık
    cardStyle: "flat",           // Düz kartlar, border ile ayrım
    sectionSpacing: 80,          // px
    fontWeight: { heading: 800, body: 400 },
    heroTitleSize: "clamp(2.8rem, 8vw, 6rem)",
    heroSubSize: "0.7rem",
    cardPadding: 28,
    navStyle: "transparent",     // Saydam navbar
    footerStyle: "grid",         // İki sütunlu grid footer
    buttonStyle: "solid",        // Dolgu butonlar
    showDividerLine: true,       // Hero altındaki ince çizgi
    sectionBorder: true,         // Bölümler arasında çizgi
  },

  // ── 2. SİNEMATİK — Dramatik ve görsel ağırlıklı ──
  cinematic: {
    id: "cinematic",
    name: "Sinematik",
    desc: "Dramatik tipografi, büyük görsel alanlar",
    emoji: "🎬",
    radius: 0,
    heroStyle: "cinematic",      // Dev başlık, alt yazı, gradient fade
    cardStyle: "glass",          // Cam efektli kartlar
    sectionSpacing: 120,
    fontWeight: { heading: 900, body: 400 },
    heroTitleSize: "clamp(3.5rem, 10vw, 8rem)",
    heroSubSize: "0.85rem",
    cardPadding: 32,
    navStyle: "transparent",
    footerStyle: "minimal",      // Tek satır, minimal footer
    buttonStyle: "outline",      // Kenarlıklı butonlar
    showDividerLine: true,
    sectionBorder: false,
  },

  // ── 3. MODERN — Yuvarlak köşeler, ferah ──
  modern: {
    id: "modern",
    name: "Modern",
    desc: "Yumuşak köşeler, geniş boşluklar, ferah",
    emoji: "✨",
    radius: 16,
    heroStyle: "centered",       // Ortalanmış, daha küçük hero
    cardStyle: "elevated",       // Gölgeli, yükseltilmiş kartlar
    sectionSpacing: 100,
    fontWeight: { heading: 700, body: 400 },
    heroTitleSize: "clamp(2.2rem, 6vw, 4.5rem)",
    heroSubSize: "0.9rem",
    cardPadding: 24,
    navStyle: "solid",           // Katı renkli navbar
    footerStyle: "centered",     // Ortalanmış footer
    buttonStyle: "rounded",      // Yuvarlak butonlar
    showDividerLine: false,
    sectionBorder: false,
  },

  // ── 4. BUTIK — Lüks, zarif, altın detaylar ──
  boutique: {
    id: "boutique",
    name: "Butik",
    desc: "Lüks his, serif tipografi, zarif çizgiler",
    emoji: "💎",
    radius: 2,
    heroStyle: "editorial",      // Asimetrik hero, büyük başlık solda
    cardStyle: "bordered",       // İnce kenarlıklı kartlar
    sectionSpacing: 100,
    fontWeight: { heading: 600, body: 300 },
    heroTitleSize: "clamp(2.5rem, 7vw, 5.5rem)",
    heroSubSize: "0.75rem",
    cardPadding: 32,
    navStyle: "transparent",
    footerStyle: "elegant",      // Zarif footer, ince çizgiler
    buttonStyle: "outline",
    showDividerLine: true,
    sectionBorder: true,
  },

  // ── 5. ENERJİK — Eğlenceli, renkli, dinamik ──
  energetic: {
    id: "energetic",
    name: "Enerjik",
    desc: "Eğlenceli, yuvarlak, dinamik animasyonlar",
    emoji: "🎉",
    radius: 24,
    heroStyle: "playful",        // Büyük emoji, eğlenceli metin
    cardStyle: "colorful",       // Renkli arka planlı kartlar
    sectionSpacing: 60,
    fontWeight: { heading: 800, body: 500 },
    heroTitleSize: "clamp(2rem, 6vw, 4rem)",
    heroSubSize: "1rem",
    cardPadding: 20,
    navStyle: "solid",
    footerStyle: "fun",          // Eğlenceli footer
    buttonStyle: "pill",         // Hap şeklinde butonlar
    showDividerLine: false,
    sectionBorder: false,
  },

  // ── 6. MAGAZIN — Editöryal, asimetrik ──
  magazine: {
    id: "magazine",
    name: "Magazin",
    desc: "Editöryal düzen, gazete hissi, yazı odaklı",
    emoji: "📰",
    radius: 4,
    heroStyle: "magazine",       // Büyük başlık, alt satırda detaylar
    cardStyle: "editorial",      // Editöryal kart düzeni
    sectionSpacing: 60,
    fontWeight: { heading: 900, body: 400 },
    heroTitleSize: "clamp(2.8rem, 8vw, 6rem)",
    heroSubSize: "0.8rem",
    cardPadding: 24,
    navStyle: "transparent",
    footerStyle: "newspaper",    // Gazete stili footer
    buttonStyle: "text",         // Metin butonları
    showDividerLine: true,
    sectionBorder: true,
  },
};

export function getTemplate(id) {
  return TEMPLATES[id] || TEMPLATES.classic;
}

export function getTemplateList() {
  return Object.values(TEMPLATES);
}
