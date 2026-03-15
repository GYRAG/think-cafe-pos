import { Outlet, Link } from 'react-router-dom';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';
import { LogOut, Settings } from 'lucide-react';

export default function POSLayout() {
  const user = useStore(state => state.user);
  const handleLogout = () => supabase.auth.signOut();

  return (
    <div className="flex flex-col h-screen bg-stone-100 font-sans text-stone-900 overflow-hidden">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-orange-700">Cafe POS</h1>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
