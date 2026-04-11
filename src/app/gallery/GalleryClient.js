"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Image as ImageIcon, Eye } from "lucide-react";
import { optimizeCloudinaryUrl, thumbnailUrl } from "@/lib/image-utils";

/* ─────────────────────────────────────────────
   FULLSCREEN STORY VIEWER
   Tıkla → tam ekran açılsın, sağa/sola kaydır
   ───────────────────────────────────────────── */
function StoryViewer({ photos, initialIndex, categoryName, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [direction, setDirection] = useState(0);
  const intervalRef = useRef(null);
  const AUTO_DURATION = 5000;

  const photo = photos[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, photos.length, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  // Auto-advance
  useEffect(() => {
    if (isPaused) return;
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
  }, [currentIndex, isPaused, goNext]);

  // Keyboard
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, onClose]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Touch swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
    setIsPaused(true);
  };
  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 50) {
      if (diff < 0) goNext(); else goPrev();
    }
    setTouchStart(null);
    setIsPaused(false);
  };

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#000",
        display: "flex", flexDirection: "column",
        userSelect: "none",
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
    >
      {/* Progress Bars */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
        display: "flex", gap: "2px", padding: "10px 10px 0",
      }}>
        {photos.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: "2.5px", borderRadius: 0,
            background: "rgba(255,255,255,0.15)", overflow: "hidden",
          }}>
            <div style={{
              height: "100%", borderRadius: 0, background: "#fff",
              width: i < currentIndex ? "100%" : i === currentIndex ? `${progress}%` : "0%",
              transition: i === currentIndex ? "none" : "width 0.3s ease",
            }} />
          </div>
        ))}
      </div>

      {/* Top Bar: Category name + counter + close */}
      <div style={{
        position: "absolute", top: "20px", left: "16px", right: "16px", zIndex: 30,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#fff", fontSize: "14px", fontWeight: 700 }}>{categoryName}</span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", fontFamily: "monospace" }}>
            {currentIndex + 1}/{photos.length}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)",
            border: "none", borderRadius: 0, width: "36px", height: "36px",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#fff",
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav: Left */}
      <div
        onClick={goPrev}
        style={{
          position: "absolute", left: 0, top: "60px", bottom: 0,
          width: "25%", zIndex: 15, cursor: currentIndex > 0 ? "pointer" : "default",
        }}
      />
      {/* Nav: Right */}
      <div
        onClick={goNext}
        style={{
          position: "absolute", right: 0, top: "60px", bottom: 0,
          width: "25%", zIndex: 15, cursor: "pointer",
        }}
      />

      {/* Desktop arrows (subtle) */}
      {currentIndex > 0 && (
        <button onClick={goPrev} style={{
          position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
          zIndex: 20, background: "rgba(255,255,255,0.08)", border: "none",
          borderRadius: 0, width: "40px", height: "40px",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "rgba(255,255,255,0.6)",
        }}>
          <ChevronLeft size={20} />
        </button>
      )}
      {currentIndex < photos.length - 1 && (
        <button onClick={goNext} style={{
          position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
          zIndex: 20, background: "rgba(255,255,255,0.08)", border: "none",
          borderRadius: 0, width: "40px", height: "40px",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "rgba(255,255,255,0.6)",
        }}>
          <ChevronRight size={20} />
        </button>
      )}

      {/* Photo */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            style={{ position: "absolute", inset: 0 }}
          >
            <Image
              src={optimizeCloudinaryUrl(photo.url, { width: 1400 })}
              alt={`Fotoğraf ${currentIndex + 1}`}
              fill
              style={{ objectFit: "contain" }}
              sizes="100vw"
              priority
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}


/* ─────────────────────────────────────────────
   PORTFOLIO SECTION — Kompakt kartlar
   Tıklayınca direkt fullscreen story açılır
   ───────────────────────────────────────────── */
export default function GalleryClient({ categories }) {
  const [viewerCategory, setViewerCategory] = useState(null);

  const openCategory = (cat) => {
    if (cat.photos && cat.photos.length > 0) {
      setViewerCategory(cat);
    }
  };

  return (
    <>
      {/* Fullscreen Story Viewer */}
      <AnimatePresence>
        {viewerCategory && (
          <StoryViewer
            photos={viewerCategory.photos}
            initialIndex={0}
            categoryName={viewerCategory.name}
            onClose={() => setViewerCategory(null)}
          />
        )}
      </AnimatePresence>

      <section
        id="portfolio"
        style={{
          width: "100%",
          maxWidth: "1200px",
          marginBottom: "6rem",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{
            display: "inline-block",
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.5)",
            marginBottom: "1rem",
            padding: "0.4rem 1rem",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 0,
          }}>
            Portfolyo
          </div>
          <h2 style={{
            fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            marginBottom: "0.75rem",
            lineHeight: 1.15,
          }}>
            Portfolyo
          </h2>
        </div>

        {/* Category Grid — Responsive Gallery */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(clamp(110px, 18vw, 240px), 1fr))",
          gap: "1rem",
          justifyContent: "center",
          width: "100%",
        }}>
          {categories.length === 0 ? (
            <div style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "4rem 2rem",
              color: "rgba(255,255,255,0.12)",
              border: "1px dashed rgba(255,255,255,0.1)",
              borderRadius: 0,
            }}>
              <ImageIcon size={32} strokeWidth={1} style={{ margin: "0 auto 0.75rem", opacity: 0.5 }} />
              <p style={{ fontSize: "0.85rem" }}>Henüz koleksiyon bulunmuyor.</p>
            </div>
          ) : (
            categories.map((cat, i) => {
              const coverPhoto = cat.photos && cat.photos.length > 0 ? cat.photos[0].url : null;
              const photoCount = cat.photos?.length || 0;
 
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => openCategory(cat)}
                  style={{
                    cursor: photoCount > 0 ? "pointer" : "default",
                    position: "relative",
                    borderRadius: 0,
                    overflow: "hidden",
                    aspectRatio: "3 / 4",
                    background: "#111",
                  }}
                >
                  {coverPhoto ? (
                    <Image
                      src={thumbnailUrl(coverPhoto, 600)}
                      alt={cat.name}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="(max-width: 640px) 150px, (max-width: 1024px) 200px, 300px"
                    />
                  ) : (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ImageIcon size={24} strokeWidth={1} style={{ color: "rgba(255,255,255,0.1)" }} />
                    </div>
                  )}
                  
                  {/* Glassy overlay on hover via Tailwind/framer-motion could be better, but keeping it simple for now */}
                  <div style={{ 
                    position: "absolute", 
                    inset: 0, 
                    background: "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.7) 100%)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    padding: "1rem"
                  }}>
                    <h3 style={{ fontSize: "0.9rem", fontWeight: 700, margin: 0, color: "#fff" }}>{cat.name}</h3>
                    <p style={{ fontSize: "0.65rem", opacity: 0.5, margin: 0 }}>{photoCount} Görsel</p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </section>
    </>
  );
}
