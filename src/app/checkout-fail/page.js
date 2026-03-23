import { XCircle, RefreshCw, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function FailPage() {
  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      minHeight: '100vh', padding: '2rem', textAlign: 'center', background: '#000', color: '#fff',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Background Glow */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '400px', height: '400px', background: 'rgba(239, 68, 68, 0.1)', filter: 'blur(100px)', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ 
          width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2.5rem',
          border: '1px solid rgba(239, 68, 68, 0.2)', boxShadow: '0 0 40px rgba(239, 68, 68, 0.1)'
        }}>
          <XCircle size={60} color="#EF4444" />
        </div>

        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '1.5rem' }}>İşlem Başarısız</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem', maxWidth: '600px', lineHeight: 1.6, marginBottom: '3.5rem' }}>
          Ödeme işlemi sırasında bir hata oluştu veya işlem iptal edildi. Lütfen kart bilgilerinizi kontrol edip tekrar deneyin.
        </p>

        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link href="/#contact" style={{ 
            textDecoration: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff', 
            padding: '1.25rem 2.5rem', borderRadius: '1.5rem', fontWeight: 800, fontSize: '1rem',
            border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: '0.75rem'
          }} className="hover:bg-white/10">
            <MessageCircle size={18} /> DESTEK AL
          </Link>
          <Link href="/" style={{ 
            textDecoration: 'none', background: '#fff', color: '#000', 
            padding: '1.25rem 2.5rem', borderRadius: '1.5rem', fontWeight: 800, fontSize: '1rem',
            transition: 'transform 0.2s', display: 'flex', alignItems: 'center', gap: '0.75rem'
          }} className="hover:scale-105">
            <RefreshCw size={18} /> TEKRAR DENE
          </Link>
        </div>
      </div>
    </div>
  );
}
