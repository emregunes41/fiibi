"use client";

import { useState } from "react";
import { Shield, ArrowRight } from "lucide-react";
import { superAdminLogin } from "@/app/actions/super-admin";
import { useRouter } from "next/navigation";

export default function SuperAdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await superAdminLogin(password);
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/super-admin");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", background: "rgba(139,92,246,0.1)",
            border: "1px solid rgba(139,92,246,0.2)", display: "inline-flex",
            alignItems: "center", justifyContent: "center", marginBottom: 16
          }}>
            <Shield size={22} style={{ color: "#8b5cf6" }} />
          </div>
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
            Platform Yönetimi
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Super Admin erişimi</p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          padding: 28, display: "flex", flexDirection: "column", gap: 16
        }}>
          <input
            type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Platform şifresi"
            required
            style={{
              width: "100%", background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)", padding: "12px 14px",
              color: "#fff", fontSize: 14, outline: "none"
            }}
          />
          {error && (
            <div style={{ fontSize: 13, color: "#f87171", textAlign: "center" }}>{error}</div>
          )}
          <button type="submit" disabled={loading} style={{
            background: "#8b5cf6", color: "#fff", border: "none",
            padding: "12px 24px", fontWeight: 700, fontSize: 14,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8, opacity: loading ? 0.5 : 1
          }}>
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"} <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
