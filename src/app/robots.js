import { headers } from "next/headers";
import { getCurrentTenant } from "@/lib/tenant";

export default async function robots() {
  const tenant = await getCurrentTenant();
  const headersList = await headers();
  const host = headersList.get("host") || "fiibi.co";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  // Admin and profile pages should never be indexed
  const disallowRules = [
    "/admin/",
    "/profile/",
    "/api/",
  ];

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: disallowRules,
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
