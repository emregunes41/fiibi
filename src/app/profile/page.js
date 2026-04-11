import { getCurrentUser } from "../user-actions";
import { getAlbumModels, getSiteConfig } from "../admin/core-actions";
import ContractPreviewModal from "./ContractPreviewModal";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, Package, Clock, CheckCircle, FileText, ExternalLink, Banknote, CreditCard, Tag, AlertTriangle, LogOut } from "lucide-react";
import PhotoSelectionForm from "./PhotoSelectionForm";
import AlbumSelectionForm from "./AlbumSelectionForm";
import PaymentSection from "./PaymentSection";
import { approveContract, logoutUser } from "../user-actions";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const albumModels = await getAlbumModels();
  const siteConfig = await getSiteConfig();

  if (!user) {
    redirect("/login");
  }

  const workflowKeys = ["PENDING", "EDITING", "SELECTION_PENDING", "PREPARING", "COMPLETED"];
  
  // Auto-detect effective status: logic for visual display on customer dashboard
  const getEffectiveStatus = (res) => {
    // If they submitted a selection but admin hasn't locked it yet, visually advance them off "Seçim Bekleniyor"
    if (res.selectedPhotos && !res.selectionLocked && res.workflowStatus === "SELECTION_PENDING") {
      return "PREPARING";
    }
    if (res.workflowStatus === "PENDING") {
      const eventDate = new Date(res.eventDate);
      if (eventDate < new Date()) return "EDITING";
    }
    // Map old statuses to new ones
    if (res.workflowStatus === "SHOT_DONE") return "EDITING";
    if (res.workflowStatus === "ALBUM_PREPARING") return "PREPARING";
    return res.workflowStatus;
  };

  const getWorkflowStepIndex = (status) => {
    return workflowKeys.indexOf(status);
  };

  const workflowSteps = [
    { id: "PENDING", title: "Bekleniyor", desc: "Çekim Günü Bekleniyor" },
    { id: "EDITING", title: "Düzenleniyor", desc: "Fotoğraflar İşleniyor" },
    { id: "SELECTION_PENDING", title: "Seçim Bekleniyor", desc: "Senin Sıran" },
    { id: "PREPARING", title: "Hazırlanıyor", desc: "Proje Hazırlanıyor" },
    { id: "COMPLETED", title: "Teslim Edildi", desc: "Süreç Tamamlandı" }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40, maxWidth: "100%", overflowX: "hidden" }}>
      
      {/* Reservations */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>Rezervasyonlarım</h3>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}>Geçmiş ve gelecek tüm çekim randevularınız</p>
          </div>
          <form action={logoutUser}>
            <button type="submit" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
              <LogOut size={13} /> Çıkış Yap
            </button>
          </form>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {user.reservations.length === 0 ? (
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 0, border: "1px solid rgba(255,255,255,0.06)", padding: "48px 24px", textAlign: "center" }}>
              <Calendar size={36} style={{ color: "rgba(255,255,255,0.2)", margin: "0 auto 12px" }} />
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 12 }}>Henüz bir rezervasyonunuz bulunmuyor.</p>
              <Link href="/booking" style={{ color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                Paketleri İncele →
              </Link>
            </div>
          ) : (
            (() => {
              // Find the furthest delivery date across ALL reservations
              const allDeliveryDates = user.reservations
                .filter(r => r.deliveryDate)
                .map(r => new Date(r.deliveryDate));
              const maxDeliveryDate = allDeliveryDates.length > 0
                ? new Date(Math.max(...allDeliveryDates))
                : null;
              const maxDaysLeft = maxDeliveryDate 
                ? Math.max(0, Math.ceil((maxDeliveryDate - new Date()) / (1000 * 60 * 60 * 24))) 
                : null;

              return user.reservations.map((res) => {
              const effectiveStatus = getEffectiveStatus(res);
              const currentStepIdx = getWorkflowStepIndex(effectiveStatus);

              // Package names - fallback if empty
              const packageNames = res.packages.length > 0 
                ? res.packages.map(p => p.name).join(" + ")
                : "Çekim Rezervasyonu";

              return (
                <div key={res.id} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  
                  {/* Contract Approval Banner */}
                  {!res.contractApproved && (
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 0, padding: "20px 24px" }}>
                      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                        <div style={{ width: 44, height: 44, background: "rgba(255,255,255,0.1)", borderRadius: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <AlertTriangle size={20} style={{ color: "rgba(255,255,255,0.7)" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <h4 style={{ fontWeight: 700, fontSize: 15, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>Sözleşme Onayı Bekleniyor</h4>
                          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
                            Bu rezervasyon ekibimiz tarafından sizin adınıza oluşturulmuştur. Çekim planlaması ve hizmet detaylarının resmi olarak başlayabilmesi için Pinowed mesafeli satış ve hizmet sözleşmesini onaylamanız gerekmektedir.
                          </p>
                          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                            <ContractPreviewModal customText={siteConfig?.contractText} />
                            <form action={approveContract.bind(null, res.id)}>
                              <button type="submit" className="hover:opacity-80" style={{ background: "rgba(255,255,255,0.7)", color: "#000", fontWeight: 700, fontSize: 13, padding: "10px 20px", borderRadius: 0, border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, transition: "opacity 0.2s" }}>
                                <CheckCircle size={16} /> Okudum ve Onaylıyorum
                              </button>
                            </form>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Main Reservation Card ── */}
                  <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 0, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", opacity: !res.contractApproved ? 0.6 : 1, pointerEvents: !res.contractApproved ? "none" : "auto" }}>
                    
                    {/* Card Header */}
                    <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                        <div style={{ width: 44, height: 44, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Package size={18} style={{ color: "rgba(255,255,255,0.5)" }} />
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                            <h4 style={{ fontWeight: 700, fontSize: 15 }}>
                              {packageNames}
                            </h4>
                            <span style={{
                              fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                              padding: "3px 8px", borderRadius: 0,
                              background: res.status === "CONFIRMED" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)",
                              color: res.status === "CONFIRMED" ? "#fff" : "rgba(255,255,255,0.7)",
                              border: `1px solid ${res.status === "CONFIRMED" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.1)"}`,
                            }}>
                              {res.status === "CONFIRMED" ? "Onaylı" : "Bekliyor"}
                            </span>
                          </div>
                          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={12} /> {new Date(res.eventDate).toLocaleDateString("tr-TR", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            {res.packages.length > 0 && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Package size={12} /> {res.packages.length} Paket</span>}
                          </div>
                        </div>
                      </div>

                      {/* Delivery Countdown - uses max across all reservations */}
                      {maxDeliveryDate && currentStepIdx < 5 && currentStepIdx >= 0 && (
                        <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px 16px", borderRadius: 0, textAlign: "right", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Tahmini Teslim</p>
                          <p style={{ fontSize: 14, fontWeight: 700 }}>{maxDeliveryDate.toLocaleDateString("tr-TR", { day: 'numeric', month: 'short' })}</p>
                          {maxDaysLeft > 0 && <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{maxDaysLeft} gün kaldı</p>}
                        </div>
                      )}
                    </div>

                    {/* Package List - only show if packages exist */}
                    {res.packages.length > 0 && (
                    <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Paket Detayları ({res.packages.length})</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {res.packages.map((pkg, pkgIdx) => {
                          const categoryLabels = { DIS_CEKIM: "Dış Çekim", DUGUN: "Düğün", NISAN: "Nişan", STANDARD: "Standart" };
                          const timeLabels = { SLOT_2H: "2 Saatlik Çekim", SLOT_4H: "4 Saatlik Çekim", WEDDING: "Düğün Boyunca", FULL_DAY: "Tam Gün", MORNING: "Sabah", EVENING: "Akşam", FIVE_HOURS: "5 Saat", SLOT: "Randevu" };
                          // Filter custom field answers and addons for THIS package
                          const pkgFields = (res.customFieldAnswers || []).filter(a => a.packageName === pkg.name && a.type !== "_hidden");
                          const pkgAddons = (res.selectedAddons || []).filter(a => a.packageName === pkg.name);
                          return (
                            <div key={pkg.id} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 0, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                                <div>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{pkgIdx + 1}. {pkg.name}</div>
                                  {pkg.description && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>{pkg.description}</div>}
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0, marginLeft: 12 }}>{pkg.price}₺</div>
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", padding: "2px 8px", borderRadius: 0 }}>{categoryLabels[pkg.category] || pkg.category}</span>
                                <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", padding: "2px 8px", borderRadius: 0 }}>{timeLabels[pkg.timeType] || pkg.timeType}</span>
                                <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", padding: "2px 8px", borderRadius: 0 }}>{pkg.deliveryTimeDays || 14} gün içinde teslim</span>
                                {pkg.postSelectionDays > 0 && (
                                  <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.7)", padding: "2px 8px", borderRadius: 0 }}>+{pkg.postSelectionDays} gün seçim süresi</span>
                                )}
                              </div>
                              {pkg.features && pkg.features.length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 10px", paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                                  {pkg.features.map((f, i) => (
                                    <span key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>• {f}</span>
                                  ))}
                                </div>
                              )}
                              {/* Package-specific custom field answers (mekan, düğün yeri vb.) */}
                              {pkgFields.length > 0 && (
                                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                                  <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Çekim Bilgileri</div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    {pkgFields.map((answer, i) => (
                                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                                        <span style={{ color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>{answer.label}</span>
                                        <span style={{ color: "#fff", fontWeight: 700 }}>
                                          {answer.type === "checkbox" ? (answer.value ? "✅ Evet" : "❌ Hayır") : (answer.value || "—")}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {/* Package-specific addons */}
                              {pkgAddons.length > 0 && (
                                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                                  <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Ek Hizmetler</div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    {pkgAddons.map((addon, i) => (
                                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                                        <span style={{ color: "#fff", fontWeight: 600 }}>+ {addon.title}</span>
                                        <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>{addon.price}₺</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {/* Unmatched custom fields & addons (legacy data without packageName) */}
                      {(() => {
                        const unmatchedFields = (res.customFieldAnswers || []).filter(a => !a.packageName && a.type !== "_hidden");
                        const unmatchedAddons = (res.selectedAddons || []).filter(a => !a.packageName);
                        if (unmatchedFields.length === 0 && unmatchedAddons.length === 0) return null;
                        return (
                          <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 0, border: "1px solid rgba(255,255,255,0.04)" }}>
                            {unmatchedFields.length > 0 && (
                              <>
                                <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Çekim Bilgileri</div>
                                {unmatchedFields.map((answer, i) => (
                                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, marginBottom: 3 }}>
                                    <span style={{ color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>{answer.label}</span>
                                    <span style={{ color: "#fff", fontWeight: 700 }}>
                                      {answer.type === "checkbox" ? (answer.value ? "✅ Evet" : "❌ Hayır") : (answer.value || "—")}
                                    </span>
                                  </div>
                                ))}
                              </>
                            )}
                            {unmatchedAddons.length > 0 && (
                              <>
                                <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6, marginTop: unmatchedFields.length > 0 ? 8 : 0 }}>Ek Hizmetler</div>
                                {unmatchedAddons.map((addon, i) => (
                                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, marginBottom: 3 }}>
                                    <span style={{ color: "#fff", fontWeight: 600 }}>+ {addon.title}</span>
                                    <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>{addon.price}₺</span>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    )}

                    {res.notes && (
                       <div style={{ marginTop: 10, padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 0, border: "1px solid rgba(255,255,255,0.1)" }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Notlar / Açıklama</div>
                          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                             {res.notes}
                          </div>
                       </div>
                    )}

                    {/* Workflow Progress */}
                    <div style={{ padding: "20px 24px" }}>
                      <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 20 }}>İşlem Gidişatı</p>
                      
                      <div style={{ paddingBottom: 16, overflowX: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", position: "relative", minWidth: 420 }}>
                          {/* Background line */}
                          <div style={{ position: "absolute", top: 13, left: "10%", right: "10%", height: 1, background: "rgba(255,255,255,0.08)" }} />
                          <div style={{ position: "absolute", top: 13, left: "10%", height: 1, background: "rgba(255,255,255,0.4)", transition: "all 0.7s", width: currentStepIdx >= 0 ? `${(currentStepIdx / 4) * 80}%` : "0%" }} />

                          {workflowSteps.map((step, idx) => {
                            const isCompleted = currentStepIdx > idx;
                            const isCurrent = currentStepIdx === idx;
                            
                            return (
                              <div key={step.id} style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center", flex: 1 }}>
                                <div style={{
                                  width: 26, height: 26, borderRadius: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, transition: "all 0.3s",
                                  ...(isCompleted ? { background: "#fff", color: "#000" } :
                                    isCurrent ? { background: "#fff", color: "#000", boxShadow: "0 0 12px rgba(255,255,255,0.3)" } :
                                    { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.35)" })
                                }}>
                                  {isCompleted ? "✓" : (idx + 1)}
                                </div>
                                <div>
                                  <p style={{ fontSize: 11, fontWeight: 600, color: isCurrent ? "#fff" : isCompleted ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)" }}>
                                    {step.title}
                                  </p>
                                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", maxWidth: 90 }}>{step.desc}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Selection CTA */}
                      {effectiveStatus === "SELECTION_PENDING" && !res.deliveryLink && (
                        <div style={{ marginTop: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 0, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                          <div>
                            <h5 style={{ fontWeight: 700, color: "#fff", fontSize: 13 }}>Fotoğraflarınız Hazır! 🎉</h5>
                            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>Albüme gidecek fotoğrafları seçebilirsiniz.</p>
                          </div>
                          <Link href="/profile/gallery" style={{ background: "#fff", color: "#000", padding: "8px 18px", borderRadius: 0, fontWeight: 700, fontSize: 12, textDecoration: "none", whiteSpace: "nowrap" }}>
                            Seçimi Başlat
                          </Link>
                        </div>
                      )}

                      {/* Photo Selection */}
                      {(() => {
                        // If selection is locked, show confirmation
                        if (res.selectionLocked && res.selectedPhotos) {
                          return (
                            <div style={{ marginTop: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 0, padding: "14px 18px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <CheckCircle size={16} style={{ color: "#fff" }} />
                                <span style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>Seçiminiz İşleme Alındı</span>
                              </div>
                              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 6 }}>Fotoğraf seçiminiz onaylanmıştır ve hazırlık aşamasına geçilmiştir.</p>
                            </div>
                          );
                        }
                        // If not locked, show editable form
                        const isOutdoorCekim = res.packages.some(p => p.category === "DIS_CEKIM");
                        const hasLink = !!res.deliveryLink;
                        if ((isOutdoorCekim && hasLink && effectiveStatus === "SELECTION_PENDING") || res.selectedPhotos) {
                          return <PhotoSelectionForm reservationId={res.id} initialSelection={res.selectedPhotos} />;
                        }
                        return null;
                      })()}

                      {/* Album Selection (Only after photo selection is done) */}
                      {!!res.selectedPhotos && (
                        <AlbumSelectionForm 
                          reservationId={res.id}
                          initialSelectedId={res.albumModelId}
                          models={albumModels}
                          isLocked={res.selectionLocked}
                        />
                      )}

                      {/* Delivery Link */}
                      {res.deliveryLink && (
                        <div style={{ marginTop: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 0, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                          <div>
                            <h5 style={{ fontWeight: 700, color: "#fff", fontSize: 13 }}>Teslimatınız Hazır! 📸</h5>
                            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>Tüm dosyalarınıza aşağıdaki bağlantıdan ulaşabilirsiniz.</p>
                          </div>
                          <a href={res.deliveryLink} target="_blank" rel="noopener noreferrer" style={{ background: "#fff", color: "#000", padding: "8px 18px", borderRadius: 0, fontWeight: 700, fontSize: 12, textDecoration: "none", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
                            <ExternalLink size={14} /> Klasöre Git
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            });
            })()
          )}
        </div>

        {/* ── Unified Payment Section ── */}
        {user.reservations.length > 0 && (() => {
          // Build a unified reservation object
          const unifiedTotalNumeric = user.reservations.reduce((sum, r) => {
             return sum + parseFloat(r.totalAmount?.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || '0');
          }, 0);
          
          const unifiedPayments = user.reservations.flatMap(r => r.payments || []);
          const allPackages = user.reservations.flatMap(r => r.packages || []);
          
          // Fallback ID to the first unpaid, or just the first reservation
          const firstUnpaidRes = user.reservations.find(r => {
             const rt = parseFloat(r.totalAmount?.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || '0');
             const rp = (r.payments || []).reduce((s, p) => s + p.amount, 0);
             return rt - rp > 0;
          });
          
          const primaryRes = firstUnpaidRes || user.reservations[0];
          
          // Does any reservation use CASH?
          const hasCash = user.reservations.some(r => r.paymentPreference === "CASH");
          
          // Merge all paymentLogs from every reservation into one timeline
          const unifiedPaymentLogs = user.reservations.flatMap(r => r.paymentLogs || []);
          // Sum paidAmount across reservations
          const unifiedPaidAmount = user.reservations.reduce((sum, r) => {
            return sum + parseFloat(r.paidAmount || '0');
          }, 0);

          const unifiedReservation = {
             id: primaryRes.id, // Payment will be attached to this reservation in DB
             totalAmount: unifiedTotalNumeric.toString(),
             payments: unifiedPayments,
             paymentLogs: unifiedPaymentLogs,
             paidAmount: unifiedPaidAmount.toString(),
             paymentPreference: hasCash ? "CASH" : primaryRes.paymentPreference,
             packages: allPackages,
             brideEmail: primaryRes.brideEmail,
             brideName: primaryRes.brideName,
             bridePhone: primaryRes.bridePhone
          };

          return (
            <section style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>Ödeme Durumu</h3>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>Tüm rezervasyonlarınızın toplam ödeme özeti</p>
              </div>

              <PaymentSection reservation={unifiedReservation} compactMode={false} />
            </section>
          );
        })()}
      </section>

      {/* Purchases */}
      <section>
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>Satın Alımlarım</h3>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}>Dijital ürünleriniz ve rehberleriniz</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {user.purchases.length === 0 ? (
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 0, border: "1px solid rgba(255,255,255,0.06)", padding: "48px 24px", textAlign: "center" }}>
              <Package size={36} style={{ color: "rgba(255,255,255,0.2)", margin: "0 auto 12px" }} />
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Henüz bir dijital ürün satın almadınız.</p>
            </div>
          ) : (
            user.purchases.map((pur) => (
              <div key={pur.id} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 0, border: "1px solid rgba(255,255,255,0.06)", padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 40, height: 40, background: "rgba(255,255,255,0.04)", borderRadius: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <FileText size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: 14 }}>{pur.productName}</h4>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                      {new Date(pur.purchaseDate).toLocaleDateString("tr-TR")} • {pur.productType}
                    </div>
                  </div>
                </div>
                <button style={{ background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "8px 16px", borderRadius: 0, border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>
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
