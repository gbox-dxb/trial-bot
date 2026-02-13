import React, { useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { storage } from '@/lib/storage';

export default function DCAOrderTrackingModal({ isOpen, onClose, dcaBot }) {
  const botId = dcaBot?.id;

  const orders = useMemo(() => {
      if (!botId) return [];
      // Fetch related orders
      return storage.getDCAOrders(botId).sort((a, b) => b.createdAt - a.createdAt);
  }, [botId, isOpen]); // Added isOpen to refresh when modal opens

  const stats = useMemo(() => {
      if (!orders.length) {
          return {
              filledCount: 0,
              pendingCount: 0,
              totalVolume: 0,
              lastOrderTime: null
          };
      }

      const filled = orders.filter(o => o.status === 'FILLED' || o.status === 'CLOSED');
      const pending = orders.filter(o => o.status === 'OPEN' || o.status === 'PENDING' || o.status === 'PLACED');
      
      const totalFilledVol = filled.reduce((acc, o) => acc + (o.filledSize || o.quantity || 0) * (o.avgFillPrice || o.price || 0), 0);

      return {
          filledCount: filled.length,
          pendingCount: pending.length,
          totalVolume: totalFilledVol,
          lastOrderTime: filled.length > 0 ? filled[0].createdAt : null
      };
  }, [orders]);

  if (!dcaBot) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-custom text-white max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-purple-400">DCA Execution History</span>
            <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300">
               {dcaBot.pair}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3 bg-slate-800/50 p-4 rounded-lg border border-custom mb-2">
             <div>
                 <div className="text-xs text-gray-500">Total Invested</div>
                 <div className="text-lg font-bold text-white">${stats.totalVolume.toFixed(2)}</div>
             </div>
             <div>
                 <div className="text-xs text-gray-500">Filled Orders</div>
                 <div className="text-lg font-bold text-green-400">{stats.filledCount}</div>
             </div>
             <div>
                 <div className="text-xs text-gray-500">Pending Orders</div>
                 <div className="text-lg font-bold text-yellow-400">{stats.pendingCount}</div>
             </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 uppercase bg-slate-800/80 sticky top-0">
                    <tr>
                        <th className="px-3 py-2 text-left">Time</th>
                        <th className="px-3 py-2 text-left">Type</th>
                        <th className="px-3 py-2 text-left">Price</th>
                        <th className="px-3 py-2 text-left">Amount</th>
                        <th className="px-3 py-2 text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10">
                    {orders.length === 0 ? (
                        <tr><td colSpan="5" className="px-3 py-8 text-center text-gray-500">No orders found for this bot.</td></tr>
                    ) : (
                        orders.map(order => (
                            <tr key={order.id} className="hover:bg-purple-500/5">
                                <td className="px-3 py-2 text-gray-300">
                                    {formatDistanceToNow(order.createdAt, { addSuffix: true })}
                                </td>
                                <td className="px-3 py-2">
                                    <Badge variant="outline" className="text-[10px] h-5 border-slate-600 text-slate-400">
                                        {order.type}
                                    </Badge>
                                </td>
                                <td className="px-3 py-2 font-mono text-gray-300">
                                    ${order.price.toFixed(2)}
                                </td>
                                <td className="px-3 py-2 text-gray-300">
                                    ${(order.quantity * order.price).toFixed(2)}
                                </td>
                                <td className="px-3 py-2 text-right">
                                    <span className={`text-xs font-bold ${
                                        order.status === 'FILLED' ? 'text-green-400' :
                                        order.status === 'PENDING' ? 'text-yellow-400' :
                                        order.status === 'CANCELLED' ? 'text-red-400' : 'text-gray-400'
                                    }`}>
                                        {order.status}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}