export default function Loading() {
  return (
    <main style={{ minHeight: "100vh", width: "100%", position: "relative" }}>
      <style>{`@keyframes homePulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }`}</style>

      {/* Hero skeleton */}
      <section style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px",
      }}>
        {/* Subtitle placeholder */}
        <div style={{
          width: "180px",
          height: "12px",
          borderRadius: 0,
          background: "rgba(0,0,0,0.06)",
          marginBottom: "24px",
          animation: "homePulse 1.5s ease-in-out infinite",
        }} />
        {/* Title placeholder — two lines */}
        <div style={{
          width: "min(420px, 80%)",
          height: "40px",
          borderRadius: 0,
          background: "rgba(0,0,0,0.08)",
          marginBottom: "12px",
          animation: "homePulse 1.5s ease-in-out infinite",
          animationDelay: "0.1s",
        }} />
        <div style={{
          width: "min(320px, 60%)",
          height: "40px",
          borderRadius: 0,
          background: "rgba(0,0,0,0.06)",
          marginBottom: "32px",
          animation: "homePulse 1.5s ease-in-out infinite",
          animationDelay: "0.2s",
        }} />
        {/* CTA placeholder */}
        <div style={{
          width: "200px",
          height: "40px",
          borderRadius: 0,
          background: "rgba(0,0,0,0.04)",
          animation: "homePulse 1.5s ease-in-out infinite",
          animationDelay: "0.3s",
        }} />
      </section>

      {/* Cards section skeleton */}
      <section style={{
        padding: "80px 24px",
        maxWidth: "1100px",
        margin: "0 auto",
      }}>
        {/* Section label */}
        <div style={{
          width: "120px",
          height: "10px",
          borderRadius: 0,
          background: "rgba(0,0,0,0.06)",
          margin: "0 auto 16px",
          animation: "homePulse 1.5s ease-in-out infinite",
        }} />
        {/* Section title */}
        <div style={{
          width: "min(280px, 60%)",
          height: "28px",
          borderRadius: 0,
          background: "rgba(0,0,0,0.07)",
          margin: "0 auto 48px",
          animation: "homePulse 1.5s ease-in-out infinite",
          animationDelay: "0.1s",
        }} />
        {/* Card grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px",
        }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              border: "1px solid rgba(0,0,0,0.05)",
              background: "rgba(0,0,0,0.015)",
              padding: "24px",
              borderRadius: 0,
              animation: "homePulse 1.5s ease-in-out infinite",
              animationDelay: `${i * 0.12}s`,
            }}>
              {/* Card title */}
              <div style={{
                width: "65%",
                height: "16px",
                borderRadius: 0,
                background: "rgba(0,0,0,0.07)",
                marginBottom: "12px",
              }} />
              {/* Card description line 1 */}
              <div style={{
                width: "90%",
                height: "10px",
                borderRadius: 0,
                background: "rgba(0,0,0,0.04)",
                marginBottom: "8px",
              }} />
              {/* Card description line 2 */}
              <div style={{
                width: "75%",
                height: "10px",
                borderRadius: 0,
                background: "rgba(0,0,0,0.04)",
                marginBottom: "20px",
              }} />
              {/* Card footer: price + button */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div style={{
                  width: "70px",
                  height: "22px",
                  borderRadius: 0,
                  background: "rgba(0,0,0,0.06)",
                }} />
                <div style={{
                  width: "90px",
                  height: "32px",
                  borderRadius: 0,
                  background: "rgba(0,0,0,0.04)",
                }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
