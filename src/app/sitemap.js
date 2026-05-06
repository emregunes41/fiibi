import { headers } from "next/headers";
import { getCurrentTenant } from "@/lib/tenant";

export default async function sitemap() {
  const tenant = await getCurrentTenant();
  const headersList = await headers();
  const host = headersList.get("host") || "fiibi.co";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  // Platform Ana Sayfası (fiibi.co)
  if (!tenant) {
    return [
      {
        url: `${baseUrl}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 1,
      },
      {
        url: `${baseUrl}/login`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.8,
      },
      {
        url: `${baseUrl}/register`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.8,
      }
    ];
  }

  // Tenant Sayfaları (Stüdyo/Doktor vb.)
  const routes = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/booking`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/portfolio`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    }
  ];

  return routes;
}
