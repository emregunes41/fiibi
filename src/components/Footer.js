import { Instagram, Twitter, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

export default function Footer({ businessName = "Studio", phone = "", email = "", address = "", instagram = "", footerTagline = "" }) {
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
          <h4 className="text-white font-bold mb-6">Hızlı Bağlantılar</h4>
          <ul className="list-none flex flex-col gap-4">
            <li><Link href="/" className="text-white/50 hover:text-white text-sm no-underline transition-colors">Ana Sayfa</Link></li>
            <li><Link href="/#packages" className="text-white/50 hover:text-white text-sm no-underline transition-colors">Paketler</Link></li>
            <li><Link href="/#about" className="text-white/50 hover:text-white text-sm no-underline transition-colors">Hakkımızda</Link></li>
            <li><Link href="/#contact" className="text-white/50 hover:text-white text-sm no-underline transition-colors">İletişim</Link></li>
          </ul>
        </div>

        {/* Contact info */}
        <div>
          <h4 className="text-white font-bold mb-6">İletişim Bilgileri</h4>
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
          <h4 className="text-white font-bold mb-6">Bültene Katılın</h4>
          <p className="text-white/50 text-sm mb-4">Kampanyalardan ve yeni paketlerden haberdar olun.</p>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="E-posta adresiniz"
              className="bg-white/5 border border-white/10 rounded-none px-4 py-2 text-sm text-white w-full focus:outline-none focus:border-white/30"
            />
            <button className="bg-white text-black font-bold px-4 py-2 rounded-none text-sm hover:bg-white/90 transition-all">
              Katıl
            </button>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto border-t border-white/5 mt-16 pt-8 text-center text-white/30 text-xs">
                © {new Date().getFullYear()} {businessName}. Tüm hakları saklıdır.
      </div>
    </footer>
  );
}
