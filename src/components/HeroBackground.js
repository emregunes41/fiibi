"use client";

export default function HeroBackground({ bgType, bgUrl, bgColor }) {
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
