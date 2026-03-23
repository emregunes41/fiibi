import { prisma } from "@/lib/prisma";
import { User as UserIcon, Mail, Phone, Calendar, UserCircle } from "lucide-react";
import Image from "next/image";

export default async function AdminMembersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div style={{ color: "#fff" }}>
      <div style={{ marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: "0.5rem" }}>
          Üye Yönetimi
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.1rem" }}>
          Sisteme kayıtlı toplam {users.length} üye bulunuyor.
        </p>
      </div>

      <div style={{ 
        background: "rgba(255,255,255,0.03)", borderRadius: "2rem", border: "1px solid rgba(255,255,255,0.1)", 
        overflow: "hidden"
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
              <th style={{ padding: "1.5rem 2rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Kullanıcı</th>
              <th style={{ padding: "1.5rem 2rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>İletişim</th>
              <th style={{ padding: "1.5rem 2rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Detaylar</th>
              <th style={{ padding: "1.5rem 2rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Kayıt Tarihi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.2s" }} className="hover:bg-white/5">
                <td style={{ padding: "1.5rem 2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                    {user.image ? (
                      <div style={{ width: "45px", height: "45px", borderRadius: "50%", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <Image src={user.image} alt="" width={45} height={45} style={{ objectFit: "cover" }} />
                      </div>
                    ) : (
                      <div style={{ 
                        width: "45px", height: "45px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", 
                        display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)" 
                      }}>
                        <UserIcon size={20} />
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 700 }}>{user.name || "İsimsiz Kullanıcı"}</div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontWeight: 800, textTransform: "uppercase", marginTop: "0.1rem" }}>{user.role}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "1.5rem 2rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>
                      <Mail size={14} color="rgba(255,255,255,0.3)" />
                      {user.email}
                    </div>
                    {user.phone && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "rgba(255,255,255,0.5)" }}>
                        <Phone size={14} color="rgba(255,255,255,0.3)" />
                        {user.phone}
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ padding: "1.5rem 2rem" }}>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    {user.gender && (
                      <div style={{ fontSize: "0.85rem", background: "rgba(255,255,255,0.05)", padding: "0.3rem 0.6rem", borderRadius: "2rem", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <span style={{ color: "rgba(255,255,255,0.4)", marginRight: "0.4rem" }}>Cinsiyet:</span> {user.gender}
                      </div>
                    )}
                    {user.age && (
                      <div style={{ fontSize: "0.85rem", background: "rgba(255,255,255,0.05)", padding: "0.3rem 0.6rem", borderRadius: "2rem", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <span style={{ color: "rgba(255,255,255,0.4)", marginRight: "0.4rem" }}>Yaş:</span> {user.age}
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ padding: "1.5rem 2rem", fontSize: "0.9rem", color: "rgba(255,255,255,0.5)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Calendar size={14} style={{ opacity: 0.5 }} />
                    {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
