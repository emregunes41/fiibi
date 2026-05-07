import { getCurrentTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Calendar, FileText } from "lucide-react";
import { getBusinessType } from "@/lib/business-types";

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const tenant = await getCurrentTenant();
  
  if (!tenant) {
    return (
      <div style={{ padding: "100px 20px", textAlign: "center", color: "var(--text, #fff)" }}>
        <h1>Blog bulunamadı.</h1>
        <Link href="/" style={{ color: "var(--accent, #fff)" }}>Ana Sayfaya Dön</Link>
      </div>
    );
  }

  const posts = await prisma.post.findMany({
    where: { 
      tenantId: tenant.id,
      isPublished: true 
    },
    orderBy: { publishedAt: "desc" }
  });

  const siteConfig = await prisma.globalSettings.findFirst({
    where: { tenantId: tenant.id }
  });

  const bt = getBusinessType(tenant.businessType);

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg, #0a0a0a)", color: "var(--text, #fff)", padding: "40px 20px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        
        <div style={{ marginBottom: 40 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            <ArrowLeft size={16} /> Ana Sayfaya Dön
          </Link>
        </div>

        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, marginBottom: 16, letterSpacing: "-0.03em" }}>
          Blog & Haberler
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.1rem", marginBottom: 48, lineHeight: 1.6 }}>
          {siteConfig?.businessName || bt.terms.brandSuffix} tarafından paylaşılan son yazılar, ipuçları ve güncellemeler.
        </p>

        {posts.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "var(--radius, 12px)" }}>
            <FileText size={48} style={{ color: "rgba(255,255,255,0.2)", margin: "0 auto 16px" }} />
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>Henüz yayınlanmış bir yazı bulunmuyor.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 32 }}>
            {posts.map(post => (
              <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: "none", display: "block" }}>
                <article style={{ 
                  background: "rgba(255,255,255,0.03)", 
                  border: "1px solid rgba(255,255,255,0.08)", 
                  borderRadius: "var(--radius, 12px)", 
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                }} className="hover:border-white/20 hover:bg-white/5">
                  
                  {post.imageUrl && (
                    <div style={{ width: "100%", height: 240, overflow: "hidden" }}>
                      <img src={post.imageUrl} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}

                  <div style={{ padding: "32px 24px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: 12, display: "flex", gap: 12 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }} suppressHydrationWarning>
                        <Calendar size={14} /> {new Date(post.publishedAt).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 12px 0", color: "#fff", lineHeight: 1.3 }}>
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {post.excerpt}
                      </p>
                    )}
                    <div style={{ marginTop: 24, fontSize: 14, fontWeight: 700, color: "var(--accent, #fff)", display: "flex", alignItems: "center", gap: 6 }}>
                      Devamını Oku <ArrowLeft size={16} style={{ transform: "rotate(180deg)" }} />
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
