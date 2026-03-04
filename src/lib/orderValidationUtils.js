export const orderValidationUtils = {
  validateOrderConfig(config, balance, prices) {
    const errors = [];

    if (!config.accountId) {
      errors.push('Exchange account is required');
    }

    if (!config.pairs || config.pairs.length === 0) {
      errors.push('At least one trading pair is required');
    }

    if (!config.baseOrderSize || config.baseOrderSize <= 0) {
      errors.push('Order size must be greater than 0');
    }

    // Validate leverage
    config.pairs?.forEach(pair => {
      const leverage = config.perCoinLeverage?.[pair] || config.leverage;
      if (leverage < 1 || leverage > 200) {
        errors.push(`Invalid leverage for ${pair}: ${leverage}`);
      }
    });

    // Validate margin requirement
    const totalMargin = this.calculateTotalMargin(config, prices);
    if (totalMargin > balance) {
      errors.push(`Insufficient balance. Required: ${totalMargin.toFixed(2)} USDT, Available: ${balance.toFixed(2)} USDT`);
    }

    // Validate TP/SL - REQUIRED
    // We enforce TP/SL presence. The 'enabled' flag is now default true, but we check values directly.

    // Check Take Profit
    config.pairs?.forEach(pair => {
      const tp = config.perCoinTP?.[pair] || config.takeProfit;
      const mode = config.takeProfitMode || 'PROFIT'; // Default to PROFIT if undefined

      if (!tp) {
        errors.push(`Take Profit is required for ${pair}`);
      } else {
        if (mode === 'PRICE' && (!tp.price || tp.price <= 0)) errors.push(`Invalid Take Profit Price for ${pair}`);
        if (mode === 'PERCENT' && (!tp.percent || tp.percent <= 0)) errors.push(`Invalid Take Profit percentage for ${pair}`);
        if (mode === 'PROFIT' && (!tp.profit || tp.profit <= 0)) errors.push(`Invalid Take Profit value for ${pair}`);
      }
    });

    // Check Stop Loss
    config.pairs?.forEach(pair => {
      const sl = config.perCoinSL?.[pair] || config.stopLoss;
      const mode = config.stopLossMode || 'PROFIT';

      if (!sl) {
        errors.push(`Stop Loss is required for ${pair}`);
      } else {
        if (mode === 'PRICE' && (!sl.price || sl.price <= 0)) errors.push(`Invalid Stop Loss Price for ${pair}`);
        if (mode === 'PERCENT' && (!sl.percent || sl.percent <= 0)) errors.push(`Invalid Stop Loss percentage for ${pair}`);
        if (mode === 'LOSS' && (!sl.loss || sl.loss <= 0)) errors.push(`Invalid Stop Loss value for ${pair}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  },

  calculateTotalMargin(config, prices) {
    let total = 0;

    config.pairs?.forEach(pair => {
      const price = config.perCoinPrice?.[pair] || config.entryPrice || prices[pair] || 0;
      const size = config.perCoinSize?.[pair] || (config.baseOrderSize / config.pairs.length);
      const leverage = config.perCoinLeverage?.[pair] || config.leverage || 1;

      if (price > 0 && leverage > 0) {
        total += size / leverage;
      }
    });

    return total;
  },

  calculateLiquidationPrice(entryPrice, leverage, direction) {
    const dir = this.normalizeSide(direction);
    if (dir === 'BUY') {
      return entryPrice - (entryPrice / leverage);
    } else {
      return entryPrice + (entryPrice / leverage);
    }
  },

  calculateProfitAtPrice(entryPrice, exitPrice, size, leverage, direction) {
    const dir = this.normalizeSide(direction);
    const priceDiff = dir === 'BUY' ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
    return (priceDiff / entryPrice) * size * leverage;
  },

  /**
   * Robust Side Normalization
   * Maps UI values (Long, Short, BUY, SELL etc) to exchange standard BUY/SELL
   */
  normalizeSide(side) {
    if (!side) return 'BUY';
    const s = side.toString().toUpperCase();
    if (s === 'LONG' || s === 'BUY') return 'BUY';
    if (s === 'SHORT' || s === 'SELL') return 'SELL';
    return 'BUY'; // Default fallback
  },

  /**
   * Get symbol precision rules
   * In a real app this might come from exchange info, here we use defaults
   */
  getQuantityPrecision(symbol) {
    // High-value assets usually have lower decimal precision for quantity
    if (symbol === 'BTCUSDT') return 3;
    if (symbol === 'ETHUSDT') return 3;
    if (symbol === 'SOLUSDT') return 2;
    // Lower value assets might have more
    return 3;
  },

  /**
   * Safely format quantity based on precision rules
   */
  formatQuantity(quantity, symbol) {
    if (isNaN(quantity) || !isFinite(quantity) || quantity <= 0) return 0;
    const precision = this.getQuantityPrecision(symbol);

    // Use floor to be safe on margin/notional requirements
    const factor = Math.pow(10, precision);
    return Math.floor(quantity * factor) / factor;
  },

  /**
   * Single order validation intent
   * Returns { valid: boolean, error: string }
   */
  validateOrderIntent(intent, runningBalance, currentPrices) {
    const { symbol, side, quantity, price, leverage, orderType } = intent;

    // 1. Basic Side Check
    const normalizedSide = this.normalizeSide(side);
    if (!['BUY', 'SELL'].includes(normalizedSide)) {
      return { valid: false, error: 'Invalid side mapping' };
    }

    // 2. Quantity Checks
    if (isNaN(quantity) || quantity <= 0) {
      return { valid: false, error: 'Parameter quantity is invalid' };
    }

    // 3. Leverage Checks
    if (isNaN(leverage) || leverage <= 0) {
      return { valid: false, error: 'Leverage must be greater than 0' };
    }

    // 4. Price/Notional
    const currentPrice = currentPrices[symbol] || price || 0;
    if (currentPrice <= 0 && orderType === 'Market') {
      return { valid: false, error: 'Price unavailable' };
    }

    const entryPrice = price || currentPrice;
    const notional = quantity * entryPrice;
    const minNotional = 5.0; // Exchange min

    if (notional < minNotional) {
      return { valid: false, error: `Order too small ($${notional.toFixed(2)}). Min $${minNotional}` };
    }

    // 5. Margin vs Local Running Balance
    const margin = notional / leverage;
    // Buffer for fees/slippage (optional but safer)
    const requiredTotal = margin * 1.001;

    if (runningBalance < requiredTotal) {
      return { valid: false, error: 'Account has insufficient balance for requested action' };
    }

    return { valid: true };
  }
};
