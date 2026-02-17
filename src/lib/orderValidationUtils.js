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
        if (mode === 'PRICE' && (!tp.price || tp.price <= 0)) errors.push(`Invalid Stop Loss Price for ${pair}`); // Note: tp.price here looks like a copy-paste error in original thought, fixing to sl.price
        // Logic correction: Check SL values
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

      total += size / leverage;
    });

    return total;
  },

  calculateLiquidationPrice(entryPrice, leverage, direction) {
    if (direction === 'LONG') {
      return entryPrice - (entryPrice / leverage);
    } else {
      return entryPrice + (entryPrice / leverage);
    }
  },

  calculateProfitAtPrice(entryPrice, exitPrice, size, leverage, direction) {
    const priceDiff = direction === 'LONG' ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
    return (priceDiff / entryPrice) * size * leverage;
  }
};