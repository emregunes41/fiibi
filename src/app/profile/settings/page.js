import { getCurrentUser, updateUser } from "../../user-actions";
import { redirect } from "next/navigation";
import { User, ChevronLeft, Save } from "lucide-react";
import Link from "next/link";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  async function handleUpdate(formData) {
    "use server";
    const data = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      gender: formData.get("gender"),
      age: formData.get("age"),
    };
    await updateUser(user.id, data);
    redirect("/profile");
  }

  return (
    <main className="pt-32 pb-20 px-6 min-h-screen">
      <div className="max-w-2xl mx-auto">
        
        <Link href="/profile" className="flex items-center gap-2 text-white/40 hover:text-white transition-all no-underline mb-8 group">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-sm uppercase tracking-widest">Profile Geri Dön</span>
        </Link>

        <div className="glass-panel rounded-[2.5rem] p-10">
          <div className="flex items-center gap-6 mb-10">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <User size={32} className="text-white/70" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter">Hesap Ayarları</h1>
              <p className="text-white/40 text-sm">Profil bilgilerinizi buradan güncelleyebilirsiniz.</p>
            </div>
          </div>

          <form action={handleUpdate} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-white/30 text-[10px] font-bold uppercase tracking-widest pl-1">Ad Soyad</label>
                <input 
                  name="name"
                  defaultValue={user.name}
                  className="bg-white/5 border-white/10 rounded-2xl p-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  placeholder="Ad Soyad"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-white/30 text-[10px] font-bold uppercase tracking-widest pl-1">E-posta (Değiştirilemez)</label>
                <input 
                  disabled
                  defaultValue={user.email}
                  className="bg-white/5 border-white/5 rounded-2xl p-4 text-white/30 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-white/30 text-[10px] font-bold uppercase tracking-widest pl-1">Telefon</label>
                <input 
                  name="phone"
                  defaultValue={user.phone}
                  className="bg-white/5 border-white/10 rounded-2xl p-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  placeholder="05xx xxx xx xx"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-white/30 text-[10px] font-bold uppercase tracking-widest pl-1">Yaş</label>
                <input 
                  name="age"
                  type="number"
                  defaultValue={user.age}
                  className="bg-white/5 border-white/10 rounded-2xl p-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-white/30 text-[10px] font-bold uppercase tracking-widest pl-1">Cinsiyet</label>
              <select 
                name="gender"
                defaultValue={user.gender}
                className="bg-white/5 border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all appearance-none"
              >
                <option value="" className="bg-black">Belirtilmemiş</option>
                <option value="KADIN" className="bg-black">Kadın</option>
                <option value="ERKEK" className="bg-black">Erkek</option>
                <option value="DIGER" className="bg-black">Diğer</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="mt-4 bg-white text-black h-14 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Save size={20} /> Değişiklikleri Kaydet
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
