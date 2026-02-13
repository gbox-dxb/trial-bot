import { storage } from './storage';
import { templateService } from './templateService';
import { orderPlacementService } from './orderPlacementService';

export const calculateRSI = (candles, period = 14) => {
  if (!candles || candles.length < period + 1) return [];

  const rsiValues = [];
  let gains = 0;
  let losses = 0;

  // Simple Average for the first value
  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change > 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - (100 / (1 + rs));
  
  rsiValues.push({ time: candles[period].time, value: rsi });

  // Wilder's Smoothing for subsequent values
  for (let i = period + 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    avgGain = ((avgGain * (period - 1)) + gain) / period;
    avgLoss = ((avgLoss * (period - 1)) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - (100 / (1 + rs));

    rsiValues.push({ time: candles[i].time, value: rsi });
  }

  return rsiValues;
};

export const checkRSITrigger = (currentRSI, previousRSI, triggerType, triggerValue, triggerMode) => {
  if (currentRSI == null || triggerValue == null) return false;

  const curr = parseFloat(currentRSI);
  const prev = parseFloat(previousRSI);
  const threshold = parseFloat(triggerValue);
  
  if (isNaN(curr) || isNaN(threshold)) return false;

  if (triggerMode === 'Crosses') {
    if (isNaN(prev)) return false; 
    
    // Cross Mode: Detect when RSI crosses through the threshold
    if (triggerType === 'Oversold') {
      // Cross down: prev > thresh && curr <= thresh
      return prev > threshold && curr <= threshold;
    } else {
      // Cross up: prev < thresh && curr >= thresh
      return prev < threshold && curr >= threshold;
    }
  } else {
    // Touch Mode: Detect when RSI value equals or touches the threshold
    if (triggerType === 'Oversold') {
      return curr <= threshold;
    } else {
      return curr >= threshold;
    }
  }
};

export const getTradeDirection = (triggerType, manualDirection) => {
  if (manualDirection && manualDirection !== 'Auto') {
    return manualDirection;
  }
  return triggerType === 'Oversold' ? 'Long' : 'Short';
};

// --- Validation Utils ---

export const resetDailyTradeCount = (bot) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (bot.lastResetDate !== today) {
        return {
            needsReset: true,
            today: today
        };
    }
    return { needsReset: false };
};

export const validateCooldown = (bot, currentTime = Date.now()) => {
    if (!bot.cooldownSeconds || bot.cooldownSeconds <= 0) return { valid: true };
    const lastTime = bot.lastOrderTime || 0;
    const elapsed = (currentTime - lastTime) / 1000;
    
    if (elapsed < bot.cooldownSeconds) {
        return { 
            valid: false, 
            reason: `Cooldown active. ${Math.ceil(bot.cooldownSeconds - elapsed)}s remaining.` 
        };
    }
    return { valid: true };
};

export const validateOneTradeAtATime = (bot) => {
    if (!bot.oneTradeAtATime) return { valid: true };
    const activeOrders = storage.getActiveOrders().filter(o => o.botId === bot.id);
    if (activeOrders.length > 0) {
        return { 
            valid: false, 
            reason: `Active trade exists (${activeOrders.length} orders). One trade at a time enabled.` 
        };
    }
    return { valid: true };
};

export const validateMaxTradesPerDay = (bot) => {
    if (!bot.maxTradesPerDay || bot.maxTradesPerDay <= 0) return { valid: true };
    if ((bot.dailyTradeCount || 0) >= bot.maxTradesPerDay) {
        return { 
            valid: false, 
            reason: `Daily trade limit reached (${bot.dailyTradeCount}/${bot.maxTradesPerDay}).` 
        };
    }
    return { valid: true };
};

export const validateRSIBot = (config) => {
  const errors = {};
  if (!config.pair) errors.pair = "Pair is required";
  if (!config.templateId) errors.templateId = "Template is required";
  if (!config.rsiLength || config.rsiLength < 2) errors.rsiLength = "Invalid RSI length";
  if (!config.rsiValue || config.rsiValue < 1 || config.rsiValue > 99) errors.rsiValue = "Invalid RSI threshold";
  if (config.maxTradesPerDay < 1) errors.maxTradesPerDay = "At least 1 trade per day required";
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const updateBotStatus = (botId, status) => {
    const bots = storage.getRSIBots();
    const bot = bots.find(b => b.id === botId);
    if (bot) {
        if (bot.status !== status) {
            bot.status = status;
            if (status === 'Active') {
                bot.lastActiveTime = Date.now();
            }
            storage.saveRSIBots(bots.map(b => b.id === botId ? bot : b));
        }
        return bot;
    }
    return null;
};

export const executeRSIStrategy = (bot, currentPrice, currentRSI) => {
    const direction = getTradeDirection(bot.triggerType, bot.direction);
    console.log(`[RSIBot] Executing Strategy for ${bot.pair}. RSI: ${currentRSI}, Trigger: ${bot.rsiValue}`);

    if (bot.templateId) {
        const template = templateService.getTemplateById(bot.templateId);
        if (template) {
            try {
                const order = orderPlacementService.placeOrderFromTemplate(
                    template,
                    'bot',
                    bot.id,
                    `RSI Bot (${bot.pair})`,
                    currentPrice,
                    { direction: direction }
                );

                if (order) {
                    order.rsiMetadata = {
                        botId: bot.id,
                        botName: bot.name || `RSI Bot ${bot.pair}`,
                        triggerRSI: currentRSI,
                        triggerCondition: bot.triggerType,
                        threshold: bot.rsiValue,
                        triggerTime: Date.now()
                    };
                    
                    storage.updateActiveOrder(order.id, order);
                    updateBotStatus(bot.id, 'Active');
                    return order;
                }
            } catch (e) {
                console.error("[RSIBot] Execution failed:", e);
                return null;
            }
        }
    }
    return null;
};

export const deleteBot = (id) => {
  storage.deleteRSIBot(id);
};

export const rsiTradingLogic = {
  calculateRSI,
  checkRSITrigger,
  getTradeDirection,
  validateRSIBot,
  updateBotStatus,
  executeRSIStrategy,
  deleteBot,
  validateCooldown,
  validateOneTradeAtATime,
  validateMaxTradesPerDay,
  resetDailyTradeCount
};