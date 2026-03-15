import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { getProfile, getNameFromSession, AppRole } from './lib/auth';
import { useStore } from './store';

import POSLayout from './components/POSLayout';
import AdminLayout from './components/AdminLayout';
import POSPage from './pages/POSPage';
import DashboardPage from './pages/admin/DashboardPage';
import ProductsPage from './pages/admin/ProductsPage';
import ExpensesPage from './pages/admin/ExpensesPage';
import ReportsPage from './pages/admin/ReportsPage';
import UsersPage from './pages/admin/UsersPage';
import LoginPage from './pages/LoginPage';

function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined); // undefined = loading
  const login = useStore(state => state.login);
  const logout = useStore(state => state.logout);
  const user = useStore(state => state.user);

  useEffect(() => {
    let mounted = true;

    async function handleSession(session: Session | null) {
      if (!mounted) return;
      if (session) {
        const profile = await getProfile(session);
        // Fallback to cashier if profile not found (defensive)
        const role = profile?.role ?? 'cashier';
        const name = profile?.display_name ?? getNameFromSession(session);
        login(name, role);
      } else {
        logout();
      }
      setSession(session);
    }

    // Check on mount
    supabase.auth.getSession().then(({ data }) => handleSession(data.session));

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Don't rerun if session is just refreshing its token via the same user
      if (session?.user?.id !== newSession?.user?.id) {
        setSession(undefined); // trigger loading state again while fetching profile
        handleSession(newSession);
      } else {
        setSession(newSession);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [login, logout, session?.user?.id]);

  // Still checking session or fetching profile
  if (session === undefined) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || !user) {
    return <LoginPage />;
  }

  return (
    <Router>
      <Routes>
        {/* POS — all authenticated users */}
        <Route path="/" element={<POSLayout />}>
          <Route index element={<POSPage />} />
        </Route>

        {/* Admin — only admin role */}
        {user.role === 'admin' ? (
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>
        ) : (
          <Route path="/admin/*" element={<Navigate to="/" replace />} />
        )}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
