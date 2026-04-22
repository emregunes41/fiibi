import { getCurrentTenant } from "@/lib/tenant";
import SozlesmeClient from "./SozlesmeClient";
import { PLATFORM } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export async function generateMetadata() {
  const tenant = await getCurrentTenant();
  const biz = tenant?.businessName || PLATFORM.name;
  return {
    title: `Yasal Sözleşmeler | ${biz}`,
    description: `${biz} yasal metinler ve sözleşmeler.`,
  };
}

export default async function SozlesmePage() {
  const tenant = await getCurrentTenant();
  let config = null;
  
  if (tenant) {
    config = await prisma.siteConfig.findFirst({
      where: { tenantId: tenant.id }
    });
  }
  
  return <SozlesmeClient tenant={tenant} config={config} />;
}
