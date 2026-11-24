import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { TrendingUp, Award, Percent } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function MandiMarginChart({ chartData, comparisonList }) {
  if (!chartData || !chartData.labels || chartData.labels.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-slate-500">
        Loading Mandi-Margin Comparison Analytics...
      </div>
    );
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' },
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return ` ${context.dataset.label}: ₹${context.parsed.y} / kg`;
          },
          afterBody: function (context) {
            const index = context[0].dataIndex;
            const item = comparisonList && comparisonList[index];
            if (item) {
              return [
                `🌾 Farmer Extra Gain: +${item.farmer_extra_profit_pct}% (+₹${item.farmer_gain_per_kg}/kg)`,
                `🏷️ Society Consumer Savings: ${item.consumer_savings_pct}% (-₹${item.consumer_saving_per_kg}/kg)`
              ];
            }
            return [];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Price in INR (₹) per Kilogram',
          font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' }
        },
        grid: { color: '#f1f5f9' }
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' }
        }
      }
    }
  };

  // Compute average extra profit for summary badge
  const avgFarmerGain = comparisonList && comparisonList.length > 0
    ? (comparisonList.reduce((acc, c) => acc + c.farmer_extra_profit_pct, 0) / comparisonList.length).toFixed(1)
    : '32.4';

  const avgBuyerSavings = comparisonList && comparisonList.length > 0
    ? (comparisonList.reduce((acc, c) => acc + c.consumer_savings_pct, 0) / comparisonList.length).toFixed(1)
    : '22.8';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Dynamic Mandi-Margin Comparison Engine
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              Zero-Middleman
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time rate parity comparing APMC base mandi prices, farmer direct rates, and open retail prices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Avg +{avgFarmerGain}% to Farmer</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>Avg {avgBuyerSavings}% Society Savings</span>
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-72 w-full">
        <Bar data={chartData} options={options} />
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs text-slate-600">
        <div className="p-2.5 bg-slate-50 rounded-xl">
          <span className="font-semibold text-slate-700 block">APMC Base (Grey)</span>
          <span className="text-[11px] text-slate-500">Government mandi clearing benchmark</span>
        </div>
        <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-100">
          <span className="font-bold text-emerald-800 block">Farm2Plate Direct (Green)</span>
          <span className="text-[11px] text-emerald-700">100% directly credited into farmer escrow</span>
        </div>
        <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-100">
          <span className="font-bold text-amber-800 block">City Retail (Yellow)</span>
          <span className="text-[11px] text-amber-700">Middlemen markups eliminated</span>
        </div>
      </div>
    </div>
  );
}
