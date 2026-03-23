import { getPackages } from "./admin/core-actions";
import BookingFlow from "@/components/BookingFlow";
import Image from "next/image";

export const dynamic = 'force-dynamic';

export default async function PinowedPage() {
  const packages = await getPackages();

  return (
    <main style={{ 
      position: "relative", 
      minHeight: "100vh", 
      width: "100%", 
      overflow: "hidden",
      background: "#000" // Fallback black
    }}>
      
      {/* Cinematic Background Video */}
      <div style={{ 
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
        zIndex: 0, overflow: "hidden" 
      }}>
        <video 
          autoPlay muted loop playsInline 
          style={{ 
            width: "100%", height: "100%", objectFit: "cover", 
            opacity: 0.6, filter: "brightness(0.7) contrast(1.1)" 
          }}
        >
          <source src="/assets/hero.mp4" type="video/mp4" />
        </video>
        {/* Dark Overlay Gradient */}
        <div style={{ 
          position: "absolute", inset: 0, 
          background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)",
          zIndex: 1 
        }} />
      </div>

      {/* Hero Content Layer */}
      <div style={{ 
        position: "relative", zIndex: 10, 
        display: "flex", flexDirection: "column", 
        alignItems: "center", minHeight: "100vh", padding: "2rem" 
      }}>
        
        {/* Logo Container */}
        <div style={{ marginTop: "3rem", marginBottom: "4rem", textAlign: "center" }}>
          <div style={{ 
            width: "220px", height: "220px", 
            borderRadius: "50%", 
            overflow: "hidden",
            border: "3px solid rgba(255,255,255,0.3)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto"
          }}>
            <Image 
              src="/assets/logo.jpg" 
              alt="Pinowed Logo" 
              width={220} 
              height={220} 
              style={{ objectFit: "cover" }}
            />
          </div>
        </div>

        {/* Global Floating Header Info */}
        <div style={{ textAlign: "center", marginBottom: "3rem", color: "#fff" }}>
          <h1 style={{ fontSize: "3.5rem", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: "1rem", textShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
            Anılarını Ölümsüzleştir
          </h1>
          <p style={{ fontSize: "1.2rem", color: "rgba(255,255,255,0.7)", maxWidth: "600px", margin: "0 auto" }}>
            Profesyonel dokunuşlarla en özel günlerini birer sanat eserine dönüştürüyoruz.
          </p>
        </div>

        {/* The Booking Flow Container (Glassmorphism Layer) */}
        <div style={{ 
          width: "100%", maxWidth: "1200px", 
          background: "rgba(255,255,255,0.03)", 
          backdropFilter: "blur(25px) saturate(180%)", 
          WebkitBackdropFilter: "blur(25px) saturate(180%)", 
          borderRadius: "3rem", 
          border: "1px solid rgba(255,255,255,0.12)", 
          padding: "3rem",
          boxShadow: "0 40px 100px -20px rgba(0,0,0,0.5)",
          marginBottom: "5rem"
        }}>
          <BookingFlow initialPackages={packages} />
        </div>

        {/* About Section */}
        <section id="about" style={{ 
          width: "100%", maxWidth: "1200px", marginBottom: "8rem",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center"
        }}>
          <div style={{ position: "relative" }}>
            <div style={{ 
              borderRadius: "2rem", overflow: "hidden", 
              boxShadow: "0 40px 100px -20px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.1)"
            }}>
              <Image 
                src="/assets/about.jpg" 
                alt="Biz Kimiz" 
                width={600} height={800} 
                style={{ objectFit: "cover", width: "100%", height: "auto" }}
              />
            </div>
            {/* Overlay Experience Card */}
            <div style={{ 
              position: "absolute", bottom: "-2rem", right: "-2rem", 
              background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)",
              padding: "2rem", borderRadius: "1.5rem", border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
            }}>
              <div style={{ fontSize: "2.5rem", fontWeight: 900, marginBottom: "0.25rem" }}>10+</div>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Yıllık Deneyim</div>
            </div>
          </div>
          <div>
            <h2 style={{ fontSize: "3rem", fontWeight: 900, marginBottom: "1.5rem", letterSpacing: "-0.04em" }}>Hikayenizi Birlikte Yazalım</h2>
            <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.8, marginBottom: "2rem" }}>
              Pinowed olarak, sadece fotoğraf çekmiyoruz; duyguları, bakışları ve o anın ruhunu karelere hapsediyoruz. 
              Modern ekipmanlarımız ve sanatsal bakış açımızla, en özel günlerinizde yanınızdayız.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              <div>
                <h4 style={{ fontWeight: 800, marginBottom: "0.5rem" }}>Profesyonel Ekip</h4>
                <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.5)" }}>Alanında uzman ve tutkulu fotoğrafçılar.</p>
              </div>
              <div>
                <h4 style={{ fontWeight: 800, marginBottom: "0.5rem" }}>Hızlı Teslimat</h4>
                <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.5)" }}>En geç 15 gün içinde tüm kareler elinizde.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" style={{ 
          width: "100%", maxWidth: "1200px", marginBottom: "8rem",
          background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)",
          borderRadius: "3rem", border: "1px solid rgba(255,255,255,0.1)", padding: "4rem"
        }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2 style={{ fontSize: "3rem", fontWeight: 900, marginBottom: "1rem", letterSpacing: "-0.04em" }}>Bizimle İletişime Geçin</h2>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Hayalinizdeki çekim için bir mesaj uzağınızdayız.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "4rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.05)", borderRadius: "1.5rem", border: "1px solid rgba(255,255,255,0.1)" }}>
                <h4 style={{ fontSize: "0.8rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "0.5rem" }}>Adres</h4>
                <p style={{ fontWeight: 600 }}>Moda, Kadıköy / İstanbul</p>
              </div>
              <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.05)", borderRadius: "1.5rem", border: "1px solid rgba(255,255,255,0.1)" }}>
                <h4 style={{ fontSize: "0.8rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "0.5rem" }}>E-posta</h4>
                <p style={{ fontWeight: 600 }}>merhaba@pinowed.com</p>
              </div>
              <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.05)", borderRadius: "1.5rem", border: "1px solid rgba(255,255,255,0.1)" }}>
                <h4 style={{ fontSize: "0.8rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "0.5rem" }}>Telefon</h4>
                <p style={{ fontWeight: 600 }}>+90 555 000 00 00</p>
              </div>
            </div>
            <form style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <input type="text" placeholder="Adınız" style={{ padding: "1rem 1.5rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.1)", background: "transparent" }} />
                <input type="email" placeholder="E-posta" style={{ padding: "1rem 1.5rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.1)", background: "transparent" }} />
              </div>
              <textarea placeholder="Mesajınız" rows={4} style={{ padding: "1rem 1.5rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", resize: "none" }} />
              <button style={{ 
                padding: "1.25rem", background: "#fff", color: "#000", border: "none", 
                borderRadius: "1rem", fontWeight: 800, fontSize: "1rem", cursor: "pointer",
                transition: "transform 0.2s"
              }} className="hover:scale-[1.02]">Gönder</button>
            </form>
          </div>
        </section>

        {/* Footer Info */}
        <footer style={{ padding: "4rem 2rem", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.85rem", borderTop: "1px solid rgba(255,255,255,0.05)", width: "100%" }}>
          <p>© 2026 PINOWED Photography. Tüm hakları saklıdır.</p>
        </footer>

      </div>

      {/* Custom Styles for Glassmorphism effects */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --primary: #fff;
          --primary-muted: rgba(255,255,255,0.1);
          --bg: transparent;
          --bg-card: rgba(255,255,255,0.05);
          --border: rgba(255,255,255,0.15);
          --text: #fff;
          --text-muted: rgba(255,255,255,0.5);
        }
        body { background: #000; color: #fff; }
        .glass-hover:hover {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(255,255,255,0.3) !important;
          transform: translateY(-5px);
        }
        input, select, textarea {
          background: rgba(255,255,255,0.05) !important;
          color: #fff !important;
          border-color: rgba(255,255,255,0.2) !important;
        }
        input::placeholder { color: rgba(255,255,255,0.3) !important; }
      `}} />

    </main>
  );
}
