import { getCurrentUser } from "../user-actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, Package, Clock, CheckCircle, FileText, ExternalLink } from "lucide-react";
import PhotoSelectionForm from "./PhotoSelectionForm";
import PaymentSection from "./PaymentSection";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const getWorkflowStepIndex = (status) => {
    const steps = ["PENDING", "SHOT_DONE", "EDITING", "SELECTION_PENDING", "ALBUM_PREPARING", "COMPLETED"];
    return steps.indexOf(status);
  };

  const workflowSteps = [
    { id: "PENDING", title: "Bekleniyor", desc: "Çekim Günü" },
    { id: "SHOT_DONE", title: "Tamamlandı", desc: "Çekim Bitti" },
    { id: "EDITING", title: "Düzenleniyor", desc: "Fotoğraflar İşleniyor" },
    { id: "SELECTION_PENDING", title: "Seçim Bekleniyor", desc: "Senin Sıran" },
    { id: "ALBUM_PREPARING", title: "Hazırlanıyor", desc: "Albüm Hazırlanıyor" },
    { id: "COMPLETED", title: "Teslim Edildi", desc: "Süreç Bitti" }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      
      {/* Reservations */}
      <section>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>Rezervasyonlarım</h3>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}>Geçmiş ve gelecek tüm çekim randevularınız</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {user.reservations.length === 0 ? (
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", padding: "48px 24px", textAlign: "center" }}>
                  <Calendar size={36} style={{ color: "rgba(255,255,255,0.2)", margin: "0 auto 12px" }} />
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 12 }}>Henüz bir rezervasyonunuz bulunmuyor.</p>
                  <Link href="/#packages" style={{ color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                    Paketleri İncele →
                  </Link>
                </div>
              ) : (
                user.reservations.map((res) => {
                  const currentStepIdx = getWorkflowStepIndex(res.workflowStatus);
                  const deliveryDate = res.deliveryDate ? new Date(res.deliveryDate) : null;
                  const getDaysLeft = () => {
                    if (!deliveryDate) return null;
                    const diff = Math.ceil((deliveryDate - new Date()) / (1000 * 60 * 60 * 24));
                    return diff > 0 ? diff : 0;
                  };

                  return (
                    <div key={res.id} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden" }}>
                      {/* Header */}
                      <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <div style={{ width: 44, height: 44, background: "rgba(255,255,255,0.06)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Package size={18} style={{ color: "rgba(255,255,255,0.55)" }} />
                          </div>
                          <div>
                            <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                              {res.packages.map(p => p.name).join(", ")}
                            </h4>
                            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, display: "flex", gap: 12, alignItems: "center" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={12} /> {new Date(res.eventDate).toLocaleDateString("tr-TR")}</span>
                              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <CheckCircle size={12} style={{ color: res.status === "CONFIRMED" ? "#4ade80" : "#facc15" }}/>
                                {res.status === "CONFIRMED" ? "Onaylı" : "Bekliyor"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {deliveryDate && currentStepIdx < 4 && (
                          <div style={{ background: "rgba(255,255,255,0.04)", padding: "10px 16px", borderRadius: 12, textAlign: "right" }}>
                            <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Son Teslim</p>
                            <p style={{ fontSize: 14, fontWeight: 700 }}>{deliveryDate.toLocaleDateString("tr-TR")}</p>
                            <p style={{ fontSize: 11, fontWeight: 600, color: "#facc15" }}>{getDaysLeft()} gün kaldı</p>
                          </div>
                        )}
                      </div>

                      {/* Workflow */}
                      <div style={{ padding: "20px 24px" }}>
                        <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 20 }}>İşlem Gidişatı</p>
                        
                        <div style={{ paddingBottom: "30px", overflowX: "auto" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", position: "relative", minWidth: 500 }}>
                          {/* Background line */}
                          <div style={{ position: "absolute", top: 13, left: "10%", right: "10%", height: 1, background: "rgba(255,255,255,0.1)" }} />
                          <div style={{ position: "absolute", top: 13, left: "10%", height: 1, background: "rgba(74,222,128,0.5)", transition: "all 0.7s", width: currentStepIdx >= 0 ? `${(currentStepIdx / 4) * 80}%` : "0%" }} />

                          {workflowSteps.map((step, idx) => {
                            const isCompleted = currentStepIdx > idx;
                            const isCurrent = currentStepIdx === idx;
                            
                            return (
                              <div key={step.id} style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center", flex: 1 }}>
                                <div style={{
                                  width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, transition: "all 0.3s",
                                  ...(isCompleted ? { background: "#4ade80", color: "#000" } :
                                    isCurrent ? { background: "#fff", color: "#000", boxShadow: "0 0 12px rgba(255,255,255,0.3)" } :
                                    { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.4)" })
                                }}>
                                  {isCompleted ? "✓" : (idx + 1)}
                                </div>
                                
                                <div>
                                  <p style={{ fontSize: 12, fontWeight: 600, color: isCurrent ? "#fff" : isCompleted ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.45)" }}>
                                    {step.title}
                                  </p>
                                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", maxWidth: 100 }}>{step.desc}</p>
                                </div>
                              </div>
                            );
                          })}
                          </div>
                        </div>
                        
                        {/* Selection CTA */}
                        {res.workflowStatus === "SELECTION_PENDING" && !res.deliveryLink && (
                          <div style={{ marginTop: 20, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                            <div>
                              <h5 style={{ fontWeight: 700, color: "#4ade80", fontSize: 14 }}>Fotoğraflarınız Hazır! 🎉</h5>
                              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Albüme gidecek fotoğrafları seçebilirsiniz.</p>
                            </div>
                            <Link href="/profile/gallery" style={{ background: "#4ade80", color: "#000", padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: "none", whiteSpace: "nowrap" }}>
                              Seçimi Başlat
                            </Link>
                          </div>
                        )}

                        {/* Photo Selection Section (Revised Visibility) */}
                        {(() => {
                          const isOutdoorCekim = res.packages.some(p => p.category === "DIS_CEKIM");
                          const hasLink = !!res.deliveryLink;
                          // Show form if: 
                          // 1. It's Dış Çekim AND has link AND status is SELECTION_PENDING
                          // 2. OR it already has selectedPhotos (to show what was selected)
                          if ((isOutdoorCekim && hasLink && res.workflowStatus === "SELECTION_PENDING") || res.selectedPhotos) {
                            return <PhotoSelectionForm reservationId={res.id} initialSelection={res.selectedPhotos} />;
                          }
                          return null;
                        })()}

                        {/* Delivery Link */}
                        {res.deliveryLink && (
                          <div style={{ marginTop: 24, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                            <div>
                               <h5 style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>Teslimatınız Hazır! 📸</h5>
                               <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Tüm dosyalarınıza aşağıdaki bağlantıdan ulaşabilirsiniz.</p>
                            </div>
                            <a href={res.deliveryLink} target="_blank" rel="noopener noreferrer" style={{ background: "#fff", color: "#000", padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: "none", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
                              <ExternalLink size={14} /> Klasöre Git
                            </a>
                          </div>
                        )}

                        {/* Payment Section */}
                        <PaymentSection reservation={res} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Purchases */}
          <section>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>Satın Alımlarım</h3>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}>Dijital ürünleriniz ve rehberleriniz</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {user.purchases.length === 0 ? (
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", padding: "48px 24px", textAlign: "center" }}>
                  <Package size={36} style={{ color: "rgba(255,255,255,0.2)", margin: "0 auto 12px" }} />
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Henüz bir dijital ürün satın almadınız.</p>
                </div>
              ) : (
                user.purchases.map((pur) => (
                  <div key={pur.id} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 40, height: 40, background: "rgba(255,255,255,0.06)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <FileText size={16} style={{ color: "rgba(255,255,255,0.55)" }} />
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600, fontSize: 14 }}>{pur.productName}</h4>
                        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                          {new Date(pur.purchaseDate).toLocaleDateString("tr-TR")} • {pur.productType}
                        </div>
                      </div>
                    </div>
                    <button style={{ background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
                      Görüntüle
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

    </div>
  );
}
