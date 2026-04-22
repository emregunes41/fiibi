"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Shield, ScrollText, Eye, BookOpen } from "lucide-react";
import { PLATFORM } from "@/lib/constants";
import { getServiceAgreement, getDistanceSalesContract, getPreliminaryInfoForm, getKVKKText } from "@/lib/contracts";

const tabs = [
  { id: "hizmet", label: "Hizmet Sözleşmesi", icon: FileText, desc: "Satıcı hizmet sözleşmesi" },
  { id: "mesafeli", label: "Mesafeli Satış", icon: ScrollText, desc: "6502 sayılı kanun gereği" },
  { id: "onbilgi", label: "Ön Bilgilendirme", icon: Eye, desc: "Satın alma öncesi bilgilendirme" },
  { id: "kvkk", label: "KVKK", icon: Shield, desc: "Kişisel verilerin korunması" },
];

export default function SozlesmeClient({ tenant, config }) {
  const [activeTab, setActiveTab] = useState("hizmet");

  const sellerAgreement = config?.contractText || getServiceAgreement(tenant);
  const distanceSales = config?.distanceSalesContractText || getDistanceSalesContract(tenant);
  const preliminaryInfo = config?.preliminaryInfoText || getPreliminaryInfoForm(tenant);
  const kvkkText = config?.kvkkText || getKVKKText(tenant);

  const contentMap = {
    hizmet: sellerAgreement,
    mesafeli: distanceSales,
    onbilgi: preliminaryInfo,
    kvkk: kvkkText,
  };

  const currentTab = tabs.find(t => t.id === activeTab);
  const CurrentIcon = currentTab?.icon || FileText;

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", padding: "60px 24px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.5)", textDecoration: "none", marginBottom: 32, fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}>
          <ArrowLeft size={16} /> Ana Sayfaya Dön
        </Link>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 0, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BookOpen size={24} style={{ color: "rgba(255,255,255,0.7)" }} />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>Yasal Sözleşmeler</h1>
        </div>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, marginBottom: 32, marginLeft: 64 }}>
          {PLATFORM.name} platform kullanım koşulları ve yasal metinler
        </p>

        {/* Tab Bar */}
        <div style={{ 
          display: "flex", gap: 0, marginBottom: 28, 
          borderBottom: "1px solid rgba(255,255,255,0.08)", 
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "12px 20px", fontSize: 12, fontWeight: isActive ? 800 : 500,
                  color: isActive ? "#fff" : "rgba(255,255,255,0.4)",
                  background: "none", border: "none",
                  borderBottom: isActive ? "2px solid #fff" : "2px solid transparent",
                  cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
                  display: "flex", alignItems: "center", gap: 8,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                }}
              >
                <Icon size={14} style={{ opacity: isActive ? 1 : 0.4 }} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* İçerik Kartı */}
        <div style={{ 
          background: "rgba(255,255,255,0.03)", 
          border: "1px solid rgba(255,255,255,0.08)", 
          borderRadius: 0, 
          padding: "clamp(24px, 5vw, 48px)",
          marginBottom: 40,
        }}>
          {/* Sekme Başlığı */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 0,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <CurrentIcon size={16} style={{ color: "rgba(255,255,255,0.6)" }} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>
                {currentTab?.label}
              </h2>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                {currentTab?.desc}
              </p>
            </div>
          </div>

          {/* Sözleşme Metni */}
          <div style={{ 
            color: "rgba(255,255,255,0.75)", 
            fontSize: 14, 
            lineHeight: 1.8, 
            whiteSpace: "pre-wrap",
            fontFamily: "inherit",
          }}>
            {contentMap[activeTab]}
          </div>
        </div>

        {/* Alt Bilgi */}
        <div style={{ 
          padding: "20px 24px", 
          background: "rgba(255,255,255,0.02)", 
          border: "1px solid rgba(255,255,255,0.06)",
          marginBottom: 60,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <Shield size={16} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
          <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: 12, lineHeight: 1.6 }}>
            Bu sayfadaki tüm yasal metinler {PLATFORM.name} ({PLATFORM.legalName}) tarafından hazırlanmıştır.
            Sorularınız için <strong style={{ color: "rgba(255,255,255,0.6)" }}>{PLATFORM.supportEmail}</strong> adresine yazabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
