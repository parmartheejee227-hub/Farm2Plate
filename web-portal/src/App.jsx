import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';
import Navbar from './components/Navbar';
import GateVerifyModal from './components/GateVerifyModal';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import BuyerMarketplace from './pages/BuyerMarketplace';
import FarmerBatches from './pages/FarmerBatches';
import ClusterConsolidationView from './components/ClusterConsolidationView';
import EscrowAuditTable from './components/EscrowAuditTable';
import { api } from './services/api';
import { X, Bell, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const { liveAlerts, removeAlert } = useSocket();
  const [activeTab, setActiveTab] = useState('default');
  const [showGateVerify, setShowGateVerify] = useState(false);
  const [allOrders, setAllOrders] = useState([]);

  // Fetch orders for escrow ledger view
  const loadAllOrders = async () => {
    try {
      const res = await api.getAllOrders();
      if (res.success) setAllOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // If loading session
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-semibold">
        Initializing Farm2Plate Ecosystem...
      </div>
    );
  }

  // If not logged in, render LoginPage
  if (!user) {
    return <LoginPage />;
  }

  // Determine current active tab default based on role
  const currentTab = activeTab === 'default'
    ? (user.role === 'admin' ? 'dashboard' : user.role === 'buyer' ? 'market' : 'my-harvests')
    : activeTab;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Toast Notification Stream (Socket.io Real-time alerts) */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {liveAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-start justify-between gap-3 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300 ${
              alert.type === 'escrow'
                ? 'bg-emerald-900/95 text-white border-emerald-500'
                : alert.type === 'stock'
                ? 'bg-slate-900/95 text-white border-slate-700'
                : 'bg-indigo-950/95 text-white border-indigo-700'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className="p-1 rounded-lg bg-white/10 shrink-0 mt-0.5">
                {alert.type === 'escrow' ? (
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                ) : (
                  <Bell className="w-4 h-4 text-amber-300" />
                )}
              </span>
              <div>
                <h4 className="text-xs font-bold leading-tight">{alert.title}</h4>
                <p className="text-[11px] text-slate-200 mt-0.5 leading-snug">{alert.message}</p>
              </div>
            </div>
            <button
              onClick={() => removeAlert(alert.id)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Main Navbar */}
      <Navbar
        activeTab={currentTab}
        setActiveTab={setActiveTab}
        onOpenGateVerify={() => setShowGateVerify(true)}
      />

      {/* Dynamic Content by Role & Tab */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex-1 w-full">
        {/* Admin Views */}
        {user.role === 'admin' && (
          <>
            {currentTab === 'dashboard' && (
              <AdminDashboard onOpenGateVerify={() => setShowGateVerify(true)} />
            )}
            {currentTab === 'logistics' && (
              <div className="space-y-6">
                <h1 className="text-2xl font-black text-slate-900">Route & Cluster Consolidation</h1>
                <ClusterConsolidationView />
              </div>
            )}
            {currentTab === 'escrow' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-black text-slate-900">Escrow Ledger & Disbursal Logs</h1>
                  <button
                    onClick={() => {
                      loadAllOrders();
                      setShowGateVerify(true);
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                  >
                    Verify QR Token
                  </button>
                </div>
                <EscrowAuditTable orders={allOrders} onVerifyClick={() => setShowGateVerify(true)} />
              </div>
            )}
          </>
        )}

        {/* Buyer Views */}
        {user.role === 'buyer' && (
          <BuyerMarketplace
            activeTab={currentTab}
            onOpenGateVerify={() => setShowGateVerify(true)}
          />
        )}

        {/* Farmer Views */}
        {user.role === 'farmer' && (
          <FarmerBatches activeTab={currentTab} />
        )}
      </main>

      {/* Society Gate Verification Modal */}
      {showGateVerify && (
        <GateVerifyModal
          onClose={() => setShowGateVerify(false)}
          onVerifySuccess={() => {
            loadAllOrders();
          }}
        />
      )}

      {/* Modern Agri-Tech Footer */}
      <footer className="mt-16 bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800">Farm2Plate</span>
            <span>• Hyperlocal Cluster-Pooled Farm-to-Society Supply & Traceability Ecosystem</span>
          </div>
          <div className="text-slate-400">
            WTMP Project • Node.js Express • PostgreSQL ACID • React • React Native
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
