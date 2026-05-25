"use client";

import { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";

export default function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(true); // Default to true to prevent flicker
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIos(isIosDevice);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    } else {
      setIsInstalled(false);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosPrompt(true);
      return;
    }

    if (!deferredPrompt) {
      // If it's Android but no prompt is available, it might already be installed or browser doesn't support it.
      alert("Cihazınızda Ana Ekrana Ekleme desteklenmiyor veya uygulama zaten yüklü. Tarayıcınızın menüsünden 'Ana Ekrana Ekle' seçeneğini kullanabilirsiniz.");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) return null;

  return (
    <>
      <button
        onClick={handleInstallClick}
        style={{
          background: "#38bdf8", color: "#000", padding: "0.5rem 1rem",
          borderRadius: 0, border: "none", fontWeight: 800, cursor: "pointer",
          display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.7rem",
          transition: "all 0.2s"
        }}
        title="Uygulamayı İndir"
      >
        <Download size={14} /> Telefondan Hızlı Erişim (Uygulamayı İndir)
      </button>

      {/* iOS Modal */}
      {showIosPrompt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(5px)", zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "#1a1a1a", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "24px", width: "100%", maxWidth: 400, color: "#fff", position: "relative", animation: "slideUp 0.3s ease-out" }}>
            <button onClick={() => setShowIosPrompt(false)} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={16} /></button>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "1.2rem", fontWeight: 800 }}>Uygulamayı Yükle</h3>
            <p style={{ margin: "0 0 20px 0", fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
              iPhone / iPad cihazınızda Fiibi panelini tam ekran ve hızlıca kullanmak için:
            </p>
            <ol style={{ paddingLeft: 20, margin: 0, color: "#fff", fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: 12 }}>
              <li>Tarayıcınızın alt kısmındaki <strong>Paylaş</strong> <Share size={14} style={{ display: "inline", verticalAlign: "middle" }} /> butonuna dokunun.</li>
              <li>Menüyü aşağı kaydırıp <strong>"Ana Ekrana Ekle" (Add to Home Screen)</strong> seçeneğine tıklayın.</li>
              <li>Sağ üstteki <strong>"Ekle"</strong> butonuna basarak kurulumu tamamlayın.</li>
            </ol>
            <button onClick={() => setShowIosPrompt(false)} style={{ width: "100%", padding: "12px", background: "#fff", color: "#000", fontWeight: 800, border: "none", borderRadius: 8, marginTop: 24, cursor: "pointer", fontSize: "1rem" }}>
              Anladım
            </button>
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes slideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
          `}} />
        </div>
      )}
    </>
  );
}
