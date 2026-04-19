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
export function getSellerAgreement(seller = {}) {
  const sellerName = seller.legalName || seller.businessName || "[Satıcı Adı]";
  const sellerTaxId = seller.taxId || "[VKN/TCKN]";
  const commissionRate = seller.commissionRate ?? PLATFORM.defaultCommissionRate;
  const today = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

  return `
SATICI HİZMET SÖZLEŞMESİ

Tarih: ${today}

TARAFLAR

1. Platform: ${PLATFORM.name} (${PLATFORM.legalName})
   Adres: ${PLATFORM.address}
   VKN: ${PLATFORM.taxId}

2. Satıcı: ${sellerName}
   VKN/TCKN: ${sellerTaxId}

MADDE 1 — KONU
İşbu sözleşme, ${PLATFORM.name} platformu üzerinden Satıcı'nın hizmet ve/veya ürün satışı yapmasına ilişkin tarafların hak ve yükümlülüklerini düzenler.

MADDE 2 — TANIMLAR
2.1. Platform: ${PLATFORM.name} markası altında işletilen çevrimiçi pazaryeri.
2.2. Satıcı: Platform üzerinden hizmet sunan gerçek veya tüzel kişi.
2.3. Alt Üye İşyeri: PayTR ödeme altyapısında Satıcı adına oluşturulan hesap.
2.4. Müşteri: Platform üzerinden hizmet satın alan gerçek kişi.

MADDE 3 — KOMİSYON VE ÖDEME
3.1. Müşteri ödemeleri, ${PLATFORM.name} platformunun ödeme altyapısı (PayTR) aracılığıyla tahsil edilir.
3.2. Platform, her başarılı işlemden %${commissionRate} oranında komisyon keser.
3.3. Kalan tutar, PayTR tarafından Satıcı'nın beyan ettiği IBAN hesabına, işlem tarihinden itibaren PayTR'nin belirlediği sürede (genellikle ertesi iş günü) aktarılır.
3.4. Komisyon oranı, Platform tarafından önceden bildirimle değiştirilebilir.

MADDE 4 — SATICININ YÜKÜMLÜLÜKLERİ
4.1. Satıcı, sunduğu hizmetin kalitesinden ve yasal uygunluğundan bizzat sorumludur.
4.2. Satıcı, vergi ve fatura yükümlülüklerini kendi uhdesinde yerine getirir.
4.3. Satıcı, müşteri ile arasındaki uyuşmazlıkları öncelikle kendi çözmeye çalışacaktır.
4.4. Satıcı, Platform'a beyan ettiği bilgilerin doğruluğunu garanti eder.

MADDE 5 — PLATFORMUN YÜKÜMLÜLÜKLERİ
5.1. Platform, ödeme altyapısının güvenli çalışmasını sağlar.
5.2. Platform, Satıcı'nın hizmetlerini müşterilere sunabilmesi için teknik altyapıyı temin eder.
5.3. Platform, müşteri ile Satıcı arasındaki hizmet ilişkisinin tarafı değildir.

MADDE 6 — FESİH
6.1. Taraflardan herhangi biri, 30 gün öncesinden yazılı bildirimle sözleşmeyi feshedebilir.
6.2. Devam eden ve ödemesi tamamlanmamış işlemler, fesih tarihine bakılmaksızın sonuçlandırılır.
6.3. Platform, Satıcı'nın sözleşme şartlarını ihlal etmesi halinde sözleşmeyi derhal feshedebilir.

MADDE 7 — GİZLİLİK
7.1. Taraflar, iş ilişkisi kapsamında edindikleri bilgileri gizli tutar.
7.2. Müşteri kişisel verileri, KVKK kapsamında korunur.

MADDE 8 — UYUŞMAZLIK
İşbu sözleşmeden doğan uyuşmazlıklarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
`.trim();
}

/**
 * Mesafeli Satış Sözleşmesi
 * 6502 sayılı Tüketicinin Korunması Hakkında Kanun gereği.
 */
export function getDistanceSalesContract(seller = {}, buyer = {}, order = {}) {
  const sellerName = seller.legalName || seller.businessName || "[Satıcı Adı]";
  const buyerName = buyer.name || "[Müşteri Adı]";
  const orderDesc = order.description || "[Hizmet Açıklaması]";
  const orderAmount = order.totalAmount || "[Tutar]";

  return `
MESAFELİ SATIŞ SÖZLEŞMESİ

MADDE 1 — TARAFLAR

SATICI BİLGİLERİ
Unvan: ${sellerName}
Platform: ${PLATFORM.name} (${PLATFORM.legalName})
E-posta: ${PLATFORM.supportEmail}

ALICI BİLGİLERİ  
Ad Soyad: ${buyerName}

MADDE 2 — KONU
İşbu sözleşme, Alıcı'nın ${PLATFORM.name} platformu üzerinden Satıcı'dan satın aldığı aşağıda nitelikleri ve satış fiyatı belirtilen hizmete ilişkin tarafların hak ve yükümlülüklerini düzenler.

MADDE 3 — HİZMET BİLGİLERİ
Hizmet: ${orderDesc}
Toplam Tutar: ${orderAmount} TL (KDV dâhil)

MADDE 4 — GENEL HÜKÜMLER
4.1. Alıcı, satın alma işlemini gerçekleştirmeden önce bu sözleşmeyi ve ön bilgilendirme formunu okuduğunu ve kabul ettiğini beyan eder.
4.2. Ödeme, ${PLATFORM.name} platformunun güvenli ödeme altyapısı üzerinden gerçekleştirilir.
4.3. Satıcı, hizmeti sözleşmede belirtilen süre ve koşullarda sunmakla yükümlüdür.

MADDE 5 — CAYMA HAKKI
5.1. Alıcı, hizmetin ifa edilmeye başlanmadığı durumlarda 14 gün içinde cayma hakkını kullanabilir.
5.2. Cayma hakkının kullanılması halinde, ödeme 14 gün içinde Alıcı'ya iade edilir.
5.3. Hizmetin ifa edilmeye başlanmış olması halinde cayma hakkı kullanılamaz.

MADDE 6 — TESLİM VE İFA
6.1. Hizmet, Satıcı tarafından belirtilen tarih ve koşullarda ifa edilir.
6.2. Mücbir sebep halleri saklıdır.

MADDE 7 — YETKİ
İşbu sözleşmeden doğan uyuşmazlıklarda 6502 sayılı Kanun hükümleri ile Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.
`.trim();
}

/**
 * Ön Bilgilendirme Formu 
 * 6502 sayılı Kanun gereği hizmet satışı öncesi zorunlu bilgilendirme.
 */
export function getPreliminaryInfoForm(seller = {}, order = {}) {
  const sellerName = seller.legalName || seller.businessName || "[Satıcı Adı]";
  const orderDesc = order.description || "[Hizmet Açıklaması]";
  const orderAmount = order.totalAmount || "[Tutar]";

  return `
ÖN BİLGİLENDİRME FORMU

1. SATICI BİLGİLERİ
Unvan: ${sellerName}
Platform: ${PLATFORM.name} (${PLATFORM.legalName})
E-posta: ${PLATFORM.supportEmail}
Telefon: ${PLATFORM.supportPhone}

2. HİZMET BİLGİLERİ
Hizmet Tanımı: ${orderDesc}
Toplam Fiyat: ${orderAmount} TL (KDV dâhil)
Ödeme Şekli: Kredi Kartı / Banka Kartı (${PLATFORM.name} güvenli ödeme altyapısı üzerinden)

3. TESLİM KOŞULLARI
Hizmet, Satıcı tarafından belirtilen tarih ve koşullarda ifa edilecektir. Dijital teslim gerektiren hizmetlerde teslim, ${PLATFORM.name} platformu üzerinden gerçekleştirilir.

4. CAYMA HAKKI
Alıcı, hizmetin ifa edilmeye başlanmadığı durumlarda, 14 (on dört) gün içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir. Cayma hakkının kullanılması halinde ödeme 14 gün içinde iade edilir.

5. ŞİKÂYET VE İTİRAZ
Şikâyet ve itirazlarınızı ${PLATFORM.supportEmail} adresine veya ${PLATFORM.supportPhone} numarasına iletebilirsiniz. Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri'ne başvuru hakkınız saklıdır.

6. ONAY
İşbu ön bilgilendirme formu, mesafeli sözleşmenin kurulmasından önce Alıcı'yı bilgilendirmek amacıyla düzenlenmiştir.
`.trim();
}

/**
 * KVKK Aydınlatma Metni
 * 6698 sayılı Kişisel Verilerin Korunması Kanunu gereği.
 */
export function getKVKKText() {
  return `
KİŞİSEL VERİLERİN KORUNMASI HAKKINDA AYDINLATMA METNİ

${PLATFORM.name} (${PLATFORM.legalName}) olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla, kişisel verilerinizin işlenmesine ilişkin sizi bilgilendirmek isteriz.

1. VERİ SORUMLUSU
${PLATFORM.legalName}
Adres: ${PLATFORM.address}
E-posta: ${PLATFORM.supportEmail}

2. İŞLENEN KİŞİSEL VERİLER
Platform hizmetlerinin sunulması kapsamında aşağıdaki kişisel verileriniz işlenmektedir:
• Kimlik bilgileri (ad, soyad, T.C. kimlik numarası)
• İletişim bilgileri (e-posta, telefon numarası, adres)
• Finansal bilgiler (IBAN, ödeme bilgileri)
• İşlem bilgileri (rezervasyon detayları, satın alma geçmişi)
• Dijital iz bilgileri (IP adresi, çerezler, oturum bilgileri)

3. KİŞİSEL VERİLERİN İŞLENME AMAÇLARI
Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
• Platform hizmetlerinin sunulması ve iyileştirilmesi
• Ödeme işlemlerinin gerçekleştirilmesi
• Yasal yükümlülüklerin yerine getirilmesi
• Müşteri ilişkileri yönetimi ve destek hizmetleri
• İstatistiksel analizler ve raporlama
• Bilgi güvenliği süreçlerinin yürütülmesi

4. KİŞİSEL VERİLERİN AKTARILMASI
Kişisel verileriniz, hizmetin gerektirdiği ölçüde:
• Ödeme hizmet sağlayıcısı (PayTR) ile
• Yasal yükümlülükler kapsamında kamu kurumları ile
• Bulut altyapı hizmet sağlayıcıları ile paylaşılabilir.

5. KİŞİSEL VERİLERİN SAKLANMA SÜRESİ
Kişisel verileriniz, işleme amacının gerektirdiği süre boyunca ve yasal saklama süreleri çerçevesinde muhafaza edilir.

6. VERİ SAHİBİ OLARAK HAKLARINIZ
KVKK'nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:
• Kişisel verilerinizin işlenip işlenmediğini öğrenme
• Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme
• Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme
• Kişisel verilerinizin düzeltilmesini veya silinmesini isteme
• Kişisel verilerinizin aktarıldığı üçüncü kişileri bilme
• İşlenen verilerinizin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme

Haklarınıza ilişkin taleplerinizi ${PLATFORM.supportEmail} adresine iletebilirsiniz.

7. ÇEREZ POLİTİKASI
${PLATFORM.name} platformu, hizmet kalitesinin artırılması amacıyla çerez (cookie) teknolojisi kullanmaktadır. Zorunlu çerezler dışındaki çerezler için kullanıcı onayı alınır.

İşbu aydınlatma metni, KVKK'nın 10. maddesi uyarınca hazırlanmış olup, ${PLATFORM.name} tarafından gerekli görüldüğünde güncellenebilir.
`.trim();
}
