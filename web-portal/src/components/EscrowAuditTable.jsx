import React from 'react';
import { ShieldCheck, CheckCircle2, Clock, AlertTriangle, QrCode } from 'lucide-react';

export default function EscrowAuditTable({ orders, onVerifyClick }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-xs">
        No orders found in the escrow ledger.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg text-slate-900">
            Escrow Audit Ledger & Traceability Log
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Complete cryptographic audit trail of all cluster pool funds held and disbursed to farmers.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <th className="py-3 px-4">Order & Time</th>
              <th className="py-3 px-4">Crop & Kisan</th>
              <th className="py-3 px-4">Society Buyer</th>
              <th className="py-3 px-4">Gate Hub</th>
              <th className="py-3 px-4 text-right">Quantity</th>
              <th className="py-3 px-4 text-right">Escrow Sum</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">QR Token & Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o) => {
              const isHeld = o.escrow_status === 'HELD_IN_ESCROW';
              const isReleased = o.escrow_status === 'VERIFIED_RELEASED';

              return (
                <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-slate-800">{o.id}</div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                      {new Date(o.created_at).toLocaleDateString()}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{o.crop_name}</div>
                    <div className="text-[11px] text-slate-500 font-hindi">
                      {o.crop_name_hi} • {o.farmer_name}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{o.buyer_name}</div>
                    <div className="text-[10px] text-slate-400">{o.buyer_phone || 'Society Member'}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-700">{o.cluster_name}</div>
                    <div className="text-[10px] text-slate-400">{o.drop_time_window}</div>
                  </td>

                  <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                    {o.ordered_qty_kg} kg
                  </td>

                  <td className="py-3.5 px-4 text-right font-black text-emerald-700 text-sm">
                    ₹{parseFloat(o.total_amount).toFixed(2)}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isReleased
                          ? 'bg-emerald-100 text-emerald-800'
                          : isHeld
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isReleased ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Released</span>
                        </>
                      ) : isHeld ? (
                        <>
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>In Escrow</span>
                        </>
                      ) : (
                        <span>Disputed</span>
                      )}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <code className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono">
                        {o.pickup_qr_token}
                      </code>

                      {isHeld && onVerifyClick && (
                        <button
                          onClick={() => onVerifyClick(o.pickup_qr_token)}
                          className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors"
                          title="Verify Pickup and Release Escrow"
                        >
                          Verify Gate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
