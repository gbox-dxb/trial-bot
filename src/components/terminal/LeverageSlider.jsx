import React, { useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { orderValidationUtils } from '@/lib/orderValidationUtils';
import { AlertTriangle } from 'lucide-react';

export default function LeverageSlider({
  globalLeverage,
  onGlobalLeverageChange,
  applyToAll,
  onApplyToAllChange,
  perCoinLeverage = {},
  onPerCoinLeverageChange,
  pairs = [],
  maxLeverage = 125,
  entryPrice,
  perCoinPrice = {},
  direction,
  perCoinDirection = {},
  orderSize,
  perCoinSize = {}
}) {
  const calculateMarginAndLiq = (pair) => {
    const lev = perCoinLeverage[pair] || globalLeverage;
    const price = perCoinPrice[pair] || entryPrice;
    const size = perCoinSize[pair] || (orderSize / pairs.length);
    const dir = perCoinDirection[pair] || direction;
    
    const margin = size / lev;
    const liqPrice = price ? orderValidationUtils.calculateLiquidationPrice(price, lev, dir) : 0;
    
    return { margin, liqPrice };
  };
  
  const totalMargin = useMemo(() => {
    return pairs.reduce((sum, pair) => {
      const { margin } = calculateMarginAndLiq(pair);
      return sum + margin;
    }, 0);
  }, [pairs, perCoinLeverage, globalLeverage, perCoinPrice, entryPrice, perCoinSize, orderSize]);
  
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-300">Leverage</label>
      
      {/* Global Leverage Slider */}
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Leverage</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">{globalLeverage}x</span>
            {globalLeverage > 50 && (
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            )}
          </div>
        </div>
        
        <Slider
          value={[globalLeverage]}
          onValueChange={(val) => onGlobalLeverageChange(val[0])}
          min={1}
          max={maxLeverage}
          step={1}
          className="w-full"
        />
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>1x</span>
          <span>{maxLeverage}x</span>
        </div>
        
        {pairs.length > 0 && (
          <div className="pt-2 border-t border-slate-700 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Required Margin</span>
              <span className="text-white font-medium">${totalMargin.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Apply to All Checkbox */}
      <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-3 border border-slate-700">
        <Checkbox 
          id="leverage-all" 
          checked={applyToAll}
          onCheckedChange={onApplyToAllChange}
        />
        <label htmlFor="leverage-all" className="text-sm text-gray-300 cursor-pointer">
          Apply to all pairs
        </label>
      </div>
      
      {/* Per-Coin Leverage */}
      {!applyToAll && pairs.length > 0 && (
        <div className="space-y-3 bg-slate-900 rounded-lg p-3 border border-slate-700">
          <span className="text-xs text-gray-400">Per-Pair Leverage</span>
          {pairs.map(pair => {
            const lev = perCoinLeverage[pair] || globalLeverage;
            const { margin, liqPrice } = calculateMarginAndLiq(pair);
            
            return (
              <div key={pair} className="space-y-2 p-2 bg-slate-800 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">{pair}</span>
                  <span className="text-lg font-bold text-white">{lev}x</span>
                </div>
                
                <Slider
                  value={[lev]}
                  onValueChange={(val) => onPerCoinLeverageChange(pair, val[0])}
                  min={1}
                  max={maxLeverage}
                  step={1}
                  className="w-full"
                />
                
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Margin: ${margin.toFixed(2)}</span>
                  <span className="text-gray-400">Liq: ${liqPrice.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}