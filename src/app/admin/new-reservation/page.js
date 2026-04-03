import { getPackages } from "../core-actions";
import AdminBookingClient from "./AdminBookingClient";

export const dynamic = "force-dynamic";

export default async function AdminNewReservationPage() {
  const packages = await getPackages();
  return <AdminBookingClient initialPackages={packages} />;
}
