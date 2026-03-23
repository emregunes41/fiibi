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

            <div className="flex flex-col gap-4">
              {user.reservations.length === 0 ? (
                <div className="glass-panel rounded-3xl p-12 text-center">
                  <Calendar size={48} className="text-white/10 mx-auto mb-4" />
                  <p className="text-white/40 font-medium">Henüz bir rezervasyonunuz bulunmuyor.</p>
                  <Link href="/#packages" className="inline-block mt-4 text-white font-bold no-underline hover:underline">Hemen bir paket inceleyin</Link>
                </div>
              ) : (
                user.reservations.map((res) => (
                  <div key={res.id} className="glass-panel rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center shrink-0">
                      <Package size={24} className="text-white/50" />
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                        <h4 className="font-bold text-lg">
                          {res.packages.map(p => p.name).join(", ")}
                        </h4>
                        {getStatusIcon(res.status)}
                      </div>
                      <div className="text-white/40 text-sm flex items-center justify-center md:justify-start gap-4">
                        <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(res.eventDate).toLocaleDateString("tr-TR")}</span>
                        {res.eventTime && <span className="flex items-center gap-1"><Clock size={14} /> {res.eventTime}</span>}
                      </div>
                    </div>

                    <div className="text-center md:text-right shrink-0">
                      <div className="text-2xl font-black mb-1">{res.totalAmount} TL</div>
                      <div className="text-white/30 text-[10px] font-bold uppercase tracking-widest">
                        {res.paymentStatus === "PAID" ? "ÖDENDİ" : "KAPORA ÖDENDİ"}
                      </div>
                    </div>
                  </div>
                ))
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
