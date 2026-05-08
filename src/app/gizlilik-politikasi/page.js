import { getCurrentTenant } from "@/lib/tenant";
import { getSiteConfig } from "../admin/core-actions";
import LegalPageClient from "@/components/LegalPageClient";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: "Gizlilik Politikası" };
}

export default async function GizlilikPolitikasiPage() {
  const tenant = await getCurrentTenant();
  const siteConfig = tenant ? await getSiteConfig() : null;
  const businessName = tenant?.businessName || siteConfig?.businessName || "Platform";
  const email = siteConfig?.email || tenant?.ownerEmail || "[E-posta]";

  const content = `
GİZLİLİK POLİTİKASI

Son Güncelleme: ${new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}

${businessName} olarak, kişisel verilerinizin korunmasına büyük önem vermekteyiz. Bu gizlilik politikası, kişisel verilerinizin nasıl toplandığını, kullanıldığını, saklandığını ve korunduğunu açıklamaktadır.

1. VERİ SORUMLUSU
${businessName}
İletişim: ${email}

2. TOPLANAN KİŞİSEL VERİLER

2.1. Doğrudan Sağladığınız Veriler:
• Kimlik Bilgileri: Ad, soyad
• İletişim Bilgileri: E-posta adresi, telefon numarası
• Hesap Bilgileri: Kullanıcı adı, şifre (şifreli olarak saklanır)
• Ödeme Bilgileri: Kredi kartı bilgileri (doğrudan bizde saklanmaz, ödeme altyapı sağlayıcısı tarafından işlenir)

2.2. Otomatik Olarak Toplanan Veriler:
• Cihaz ve tarayıcı bilgileri
• IP adresi
• Ziyaret edilen sayfalar ve ziyaret süreleri (çerez onayınıza bağlı)
• Çerez verileri

3. KİŞİSEL VERİLERİN İŞLENME AMAÇLARI
Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
• Üyelik ve hesap yönetimi
• Randevu/rezervasyon işlemlerinin gerçekleştirilmesi
• Ödeme işlemlerinin yürütülmesi
• Hizmetlerin eksiksiz sunulması
• Yasal ve mali yükümlülüklerin yerine getirilmesi (fatura vb.)
• İletişim ve bilgilendirme süreçleri (e-posta, SMS bildirimleri)
• Site güvenliğinin sağlanması
• Hizmet kalitesinin ölçülmesi ve iyileştirilmesi

4. KİŞİSEL VERİLERİN HUKUKİ SEBEBİ
Verileriniz, 6698 sayılı KVKK'nın aşağıdaki hukuki sebeplerine dayanılarak işlenmektedir:
• Bir sözleşmenin kurulması veya ifasıyla ilgili olması
• Hukuki yükümlülüğün yerine getirilmesi
• İlgili kişinin açık rızası
• Veri sorumlusunun meşru menfaati

5. KİŞİSEL VERİLERİN AKTARILMASI
Kişisel verileriniz, yalnızca hizmetin gerektirdiği ölçüde aşağıdaki taraflarla paylaşılabilir:

• Ödeme Altyapı Sağlayıcıları: Ödeme işlemlerinin güvenli şekilde gerçekleştirilmesi için (PayTR, Iyzico vb.)
• Bulut Altyapı Sağlayıcıları: Verilerin güvenli şekilde saklanması için
• Görsel İçerik Hizmetleri: Fotoğraf ve görsel içeriklerin barındırılması için (Cloudinary)
• E-posta Hizmetleri: Bildirim e-postalarının gönderilmesi için (Resend)
• Kamu Kurumları: Yasal zorunluluk halinde yetkili kamu kurum ve kuruluşları

Verileriniz yurt dışına aktarılması halinde, KVKK'nın öngördüğü güvencelere uygun hareket edilir.

6. VERİ GÜVENLİĞİ
Kişisel verilerinizin güvenliğini sağlamak için aşağıdaki önlemler alınmaktadır:
• Şifreler tek yönlü hash (bcrypt) ile şifrelenerek saklanır
• Oturum çerezleri httpOnly ve secure bayrakları ile korunur
• SSL/TLS (HTTPS) şifreleme kullanılır
• Brute-force saldırılarına karşı rate limiting uygulanır
• Ödeme bilgileri PCI-DSS uyumlu altyapılar üzerinden işlenir

7. VERİ SAKLAMA SÜRESİ
Kişisel verileriniz, işleme amacının gerektirdiği süre boyunca saklanır:
• Hesap bilgileri: Hesap aktif olduğu sürece
• Rezervasyon ve ödeme kayıtları: Yasal zorunluluk gereği 10 yıl (6102 TTK, 213 VUK)
• Analitik veriler: Anonim olarak en fazla 12 ay
• Silinen hesaplar: 30 gün içinde kalıcı olarak silinir

8. HAKLARINIZ
6698 sayılı KVKK'nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:
• Kişisel verilerinizin işlenip işlenmediğini öğrenme
• İşlenmişse buna ilişkin bilgi talep etme
• İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme
• Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme
• Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme
• KVKK'nın 7. maddesindeki koşullar çerçevesinde silinmesini isteme
• Düzeltme ve silme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme
• İşlenen verilerin aleyhine bir sonuç doğurması halinde itiraz etme
• Kanuna aykırı işleme sebebiyle zarara uğramanız halinde tazminat talep etme

Haklarınızı kullanmak için ${email} adresine yazılı olarak başvurabilirsiniz. Başvurularınız en geç 30 gün içinde yanıtlanacaktır.

9. POLİTİKA DEĞİŞİKLİKLERİ
Bu gizlilik politikası, yasal düzenlemeler veya hizmet değişiklikleri doğrultusunda güncellenebilir. Güncellemeler bu sayfada yayınlanır.

Bu politika, 6698 sayılı Kişisel Verilerin Korunması Kanunu ve 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun kapsamında hazırlanmıştır.
  `.trim();

  return <LegalPageClient title="Gizlilik Politikası" content={content} />;
}
