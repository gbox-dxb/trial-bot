import React from 'react';
import { priceMovementBotEngine } from '@/lib/priceMovementBotEngine';
import { XCircle, FileText } from 'lucide-react';
import { usePrice } from '@/contexts/PriceContext';

export default function PriceMovementPositions({ positions = [], onRefresh }) {
  const { prices } = usePrice();

  // Filter for only Price Movement Bot generated positions
  const botPositions = positions.filter(p => p.source === 'Price Movement Bot');

  const closePos = (id) => {
      // Logic handled by main engine usually, but for mock purposes:
      // In a real app, this would call `orderRouter.closePosition(...)`
      // Here we will just remove from storage via a hypothetical method or rely on parent
      console.log("Request to close position", id);
      // For now, let's assume parent handles refresh or we have a direct engine method
      // Ideally storage.deleteActiveOrder(id) but that's raw. 
  };

  if (!botPositions.length) {
      return <div className="p-8 text-center text-gray-500 text-sm">No open positions from Price Movement bots.</div>;
  }

  return (
    <div className="overflow-auto max-h-[400px]">
       <table className="w-full text-sm text-left">
           <thead className="bg-slate-900/80 text-gray-400 sticky top-0 backdrop-blur border-b border-slate-700">
               <tr>
                   <th className="px-4 py-2">Template</th>
                   <th className="px-4 py-2">Pair</th>
                   <th className="px-4 py-2">Side</th>
                   <th className="px-4 py-2">Entry</th>
                   <th className="px-4 py-2">Current</th>
                   <th className="px-4 py-2">PnL</th>
                   <th className="px-4 py-2 text-right">Action</th>
               </tr>
           </thead>
           <tbody className="divide-y divide-slate-800 text-gray-300">
               {botPositions.map(pos => {
                   const curr = prices[pos.pair] || pos.entryPrice;
                   const diff = curr - pos.entryPrice;
                   const pnl = pos.direction === 'LONG' ? diff : -diff;
                   const pnlVal = pnl * pos.quantity; // approximate
                   
                   return (
                       <tr key={pos.id} className="hover:bg-slate-800/30">
                           <td className="px-4 py-2">
                               <div className="flex items-center gap-1.5 text-xs">
                                   <FileText className="w-3 h-3 text-purple-400" />
                                   <span className="text-gray-400">{pos.templateName}</span>
                               </div>
                           </td>
                           <td className="px-4 py-2 font-medium">{pos.pair}</td>
                           <td className={`px-4 py-2 text-xs font-bold ${pos.direction === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>{pos.direction}</td>
                           <td className="px-4 py-2 text-xs text-gray-400">${pos.entryPrice.toFixed(2)}</td>
                           <td className="px-4 py-2 text-xs text-white">${curr.toFixed(2)}</td>
                           <td className={`px-4 py-2 text-xs font-mono font-bold ${pnlVal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                               {pnlVal > 0 ? '+' : ''}{pnlVal.toFixed(2)}
                           </td>
                           <td className="px-4 py-2 text-right">
                               <button className="p-1 hover:bg-slate-700 rounded text-gray-400 hover:text-white">
                                   <XCircle className="w-3 h-3"/>
                               </button>
                           </td>
                       </tr>
                   );
               })}
           </tbody>
       </table>
    </div>
  );
}