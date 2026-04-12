"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, User } from "lucide-react";
import { loginAdmin } from "@/app/admin/actions";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const res = await loginAdmin(username, password);
    if (res?.error) {
      setError(res.error);
      setIsLoading(false);
    }
    // If successful, the server action triggers a redirect
  };

  return (
    <div className="pinowed-theme" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-card)' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ 
          background: 'var(--bg)', padding: '3rem 2.5rem', borderRadius: 0, 
          boxShadow: '0 20px 40px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px',
          border: '1px solid var(--border)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
            STUDIO.
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Yönetici Paneline Giriş Yap</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', padding: '0.75rem', borderRadius: 0, fontSize: '0.85rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input 
              type="text" 
              placeholder="Kullanıcı Adı" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ 
                width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem', 
                borderRadius: 0, border: '1px solid var(--border)',
                outline: 'none', fontSize: '0.95rem',
                color: '#fff', background: 'rgba(255,255,255,0.05)'
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input 
              type="password" 
              placeholder="Şifre" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ 
                width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem', 
                borderRadius: 0, border: '1px solid var(--border)',
                outline: 'none', fontSize: '0.95rem',
                color: '#fff', background: 'rgba(255,255,255,0.05)'
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              background: 'var(--primary)', color: '#000', padding: '1rem', 
              borderRadius: 0, border: 'none', fontWeight: 600, fontSize: '1rem',
              cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1,
              marginTop: '0.5rem'
            }}
          >
            {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
