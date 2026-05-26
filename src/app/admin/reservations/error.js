"use client";

import { useEffect, useState } from "react";

export default function ReservationsError({ error, reset }) {
  const [errorDetails, setErrorDetails] = useState("");

  useEffect(() => {
    console.error("Reservations page error:", error);
    setErrorDetails(error?.message || error?.toString() || "Bilinmeyen hata");
  }, [error]);

  return (
    <div style={{ padding: "40px", color: "#1a1a1a", maxWidth: 600, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>⚠️ Rezervasyonlar Sayfası Hatası</h2>
      <div style={{ 
        background: "rgba(255,0,0,0.1)", 
        border: "1px solid rgba(255,0,0,0.3)", 
        padding: 20, 
        borderRadius: 0, 
        marginBottom: 20,
        fontSize: 14,
        fontFamily: "monospace",
        wordBreak: "break-all",
        whiteSpace: "pre-wrap"
      }}>
        {errorDetails}
      </div>
      <div style={{ 
        background: "rgba(0,0,0,0.05)", 
        border: "1px solid rgba(0,0,0,0.1)", 
        padding: 16, 
        borderRadius: 0, 
        marginBottom: 20,
        fontSize: 13,
        color: "rgba(255,255,255,0.6)",
        lineHeight: 1.6
      }}>
        <strong>Stack:</strong><br/>
        {error?.stack || "Stack bilgisi mevcut değil"}
      </div>
      <button
        onClick={() => reset()}
        style={{
          background: "#1a1a1a", color: "#1a1a1a",
          border: "none",
          padding: "12px 24px",
          fontWeight: 700,
          cursor: "pointer",
          fontSize: 14,
          borderRadius: 0
        }}
      >
        Tekrar Dene
      </button>
    </div>
  );
}
