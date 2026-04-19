"use client";

const SECTOR_TEXTURES = {
  photographer: "/assets/textures/photographer.png",
  doctor: "/assets/textures/doctor.png",
  dentist: "/assets/textures/dentist.png",
  psychologist: "/assets/textures/psychologist.png",
  dietitian: "/assets/textures/dietitian.png",
  coach: "/assets/textures/coach.png",
  beauty: "/assets/textures/beauty.png",
  veterinarian: "/assets/textures/veterinarian.png",
  physiotherapist: "/assets/textures/physiotherapist.png",
  tutor: "/assets/textures/tutor.png",
  lawyer: "/assets/textures/lawyer.png",
  consultant: "/assets/textures/consultant.png",
  // Aliases
  fitness: "/assets/textures/coach.png",
  veterinary: "/assets/textures/veterinarian.png",
};

export default function HeroBackground({ bgType, bgUrl, bgColor, businessType, forceDarkMode }) {
  const DEFAULT_ASSETS = ["/assets/hero.mp4", "/assets/hero.jpg", ""];
  const hasCustomBg = bgUrl && bgUrl.length > 0 && !DEFAULT_ASSETS.includes(bgUrl);
  const sectorTexture = SECTOR_TEXTURES[businessType] || null;

  // Show sector texture as the MAIN background when no custom bg is set
  if (!hasCustomBg && sectorTexture) {
    return (
      <>
        <img 
          src={sectorTexture}
          alt=""
          className="global-video-bg"
          style={{ 
            objectFit: "cover",
          }}
        />
        <div className="global-video-overlay" style={{
          background: forceDarkMode
            ? "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.9) 100%)"
            : "linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.85) 100%)",
        }} />
      </>
    );
  }

  if (bgType === "color") {
    return (
      <>
        <div 
          className="global-video-bg" 
          style={{ background: bgColor || "#000000" }} 
        />
        <div className="global-video-overlay" />
      </>
    );
  }

  if (bgType === "image") {
    return (
      <>
        <img 
          src={bgUrl || "/assets/hero.jpg"} 
          alt="" 
          className="global-video-bg" 
          style={{ objectFit: "cover" }}
        />
        <div className="global-video-overlay" />
      </>
    );
  }

  // Default: video
  return (
    <>
      <video 
        autoPlay muted loop playsInline 
        className="global-video-bg"
        key={bgUrl}
      >
        <source src={bgUrl || "/assets/hero.mp4"} type="video/mp4" />
      </video>
      <div className="global-video-overlay" />
    </>
  );
}
