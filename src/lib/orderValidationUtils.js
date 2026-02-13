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
    
    // Validate TP/SL
    if (config.takeProfitEnabled) {
      config.pairs?.forEach(pair => {
        const tp = config.perCoinTP?.[pair] || config.takeProfit;
        if (!tp || tp.price <= 0) {
          errors.push(`Invalid take profit for ${pair}`);
        }
      });
    }
    
    if (config.stopLossEnabled) {
      config.pairs?.forEach(pair => {
        const sl = config.perCoinSL?.[pair] || config.stopLoss;
        if (!sl || sl.price <= 0) {
          errors.push(`Invalid stop loss for ${pair}`);
        }
      });
    }
    
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