export const validatePriceRange = (lower, higher) => {
  if (!lower || !higher) return ['Price range is required'];
  if (parseFloat(lower) >= parseFloat(higher)) {
    return ['Lower price must be less than higher price'];
  }
  return [];
};

export const validateGridCount = (grids) => {
  if (!grids) return ['Grid count is required'];
  const count = parseInt(grids);
  if (isNaN(count) || count < 2 || count > 100) {
    return ['Grid count must be between 2 and 100'];
  }
  return [];
};

export const validateInvestment = (investment, required) => {
  if (!investment) return ['Investment amount is required'];
  if (parseFloat(investment) < parseFloat(required)) {
    return [`Investment must be at least $${required}`];
  }
  return [];
};

export const validateBaseAmount = (base) => {
  if (!base || parseFloat(base) <= 0) {
    return ['Amount per trade must be greater than 0'];
  }
  return [];
};

export const validateGridBotConfig = (config) => {
  const errors = [];

  if (!config.pair) errors.push('Trading pair is required');
  
  errors.push(...validatePriceRange(config.lowerPrice, config.upperPrice));
  errors.push(...validateGridCount(config.gridCount));
  
  if (config.investmentAmount) {
     // We might need required amount here, but usually that's calculated dynamically. 
     // We'll skip strict comparison here if 'required' isn't passed, 
     // but the form should handle it.
     if (parseFloat(config.investmentAmount) <= 0) errors.push('Investment must be positive');
  } else {
     errors.push('Investment amount is required');
  }

  return errors;
};