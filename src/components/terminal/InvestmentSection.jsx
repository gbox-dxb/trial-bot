import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, DollarSign, Percent, Hash, Wallet } from 'lucide-react';

export default function InvestmentSection({
  availableBalance = 0, // Default to 0 to prevent crashes
  baseOrderSize,
  onBaseOrderSizeChange,
  sizeMode,
  onSizeModeChange,
  perCoinSize = {},
  onPerCoinSizeChange,
  pairs = [],
  customAllocation,
  onCustomAllocationChange,
  requiredMargin
}) {
  const [percentValue, setPercentValue] = useState(10);
  
  const sizeInUSDT = useMemo(() => {
    if (sizeMode === 'USDT') return baseOrderSize;
    if (sizeMode === 'PERCENT') return (availableBalance * percentValue) / 100;
    return baseOrderSize; 
  }, [sizeMode, baseOrderSize, percentValue, availableBalance]);
  
  const handleSplitEqually = () => {
    if (pairs.length === 0) return;
    const perPair = sizeInUSDT / pairs.length;
    const newSizes = {};
    pairs.forEach(pair => {
      newSizes[pair] = perPair;
    });
    onPerCoinSizeChange(newSizes);
    onCustomAllocationChange(false);
  };
  
  const totalCustom = useMemo(() => {
    return Object.values(perCoinSize).reduce((sum, val) => sum + (val || 0), 0);
  }, [perCoinSize]);
  
  const isInsufficientBalance = requiredMargin > availableBalance;
  
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
        <Wallet className="w-4 h-4 text-purple-400" />
        Investment
      </label>
      
      {/* Balance Display */}
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 shadow-sm relative overflow-hidden group">
        <div className="absolute inset-0 bg-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Available Balance</span>
            <span className="text-xl font-bold text-emerald-400 font-mono tracking-tight">
              ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm text-emerald-600">USDT</span>
            </span>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-xs text-gray-500">Required Margin</span>
            <span className={`text-base font-bold font-mono ${isInsufficientBalance ? 'text-red-400' : 'text-slate-200'}`}>
              ${requiredMargin.toFixed(2)} USDT
            </span>
          </div>
        </div>
        
        {isInsufficientBalance && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-xs bg-red-900/20 p-2 rounded border border-red-900/50">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Insufficient balance for this order configuration</span>
          </div>
        )}
      </div>
      
      {/* Size Mode Selection */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onSizeModeChange('USDT')}
          className={`px-3 py-2 rounded-lg border font-medium text-xs flex flex-col items-center justify-center gap-1 transition-all ${
            sizeMode === 'USDT'
              ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-inner'
              : 'bg-slate-900 border-slate-700 text-gray-400 hover:border-slate-600 hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Fixed USDT
        </button>
        
        <button
          onClick={() => onSizeModeChange('PERCENT')}
          className={`px-3 py-2 rounded-lg border font-medium text-xs flex flex-col items-center justify-center gap-1 transition-all ${
            sizeMode === 'PERCENT'
              ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-inner'
              : 'bg-slate-900 border-slate-700 text-gray-400 hover:border-slate-600 hover:bg-slate-800'
          }`}
        >
          <Percent className="w-4 h-4" />
          % of Balance
        </button>
        
        <button
          onClick={() => onSizeModeChange('QUANTITY')}
          className={`px-3 py-2 rounded-lg border font-medium text-xs flex flex-col items-center justify-center gap-1 transition-all ${
            sizeMode === 'QUANTITY'
              ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-inner'
              : 'bg-slate-900 border-slate-700 text-gray-400 hover:border-slate-600 hover:bg-slate-800'
          }`}
        >
          <Hash className="w-4 h-4" />
          Asset Qty
        </button>
      </div>
      
      {/* Size Input */}
      <div className="relative">
        {sizeMode === 'USDT' && (
          <div className="relative">
             <Input
               type="number"
               step="0.01"
               min="0"
               value={baseOrderSize}
               onChange={(e) => onBaseOrderSizeChange(parseFloat(e.target.value) || 0)}
               placeholder="Enter USDT amount"
               className="bg-slate-900 border-slate-700 text-white pl-9"
             />
             <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        )}
        
        {sizeMode === 'PERCENT' && (
          <div className="space-y-2">
            <div className="relative">
              <Input
                type="number"
                step="1"
                min="0"
                max="100"
                value={percentValue}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setPercentValue(val);
                  onBaseOrderSizeChange((availableBalance * val) / 100);
                }}
                placeholder="Enter percentage"
                className="bg-slate-900 border-slate-700 text-white pl-9"
              />
              <Percent className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <div className="text-xs text-gray-400 text-right">
              Total Order Size: <span className="text-white font-mono">${sizeInUSDT.toFixed(2)} USDT</span>
            </div>
          </div>
        )}
        
        {sizeMode === 'QUANTITY' && (
          <div className="relative">
             <Input
               type="number"
               step="0.001"
               min="0"
               value={baseOrderSize}
               onChange={(e) => onBaseOrderSizeChange(parseFloat(e.target.value) || 0)}
               placeholder="Enter quantity"
               className="bg-slate-900 border-slate-700 text-white pl-9"
             />
             <Hash className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        )}
      </div>
      
      {/* Allocation Controls */}
      {pairs.length > 1 && (
        <div className="flex gap-2">
          <Button
            onClick={handleSplitEqually}
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-8"
            disabled={customAllocation}
          >
            Split Equally
          </Button>
          
          <Button
            onClick={() => onCustomAllocationChange(!customAllocation)}
            variant={customAllocation ? 'default' : 'outline'}
            size="sm"
            className="flex-1 text-xs h-8"
          >
            Custom Allocation
          </Button>
        </div>
      )}
      
      {/* Custom Allocation Inputs */}
      {customAllocation && pairs.length > 0 && (
        <div className="space-y-2 bg-slate-900 rounded-lg p-3 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Per-Pair Allocation</span>
            <span className={`text-xs font-mono ${Math.abs(totalCustom - sizeInUSDT) < 0.1 ? 'text-green-400' : 'text-yellow-400'}`}>
              Total: ${totalCustom.toFixed(2)}
            </span>
          </div>
          <div className="max-h-32 overflow-y-auto pr-1 custom-scrollbar space-y-2">
            {pairs.map(pair => (
              <div key={pair} className="flex items-center gap-2">
                <span className="text-xs text-slate-300 w-20 font-medium truncate">{pair}</span>
                <div className="relative flex-1">
                   <Input
                     type="number"
                     step="0.01"
                     value={perCoinSize[pair] || ''}
                     onChange={(e) => {
                       const val = parseFloat(e.target.value) || 0;
                       onPerCoinSizeChange({ ...perCoinSize, [pair]: val });
                     }}
                     placeholder="0.00"
                     className="bg-slate-800 border-slate-700 text-white text-xs h-7 pr-8"
                   />
                   <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">USDT</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}