export const technicalIndicators = {
  calculateRSI(candles, period = 14) {
    if (!candles || candles.length < period + 1) return [];

    const rsiValues = [];
    let gains = 0;
    let losses = 0;

    // Calculate initial average gain/loss
    for (let i = 1; i <= period; i++) {
      const change = candles[i].close - candles[i - 1].close;
      if (change > 0) gains += change;
      else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Push first RSI
    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    let rsi = 100 - (100 / (1 + rs));
    rsiValues.push({ time: candles[period].time, value: rsi });

    // Calculate subsequent values using Wilder's smoothing
    for (let i = period + 1; i < candles.length; i++) {
      const change = candles[i].close - candles[i - 1].close;
      let gain = change > 0 ? change : 0;
      let loss = change < 0 ? -change : 0;

      avgGain = ((avgGain * (period - 1)) + gain) / period;
      avgLoss = ((avgLoss * (period - 1)) + loss) / period;

      rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi = 100 - (100 / (1 + rs));

      rsiValues.push({ time: candles[i].time, value: rsi });
    }

    return rsiValues;
  },

  calculateBollingerBands(candles, period = 20, stdDevMultiplier = 2) {
    if (!candles || candles.length < period) return { upper: [], middle: [], lower: [] };

    const upper = [];
    const middle = [];
    const lower = [];

    for (let i = period - 1; i < candles.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += candles[i - j].close;
      }
      const sma = sum / period;

      let sumSquaredDiffs = 0;
      for (let j = 0; j < period; j++) {
        sumSquaredDiffs += Math.pow(candles[i - j].close - sma, 2);
      }
      const variance = sumSquaredDiffs / period;
      const stdDev = Math.sqrt(variance);

      middle.push({ time: candles[i].time, value: sma });
      upper.push({ time: candles[i].time, value: sma + (stdDev * stdDevMultiplier) });
      lower.push({ time: candles[i].time, value: sma - (stdDev * stdDevMultiplier) });
    }

    return { upper, middle, lower };
  },

  calculateMomentum(candles, lookback = 20) {
    if (!candles || candles.length < lookback) return [];
    
    const momentum = [];
    
    for (let i = lookback; i < candles.length; i++) {
      const currentPrice = candles[i].close;
      const pastPrice = candles[i - lookback].close;
      const value = ((currentPrice - pastPrice) / pastPrice) * 100;
      
      momentum.push({ time: candles[i].time, value });
    }
    
    return momentum;
  },

  calculateMACD(candles, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (!candles || candles.length < slowPeriod) return { macd: [], signal: [], histogram: [] };

    // Helper for EMA
    const calculateEMA = (data, period) => {
      const k = 2 / (period + 1);
      const emaData = [];
      let ema = data[0]; // Simple seeding with first value
      emaData.push(ema);

      for (let i = 1; i < data.length; i++) {
        ema = (data[i] * k) + (ema * (1 - k));
        emaData.push(ema);
      }
      return emaData;
    };

    const closes = candles.map(c => c.close);
    
    // We need to align arrays properly.
    // This is a simplified implementation.
    // For robust production use, consider a library like 'technicalindicators'
    
    const emaFast = calculateEMA(closes, fastPeriod);
    const emaSlow = calculateEMA(closes, slowPeriod);
    
    const macdLine = [];
    for(let i = 0; i < closes.length; i++) {
      macdLine.push(emaFast[i] - emaSlow[i]);
    }

    const signalLine = calculateEMA(macdLine, signalPeriod);
    
    const histogram = [];
    const macdSeries = [];
    const signalSeries = [];

    // Align timestamps
    for(let i = 0; i < candles.length; i++) {
        if (i >= slowPeriod + signalPeriod) { // Skip unstable initial periods
            macdSeries.push({ time: candles[i].time, value: macdLine[i] });
            signalSeries.push({ time: candles[i].time, value: signalLine[i] });
            histogram.push({ time: candles[i].time, value: macdLine[i] - signalLine[i] });
        }
    }

    return { macd: macdSeries, signal: signalSeries, histogram };
  }
};