export const metadata = { title: "Sayfa Bulunamadı" };

export default function SuspendedPage() {
  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 24
    }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 72, fontWeight: 900, color: "rgba(255,255,255,0.06)", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 16 }}>
          404
        </div>
        <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 12 }}>
          Sayfa Bulunamadı
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          Aradığınız sayfa mevcut değil veya kaldırılmış olabilir.
        </p>
      </div>
    </div>
  );
}

