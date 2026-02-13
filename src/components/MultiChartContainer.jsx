import React from 'react';
import Chart from '@/components/Chart';
import { cn } from '@/lib/utils';
import { Layers } from 'lucide-react';

export default function MultiChartContainer({ coins = [] }) {
  if (!coins || coins.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/30 rounded-2xl border border-slate-800 text-gray-500 gap-3">
        <Layers className="w-12 h-12 opacity-20" />
        <span className="text-sm font-medium">No coins selected for multi-chart view</span>
        <span className="text-xs text-gray-600">Select a template with multiple assets or add coins manually</span>
      </div>
    );
  }

  // Determine grid layout based on number of coins
  const getGridClass = () => {
    const count = coins.length;
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2';
    if (count === 3) return 'grid-cols-1 md:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2'; // 4 or more: 2x2 grid
  };

  return (
    <div className={cn("grid gap-4 w-full h-full min-h-[500px] bg-slate-950 p-4 overflow-y-auto custom-scrollbar", getGridClass())}>
      {coins.map((coin) => (
        <div 
          key={coin} 
          className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden min-h-[300px] flex flex-col p-1 relative shadow-lg hover:border-purple-500/30 transition-colors"
        >
          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-slate-950/90 rounded border border-slate-700 text-xs font-bold text-purple-300 shadow-sm flex items-center gap-1">
             <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
             {coin}
          </div>
          <div className="flex-1 w-full h-full">
            <Chart symbol={coin} timeframe="15m" />
          </div>
        </div>
      ))}
    </div>
  );
}