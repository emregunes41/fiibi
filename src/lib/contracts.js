/**
 * Yasal Sözleşme Şablonları
 * Platform adı PLATFORM.name üzerinden dinamik olarak gelir.
 * Tenant (satıcı) bilgileri parametre olarak geçirilir.
 */

import { PLATFORM } from "./constants";

/**
 * Satıcı Hizmet Sözleşmesi
 * Platform ile satıcı (tenant) arasında imzalanan ana sözleşme.
 */
/**
 * Müşteri Hizmet Sözleşmesi
 * Satıcı (Tenant) ile Müşteri arasında imzalanan ana sözleşme.
 */
export function getServiceAgreement(seller = {}) {
  const sellerName = seller.legalName || seller.businessName || "[Firma Ünvanı]";
  const sellerTaxId = seller.taxId || "[VKN/TCKN]";
  const sellerAddress = seller.legalAddress || "[Firma Adresi]";
  const today = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

  return `
HİZMET SÖZLEŞMESİ

Tarih: ${today}

TARAFLAR

1. Hizmet Veren (Satıcı): ${sellerName}
   Adres: ${sellerAddress}
   VKN/TCKN: ${sellerTaxId}

2. Müşteri (Alıcı): [Müşteri Adı Soyadı]

MADDE 1 — KONU
İşbu sözleşme, Hizmet Veren'in Müşteri'ye sunacağı hizmetlerin niteliği, süresi ve koşullarını ile tarafların hak ve yükümlülüklerini düzenler.

MADDE 2 — HİZMET BEDELİ VE ÖDEME
2.1. Alınan hizmetin veya siparişin toplam bedeli ödeme sayfasında belirtilen tutardır.
2.2. Müşteri, ödemeyi Hizmet Veren'in sunduğu ödeme yöntemleriyle (Kredi Kartı/Banka Kartı vb.) yapmayı kabul eder.

MADDE 3 — TARAFLARIN YÜKÜMLÜLÜKLERİ
3.1. Hizmet Veren, anlaşılan hizmeti tam ve eksiksiz olarak, belirtilen tarih ve şartlarda yerine getirmeyi kabul ve taahhüt eder.
3.2. Müşteri, hizmetin ifası için gerekli bilgileri doğru ve eksiksiz vermeyi kabul eder.
3.3. Randevu/Hizmet iptalleri, Hizmet Veren'in belirlediği iptal politikalarına (önceden bildirim süresi vb.) tabidir. Belirtilen süreden sonra yapılan iptallerde Hizmet Veren ücret kesintisi yapabilir.

MADDE 4 — FESİH VE CAYMA HAKKI
4.1. Müşteri, hizmetin ifasına başlanmadan önce 14 gün içinde cayma hakkını kullanabilir.
4.2. Ancak müşterinin talebi üzerine anında ifa edilen hizmetlerde veya tarih/saat belirtilmiş randevulu hizmetlerde yasal cayma hakkı istisnaları uygulanabilir.

MADDE 5 — UYUŞMAZLIKLARIN ÇÖZÜMÜ
İşbu sözleşmeden doğabilecek uyuşmazlıklarda yasal sınırlar dâhilinde Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.
`.trim();
}

/**
 * Mesafeli Satış Sözleşmesi
 * 6502 sayılı Tüketicinin Korunması Hakkında Kanun gereği.
 */
export function getDistanceSalesContract(seller = {}) {
  const sellerName = seller.legalName || seller.businessName || "[Firma Ünvanı]";
  const sellerEmail = seller.email || "[Firma E-posta]";
  const sellerAddress = seller.legalAddress || "[Firma Adresi]";

  return `
MESAFELİ SATIŞ SÖZLEŞMESİ

MADDE 1 — TARAFLAR

SATICI BİLGİLERİ
Unvan: ${sellerName}
Adres: ${sellerAddress}
E-posta: ${sellerEmail}

ALICI BİLGİLERİ  
Ad Soyad: [Müşteri Adı]
E-posta: [Müşteri E-posta]

MADDE 2 — KONU
İşbu sözleşme, Alıcı'nın Satıcı'ya ait internet sitesi veya portal üzerinden elektronik ortamda siparişini yaptığı hizmetin/ürünün satışı ve teslimi ile ilgili olarak tarafların hak ve yükümlülüklerini düzenler.

MADDE 3 — GENEL HÜKÜMLER
3.1. Alıcı, satın alma işlemini gerçekleştirmeden önce bu sözleşmeyi ve ön bilgilendirme formunu okuduğunu ve elektronik ortamda gerekli teyidi verdiğini kabul eder.
3.2. Satıcı, sözleşme konusu hizmet/ürünü eksiksiz ve siparişte belirtilen niteliklere uygun olarak sunmakla yükümlüdür.

MADDE 4 — CAYMA HAKKI
4.1. Alıcı, hizmetin ifa edilmeye başlanmadığı durumlarda 14 gün içinde hiçbir hukuki ve cezai sorumluluk üstlenmeksizin sözleşmeden cayma hakkına sahiptir.
4.2. Cayma hakkının kullanılması halinde, ödenen tutar 14 gün içinde Alıcı'ya iade edilir.
4.3. Tarihi ve saati belirlenmiş olan etkinlik, fotoğraf çekimi, danışmanlık gibi randevulu hizmetlerde cayma hakkı istisnaları geçerli olabilir.

MADDE 5 — YETKİ
İşbu sözleşmeden doğan uyuşmazlıklarda 6502 sayılı Kanun hükümleri gereğince Alıcı'nın veya Satıcı'nın yerleşim yerindeki Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.
`.trim();
}

/**
 * Ön Bilgilendirme Formu 
 * 6502 sayılı Kanun gereği hizmet satışı öncesi zorunlu bilgilendirme.
 */
export function getPreliminaryInfoForm(seller = {}) {
  const sellerName = seller.legalName || seller.businessName || "[Firma Ünvanı]";
  const sellerEmail = seller.email || "[Firma E-posta]";
  const sellerPhone = seller.phone || "[Firma Telefon]";
  const sellerAddress = seller.legalAddress || "[Firma Adresi]";

  return `
ÖN BİLGİLENDİRME FORMU

1. SATICI BİLGİLERİ
Unvan: ${sellerName}
Adres: ${sellerAddress}
E-posta: ${sellerEmail}
Telefon: ${sellerPhone}

2. HİZMET BİLGİLERİ VE TESLİM KOŞULLARI
Hizmetin veya ürünün detayları, tutarı ve ödeme bilgileri sipariş ve ödeme onay ekranında Alıcı'ya gösterilmiştir. Hizmet, Satıcı tarafından belirtilen tarih ve şartlarda ifa edilecektir.

3. CAYMA HAKKI
Alıcı, hizmetin ifa edilmeye başlanmadığı durumlarda, 14 (on dört) gün içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin cayma hakkına sahiptir. Özel tarihli organizasyon ve randevu gerektiren hizmetlerde yasal cayma hakkı istisnaları geçerlidir.

4. ŞİKÂYET VE İTİRAZ
Şikâyet ve itirazlarınızı doğrudan ${sellerEmail} adresine veya ${sellerPhone} numarasına iletebilirsiniz. Yasal itirazlar için Tüketici Hakem Heyetleri yetkilidir.

5. ONAY
İşbu ön bilgilendirme formu, mesafeli sözleşmenin kurulmasından önce Alıcı'yı bilgilendirmek amacıyla düzenlenmiştir ve Alıcı tarafından elektronik olarak onaylandığında geçerlilik kazanır.
`.trim();
}

/**
 * KVKK Aydınlatma Metni
 * 6698 sayılı Kişisel Verilerin Korunması Kanunu gereği.
 */
export function getKVKKText(seller = {}) {
  const sellerName = seller.legalName || seller.businessName || "[Firma Ünvanı]";
  const sellerEmail = seller.email || "[Firma E-posta]";
  const sellerAddress = seller.legalAddress || "[Firma Adresi]";

  return `
KİŞİSEL VERİLERİN KORUNMASI HAKKINDA AYDINLATMA METNİ

${sellerName} olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla, kişisel verilerinizin işlenmesine ilişkin sizi bilgilendirmek isteriz.

1. VERİ SORUMLUSU
Unvan: ${sellerName}
Adres: ${sellerAddress}
E-posta: ${sellerEmail}

2. İŞLENEN KİŞİSEL VERİLER
Sizlere hizmet sunabilmemiz için; Kimlik bilgileriniz (ad, soyad), İletişim bilgileriniz (e-posta, telefon) ve varsa işlem bilgileri/ödeme detaylarınız işlenmektedir.

3. KİŞİSEL VERİLERİN İŞLENME AMAÇLARI
Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
• Randevu ve sipariş işlemlerinin gerçekleştirilmesi
• Tarafınıza sağlanacak hizmetlerin eksiksiz ifası
• Yasal ve finansal yükümlülüklerin (fatura vb.) yerine getirilmesi
• İletişim süreçlerinin yönetilmesi

4. KİŞİSEL VERİLERİN AKTARILMASI
Kişisel verileriniz, yalnızca hizmetin gerektirdiği ölçüde yetkili ödeme altyapı sağlayıcıları, kargo/kurye şirketleri ve yasal yükümlülükler doğrultusunda kamu kurumları ile paylaşılabilir.

5. VERİ SAHİBİ OLARAK HAKLARINIZ
KVKK'nın 11. maddesi kapsamında; verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, düzeltilmesini veya silinmesini isteme hakkına sahipsiniz.
Taleplerinizi ${sellerEmail} adresine yazılı olarak iletebilirsiniz.
`.trim();
}
