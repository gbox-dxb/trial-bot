import React from 'react';
import { Button } from '@/components/ui/button';
import { Filter, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';

const FilterBar = ({ filters, setFilters, sort, setSort, onReset }) => {
  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
      {/* Filters Group */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-slate-400 mr-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        {/* Bot Type Filter */}
        <select 
          className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
          value={filters.type}
          onChange={(e) => handleChange('type', e.target.value)}
        >
          <option value="All">All Types</option>
          <option value="Manual">Manual</option>
          <option value="DCA">DCA Bot</option>
          <option value="Grid">Grid Bot</option>
          <option value="Momentum">Momentum</option>
          <option value="Candle Strike">Candle Strike</option>
        </select>

        {/* Direction Filter */}
        <select
          className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
          value={filters.direction}
          onChange={(e) => handleChange('direction', e.target.value)}
        >
          <option value="All">All Sides</option>
          <option value="LONG">Long</option>
          <option value="SHORT">Short</option>
        </select>

        {/* Status Filter (Active/Closed mainly handled by Tabs, but kept for specific sub-status if needed) */}
        <select
          className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
          value={filters.pair}
          onChange={(e) => handleChange('pair', e.target.value)}
        >
          <option value="All">All Pairs</option>
          <option value="BTCUSDT">BTCUSDT</option>
          <option value="ETHUSDT">ETHUSDT</option>
          <option value="LTCUSDT">LTCUSDT</option>
          <option value="BNBUSDT">BNBUSDT</option>
          <option value="ADAUSDT">ADAUSDT</option>
          <option value="XRPUSDT">XRPUSDT</option>
          <option value="DOGEUSDT">DOGEUSDT</option>
        </select>
      </div>

      {/* Sort Group */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-slate-400 mr-2">
          <ArrowUpDown className="h-4 w-4" />
          <span className="text-sm font-medium">Sort by:</span>
        </div>

        <select
          className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="pnl-desc">Highest P/L</option>
          <option value="pnl-asc">Lowest P/L</option>
          <option value="pair-asc">Pair A-Z</option>
        </select>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onReset}
          className="text-slate-400 hover:text-white"
        >
          Reset
        </Button>
      </div>
    </div>
  );
};

export default FilterBar;