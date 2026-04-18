import { Outlet, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import { LogOut, LayoutDashboard, Package, Receipt, BarChart3, ArrowLeft, Power } from 'lucide-react';
import { clsx } from 'clsx';

export default function AdminLayout() {
  const location = useLocation();
  const showNotification = useStore(state => state.showNotification);
  const handleLogout = () => supabase.auth.signOut();

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'დაფა' },
    { path: '/admin/products', icon: Package, label: 'პროდუქტები' },
    { path: '/admin/expenses', icon: Receipt, label: 'ხარჯები' },
    { path: '/admin/reports', icon: BarChart3, label: 'რეპორტები' },
    { path: '/admin/ingredients', icon: Package, label: 'ინგრედიენტები' },
  ];

  return (
    <div className="flex h-screen bg-stone-100 font-sans text-stone-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-200 flex flex-col">
        <div className="p-6 border-b border-stone-200 flex items-center gap-3">
          <img src="./src/assets/logo-think-corner.jpg" alt="ფიქრის კუთხე" className="w-8 h-8 rounded-lg object-cover shadow-sm" />
          <h1 className="text-xl font-black text-stone-800 tracking-tight">ფიქრის კუთხე</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                  isActive
                    ? "bg-green-100 text-green-800 font-medium"
                    : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-stone-200 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            POS-ში დაბრუნება
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            გასვლა
          </button>
          <button
            onClick={() => {
              showNotification('გსურთ პროგრამის გათიშვა?', 'error', true, () => window.close());
            }}
            title="Close app"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-stone-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Power className="w-5 h-5" />
            დახურვა
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
