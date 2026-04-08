"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AUTO_SLIDE_INTERVAL = 5000; // 5 saniye

export default function BannerCarousel({ banners }) {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const intervalRef = useRef(null);
  const total = banners.length;

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % total);
    setProgress(0);
  }, [total]);

  const goPrev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + total) % total);
    setProgress(0);
  }, [total]);

  // Auto-advance with progress bar
  useEffect(() => {
    if (isPaused || total <= 1) return;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / AUTO_SLIDE_INTERVAL) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        goNext();
        return;
      }
      intervalRef.current = requestAnimationFrame(tick);
    };
    intervalRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(intervalRef.current);
  }, [current, isPaused, goNext, total]);

  // Touch swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
    setIsPaused(true);
  };
  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 50) {
      if (diff < 0) goNext();
      else goPrev();
    }
    setTouchStart(null);
    setIsPaused(false);
  };

  if (!banners || banners.length === 0) return null;

  const banner = banners[current];

  const content = (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "21 / 9",
        maxHeight: "420px",
        borderRadius: "1rem",
        overflow: "hidden",
        cursor: banner.link ? "pointer" : "default",
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Media — Image or Video */}
      {banner.mediaType === "video" ? (
        <video
          key={banner.id}
          src={banner.imageUrl}
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <Image
          src={banner.imageUrl}
          alt={banner.title || "Banner"}
          fill
          style={{ objectFit: "cover", transition: "opacity 0.5s ease" }}
          sizes="100vw"
          priority={current === 0}
        />
      )}

      {/* Gradient overlay for text */}
      {(banner.title || banner.subtitle) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 40%, transparent 70%)",
          }}
        />
      )}

      {/* Text content */}
      {(banner.title || banner.subtitle) && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "clamp(16px, 4vw, 40px)",
            zIndex: 2,
          }}
        >
          {banner.title && (
            <h2
              style={{
                fontSize: "clamp(1rem, 3vw, 1.8rem)",
                fontWeight: 800,
                color: "#fff",
                margin: "0 0 4px",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              {banner.title}
            </h2>
          )}
          {banner.subtitle && (
            <p
              style={{
                fontSize: "clamp(0.7rem, 1.5vw, 0.9rem)",
                color: "rgba(255,255,255,0.7)",
                margin: 0,
                fontWeight: 500,
              }}
            >
              {banner.subtitle}
            </p>
          )}
        </div>
      )}

      {/* Nav arrows — only on desktop, multiple banners */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goPrev();
            }}
            style={{
              position: "absolute",
              left: "clamp(8px, 2vw, 16px)",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "50%",
              width: "clamp(28px, 4vw, 40px)",
              height: "clamp(28px, 4vw, 40px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              transition: "all 0.2s",
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goNext();
            }}
            style={{
              position: "absolute",
              right: "clamp(8px, 2vw, 16px)",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "50%",
              width: "clamp(28px, 4vw, 40px)",
              height: "clamp(28px, 4vw, 40px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              transition: "all 0.2s",
            }}
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Progress dots + bars */}
      {total > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: banner.title || banner.subtitle ? "auto" : "12px",
            top: banner.title || banner.subtitle ? "12px" : "auto",
            left: 0,
            right: 0,
            display: "flex",
            gap: "4px",
            justifyContent: "center",
            padding: "0 clamp(12px, 3vw, 24px)",
            zIndex: 10,
          }}
        >
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrent(i);
                setProgress(0);
              }}
              style={{
                flex: 1,
                maxWidth: "60px",
                height: "3px",
                borderRadius: "2px",
                border: "none",
                padding: 0,
                cursor: "pointer",
                background: "rgba(255,255,255,0.2)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: "100%",
                  borderRadius: "2px",
                  background: "#fff",
                  width:
                    i < current
                      ? "100%"
                      : i === current
                      ? `${progress}%`
                      : "0%",
                  transition:
                    i === current ? "none" : "width 0.3s ease",
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Wrap in Link if banner has a link
  if (banner.link) {
    return (
      <Link href={banner.link} style={{ display: "block", textDecoration: "none" }}>
        {content}
      </Link>
    );
  }

  return content;
}
