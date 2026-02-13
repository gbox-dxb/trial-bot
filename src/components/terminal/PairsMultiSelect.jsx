import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePrice } from '@/contexts/PriceContext';
import { exchangeService } from '@/lib/exchangeService';
import { TRADING_PAIRS } from '@/lib/mockData';
import { X, Search, TrendingUp, TrendingDown, Check, Loader2 } from 'lucide-react';

export default function PairsMultiSelect({ accountId, value = [], onChange, userId = 'user-1' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { prices, tickerData, connectionStatus } = usePrice();
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 50);
    }
  }, [isOpen]);
  
  // Handle loading state in useEffect to avoid side-effects in useMemo
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [accountId, userId]);

  // Memoize available pairs with fallback
  const availablePairs = useMemo(() => {
    let pairs = [];
    
    // If we have an account ID, try to get specific pairs, otherwise use defaults
    if (accountId) {
      pairs = exchangeService.getSupportedPairs(accountId, userId);
    } else {
      pairs = TRADING_PAIRS;
    }
    
    // Safety check - if exchange service returns empty/null, use fallback
    if (!pairs || !Array.isArray(pairs) || pairs.length === 0) {
      pairs = TRADING_PAIRS;
    }
    
    return pairs;
  }, [accountId, userId]);

  const filteredPairs = useMemo(() => {
    const pairsToFilter = Array.isArray(availablePairs) ? availablePairs : TRADING_PAIRS;
    
    if (!searchTerm) return pairsToFilter;
    
    return pairsToFilter.filter(pair => 
      typeof pair === 'string' && pair.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availablePairs, searchTerm]);
  
  const handleSelectPair = (pair, e) => {
    // Prevent event bubbling to avoid closing the dropdown immediately if inside a container that toggles it
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    let newValue;
    // Ensure value is always an array
    const currentValue = Array.isArray(value) ? value : [];
    
    if (currentValue.includes(pair)) {
      newValue = currentValue.filter(p => p !== pair);
    } else {
      newValue = [...currentValue, pair];
    }
    
    onChange(newValue);
    // Keep dropdown open for easier multi-selection
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  const removePair = (pair, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    // Ensure value is always an array
    const currentValue = Array.isArray(value) ? value : [];
    onChange(currentValue.filter(p => p !== pair));
  };
  
  return (
    <div className="space-y-2" ref={wrapperRef}>
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Asset & Direction</label>
      
      {/* Search Input Trigger */}
      <div 
        className="relative group"
        onClick={() => !isOpen && setIsOpen(true)}
      >
        <div className={`
          flex items-center w-full bg-[#0b0b15] border rounded-lg transition-all duration-200
          ${isOpen ? 'border-purple-500 ring-1 ring-purple-500/20' : 'border-slate-800 hover:border-slate-600'}
        `}>
          <div className="pl-3 py-2.5 text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          
          <div className="flex-1 flex flex-wrap gap-2 p-2 min-h-[42px]">
            {Array.isArray(value) && value.length > 0 && value.map(pair => (
              <div 
                key={pair} 
                className="inline-flex items-center gap-1 bg-slate-800 text-white text-xs font-medium px-2 py-1 rounded border border-slate-700 select-none animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()} // Prevent opening dropdown when clicking a chip
              >
                <span>{pair}</span>
                <button
                  onClick={(e) => removePair(pair, e)}
                  className="text-slate-400 hover:text-white hover:bg-slate-700 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            <input
              ref={inputRef}
              type="text"
              className="bg-transparent border-none outline-none text-sm text-white placeholder:text-slate-500 min-w-[120px] flex-1 h-7"
              placeholder={(!value || value.length === 0) ? "Search coin (e.g. BTC)..." : ""}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
            />
          </div>
          
          {Array.isArray(value) && value.length > 0 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="pr-3 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e1e2d] border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            
            {/* Header Status */}
            <div className="px-3 py-2 bg-[#1a1a2e] border-b border-slate-700 flex justify-between items-center text-[10px] font-medium text-slate-400">
              <span>AVAILABLE PAIRS</span>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'Connected' ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500'}`} />
                <span className={connectionStatus === 'Connected' ? 'text-emerald-500' : 'text-yellow-500'}>
                  {connectionStatus === 'Connected' ? 'LIVE' : 'CONNECTING'}
                </span>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[280px] overflow-y-auto custom-scrollbar p-1">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <span className="text-xs">Loading assets...</span>
                </div>
              ) : filteredPairs.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  No pairs found matching "{searchTerm}"
                </div>
              ) : (
                filteredPairs.map(pair => {
                  const ticker = tickerData[pair];
                  const price = prices[pair];
                  const change = ticker?.percent || 0;
                  const isPositive = change >= 0;
                  const isSelected = Array.isArray(value) && value.includes(pair);
                  
                  return (
                    <div
                      key={pair}
                      onMouseDown={(e) => handleSelectPair(pair, e)} // Use onMouseDown to prevent focus loss issues
                      className={`
                        group flex items-center justify-between p-2 rounded-md cursor-pointer mb-0.5 transition-all duration-150
                        ${isSelected 
                          ? 'bg-purple-500/10 border border-purple-500/30' 
                          : 'hover:bg-slate-800 border border-transparent'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-4 h-4 rounded border flex items-center justify-center transition-colors
                          ${isSelected 
                            ? 'bg-purple-500 border-purple-500 text-white' 
                            : 'border-slate-600 group-hover:border-slate-500'}
                        `}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                            {pair}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Perpetual
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-medium text-slate-200 font-mono">
                          ${price ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}
                        </span>
                        <div className={`flex items-center text-[10px] ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isPositive ? '+' : ''}{change.toFixed(2)}%
                          {isPositive ? <TrendingUp className="w-3 h-3 ml-0.5" /> : <TrendingDown className="w-3 h-3 ml-0.5" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}