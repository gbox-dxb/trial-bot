import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, X, Edit, Eye, MoreVertical } from 'lucide-react';
import { useLimitOrders } from '@/contexts/LimitOrdersContext';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

export default function LimitOrdersTable({ onEdit }) {
  const { orders, placeLimitOrder, cancelLimitOrder, updateLimitOrder } = useLimitOrders();
  const { toast } = useToast();
  const [activeMenu, setActiveMenu] = useState(null);

  const handlePlace = async (id) => {
    await placeLimitOrder(id);
    setActiveMenu(null);
  };

  const handleCancel = async (id) => {
    if (confirm('Are you sure you want to cancel this order?')) {
      await cancelLimitOrder(id);
      setActiveMenu(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-yellow-500/20 text-yellow-400',
      PLACED: 'bg-blue-500/20 text-blue-400',
      'PARTIALLY FILLED': 'bg-orange-500/20 text-orange-400',
      FILLED: 'bg-green-500/20 text-green-400',
      CANCELLED: 'bg-gray-500/20 text-gray-400',
      FAILED: 'bg-red-500/20 text-red-400'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || styles.PENDING}`}>
        {status}
      </span>
    );
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No limit orders found</p>
        <p className="text-sm text-gray-500 mt-2">Create your first limit order to get started</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-purple-500/20 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Exchange</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Symbol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Side</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Limit Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Leverage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">TP/SL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-500/10">
            {orders.map((order, index) => (
              <motion.tr
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-slate-700/30"
              >
                <td className="px-6 py-4 text-gray-300 text-sm">
                  {format(new Date(order.createdAt), 'MMM dd, HH:mm')}
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-white font-medium">{order.exchange}</div>
                    <div className="text-xs text-gray-400">{order.accountType}</div>
                    {order.exchange.includes('DEMO') && (
                      <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">DEMO</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-white font-medium">{order.symbol}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    order.side === 'BUY' || order.side === 'LONG' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {order.side}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-300">${order.limitPrice}</td>
                <td className="px-6 py-4 text-gray-300">{order.amount}</td>
                <td className="px-6 py-4 text-gray-300">
                  {order.leverage ? `${order.leverage}x` : '-'}
                </td>
                <td className="px-6 py-4 text-gray-300">
                  {order.takeProfitEnabled && order.stopLossEnabled ? 'Both' :
                   order.takeProfitEnabled ? 'TP' :
                   order.stopLossEnabled ? 'SL' : '-'}
                </td>
                <td className="px-6 py-4 text-gray-300">{order.source}</td>
                <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                <td className="px-6 py-4">
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === order.id ? null : order.id)}
                      className="p-2 hover:bg-slate-700 rounded-lg"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    {activeMenu === order.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-purple-500/20 rounded-lg shadow-xl z-10">
                        {order.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handlePlace(order.id)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-slate-800 flex items-center gap-2"
                            >
                              <Play className="w-4 h-4" /> Place Now
                            </button>
                            <button
                              onClick={() => { onEdit(order); setActiveMenu(null); }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-slate-800 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" /> Edit
                            </button>
                          </>
                        )}
                        {(order.status === 'PLACED' || order.status === 'PARTIALLY FILLED') && (
                          <button
                            onClick={() => handleCancel(order.id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-800 flex items-center gap-2"
                          >
                            <X className="w-4 h-4" /> Cancel
                          </button>
                        )}
                        <button
                          onClick={() => toast({ title: "View Details", description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀" })}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-slate-800 flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" /> View Details
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}