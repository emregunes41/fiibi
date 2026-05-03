export const dictionaries = {
  tr: {
    nav: {
      home: "Ana Sayfa",
      packages: "Paketler",
      gallery: "Galeri",
      events: "Etkinlikler",
      shop: "Mağaza",
      contact: "İletişim",
      clientLogin: "Müşteri Girişi",
      bookNow: "Rezervasyon Yap"
    },
    hero: {
      bookNow: "Hemen Rezervasyon Yap",
      contactUs: "Bize Ulaşın",
      whatsapp: "WhatsApp'tan Yazın",
      explore: "Keşfet"
    },
    packages: {
      title: "Hizmet Paketleri",
      selectPackage: "Seç",
      fromPrice: "Başlayan Fiyatlarla"
    },
    gallery: {
      title: "Portfolyo",
      viewAll: "Tümünü Gör"
    },
    booking: {
      step1: "Hizmet Seçimi",
      step2: "Tarih ve Saat",
      step3: "İletişim Bilgileri",
      step4: "Özet ve Onay",
      next: "İleri",
      back: "Geri",
      confirm: "Onayla ve Bitir"
    },
    footer: {
      address: "Adres",
      phone: "Telefon",
      email: "E-Posta",
      followUs: "Bizi Takip Edin",
      rights: "Tüm Hakları Saklıdır"
    }
  },
  en: {
    nav: {
      home: "Home",
      packages: "Packages",
      gallery: "Gallery",
      events: "Events",
      shop: "Shop",
      contact: "Contact",
      clientLogin: "Client Login",
      bookNow: "Book Now"
    },
    hero: {
      bookNow: "Book Now",
      contactUs: "Contact Us",
      whatsapp: "WhatsApp Us",
      explore: "Explore"
    },
    packages: {
      title: "Service Packages",
      selectPackage: "Select",
      fromPrice: "Starting from"
    },
    gallery: {
      title: "Portfolio",
      viewAll: "View All"
    },
    booking: {
      step1: "Select Service",
      step2: "Date & Time",
      step3: "Contact Info",
      step4: "Review & Confirm",
      next: "Next",
      back: "Back",
      confirm: "Confirm Booking"
    },
    footer: {
      address: "Address",
      phone: "Phone",
      email: "Email",
      followUs: "Follow Us",
      rights: "All Rights Reserved"
    }
  }
};

export function getDictionary(locale) {
  return dictionaries[locale] || dictionaries["tr"];
}
