import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Instagram, MapPin, Calendar, Link2, ShoppingBag, Youtube, MessageCircle, Image as ImageIcon } from "lucide-react";
import LinksClient from "./LinksClient";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const tenant = await getCurrentTenant();
  if (!tenant) return { title: "Bağlantılar" };
  const siteConfig = await prisma.globalSettings.findUnique({ where: { tenantId: tenant.id } });
  return {
    title: `${siteConfig?.businessName || tenant.businessName} | Bağlantılar`,
    description: siteConfig?.seoDescription || `${tenant.businessName} resmi bağlantıları`,
  };
}

export default async function LinksPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/");

  const siteConfig = await prisma.globalSettings.findUnique({
    where: { tenantId: tenant.id },
  });

  const bioLinks = await prisma.bioLink.findMany({
    where: { tenantId: tenant.id, isActive: true },
    orderBy: { order: "asc" },
  });

  const iconMap = {
    instagram: <Instagram size={20} />,
    whatsapp: <MessageCircle size={20} />,
    youtube: <Youtube size={20} />,
    map: <MapPin size={20} />,
    calendar: <Calendar size={20} />,
    image: <ImageIcon size={20} />,
    "shopping-bag": <ShoppingBag size={20} />,
    link: <Link2 size={20} />,
  };

  const getIcon = (name) => {
    return iconMap[name] || iconMap.link;
  };

  const businessName = siteConfig?.businessName || tenant.businessName;
  const logoUrl = siteConfig?.logoUrl;
  const bgType = siteConfig?.heroBgType || "color";
  const bgUrl = siteConfig?.heroBgUrl;
  const bgColor = siteConfig?.heroBgColor || "#000000";
  const footerTagline = siteConfig?.footerTagline;

  return (
    <LinksClient 
      bioLinks={bioLinks}
      businessName={businessName}
      logoUrl={logoUrl}
      bgType={bgType}
      bgUrl={bgUrl}
      bgColor={bgColor}
      footerTagline={footerTagline}
    />
  );
}
