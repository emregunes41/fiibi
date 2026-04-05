"use server";

/**
 * Netgsm SMS Gönderme
 * Dökümantasyon: https://www.netgsm.com.tr/dokuman
 */
export async function sendSMS(phone, message, settings) {
  try {
    const { netgsmUsercode, netgsmPassword, netgsmMsgHeader } = settings;

    if (!netgsmUsercode || !netgsmPassword || !netgsmMsgHeader) {
      console.warn("Netgsm API bilgileri eksik, SMS atlanıyor.");
      return { success: false, error: "Netgsm API bilgileri eksik" };
    }

    // Türkiye telefon formatını düzelt: +90 5XX → 905XX
    const cleanPhone = phone
      .replace(/\s+/g, "")
      .replace(/^\+/, "")
      .replace(/^0/, "90");

    // Netgsm XML API
    const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<mainbody>
  <header>
    <company dession="1"/>
    <usercode>${netgsmUsercode}</usercode>
    <password>${netgsmPassword}</password>
    <type>1:n</type>
    <msgheader>${netgsmMsgHeader}</msgheader>
  </header>
  <body>
    <msg><![CDATA[${message}]]></msg>
    <no>${cleanPhone}</no>
  </body>
</mainbody>`;

    const response = await fetch("https://api.netgsm.com.tr/sms/send/xml", {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: xmlBody,
    });

    const result = await response.text();
    console.log("Netgsm yanıt:", result);

    // Netgsm başarılı yanıtlar "00" veya "01" ile başlar
    if (result.startsWith("00") || result.startsWith("01")) {
      return { success: true, data: result };
    }

    return { success: false, error: `Netgsm hata kodu: ${result}` };
  } catch (err) {
    console.error("SMS gönderme hatası:", err);
    return { success: false, error: err.message };
  }
}
