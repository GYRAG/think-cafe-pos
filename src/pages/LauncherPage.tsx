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

      <div className="flex flex-col items-center w-full max-w-xl px-6">
        <h1 className="text-[50px] md:text-[60px] font-black tracking-tight text-green-600 mb-12 text-center drop-shadow-sm">
          🍵 კაფის კონტროლი
        </h1>

        <div className="flex flex-col w-full gap-5">
          <Link
            to="/pos"
            className="w-full py-10 bg-white hover:bg-stone-50 rounded-3xl border border-stone-200 flex flex-col items-center justify-center text-stone-800 transition-all hover:-translate-y-1 active:translate-y-0 shadow-sm hover:shadow-md"
          >
            <span className="text-5xl mb-4">🚀</span>
            <span className="text-2xl md:text-3xl font-black">გაყიდვების გვერდი</span>
          </Link>

          <Link
            to="/stock-in"
            className="w-full py-10 bg-white hover:bg-stone-50 rounded-3xl border border-stone-200 flex flex-col items-center justify-center text-stone-800 transition-all hover:-translate-y-1 active:translate-y-0 shadow-sm hover:shadow-md"
          >
            <span className="text-5xl mb-4">📦</span>
            <span className="text-2xl md:text-3xl font-black">შევსება / ხარჯები</span>
          </Link>

          {user?.role === 'admin' && (
            <Link
              to="/admin/reports"
              className="w-full py-10 bg-white hover:bg-stone-50 rounded-3xl border border-stone-200 flex flex-col items-center justify-center text-stone-800 transition-all hover:-translate-y-1 active:translate-y-0 shadow-sm hover:shadow-md"
            >
              <span className="text-5xl mb-4">📊</span>
              <span className="text-2xl md:text-3xl font-black">ანგარიშები</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
