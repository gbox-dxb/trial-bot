import React, { useEffect, useState, useCallback } from 'react';
import { storage } from '@/lib/storage';
import { usePrice } from '@/contexts/PriceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCcw, Activity } from 'lucide-react';
import ActiveOrdersTable from './ActiveOrdersTable';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { calculateUnrealizedPnL } from '@/lib/pnlUtils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ActiveOrdersSection({ className, refreshTrigger }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const { prices } = usePrice();
  const { toast } = useToast();

  const handleDeleteAll = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete all active positions?"
    );

    if (confirmed) {
      console.log("All deleted!");
      // Your delete logic here
    }
  };
  // Close Position Dialog State
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = useCallback(() => {
    setLoading(true);
    // Simulate slight delay/async fetch
    setTimeout(() => {
      const allOrders = storage.getActiveOrders();
      // Filter specifically for Active POSITIONS (Market orders that are Open)
      const activePositions = allOrders.filter(o => o.status === 'ACTIVE');

      setOrders(activePositions.sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    }, 100);
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders, refreshTrigger]);

  const handleEdit = (order) => {
    toast({
      title: "Feature in Development",
      description: `Edit functionality for ${order.pair} will be available soon.`,
      variant: "default"
    });
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this order record? This will not close the position on the exchange.")) {
      storage.deleteActiveOrder(id);
      toast({ title: "Order Deleted", description: "Record removed from active orders." });
      loadOrders();
    }
  };

  const confirmClosePosition = (order) => {
    setSelectedOrder(order);
    setCloseDialogOpen(true);
  };

  const handleExecuteClose = () => {
    if (!selectedOrder) return;

    const currentPrice = prices[selectedOrder.pair] || selectedOrder.entryPrice;
    const { pnl } = calculateUnrealizedPnL(
      selectedOrder.direction,
      selectedOrder.entryPrice,
      currentPrice,
      selectedOrder.quantity,
      selectedOrder.margin
    );

    const closedOrder = {
      ...selectedOrder,
      exitPrice: currentPrice,
      closedAt: Date.now(),
      finalPnL: pnl,
      status: 'CLOSED'
    };

    storage.saveClosedOrder(closedOrder);
    storage.deleteActiveOrder(selectedOrder.id);

    setCloseDialogOpen(false);
    setSelectedOrder(null);
    loadOrders();

    toast({
      title: "Position Closed",
      description: `${selectedOrder.pair} position closed with PnL: $${pnl.toFixed(2)}`,
      className: pnl >= 0 ? "bg-emerald-900 border-emerald-800 text-white" : "bg-red-900 border-red-800 text-white"
    });
  };

  return (
    <Card className={cn("border-purple-500/20 bg-[#1A1A1A] shadow-xl overflow-hidden flex flex-col min-h-[300px]", className)}>
      <CardHeader className="bg-[#1A1A1A]/70 backdrop-blur-sm border-b border-purple-500/30 py-3 px-5 flex flex-row items-center justify-between rounded-lg shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-lg"></div>

          <CardTitle className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide hover:text-purple-400 transition-colors duration-300">
            Active Positions
          </CardTitle>

          <Badge
            variant="secondary"
            className="bg-purple-800 text-purple-200 text-[11px] border border-purple-700 px-2 py-1 rounded-full shadow-sm"
          >
            Total: {orders.length}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-4 text-red-400 hover:text-red-300 hover:bg-red-900 rounded-full transition-all duration-300"
            onClick={handleDeleteAll}
          >
            Delete All
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-400 hover:text-purple-400 hover:bg-purple-900 rounded-full transition-all duration-300"
            onClick={loadOrders}
          >
            <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto custom-scrollbar relative">
        <ActiveOrdersTable
          orders={orders}
          prices={prices}
          onEdit={handleEdit}
          onClosePosition={confirmClosePosition}
          onDelete={handleDelete}
        />
      </CardContent>

      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] text-white border-slate-700">
          <DialogHeader>
            <DialogTitle>Close Position</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to close this position at current market price?
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="bg-slate-800 p-4 rounded-lg text-sm space-y-2 my-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Pair</span>
                <span className="font-bold">{selectedOrder.pair}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Est. PnL</span>
                <span className={cn(
                  "font-mono font-bold",
                  calculateUnrealizedPnL(selectedOrder.direction, selectedOrder.entryPrice, prices[selectedOrder.pair] || selectedOrder.entryPrice, selectedOrder.quantity, selectedOrder.margin).pnl >= 0
                    ? "text-emerald-400" : "text-red-400"
                )}>
                  ${calculateUnrealizedPnL(selectedOrder.direction, selectedOrder.entryPrice, prices[selectedOrder.pair] || selectedOrder.entryPrice, selectedOrder.quantity, selectedOrder.margin).pnl.toFixed(2)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleExecuteClose}>Confirm Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}