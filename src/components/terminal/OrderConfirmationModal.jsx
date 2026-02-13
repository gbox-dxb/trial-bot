import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { orderRouter } from '@/lib/orderRouter';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function OrderConfirmationModal({ 
  isOpen, 
  onClose, 
  orderConfig, 
  prices,
  onSuccess 
}) {
  const [executing, setExecuting] = useState(false);
  const [executionStatus, setExecutionStatus] = useState({});
  const { toast } = useToast();
  
  const handleConfirm = async () => {
    setExecuting(true);
    const status = {};
    let successCount = 0;
    
    for (const pair of orderConfig.pairs) {
      status[pair] = 'pending';
      setExecutionStatus({ ...status });
      
      // Determine individual parameters
      const direction = orderConfig.perCoinDirection?.[pair] || orderConfig.direction;
      const leverage = orderConfig.perCoinLeverage?.[pair] || orderConfig.leverage;
      const sizeUSDT = orderConfig.perCoinSize?.[pair] || (orderConfig.baseOrderSize / orderConfig.pairs.length);
      const entryPrice = orderConfig.perCoinPrice?.[pair] || orderConfig.entryPrice || prices[pair];
      
      // Calculate quantity (approx)
      const quantity = (sizeUSDT * leverage) / entryPrice;

      const intent = {
        userId: 'user-1',
        exchangeAccountId: orderConfig.accountId,
        symbol: pair,
        side: direction,
        orderType: orderConfig.orderType,
        quantity: quantity, 
        price: entryPrice,
        leverage: leverage,
        takeProfit: orderConfig.takeProfitEnabled ? (orderConfig.perCoinTP?.[pair] || orderConfig.takeProfit) : null,
        stopLoss: orderConfig.stopLossEnabled ? (orderConfig.perCoinSL?.[pair] || orderConfig.stopLoss) : null,
        marketType: 'Futures'
      };
      
      // Execute via Router - Router handles storage saving
      const result = await orderRouter.executeOrder(intent, prices);
      
      status[pair] = result.success ? 'success' : 'error';
      status[`${pair}_error`] = result.error;
      
      if (result.success) {
          successCount++;
      }
      
      setExecutionStatus({ ...status });
    }
    
    setExecuting(false);
    
    // Always call onSuccess if at least one order worked to refresh lists
    if (successCount > 0 && onSuccess) {
        onSuccess();
    }
    
    if (successCount === orderConfig.pairs.length) {
      toast({ title: 'Success', description: `All ${successCount} orders placed successfully` });
      onClose();
    } else {
      toast({ 
        variant: 'destructive',
        title: 'Execution Complete', 
        description: `${successCount}/${orderConfig.pairs.length} orders successful. Check errors.` 
      });
      // Don't auto-close on error so user can see status
    }
  };
  
  if (!orderConfig) return null;
  
  const totalInvestment = orderConfig.pairs.reduce((sum, pair) => {
    return sum + (orderConfig.perCoinSize?.[pair] || (orderConfig.baseOrderSize / orderConfig.pairs.length));
  }, 0);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-[#1A1A1A] text-white border-custom max-h-[90vh] overflow-y-auto shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Confirm Order</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-[#0F1419] rounded-lg p-4 space-y-2 border border-custom">
            <div className="flex justify-between">
              <span className="text-[#A0A9B8]">Total Pairs</span>
              <span className="font-bold text-white">{orderConfig.pairs.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A0A9B8]">Order Type</span>
              <span className="font-bold text-white">{orderConfig.orderType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A0A9B8]">Total Investment</span>
              <span className="font-bold text-[#00FF41]">${totalInvestment.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A0A9B8]">Required Margin</span>
              <span className="font-bold text-[#9D4EDD]">${orderConfig.requiredMargin?.toFixed(2)}</span>
            </div>
          </div>
          
          {/* Per-Coin Breakdown */}
          <div className="space-y-2">
            <h4 className="font-semibold text-white">Order Details</h4>
            <div className="bg-[#0F1419] rounded-lg overflow-hidden border border-custom">
              <table className="w-full text-sm">
                <thead className="bg-[#252B33] text-[#A0A9B8]">
                  <tr>
                    <th className="px-3 py-2 text-left">Pair</th>
                    <th className="px-3 py-2 text-left">Direction</th>
                    <th className="px-3 py-2 text-right">Leverage</th>
                    <th className="px-3 py-2 text-right">Size</th>
                    <th className="px-3 py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-custom">
                  {orderConfig.pairs.map(pair => {
                    const dir = orderConfig.perCoinDirection?.[pair] || orderConfig.direction;
                    const lev = orderConfig.perCoinLeverage?.[pair] || orderConfig.leverage;
                    const size = orderConfig.perCoinSize?.[pair] || (orderConfig.baseOrderSize / orderConfig.pairs.length);
                    const status = executionStatus[pair];
                    
                    return (
                      <tr key={pair}>
                        <td className="px-3 py-2 font-medium text-white">{pair}</td>
                        <td className="px-3 py-2">
                          <span className={dir === 'LONG' || dir === 'Long' ? 'text-[#00FF41] font-bold' : 'text-[#FF3B30] font-bold'}>
                            {dir}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-white">{lev}x</td>
                        <td className="px-3 py-2 text-right text-white">${size.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">
                          {status === 'pending' && <Loader2 className="w-4 h-4 animate-spin ml-auto text-[#00D9FF]" />}
                          {status === 'success' && <CheckCircle className="w-4 h-4 text-[#00FF41] ml-auto" />}
                          {status === 'error' && <XCircle className="w-4 h-4 text-[#FF3B30] ml-auto" />}
                          {!status && <span className="text-[#A0A9B8]">-</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={executing} className="border-custom text-white hover:bg-[#252B33]">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={executing} className="bg-[#9D4EDD] hover:bg-[#8B3FCC] text-white font-bold shadow-glow-purple">
            {executing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              'Confirm & Place Orders'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}