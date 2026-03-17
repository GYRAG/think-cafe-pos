import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { getProfile, getNameFromSession, AppRole } from './lib/auth';
import { useStore } from './store';

// Critical-path — load eagerly (always needed on first render)
import POSLayout from './components/POSLayout';
import LauncherPage from './pages/LauncherPage';
import POSPage from './pages/POSPage';
import StockInPage from './pages/StockInPage';
import LoginPage from './pages/LoginPage';

// Admin pages — lazy loaded, only downloaded when user navigates to /admin
const AdminLayout   = lazy(() => import('./components/AdminLayout'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const ProductsPage  = lazy(() => import('./pages/admin/ProductsPage'));
const ExpensesPage  = lazy(() => import('./pages/admin/ExpensesPage'));
const ReportsPage   = lazy(() => import('./pages/admin/ReportsPage'));
const UsersPage     = lazy(() => import('./pages/admin/UsersPage'));

const PageSpinner = () => (
  <div className="flex items-center justify-center h-full min-h-screen bg-stone-100">
    <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const login  = useStore(state => state.login);
  const logout = useStore(state => state.logout);
  const user   = useStore(state => state.user);

  useEffect(() => {
    let mounted = true;

    async function handleSession(session: Session | null) {
      if (!mounted) return;
      if (session) {
        const profile = await getProfile(session);
        const role = profile?.role ?? 'cashier';
        const name = profile?.display_name ?? getNameFromSession(session);
        login(name, role);
      } else {
        logout();
      }
      setSession(session);
    }

    supabase.auth.getSession().then(({ data }) => handleSession(data.session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (session?.user?.id !== newSession?.user?.id) {
        setSession(undefined);
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

  // Loading profile
  if (session === undefined) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || !user) {
    return <LoginPage />;
  }

  return (
    <Router>
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          {/* General Cashier/Launcher Routes */}
          <Route path="/" element={<LauncherPage />} />
          <Route path="/stock-in" element={<StockInPage />} />

          {/* POS Layout for actual POS selling */}
          <Route path="/pos" element={<POSLayout />}>
            <Route index element={<POSPage />} />
          </Route>

          {/* Admin — only admin role */}
          {user.role === 'admin' ? (
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="products"  element={<ProductsPage />} />
              <Route path="expenses"  element={<ExpensesPage />} />
              <Route path="reports"   element={<ReportsPage />} />
              <Route path="users"     element={<UsersPage />} />
            </Route>
          ) : (
            <Route path="/admin/*" element={<Navigate to="/" replace />} />
          )}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
