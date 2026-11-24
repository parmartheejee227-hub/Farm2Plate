import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import MandiMarginChart from '../components/MandiMarginChart';
import ClusterConsolidationView from '../components/ClusterConsolidationView';
import EscrowAuditTable from '../components/EscrowAuditTable';
import {
  TrendingUp,
  ShieldCheck,
  Package,
  Users,
  Coins,
  RefreshCw,
  QrCode
} from 'lucide-react';

export default function AdminDashboard({ onOpenGateVerify }) {
  const { lastStockUpdate, lastEscrowRelease } = useSocket();
  const [kpis, setKpis] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [comparisonList, setComparisonList] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [kpiRes, mandiRes, ordersRes] = await Promise.all([
        api.getKpis(),
        api.getMandiComparison(),
        api.getAllOrders()
      ]);

      if (kpiRes.success) setKpis(kpiRes.data);
      if (mandiRes.success) {
        setChartData(mandiRes.chartData);
        setComparisonList(mandiRes.comparisonList);
      }
      if (ordersRes.success) setOrders(ordersRes.data);
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // React to live socket events without full page refresh
  useEffect(() => {
    if (lastStockUpdate || lastEscrowRelease) {
      loadData();
    }
  }, [lastStockUpdate, lastEscrowRelease]);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Welcome & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Coop Logistics & Mandi Admin
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time oversight of cluster-pooled delivery hubs, APMC mandi margins, and escrow releases.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Metrics</span>
          </button>

          <button
            onClick={onOpenGateVerify}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Gate QR Scanner</span>
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase mb-1">
            <span>Escrow In Custody</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{parseFloat(kpis?.total_escrow_held || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-amber-600 font-semibold">
            {orders.filter((o) => o.escrow_status === 'HELD_IN_ESCROW').length} orders pending gate verification
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase mb-1">
            <span>Escrow Disbursed</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            ₹{parseFloat(kpis?.total_escrow_released || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">
            Credited atomically to farmers
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase mb-1">
            <span>Active Harvest Cargo</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {kpis?.active_harvest_kg || 0} kg
          </div>
          <span className="text-[11px] text-slate-500">
            Across {kpis?.active_batches_count || 0} active farm batches
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase mb-1">
            <span>Registered Network</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {(kpis?.registered_farmers || 0) + (kpis?.registered_buyers || 0)}
          </div>
          <span className="text-[11px] text-indigo-600 font-semibold">
            {kpis?.registered_farmers || 0} Farmers • {kpis?.registered_buyers || 0} Society Buyers
          </span>
        </div>
      </div>

      {/* Core Feature 4: Dynamic Mandi-Margin Comparison Engine */}
      <section>
        <MandiMarginChart chartData={chartData} comparisonList={comparisonList} />
      </section>

      {/* Core Feature 2: Route Consolidation & Cluster-Drop Logistics */}
      <section>
        <ClusterConsolidationView />
      </section>

      {/* Core Feature 3: Escrow Audit Ledger */}
      <section>
        <EscrowAuditTable orders={orders} onVerifyClick={onOpenGateVerify} />
      </section>
    </div>
  );
}
