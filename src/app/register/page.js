"use client";

import { useState } from "react";
import { registerUser } from "../user-actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, Lock, User, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
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

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/5 blur-[150px] rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0,transparent_100%)]"></div>
      </div>

      <div className="w-full max-w-md glass-panel p-10 md:p-12 rounded-[3.5rem] relative z-10 border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white text-black flex items-center justify-center rounded-2xl text-2xl font-black mx-auto mb-6 shadow-[0_0_30px_rgba(255,255,255,0.2)]">P</div>
          <h1 className="text-4xl font-black tracking-tighter mb-2 italic">Kayıt Ol</h1>
          <p className="text-white/40 text-sm font-medium uppercase tracking-[0.2em] ml-1">Pinowed CRM Portal</p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-4 rounded-xl text-center">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">AD SOYAD</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input 
                type="text" 
                required 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-white/30 transition-colors"
                placeholder="Adınız Soyadınız"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">E-POSTA</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input 
                type="email" 
                required 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-white/30 transition-colors"
                placeholder="ornek@mail.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">ŞİFRE</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input 
                type="password" 
                required 
                minLength={6}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-white/30 transition-colors"
                placeholder="En az 6 karakter"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-white text-black font-black py-4 rounded-2xl mt-4 flex items-center justify-center gap-2 hover:bg-white/90 transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
            Hesap Oluştur
          </button>
        </form>

        <div className="text-center mt-10">
          <p className="text-sm text-white/40">
            Zaten hesabınız var mı? <Link href="/login" className="text-white font-bold no-underline hover:underline">Giriş Yap</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
