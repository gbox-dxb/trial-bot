import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage } from '@/lib/storage';
import { mexcService } from '@/lib/mexcService';

const LiveTradingContext = createContext(null);

export function LiveTradingProvider({ children }) {
  const [liveAccounts, setLiveAccounts] = useState([]);
  const [globalSafetySettings, setGlobalSafetySettings] = useState({
      maxDailyLoss: 500,
      tradingEnabled: true // Master switch
  });
  const [dailyStats, setDailyStats] = useState({
      loss: 0,
      trades: 0
  });

  const refreshAccounts = useCallback(() => {
    const accounts = storage.getExchanges().filter(ex => ex.status === 'active');
    setLiveAccounts(accounts);
  }, []);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  const getActiveAccount = () => {
      return liveAccounts.length > 0 ? liveAccounts[0] : null;
  };

  const pauseAllTrading = () => {
      setGlobalSafetySettings(prev => ({ ...prev, tradingEnabled: false }));
      
      // Update all active bots in storage to 'paused'
      ['rsiBots', 'momentumBots', 'gridBots', 'dcaBots', 'candleStrikeBots'].forEach(collection => {
          const bots = JSON.parse(localStorage.getItem(collection) || '[]');
          const updated = bots.map(b => b.mode === 'LIVE' && b.status === 'active' ? { ...b, status: 'paused' } : b);
          localStorage.setItem(collection, JSON.stringify(updated));
      });
  };

  const checkSafetyLimits = (estimatedLoss = 0) => {
      if (!globalSafetySettings.tradingEnabled) return false;
      if ((dailyStats.loss + estimatedLoss) > globalSafetySettings.maxDailyLoss) {
          pauseAllTrading();
          return false;
      }
      return true;
  };

  const recordLiveTrade = (pnl) => {
      if (pnl < 0) {
          setDailyStats(prev => ({ ...prev, loss: prev.loss + Math.abs(pnl) }));
      }
      setDailyStats(prev => ({ ...prev, trades: prev.trades + 1 }));
  };

  return (
    <LiveTradingContext.Provider value={{
        liveAccounts,
        refreshAccounts,
        getActiveAccount,
        globalSafetySettings,
        setGlobalSafetySettings,
        pauseAllTrading,
        checkSafetyLimits,
        recordLiveTrade,
        dailyStats
    }}>
      {children}
    </LiveTradingContext.Provider>
  );
}

export function useLiveTrading() {
  const context = useContext(LiveTradingContext);
  if (!context) {
    throw new Error('useLiveTrading must be used within LiveTradingProvider');
  }
  return context;
}