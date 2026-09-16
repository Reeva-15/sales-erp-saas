import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
import { ApiService } from '../../services/api';
import { ArrowRight, Lock, User, Sparkles, Building2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('clientadmin');
  const [password, setPassword] = useState('Client@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await ApiService.post('/auth/login', { username, password });
      ApiService.setToken(data.token);
      localStorage.setItem('marronex_user', JSON.stringify(data.user));

      if (data.user.isMainAdmin) {
        navigate('/admin/dashboard');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (userType: 'MAIN_ADMIN' | 'CLIENT_ADMIN' | 'SALES_MANAGER') => {
    if (userType === 'MAIN_ADMIN') {
      setUsername('mainadmin');
      setPassword('Admin@123');
    } else if (userType === 'CLIENT_ADMIN') {
      setUsername('clientadmin');
      setPassword('Client@123');
    } else {
      setUsername('salesmanager');
      setPassword('Client@123');
    }
  };

  return (
    <div className="min-h-screen bg-[#2B1218] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glass Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-marron-700/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-marron-800/40 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo Banner */}
        <div className="text-center mb-8">
          <Logo className="justify-center h-12 mb-3" light />
          <p className="text-sm text-marron-200">Sell smarter. Operate beautifully.</p>
        </div>

        {/* Login Card */}
        <div className="glass-card-dark rounded-3xl p-8 border border-marron-700/50 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-xs text-marron-200 mb-6">Sign in to your Marronex Sales ERP environment.</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-marron-200 mb-1">Username or Email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-marron-300" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-marron-900/60 border border-marron-700/60 rounded-xl text-sm text-white placeholder-marron-400 focus:outline-none focus:ring-2 focus:ring-marron-500 transition"
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-marron-200 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-marron-300" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-marron-900/60 border border-marron-700/60 rounded-xl text-sm text-white placeholder-marron-400 focus:outline-none focus:ring-2 focus:ring-marron-500 transition"
                  placeholder="Enter password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-marron-600 hover:bg-marron-500 text-white font-semibold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 group mt-2"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-8 pt-6 border-t border-marron-700/40 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-marron-300 mb-3">Quick Demo Login Presets</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoUser('MAIN_ADMIN')}
                className="p-2 rounded-xl bg-marron-900/80 hover:bg-marron-800 border border-marron-700/60 text-[11px] text-marron-200 hover:text-white transition flex flex-col items-center gap-1"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>SaaS Main Admin</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoUser('CLIENT_ADMIN')}
                className="p-2 rounded-xl bg-marron-900/80 hover:bg-marron-800 border border-marron-700/60 text-[11px] text-marron-200 hover:text-white transition flex flex-col items-center gap-1"
              >
                <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Client Admin</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoUser('SALES_MANAGER')}
                className="p-2 rounded-xl bg-marron-900/80 hover:bg-marron-800 border border-marron-700/60 text-[11px] text-marron-200 hover:text-white transition flex flex-col items-center gap-1"
              >
                <User className="h-3.5 w-3.5 text-indigo-400" />
                <span>Sales Manager</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-marron-300/60 mt-6">
          © 2026 MARRONEX Inc. All rights reserved. Multi-Tenant ERP Platform.
        </p>
      </div>
    </div>
  );
};
