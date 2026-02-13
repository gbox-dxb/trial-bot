import { storage } from '@/lib/storage';

export const analyticsEngine = {
  calculateAllMetrics(trades, activePositions, bots) {
    // 1. Basic Aggregate Metrics
    const totalTrades = trades.length;
    const wins = trades.filter(t => (t.pnl || t.finalPnL || 0) > 0);
    const losses = trades.filter(t => (t.pnl || t.finalPnL || 0) <= 0);
    const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
    const lossRate = totalTrades > 0 ? (losses.length / totalTrades) * 100 : 0;
    
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || t.finalPnL || 0), 0);
    const totalFees = trades.reduce((sum, t) => sum + (t.fee || 0), 0); // Assuming fee field exists or 0
    
    const avgProfitPerTrade = totalTrades > 0 ? totalPnL / totalTrades : 0;
    
    // Sort for largest win/loss
    const sortedPnL = [...trades].sort((a, b) => (b.pnl || 0) - (a.pnl || 0));
    const largestWin = sortedPnL.length > 0 && (sortedPnL[0].pnl > 0) ? sortedPnL[0].pnl : 0;
    const largestLoss = sortedPnL.length > 0 && (sortedPnL[sortedPnL.length - 1].pnl < 0) ? sortedPnL[sortedPnL.length - 1].pnl : 0;

    // 2. Coin-wise Performance
    const coinStats = {};
    trades.forEach(t => {
      const symbol = t.symbol || t.pair;
      if (!coinStats[symbol]) {
        coinStats[symbol] = { 
          symbol, 
          trades: 0, 
          wins: 0, 
          pnl: 0, 
          volume: 0,
          bestTrade: -Infinity,
          worstTrade: Infinity 
        };
      }
      
      const pnl = t.pnl || t.finalPnL || 0;
      const size = (t.size || t.amount || 0) * (t.price || t.entryPrice || 0);
      
      coinStats[symbol].trades++;
      if (pnl > 0) coinStats[symbol].wins++;
      coinStats[symbol].pnl += pnl;
      coinStats[symbol].volume += size;
      if (pnl > coinStats[symbol].bestTrade) coinStats[symbol].bestTrade = pnl;
      if (pnl < coinStats[symbol].worstTrade) coinStats[symbol].worstTrade = pnl;
    });

    const coinPerformance = Object.values(coinStats).map(c => ({
      ...c,
      winRate: c.trades > 0 ? (c.wins / c.trades) * 100 : 0,
      bestTrade: c.bestTrade === -Infinity ? 0 : c.bestTrade,
      worstTrade: c.worstTrade === Infinity ? 0 : c.worstTrade
    }));

    // 3. Bot Performance
    const botPerformance = bots.map(b => {
      // Find trades for this bot
      const botTrades = trades.filter(t => t.botId === b.id || t.sourceId === b.id);
      const botWins = botTrades.filter(t => (t.pnl || 0) > 0).length;
      
      return {
        id: b.id,
        name: b.name || `${b.type} Bot`,
        type: b.type,
        status: b.status,
        totalPnL: b.totalPnL || botTrades.reduce((s, t) => s + (t.pnl || 0), 0),
        tradeCount: botTrades.length,
        winRate: botTrades.length > 0 ? (botWins / botTrades.length) * 100 : 0,
        activeDuration: b.createdAt ? Date.now() - b.createdAt : 0
      };
    });

    // 4. Time Analysis (Heatmap data approximation)
    const hours = new Array(24).fill(0).map(() => ({ trades: 0, pnl: 0 }));
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => ({ name: d, trades: 0, pnl: 0 }));

    trades.forEach(t => {
      const date = new Date(t.timestamp || t.closedAt || Date.now());
      const hour = date.getHours();
      const day = date.getDay();

      hours[hour].trades++;
      hours[hour].pnl += (t.pnl || 0);
      
      days[day].trades++;
      days[day].pnl += (t.pnl || 0);
    });

    const bestTradingHour = hours.reduce((max, curr, idx) => curr.pnl > max.pnl ? { ...curr, hour: idx } : max, { pnl: -Infinity, hour: 0 });

    // 5. P&L Over Time (Cumulative)
    let cumulative = 0;
    const timeline = trades
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
      .map(t => {
        cumulative += (t.pnl || 0);
        return {
          time: Math.floor((t.timestamp || Date.now()) / 1000), // Seconds for lightweight-charts
          value: cumulative
        };
      });

    // 6. Max Drawdown
    let maxDrawdown = 0;
    let peak = 0;
    cumulative = 0;
    
    trades.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)).forEach(t => {
      cumulative += (t.pnl || 0);
      if (cumulative > peak) peak = cumulative;
      const drawdown = peak - cumulative;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    // 7. Total Portfolio Value (Simple approximation from Exchange Accounts)
    const exchanges = storage.getExchanges();
    const totalBalance = exchanges.reduce((sum, ex) => sum + (ex.balance || 0), 0);
    const totalEquity = totalBalance + activePositions.reduce((sum, p) => {
       // Estimate unrealized PnL if available, else 0
       return sum + (p.pnl || 0);
    }, 0);

    return {
      overview: {
        totalBalance,
        totalEquity,
        totalPnL,
        winRate,
        lossRate,
        totalTrades,
        activeBots: bots.filter(b => b.status === 'active' || b.status === 'running').length,
        openPositions: activePositions.length,
        totalVolume: coinPerformance.reduce((acc, c) => acc + c.volume, 0),
        avgTradeSize: coinPerformance.reduce((acc, c) => acc + c.volume, 0) / (totalTrades || 1),
        totalFees
      },
      details: {
        avgProfitPerTrade,
        largestWin,
        largestLoss,
        maxDrawdown,
        bestTradingHour
      },
      charts: {
        timeline,
        hourlyPerformance: hours,
        dailyPerformance: days
      },
      coins: coinPerformance.sort((a, b) => b.pnl - a.pnl),
      bots: botPerformance,
      recentActivity: [...trades, ...bots].sort((a, b) => (b.timestamp || b.createdAt) - (a.timestamp || a.createdAt)).slice(0, 50)
    };
  }
};