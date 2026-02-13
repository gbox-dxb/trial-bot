import { TRADING_PAIRS } from './mockData';

const BASE_URL = 'https://api.binance.com/api/v3';

// Cache to prevent excessive API calls
const cache = {
  klines: {},
  ticker: {},
  lastFetch: {}
};

const CACHE_DURATION = 2000; // 2 seconds for ticker
const KLINE_CACHE_DURATION = 10000; // 10 seconds for historical candles

export const binanceApi = {
  // Fetch historical candlestick data
  async fetchCandleData(symbol, interval = '15m', limit = 200) {
    const cacheKey = `klines-${symbol}-${interval}-${limit}`;
    const now = Date.now();
    
    if (cache.klines[cacheKey] && cache.lastFetch[cacheKey] && (now - cache.lastFetch[cacheKey] < KLINE_CACHE_DURATION)) {
      return cache.klines[cacheKey];
    }

    try {
      // Clean symbol (remove potential formatting)
      const cleanSymbol = symbol.toUpperCase().replace('/', '');
      
      const response = await fetch(
        `${BASE_URL}/klines?symbol=${cleanSymbol}&interval=${interval}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      // Parse Binance format [time, open, high, low, close, volume, ...]
      const candles = data.map(d => ({
        time: d[0] / 1000, // Lightweight charts uses seconds
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
        volume: parseFloat(d[5])
      }));
      
      cache.klines[cacheKey] = candles;
      cache.lastFetch[cacheKey] = now;
      
      return candles;
    } catch (error) {
      console.error('Binance API Error:', error);
      return null;
    }
  },

  // Fetch 24h ticker data
  async fetch24hTicker(symbol) {
    const cleanSymbol = symbol.toUpperCase().replace('/', '');
    const cacheKey = `ticker-${cleanSymbol}`;
    const now = Date.now();

    if (cache.ticker[cacheKey] && cache.lastFetch[cacheKey] && (now - cache.lastFetch[cacheKey] < CACHE_DURATION)) {
      return cache.ticker[cacheKey];
    }

    try {
      const response = await fetch(`${BASE_URL}/ticker/24hr?symbol=${cleanSymbol}`);
      if (!response.ok) throw new Error('Failed to fetch ticker');
      
      const data = await response.json();
      
      const ticker = {
        symbol: data.symbol,
        priceChange: parseFloat(data.priceChange),
        priceChangePercent: parseFloat(data.priceChangePercent),
        lastPrice: parseFloat(data.lastPrice),
        highPrice: parseFloat(data.highPrice),
        lowPrice: parseFloat(data.lowPrice),
        volume: parseFloat(data.volume),
        quoteVolume: parseFloat(data.quoteVolume)
      };

      cache.ticker[cacheKey] = ticker;
      cache.lastFetch[cacheKey] = now;
      
      return ticker;
    } catch (error) {
      console.error('Ticker Fetch Error:', error);
      return null;
    }
  },

  async getSymbolInfo(symbol) {
    try {
      const cleanSymbol = symbol.toUpperCase().replace('/', '');
      const response = await fetch(`${BASE_URL}/exchangeInfo?symbol=${cleanSymbol}`);
      if (!response.ok) throw new Error('Failed to fetch symbol info');
      const data = await response.json();
      return data.symbols[0];
    } catch (error) {
      return null;
    }
  }
};