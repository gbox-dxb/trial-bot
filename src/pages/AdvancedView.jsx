import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import TradingViewChart from '@/components/TradingViewChart';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { Activity, TrendingUp, Layers, Settings2, BarChart4 } from 'lucide-react';
import { Label } from "@/components/ui/label";

// Constants for configuration
const AVAILABLE_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 
  'ADAUSDT', 'DOGEUSDT', 'MATICUSDT', 'LTCUSDT', 'DOTUSDT'
];

const TIMEFRAMES = [
  { label: '1m', value: '1' },
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '30m', value: '30' },
  { label: '1h', value: '60' },
  { label: '2h', value: '120' },
  { label: '4h', value: '240' },
  { label: '1D', value: 'D' },
  { label: '1W', value: 'W' },
  { label: '1M', value: 'M' }
];

const AVAILABLE_INDICATORS = [
  { id: 'RSI', name: 'Relative Strength Index (RSI)' },
  { id: 'MACD', name: 'MACD' },
  { id: 'BB', name: 'Bollinger Bands' },
  { id: 'MA', name: 'Moving Average (SMA)' },
  { id: 'EMA', name: 'Exponential Moving Average', code: 'Moving Average Exponential@tv-basicstudies' },
  { id: 'Stoch', name: 'Stochastic RSI' },
  { id: 'ATR', name: 'Average True Range', code: 'ATR@tv-basicstudies' },
  { id: 'CCI', name: 'CCI', code: 'CCI@tv-basicstudies' }
];

export default function AdvancedView() {
  // State initialization with localStorage persistence
  const [symbol, setSymbol] = useState(() => localStorage.getItem('adv_chart_symbol') || 'BTCUSDT');
  const [timeframe, setTimeframe] = useState(() => localStorage.getItem('adv_chart_timeframe') || '60');
  const [activeIndicators, setActiveIndicators] = useState(() => {
    const saved = localStorage.getItem('adv_chart_indicators');
    return saved ? JSON.parse(saved) : ['RSI', 'MA'];
  });

  // Persist changes
  useEffect(() => localStorage.setItem('adv_chart_symbol', symbol), [symbol]);
  useEffect(() => localStorage.setItem('adv_chart_timeframe', timeframe), [timeframe]);
  useEffect(() => localStorage.setItem('adv_chart_indicators', JSON.stringify(activeIndicators)), [activeIndicators]);

  // Helpers
  const toggleIndicator = (id) => {
    setActiveIndicators(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getStudiesList = () => {
    return activeIndicators.map(id => {
      const ind = AVAILABLE_INDICATORS.find(i => i.id === id);
      return ind?.code || ind?.id; // Return special code if exists, else ID for basic mapping
    });
  };

  // Calculate 24h change (simulated for UI purposes, real data comes from widget)
  const isGreen = true; // This would typically come from a price context

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#0F1419] text-white overflow-hidden">
      <Helmet>
        <title>{symbol} Chart - Advanced Terminal</title>
        <meta name="description" content="Professional grade cryptocurrency trading chart with advanced technical indicators." />
      </Helmet>

      {/* --- Top Toolbar --- */}
      <div className="flex flex-col md:flex-row items-center justify-between p-3 border-b border-slate-800 bg-slate-900 gap-3 flex-none z-20 shadow-md">
        
        {/* Left: Symbol & Basic Info */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20 shrink-0">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-indigo-100 hidden sm:inline">Terminal</span>
          </div>

          <Select value={symbol} onValueChange={setSymbol}>
            <SelectTrigger className="w-[160px] bg-slate-800 border-slate-700 text-slate-200 font-mono font-bold focus:ring-indigo-500/50 h-9">
              <SelectValue placeholder="Symbol" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
              {AVAILABLE_SYMBOLS.map((s) => (
                <SelectItem key={s} value={s} className="focus:bg-slate-700 cursor-pointer font-mono">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="hidden lg:flex items-center gap-2 text-xs font-mono px-2 border-l border-slate-800 text-slate-400">
            <span>BINANCE</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400">PERPETUAL</span>
          </div>
        </div>

        {/* Center: Timeframes */}
        <div className="flex items-center gap-0.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 custom-scrollbar mask-linear-fade">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={cn(
                "px-3 py-1.5 rounded-sm text-[11px] font-bold transition-all whitespace-nowrap min-w-[2.5rem]",
                timeframe === tf.value
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Right: Indicators & Settings */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
           <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 gap-2">
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">Indicators</span>
                {activeIndicators.length > 0 && (
                  <span className="bg-indigo-500 text-white text-[10px] px-1.5 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center">
                    {activeIndicators.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0 bg-slate-900 border-slate-700" align="end">
              <div className="p-3 border-b border-slate-800 font-semibold text-slate-200 flex items-center gap-2">
                <BarChart4 className="w-4 h-4 text-indigo-400" />
                Active Indicators
              </div>
              <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
                {AVAILABLE_INDICATORS.map((indicator) => (
                  <div 
                    key={indicator.id} 
                    className="flex items-center space-x-2 p-2 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                    onClick={() => toggleIndicator(indicator.id)}
                  >
                    <Checkbox 
                      id={`ind-${indicator.id}`} 
                      checked={activeIndicators.includes(indicator.id)}
                      onCheckedChange={() => toggleIndicator(indicator.id)}
                      className="border-slate-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                    />
                    <Label 
                      htmlFor={`ind-${indicator.id}`} 
                      className="flex-1 cursor-pointer text-sm text-slate-300 font-medium"
                    >
                      {indicator.name}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800">
            <Settings2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* --- Main Chart Area --- */}
      <div className="flex-1 relative bg-[#131722]"> 
        {/* Using standard TV dark background to prevent white flash */}
        <TradingViewChart 
          symbol={symbol} 
          interval={timeframe} 
          studies={getStudiesList()}
          watchlist={AVAILABLE_SYMBOLS.map(s => `BINANCE:${s}`)}
        />
      </div>
    </div>
  );
}