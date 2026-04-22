"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminPageTabs({ tabs }) {
  const pathname = usePathname();

  return (
    <div style={{ 
      display: "flex", 
      gap: "12px", 
      marginBottom: "24px", 
      borderBottom: "1px solid rgba(255,255,255,0.08)", 
      overflowX: "auto",
      paddingBottom: "8px"
    }}>
      {tabs.map(tab => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link key={tab.href} href={tab.href} style={{ textDecoration: "none" }}>
            <div style={{
              padding: "8px 16px", 
              fontSize: "0.85rem", 
              fontWeight: isActive ? 800 : 500,
              color: isActive ? "#fff" : "rgba(255,255,255,0.4)",
              background: isActive ? "rgba(255,255,255,0.05)" : "transparent", 
              border: isActive ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
              borderRadius: 0,
              transition: "all 0.2s", 
              whiteSpace: "nowrap",
            }} className="hover:text-white">
              {tab.label}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
