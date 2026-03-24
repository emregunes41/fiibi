import { getCurrentUser, logoutUser } from "../user-actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Calendar, Settings, LogOut, Package, Clock, CheckCircle, FileText } from "lucide-react";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "CONFIRMED": return <CheckCircle size={16} className="text-green-500" />;
      case "PENDING": return <Clock size={16} className="text-yellow-500" />;
      default: return <Clock size={16} className="text-white/30" />;
    }
  };

  const getWorkflowStepIndex = (status) => {
    const steps = ["PENDING", "SHOT_DONE", "EDITING", "SELECTION_PENDING", "COMPLETED"];
    return steps.indexOf(status);
  };

  const workflowSteps = [
    { id: "PENDING", title: "Bekleniyor", desc: "Çekim Günü" },
    { id: "SHOT_DONE", title: "Tamamlandı", desc: "Çekim Bitti" },
    { id: "EDITING", title: "Düzenleniyor", desc: "Fotoğraflar İşleniyor" },
    { id: "SELECTION_PENDING", title: "Seçim Bekleniyor", desc: "Senin Sıran" },
    { id: "COMPLETED", title: "Teslim Edildi", desc: "Süreç Bitti" }
  ];

  return (
    <main className="pt-32 pb-20 px-6 min-h-screen">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Sidebar / User Card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-panel rounded-[2.5rem] p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-6">
                <User size={48} className="text-white/70" />
              </div>
              <h2 className="text-2xl font-black tracking-tighter mb-1">{user.name}</h2>
              <p className="text-white/40 text-sm mb-6">{user.email}</p>
              
              <div className="w-full grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center">
                  <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1">RANDEVU</span>
                  <span className="text-xl font-black">{user.reservations.length}</span>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center">
                  <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1">PUAN</span>
                  <span className="text-xl font-black">0</span>
                </div>
              </div>

              <div className="w-full flex flex-col gap-2">
                <Link href="/profile/settings" className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-all text-sm font-semibold no-underline">
                  <Settings size={18} /> Ayarlar
                </Link>
                <form action={logoutUser} className="w-full">
                  <button type="submit" className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-red-500/10 text-red-500 transition-all text-sm font-semibold">
                    <LogOut size={18} /> Çıkış Yap
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Content / Reservations & Purchases */}
        <div className="lg:col-span-2 flex flex-col gap-12">
          
          {/* Reservations Section */}
          <section>
            <div className="mb-6">
              <h3 className="text-3xl font-black tracking-tighter mb-2">Rezervasyonlarım</h3>
              <p className="text-white/50">Geçmiş ve gelecek tüm çekim randevularınız</p>
            </div>

            <div className="flex flex-col gap-6">
              {user.reservations.length === 0 ? (
                <div className="glass-panel rounded-3xl p-12 text-center">
                  <Calendar size={48} className="text-white/10 mx-auto mb-4" />
                  <p className="text-white/40 font-medium">Henüz bir rezervasyonunuz bulunmuyor.</p>
                  <Link href="/#packages" className="inline-block mt-4 text-white font-bold no-underline hover:underline">Hemen bir paket inceleyin</Link>
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
                    <div key={res.id} className="glass-panel rounded-3xl overflow-hidden relative border border-white/5">
                      
                      {/* Top Header Card Info */}
                      <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex gap-4 items-center">
                          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center shrink-0">
                            <Package size={24} className="text-white/80" />
                          </div>
                          <div>
                            <h4 className="font-black text-xl mb-1">
                              {res.packages.map(p => p.name).join(", ")}
                            </h4>
                            <div className="text-white/50 text-sm flex gap-4 items-center">
                              <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(res.eventDate).toLocaleDateString("tr-TR")}</span>
                              <span className="flex items-center gap-1.5"><CheckCircle size={14} className={res.status === "CONFIRMED" ? "text-green-500" : "text-yellow-500"}/> {res.status === "CONFIRMED" ? "Onaylı" : "Bekliyor"}</span>
                            </div>
                          </div>
                        </div>

                        {deliveryDate && currentStepIdx < 4 && (
                          <div className="text-center md:text-right bg-white/5 px-6 py-4 rounded-2xl">
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">SON TESLİM</p>
                            <p className="text-lg font-black">{deliveryDate.toLocaleDateString("tr-TR")}</p>
                            <p className="text-xs font-semibold text-yellow-500 mt-1">{getDaysLeft()} Gün Kaldı</p>
                          </div>
                        )}
                      </div>

                      {/* CRM STEPS TRACKER */}
                      <div className="p-6 md:p-8 bg-black/40">
                        <h5 className="text-sm font-bold text-white/50 mb-6 uppercase tracking-wider">İşlem Gidişatı</h5>
                        
                        <div className="flex flex-col md:flex-row justify-between relative gap-4 md:gap-0">
                          {/* Background Line (visible only md+) */}
                          <div className="hidden md:block absolute top-[15px] left-[10%] right-[10%] h-[2px] bg-white/10 z-0"></div>
                          <div 
                            className="hidden md:block absolute top-[15px] left-[10%] h-[2px] bg-green-500 z-0 transition-all duration-1000"
                            style={{ 
                              width: currentStepIdx >= 0 ? `${(currentStepIdx / 4) * 80}%` : "0%"
                            }}
                          ></div>

                          {workflowSteps.map((step, idx) => {
                            const isCompleted = currentStepIdx > idx;
                            const isCurrent = currentStepIdx === idx;
                            
                            return (
                              <div key={step.id} className="relative z-10 flex md:flex-col items-center gap-4 md:gap-2 text-center flex-1">
                                <div className={`
                                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all shrink-0
                                  ${isCompleted ? "bg-green-500 border-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]" : 
                                    isCurrent ? "bg-white border-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)] ring-4 ring-white/20" : 
                                    "bg-black border-white/20 text-white/30"}
                                `}>
                                  {isCompleted ? "✓" : (idx + 1)}
                                </div>
                                
                                <div className="text-left md:text-center">
                                  <p className={`text-sm font-bold ${isCurrent ? 'text-white' : isCompleted ? 'text-white/80' : 'text-white/40'}`}>
                                    {step.title}
                                  </p>
                                  <p className="text-xs text-white/30 max-w-[120px] mx-auto hidden md:block">{step.desc}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Call to action if selection pending */}
                        {res.workflowStatus === "SELECTION_PENDING" && (
                          <div className="mt-8 bg-green-500/10 border border-green-500/20 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                              <h5 className="font-bold text-green-400 text-lg">Fotoğraflarınız Hazır! 🎉</h5>
                              <p className="text-white/60 text-sm">Albüme gidecek fotoğrafları şimdi galerinize girerek seçebilirsiniz.</p>
                            </div>
                            <Link href="/profile/gallery" className="bg-green-500 text-black px-6 py-3 rounded-xl font-bold tracking-tight hover:bg-green-400 transition-colors whitespace-nowrap">
                              Seçimi Başlat
                            </Link>
                          </div>
                        )}
                      </div>
                      
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Purchases Section */}
          <section>
            <div className="mb-6">
              <h3 className="text-3xl font-black tracking-tighter mb-2">Satın Alımlarım</h3>
              <p className="text-white/50">Dijital ürünleriniz ve rehberleriniz</p>
            </div>

            <div className="flex flex-col gap-4">
              {user.purchases.length === 0 ? (
                <div className="glass-panel rounded-3xl p-12 text-center">
                  <Package size={48} className="text-white/10 mx-auto mb-4" />
                  <p className="text-white/40 font-medium">Henüz bir dijital ürün satın almadınız.</p>
                </div>
              ) : (
                user.purchases.map((pur) => (
                  <div key={pur.id} className="glass-panel rounded-3xl p-6 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center">
                        <FileText size={20} className="text-white/50" />
                      </div>
                      <div>
                        <h4 className="font-bold">{pur.productName}</h4>
                        <div className="text-white/30 text-xs">
                          {new Date(pur.purchaseDate).toLocaleDateString("tr-TR")} • {pur.productType}
                        </div>
                      </div>
                    </div>
                    <button className="bg-white text-black px-6 py-2 rounded-xl text-xs font-bold hover:bg-white/90 transition-all">
                      Görüntüle
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>

      </div>
    </main>
  );
}
