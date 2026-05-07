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
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <svg width="32" height="10" viewBox="0 0 40 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.22 0.280029L9.93 12.63H6.5L3.92 2.87003C3.76 2.27003 3.65 2.06003 3.2 1.80003C2.42 1.34003 1.15 0.950029 0 0.700029L0.08 0.280029H5.63C6.33 0.280029 6.96 0.760029 7.12 1.57003L8.52 8.76003L11.75 0.280029H15.22ZM28.53 8.52003C28.53 5.34003 24.18 5.16003 24.2 3.73003C24.21 3.30003 24.62 2.83003 25.5 2.69003C25.94 2.62003 27.23 2.56003 28.56 3.18003L29.09 0.690029C28.37 0.430029 27.42 0.210029 26.29 0.210029C23.12 0.210029 20.93 1.89003 20.91 4.33003C20.89 6.13003 22.54 7.14003 23.77 7.74003C25.04 8.35003 25.46 8.74003 25.46 9.28003C25.44 10.1 24.46 10.46 23.57 10.48C22.07 10.5 20.93 10.08 20.08 9.68003L19.53 12.23C20.25 12.57 21.56 12.86 22.95 12.88C26.33 12.88 28.53 11.22 28.53 8.52003ZM36.96 12.63H39.88L37.96 0.280029H35.15C34.54 0.280029 34.02 0.650029 33.78 1.20003L28.84 12.63H32.22L32.89 10.74H37.04L36.96 12.63ZM33.82 8.21003L35.48 3.59003L36.46 8.21003H33.82ZM19.82 0.280029H17.06L13.56 12.63H16.81L19.82 0.280029Z" fill="#fff"/></svg>
          <svg width="18" height="10" viewBox="0 0 22 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.05001 0.490005C4.24001 0.490005 1.76001 2.05001 0.5 4.38001C1.65 6.43001 1.65 8.95001 0.5 11.01C1.75 13.34 4.24001 14.9 7.05001 14.9C10.74 14.9 13.84 12.16 14.28 8.62001C13.88 4.70001 10.74 1.62001 7.05001 0.490005Z" fill="#fff"/><path d="M14.95 0.490005C11.26 1.62001 8.11999 4.70001 7.71999 8.62001C8.15999 12.16 11.26 14.9 14.95 14.9C17.76 14.9 20.24 13.34 21.5 11.01C20.35 8.96001 20.35 6.44001 21.5 4.38001C20.24 2.05001 17.76 0.490005 14.95 0.490005Z" fill="#fff"/></svg>
          <span className="text-sm font-black text-white tracking-tighter">PayTR</span>
          <span className="text-sm font-bold text-white tracking-tighter">iyzico</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-white/5 mt-8 pt-8 text-center text-white/30 text-xs">
                © {new Date().getFullYear()} {businessName}. {t.footer.rights}
      </div>
    </footer>
  );
}
