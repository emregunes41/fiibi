import { isSuperAdmin } from "@/app/actions/super-admin";
import { redirect } from "next/navigation";
import SuperAdminClient from "./SuperAdminClient";

export const metadata = {
  title: "Super Admin — Platform Yönetimi",
};

export default async function SuperAdminPage() {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) redirect("/super-admin/login");

  return <SuperAdminClient />;
}
