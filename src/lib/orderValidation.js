import { TRADING_PAIRS } from './mockData';

export const validateOrder = (intent, exchangeBalance, currentPrices) => {
  const { symbol, quantity, price, leverage, mode, marketType, orderType } = intent;

  // 1. Symbol Validation
  if (!TRADING_PAIRS.includes(symbol)) {
    return { valid: false, error: `Invalid symbol: ${symbol}` };
  }

  // 2. Quantity/Step Size
  const quantityNum = parseFloat(quantity);
  if (isNaN(quantityNum) || quantityNum <= 0) {
    return { valid: false, error: "Parameter 'quantity' is invalid" };
  }

  // 3. Price & Min Notional Checks
  const currentPrice = currentPrices?.[symbol] || price || 0;
  if (currentPrice <= 0 && orderType === 'Market') {
    return { valid: false, error: 'Current price unavailable for validation' };
  }

  const entryPrice = price || currentPrice;
  const notional = quantityNum * entryPrice;
  const minNotional = 5; // Conservative min for most exchanges

  if (notional < minNotional) {
    return { valid: false, error: `Order value too small ($${notional.toFixed(2)}). Min: ${minNotional} USDT` };
  }

  // 4. Leverage
  if (marketType === 'Futures') {
    if (isNaN(leverage) || leverage < 1 || leverage > 200) {
      return { valid: false, error: 'Invalid leverage value' };
    }
  }

  // 5. Balance Check
  const balanceToCheck = exchangeBalance || (mode === 'Live' ? 0 : 100000);
  const requiredBalance = marketType === 'Futures' ? notional / leverage : notional;

  if (balanceToCheck < requiredBalance) {
    return {
      valid: false,
      error: 'Account has insufficient balance for requested action'
    };
  }

  return { valid: true };
};