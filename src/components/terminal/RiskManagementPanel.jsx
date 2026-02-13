import React, { useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { orderValidationUtils } from '@/lib/orderValidationUtils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function RiskManagementPanel({
  takeProfitEnabled,
  onTakeProfitEnabledChange,
  stopLossEnabled,
  onStopLossEnabledChange,
  
  takeProfitMode,
  onTakeProfitModeChange,
  takeProfit,
  onTakeProfitChange,
  
  stopLossMode,
  onStopLossModeChange,
  stopLoss,
  onStopLossChange,
  
  applyTPToAll,
  onApplyTPToAllChange,
  applySLToAll,
  onApplySLToAllChange,
  
  perCoinTP = {},
  onPerCoinTPChange,
  perCoinSL = {},
  onPerCoinSLChange,
  
  pairs = [],
  entryPrice,
  perCoinPrice = {},
  direction,
  perCoinDirection = {},
  orderSize,
  perCoinSize = {},
  leverage,
  perCoinLeverage = {}
}) {
  const calculateTPValues = (pair) => {
    const price = perCoinPrice[pair] || entryPrice || 0;
    const tp = perCoinTP[pair] || takeProfit;
    
    if (!tp || !price) return { price: 0, percent: 0, profit: 0 };
    
    if (takeProfitMode === 'PRICE') {
      const percent = ((tp.price - price) / price) * 100;
      const size = perCoinSize[pair] || (orderSize / pairs.length);
      const lev = perCoinLeverage[pair] || leverage;
      const profit = orderValidationUtils.calculateProfitAtPrice(price, tp.price, size, lev, perCoinDirection[pair] || direction);
      return { price: tp.price, percent, profit };
    }
    
    if (takeProfitMode === 'PERCENT') {
      const tpPrice = price * (1 + tp.percent / 100);
      const size = perCoinSize[pair] || (orderSize / pairs.length);
      const lev = perCoinLeverage[pair] || leverage;
      const profit = orderValidationUtils.calculateProfitAtPrice(price, tpPrice, size, lev, perCoinDirection[pair] || direction);
      return { price: tpPrice, percent: tp.percent, profit };
    }
    
    // PROFIT mode
    const size = perCoinSize[pair] || (orderSize / pairs.length);
    const lev = perCoinLeverage[pair] || leverage;
    const percent = (tp.profit / size) * (100 / lev);
    const tpPrice = price * (1 + percent / 100);
    return { price: tpPrice, percent, profit: tp.profit };
  };
  
  const calculateSLValues = (pair) => {
    const price = perCoinPrice[pair] || entryPrice || 0;
    const sl = perCoinSL[pair] || stopLoss;
    
    if (!sl || !price) return { price: 0, percent: 0, loss: 0 };
    
    if (stopLossMode === 'PRICE') {
      const percent = ((sl.price - price) / price) * 100;
      const size = perCoinSize[pair] || (orderSize / pairs.length);
      const lev = perCoinLeverage[pair] || leverage;
      const loss = Math.abs(orderValidationUtils.calculateProfitAtPrice(price, sl.price, size, lev, perCoinDirection[pair] || direction));
      return { price: sl.price, percent: Math.abs(percent), loss };
    }
    
    if (stopLossMode === 'PERCENT') {
      const slPrice = price * (1 - sl.percent / 100);
      const size = perCoinSize[pair] || (orderSize / pairs.length);
      const lev = perCoinLeverage[pair] || leverage;
      const loss = Math.abs(orderValidationUtils.calculateProfitAtPrice(price, slPrice, size, lev, perCoinDirection[pair] || direction));
      return { price: slPrice, percent: sl.percent, loss };
    }
    
    // LOSS mode
    const size = perCoinSize[pair] || (orderSize / pairs.length);
    const lev = perCoinLeverage[pair] || leverage;
    const percent = (sl.loss / size) * (100 / lev);
    const slPrice = price * (1 - percent / 100);
    return { price: slPrice, percent, loss: sl.loss };
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Risk Management</h3>
      
      {/* Take Profit Section */}
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="tp-enabled"
              checked={takeProfitEnabled}
              onCheckedChange={onTakeProfitEnabledChange}
            />
            <label htmlFor="tp-enabled" className="text-sm font-medium text-green-400 cursor-pointer flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Take Profit
            </label>
          </div>
        </div>
        
        {takeProfitEnabled && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onTakeProfitModeChange('PRICE')}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  takeProfitMode === 'PRICE'
                    ? 'bg-green-500/20 border-green-500 text-green-400'
                    : 'bg-slate-800 border-slate-700 text-gray-400'
                }`}
              >
                Price
              </button>
              <button
                onClick={() => onTakeProfitModeChange('PERCENT')}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  takeProfitMode === 'PERCENT'
                    ? 'bg-green-500/20 border-green-500 text-green-400'
                    : 'bg-slate-800 border-slate-700 text-gray-400'
                }`}
              >
                Percent
              </button>
              <button
                onClick={() => onTakeProfitModeChange('PROFIT')}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  takeProfitMode === 'PROFIT'
                    ? 'bg-green-500/20 border-green-500 text-green-400'
                    : 'bg-slate-800 border-slate-700 text-gray-400'
                }`}
              >
                Profit
              </button>
            </div>
            
            <div>
              {takeProfitMode === 'PRICE' && (
                <Input
                  type="number"
                  step="0.01"
                  value={takeProfit?.price || ''}
                  onChange={(e) => onTakeProfitChange({ price: parseFloat(e.target.value) || 0 })}
                  placeholder="TP Price"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              )}
              {takeProfitMode === 'PERCENT' && (
                <Input
                  type="number"
                  step="0.1"
                  value={takeProfit?.percent || ''}
                  onChange={(e) => onTakeProfitChange({ percent: parseFloat(e.target.value) || 0 })}
                  placeholder="TP %"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              )}
              {takeProfitMode === 'PROFIT' && (
                <Input
                  type="number"
                  step="0.01"
                  value={takeProfit?.profit || ''}
                  onChange={(e) => onTakeProfitChange({ profit: parseFloat(e.target.value) || 0 })}
                  placeholder="Profit USDT"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              )}
            </div>
            
            {pairs.length > 0 && entryPrice > 0 && (
              <div className="text-xs text-gray-400 space-y-1">
                {pairs.slice(0, 1).map(pair => {
                  const values = calculateTPValues(pair);
                  return (
                    <div key={pair}>
                      <div>Price: ${(values?.price || 0).toFixed(2)}</div>
                      <div>+{(values?.percent || 0).toFixed(2)}% | +${(values?.profit || 0).toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Checkbox
                id="tp-all"
                checked={applyTPToAll}
                onCheckedChange={onApplyTPToAllChange}
              />
              <label htmlFor="tp-all" className="text-xs text-gray-300 cursor-pointer">
                Apply to all pairs
              </label>
            </div>
          </>
        )}
      </div>
      
      {/* Stop Loss Section */}
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="sl-enabled"
              checked={stopLossEnabled}
              onCheckedChange={onStopLossEnabledChange}
            />
            <label htmlFor="sl-enabled" className="text-sm font-medium text-red-400 cursor-pointer flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Stop Loss
            </label>
          </div>
        </div>
        
        {stopLossEnabled && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onStopLossModeChange('PRICE')}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  stopLossMode === 'PRICE'
                    ? 'bg-red-500/20 border-red-500 text-red-400'
                    : 'bg-slate-800 border-slate-700 text-gray-400'
                }`}
              >
                Price
              </button>
              <button
                onClick={() => onStopLossModeChange('PERCENT')}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  stopLossMode === 'PERCENT'
                    ? 'bg-red-500/20 border-red-500 text-red-400'
                    : 'bg-slate-800 border-slate-700 text-gray-400'
                }`}
              >
                Percent
              </button>
              <button
                onClick={() => onStopLossModeChange('LOSS')}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  stopLossMode === 'LOSS'
                    ? 'bg-red-500/20 border-red-500 text-red-400'
                    : 'bg-slate-800 border-slate-700 text-gray-400'
                }`}
              >
                Loss
              </button>
            </div>
            
            <div>
              {stopLossMode === 'PRICE' && (
                <Input
                  type="number"
                  step="0.01"
                  value={stopLoss?.price || ''}
                  onChange={(e) => onStopLossChange({ price: parseFloat(e.target.value) || 0 })}
                  placeholder="SL Price"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              )}
              {stopLossMode === 'PERCENT' && (
                <Input
                  type="number"
                  step="0.1"
                  value={stopLoss?.percent || ''}
                  onChange={(e) => onStopLossChange({ percent: parseFloat(e.target.value) || 0 })}
                  placeholder="SL %"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              )}
              {stopLossMode === 'LOSS' && (
                <Input
                  type="number"
                  step="0.01"
                  value={stopLoss?.loss || ''}
                  onChange={(e) => onStopLossChange({ loss: parseFloat(e.target.value) || 0 })}
                  placeholder="Max Loss USDT"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              )}
            </div>
            
            {pairs.length > 0 && entryPrice > 0 && (
              <div className="text-xs text-gray-400 space-y-1">
                {pairs.slice(0, 1).map(pair => {
                  const values = calculateSLValues(pair);
                  return (
                    <div key={pair}>
                      <div>Price: ${(values?.price || 0).toFixed(2)}</div>
                      <div>-{(values?.percent || 0).toFixed(2)}% | -${(values?.loss || 0).toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Checkbox
                id="sl-all"
                checked={applySLToAll}
                onCheckedChange={onApplySLToAllChange}
              />
              <label htmlFor="sl-all" className="text-xs text-gray-300 cursor-pointer">
                Apply to all pairs
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  );
}