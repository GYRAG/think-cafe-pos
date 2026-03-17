import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function LauncherPage() {
  const user = useStore(state => state.user);

  const handleLogout = () => {
    supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative select-none bg-stone-50">
      <button
        onClick={handleLogout}
        className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 hover:bg-stone-100 text-stone-600 rounded-xl font-bold transition-colors shadow-sm"
      >
        <LogOut className="w-5 h-5" />
        გასვლა
      </button>

      <div className="flex flex-col items-center w-full max-w-6xl px-6">
        <h1 className="text-[50px] md:text-[60px] font-black tracking-tight text-green-600 mb-12 text-center drop-shadow-sm">
          🍵 კაფის კონტროლი
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 w-full gap-8">
          <Link
            to="/pos"
            className="w-full aspect-[3/4] md:aspect-auto md:h-96 bg-white hover:bg-stone-50 rounded-[2rem] border-2 border-stone-200 flex flex-col items-center justify-center text-stone-800 transition-all hover:-translate-y-2 active:translate-y-0 shadow-sm hover:shadow-xl group"
          >
            <span className="text-7xl mb-8 group-hover:scale-110 transition-transform">🚀</span>
            <span className="text-3xl font-black text-center px-6">გაყიდვების გვერდი</span>
          </Link>

          <Link
            to="/stock-in"
            className="w-full aspect-[3/4] md:aspect-auto md:h-96 bg-white hover:bg-stone-50 rounded-[2rem] border-2 border-stone-200 flex flex-col items-center justify-center text-stone-800 transition-all hover:-translate-y-2 active:translate-y-0 shadow-sm hover:shadow-xl group"
          >
            <span className="text-7xl mb-8 group-hover:scale-110 transition-transform">📦</span>
            <span className="text-3xl font-black text-center px-6">შევსება / ხარჯები</span>
          </Link>

          {user?.role === 'admin' ? (
            <Link
              to="/admin/reports"
              className="w-full aspect-[3/4] md:aspect-auto md:h-96 bg-white hover:bg-stone-50 rounded-[2rem] border-2 border-stone-200 flex flex-col items-center justify-center text-stone-800 transition-all hover:-translate-y-2 active:translate-y-0 shadow-sm hover:shadow-xl group"
            >
              <span className="text-7xl mb-8 group-hover:scale-110 transition-transform">📊</span>
              <span className="text-3xl font-black text-center px-6">ანგარიშები</span>
            </Link>
          ) : (
            <div className="w-full aspect-[3/4] md:aspect-auto md:h-96 rounded-[2rem] border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 opacity-50">
              <span className="text-7xl mb-8 grayscale">🔒</span>
              <span className="text-2xl font-black text-center px-6">მხოლოდ ადმინისტრატორებისთვის</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
