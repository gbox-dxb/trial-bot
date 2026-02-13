import React, { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Clock, Ban } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

export default function PendingOrdersSection({ className, refreshTrigger }) {
  const [orders, setOrders] = useState([]);
  const { toast } = useToast();

  const loadOrders = () => {
    const allOrders = storage.getActiveOrders();
    // Filter for Limit Orders (Pending)
    const pendingOrders = allOrders.filter(o => o.status === 'PENDING');
    setOrders(pendingOrders.sort((a, b) => b.createdAt - a.createdAt));
  };

  useEffect(() => {
    loadOrders();
  }, [refreshTrigger]);

  const handleCancelOrder = (id) => {
    if (confirm('Are you sure you want to cancel this limit order?')) {
      storage.deleteActiveOrder(id);
      toast({ title: "Order Cancelled", description: "Limit order has been removed." });
      loadOrders();
    }
  };

  return (
    <Card className={cn("border-purple-500/20 bg-[#1A1A1A] shadow-xl overflow-hidden flex flex-col h-full", className)}>
      <CardHeader className="bg-[#1A1A1A]/80 border-b border-purple-500/20 py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-400" />
            Pending Limit Orders
          </CardTitle>
          <Badge variant="outline" className="text-[10px] border-orange-500/30 text-orange-300">
            {orders.length}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-sm">
            <Clock className="w-8 h-8 mb-2 opacity-20" />
            <p>No pending limit orders</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {orders.map((order) => (
              <div key={order.id} className="p-3 hover:bg-slate-800/50 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200 text-sm">{order.pair}</span>
                      <Badge variant="secondary" className={cn(
                        "text-[10px] px-1.5 py-0",
                        order.direction === 'LONG' 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      )}>
                         {order.direction}
                      </Badge>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-400 hover:text-red-400 hover:bg-red-900/20"
                    onClick={() => handleCancelOrder(order.id)}
                    title="Cancel Order"
                  >
                    <Ban className="w-3.5 h-3.5" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-xs text-slate-400 mb-2">
                   <div className="flex justify-between">
                       <span>Price:</span>
                       <span className="text-white font-mono">${order.price}</span>
                   </div>
                   <div className="flex justify-between">
                       <span>Size:</span>
                       <span className="text-white font-mono">${order.quantity ? (order.quantity * order.price).toFixed(0) : '0'}</span>
                   </div>
                   <div className="flex justify-between">
                       <span>Leverage:</span>
                       <span className="text-slate-200">{order.leverage}x</span>
                   </div>
                   <div className="flex justify-between">
                       <span>Type:</span>
                       <span className="text-orange-300">LIMIT</span>
                   </div>
                </div>
                
                <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-600">
                       {formatDistanceToNow(order.createdAt, { addSuffix: true })}
                    </span>
                    <span className="text-[10px] text-orange-400 flex items-center gap-1 animate-pulse">
                        <Clock className="w-3 h-3" /> Waiting fill
                    </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}