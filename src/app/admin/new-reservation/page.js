import { getPackages, getSiteConfig } from "../core-actions";
import AdminBookingClient from "./AdminBookingClient";
import AdminSimpleBookingClient from "./AdminSimpleBookingClient";
import { getCurrentTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function AdminNewReservationPage() {
  const packages = await getPackages();
  const tenant = await getCurrentTenant();
  const siteConfig = await getSiteConfig();
  const blockedDays = siteConfig?.blockedDays || [];
  const isPhotographer = (tenant?.businessType || "photographer") === "photographer";

  if (isPhotographer) {
    return <AdminBookingClient initialPackages={packages} />;
  }

  return <AdminSimpleBookingClient initialPackages={packages} blockedDays={blockedDays} />;
}
