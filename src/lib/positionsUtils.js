import { storage } from '@/lib/storage';

/**
 * Aggregates all positions (Open and Closed) from various bot types and manual trades.
 * Returns a normalized array of position objects.
 */
export const getAllPositions = () => {
  const positions = [];

  // 1. Manual Positions
  const manualPositions = storage.getPositions() || [];
  manualPositions.forEach(pos => {
    positions.push(normalizePosition(pos, 'Manual'));
  });

  // 2. DCA Bots
  const dcaBots = storage.getDCABots() || [];
  dcaBots.forEach(bot => {
    // Check for active deals
    if (bot.status === 'Active' && bot.activeDeal) {
      positions.push(normalizeBotPosition(bot, 'DCA', bot.activeDeal));
    }
    // Check history/completed deals if stored within bot
    if (bot.dealHistory && Array.isArray(bot.dealHistory)) {
      bot.dealHistory.forEach(deal => {
        positions.push(normalizeBotPosition(bot, 'DCA', deal, true));
      });
    }
  });

  // 3. Grid Bots
  const gridBots = storage.getGridBots() || [];
  gridBots.forEach(bot => {
    // Grid bots are complex; treating the running bot as a "position" for summary
    if (bot.status === 'Active') {
      positions.push({
        id: bot.id,
        botId: bot.id,
        type: 'Grid',
        symbol: bot.pair,
        direction: 'Neutral', // Grids are usually neutral/long-short
        entryPrice: bot.avgPrice || bot.lowerPrice, // Approx
        markPrice: 0, // To be filled by live data
        size: bot.totalInvestment,
        timestamp: bot.createdAt,
        status: 'OPEN',
        pnl: bot.currentProfit || 0, // Needs real-time calc
        tp: bot.takeProfit,
        sl: bot.stopLoss,
        leverage: bot.leverage || 1,
        originalData: bot
      });
    }
    // Grid history could be added here if stored
  });

  // 4. Candle Strike Bots
  const candleStrikeBots = storage.getCandleStrikeBots() || [];
  candleStrikeBots.forEach(bot => {
    if (bot.status === 'Active' && bot.activeTrade) {
      positions.push(normalizeBotPosition(bot, 'Candle Strike', bot.activeTrade));
    }
    if (bot.tradeHistory && Array.isArray(bot.tradeHistory)) {
      bot.tradeHistory.forEach(trade => {
        positions.push(normalizeBotPosition(bot, 'Candle Strike', trade, true));
      });
    }
  });
  
  // 5. Momentum Bots (using generic getBots for now or specific if added later)
  const momentumBots = storage.getBots() || [];
  momentumBots.forEach(bot => {
     if (bot.status === 'Active' && bot.activeTrade) {
        positions.push(normalizeBotPosition(bot, 'Momentum', bot.activeTrade));
     }
  });

  return positions;
};

// Helper to normalize generic bot positions
const normalizeBotPosition = (bot, type, trade, isClosed = false) => {
  return {
    id: trade.id || `${bot.id}-${Date.now()}`,
    botId: bot.id,
    type: type,
    symbol: bot.pair || bot.symbol,
    direction: bot.direction || (trade.side === 'SELL' ? 'SHORT' : 'LONG'),
    entryPrice: parseFloat(trade.entryPrice),
    exitPrice: trade.exitPrice ? parseFloat(trade.exitPrice) : null,
    markPrice: 0, // Filled later
    size: parseFloat(trade.amount || bot.amount || 0),
    timestamp: trade.startTime || trade.timestamp || Date.now(),
    exitTime: trade.endTime || trade.closedAt,
    status: isClosed ? 'CLOSED' : 'OPEN',
    pnl: trade.pnl || 0,
    pnlPercent: trade.pnlPercent || 0,
    tp: parseFloat(bot.takeProfit || 0),
    sl: parseFloat(bot.stopLoss || 0),
    leverage: bot.leverage || 1,
    exitReason: trade.exitReason || (isClosed ? 'Manual' : null),
    originalData: bot
  };
};

// Helper to normalize manual positions
const normalizePosition = (pos, type) => {
  return {
    id: pos.id,
    botId: 'manual',
    type: type,
    symbol: pos.symbol,
    direction: pos.side,
    entryPrice: pos.entryPrice,
    exitPrice: pos.exitPrice,
    markPrice: 0,
    size: pos.size,
    timestamp: pos.createdAt || pos.timestamp,
    exitTime: pos.closedAt,
    status: pos.status === 'open' ? 'OPEN' : 'CLOSED',
    pnl: pos.pnl || 0,
    tp: pos.tp,
    sl: pos.sl,
    leverage: pos.leverage,
    exitReason: pos.exitReason || (pos.status === 'closed' ? 'Manual' : null),
    originalData: pos
  };
};

// Actions
export const closePosition = (position, exitPrice) => {
  // Logic to close based on type
  if (position.type === 'Manual') {
    const all = storage.getPositions();
    const updated = all.map(p => {
      if (p.id === position.id) {
        return { 
          ...p, 
          status: 'closed', 
          closedAt: Date.now(), 
          exitPrice, 
          pnl: calculatePnL(p, exitPrice) 
        };
      }
      return p;
    });
    storage.setPositions(updated);
    return true;
  }
  
  if (position.type === 'DCA') {
    const bots = storage.getDCABots();
    const updatedBots = bots.map(b => {
      if (b.id === position.botId) {
        // Move active deal to history
        const deal = { 
          ...b.activeDeal, 
          endTime: Date.now(), 
          exitPrice, 
          pnl: calculatePnL({ ...b.activeDeal, direction: b.direction, size: b.amount }, exitPrice),
          exitReason: 'Manual Close'
        };
        return {
          ...b,
          activeDeal: null,
          dealHistory: [...(b.dealHistory || []), deal],
          status: 'Paused' // Usually pause bot after manual intervention
        };
      }
      return b;
    });
    storage.saveDCABots(updatedBots);
    return true;
  }
  
  if (position.type === 'Candle Strike') {
     const bots = storage.getCandleStrikeBots();
     const updatedBots = bots.map(b => {
        if(b.id === position.botId) {
           const trade = {
              ...b.activeTrade,
              endTime: Date.now(),
              exitPrice,
              pnl: calculatePnL({...b.activeTrade, direction: b.direction, size: b.amount}, exitPrice),
              exitReason: 'Manual Close'
           };
           return {
              ...b,
              activeTrade: null,
              tradeHistory: [...(b.tradeHistory || []), trade],
              status: 'Paused'
           };
        }
        return b;
     });
     storage.saveCandleStrikeBots(updatedBots);
     return true;
  }

  // Fallback for Grid/Momentum if simple structure matches
  return false; 
};

export const updatePositionTPSL = (position, newTp, newSl) => {
  if (position.type === 'Manual') {
    const all = storage.getPositions();
    const updated = all.map(p => 
      p.id === position.id ? { ...p, tp: newTp, sl: newSl } : p
    );
    storage.setPositions(updated);
    return true;
  }
  
  // Implement for other bots as needed...
  return false;
};

// Simple PnL Calc Helper
const calculatePnL = (pos, currentPrice) => {
  const isLong = pos.direction === 'LONG' || pos.side === 'LONG';
  const diff = isLong ? currentPrice - pos.entryPrice : pos.entryPrice - currentPrice;
  return diff * (pos.size || pos.amount || 0);
};