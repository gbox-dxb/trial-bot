import React from 'react';
import { FileText } from 'lucide-react';

export default function PriceMovementTrades({ trades = [] }) {
  // Filter for only Price Movement Bot generated trades
  const botTrades = trades.filter(t => t.source === 'Price Movement Bot');

  if (!botTrades.length) {
      return <div className="p-8 text-center text-gray-500 text-sm">No trade history from Price Movement bots.</div>;
  }

  return (
    <div className="overflow-auto max-h-[400px]">
       <table className="w-full text-sm text-left">
           <thead className="bg-slate-900/80 text-gray-400 sticky top-0 backdrop-blur border-b border-slate-700">
               <tr>
                   <th className="px-4 py-2">Time</th>
                   <th className="px-4 py-2">Template</th>
                   <th className="px-4 py-2">Pair</th>
                   <th className="px-4 py-2">Side</th>
                   <th className="px-4 py-2 text-right">Realized PnL</th>
               </tr>
           </thead>
           <tbody className="divide-y divide-slate-800 text-gray-300">
               {botTrades.map(trade => (
                   <tr key={trade.id} className="hover:bg-slate-800/30">
                       <td className="px-4 py-2 text-xs text-gray-500">
                           {new Date(trade.timestamp).toLocaleTimeString()}
                       </td>
                       <td className="px-4 py-2">
                           <div className="flex items-center gap-1.5 text-xs">
                               <FileText className="w-3 h-3 text-purple-400" />
                               <span className="text-gray-400">{trade.templateName}</span>
                           </div>
                       </td>
                       <td className="px-4 py-2 font-medium">{trade.pair}</td>
                       <td className={`px-4 py-2 text-xs ${trade.direction === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>
                           {trade.direction}
                       </td>
                       <td className={`px-4 py-2 text-right font-mono font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                           {trade.pnl > 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                       </td>
                   </tr>
               ))}
           </tbody>
       </table>
    </div>
  );
}