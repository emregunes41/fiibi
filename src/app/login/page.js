"use client";

import { useState } from "react";
import { loginUser } from "../user-actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";

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

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[150px] rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0,transparent_100%)]"></div>
      </div>

      <div className="w-full max-w-md glass-panel p-10 md:p-12 rounded-[3.5rem] relative z-10 border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white text-black flex items-center justify-center rounded-2xl text-2xl font-black mx-auto mb-6 shadow-[0_0_30px_rgba(255,255,255,0.2)]">P</div>
          <h1 className="text-4xl font-black tracking-tighter mb-2 italic">Giriş Yap</h1>
          <p className="text-white/40 text-sm font-medium uppercase tracking-[0.2em] ml-1">Pinowed CRM Portal</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-4 rounded-xl text-center">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">E-POSTA</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input 
                type="email" 
                required 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-white/30"
                placeholder="ornek@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">ŞİFRE</label>
              <Link href="#" className="text-xs text-white/30 hover:text-white no-underline">Şifremi unuttum</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input 
                type="password" 
                required 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-white/30"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-white text-black font-black py-4 rounded-2xl mt-4 flex items-center justify-center gap-2 hover:bg-white/90 transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
            Giriş Yap
          </button>
        </form>

        <div className="text-center mt-10">
          <p className="text-sm text-white/40">
            Hesabınız yok mu? <Link href="/register" className="text-white font-bold no-underline hover:underline">Kayıt Ol</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
