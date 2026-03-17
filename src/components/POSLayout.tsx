import { Outlet, Link } from 'react-router-dom';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';
import { LogOut, Settings, Power } from 'lucide-react';

export default function POSLayout() {
  const user = useStore(state => state.user);
  const handleLogout = () => supabase.auth.signOut();

  return (
    <div className="flex flex-col h-screen bg-stone-100 font-sans text-stone-900 overflow-hidden">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="./src/assets/logo-think-corner.jpg" alt="ფიქრის კუთხე" className="w-8 h-8 rounded-lg object-cover shadow-sm" />
            <h1 className="text-xl font-black text-stone-800 tracking-tight">ფიქრის კუთხე</h1>
          </div>
          <span className="px-3 py-1 bg-stone-100 rounded-full text-sm font-medium text-stone-600">
            {user?.username} ({user?.role === 'admin' ? 'ადმინი' : 'მოლარე'})
          </span>
        </div>

        <div className="flex items-center gap-4">
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-medium transition-colors"
            >
              <Settings className="w-5 h-5" />
              ადმინ პანელი
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            გასვლა
          </button>
          <button
            onClick={() => { if (window.confirm('გათიშვა? / Close app?')) window.close(); }}
            title="Close app"
            className="flex items-center gap-2 px-4 py-2 text-stone-500 hover:bg-red-50 hover:text-red-600 rounded-xl font-medium transition-colors"
          >
            <Power className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
