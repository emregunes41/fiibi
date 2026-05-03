"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteUser } from "@/app/admin/core-actions";

export default function DeleteUserButton({ userId, userName, role }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (role === "ADMIN") {
      alert("Güvenlik: Admin hesaplarını bu panelden silemezsiniz.");
      return;
    }
    
    const confirmDelete = window.confirm(
      `${userName ? userName + " adlı" : "Bu"} üyeyi sistemden TAMAMEN silmek istediğinize emin misiniz?\n\nNot: Bu üyenin geçmiş randevuları/faturaları anonim ziyaretçi kaydı olarak saklanmaya devam edecektir.`
    );

    if (!confirmDelete) return;

    setIsDeleting(true);
    const result = await deleteUser(userId);
    setIsDeleting(false);

    if (result.error) {
      alert("Hata: " + result.error);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting || role === "ADMIN"}
      title={role === "ADMIN" ? "Admin silinemez" : "Üyeyi Kalıcı Sil"}
      style={{
        background: isDeleting ? "rgba(255,255,255,0.1)" : "rgba(239, 68, 68, 0.15)",
        border: `1px solid ${isDeleting ? "transparent" : "rgba(239, 68, 68, 0.3)"}`,
        color: isDeleting ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.5)",
        padding: "4px 8px",
        borderRadius: 0,
        fontSize: "0.65rem",
        fontWeight: 600,
        cursor: isDeleting || role === "ADMIN" ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        height: "22px"
      }}
    >
      <Trash2 size={10} />
      {isDeleting ? "Siliniyor..." : "Sil"}
    </button>
  );
}
