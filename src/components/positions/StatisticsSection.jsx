import React from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, Wallet, Crosshair } from 'lucide-react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, subValue, icon: Icon, colorClass }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700 hover:border-purple-500/30 transition-all hover:shadow-lg hover:shadow-purple-900/10"
  >
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
        <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
      {subValue && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          subValue.startsWith('+') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {subValue}
        </span>
      )}
    </div>
    <div className="space-y-1">
      <h3 className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{title}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </motion.div>
);

const StatisticsSection = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard 
        title="Total P/L"
        value={`$${stats.totalPnL.toFixed(2)}`}
        subValue={`${stats.totalPnLPercent > 0 ? '+' : ''}${stats.totalPnLPercent.toFixed(2)}%`}
        icon={DollarSign}
        colorClass={stats.totalPnL >= 0 ? "bg-green-500" : "bg-red-500"}
      />
      
      <StatCard 
        title="Open Positions"
        value={stats.openCount}
        icon={Activity}
        colorClass="bg-blue-500"
      />
      
      <StatCard 
        title="Win Rate"
        value={`${stats.winRate.toFixed(1)}%`}
        subValue={`${stats.totalTrades} Trades`}
        icon={Crosshair}
        colorClass="bg-purple-500"
      />

      <StatCard 
        title="Best Trade"
        value={`+$${stats.largestWin.toFixed(2)}`}
        icon={TrendingUp}
        colorClass="bg-emerald-500"
      />
    </div>
  );
};

export default StatisticsSection;