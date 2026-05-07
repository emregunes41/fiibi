import { getCurrentTenant } from "@/lib/tenant";
import { getSiteConfig } from "../admin/core-actions";
import LegalPageClient from "@/components/LegalPageClient";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: "Çerez Politikası" };
}

export default async function CerezPolitikasiPage() {
  const tenant = await getCurrentTenant();
  const siteConfig = tenant ? await getSiteConfig() : null;
  const businessName = siteConfig?.businessName || tenant?.businessName || "Platform";

  const content = `
ÇEREZ POLİTİKASI

Son Güncelleme: ${new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}

${businessName} olarak, internet sitemizi ziyaret ettiğinizde deneyiminizi iyileştirmek ve hizmetlerimizi sunmak amacıyla çerezler (cookies) kullanmaktayız. Bu politika, hangi çerezleri neden kullandığımızı ve bunları nasıl yönetebileceğinizi açıklamaktadır.

1. ÇEREZ NEDİR?
Çerezler, bir web sitesini ziyaret ettiğinizde tarayıcınız aracılığıyla cihazınıza (bilgisayar, telefon, tablet) kaydedilen küçük metin dosyalarıdır. Çerezler, siteyi bir sonraki ziyaretinizde sizi tanımak, tercihlerinizi hatırlamak ve site kullanım istatistiklerini ölçmek için kullanılır.

2. KULLANILAN ÇEREZ TÜRLERİ

2.1. Zorunlu (Teknik) Çerezler
Bu çerezler, sitenin temel işlevlerinin çalışması için kesinlikle gereklidir. Bu çerezler olmadan oturum yönetimi ve güvenlik fonksiyonları çalışmaz.

• auth_token: Müşteri oturum yönetimi (7 gün süreli, httpOnly, güvenli)
• admin_token: Yönetici oturum yönetimi (1 gün süreli, httpOnly, güvenli)

Bu çerezler sadece giriş yaptığınızda oluşturulur ve kişisel verilerinizi üçüncü taraflarla paylaşmaz.

2.2. Analitik Çerezler
Bu çerezler, sitemizin nasıl kullanıldığını anlamamıza yardımcı olur. Hangi sayfaların ziyaret edildiğini anonim olarak izler.

• Sayfa görüntüleme takibi: Ziyaret edilen sayfalar ve ziyaret sayıları

Analitik çerezler yalnızca sizin açık onayınızla çalıştırılır. Çerez banner'ında "Reddet" seçeneğini seçtiğinizde bu çerezler devre dışı kalır.

2.3. Tercih Çerezleri
• fiibi_cookie_consent: Çerez tercih onayınızı saklar
• fiibi_lang: Dil tercihinizi saklar

3. ÜÇÜNCÜ TARAF ÇEREZLERİ
Sitemiz şu anda üçüncü taraf analitik servisleri (Google Analytics, Facebook Pixel vb.) kullanmamaktadır. İleride kullanılması halinde bu politika güncellenecektir.

4. ÇEREZLERİ NASIL YÖNETEBİLİRSİNİZ?

Tarayıcı Ayarları:
Tarayıcınızın ayarlarından çerezleri silebilir, engelleyebilir veya yeni çerezler yerleştirilmeden önce uyarı alabilirsiniz.

• Chrome: Ayarlar → Gizlilik ve Güvenlik → Çerezler
• Firefox: Seçenekler → Gizlilik & Güvenlik
• Safari: Tercihler → Gizlilik
• Edge: Ayarlar → Çerezler ve Site İzinleri

Sitemizin Çerez Tercihi:
Sitemizin alt kısmında gösterilen çerez banner'ında "Kabul Et" veya "Reddet" seçeneğini kullanarak analitik çerezleri açıp kapatabilirsiniz.

5. VERİ SAKLAMA SÜRESİ
• Oturum çerezleri: Belirtilen süre sonunda otomatik silinir
• Tercih çerezleri: Siz silene kadar saklanır
• Analitik veriler: Anonim olarak en fazla 12 ay saklanır

6. İLETİŞİM
Çerez politikamız hakkında sorularınız için bizimle iletişime geçebilirsiniz.

Bu politika, 6698 sayılı Kişisel Verilerin Korunması Kanunu ve ilgili mevzuat kapsamında hazırlanmıştır.
  `.trim();

  return <LegalPageClient title="Çerez Politikası" content={content} />;
}
