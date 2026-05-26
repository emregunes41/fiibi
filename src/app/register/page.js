"use client";

import { useState } from "react";
import { registerUser } from "../user-actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, Lock, User, Loader2, Camera } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", kvkkAccepted: false });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const res = await registerUser(formData);
    if (res.success) {
      router.push("/profile");
      router.refresh();
    } else {
      setError(res.error);
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    background: "rgba(0,0,0,0.08)",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 0,
    padding: "14px 16px 14px 48px",
    color: "var(--text)",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.2s ease",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 24px 24px", background: "var(--bg)", position: "relative", overflow: "hidden" }}>
      {/* Background orbs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "20%", right: "15%", width: 300, height: 300, background: "rgba(0,0,0,0.02)", filter: "blur(120px)", borderRadius: 0 }} />
        <div style={{ position: "absolute", bottom: "20%", left: "15%", width: 250, height: 250, background: "rgba(0,0,0,0.02)", filter: "blur(120px)", borderRadius: 0 }} />
      </div>

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 10 }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <div style={{ width: 80, height: 80, borderRadius: 0, background: "rgba(0,0,0,0.06)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(0,0,0,0.06)" }}>
            <Camera size={32} style={{ color: "rgba(0,0,0,0.8)" }} />
          </div>
        </div>

        {/* Card */}
        <div style={{ background: "rgba(0,0,0,0.04)", backdropFilter: "blur(40px)", borderRadius: 0, border: "1px solid rgba(0,0,0,0.08)", padding: "40px 36px", boxShadow: "0 40px 100px rgba(0,0,0,0.5)" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8 }}>Hesap Oluştur</h1>
            <p style={{ color: "rgba(0,0,0,0.55)", fontSize: 14 }}>Hesap oluşturun</p>
          </div>

          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {error && (
              <div style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)", color: "rgba(0,0,0,0.55)", fontSize: 14, padding: "14px", borderRadius: 0, textAlign: "center", fontWeight: 500 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(0,0,0,0.55)", textTransform: "uppercase", letterSpacing: "0.08em", paddingLeft: 4 }}>Ad Soyad</label>
              <div style={{ position: "relative" }}>
                <User size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
                <input 
                  type="text" 
                  required 
                  style={inputStyle}
                  placeholder="Adınız Soyadınız"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(0,0,0,0.2)"; e.target.style.background = "rgba(0,0,0,0.06)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(0,0,0,0.08)"; e.target.style.background = "rgba(0,0,0,0.08)"; }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(0,0,0,0.55)", textTransform: "uppercase", letterSpacing: "0.08em", paddingLeft: 4 }}>E-posta</label>
              <div style={{ position: "relative" }}>
                <Mail size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
                <input 
                  type="email" 
                  required 
                  style={inputStyle}
                  placeholder="ornek@mail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(0,0,0,0.2)"; e.target.style.background = "rgba(0,0,0,0.06)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(0,0,0,0.08)"; e.target.style.background = "rgba(0,0,0,0.08)"; }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(0,0,0,0.55)", textTransform: "uppercase", letterSpacing: "0.08em", paddingLeft: 4 }}>Şifre</label>
              <div style={{ position: "relative" }}>
                <Lock size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  style={inputStyle}
                  placeholder="En az 6 karakter"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(0,0,0,0.2)"; e.target.style.background = "rgba(0,0,0,0.06)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(0,0,0,0.08)"; e.target.style.background = "rgba(0,0,0,0.08)"; }}
                />
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginTop: 8 }}>
              <input 
                type="checkbox" 
                required 
                checked={formData.kvkkAccepted}
                onChange={(e) => setFormData({...formData, kvkkAccepted: e.target.checked})}
                style={{ marginTop: 4 }} 
              />
              <span style={{ fontSize: 12, color: "rgba(0,0,0,0.55)", lineHeight: 1.5 }}>
                <a href="/sozlesme?tab=hizmet" target="_blank" style={{ color: "rgba(0,0,0,0.85)", textDecoration: "none", borderBottom: "1px solid rgba(0,0,0,0.25)" }}>Hizmet Sözleşmesi</a>'ni ve <a href="/sozlesme?tab=kvkk" target="_blank" style={{ color: "rgba(0,0,0,0.85)", textDecoration: "none", borderBottom: "1px solid rgba(0,0,0,0.25)" }}>KVKK Aydınlatma Metni</a>'ni okudum ve kabul ediyorum.
              </span>
            </label>

            <button 
              type="submit" 
              disabled={isLoading || !formData.kvkkAccepted}
              style={{ width: "100%", background: "#1a1a1a", color: "#1a1a1a", fontWeight: 700, padding: "14px", borderRadius: 0, marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, border: "none", cursor: "pointer", fontSize: 15, transition: "all 0.2s ease", opacity: (isLoading || !formData.kvkkAccepted) ? 0.5 : 1 }}
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
              Hesap Oluştur
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 28, paddingTop: 20, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
            <p style={{ fontSize: 14, color: "rgba(0,0,0,0.55)" }}>
              Zaten hesabınız var mı?{" "}
              <Link href="/login" style={{ color: "var(--text, #1a1a1a)", fontWeight: 600, textDecoration: "none" }}>
                Giriş Yap
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
