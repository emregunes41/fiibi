"use client";

import { useState } from "react";
import { loginUser } from "../user-actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Mail, Lock, Loader2, Camera } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const res = await loginUser(email, password);
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
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 0,
    padding: "14px 16px 14px 48px",
    color: "#fff",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.2s ease",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 24px 24px", background: "#000", position: "relative", overflow: "hidden" }}>
      {/* Background orbs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "20%", left: "15%", width: 300, height: 300, background: "rgba(255,255,255,0.03)", filter: "blur(120px)", borderRadius: 0 }} />
        <div style={{ position: "absolute", bottom: "20%", right: "15%", width: 250, height: 250, background: "rgba(255,255,255,0.06)", filter: "blur(120px)", borderRadius: 0 }} />
      </div>

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 10 }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <div style={{ width: 80, height: 80, borderRadius: 0, background: "rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(255,255,255,0.08)" }}>
            <Camera size={32} style={{ color: "rgba(255,255,255,0.85)" }} />
          </div>
        </div>

        {/* Card */}
        <div style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(40px)", borderRadius: 0, border: "1px solid rgba(255,255,255,0.15)", padding: "40px 36px", boxShadow: "0 40px 100px rgba(0,0,0,0.5)" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8 }}>Giriş Yap</h1>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}>Pinowed hesabınıza giriş yapın</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {error && (
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 14, padding: "14px", borderRadius: 0, textAlign: "center", fontWeight: 500 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", paddingLeft: 4 }}>E-posta</label>
              <div style={{ position: "relative" }}>
                <Mail size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", pointerEvents: "none" }} />
                <input 
                  type="email" 
                  required 
                  style={inputStyle}
                  placeholder="ornek@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.25)"; e.target.style.background = "rgba(255,255,255,0.08)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.06)"; }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: 4, paddingRight: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Şifre</label>
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", pointerEvents: "none" }} />
                <input 
                  type="password" 
                  required 
                  style={inputStyle}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.25)"; e.target.style.background = "rgba(255,255,255,0.08)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.06)"; }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              style={{ width: "100%", background: "#fff", color: "#000", fontWeight: 700, padding: "14px", borderRadius: 0, marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, border: "none", cursor: "pointer", fontSize: 15, transition: "all 0.2s ease", opacity: isLoading ? 0.5 : 1 }}
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
              Giriş Yap
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 28, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)" }}>
              Hesabınız yok mu?{" "}
              <Link href="/register" style={{ color: "#fff", fontWeight: 600, textDecoration: "none" }}>
                Kayıt Ol
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
