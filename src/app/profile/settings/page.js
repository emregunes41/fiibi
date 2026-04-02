import { getCurrentUser } from "../../user-actions";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>Ayarlar</h3>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}>Hesabınızla ilgili tüm tercihleri ve güvenlik ayarlarını yönetin.</p>
      </div>
      <SettingsForm user={user} />
    </div>
  );
}
