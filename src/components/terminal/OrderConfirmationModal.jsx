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
    setExecutionStatus({}); // Reset previous status
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
        tpMode: orderConfig.takeProfitMode,
        slMode: orderConfig.stopLossMode,
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

    // Final Notification Logic
    if (successCount === orderConfig.pairs.length) {
      toast({
        title: 'Success',
        description: `All ${successCount} orders placed successfully.`,
        className: "bg-emerald-900 border-custom text-white"
      });
      if (onSuccess) onSuccess();
      onClose();
    } else if (successCount > 0) {
      toast({
        variant: 'destructive',
        title: 'Partial Success',
        description: `${successCount}/${orderConfig.pairs.length} orders successful. Check individual pair errors.`
      });
      if (onSuccess) onSuccess();
    } else {
      const isNetworkError = Object.values(status).some(s => s === 'error') &&
        Object.keys(status).some(k => k.endsWith('_error') && status[k]?.includes('Network failure'));

      toast({
        variant: 'destructive',
        title: 'Execution Failed',
        description: isNetworkError
          ? 'Network failure: Could not reach exchange. Please check your internet or proxy settings.'
          : `All ${orderConfig.pairs.length} orders failed. See details in the table.`
      });
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
                    <th className="px-3 py-2 text-right">TP</th>
                    <th className="px-3 py-2 text-right">SL</th>
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
                        <td className="px-3 py-2 text-right text-white">
                          {orderConfig.takeProfitEnabled ? (
                            <span className="text-[#00FF41]">
                              {orderConfig.takeProfitMode === 'PRICE' && (
                                `$${(orderConfig.applyTPToAll ? orderConfig.takeProfit.price : (orderConfig.perCoinTP?.[pair]?.price || orderConfig.takeProfit.price)).toFixed(2)}`
                              )}
                              {orderConfig.takeProfitMode === 'PERCENT' && (
                                `${(orderConfig.applyTPToAll ? orderConfig.takeProfit.percent : (orderConfig.perCoinTP?.[pair]?.percent || orderConfig.takeProfit.percent))}%`
                              )}
                              {orderConfig.takeProfitMode === 'PROFIT' && (
                                `$${(orderConfig.applyTPToAll ? orderConfig.takeProfit.profit : (orderConfig.perCoinTP?.[pair]?.profit || orderConfig.takeProfit.profit))}`
                              )}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-3 py-2 text-right text-white">
                          {orderConfig.stopLossEnabled ? (
                            <span className="text-[#FF3B30]">
                              {orderConfig.stopLossMode === 'PRICE' && (
                                `$${(orderConfig.applySLToAll ? orderConfig.stopLoss.price : (orderConfig.perCoinSL?.[pair]?.price || orderConfig.stopLoss.price)).toFixed(2)}`
                              )}
                              {orderConfig.stopLossMode === 'PERCENT' && (
                                `${(orderConfig.applySLToAll ? orderConfig.stopLoss.percent : (orderConfig.perCoinSL?.[pair]?.percent || orderConfig.stopLoss.percent))}%`
                              )}
                              {orderConfig.stopLossMode === 'LOSS' && (
                                `$${(orderConfig.applySLToAll ? orderConfig.stopLoss.loss : (orderConfig.perCoinSL?.[pair]?.loss || orderConfig.stopLoss.loss))}`
                              )}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex justify-end">
                            {!status && <div className="h-2 w-2 rounded-full bg-slate-700 animate-pulse"></div>}
                            {status === 'pending' && <Loader2 className="h-3 w-3 text-[#00D9FF] animate-spin" />}
                            {status === 'success' && <CheckCircle className="h-4 w-4 text-[#00FF41]" />}
                            {status === 'error' && (
                              <div className="flex flex-col items-end">
                                <XCircle className="h-4 w-4 text-[#FF3B30]" />
                                <span className="text-[10px] text-[#FF3B30] mt-1 max-w-[100px] truncate" title={executionStatus[`${pair}_error`]}>
                                  {executionStatus[`${pair}_error`]}
                                </span>
                              </div>
                            )}
                          </div>
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