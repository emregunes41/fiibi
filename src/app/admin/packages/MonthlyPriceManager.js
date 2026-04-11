"use client";

import { useState, useEffect } from "react";
import { Save, ChevronLeft, ChevronRight, Percent } from "lucide-react";
import { getMonthlyPrices, updateMonthlyPrice } from "../core-actions";

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

const CATEGORIES = [
  { value: "DIS_CEKIM", label: "Dış Çekim" },
  { value: "DUGUN", label: "Düğün" },
  { value: "NISAN", label: "Nişan" },
];

export default function MonthlyPriceManager() {
  const [activeCategory, setActiveCategory] = useState("DIS_CEKIM");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [configs, setConfigs] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    async function loadPrices() {
      const data = await getMonthlyPrices(activeCategory, selectedYear);
      const configMap = {};
      data.forEach(p => {
        configMap[p.month] = { 
          percentage: p.discountPercentage || 0, 
          minPrice: p.minPrice 
        };
      });
      setConfigs(configMap);
    }
    loadPrices();
  }, [activeCategory, selectedYear]);

  const handlePercentageChange = (monthIndex, value) => {
    const month = monthIndex + 1;
    setConfigs(prev => ({
      ...prev,
      [month]: { ...prev[month], percentage: value }
    }));
  };

  const handleSave = async (monthIndex) => {
    setIsSaving(true);
    const month = monthIndex + 1;
    const config = configs[month] || { percentage: 0, minPrice: null };

    const res = await updateMonthlyPrice({
      category: activeCategory,
      month,
      year: selectedYear,
      discountPercentage: config.percentage,
      minPrice: config.minPrice
    });

    if (res.success) {
      setMessage({ type: "success", text: `${MONTHS[monthIndex]} güncellendi.` });
    } else {
      setMessage({ type: "error", text: "Hata!" });
    }
    
    setIsSaving(false);
    setTimeout(() => setMessage(null), 2000);
  };

  return (
    <div style={{ 
      background: "rgba(255,255,255,0.05)", 
      border: "1px solid rgba(255,255,255,0.08)", 
      borderRadius: "1rem", 
      padding: "1rem",
      marginBottom: "1.5rem"
    }}>
      {/* Header Compact */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Percent size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
          <h2 style={{ fontSize: "0.9rem", fontWeight: 900, margin: 0 }}>Aylık Oranlar</h2>
          {message && (
            <span style={{ 
              fontSize: "0.65rem", 
              color: message.type === "success" ? "#fff" : "rgba(255,255,255,0.6)",
              fontWeight: 700,
              marginLeft: "10px"
            }}>
              {message.text}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", padding: "2px", borderRadius: 0 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                style={{
                  padding: "4px 8px", borderRadius: 0, fontSize: "0.65rem", fontWeight: 700, border: "none", cursor: "pointer", transition: "all 0.2s",
                  background: activeCategory === cat.value ? "#fff" : "transparent",
                  color: activeCategory === cat.value ? "#000" : "rgba(255,255,255,0.4)"
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 0, border: "1px solid rgba(255,255,255,0.08)" }}>
            <button onClick={() => setSelectedYear(y => y - 1)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex" }}><ChevronLeft size={12} /></button>
            <span style={{ fontSize: "0.7rem", fontWeight: 800, width: "30px", textAlign: "center" }}>{selectedYear}</span>
            <button onClick={() => setSelectedYear(y => y + 1)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex" }}><ChevronRight size={12} /></button>
          </div>
        </div>
      </div>

      {/* Grid compact */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", 
        gap: "6px" 
      }}>
        {MONTHS.map((month, idx) => {
          const val = configs[idx + 1]?.percentage || 0;
          return (
            <div key={month} style={{ 
              padding: "8px", 
              borderRadius: 0, 
              background: "rgba(0,0,0,0.2)", 
              border: "1px solid rgba(255,255,255,0.08)",
              position: "relative"
            }}>
              <label style={{ display: "block", fontSize: "0.55rem", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", fontWeight: 900, marginBottom: "4px" }}>{month}</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type="number"
                  value={configs[idx + 1]?.percentage ?? ""}
                  onChange={(e) => handlePercentageChange(idx, e.target.value)}
                  onBlur={() => handleSave(idx)}
                  placeholder="0"
                  style={{ 
                    width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.1)", 
                    color: val < 0 ? "#fff" : val > 0 ? "#fbbf24" : "#fff",
                    fontSize: "0.85rem", fontWeight: 800, outline: "none", padding: "2px 0"
                  }}
                />
                <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)", marginLeft: "2px" }}>%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
