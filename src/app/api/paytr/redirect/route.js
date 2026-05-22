import { NextResponse } from "next/server";

function generateRedirectHtml(returnTo) {
  return `
    <!DOCTYPE html>
    <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <title>Yönlendiriliyor...</title>
        <style>
          body {
            margin: 0; padding: 0; background-color: #000; color: #fff;
            display: flex; align-items: center; justify-content: center; height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .loader {
            border: 3px solid rgba(255,255,255,0.1);
            border-top: 3px solid #fff;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin-right: 15px;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="loader"></div>
        <div>Yönlendiriliyorsunuz, lütfen bekleyin...</div>
        <script>
          // Eğer iframe içindeyse (PayTR iframe'i gibi), ana pencereyi (top) yönlendirir.
          try {
            window.top.location.href = "${returnTo}";
          } catch (e) {
            window.location.href = "${returnTo}";
          }
        </script>
      </body>
    </html>
  `;
}

export async function POST(req) {
  const url = new URL(req.url);
  const returnTo = url.searchParams.get("returnTo") || "/profile";
  
  return new NextResponse(generateRedirectHtml(returnTo), {
    headers: { "Content-Type": "text/html" },
  });
}

export async function GET(req) {
  const url = new URL(req.url);
  const returnTo = url.searchParams.get("returnTo") || "/profile";
  
  return new NextResponse(generateRedirectHtml(returnTo), {
    headers: { "Content-Type": "text/html" },
  });
}
