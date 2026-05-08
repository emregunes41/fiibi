import { getCurrentTenant } from "@/lib/tenant";
import { getSiteConfig } from "../admin/core-actions";
import LegalPageClient from "@/components/LegalPageClient";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: "Kullanım Şartları" };
}

export default async function KullanimSartlariPage() {
  const tenant = await getCurrentTenant();
  const siteConfig = tenant ? await getSiteConfig() : null;
  const businessName = tenant?.businessName || siteConfig?.businessName || "Platform";
  const email = siteConfig?.email || tenant?.ownerEmail || "[E-posta]";

  const content = `
KULLANIM ŞARTLARI

Son Güncelleme: ${new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}

${businessName}'e ait bu internet sitesini kullanarak aşağıdaki şartları kabul etmiş sayılırsınız. Lütfen siteyi kullanmadan önce bu şartları dikkatlice okuyunuz.

1. GENEL HÜKÜMLER
1.1. Bu internet sitesi, ${businessName} tarafından işletilmektedir.
1.2. Siteyi kullanarak işbu kullanım şartlarını, gizlilik politikasını ve çerez politikasını kabul ettiğinizi beyan edersiniz.
1.3. ${businessName}, bu kullanım şartlarını önceden bildirimde bulunmaksızın değiştirme hakkını saklı tutar.

2. HİZMETLERİN KULLANIMI
2.1. Sitemiz üzerinden sunulan hizmetlerden yararlanmak için üyelik oluşturmanız gerekebilir.
2.2. Üyelik bilgilerinizin doğruluğundan ve güncelliğinden siz sorumlusunuz.
2.3. Hesap güvenliğinizden (şifrenizi korumak, yetkisiz erişimi bildirmek) siz sorumlusunuz.
2.4. Hesabınızı başka kişilerle paylaşamazsınız.

3. RANDEVU VE REZERVASYON
3.1. Sitemiz üzerinden yapılan randevu/rezervasyonlar, ilgili hizmet sözleşmesi şartlarına tabidir.
3.2. Rezervasyon iptali ve değişiklik koşulları, hizmet veren tarafından belirlenir ve Hizmet Sözleşmesi'nde detaylandırılır.
3.3. Ödeme işlemleri, güvenli ödeme altyapıları (PayTR, Iyzico vb.) üzerinden gerçekleştirilir.

4. FİKRİ MÜLKİYET HAKLARI
4.1. Bu sitedeki tüm içerikler (yazılar, görseller, logolar, tasarımlar, yazılım) ${businessName}'e veya lisans verenlerine aittir.
4.2. Sitedeki içerikler, yazılı izin olmadan kopyalanamaz, çoğaltılamaz, dağıtılamaz veya yeniden yayınlanamaz.
4.3. Stüdyo/profesyonel tarafından çekilen fotoğraf ve videoların telif hakları, ilgili Hizmet Sözleşmesi'nde belirtilen şartlara tabidir.

5. KULLANICI YÜKÜMLÜLÜKLERİ
Siteyi kullanırken aşağıdaki davranışlar yasaktır:
• Yanlış, yanıltıcı veya sahte bilgi vermek
• Başkalarının hesaplarına yetkisiz erişim sağlamaya çalışmak
• Sitenin güvenliğini tehdit edecek faaliyetlerde bulunmak
• Zararlı yazılım (virüs, trojan vb.) yaymak
• Siteyi yasal olmayan amaçlarla kullanmak
• Otomatik veri toplama araçları (bot, scraper vb.) kullanmak

6. SORUMLULUK SINIRLAMASI
6.1. ${businessName}, sitede sunulan bilgilerin doğruluğu konusunda azami özeni gösterir ancak bilgilerin eksiksizliğini ve güncelliğini garanti etmez.
6.2. Mücbir sebepler (doğal afet, internet kesintisi, siber saldırı vb.) nedeniyle hizmet kesintileri yaşanabilir. Bu durumlardan ${businessName} sorumlu tutulamaz.
6.3. Sitemizden üçüncü taraf sitelere verilen bağlantılardan (link) ${businessName} sorumlu değildir.

7. ÖDEME VE İADE
7.1. Ödeme koşulları, ilgili Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu'nda detaylı olarak belirtilmiştir.
7.2. Cayma hakkı ve iade koşulları, 6502 sayılı Tüketicinin Korunması Hakkında Kanun'a tabidir.

8. KİŞİSEL VERİLERİN KORUNMASI
Kişisel verilerinizin işlenmesine ilişkin detaylı bilgi için Gizlilik Politikası ve KVKK Aydınlatma Metni sayfalarımızı inceleyebilirsiniz.

9. UYUŞMAZLIKLARIN ÇÖZÜMÜ
9.1. İşbu kullanım şartları Türkiye Cumhuriyeti kanunlarına tabidir.
9.2. Uyuşmazlıklarda yasal sınırlar dahilinde Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.

10. İLETİŞİM
Bu kullanım şartları hakkında sorularınız için ${email} adresine yazabilirsiniz.
  `.trim();

  return <LegalPageClient title="Kullanım Şartları" content={content} />;
}
