"use client";

import { Instagram, Twitter, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";

export default function Footer({ businessName = "Studio", phone = "", email = "", address = "", instagram = "", footerTagline = "" }) {
  const { t } = useLanguage();
  return (
    <footer className="relative z-10 bg-black/80 backdrop-blur-xl border-t border-white/10 py-16 px-6 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Brand */}
        <div className="col-span-1 md:col-span-1">
          <div className="font-black text-2xl tracking-tighter text-white mb-6">{businessName}.</div>
          <p className="text-white/50 text-sm leading-relaxed mb-8">
            {footerTagline || "Profesyonel hizmet anlayışıyla yanınızdayız."}
          </p>
          <div className="flex gap-4">
            {instagram && (
              <a href={instagram.startsWith("http") ? instagram : `https://instagram.com/${instagram}`} target="_blank" rel="noopener" className="p-2 rounded-none bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all">
                <Instagram size={20} />
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="p-2 rounded-none bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all">
                <Mail size={20} />
              </a>
            )}
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-white font-bold mb-6">{t.footer.quickLinks}</h4>
          <ul className="list-none flex flex-col gap-4">
            <li><Link href="/" className="text-white/50 hover:text-white text-sm no-underline transition-colors">{t.nav.home}</Link></li>
            <li><Link href="/#packages" className="text-white/50 hover:text-white text-sm no-underline transition-colors">{t.nav.packages}</Link></li>
            <li><Link href="/#about" className="text-white/50 hover:text-white text-sm no-underline transition-colors">{t.footer.about}</Link></li>
            <li><Link href="/#contact" className="text-white/50 hover:text-white text-sm no-underline transition-colors">{t.nav.contact}</Link></li>
          </ul>
        </div>

        {/* Contact info */}
        <div>
          <h4 className="text-white font-bold mb-6">{t.footer.contactInfo}</h4>
          <ul className="list-none flex flex-col gap-4">
            {address && (
              <li className="flex items-start gap-3 text-white/50 text-sm">
                <MapPin size={18} className="text-white shrink-0" />
                <span>{address}</span>
              </li>
            )}
            {phone && (
              <li className="flex items-center gap-3 text-white/50 text-sm">
                <Phone size={18} className="text-white shrink-0" />
                <span>{phone}</span>
              </li>
            )}
            {email && (
              <li className="flex items-center gap-3 text-white/50 text-sm">
                <Mail size={18} className="text-white shrink-0" />
                <span>{email}</span>
              </li>
            )}
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="text-white font-bold mb-6">{t.footer.newsletter}</h4>
          <p className="text-white/50 text-sm mb-4">{t.footer.newsletterDesc}</p>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder={t.footer.emailPlaceholder}
              className="bg-white/5 border border-white/10 rounded-none px-4 py-2 text-sm text-white w-full focus:outline-none focus:border-white/30"
            />
            <button className="bg-white text-black font-bold px-4 py-2 rounded-none text-sm hover:bg-white/90 transition-all">
              {t.footer.join}
            </button>
          </div>
        </div>

      </div>

      
      <div className="max-w-7xl mx-auto mt-16 flex flex-col items-center gap-4 opacity-50">
        <div className="text-[10px] font-bold text-white/50 tracking-[0.15em] uppercase">Güvenli Ödeme Altyapısı</div>
        <div className="flex items-center justify-center gap-6 flex-wrap opacity-80">
          <img src="/assets/iyzico_footer.svg" alt="iyzico Korumalı Alışveriş" className="h-6" />
          <a href="https://www.paytr.com" target="_blank" rel="noopener noreferrer" className="text-sm font-black text-white tracking-tighter opacity-60 hover:opacity-100 transition-opacity no-underline">PayTR</a>
        </div>
        <p className="text-[10px] text-white/30 text-center max-w-md leading-relaxed mt-1">
          Bu internet sitesindeki ödeme hizmetleri{" "}
          <a href="https://www.paytr.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white/60 underline transition-colors">PAYTR Ödeme ve Elektronik Para Kuruluşu A.Ş.</a>
          {" "}tarafından sağlanmaktadır.
        </p>
      </div>

      <div className="max-w-7xl mx-auto border-t border-white/5 mt-8 pt-8 text-center text-white/30 text-xs">
                © {new Date().getFullYear()} {businessName}. {t.footer.rights}
      </div>
    </footer>
  );
}
