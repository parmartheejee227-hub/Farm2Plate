import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DemoLoginBar from '../components/DemoLoginBar';
import { Sprout, Phone, Lock, ArrowRight, ShieldCheck, CheckCircle2, TrendingUp, Users } from 'lucide-react';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [phone, setPhone] = useState('9876543220');
  const [password, setPassword] = useState('farm123');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      setSubmitting(true);
      const res = await login(phone, password);
      if (!res.success) {
        setError(res.error || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Login error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between text-slate-100">
      {/* Top Demo Banner */}
      <div className="p-4 max-w-6xl mx-auto w-full">
        <DemoLoginBar />
      </div>

      {/* Main Content Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white text-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* Left Hero Graphic Section */}
          <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/50 border border-emerald-400/30 text-emerald-200 text-xs font-semibold mb-6">
                <Sprout className="w-3.5 h-3.5 text-emerald-300" />
                <span>Hyperlocal Cluster Ecosystem</span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
                Farm<span className="text-emerald-300">2</span>Plate
              </h1>
              <p className="text-sm text-emerald-100/90 mt-2 font-medium">
                Direct Farm-to-Society Supply Chain & Cryptographic Traceability.
              </p>

              <div className="mt-8 space-y-3.5 text-xs text-emerald-100">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <span><strong>ACID Stock Locking:</strong> Eliminates overselling via PostgreSQL row-level locks.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <span><strong>Cluster-Drop Pooling:</strong> Aggregated Society Gate hubs slash delivery costs by 65%.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <span><strong>2-Step QR Escrow:</strong> Instant atomic farmer payout upon gate quality verification.</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-emerald-600/50 flex items-center justify-between text-[11px] text-emerald-200">
              <span>WTMP Course Project</span>
              <span className="font-mono">v1.0.0 Production</span>
            </div>
          </div>

          {/* Right Form Section */}
          <div className="p-8 sm:p-10 flex flex-col justify-center">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your credentials or use the 1-click Quick Demo bar above.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543220"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                    required
                  />
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Default seed password: <code className="text-slate-600 font-mono">farm123</code>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || loading}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{submitting ? 'Authenticating...' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
              PostgreSQL ACID Locking • Socket.io Sync • Expo React Native
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-500">
        Farm2Plate Hyperlocal Agri-Tech Ecosystem • Web Technologies & Mobile Programming
      </footer>
    </div>
  );
}
