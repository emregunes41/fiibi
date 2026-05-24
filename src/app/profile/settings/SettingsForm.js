"use client";

import { useState } from "react";
import { User, Save, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { updateUser, updatePassword, deleteUser } from "../../user-actions";
import { useRouter } from "next/navigation";

export default function SettingsForm({ user }) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdStatus, setPwdStatus] = useState(""); // "success", "error"
  const [pwdMessage, setPwdMessage] = useState("");
  const [isPwdSaving, setIsPwdSaving] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const router = useRouter();

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setIsSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      const formData = new FormData(e.target);
      const data = {
        name: formData.get("name"),
        phone: formData.get("phone"),
        gender: formData.get("gender"),
        age: formData.get("age"),
      };
      
      const res = await updateUser(user.id, data);
      if (res.error) {
        setSaveError(res.error);
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      setSaveError("Beklenmeyen bir hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwdStatus("");
    setPwdMessage("");

    if (newPassword !== confirmPassword) {
      setPwdStatus("error");
      setPwdMessage("Yeni şifreler eşleşmiyor.");
      return;
    }

    if (newPassword.length < 6) {
      setPwdStatus("error");
      setPwdMessage("Yeni şifre en az 6 karakter olmalıdır.");
      return;
    }

    setIsPwdSaving(true);
    try {
      const res = await updatePassword(user.id, oldPassword, newPassword);
      if (res.error) {
        setPwdStatus("error");
        setPwdMessage(res.error);
      } else {
        setPwdStatus("success");
        setPwdMessage("Şifreniz başarıyla güncellendi.");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPwdStatus(""), 3000);
      }
    } catch (err) {
      setPwdStatus("error");
      setPwdMessage("Beklenmeyen bir hata oluştu.");
    } finally {
      setIsPwdSaving(false);
    }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault();
    if (!confirm("Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) return;

    setDeleteError("");
    setIsDeleting(true);

    try {
      const res = await deleteUser(user.id, deletePassword);
      if (res.error) {
        setDeleteError(res.error);
        setIsDeleting(false);
      } else {
        router.push("/login");
      }
    } catch (err) {
      setDeleteError("Beklenmeyen bir hata oluştu.");
      setIsDeleting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 680 }}>
      {/* Profil Form */}
      <div style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxWidth: 680 }}>
        
        {/* Header */}
        <div style={{ padding: "24px 24px 20px 24px", display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
          <div style={{ width: 40, height: 40, borderRadius: 0, background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <User size={20} style={{ color: "rgba(0,0,0,0.65)" }} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text, #1a1a1a)", marginBottom: 2 }}>Hesap Bilgileri</h2>
            <p style={{ color: "rgba(0,0,0,0.4)", fontSize: 12, margin: 0 }}>Temel profil bilgilerinizi güncelleyin.</p>
          </div>
        </div>

        {/* Form Body */}
        <div style={{ padding: "24px" }}>

        <form onSubmit={handleProfileSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ color: "rgba(0,0,0,0.4)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Ad Soyad</label>
              <input 
                name="name" 
                defaultValue={user.name} 
                required
                style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 0, padding: "14px 16px", color: "var(--text, #1a1a1a)", fontSize: 14, outline: "none", transition: "all 0.2s" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ color: "rgba(0,0,0,0.4)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>E-posta</label>
              <input 
                disabled 
                defaultValue={user.email} 
                style={{ background: "transparent", border: "1px dashed rgba(0,0,0,0.08)", borderRadius: 0, padding: "14px 16px", color: "rgba(0,0,0,0.25)", fontSize: 14, cursor: "not-allowed" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ color: "rgba(0,0,0,0.4)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Telefon</label>
              <input 
                name="phone" 
                defaultValue={user.phone} 
                placeholder="05xx xxx xx xx"
                style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 0, padding: "14px 16px", color: "var(--text, #1a1a1a)", fontSize: 14, outline: "none", transition: "all 0.2s" }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ color: "rgba(0,0,0,0.4)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Yaş</label>
                <input 
                  name="age" 
                  type="number"
                  defaultValue={user.age} 
                  style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 0, padding: "14px 16px", color: "var(--text, #1a1a1a)", fontSize: 14, outline: "none", transition: "all 0.2s" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ color: "rgba(0,0,0,0.4)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Cinsiyet</label>
                <select 
                  name="gender" 
                  defaultValue={user.gender || ""} 
                  style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 0, padding: "14px 16px", color: "var(--text, #1a1a1a)", fontSize: 14, outline: "none", appearance: "none" }}
                >
                  <option value="" style={{ color: "#000" }}>Seçiniz</option>
                  <option value="KADIN" style={{ color: "#000" }}>Kadın</option>
                  <option value="ERKEK" style={{ color: "#000" }}>Erkek</option>
                  <option value="DIGER" style={{ color: "#000" }}>Diğer</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div style={{ flex: 1 }}>
              {saveSuccess && (
                <span style={{ color: "var(--text, #1a1a1a)", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle2 size={14} /> Değişiklikler kaydedildi.
                </span>
              )}
              {saveError && (
                <span style={{ color: "rgba(0,0,0,0.45)", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertCircle size={14} /> {saveError}
                </span>
              )}
            </div>
            <button 
              type="submit" 
              disabled={isSaving}
              style={{ background: "#fff", color: "#000", border: "none", borderRadius: 0, padding: "14px 24px", fontSize: 13, fontWeight: 700, transition: "all 0.2s", cursor: isSaving ? "not-allowed" : "pointer", opacity: isSaving ? 0.7 : 1 }}
              className="flex items-center justify-center gap-2 w-full md:w-auto"
            >
              <Save size={16} /> {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
        </div>
      </div>

      {/* Şifre Değiştir Form */}
      {user.password && (
      <div style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxWidth: 680 }}>
        
        {/* Header */}
        <div style={{ padding: "24px 24px 20px 24px", display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
          <div style={{ width: 40, height: 40, borderRadius: 0, background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Lock size={20} style={{ color: "rgba(0,0,0,0.65)" }} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text, #1a1a1a)", marginBottom: 2 }}>Şifre Değiştir</h2>
            <p style={{ color: "rgba(0,0,0,0.4)", fontSize: 12, margin: 0 }}>Güvenliğiniz için şifrenizi sık sık yenileyin.</p>
          </div>
        </div>

        {/* Form Body */}
        <div style={{ padding: "24px" }}>

        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-5">
          
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ color: "rgba(0,0,0,0.4)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Mevcut Şifre</label>
            <input 
              type="password"
              placeholder="Şu an kullandığınız şifre"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 0, padding: "14px 16px", color: "var(--text, #1a1a1a)", fontSize: 14, outline: "none", transition: "all 0.2s" }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ color: "rgba(0,0,0,0.4)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Yeni Şifre</label>
              <input 
                type="password"
                placeholder="En az 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 0, padding: "14px 16px", color: "var(--text, #1a1a1a)", fontSize: 14, outline: "none", transition: "all 0.2s" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ color: "rgba(0,0,0,0.4)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Yeni Şifre (Tekrar)</label>
              <input 
                type="password"
                placeholder="Yeni şifrenizi tekrar girin"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 0, padding: "14px 16px", color: "var(--text, #1a1a1a)", fontSize: 14, outline: "none", transition: "all 0.2s" }}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div style={{ flex: 1 }}>
              {pwdStatus === "success" && (
                <span style={{ color: "var(--text, #1a1a1a)", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle2 size={14} /> {pwdMessage}
                </span>
              )}
              {pwdStatus === "error" && (
                <span style={{ color: "rgba(0,0,0,0.45)", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertCircle size={14} /> {pwdMessage}
                </span>
              )}
            </div>
            <button 
              type="submit" 
              disabled={isPwdSaving}
              style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)", color: "var(--text, #1a1a1a)", borderRadius: 0, padding: "14px 24px", fontSize: 13, fontWeight: 700, transition: "all 0.2s", cursor: isPwdSaving ? "not-allowed" : "pointer", opacity: isPwdSaving ? 0.7 : 1 }}
              className="flex items-center justify-center gap-2 w-full md:w-auto"
            >
              {isPwdSaving ? "Değiştiriliyor..." : "Şifreyi Güncelle"}
            </button>
          </div>
        </form>
        </div>
      </div>
      )}

      {/* Hesap Silme Form */}
      <div style={{ background: "rgba(220, 38, 38, 0.05)", border: "1px solid rgba(220, 38, 38, 0.2)", borderRadius: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxWidth: 680 }}>
        {/* Header */}
        <div style={{ padding: "24px 24px 20px 24px", display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid rgba(220, 38, 38, 0.1)" }}>
          <div style={{ width: 40, height: 40, borderRadius: 0, background: "rgba(220, 38, 38, 0.1)", border: "1px solid rgba(220, 38, 38, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AlertCircle size={20} style={{ color: "#ef4444" }} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: "#ef4444", marginBottom: 2 }}>Hesabı Sil</h2>
            <p style={{ color: "rgba(0,0,0,0.45)", fontSize: 12, margin: 0 }}>Bu işlem geri alınamaz ve tüm verileriniz kalıcı olarak silinir.</p>
          </div>
        </div>

        {/* Form Body */}
        <div style={{ padding: "24px" }}>
          <form onSubmit={handleDeleteAccount} className="flex flex-col gap-5">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ color: "rgba(0,0,0,0.45)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Onay İçin Şifrenizi Girin</label>
              <input 
                type="password"
                placeholder="Hesap şifreniz"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                required
                style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(220, 38, 38, 0.3)", borderRadius: 0, padding: "14px 16px", color: "var(--text, #1a1a1a)", fontSize: 14, outline: "none", transition: "all 0.2s" }}
              />
            </div>

            <div className="mt-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div style={{ flex: 1 }}>
                {deleteError && (
                  <span style={{ color: "#ef4444", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    <AlertCircle size={14} /> {deleteError}
                  </span>
                )}
              </div>
              <button 
                type="submit" 
                disabled={isDeleting || !deletePassword}
                style={{ background: "#ef4444", color: "var(--text, #1a1a1a)", border: "none", borderRadius: 0, padding: "14px 24px", fontSize: 13, fontWeight: 700, transition: "all 0.2s", cursor: (isDeleting || !deletePassword) ? "not-allowed" : "pointer", opacity: (isDeleting || !deletePassword) ? 0.7 : 1 }}
                className="flex items-center justify-center gap-2 w-full md:w-auto hover:bg-red-600"
              >
                {isDeleting ? "Siliniyor..." : "Hesabımı Kalıcı Olarak Sil"}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}
