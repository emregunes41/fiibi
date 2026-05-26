"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { User as UserIcon, Mail, Phone, Calendar } from "lucide-react";
import ResetPasswordButton from "./ResetPasswordButton";
import DeleteUserButton from "./DeleteUserButton";
import { getTenantUsers } from "../core-actions";

export default function MembersList({ terms }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      const res = await getTenantUsers();
      if (res?.success) {
        setUsers(res.users);
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);

  if (loading) return (
    <div style={{ color: "rgba(0,0,0,0.65)", fontSize: 13, padding: 24, textAlign: "center" }}>
      Üyeler yükleniyor...
    </div>
  );

  return (
    <div style={{ color: "#1a1a1a" }}>
      <p style={{ color: "rgba(0,0,0,0.65)", fontSize: "0.75rem", marginBottom: "16px" }}>
        Toplam {users.length} üye
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {users.map((user) => (
          <div key={user.id} style={{
            padding: "10px 12px",
            borderRadius: 0,
            border: "1px solid rgba(0,0,0,0.1)",
            background: "rgba(0,0,0,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              {user.image ? (
                <div style={{ width: "32px", height: "32px", borderRadius: 0, overflow: "hidden", border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }}>
                  <Image src={user.image} alt="" width={32} height={32} style={{ objectFit: "cover" }} />
                </div>
              ) : (
                <div style={{ 
                  width: "32px", height: "32px", borderRadius: 0, background: "rgba(0,0,0,0.05)", 
                  display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(0,0,0,0.65)", flexShrink: 0
                }}>
                  <UserIcon size={14} />
                </div>
              )}
              
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name || "İsimsiz"}
                </div>
                <div style={{ fontSize: "0.65rem", color: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Mail size={10} /> {user.email}
                </div>
                <div style={{ fontSize: "0.55rem", color: "rgba(0,0,0,0.65)", marginTop: "2px", letterSpacing: "0.02em" }}>
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
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                {user.phone && (
                  <span style={{ fontSize: "0.6rem", background: "rgba(0,0,0,0.08)", padding: "2px 6px", borderRadius: 0, color: "rgba(0,0,0,0.65)" }}>
                    {user.phone}
                  </span>
                )}
                {user.role === "ADMIN" && (
                  <span style={{ fontSize: "0.6rem", background: "rgba(0,0,0,0.1)", padding: "2px 6px", borderRadius: 0, color: "#1a1a1a", fontWeight: 800 }}>
                    ADMIN
                  </span>
                )}
                <ResetPasswordButton userId={user.id} />
                <DeleteUserButton userId={user.id} userName={user.name} role={user.role} />
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.65rem", color: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", gap: "3px", justifyContent: "flex-end" }}>
                  <Calendar size={10} /> {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                </div>
              </div>
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <div style={{ padding: "3rem", textAlign: "center", color: "rgba(0,0,0,0.65)", fontSize: "0.8rem" }}>
            Henüz üye yok.
          </div>
        )}
      </div>
    </div>
  );
}
