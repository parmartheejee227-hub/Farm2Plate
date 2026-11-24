import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Sprout,
  LogOut,
  Wallet,
  Activity,
  Layers,
  ShoppingBag,
  TrendingUp,
  MapPin,
  CheckCircle2
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenGateVerify }) {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'farmer':
        return { label: 'Kisan (Farmer)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'buyer':
        return { label: 'Society Buyer', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'admin':
        return { label: 'Coop Admin', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
      default:
        return { label: role, color: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  const badge = user ? getRoleBadge(user.role) : null;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Farm<span className="text-emerald-600">2</span>Plate
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Cluster-Pooled
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Hyperlocal Farm-to-Society Supply & Traceability
              </p>
            </div>
          </div>

          {/* Navigation Tabs based on Role */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {user.role === 'admin' && (
                <>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === 'dashboard'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    Overview & Margins
                  </button>
                  <button
                    onClick={() => setActiveTab('logistics')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === 'logistics'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Route Consolidation
                  </button>
                  <button
                    onClick={() => setActiveTab('escrow')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === 'escrow'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Escrow Ledger
                  </button>
                </>
              )}

              {user.role === 'buyer' && (
                <>
                  <button
                    onClick={() => setActiveTab('market')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === 'market'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Hyperlocal Market
                  </button>
                  <button
                    onClick={() => setActiveTab('my-orders')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === 'my-orders'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    My Society Orders
                  </button>
                </>
              )}

              {user.role === 'farmer' && (
                <>
                  <button
                    onClick={() => setActiveTab('my-harvests')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === 'my-harvests'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sprout className="w-3.5 h-3.5" />
                    My Harvest Batches
                  </button>
                  <button
                    onClick={() => setActiveTab('farmer-orders')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === 'farmer-orders'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Orders & Payouts
                  </button>
                </>
              )}
            </nav>
          )}

          {/* Right Section: Socket Status, Wallet, Profile, Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Gate QR Verify Trigger (accessible anytime for testing) */}
            <button
              onClick={onOpenGateVerify}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              title="Society Gate Pickup & Quality QR Verification"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gate QR Verify</span>
              <span className="sm:hidden">Verify</span>
            </button>

            {/* Socket Live Indicator */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
              title={isConnected ? 'Real-Time Socket.io Live Sync' : 'Reconnecting to Socket.io...'}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className="hidden lg:inline">{isConnected ? 'Socket: Live' : 'Offline'}</span>
            </div>

            {/* User Wallet Balance */}
            {user && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-lg text-amber-900 text-xs font-semibold">
                <Wallet className="w-3.5 h-3.5 text-amber-600" />
                <span>₹{parseFloat(user.wallet_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {/* User Info & Role */}
            {user && (
              <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">{user.name}</div>
                  <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1">
                    <MapPin className="w-2.5 h-2.5" />
                    <span className="truncate max-w-[120px]">{user.village_or_society}</span>
                  </div>
                </div>
                {badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.color}`}>
                    {badge.label}
                  </span>
                )}
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
