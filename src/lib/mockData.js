export const TRADING_PAIRS = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'BNBUSDT',
  'ADAUSDT',
  'XRPUSDT',
  'DOGEUSDT',
  'MATICUSDT',
  'LTCUSDT',
  'DOTUSDT',
  'AVAXUSDT',
  'LINKUSDT'
];

export const TIMEFRAMES = [
  { value: '1m', label: '1m' },
  { value: '3m', label: '3m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '30m', label: '30m' },
  { value: '1h', label: '1h' },
  { value: '4h', label: '4h' },
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' }
];

// Fallback generator for demo mode when API fails
export function generateMockCandles(symbol, timeframe, count = 200) {
  const basePrices = {
    BTCUSDT: 45000,
    ETHUSDT: 2500,
    SOLUSDT: 100,
    BNBUSDT: 320,
    ADAUSDT: 0.65,
    XRPUSDT: 0.55,
    DOGEUSDT: 0.08,
    MATICUSDT: 0.85,
    LTCUSDT: 85,
    DOTUSDT: 7.5,
    AVAXUSDT: 35,
    LINKUSDT: 15
  };

  const basePrice = basePrices[symbol] || 1000;
  const candles = [];
  let currentPrice = basePrice;
  const now = Date.now();
  // Rough MS approximation
  const map = { '1m': 60000, '15m': 900000, '1h': 3600000 }; 
  const timeframeMs = map[timeframe] || 3600000;

  for (let i = count - 1; i >= 0; i--) {
    // Ensure time is an integer (seconds) for lightweight-charts
    const time = Math.floor((now - i * timeframeMs) / 1000);
    const volatility = basePrice * 0.02;
    const change = (Math.random() - 0.5) * volatility;
    currentPrice += change;

    const open = currentPrice;
    const high = open + Math.random() * volatility * 0.5;
    const low = open - Math.random() * volatility * 0.5;
    const close = low + Math.random() * (high - low);
    const volume = Math.random() * 1000000;

    candles.push({ time, open, high, low, close, volume });
    currentPrice = close;
  }
  return candles;
}

export const demoExchange = {
  id: 'demo-exchange-1',
  name: 'MEXC Demo Account',
  type: 'Futures',
  balance: 10000,
  equity: 12450,
  margin: 2500,
  status: 'active',
  createdAt: Date.now() - 86400000 * 30
};

export const demoBots = [];
export const demoPositions = [];
export const demoTrades = [];
export const demoPnLHistory = [];