import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function DirectionToggle({ 
  globalDirection, 
  onGlobalDirectionChange, 
  applyToAll, 
  onApplyToAllChange,
  perCoinDirection = {},
  onPerCoinDirectionChange,
  pairs = []
}) {
  return (
    <div className="space-y-3">
      
      {/* Global Direction Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => onGlobalDirectionChange('LONG')}
          className={`flex-1 px-4 py-3 rounded-lg font-bold text-lg transition-all shadow-lg ${
            globalDirection === 'LONG'
              ? 'bg-[#10b981] text-white shadow-emerald-500/20'
              : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <TrendingUp className="w-5 h-5" />
            <span>Long</span>
          </div>
        </button>
        
        <button
          onClick={() => onGlobalDirectionChange('SHORT')}
          className={`flex-1 px-4 py-3 rounded-lg font-bold text-lg transition-all shadow-lg ${
            globalDirection === 'SHORT'
              ? 'bg-red-500 text-white shadow-red-500/20'
              : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <TrendingDown className="w-5 h-5" />
            <span>Short</span>
          </div>
        </button>
      </div>
      
      {/* Apply to All Checkbox */}
      <div className="flex items-center justify-end gap-2 px-1">
        <Checkbox 
          id="direction-all" 
          checked={applyToAll}
          onCheckedChange={onApplyToAllChange}
          className="border-gray-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
        />
        <label htmlFor="direction-all" className="text-xs text-gray-400 cursor-pointer select-none hover:text-white transition-colors">
          Apply to all pairs
        </label>
      </div>
      
      {/* Per-Coin Direction (when not applying to all) */}
      {!applyToAll && pairs.length > 0 && (
        <div className="space-y-2 bg-slate-950/50 rounded-lg p-3 border border-slate-700 mt-2">
          <span className="text-xs text-gray-400 font-semibold uppercase">Per-Pair Settings</span>
          {pairs.map(pair => (
            <div key={pair} className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">{pair}</span>
              <div className="flex bg-slate-800 rounded-md p-0.5">
                <button
                  onClick={() => onPerCoinDirectionChange(pair, 'LONG')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    (perCoinDirection[pair] || globalDirection) === 'LONG'
                      ? 'bg-[#10b981] text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Long
                </button>
                <button
                  onClick={() => onPerCoinDirectionChange(pair, 'SHORT')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    (perCoinDirection[pair] || globalDirection) === 'SHORT'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Short
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}