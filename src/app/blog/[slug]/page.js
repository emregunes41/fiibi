import { getCurrentTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const tenant = await getCurrentTenant();
  if (!tenant) return {};

  const post = await prisma.post.findFirst({
    where: { slug: params.slug, tenantId: tenant.id, isPublished: true }
  });

  if (!post) return {};

  return {
    title: `${post.title} | Blog`,
    description: post.excerpt || `${post.title} hakkında detaylı yazı.`,
    openGraph: {
      images: post.imageUrl ? [post.imageUrl] : [],
    }
  };
}

export default async function SinglePostPage({ params }) {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();

  const post = await prisma.post.findFirst({
    where: { 
      slug: params.slug,
      tenantId: tenant.id,
      isPublished: true 
    }
  });

  if (!post) notFound();

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg, #0a0a0a)", color: "var(--text, #fff)", padding: "40px 20px" }}>
      <article style={{ maxWidth: 800, margin: "0 auto" }}>
        
        <div style={{ marginBottom: 40 }}>
          <Link href="/#blog" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "rgba(0,0,0,0.6)", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            <ArrowLeft size={16} /> Ana Sayfaya Dön
          </Link>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(0,0,0,0.55)", marginBottom: 16, display: "flex", gap: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }} suppressHydrationWarning>
            <Calendar size={14} /> {new Date(post.publishedAt).toLocaleDateString("tr-TR")}
          </span>
        </div>

        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, marginBottom: 32, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
          {post.title}
        </h1>

        {post.imageUrl && (
          <div style={{ width: "100%", borderRadius: "var(--radius, 12px)", overflow: "hidden", marginBottom: 48 }}>
            <img src={post.imageUrl} alt={post.title} style={{ width: "100%", height: "auto", objectFit: "cover", maxHeight: "60vh" }} />
          </div>
        )}

        <div 
          style={{ fontSize: "1.1rem", lineHeight: 1.8, color: "rgba(0,0,0,0.8)" }}
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: post.content }} 
        />
      </article>

      {/* Basic CSS for HTML content rendered from string */}
      <style dangerouslySetInnerHTML={{ __html: `
        .blog-content p { margin-bottom: 1.5em; }
        .blog-content h2 { font-size: 1.8rem; font-weight: 800; margin: 2em 0 1em; color: #fff; }
        .blog-content h3 { font-size: 1.4rem; font-weight: 700; margin: 1.5em 0 1em; color: #fff; }
        .blog-content ul, .blog-content ol { margin-bottom: 1.5em; padding-left: 1.5em; }
        .blog-content li { margin-bottom: 0.5em; }
        .blog-content a { color: var(--accent, #fff); text-decoration: underline; }
        .blog-content blockquote { border-left: 4px solid var(--accent, #fff); padding-left: 1em; margin-left: 0; font-style: italic; color: rgba(0,0,0,0.6); }
        .blog-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 2em 0; }
      `}} />
    </main>
  );
}
