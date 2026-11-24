import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sprout, ShoppingCart, ShieldCheck } from 'lucide-react';

export default function DemoLoginBar({ onLoginSuccess }) {
  const { demoLogin, loading } = useAuth();

  const handleQuickLogin = async (role) => {
    try {
      const res = await demoLogin(role);
      if (res.success && onLoginSuccess) {
        onLoginSuccess(res.user);
      }
    } catch (err) {
      alert('Demo login failed: ' + err.message);
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 rounded-xl p-4 shadow-xl text-white">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <h4 className="text-xs font-semibold tracking-wider uppercase text-emerald-400">
              WTMP Evaluation Demo Bar
            </h4>
            <p className="text-xs text-slate-300">
              One-click instant authentication for course personas (No password required)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Farmer Persona */}
          <button
            onClick={() => handleQuickLogin('farmer')}
            disabled={loading}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm hover:shadow-emerald-500/25 active:scale-95 disabled:opacity-50"
          >
            <Sprout className="w-3.5 h-3.5 text-emerald-200" />
            <span>Farmer (Ramesh Patel)</span>
          </button>

          {/* Society Buyer Persona */}
          <button
            onClick={() => handleQuickLogin('buyer')}
            disabled={loading}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-sm hover:shadow-amber-500/25 active:scale-95 disabled:opacity-50"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-amber-200" />
            <span>Buyer (Ananya Sharma)</span>
          </button>

          {/* Coop Admin Persona */}
          <button
            onClick={() => handleQuickLogin('admin')}
            disabled={loading}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm hover:shadow-indigo-500/25 active:scale-95 disabled:opacity-50"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-200" />
            <span>Coop Admin (Logistics)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
