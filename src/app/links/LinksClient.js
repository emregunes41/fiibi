"use client";

import { useState, useEffect } from "react";
import { Instagram, MapPin, Calendar, Link2, ShoppingBag, Youtube, MessageCircle, Image as ImageIcon, X, ExternalLink, ChevronRight, Music } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const iconMap = {
  instagram: Instagram,
  whatsapp: MessageCircle,
  youtube: Youtube,
  tiktok: Music,
  map: MapPin,
  calendar: Calendar,
  image: ImageIcon,
  "shopping-bag": ShoppingBag,
  link: Link2,
};

const socialColorMap = {
  instagram: "from-[#f09433] via-[#e6683c] to-[#dc2743]",
  whatsapp: "from-[#25D366] to-[#128C7E]",
  youtube: "from-[#FF0000] to-[#CC0000]",
  tiktok: "from-[#00f2ea] to-[#ff0050]",
};

// Title-based gradient colors for the public page icon containers
const titleGradientMap = {
  "Instagram": "#f09433, #e6683c, #dc2743",
  "TikTok": "#00f2ea, #ff0050",
  "YouTube": "#FF0000, #CC0000",
  "Facebook": "#1877F2, #0D47A1",
  "Twitter / X": "#1DA1F2, #0d8ecf",
  "LinkedIn": "#0A66C2, #004182",
  "Pinterest": "#E60023, #BD081C",
  "Spotify": "#1DB954, #158a3e",
  "Threads": "#333, #000",
  "WhatsApp": "#25D366, #128C7E",
  "Telegram": "#26A5E4, #0088cc",
  "E-Posta": "#EA4335, #c5221f",
  "Telefon": "#4CAF50, #2E7D32",
  "Google Maps": "#4285F4, #34A853",
  "Google Yorum": "#FBBC05, #F9A825",
};

export default function LinksClient({ bioLinks, businessName, logoUrl, bgType, bgUrl, bgColor, footerTagline }) {
  const [activeModal, setActiveModal] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const getIcon = (name) => {
    const Icon = iconMap[name] || iconMap.link;
    return <Icon size={18} strokeWidth={2.2} />;
  };

  const handleLinkClick = (e, link) => {
    if (link.type !== "external") {
      e.preventDefault();
      let iframeUrl = "/";
      if (link.type === "packages") iframeUrl = "/?embed=packages#services";
      if (link.type === "booking") iframeUrl = "/booking?embed=true";
      if (link.type === "portfolio") iframeUrl = "/?embed=portfolio#portfolio";
      setActiveModal({ title: link.title, url: iframeUrl });
    }
  };

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
      <style jsx global>{`
        .links-page * { box-sizing: border-box; }
        .links-page { --accent: #fff; }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes pulse-ring { 0% { transform: scale(0.9); opacity: 0.6; } 50% { transform: scale(1.05); opacity: 0.2; } 100% { transform: scale(0.9); opacity: 0.6; } }
        @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .link-card { position: relative; overflow: hidden; }
        .link-card::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 55%, transparent 60%);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }
        .link-card:hover::before { transform: translateX(100%); }
        .link-card:active { transform: scale(0.98) !important; }
      `}</style>

      <main className="links-page" style={{
        minHeight: "100vh",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "0 20px",
        overflow: "hidden",
      }}>
        {/* Background Layer */}
        {bgType === "video" && bgUrl ? (
          <video src={bgUrl} autoPlay loop muted playsInline style={{
            position: "fixed", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", zIndex: -2,
          }} />
        ) : bgType === "image" && bgUrl ? (
          <img src={bgUrl} alt="" style={{
            position: "fixed", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", zIndex: -2,
          }} />
        ) : (
          <div style={{
            position: "fixed", inset: 0, zIndex: -2,
            background: `linear-gradient(160deg, ${bgColor || '#0a0a0a'} 0%, #0a0a0a 50%, ${bgColor || '#0a0a0a'} 100%)`,
          }} />
        )}

        {/* Dark Overlay + Blur */}
        <div style={{
          position: "fixed", inset: 0, zIndex: -1,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(40px) saturate(1.8)",
          WebkitBackdropFilter: "blur(40px) saturate(1.8)",
        }} />

        {/* Ambient Glow Orbs */}
        <div style={{
          position: "fixed", top: "-20%", left: "-10%", width: "50vw", height: "50vw",
          borderRadius: "50%", zIndex: -1,
          background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none",
          animation: "float 8s ease-in-out infinite",
        }} />
        <div style={{
          position: "fixed", bottom: "-20%", right: "-10%", width: "40vw", height: "40vw",
          borderRadius: "50%", zIndex: -1,
          background: "radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none",
          animation: "float 10s ease-in-out infinite 2s",
        }} />

        {/* Content Container */}
        <div style={{
          width: "100%", maxWidth: 440, margin: "0 auto",
          display: "flex", flexDirection: "column", alignItems: "center",
          paddingTop: "clamp(48px, 10vh, 80px)",
          paddingBottom: 60,
          position: "relative", zIndex: 10,
        }}>

          {/* Profile Avatar */}
          <div style={{
            position: "relative",
            marginBottom: 24,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0) scale(1)" : "translateY(20px) scale(0.9)",
            transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          }}>
            {/* Pulse Ring */}
            <div style={{
              position: "absolute", inset: -6,
              borderRadius: "50%",
              border: "1.5px solid rgba(255,255,255,0.08)",
              animation: "pulse-ring 3s ease-in-out infinite",
            }} />
            <div style={{
              width: 88, height: 88,
              borderRadius: "50%", overflow: "hidden",
              border: "2px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.05)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.05)",
            }}>
              {logoUrl ? (
                <img src={logoUrl} alt={businessName} style={{
                  width: "100%", height: "100%", objectFit: "cover",
                }} />
              ) : (
                <span style={{
                  fontSize: 32, fontWeight: 800,
                  background: "linear-gradient(135deg, #fff, rgba(255,255,255,0.5))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>{businessName?.charAt(0)}</span>
              )}
            </div>
          </div>

          {/* Business Name */}
          <h1 style={{
            fontSize: "clamp(22px, 5vw, 28px)",
            fontWeight: 800,
            color: "#fff",
            textAlign: "center",
            margin: "0 0 6px",
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(15px)",
            transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s",
          }}>{businessName}</h1>

          {/* Tagline */}
          {footerTagline && (
            <p style={{
              fontSize: 14, color: "rgba(255,255,255,0.45)",
              textAlign: "center", margin: "0 0 8px",
              maxWidth: 300, lineHeight: 1.5,
              fontWeight: 400,
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(10px)",
              transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
            }}>{footerTagline}</p>
          )}

          {/* Decorative Divider */}
          <div style={{
            width: 32, height: 2,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
            margin: "16px 0 32px",
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.6s ease 0.3s",
          }} />

          {/* Links */}
          <div style={{
            width: "100%",
            display: "flex", flexDirection: "column",
            gap: 12,
          }}>
            {bioLinks.map((link, idx) => {
              const IconComponent = iconMap[link.icon] || iconMap.link;
              const hasSocialGradient = socialColorMap[link.icon];
              const isInternal = link.type !== "external";

              return (
                <a
                  key={link.id}
                  href={link.type === "external" ? link.url : "#"}
                  onClick={(e) => handleLinkClick(e, link)}
                  target={link.type === "external" && link.url?.startsWith("http") ? "_blank" : "_self"}
                  rel={link.type === "external" && link.url?.startsWith("http") ? "noopener noreferrer" : ""}
                  className="link-card"
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "16px 20px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 16,
                    textDecoration: "none",
                    color: "#fff",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(20px)",
                    transitionDelay: `${0.3 + idx * 0.07}s`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Icon Container */}
                  {(() => {
                    const titleGrad = titleGradientMap[link.title];
                    const iconGrad = socialColorMap[link.icon];
                    const hasGradient = titleGrad || iconGrad;
                    const gradientColors = titleGrad || (
                      link.icon === "instagram" ? "#f09433, #e6683c, #dc2743" :
                      link.icon === "whatsapp" ? "#25D366, #128C7E" :
                      link.icon === "youtube" ? "#FF0000, #CC0000" :
                      link.icon === "tiktok" ? "#00f2ea, #ff0050" : null
                    );
                    return (
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        background: gradientColors
                          ? `linear-gradient(135deg, ${gradientColors})`
                          : isInternal
                            ? "rgba(139,92,246,0.12)"
                            : "rgba(255,255,255,0.06)",
                        border: gradientColors ? "none" : "1px solid rgba(255,255,255,0.06)",
                        color: gradientColors ? "#fff" : isInternal ? "#a78bfa" : "rgba(255,255,255,0.6)",
                      }}>
                        <IconComponent size={18} strokeWidth={2} />
                      </div>
                    );
                  })()}

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontSize: 15, fontWeight: 600,
                      display: "block",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{link.title}</span>
                    {isInternal && (
                      <span style={{
                        fontSize: 11, color: "rgba(255,255,255,0.3)",
                        fontWeight: 500, marginTop: 2, display: "block",
                      }}>Sayfamızda açılır</span>
                    )}
                  </div>

                  {/* Arrow */}
                  <ChevronRight size={16} style={{
                    color: "rgba(255,255,255,0.2)",
                    flexShrink: 0,
                    transition: "transform 0.2s, color 0.2s",
                  }} />
                </a>
              );
            })}

            {/* Homepage Link */}
            {!bioLinks.some(l => l.url === "/") && (
              <Link href="/" style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 8, padding: "14px 20px", marginTop: 8,
                background: "transparent",
                border: "1px dashed rgba(255,255,255,0.1)",
                borderRadius: 16,
                textDecoration: "none",
                color: "rgba(255,255,255,0.35)",
                fontSize: 13, fontWeight: 600,
                transition: "all 0.3s ease",
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(15px)",
                transitionDelay: `${0.3 + bioLinks.length * 0.07 + 0.1}s`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "rgba(255,255,255,0.35)";
                e.currentTarget.style.background = "transparent";
              }}>
                Web Sitemizi Ziyaret Edin →
              </Link>
            )}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: 48, textAlign: "center",
            opacity: mounted ? 0.3 : 0,
            transition: "opacity 0.6s ease 1s",
          }}>
            <a href="https://fiibi.co" target="_blank" rel="noopener noreferrer" style={{
              textDecoration: "none",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            }}
            onMouseEnter={(e) => e.currentTarget.parentElement.style.opacity = "0.7"}
            onMouseLeave={(e) => e.currentTarget.parentElement.style.opacity = "0.3"}>
              <span style={{
                fontSize: 9, textTransform: "uppercase",
                letterSpacing: "0.25em", color: "rgba(255,255,255,0.5)",
                fontWeight: 500,
              }}>Powered by</span>
              <strong style={{
                fontSize: 13, color: "#fff",
                fontWeight: 900, letterSpacing: "-0.02em",
              }}>fiibi</strong>
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
              transition={{ duration: 0.2 }}
              onClick={() => setActiveModal(null)}
              style={{
                position: "fixed", inset: 0,
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                zIndex: 100,
              }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0,
                height: "88vh",
                background: "#0f0f0f",
                borderTopLeftRadius: 20, borderTopRightRadius: 20,
                zIndex: 101,
                display: "flex", flexDirection: "column",
                overflow: "hidden",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 -20px 60px rgba(0,0,0,0.5)",
                maxWidth: 640, margin: "0 auto",
              }}
            >
              {/* Handle */}
              <div style={{
                width: "100%", display: "flex", justifyContent: "center",
                padding: "10px 0 6px", cursor: "pointer",
              }} onClick={() => setActiveModal(null)}>
                <div style={{
                  width: 36, height: 4,
                  background: "rgba(255,255,255,0.15)", borderRadius: 2,
                }} />
              </div>

              {/* Header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 20px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                <h3 style={{
                  margin: 0, fontSize: 16, fontWeight: 700, color: "#fff",
                }}>{activeModal.title}</h3>
                <div style={{ display: "flex", gap: 8 }}>
                  <a href={activeModal.url} target="_blank" style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 32, height: 32, borderRadius: 8,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.4)",
                    textDecoration: "none", transition: "all 0.2s",
                  }}>
                    <ExternalLink size={14} />
                  </a>
                  <button onClick={() => setActiveModal(null)} style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 32, height: 32, borderRadius: 8,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.4)",
                    cursor: "pointer", transition: "all 0.2s",
                  }}>
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Iframe */}
              <div style={{ flex: 1, width: "100%", position: "relative", background: "#000" }}>
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  pointerEvents: "none",
                }}>
                  <div style={{
                    width: 20, height: 20,
                    border: "2px solid rgba(255,255,255,0.1)",
                    borderTopColor: "rgba(255,255,255,0.4)",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }} />
                </div>
                <iframe
                  src={activeModal.url}
                  title={activeModal.title}
                  style={{
                    width: "100%", height: "100%", border: "none",
                    position: "relative", zIndex: 10, background: "transparent",
                  }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
