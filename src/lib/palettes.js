// Renk paletleri — tüm site ve admin panele uygulanır
export const PALETTES = {
  dark: {
    name: "Gece",
    desc: "Klasik siyah",
    bg: "#0a0a0a",
    text: "#ffffff",
    isDark: true,
    preview: ["#0a0a0a", "#161616", "#ffffff"],
  },
  slate: {
    name: "Antrasit",
    desc: "Koyu gri tonlar",
    bg: "#1a1d21",
    text: "#e8eaed",
    isDark: true,
    preview: ["#1a1d21", "#24282e", "#e8eaed"],
  },
  coffee: {
    name: "Kahve",
    desc: "Sıcak kahverengi",
    bg: "#16110d",
    text: "#f0e6d8",
    isDark: true,
    preview: ["#16110d", "#201a14", "#f0e6d8"],
  },
  ocean: {
    name: "Okyanus",
    desc: "Derin lacivert",
    bg: "#0c1525",
    text: "#dce4f0",
    isDark: true,
    preview: ["#0c1525", "#131f35", "#dce4f0"],
  },
  forest: {
    name: "Orman",
    desc: "Koyu yeşil",
    bg: "#0d1710",
    text: "#ddeee2",
    isDark: true,
    preview: ["#0d1710", "#142018", "#ddeee2"],
  },
  wine: {
    name: "Şarap",
    desc: "Bordo tonlar",
    bg: "#1a0d12",
    text: "#f0e0e5",
    isDark: true,
    preview: ["#1a0d12", "#25141a", "#f0e0e5"],
  },
  light: {
    name: "Aydınlık",
    desc: "Temiz beyaz",
    bg: "#f8f8f6",
    text: "#1a1a1a",
    isDark: false,
    preview: ["#f8f8f6", "#f0f0ee", "#1a1a1a"],
  },
  cream: {
    name: "Krem",
    desc: "Sıcak bej",
    bg: "#f5f0e6",
    text: "#2a2520",
    isDark: false,
    preview: ["#f5f0e6", "#ebe5da", "#2a2520"],
  },
};

export function getPalette(id) {
  return PALETTES[id] || PALETTES.dark;
}
