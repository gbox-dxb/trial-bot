import { useState, useEffect, useCallback } from 'react';
import { storage } from '@/lib/storage';
import { usePrice } from '@/contexts/PriceContext';

export const useUnifiedPositions = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { prices } = usePrice();

  const fetchPositions = useCallback(() => {
    try {
      const allPositions = [];

      // 1. Active Orders (Market & Limit)
      const activeOrders = storage.getActiveOrders() || [];
      activeOrders.forEach(order => {
        // Distinguish between Market (Positions) and Limit (Pending)
        const isLimit = order.status === 'PENDING';
        allPositions.push({
          id: order.id,
          uniqueId: `order-${order.id}`,
          source: 'ORDER',
          type: isLimit ? 'LIMIT' : 'MARKET',
          symbol: order.pair || order.symbol,
          side: order.direction || order.side,
          size: order.margin || 0, // Matches ActiveOrdersTable display (where margin is treated as Position Size)
          invested: order.margin || 0,
          leverage: order.leverage || 1,
          entryPrice: order.entryPrice || order.price,
          tp: order.tp || {},
          sl: order.sl || {},
          status: order.status,
          timestamp: order.createdAt,
          originalData: order
        });
      });

      // 2. Grid Bots
      const gridBots = storage.getGridBots() || [];
      gridBots.forEach(bot => {
        allPositions.push({
          id: bot.id,
          uniqueId: `grid-${bot.id}`,
          source: 'BOT',
          type: 'GRID',
          symbol: bot.pair,
          side: 'Neutral', // Grids are usually strategies, not simple directions
          size: bot.investment * (bot.leverage || 1),
          invested: bot.investment,
          leverage: bot.leverage || 1,
          entryPrice: bot.currentPrice, // Approximate anchor
          status: bot.status.toUpperCase(),
          timestamp: bot.createdAt,
          originalData: bot
        });
      });

      // 3. DCA Bots
      const dcaBots = storage.getDCABots() || [];
      dcaBots.forEach(bot => {
        allPositions.push({
          id: bot.id,
          uniqueId: `dca-${bot.id}`,
          source: 'BOT',
          type: 'DCA',
          symbol: bot.pair,
          side: bot.direction,
          size: (bot.totalSizeCoins || 0) * (bot.averagePrice || 0),
          invested: bot.totalInvested || 0,
          leverage: bot.leverage || 1,
          entryPrice: bot.averagePrice || bot.entryPrice,
          status: bot.status.toUpperCase(),
          timestamp: bot.createdAt,
          originalData: bot
        });
      });

      // 4. RSI Bots
      const rsiBots = storage.getRSIBots() || [];
      rsiBots.forEach(bot => {
        // Only show if it has an active trade or just show the bot itself as 'monitor'
        allPositions.push({
          id: bot.id,
          uniqueId: `rsi-${bot.id}`,
          source: 'BOT',
          type: 'RSI',
          symbol: bot.pair,
          side: bot.direction === 'Auto' ? 'Neutral' : bot.direction,
          size: 0, // Usually determined at trigger
          invested: 0,
          leverage: 1, // Config specific
          entryPrice: 0,
          status: bot.status.toUpperCase(),
          timestamp: bot.createdAt,
          originalData: bot
        });
      });

      // 5. Momentum Bots
      const momentumBots = storage.getMomentumBots() || [];
      momentumBots.forEach(bot => {
        allPositions.push({
          id: bot.id,
          uniqueId: `mom-${bot.id}`,
          source: 'BOT',
          type: 'MOMENTUM',
          symbol: bot.pair,
          side: bot.direction,
          size: 0,
          invested: 0,
          leverage: 1,
          entryPrice: bot.referencePrice || 0,
          status: bot.status.toUpperCase(),
          timestamp: bot.createdAt,
          originalData: bot
        });
      });

      // 6. Candle Strike Bots
      const candleBots = storage.getCandleStrikeBots() || [];
      candleBots.forEach(bot => {
        allPositions.push({
          id: bot.id,
          uniqueId: `cs-${bot.id}`,
          source: 'BOT',
          type: 'CANDLE_STRIKE',
          symbol: bot.pair || 'Unknown',
          side: bot.trendDirection,
          size: 0,
          invested: 0,
          leverage: 1,
          entryPrice: 0,
          status: bot.status.toUpperCase(),
          timestamp: bot.createdAt,
          originalData: bot
        });
      });

      // Sort by newest first
      setPositions(allPositions.sort((a, b) => b.timestamp - a.timestamp));
    } catch (err) {
      console.error("Error fetching unified positions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPositions();

    // Poll for updates
    const interval = setInterval(fetchPositions, 2000);

    // Listen for storage events (cross-tab)
    const handleStorageChange = () => fetchPositions();
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchPositions]);

  return { positions, loading, refresh: fetchPositions };
};