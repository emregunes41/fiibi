"use client";

import { useState, useEffect } from "react";
import { Instagram, MapPin, Calendar, Link2, ShoppingBag, Youtube, MessageCircle, Image as ImageIcon, X, ExternalLink } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const iconMap = {
  instagram: <Instagram size={20} />,
  whatsapp: <MessageCircle size={20} />,
  youtube: <Youtube size={20} />,
  map: <MapPin size={20} />,
  calendar: <Calendar size={20} />,
  image: <ImageIcon size={20} />,
  "shopping-bag": <ShoppingBag size={20} />,
  link: <Link2 size={20} />,
};

export default function LinksClient({ bioLinks, businessName, logoUrl, bgType, bgUrl, bgColor, footerTagline }) {
  const [activeModal, setActiveModal] = useState(null); // { title, url }

  const getIcon = (name) => {
    return iconMap[name] || iconMap.link;
  };

  const handleLinkClick = (e, link) => {
    if (link.type !== "external") {
      e.preventDefault();
      
      let iframeUrl = "/";
      if (link.type === "packages") iframeUrl = "/?embed=packages#services"; 
      if (link.type === "booking") iframeUrl = "/booking?embed=true";
      if (link.type === "portfolio") iframeUrl = "/?embed=portfolio#portfolio";

      setActiveModal({
        title: link.title,
        url: iframeUrl,
      });
    }
  };

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [activeModal]);

  return (
    <>
      <main className="min-h-screen relative flex flex-col items-center justify-center p-6 overflow-hidden">
        {/* Background */}
        {bgType === "video" && bgUrl ? (
          <video src={bgUrl} autoPlay loop muted playsInline className="fixed inset-0 w-full h-full object-cover z-[-2]" />
        ) : bgType === "image" && bgUrl ? (
          <img src={bgUrl} alt="" className="fixed inset-0 w-full h-full object-cover z-[-2]" />
        ) : (
          <div style={{ background: bgColor }} className="fixed inset-0 w-full h-full z-[-2]" />
        )}
        
        {/* Overlay to ensure text readability */}
        <div className="fixed inset-0 w-full h-full bg-black/60 backdrop-blur-2xl z-[-1]" />

        <div className="w-full max-w-md mx-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700 z-10 py-12">
          {/* Profile Image / Logo */}
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 mb-6 bg-white/5 flex items-center justify-center shadow-xl">
            {logoUrl ? (
              <img src={logoUrl} alt={businessName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-white/50">{businessName.charAt(0)}</span>
            )}
          </div>

          {/* Title & Tagline */}
          <h1 className="text-2xl font-bold text-white mb-2 text-center">{businessName}</h1>
          {footerTagline && (
            <p className="text-white/60 text-sm mb-8 text-center px-4 leading-relaxed max-w-xs mx-auto">
              {footerTagline}
            </p>
          )}

          {/* Links List */}
          <div className="w-full flex flex-col gap-4">
            {bioLinks.map((link, idx) => (
              <a
                key={link.id}
                href={link.type === "external" ? link.url : "#"}
                onClick={(e) => handleLinkClick(e, link)}
                target={link.type === "external" && link.url && link.url.startsWith("http") ? "_blank" : "_self"}
                rel={link.type === "external" && link.url && link.url.startsWith("http") ? "noopener noreferrer" : ""}
                className="group relative w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-4 flex items-center justify-between transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-xl hover:-translate-y-1 overflow-hidden"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Highlight gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                
                <div className="flex items-center gap-4 relative z-10 w-full">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 group-hover:bg-white group-hover:text-black transition-colors flex-shrink-0">
                    {getIcon(link.icon)}
                  </div>
                  <span className="font-semibold text-white/90 text-[15px] pr-2 group-hover:text-white transition-colors">{link.title}</span>
                </div>
              </a>
            ))}

            {/* Hardcoded Homepage Link at the bottom if not already included */}
            {!bioLinks.some(l => l.url === "/") && (
              <Link
                href="/"
                className="mt-4 group w-full bg-transparent border border-white/10 hover:border-white/30 rounded-2xl p-4 flex items-center justify-center transition-all duration-300"
              >
                <span className="font-semibold text-white/50 text-sm group-hover:text-white/80 transition-colors">Web Sitemize Gidin →</span>
              </Link>
            )}
          </div>

          {/* Footer Branding */}
          <div className="mt-16 text-center opacity-40 hover:opacity-100 transition-opacity">
            <a href="https://fiibi.co" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest text-white/70 flex flex-col items-center gap-1 no-underline">
              <span>Powered By</span>
              <strong className="text-white text-xs font-black tracking-normal">fiibi</strong>
            </a>
          </div>
        </div>
      </main>

      {/* Bottom Sheet Modal */}
      <AnimatePresence>
        {activeModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 h-[85vh] bg-[#111] rounded-t-3xl z-[101] flex flex-col overflow-hidden border-t border-white/10 shadow-2xl max-w-2xl mx-auto"
            >
              {/* Handle Bar */}
              <div className="w-full flex justify-center pt-3 pb-2 cursor-pointer" onClick={() => setActiveModal(null)}>
                <div className="w-12 h-1.5 bg-white/20 rounded-full" />
              </div>
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 pb-4 border-b border-white/10">
                <h3 className="text-white font-bold text-lg">{activeModal.title}</h3>
                <div className="flex items-center gap-3">
                  <a href={activeModal.url} target="_blank" className="text-white/50 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                    <ExternalLink size={16} />
                  </a>
                  <button onClick={() => setActiveModal(null)} className="text-white/50 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Content (Iframe to prevent breaking current app context) */}
              <div className="flex-1 w-full bg-black relative">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-50" />
                </div>
                <iframe 
                  src={activeModal.url} 
                  className="w-full h-full border-none relative z-10 bg-transparent"
                  title={activeModal.title}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
