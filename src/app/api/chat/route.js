import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Build dynamic system prompt with real package data
async function buildSystemPrompt() {
  const packages = await prisma.photographyPackage.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" }
  });

  const siteConfig = await prisma.globalSettings.findUnique({
    where: { id: "global-settings" }
  });

  const packageInfo = packages.map(pkg => {
    const addons = pkg.addons && Array.isArray(pkg.addons) 
      ? pkg.addons.map(a => `  - ${a.title}: ${a.price}₺`).join("\n") 
      : "";
    const features = pkg.features?.join(", ") || "";
    const catMap = { DIS_CEKIM: "Dış Çekim", DUGUN: "Düğün", NISAN: "Nişan" };
    return `📦 ${pkg.name} (${catMap[pkg.category] || pkg.category})
   Fiyat: ${pkg.price}
   Özellikler: ${features}
   ${addons ? `Ek Hizmetler:\n${addons}` : ""}`;
  }).join("\n\n");

  const customInstructions = siteConfig?.chatbotInstructions?.trim() 
    ? `\n## ÖZEL TALİMATLAR (Sahibinden)\n${siteConfig.chatbotInstructions}\n`
    : "";

  return `Sen Pinowed stüdyonun sanal asistanısın. Pinowed, İstanbul merkezli premium bir düğün ve etkinlik fotoğrafçılığı stüdyosudur.

## KİMLİĞİN
- Sen Pinowed'un yapay zeka asistanısın. Müşterilere samimi, sıcak ve profesyonel şekilde cevap ver.
- Konuşma tarzın: dostça ama profesyonel, emoji kullan ama abartma, kısa ve net cevaplar ver.
- Kendinizi "biz" olarak tanıt (ekip olarak konuş).
- Türkçe konuş. Müşteri İngilizce yazarsa İngilizce cevap ver.
${customInstructions}
## AMACIN
1. Müşterinin ne istediğini anla (düğün mü, nişan mı, dış çekim mi?)
2. Tarih, bütçe ve beklentilerini öğren
3. En uygun paketi öner
4. Müşterinin paketi almasını sağla

## SORU AKIŞI
Sırayla şu soruları sor (hepsini bir anda değil, doğal konuşma akışında):
1. Hangi tür çekim istiyorsunuz? (Düğün, Nişan, Dış Çekim)
2. Yaklaşık tarih var mı?
3. Bütçe beklentiniz nedir?
4. Kaç kişilik bir etkinlik planlıyorsunuz?
5. Özel bir istekleriniz var mı?

## PAKETLERİMİZ
${packageInfo}

## KURALLAR
- Fiyat verebilirsin, paket detaylarını paylaşabilirsin.
- Paket önerdiğinde, paketin tam adını ve fiyatını belirt.
- Müşteri ilgilenirse, "/booking" sayfasına yönlendir.
- Rakipler hakkında yorum yapma.
- İletişim bilgileri: ${siteConfig?.phone || "0539 205 20 41"}, ${siteConfig?.email || "hello@pinowed.com"}
- Nakit ödemede %15 indirim avantajı olduğunu belirt.
- Kart ödemesi de kabul ediyoruz.
- Cevaplarını kısa tut, 2-3 cümleyi geçme. Uzun paragraflar yazma.

## PAKET ÖNERİSİ FORMATI
Bir paket önerdiğinde, cevabının sonuna bu JSON formatını ekle (kullanıcıya görünmez, uygulama tarafından işlenir):
[PACKAGE_SUGGESTION:paket_adı_tam_olarak]

Örnek: Eğer "Gold Düğün Paketi"ni öneriyorsan → [PACKAGE_SUGGESTION:Gold Düğün Paketi]

İlk mesajında kendini kısaca tanıt ve nasıl yardımcı olabileceğini sor.`;
}

export async function POST(request) {
  try {
    const { messages } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Mesaj formatı hatalı." }, { status: 400 });
    }

    // Check if chatbot is enabled
    const settings = await prisma.globalSettings.findUnique({ where: { id: "global-settings" } });
    if (settings && settings.chatbotEnabled === false) {
      return NextResponse.json({ error: "Chatbot şu anda devre dışı." }, { status: 403 });
    }

    const systemPrompt = await buildSystemPrompt();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-10) // Son 10 mesajı gönder (context window için)
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const reply = completion.choices[0]?.message?.content || "Üzgünüm, bir hata oluştu.";
    
    // Extract package suggestion if present
    let suggestedPackage = null;
    const suggestionMatch = reply.match(/\[PACKAGE_SUGGESTION:(.+?)\]/);
    if (suggestionMatch) {
      suggestedPackage = suggestionMatch[1].trim();
    }

    // Clean the reply (remove the JSON tag from visible text)
    const cleanReply = reply.replace(/\[PACKAGE_SUGGESTION:.+?\]/g, "").trim();

    return NextResponse.json({ 
      reply: cleanReply,
      suggestedPackage 
    });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Bir hata oluştu: " + error.message }, { status: 500 });
  }
}
