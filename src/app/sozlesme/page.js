import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Hizmet Sözleşmesi | Pinowed",
  description: "Pinowed Fotoğrafçılık genel hizmet ve satış sözleşmesi.",
};

export default function SozlesmePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", padding: "60px 24px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.5)", textDecoration: "none", marginBottom: 32, fontSize: 14, fontWeight: 500, transition: "color 0.2s" }} className="hover:text-white">
          <ArrowLeft size={16} /> Ana Sayfaya Dön
        </Link>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(250,204,21,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={24} style={{ color: "#facc15" }} />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>Hizmet Sözleşmesi</h1>
        </div>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, marginBottom: 40, marginLeft: 64 }}>Pinowed Fotoğrafçılık hizmet ve satış koşulları</p>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "clamp(24px, 5vw, 48px)" }}>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 24 }}>
            
            <p>Bu sözleşme, <strong>Pinowed Fotoğrafçılık</strong> ("Hizmet Sağlayıcı") ile rezervasyon sahibi ("Müşteri") arasında, aşağıda belirtilen koşullar çerçevesinde düzenlenmiştir.</p>

            <section>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: "#facc15" }}>1.</span> HİZMETİN KAPSAMI</h3>
              <p>Seçilen paket kapsamında belirtilen fotoğraf ve/veya video çekim hizmeti sunulacaktır. Çekim süresi, teslim edilecek fotoğraf sayısı ve ek hizmetler, seçilen pakete göre belirlenir.</p>
            </section>

            <section>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: "#facc15" }}>2.</span> REZERVASYON VE KAPORA</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                <li style={{ display: "flex", gap: 12 }}><span style={{ color: "rgba(255,255,255,0.3)" }}>—</span> Rezervasyon, bu sözleşmenin onaylanması ve ön ödeme (kapora) yapılması ile kesinleşir.</li>
                <li style={{ display: "flex", gap: 12 }}><span style={{ color: "rgba(255,255,255,0.3)" }}>—</span> Kapora tutarı, karşılıklı anlaşılan meblağ kadardır.</li>
                <li style={{ display: "flex", gap: 12 }}><span style={{ color: "rgba(255,255,255,0.3)" }}>—</span> Kapora ödemesi yapılmadan tarih rezerve edilmez.</li>
              </ul>
            </section>

            <section>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: "#facc15" }}>3.</span> ÖDEME KOŞULLARI</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                <li style={{ display: "flex", gap: 12 }}><span style={{ color: "rgba(255,255,255,0.3)" }}>—</span> Kalan ödeme, çekim tarihinden en geç 3 gün önce tamamlanmalıdır.</li>
                <li style={{ display: "flex", gap: 12 }}><span style={{ color: "rgba(255,255,255,0.3)" }}>—</span> Nakit, havale/EFT ve kredi kartı ile ödeme kabul edilmektedir.</li>
                <li style={{ display: "flex", gap: 12 }}><span style={{ color: "rgba(255,255,255,0.3)" }}>—</span> Kredi kartı ödemelerinde sistem altyapı bedeli olarak %15 ek komisyon uygulanabilir.</li>
              </ul>
            </section>

            <section>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: "#facc15" }}>4.</span> TARİH DEĞİŞİKLİĞİ VE İPTAL</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                <li style={{ display: "flex", gap: 12 }}><span style={{ color: "rgba(255,255,255,0.3)" }}>—</span> Çekim tarihi değişikliği en geç 15 gün öncesinden yazılı olarak bildirilmelidir.</li>
                <li style={{ display: "flex", gap: 12 }}><span style={{ color: "rgba(255,255,255,0.3)" }}>—</span> Tarih değişikliği, müsaitlik durumuna bağlı olup 1 kez ücretsiz yapılabilir.</li>
                <li style={{ display: "flex", gap: 12 }}><span style={{ color: "rgba(255,255,255,0.3)" }}>—</span> Müşteri tarafından iptal edilmesi halinde kapora iade edilmez.</li>
                <li style={{ display: "flex", gap: 12 }}><span style={{ color: "rgba(255,255,255,0.3)" }}>—</span> Hizmet sağlayıcı tarafından mücbir sebepler dışında iptal edilmesi halinde kapora tam olarak iade edilir.</li>
              </ul>
            </section>

            <section>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: "#facc15" }}>5.</span> ÇEKİM GÜNLERİ</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                <li style={{ display: "flex", gap: 12 }}><span style={{ color: "rgba(255,255,255,0.3)" }}>—</span> Müşteri, çekim saatinde belirtilen lokasyonda hazır bulunmayı kabul eder.</li>
                <li style={{ display: "flex", gap: 12 }}><span style={{ color: "rgba(255,255,255,0.3)" }}>—</span> 30 dakikayı aşan gecikmeler çekim süresinden düşülür.</li>
                <li style={{ display: "flex", gap: 12 }}><span style={{ color: "rgba(255,255,255,0.3)" }}>—</span> Hava koşulları veya mekan kaynaklı aksaklıklarda çekim ileri bir tarihe ertelenebilir.</li>
              </ul>
            </section>

            <section>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: "#facc15" }}>6.</span> TESLİM SÜRESİ</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                <li style={{ display: "flex", gap: 12 }}><span style={{ color: "rgba(255,255,255,0.3)" }}>—</span> Düzenlenmiş fotoğraflar, çekim tarihinden itibaren paket detaylarında belirtilen süre içinde dijital ortamda teslim edilir.</li>
                <li style={{ display: "flex", gap: 12 }}><span style={{ color: "rgba(255,255,255,0.3)" }}>—</span> Albüm hizmeti dahil olan paketlerde, fotoğraf seçimi müşteri tarafından yapıldıktan sonra albüm hazırlık süresi başlar.</li>
                <li style={{ display: "flex", gap: 12 }}><span style={{ color: "rgba(255,255,255,0.3)" }}>—</span> Mücbir sebeplerle teslim süresinde gecikme yaşanabilir; bu durumda müşteri bilgilendirilir.</li>
              </ul>
            </section>

            <section>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: "#facc15" }}>7.</span> TELİF HAKKI VE KULLANIM</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                <li style={{ display: "flex", gap: 12 }}><span style={{ color: "rgba(255,255,255,0.3)" }}>—</span> Çekilen fotoğrafların telif hakkı Pinowed Fotoğrafçılık'a aittir.</li>
                <li style={{ display: "flex", gap: 12 }}><span style={{ color: "rgba(255,255,255,0.3)" }}>—</span> Müşteri, teslim edilen fotoğrafları kişisel kullanım amacıyla serbestçe kullanabilir.</li>
                <li style={{ display: "flex", gap: 12 }}><span style={{ color: "rgba(255,255,255,0.3)" }}>—</span> Hizmet sağlayıcı, çekilen fotoğrafları portfolyosunda, web sitesinde ve sosyal medya hesaplarında tanıtım amacıyla kullanma hakkına sahiptir. Özel gizlilik talebi müşterinin sorumluluğundadır.</li>
              </ul>
            </section>

            <section>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: "#facc15" }}>8.</span> TEKNİK SORUMLULUK</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                <li style={{ display: "flex", gap: 12 }}><span style={{ color: "rgba(255,255,255,0.3)" }}>—</span> Hizmet sağlayıcı, profesyonel ekipman ve yedek ekipman ile çekime gelir.</li>
                <li style={{ display: "flex", gap: 12 }}><span style={{ color: "rgba(255,255,255,0.3)" }}>—</span> Teknik arıza, doğal afet veya beklenmeyen olaylar nedeniyle oluşabilecek veri kayıplarında hizmet sağlayıcının sorumluluğu maksimum alınan toplam ücret ile sınırlıdır.</li>
              </ul>
            </section>

            <div style={{ marginTop: 24, padding: 24, background: "rgba(74,222,128,0.05)", borderRadius: 16, border: "1px solid rgba(74,222,128,0.15)", display: "flex", gap: 16 }}>
              <CheckCircle2 style={{ color: "#4ade80", flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
                  Pinowed müşteri paneli üzerinden "Okudum ve Onaylıyorum" butonuna tıklayarak veya müşteri temsilcisi gözetiminde kapora onayı verdiğinizde yukarıdaki tüm maddeleri okuduğunuzu ve kabul ettiğinizi beyan edersiniz.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
