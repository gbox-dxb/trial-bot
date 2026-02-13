// RSI Calculation
export function calculateRSI(candles, period = 14) {
  if (candles.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  for (let i = candles.length - period; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change > 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Momentum Calculation
export function calculateMomentum(candles, lookback = 20) {
  if (candles.length < lookback) return null;

  const currentPrice = candles[candles.length - 1].close;
  const pastPrice = candles[candles.length - lookback].close;
  return ((currentPrice - pastPrice) / pastPrice) * 100;
}

// Detect 3 consecutive candles
export function detectConsecutiveCandles(candles, count = 3) {
  if (candles.length < count) return null;

  const recentCandles = candles.slice(-count);
  const allGreen = recentCandles.every(c => c.close > c.open);
  const allRed = recentCandles.every(c => c.close < c.open);

  if (allGreen) return 'LONG';
  if (allRed) return 'SHORT';
  return null;
}

// Calculate grid levels
export function calculateGridLevels(lowerPrice, upperPrice, gridCount) {
  const levels = [];
  const step = (upperPrice - lowerPrice) / (gridCount - 1);
  
  for (let i = 0; i < gridCount; i++) {
    levels.push(lowerPrice + step * i);
  }
  
  return levels;
}

// Calculate DCA safety order levels
export function calculateDCASafetyOrders(entryPrice, deviation, maxOrders) {
  const levels = [];
  
  for (let i = 1; i <= maxOrders; i++) {
    const level = entryPrice * (1 - (deviation / 100) * i);
    levels.push(level);
  }
  
  return levels;
}

// Calculate P/L
export function calculatePnL(side, entryPrice, currentPrice, size, leverage) {
  const priceChange = side === 'LONG' 
    ? currentPrice - entryPrice 
    : entryPrice - currentPrice;
  
  const pnl = (priceChange / entryPrice) * size * entryPrice * leverage;
  const roi = (priceChange / entryPrice) * leverage * 100;
  
  return { pnl, roi };
}

// Check if position should close (TP/SL)
export function shouldClosePosition(position, currentPrice, tp, sl) {
  const { side, entryPrice, leverage } = position;
  const priceChangePercent = side === 'LONG'
    ? ((currentPrice - entryPrice) / entryPrice) * 100
    : ((entryPrice - currentPrice) / entryPrice) * 100;

  const leveragedChange = priceChangePercent * leverage;

  if (tp && leveragedChange >= tp) return { shouldClose: true, reason: 'TP' };
  if (sl && leveragedChange <= -sl) return { shouldClose: true, reason: 'SL' };
  
  return { shouldClose: false, reason: null };
}

// Signal cooldown check
const signalCooldowns = new Map();

export function checkCooldown(botId, cooldownSeconds) {
  const lastSignal = signalCooldowns.get(botId);
  const now = Date.now();
  
  if (lastSignal && (now - lastSignal) < cooldownSeconds * 1000) {
    return false;
  }
  
  signalCooldowns.set(botId, now);
  return true;
}

// Generate trade ID
export function generateTradeId() {
  return `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Generate position ID
export function generatePositionId() {
  return `pos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}