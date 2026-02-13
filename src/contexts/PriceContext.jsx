import React, { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { binanceWS } from '@/lib/binanceWebSocket';
import { binanceApi } from '@/lib/binanceApi';
import { TRADING_PAIRS } from '@/lib/mockData';

const PriceContext = createContext(null);

export function PriceProvider({ children }) {
  const [prices, setPrices] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [tickerData, setTickerData] = useState({});
  const hasSubscribed = useRef(false);
  const throttleRef = useRef(null);
  const pendingUpdates = useRef({});

  useEffect(() => {
    // Initial Connection
    binanceWS.connect();
    setConnectionStatus('Connecting...');

    // Poll connection status
    const statusInterval = setInterval(() => {
      setConnectionStatus(binanceWS.isConnected ? 'Connected' : 'Disconnected');
    }, 1000);

    // Subscribe to tickers for all supported pairs
    if (!hasSubscribed.current) {
      const streams = TRADING_PAIRS.map(pair => `${pair.toLowerCase()}@ticker`);
      setTimeout(() => {
        binanceWS.subscribe(streams);
        hasSubscribed.current = true;
      }, 1000); // Small delay to ensure connection
    }

    // Listen for updates with throttling to prevent render flooding
    const cleanupTicker = binanceWS.onTickerUpdate((ticker) => {
      pendingUpdates.current[ticker.symbol.toUpperCase()] = ticker;
      
      if (!throttleRef.current) {
        throttleRef.current = setTimeout(() => {
          const updates = pendingUpdates.current;
          pendingUpdates.current = {};
          throttleRef.current = null;

          setPrices(prev => {
            const next = { ...prev };
            Object.values(updates).forEach(t => {
              next[t.symbol.toUpperCase()] = t.price;
            });
            return next;
          });
          
          setTickerData(prev => {
            const next = { ...prev };
            Object.values(updates).forEach(t => {
              next[t.symbol.toUpperCase()] = t;
            });
            return next;
          });
        }, 100); // Throttle updates to max 10 per second
      }
    });

    // Fallback: Initial fetch for immediate data
    const fetchInitialData = async () => {
      for (const pair of TRADING_PAIRS) {
        const t = await binanceApi.fetch24hTicker(pair);
        if (t) {
          setPrices(prev => ({ ...prev, [pair]: t.lastPrice }));
          setTickerData(prev => ({ ...prev, [pair]: {
            symbol: pair,
            price: t.lastPrice,
            change: t.priceChange,
            percent: t.priceChangePercent,
            high: t.highPrice,
            low: t.lowPrice,
            volume: t.volume,
            bid: t.lastPrice, // Approx for REST
            ask: t.lastPrice  // Approx for REST
          }}));
        }
      }
    };
    fetchInitialData();

    return () => {
      clearInterval(statusInterval);
      cleanupTicker();
      if (throttleRef.current) clearTimeout(throttleRef.current);
      binanceWS.disconnect();
    };
  }, []);

  const useLivePrice = useCallback((symbol) => {
    return prices[symbol] || 0;
  }, [prices]);

  const useTicker = useCallback((symbol) => {
    return tickerData[symbol] || null;
  }, [tickerData]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    prices,
    tickerData,
    connectionStatus,
    useLivePrice,
    useTicker
  }), [prices, tickerData, connectionStatus, useLivePrice, useTicker]);

  return (
    <PriceContext.Provider value={value}>
      {children}
    </PriceContext.Provider>
  );
}

export function usePrice() {
  const context = useContext(PriceContext);
  if (!context) {
    throw new Error('usePrice must be used within PriceProvider');
  }
  return context;
}