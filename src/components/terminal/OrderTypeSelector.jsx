import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { usePrice } from '@/contexts/PriceContext';
import { Input } from '@/components/ui/input';

export default function OrderTypeSelector({
  orderType,
  onOrderTypeChange,
  globalPrice,
  onGlobalPriceChange,
  applyToAll,
  onApplyToAllChange,
  perCoinPrice = {},
  onPerCoinPriceChange,
  pairs = []
}) {
  const { prices } = usePrice();
  
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-300">Order Type</label>
      
      {/* Order Type Selection */}
      <div className="flex gap-2">
        <button
          onClick={() => onOrderTypeChange('Market')}
          className={`flex-1 px-4 py-2 rounded-lg border font-medium transition-all ${
            orderType === 'Market'
              ? 'bg-purple-500/20 border-purple-500 text-purple-400'
              : 'bg-slate-900 border-slate-700 text-gray-400 hover:border-slate-600'
          }`}
        >
          Market
        </button>
        
        <button
          onClick={() => onOrderTypeChange('Limit')}
          className={`flex-1 px-4 py-2 rounded-lg border font-medium transition-all ${
            orderType === 'Limit'
              ? 'bg-purple-500/20 border-purple-500 text-purple-400'
              : 'bg-slate-900 border-slate-700 text-gray-400 hover:border-slate-600'
          }`}
        >
          Limit
        </button>
      </div>
      
      {/* Price Input (for Limit orders) */}
      {orderType === 'Limit' && (
        <>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Entry Price (USDT)</label>
            <Input
              type="number"
              step="0.01"
              value={globalPrice}
              onChange={(e) => onGlobalPriceChange(parseFloat(e.target.value) || 0)}
              placeholder="Enter price"
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-3 border border-slate-700">
            <Checkbox 
              id="price-all" 
              checked={applyToAll}
              onCheckedChange={onApplyToAllChange}
            />
            <label htmlFor="price-all" className="text-sm text-gray-300 cursor-pointer">
              Apply to all pairs
            </label>
          </div>
          
          {!applyToAll && pairs.length > 0 && (
            <div className="space-y-2 bg-slate-900 rounded-lg p-3 border border-slate-700">
              <span className="text-xs text-gray-400">Per-Pair Entry Price</span>
              {pairs.map(pair => (
                <div key={pair} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-white w-24">{pair}</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={perCoinPrice[pair] || ''}
                    onChange={(e) => onPerCoinPriceChange(pair, parseFloat(e.target.value) || 0)}
                    placeholder={prices[pair]?.toFixed(2)}
                    className="bg-slate-800 border-slate-700 text-white text-sm h-8"
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {orderType === 'Market' && pairs.length > 0 && (
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 space-y-1">
          <span className="text-xs text-gray-400">Market Prices (Live)</span>
          {pairs.map(pair => (
            <div key={pair} className="flex items-center justify-between">
              <span className="text-sm text-white">{pair}</span>
              <span className="text-sm text-green-400 font-medium">
                ${prices[pair]?.toFixed(2) || '0.00'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}