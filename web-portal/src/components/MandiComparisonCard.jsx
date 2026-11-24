import React from 'react';
import { TrendingUp, ShoppingBag, CheckCircle, AlertTriangle, Shield, User, MapPin } from 'lucide-react';

export default function MandiComparisonCard({ batch, onOrderClick }) {
  const mandiRate = parseFloat(batch.mandi_rate_per_kg);
  const farmerPrice = parseFloat(batch.farmer_price_per_kg);
  const retailPrice = parseFloat(batch.estimated_retail_price || (farmerPrice * 1.35).toFixed(2));
  
  // Extra profit for farmer
  const extraProfitPct = parseFloat(batch.farmer_extra_profit_pct || (((farmerPrice - mandiRate) / mandiRate) * 100).toFixed(1));
  // Consumer savings
  const consumerSavingsPct = parseFloat(batch.consumer_savings_pct || (((retailPrice - farmerPrice) / retailPrice) * 100).toFixed(1));
  const availableQty = parseFloat(batch.available_qty_kg);
  const totalQty = parseFloat(batch.total_qty_kg);
  const isSoldOut = availableQty <= 0 || batch.status === 'SOLD_OUT';
  const stockPct = totalQty > 0 ? Math.min(100, Math.round((availableQty / totalQty) * 100)) : 0;

  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white shadow-xs hover:shadow-md flex flex-col justify-between ${
      isSoldOut ? 'border-slate-200 opacity-75' : 'border-slate-200 hover:border-emerald-300'
    }`}>
      {/* Top Header Card */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-slate-900 tracking-tight">
                {batch.crop_name}
              </h3>
              <span className="font-hindi text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                {batch.crop_name_hi}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <User className="w-3 h-3 text-slate-400" />
              <span>{batch.farmer_name}</span>
              <span className="text-slate-300">•</span>
              <MapPin className="w-3 h-3 text-slate-400" />
              <span className="truncate max-w-[150px]">{batch.farmer_village}</span>
            </p>
          </div>

          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${
            isSoldOut
              ? 'bg-slate-100 text-slate-600 border-slate-300'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {isSoldOut ? 'Sold Out' : 'Active Batch'}
          </span>
        </div>

        {/* Dynamic Mandi vs Farmer Direct vs Retail Comparison Badges */}
        <div className="grid grid-cols-3 gap-2 my-4 p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-center">
          <div className="p-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">APMC Mandi</span>
            <span className="text-sm font-semibold text-slate-500 line-through">₹{mandiRate}</span>
            <span className="text-[10px] text-slate-400 block">base rate</span>
          </div>
          <div className="p-1 bg-emerald-50/80 rounded-lg border border-emerald-100">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Farmer Price</span>
            <span className="text-base font-extrabold text-emerald-700">₹{farmerPrice}</span>
            <span className="text-[10px] text-emerald-600 font-semibold block">direct pay</span>
          </div>
          <div className="p-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Retail Market</span>
            <span className="text-sm font-semibold text-amber-600">₹{retailPrice}</span>
            <span className="text-[10px] text-slate-400 block">middlemen</span>
          </div>
        </div>

        {/* Win-Win Margin Metrics */}
        <div className="flex items-center justify-between gap-2 text-xs py-1">
          <div className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-md">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>+{extraProfitPct}% to Kisan</span>
          </div>
          <div className="flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-1 rounded-md">
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span>Save {consumerSavingsPct}%</span>
          </div>
        </div>

        {/* Real-time Stock Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500 font-medium">Available Quantity:</span>
            <span className={`font-bold ${isSoldOut ? 'text-rose-600' : 'text-slate-900'}`}>
              {availableQty} kg <span className="text-slate-400 font-normal">/ {totalQty} kg</span>
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                stockPct < 20 ? 'bg-rose-500' : stockPct < 50 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${stockPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
            <span>QR Code: <code className="text-slate-600 font-mono">{batch.qr_batch_code}</code></span>
            <span>{stockPct}% remaining</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="text-xs">
          <span className="text-slate-500 block">Society Unit Price</span>
          <span className="font-extrabold text-slate-900 text-sm">₹{farmerPrice} <span className="text-xs font-normal text-slate-400">/ kg</span></span>
        </div>

        <button
          onClick={() => onOrderClick && onOrderClick(batch)}
          disabled={isSoldOut}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs ${
            isSoldOut
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-emerald-600/20'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{isSoldOut ? 'Sold Out' : 'Pool for Society Gate'}</span>
        </button>
      </div>
    </div>
  );
}
