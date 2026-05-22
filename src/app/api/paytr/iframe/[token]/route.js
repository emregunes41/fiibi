import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { token } = params;

  if (!token) {
    return new NextResponse("Token is required", { status: 400 });
  }

  // Bu HTML, her zaman fiibi.co üzerinden render edileceği için 
  // PayTR tarafında "Referer" olarak fiibi.co görünecek ve güvenlik kontrolünü geçecektir.
  const html = `
    <!DOCTYPE html>
    <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Güvenli Ödeme</title>
        <style>
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: transparent; }
          iframe { width: 100%; height: 100%; border: none; }
        </style>
      </head>
      <body>
        <iframe src="https://www.paytr.com/odeme/guvenli/${token}" id="paytriframe" frameborder="0" scrolling="no"></iframe>
        <script>
          window.addEventListener('message', function(event) {
            // Forward PayTR iframe resize and other messages to the top parent
            if(event.data && typeof event.data === 'string' && event.data.indexOf('paytr_') === 0) {
                window.parent.postMessage(event.data, '*');
            }
          });
        </script>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
