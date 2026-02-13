import { TRADING_PAIRS } from './mockData';

export const validateOrder = (intent, exchangeBalance, currentPrices) => {
  const errors = [];
  const { symbol, quantity, price, side, leverage, mode } = intent;
  
  // 1. Symbol Validation
  if (!TRADING_PAIRS.includes(symbol)) {
    return { valid: false, error: `Invalid symbol: ${symbol}` };
  }

  // 2. Quantity/Step Size
  if (parseFloat(quantity) <= 0) {
    return { valid: false, error: 'Quantity must be positive' };
  }

  // 3. Min Notional (Simplified checks)
  const currentPrice = currentPrices[symbol] || price || 0;
  if (!currentPrice) {
    // If we can't get price, we can't fully validate notional, but proceed if price is in intent
    if (!price && intent.orderType !== 'Market') {
      return { valid: false, error: 'Current price unavailable for validation' }; 
    }
  }

  const notional = parseFloat(quantity) * (price || currentPrice);
  const minNotional = 5; // Conservative min for most exchanges (MEXC 5, Binance 10)
  
  if (notional < minNotional) {
    return { valid: false, error: `Order value too small (${notional.toFixed(2)}). Min: ${minNotional} USDT` };
  }

  // 4. Leverage
  if (intent.marketType === 'Futures') {
    if (leverage < 1 || leverage > 125) {
      return { valid: false, error: 'Leverage must be between 1x and 125x' };
    }
  }

  // 5. Balance Check (Skip for Demo to allow testing easily, or validate against demo balance)
  if (mode === 'Live') {
    // Assuming USDT-M Futures or Spot USDT pairs
    const requiredBalance = intent.marketType === 'Futures' 
      ? notional / leverage 
      : notional;

    if (exchangeBalance < requiredBalance) {
      return { 
        valid: false, 
        error: `Insufficient balance. Need ${requiredBalance.toFixed(2)} USDT, Have ${exchangeBalance.toFixed(2)} USDT` 
      };
    }
  }

  return { valid: true };
};