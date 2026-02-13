// Utility library for detecting candlestick patterns
// Each function accepts an array of candles (OHLCV) and checks the *last* completed pattern
// Returns { name, confidence, signal, candles_involved } or null

export const PATTERN_TYPES = {
  BULLISH: ['Hammer', 'Morning Star', 'Piercing Line', 'Engulfing Bullish'],
  BEARISH: ['Hanging Man', 'Shooting Star', 'Evening Star', 'Dark Cloud Cover', 'Engulfing Bearish']
};

const getBody = (c) => Math.abs(c.close - c.open);
const isGreen = (c) => c.close > c.open;
const isRed = (c) => c.close < c.open;
const getUpperWick = (c) => c.high - Math.max(c.open, c.close);
const getLowerWick = (c) => Math.min(c.open, c.close) - c.low;

export const candlePatternDetection = {
  
  detectAll(candles) {
    if (!candles || candles.length < 3) return null;
    
    // Check all implementations
    const checks = [
      this.isHammer,
      this.isHangingMan,
      this.isShootingStar,
      this.isEngulfing,
      this.isMorningStar,
      this.isEveningStar,
      this.isPiercingLine,
      this.isDarkCloudCover
    ];

    const patterns = [];
    checks.forEach(check => {
      const result = check(candles);
      if (result) patterns.push(result);
    });

    // Return the one with highest confidence, or just the first found
    return patterns.sort((a, b) => b.confidence - a.confidence)[0] || null;
  },

  calculatePatternConfidence(patternName, candles) {
    // Simplified confidence scoring logic
    const baseConfidence = 60;
    const randomFactor = Math.floor(Math.random() * 30); // Simulate varying strength
    return Math.min(99, baseConfidence + randomFactor);
  },

  // --- Single Candle Patterns ---

  isHammer(candles) {
    const c = candles[candles.length - 1];
    const body = getBody(c);
    const lowerWick = getLowerWick(c);
    const upperWick = getUpperWick(c);

    // Small body, long lower wick (2x body), small/no upper wick
    if (lowerWick > body * 2 && upperWick < body * 0.5) {
      // Must occur in downtrend (simplified check: prev candle was red)
      const prev = candles[candles.length - 2];
      if (isRed(prev)) {
        return {
          name: 'Hammer',
          confidence: 75,
          signal: 'BUY',
          candles_involved: 1
        };
      }
    }
    return null;
  },

  isHangingMan(candles) {
    const c = candles[candles.length - 1];
    const body = getBody(c);
    const lowerWick = getLowerWick(c);
    const upperWick = getUpperWick(c);

    // Same shape as Hammer but in uptrend
    if (lowerWick > body * 2 && upperWick < body * 0.5) {
      const prev = candles[candles.length - 2];
      if (isGreen(prev)) {
        return {
          name: 'Hanging Man',
          confidence: 65,
          signal: 'SELL',
          candles_involved: 1
        };
      }
    }
    return null;
  },

  isShootingStar(candles) {
    const c = candles[candles.length - 1];
    const body = getBody(c);
    const lowerWick = getLowerWick(c);
    const upperWick = getUpperWick(c);

    // Small body, long upper wick (2x body), small/no lower wick, in uptrend
    if (upperWick > body * 2 && lowerWick < body * 0.5) {
      const prev = candles[candles.length - 2];
      if (isGreen(prev)) {
        return {
          name: 'Shooting Star',
          confidence: 80,
          signal: 'SELL',
          candles_involved: 1
        };
      }
    }
    return null;
  },

  // --- Two Candle Patterns ---

  isEngulfing(candles) {
    const curr = candles[candles.length - 1];
    const prev = candles[candles.length - 2];

    // Bullish Engulfing: Prev Red, Curr Green, Curr body engulfs Prev body
    if (isRed(prev) && isGreen(curr)) {
       if (curr.close > prev.open && curr.open < prev.close) {
         return { name: 'Engulfing Bullish', confidence: 85, signal: 'BUY', candles_involved: 2 };
       }
    }

    // Bearish Engulfing: Prev Green, Curr Red, Curr body engulfs Prev body
    if (isGreen(prev) && isRed(curr)) {
       if (curr.close < prev.open && curr.open > prev.close) {
         return { name: 'Engulfing Bearish', confidence: 85, signal: 'SELL', candles_involved: 2 };
       }
    }
    return null;
  },

  isPiercingLine(candles) {
    const curr = candles[candles.length - 1];
    const prev = candles[candles.length - 2];

    // Downtrend (Red), then Green opening below low, closing above midpoint of Red
    if (isRed(prev) && isGreen(curr)) {
       const midpoint = prev.close + (prev.open - prev.close) / 2;
       if (curr.open < prev.low && curr.close > midpoint && curr.close < prev.open) {
          return { name: 'Piercing Line', confidence: 70, signal: 'BUY', candles_involved: 2 };
       }
    }
    return null;
  },

  isDarkCloudCover(candles) {
    const curr = candles[candles.length - 1];
    const prev = candles[candles.length - 2];

    // Uptrend (Green), then Red opening above high, closing below midpoint of Green
    if (isGreen(prev) && isRed(curr)) {
       const midpoint = prev.open + (prev.close - prev.open) / 2;
       if (curr.open > prev.high && curr.close < midpoint && curr.close > prev.open) {
          return { name: 'Dark Cloud Cover', confidence: 70, signal: 'SELL', candles_involved: 2 };
       }
    }
    return null;
  },

  // --- Three Candle Patterns ---

  isMorningStar(candles) {
    if (candles.length < 3) return null;
    const c1 = candles[candles.length - 3]; // Long Red
    const c2 = candles[candles.length - 2]; // Small body (gap down ideally)
    const c3 = candles[candles.length - 1]; // Long Green

    if (isRed(c1) && isGreen(c3)) {
       // Check bodies sizes roughly
       if (getBody(c1) > getBody(c2) * 2 && getBody(c3) > getBody(c2) * 2) {
          // c3 closes well into c1
          if (c3.close > (c1.close + getBody(c1)/2)) {
              return { name: 'Morning Star', confidence: 90, signal: 'BUY', candles_involved: 3 };
          }
       }
    }
    return null;
  },

  isEveningStar(candles) {
    if (candles.length < 3) return null;
    const c1 = candles[candles.length - 3]; // Long Green
    const c2 = candles[candles.length - 2]; // Small body
    const c3 = candles[candles.length - 1]; // Long Red

    if (isGreen(c1) && isRed(c3)) {
       if (getBody(c1) > getBody(c2) * 2 && getBody(c3) > getBody(c2) * 2) {
          if (c3.close < (c1.open + getBody(c1)/2)) {
              return { name: 'Evening Star', confidence: 90, signal: 'SELL', candles_involved: 3 };
          }
       }
    }
    return null;
  }
};