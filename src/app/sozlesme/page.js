import { getCurrentTenant } from "@/lib/tenant";
import SozlesmeClient from "./SozlesmeClient";
import { PLATFORM } from "@/lib/constants";

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
  return <SozlesmeClient tenant={tenant} />;
}
