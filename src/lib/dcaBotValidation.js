export const validateDCABot = (config, currentPrice, availableBalance) => {
  const errors = [];

  // Exchange
  if (!config.exchangeAccount) {
    errors.push("Please select an exchange account.");
  }

  // Pair
  if (!config.pair) {
    errors.push("Please select a trading pair.");
  }

  // Direction
  if (!['Long', 'Short', 'Both'].includes(config.direction)) {
    errors.push("Invalid direction selected.");
  }

  // Base Amount
  if (!config.baseAmount || config.baseAmount <= 0) {
    errors.push("Base amount must be greater than 0.");
  }

  // Leverage (Futures only)
  if (config.accountType === 'Futures') {
    if (!config.leverage || config.leverage < 1 || config.leverage > 125) {
      errors.push("Leverage must be between 1x and 125x.");
    }
  }

  // DCA Orders
  if (config.maxDCAOrders < 2 || config.maxDCAOrders > 50) {
    errors.push("Max DCA orders must be between 2 and 50.");
  }

  // Take Profit
  if (!config.takeProfitPercent || config.takeProfitPercent <= 0) {
    errors.push("Take Profit % must be greater than 0.");
  }

  // Custom DCA Deviations
  if (config.dcaMode === 'Custom' && config.customDCAOrders) {
    let lastDev = 0;
    for (let i = 0; i < config.customDCAOrders.length; i++) {
      const order = config.customDCAOrders[i];
      if (order.deviation <= lastDev) {
        errors.push(`DCA Order #${i + 1}: Deviation must be increasing.`);
      }
      if (order.size <= 0) {
        errors.push(`DCA Order #${i + 1}: Size must be greater than 0.`);
      }
      lastDev = order.deviation;
    }
  }

  // Required Investment vs Balance
  // Simple calculation: base + (sum of safety orders) / leverage
  let totalInvestment = config.baseAmount;
  if (config.dcaMode === 'Auto') {
    // Approx sum for auto (simplified for validation, accurate calc happens in form)
    // base + base * maxDCAOrders * multiplier
    // This is a rough check, the form should provide the exact 'required' value to check against
    if (config.requiredInvestment && config.requiredInvestment > availableBalance) {
         errors.push(`Insufficient balance. Required: $${config.requiredInvestment.toFixed(2)}, Available: $${availableBalance.toFixed(2)}`);
    }
  } else if (config.dcaMode === 'Custom') {
     // Check calculated required from form
     if (config.requiredInvestment && config.requiredInvestment > availableBalance) {
         errors.push(`Insufficient balance. Required: $${config.requiredInvestment.toFixed(2)}, Available: $${availableBalance.toFixed(2)}`);
    }
  }

  return errors;
};