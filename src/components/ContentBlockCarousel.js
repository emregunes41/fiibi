"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { optimizeCloudinaryUrl } from "@/lib/image-utils";

export default function ContentBlockCarousel({ images }) {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const intervalRef = useRef(null);
  const total = images.length;
  const AUTO_DURATION = 4000;

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % total);
    setProgress(0);
  }, [total]);

  const goPrev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + total) % total);
    setProgress(0);
  }, [total]);

  // Auto-advance
  useEffect(() => {
    if (isPaused || total <= 1) return;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / AUTO_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) { goNext(); return; }
      intervalRef.current = requestAnimationFrame(tick);
    };
    intervalRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(intervalRef.current);
  }, [current, isPaused, goNext, total]);

  // Touch swipe
  const handleTouchStart = (e) => { setTouchStart(e.touches[0].clientX); setIsPaused(true); };
  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 50) { if (diff < 0) goNext(); else goPrev(); }
    setTouchStart(null);
    setIsPaused(false);
  };

  if (total === 0) return null;

  // Single image — no carousel
  if (total === 1) {
    return (
      <img
        src={optimizeCloudinaryUrl(images[0], { width: 800 })}
        alt=""
        style={{ width: "100%", height: "auto", maxHeight: 420, objectFit: "contain", display: "block" }}
      />
    );
  }

  return (
    <div
      style={{ position: "relative", width: "100%", overflow: "hidden" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Image */}
      <div style={{ position: "relative", width: "100%", maxHeight: 420, overflow: "hidden", display: "flex", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
        <img
          key={current}
          src={optimizeCloudinaryUrl(images[current], { width: 900 })}
          alt=""
          style={{
            maxWidth: "100%", maxHeight: 420, objectFit: "contain", display: "block",
            animation: "fadeIn 0.4s ease",
          }}
        />
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: 3, justifyContent: "center", padding: "10px 0" }}>
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrent(i); setProgress(0); }}
            style={{
              width: i === current ? 20 : 6, height: 6,
              borderRadius: 0, border: "none", padding: 0,
              background: i === current ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.15)",
              cursor: "pointer", transition: "all 0.3s",
              overflow: "hidden", position: "relative",
            }}
          >
            {i === current && (
              <div style={{
                position: "absolute", top: 0, left: 0, height: "100%",
                background: "#fff", width: `${progress}%`,
                transition: "none",
              }} />
            )}
          </button>
        ))}
      </div>

      {/* Arrows */}
      {total > 1 && (
        <>
          <button onClick={goPrev} style={{
            position: "absolute", left: 8, top: "45%", transform: "translateY(-50%)",
            background: "rgba(0,0,0,0.5)", border: "none", borderRadius: 0,
            width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.7)",
          }}>
            <ChevronLeft size={14} />
          </button>
          <button onClick={goNext} style={{
            position: "absolute", right: 8, top: "45%", transform: "translateY(-50%)",
            background: "rgba(0,0,0,0.5)", border: "none", borderRadius: 0,
            width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.7)",
          }}>
            <ChevronRight size={14} />
          </button>
        </>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
}
