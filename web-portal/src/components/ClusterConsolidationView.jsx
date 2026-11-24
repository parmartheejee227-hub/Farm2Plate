import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Truck, Clock, MapPin, Package, ArrowRight, CheckCircle2, Leaf, Shield } from 'lucide-react';

export default function ClusterConsolidationView() {
  const [consolidation, setConsolidation] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchConsolidation = async () => {
    try {
      setLoading(true);
      const res = await api.getConsolidation();
      if (res.success) {
        setConsolidation(res);
      }
    } catch (err) {
      console.error('Failed to load consolidation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsolidation();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500">
        Aggregating Hyperlocal Cluster Logistics...
      </div>
    );
  }

  const summary = consolidation?.network_summary || {};
  const clusters = consolidation?.data || [];

  return (
    <div className="space-y-6">
      {/* Network Header KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-1">
            <span>Society Gate Hubs</span>
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{summary.total_clusters || 0}</div>
          <span className="text-[11px] text-emerald-600 font-medium">Aggregated delivery drops</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-1">
            <span>Total Pooled Harvest</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{summary.total_network_kg || 0} kg</div>
          <span className="text-[11px] text-slate-500">From verified farm batches</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-1">
            <span>Logistics Savings</span>
            <Truck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-700">~65%</div>
          <span className="text-[11px] text-slate-500">Vs door-to-door delivery</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-1">
            <span>Carbon Emission Saved</span>
            <Leaf className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">
            {((summary.total_network_kg || 0) * 0.18).toFixed(1)} kg CO₂
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Consolidated route footprint</span>
        </div>
      </div>

      {/* Society Gate Cluster List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-slate-900">
              Cluster Route Consolidation & Society Gate Hubs
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Orders aggregated per Society Gate to enable unified EV truck drops and zero doorstep delivery overhead.
            </p>
          </div>
          <button
            onClick={fetchConsolidation}
            className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            Refresh Consolidation
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {clusters.map((c) => (
            <div key={c.cluster_id} className="p-6 hover:bg-slate-50/70 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Gate Name and Time Window */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h4 className="font-bold text-base text-slate-900">{c.cluster_name}</h4>
                    <span className="text-xs font-medium text-slate-500">({c.city})</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-md font-semibold border border-amber-200">
                      <Clock className="w-3 h-3 text-amber-600" />
                      Drop Window: {c.drop_time_window}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      Origin Farms: <strong className="text-slate-700">{c.origin_villages.join(', ')}</strong>
                    </span>
                  </div>
                </div>

                {/* Aggregated Volume & Values */}
                <div className="flex flex-wrap items-center gap-4 lg:gap-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Pooled</span>
                    <span className="text-base font-extrabold text-emerald-700">{c.total_pooled_kg} kg</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Society Orders</span>
                    <span className="text-base font-extrabold text-slate-800">{c.order_count} orders</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Cluster Value</span>
                    <span className="text-base font-extrabold text-slate-900">₹{c.total_cluster_value}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Logistics Status</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      c.route_status === 'TRUCK_DISPATCH_READY'
                        ? 'bg-emerald-100 text-emerald-800'
                        : c.route_status === 'POOLING_ACTIVE'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {c.route_status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Crop Manifest Breakdown */}
              {c.crops_breakdown && c.crops_breakdown.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100/80">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Pooled Crop Cargo Manifest:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.crops_breakdown.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-2xs"
                      >
                        <span className="font-bold text-emerald-700">{item.total_kg} kg</span>
                        <span>{item.crop_name}</span>
                        <span className="font-hindi text-slate-400">({item.crop_name_hi})</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] text-slate-500">{item.order_count} pkgs</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
