import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, PauseCircle, Bot, FileText, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { calculateUnrealizedPnL } from '@/lib/pnlUtils';
import { orderPlacementService } from '@/lib/orderPlacementService';
import { cn } from '@/lib/utils';

export default function ActiveOrdersTable({ orders, prices, onEdit, onClosePosition, onDelete }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <p>No active orders</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-medium">
          <tr>
            <th className="px-4 py-3 rounded-tl-lg">Source / Pair</th>
            <th className="px-4 py-3">Position</th>
            <th className="px-4 py-3">Prices</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 hidden md:table-cell">Progress</th>
            <th className="px-4 py-3">Unrealized PnL</th>
            <th className="px-4 py-3 text-right rounded-tr-lg">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {orders.map((order) => {
            const currentPrice = prices[order.pair] || order.entryPrice;
            const { pnl, percentage } = calculateUnrealizedPnL(
                order.direction, 
                order.entryPrice, 
                currentPrice, 
                order.quantity, 
                order.margin
            );
            
            const isProfit = pnl >= 0;
            const sourceLabel = orderPlacementService.getOrderSource(order);
            const isBot = order.source === 'bot' || !!order.botId;

            return (
              <tr key={order.id} className="hover:bg-slate-800/30 transition-colors group">
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-white flex items-center gap-2">
                      {order.pair}
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] px-1.5 py-0 border", 
                          order.direction === 'LONG' 
                            ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" 
                            : "border-red-500/30 text-red-400 bg-red-500/10"
                        )}
                      >
                        {order.direction} {order.leverage}x
                      </Badge>
                    </span>
                    <div className="flex items-center gap-2 text-[10px] mt-1">
                       <span className={cn(
                           "flex items-center gap-1 px-1.5 py-0.5 rounded border border-transparent",
                           isBot ? "bg-blue-900/20 text-blue-300" : "bg-purple-900/20 text-purple-300"
                       )}>
                           {isBot ? <Bot className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                           {sourceLabel}
                       </span>
                    </div>
                  </div>
                </td>
                
                <td className="px-4 py-4">
                  <div className="flex flex-col">
                    <span className="font-mono font-medium text-slate-200">
                      ${order.margin.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500">Margin</span>
                  </div>
                </td>
                
                <td className="px-4 py-4">
                  <div className="flex flex-col text-xs font-mono">
                    <div className="flex justify-between w-32">
                        <span className="text-slate-500">Entry:</span>
                        <span className="text-slate-200">${order.entryPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between w-32">
                        <span className="text-slate-500">Curr:</span>
                        <span className={isProfit ? "text-emerald-400" : "text-red-400"}>
                            ${currentPrice.toFixed(2)}
                        </span>
                    </div>
                  </div>
                </td>
                
                <td className="px-4 py-4">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></div>
                    ACTIVE
                  </Badge>
                </td>

                <td className="px-4 py-4 hidden md:table-cell align-middle">
                   <div className="flex flex-col gap-1 w-24">
                       <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full bg-purple-500 w-full"></div>
                       </div>
                       <span className="text-[10px] text-slate-500 text-center">Filled 100%</span>
                   </div>
                </td>
                
                <td className="px-4 py-4">
                  <div className="flex flex-col">
                    <span className={cn("font-bold font-mono", isProfit ? "text-emerald-400" : "text-red-400")}>
                       {isProfit ? '+' : ''}{pnl.toFixed(2)}
                    </span>
                    <span className={cn("text-xs", isProfit ? "text-emerald-500/70" : "text-red-500/70")}>
                       {isProfit ? '+' : ''}{percentage.toFixed(2)}%
                    </span>
                  </div>
                </td>
                
                <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20" onClick={() => onEdit(order)}>
                            <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20" onClick={() => onClosePosition(order)}>
                            <PauseCircle className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => onDelete(order.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}