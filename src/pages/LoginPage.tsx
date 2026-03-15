import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Coffee, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError('არასწორი მომხმარებელი ან პაროლი');
    }
    // On success, App.tsx will re-render automatically via the onAuthStateChange listener
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 font-sans text-stone-900">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src="./src/assets/logo-think-corner.jpg" alt="ფიქრის კუთხე" className="w-20 h-20 rounded-2xl object-cover shadow-sm mb-4" />
          <h1 className="text-3xl font-bold text-stone-800 tracking-tight">ფიქრის კუთხე</h1>
          <p className="text-stone-500 mt-2">სისტემაში შესვლა</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700 block">იმეილი</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              placeholder="example@cafe.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700 block">პაროლი</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-colors shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                შესვლა...
              </>
            ) : 'შესვლა'}
          </button>
        </form>
      </div>
    </div>
  );
}
