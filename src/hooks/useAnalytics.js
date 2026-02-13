import { useState, useEffect, useCallback } from 'react';
import { storage } from '@/lib/storage';
import { analyticsEngine } from '@/lib/analyticsEngine';

export const useAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(() => {
    try {
      // Gather all data sources
      const closedOrders = storage.getClosedOrders() || [];
      const trades = storage.getTrades() || [];
      const dcaTrades = storage.getDCATrades() || [];
      const pmTrades = storage.getPriceMovementTrades() || [];
      
      // Combine all trade-like history
      // Normalize closed orders to look like trades if needed
      const normalizedOrders = closedOrders.map(o => ({
        ...o,
        pnl: o.finalPnL || o.pnl || 0,
        timestamp: o.closedAt || o.timestamp
      }));

      const allTrades = [
        ...normalizedOrders,
        ...trades,
        ...dcaTrades,
        ...pmTrades
      ];

      // Remove duplicates if any ID conflicts exist (simple de-dupe by ID if present)
      const uniqueTrades = Array.from(new Map(allTrades.map(item => [item.id || Math.random(), item])).values());

      const activePositions = storage.getActiveOrders() || [];
      
      // Bots
      const gridBots = storage.getGridBots() || [];
      const dcaBots = storage.getDCABots() || [];
      const rsiBots = storage.getRSIBots() || [];
      const momentumBots = storage.getMomentumBots() || [];
      const candleBots = storage.getCandleStrikeBots() || [];
      const pmBots = storage.getPriceMovementBots() || [];

      const allBots = [
        ...gridBots, ...dcaBots, ...rsiBots, 
        ...momentumBots, ...candleBots, ...pmBots
      ];

      const metrics = analyticsEngine.calculateAllMetrics(uniqueTrades, activePositions, allBots);
      setData(metrics);
      setLoading(false);
    } catch (err) {
      console.error("Analytics Error:", err);
      setError(err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
};