"use client";

import { useState } from "react";
import { resetUserPassword } from "../core-actions";
import { Key } from "lucide-react";

export default function ResetPasswordButton({ userId }) {
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    const newPassword = prompt("Lütfen yeni şifreyi giriniz (veya varsayılan için boş bırakın):", "Pinowed123!");
    if (!newPassword) return;

    if (confirm(`Üyenin şifresini "${newPassword}" olarak sıfırlamak istediğinize emin misiniz?`)) {
      setLoading(true);
      const res = await resetUserPassword(userId, newPassword);
      if (res.success) {
        alert("Şifre başarıyla sıfırlandı. Lütfen üyeye yeni şifresini iletin.");
      } else {
        alert("Hata: " + res.error);
      }
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      style={{
        background: loading ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "4px",
        color: "rgba(255,255,255,0.4)",
        fontSize: "0.55rem",
        padding: "2px 6px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        transition: "all 0.2s"
      }}
      onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#fff"; }}
      onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
    >
      <Key size={10} /> {loading ? "Sıfırlanıyor..." : "Şifreyi Sıfırla"}
    </button>
  );
}
