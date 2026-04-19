import { Snowflake } from "lucide-react";

export const metadata = { title: "Hesap Askıda" };

export default function SuspendedPage() {
  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 24
    }}>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "rgba(56,189,248,0.08)", border: "2px solid rgba(56,189,248,0.15)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          marginBottom: 24
        }}>
          <Snowflake size={32} style={{ color: "#38bdf8" }} />
        </div>

        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>
          Hesap Askıya Alındı
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
          Bu stüdyonun hesabı geçici olarak askıya alınmıştır. 
          Abonelik ödemesi tamamlandığında hesap otomatik olarak aktifleşecektir.
        </p>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
          Destek için: <a href="mailto:support@photoapp.co" style={{ color: "rgba(255,255,255,0.5)" }}>support@photoapp.co</a>
        </p>
      </div>
    </div>
  );
}
