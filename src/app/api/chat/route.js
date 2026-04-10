import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Build dynamic system prompt
async function buildSystemPrompt() {
  const siteConfig = await prisma.globalSettings.findUnique({
    where: { id: "global-settings" }
  });

  const customInstructions = siteConfig?.chatbotInstructions?.trim() 
    ? `\n## ÖZEL TALİMATLAR (Sahibinden)\n${siteConfig.chatbotInstructions}\n`
    : "";

  return `Sen Pinowed stüdyonun sanal asistanısın. Pinowed, premium bir düğün ve etkinlik fotoğrafçılığı stüdyosudur.

## KİMLİĞİN
- Sen Pinowed'un yapay zeka asistanısın. Müşterilere samimi, sıcak ve profesyonel şekilde cevap ver.
- Konuşma tarzın: dostça ama profesyonel, emoji kullan ama abartma, kısa ve net cevaplar ver.
- Kendinizi "biz" olarak tanıt (ekip olarak konuş).
- Türkçe konuş. Müşteri İngilizce yazarsa İngilizce cevap ver.
${customInstructions}
## AMACIN
1. Müşterinin ne istediğini anla (düğün mü, nişan mı, dış çekim mi?)
2. Tarih ve beklentilerini öğren
3. Müşteriyi bilgilendir ve rezervasyon sayfasına yönlendir

## KURALLAR
- Paket fiyatları ve detayları hakkında bilgi verme. Detaylar için "/booking" sayfasına yönlendir.
- Rakipler hakkında yorum yapma.
- İletişim bilgileri: ${siteConfig?.phone || "0539 205 20 41"}, ${siteConfig?.email || "hello@pinowed.com"}
- Cevaplarını kısa tut, 2-3 cümleyi geçme. Uzun paragraflar yazma.

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
