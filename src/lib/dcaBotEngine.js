import { storage } from './storage';
import { generateMockCandles } from './mockData';
import { orderDraftService } from './orderDraftService';
import { orderPlacementService } from './orderPlacementService';
import { templateService } from './templateService';

const generateId = (prefix = 'dca') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const dcaBotEngine = {
  // Calculate simulation results for backtesting
  runBacktest(config, symbol) {
    // Generate 500 candles (approx 20 days of 1h data)
    const candles = generateMockCandles(symbol, '1h', 500);
    const results = {
        totalProfit: 0,
        trades: 0,
        winRate: 0,
        maxDrawdown: 0,
        bestTrade: 0,
        worstTrade: 0,
        roi: 0
    };
    return results; 
  },

  createBot(config, currentPrice) {
    // Generate initial levels
    let dcaOrders = [];
    
    if (config.dcaMode === 'Custom' && config.customDCAOrders) {
      dcaOrders = config.customDCAOrders.map(o => ({ ...o, filled: false, id: generateId('ord') }));
    } else {
      // Auto generate
      let currentDev = 0;
      let currentSize = config.baseAmount;
      const firstDev = config.priceDeviation || 1.0; 
      const stepDev = config.priceDeviation || 1.0;
      const sizeMult = config.orderSizeMultiplier || 1.0;
      const devMult = config.priceDevMultiplier || 1.0;

      for (let i = 0; i < config.maxDCAOrders; i++) {
        let dev = i === 0 ? firstDev : stepDev * Math.pow(devMult, i); 
        if (i === 0) currentDev = dev;
        else currentDev += dev;

        currentSize = i === 0 ? config.baseAmount : currentSize * sizeMult;
        
        dcaOrders.push({
          id: generateId('ord'),
          orderNumber: i + 1,
          deviation: currentDev,
          size: currentSize,
          filled: false
        });
      }
    }

    const botId = generateId('bot');

    const bot = {
      id: botId,
      createdAt: Date.now(),
      status: 'active',
      entryPrice: currentPrice,
      averagePrice: currentPrice,
      totalInvested: config.baseAmount,
      totalSizeCoins: (config.baseAmount * (config.leverage || 1)) / currentPrice,
      dcaOrdersFilled: 0,
      currentPrice: currentPrice,
      pnl: 0,
      pnlPercent: 0,
      levels: dcaOrders, // Store planned levels
      ordersExecuted: 0,
      pendingOrders: dcaOrders.length,
      nextOrderTime: Date.now(), // Immediate or scheduled
      activeOrdersCount: 0,
      ...config
    };

    const bots = storage.getDCABots();
    storage.saveDCABots([...bots, bot]);
    return bot;
  },

  createDCAFromTemplate(template, currentPrice) {
      if (!template || !template.config) throw new Error("Invalid template");
      
      const config = {
          ...template.config,
          pair: template.pair || template.config.pair || 'BTCUSDT',
          templateId: template.id
      };
      
      return this.createBot(config, currentPrice);
  },
  
  updateBotSettings(id, newConfig) {
      const bots = storage.getDCABots();
      const index = bots.findIndex(b => b.id === id);
      if (index !== -1) {
          const oldBot = bots[index];
          const updated = { ...oldBot, ...newConfig };
          bots[index] = updated;
          storage.saveDCABots(bots);
          return updated;
      }
      return null;
  },

  updateDCAStatus(id, status) {
      const bots = storage.getDCABots();
      const bot = bots.find(b => b.id === id);
      if (bot) {
          bot.status = status;
          if (status === 'cancelled') {
             bot.closedAt = Date.now();
          }
          this.updateBot(bot);
      }
  },

  checkTrigger(bot, currentPrice) {
    if (bot.status !== 'active') return null;

    let updated = false;
    let newBotState = { ...bot, currentPrice };

    // 1. Check DCA Orders (Entry averaging)
    const unfilled = newBotState.levels.filter(lvl => !lvl.filled);
    
    for (const order of unfilled) {
      let triggerPrice;
      if (newBotState.direction === 'Long') {
        triggerPrice = newBotState.entryPrice * (1 - order.deviation / 100);
        if (currentPrice <= triggerPrice) {
           newBotState = this.executeDCAFill(newBotState, order, currentPrice);
           updated = true;
        }
      } else { // Short
        triggerPrice = newBotState.entryPrice * (1 + order.deviation / 100);
        if (currentPrice >= triggerPrice) {
           newBotState = this.executeDCAFill(newBotState, order, currentPrice);
           updated = true;
        }
      }
    }

    // 2. Check Take Profit
    let tpPrice;
    if (newBotState.direction === 'Long') {
      tpPrice = newBotState.averagePrice * (1 + newBotState.takeProfitPercent / 100);
      if (currentPrice >= tpPrice) {
        return this.closePosition(newBotState, currentPrice, 'Take Profit');
      }
    } else {
      tpPrice = newBotState.averagePrice * (1 - newBotState.takeProfitPercent / 100);
      if (currentPrice <= tpPrice) {
        return this.closePosition(newBotState, currentPrice, 'Take Profit');
      }
    }

    // 3. Update PnL
    const leverage = newBotState.leverage || 1;
    const diff = currentPrice - newBotState.averagePrice;
    const rawPnL = newBotState.direction === 'Long' ? diff : -diff;
    const totalVal = rawPnL * newBotState.totalSizeCoins;
    
    newBotState.pnl = totalVal;
    const invest = (newBotState.averagePrice * newBotState.totalSizeCoins) / leverage;
    newBotState.pnlPercent = (totalVal / invest) * 100;

    if (updated) {
      this.updateBot(newBotState);
    }
    
    return updated ? newBotState : null;
  },

  executeDCAFill(bot, order, price) {
    // *** Integration Point: Execute Order via orderPlacementService ***
    if (bot.templateId) {
        const template = templateService.getTemplateById(bot.templateId);
        if (template) {
            try {
                orderPlacementService.placeOrderFromTemplate(
                    template,
                    'bot',
                    bot.id,
                    `DCA Bot (${bot.pair})`,
                    price, 
                    { 
                       type: 'MARKET',
                       price: price, // Fill at current market price
                       direction: bot.direction,
                       size: order.size // Use the calculated DCA step size
                    }
                );
            } catch (e) {
                console.error("[DCABot] Execution failed:", e);
            }
        }
    }

    const leverage = bot.leverage || 1;
    const newSizeCoins = (order.size * leverage) / price;
    
    const oldTotalCoins = bot.totalSizeCoins;
    const newTotalCoins = oldTotalCoins + newSizeCoins;
    const newAvg = ((bot.averagePrice * oldTotalCoins) + (price * newSizeCoins)) / newTotalCoins;
    const newLevels = bot.levels.map(lvl => lvl.id === order.id ? { ...lvl, filled: true, fillPrice: price } : lvl);

    return {
      ...bot,
      averagePrice: newAvg,
      totalSizeCoins: newTotalCoins,
      totalInvested: bot.totalInvested + order.size,
      dcaOrdersFilled: bot.dcaOrdersFilled + 1,
      ordersExecuted: (bot.ordersExecuted || 0) + 1,
      pendingOrders: (bot.pendingOrders || 1) - 1,
      activeOrdersCount: (bot.activeOrdersCount || 0) + 1,
      levels: newLevels
    };
  },

  closePosition(bot, price, reason) {
    const closedBot = {
      ...bot,
      status: 'closed',
      closePrice: price,
      closeReason: reason,
      closedAt: Date.now()
    };
    
    // Create trade record
    const trade = {
      id: generateId('trd'),
      botId: bot.id,
      pair: bot.pair,
      direction: bot.direction,
      entryPrice: bot.averagePrice,
      exitPrice: price,
      pnl: bot.pnl, 
      pnlPercent: bot.pnlPercent,
      reason: reason,
      timestamp: Date.now()
    };
    
    const diff = price - bot.averagePrice;
    const rawPnL = bot.direction === 'Long' ? diff : -diff;
    trade.pnl = rawPnL * bot.totalSizeCoins;
    const leverage = bot.leverage || 1;
    const invest = (bot.averagePrice * bot.totalSizeCoins) / leverage;
    trade.pnlPercent = (trade.pnl / invest) * 100;

    const trades = storage.getDCATrades();
    storage.saveDCATrades([trade, ...trades]);

    this.updateBot(closedBot);
    return closedBot;
  },

  updateBot(updatedBot) {
    const bots = storage.getDCABots();
    const newBots = bots.map(b => b.id === updatedBot.id ? updatedBot : b);
    storage.saveDCABots(newBots);
  },
  
  toggleBot(id) {
      const bots = storage.getDCABots();
      const bot = bots.find(b => b.id === id);
      if (bot && bot.status !== 'closed') {
          bot.status = bot.status === 'active' ? 'stopped' : 'active';
          this.updateBot(bot);
      }
  },

  deleteBot(id) {
    storage.deleteDCABot(id);
  }
};