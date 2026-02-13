/**
 * Liquidity Pools Detection Logic
 * Identifies Swing Highs/Lows and generates liquidity zones
 */

export const detectLiquidityPools = (candles, options = {}) => {
  const {
    lenL = 4, // Left lookback
    lenR = 4, // Right lookback (usually symmetric or matching)
    thresh = 1.0001,
    thresh_ = 0.9999
  } = options;

  if (!candles || candles.length < lenL + lenR + 1) {
    return { swingHighs: [], swingLows: [], zones: [] };
  }

  const swingHighs = [];
  const swingLows = [];
  const zones = [];

  // Iterate through candles, respecting margins for lookback/forward
  // Note: We might only be able to detect confirmed swings lenR bars ago
  for (let i = lenL; i < candles.length - lenR; i++) {
    const currentHigh = candles[i].high;
    const currentLow = candles[i].low;
    let isHigh = true;
    let isLow = true;

    // Check Neighbors
    // Check left
    for (let j = 1; j <= lenL; j++) {
      if (candles[i - j].high > currentHigh) isHigh = false;
      if (candles[i - j].low < currentLow) isLow = false;
    }
    // Check right
    for (let j = 1; j <= lenR; j++) {
      if (candles[i + j].high > currentHigh) isHigh = false;
      if (candles[i + j].low < currentLow) isLow = false;
    }

    // Explicit check to ensure it's strictly higher than at least one neighbor to avoid flat tops being all marked
    // For simplicity, we stick to the provided definition: max in range
    
    if (isHigh) {
      swingHighs.push({ index: i, price: currentHigh, time: candles[i].time });
      
      // Buy-side Liquidity Zone (BSLQ) - Stops above highs
      // Usually rendered in Red as it's a target for sell-side delivery or breakout
      zones.push({
        type: 'BSLQ',
        swingIndex: i,
        time: candles[i].time,
        lower: currentHigh,
        upper: currentHigh * thresh,
        color: 'rgba(255, 82, 82, 0.65)', // Red #ff5252
        fromIndex: i
      });
    }

    if (isLow) {
      swingLows.push({ index: i, price: currentLow, time: candles[i].time });

      // Sell-side Liquidity Zone (SSLQ) - Stops below lows
      // Usually rendered in Green
      zones.push({
        type: 'SSLQ',
        swingIndex: i,
        time: candles[i].time,
        upper: currentLow,
        lower: currentLow * thresh_,
        color: 'rgba(14, 243, 14, 0.65)', // Green #0ef30e
        fromIndex: i
      });
    }
  }

  return { swingHighs, swingLows, zones };
};