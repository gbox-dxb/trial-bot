import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, Clock } from 'lucide-react';
import { storage } from '@/lib/storage';

export default function Analytics() {
  const [stats, setStats] = useState({
    totalPnL: 0,
    winRate: 0,
    totalTrades: 0,
    avgDuration: 0
  });
  const [selectedBotType, setSelectedBotType] = useState('All');

  useEffect(() => {
    loadAnalytics();
  }, [selectedBotType]);

  const loadAnalytics = () => {
    let trades = storage.getTrades();
    const positions = storage.getPositions();

    if (selectedBotType !== 'All') {
      trades = trades.filter(t => t.botType === selectedBotType);
    }

    const totalPnL = [...trades, ...positions].reduce((sum, item) => sum + item.pnl, 0);
    const winningTrades = trades.filter(t => t.pnl > 0).length;
    const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;
    
    const avgDuration = trades.length > 0
      ? trades.reduce((sum, t) => sum + (t.closedAt - t.openedAt), 0) / trades.length / 3600000
      : 0;

    setStats({
      totalPnL,
      winRate,
      totalTrades: trades.length,
      avgDuration
    });
  };

  const botTypes = ['All', 'RSI', 'Grid', 'DCA', 'CandleStrike', 'Momentum', 'Manual'];

  return (
    <>
      <Helmet>
        <title>Analytics - MEXC Trading Platform</title>
        <meta name="description" content="View your trading performance and analytics" />
      </Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <div className="flex gap-2">
            {botTypes.map(type => (
              <button
                key={type}
                onClick={() => setSelectedBotType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedBotType === type
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-xl border border-purple-500/20 p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-600/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-gray-400 text-sm">Total P/L</span>
            </div>
            <p className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${stats.totalPnL.toFixed(2)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-xl border border-purple-500/20 p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-gray-400 text-sm">Win Rate</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.winRate.toFixed(1)}%</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-xl border border-purple-500/20 p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <TrendingDown className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-gray-400 text-sm">Total Trades</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalTrades}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-xl border border-purple-500/20 p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-pink-600/20 rounded-lg">
                <Clock className="w-5 h-5 text-pink-400" />
              </div>
              <span className="text-gray-400 text-sm">Avg Duration</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.avgDuration.toFixed(1)}h</p>
          </motion.div>
        </div>

        {/* P/L Chart Placeholder */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-purple-500/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4">P/L Over Time</h2>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chart visualization will be displayed here
          </div>
        </div>
      </div>
    </>
  );
}