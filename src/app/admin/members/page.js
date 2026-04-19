import { prisma } from "@/lib/prisma";
import { User as UserIcon, Mail, Phone, Calendar } from "lucide-react";
import Image from "next/image";
import { getCurrentTenant } from "@/lib/tenant";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";

import ResetPasswordButton from "./ResetPasswordButton";
import DeleteUserButton from "./DeleteUserButton";

async function getMembersTenantId() {
  const tenant = await getCurrentTenant();
  if (tenant?.id) return tenant.id;
  try {
    const cookieStore = await cookies();
    const t = cookieStore.get("admin_token")?.value;
    if (t) { const p = await verifyAuth(t); if (p?.tenantId) return p.tenantId; }
  } catch (e) {}
  return "NONE";
}

export default async function AdminMembersPage() {
  const tenantId = await getMembersTenantId();
  const users = await prisma.user.findMany({
    where: { tenantId },
    include: { reservations: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div style={{ color: "#fff" }}>
      {/* Header Compact */}
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "clamp(1.2rem, 4vw, 1.8rem)", fontWeight: 900, letterSpacing: "-0.03em", margin: 0 }}>
          Üye Yönetimi
        </h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.75rem", marginTop: "4px" }}>
          Toplam {users.length} üye
        </p>
      </div>

      {/* Member Cards List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {users.map((user) => (
          <div key={user.id} style={{
            padding: "10px 12px",
            borderRadius: 0,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              {/* Avatar Compact */}
              {user.image ? (
                <div style={{ width: "32px", height: "32px", borderRadius: 0, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
                  <Image src={user.image} alt="" width={32} height={32} style={{ objectFit: "cover" }} />
                </div>
              ) : (
                <div style={{ 
                  width: "32px", height: "32px", borderRadius: 0, background: "rgba(255,255,255,0.05)", 
                  display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)", flexShrink: 0
                }}>
                  <UserIcon size={14} />
                </div>
              )}
              
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name || "İsimsiz"}
                </div>
                <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Mail size={10} /> {user.email}
                </div>
                {/* Extra Member Info */}
                <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.15)", marginTop: "2px", letterSpacing: "0.02em" }}>
                  {user.age && `YAŞ: ${user.age} • `}
                  {user.gender && `${user.gender.toUpperCase()} • `}
                  {user.password ? `ŞİFRE (HASH): ${user.password.substring(0, 20)}...` : "ŞİFRE YOK"}
                </div>
                {user.reservations?.length > 0 && (
                  <div style={{ fontSize: "0.55rem", color: "rgba(168, 85, 247, 0.5)", marginTop: "1px", fontWeight: "bold" }}>
                    REZ: {user.reservations.map(r => new Date(r.eventDate).toLocaleDateString("tr-TR")).join(", ")}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
              {/* Info Tags Compact */}
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                {user.phone && (
                  <span style={{ fontSize: "0.6rem", background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: 0, color: "rgba(255,255,255,0.4)" }}>
                    {user.phone}
                  </span>
                )}
                {user.role === "ADMIN" && (
                  <span style={{ fontSize: "0.6rem", background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 0, color: "#fff", fontWeight: 800 }}>
                    ADMIN
                  </span>
                )}
                <ResetPasswordButton userId={user.id} />
                <DeleteUserButton userId={user.id} userName={user.name} role={user.role} />
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", gap: "3px", justifyContent: "flex-end" }}>
                  <Calendar size={10} /> {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                </div>
              </div>
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
            Henüz üye yok.
          </div>
        )}
      </div>
    </div>
  );
}
