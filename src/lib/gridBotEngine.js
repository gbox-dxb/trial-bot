import { v4 as uuidv4 } from 'uuid';
import { storage } from './storage';
import { orderPlacementService } from './orderPlacementService';
import { templateService } from './templateService';

export const gridBotEngine = {
  // Calculate Grid Levels based on parameters
  calculateGridLevels(currentPrice, lowerPrice, upperPrice, gridLines, mode = 'Arithmetic') {
    const levels = [];
    
    // Validate inputs
    if (!lowerPrice || !upperPrice || !gridLines || lowerPrice >= upperPrice) {
      return [];
    }

    // Arithmetic Grid (Equal price difference)
    if (mode === 'Arithmetic') {
      const priceDiff = (upperPrice - lowerPrice) / gridLines;
      for (let i = 0; i <= gridLines; i++) {
        levels.push(lowerPrice + (i * priceDiff));
      }
    } 
    // Geometric Grid (Equal percentage difference)
    else if (mode === 'Geometric') {
      const ratio = Math.pow(upperPrice / lowerPrice, 1 / gridLines);
      let level = lowerPrice;
      for (let i = 0; i <= gridLines; i++) {
        levels.push(level);
        level *= ratio;
      }
    }

    return levels;
  },

  getGridBots() {
    return storage.getGridBots() || [];
  },

  // Create a new Grid Bot
  createBot(config) {
    const { 
      pair, lowerPrice, upperPrice, gridLines, totalInvestment, 
      leverage, strategyDirection, mode,
      takeProfitEnabled, takeProfitType, takeProfitValue,
      stopLossEnabled, stopLossType, stopLossValue,
      validity, templateId, name
    } = config;

    const levels = this.calculateGridLevels(config.currentPrice, parseFloat(lowerPrice), parseFloat(upperPrice), parseInt(gridLines), mode);
    
    // Calculate Expiry
    let expiryTime = null;
    if (validity && validity !== 'Unlimited') {
        const now = Date.now();
        const durationMap = {
            '1h': 3600000,
            '4h': 14400000,
            '24h': 86400000,
            '7d': 604800000,
            '30d': 2592000000
        };
        if (durationMap[validity]) {
            expiryTime = now + durationMap[validity];
        }
    }

    // Create orders (simulation)
    const orders = levels.map((price, index) => {
      const type = price < config.currentPrice ? 'BUY' : 'SELL';
      return {
        id: uuidv4(),
        price,
        type,
        status: 'OPEN', 
        gridIndex: index,
        createdAt: Date.now()
      };
    });

    const bot = {
      id: uuidv4(),
      type: 'GRID',
      name: name || 'Grid Strategy',
      status: 'active', // active, stopped, expired, completed
      createdAt: Date.now(),
      expiryTime,
      validity,
      templateId,
      pair,
      strategyDirection,
      investment: parseFloat(totalInvestment),
      leverage: parseInt(leverage || 1),
      lowerPrice: parseFloat(lowerPrice),
      upperPrice: parseFloat(upperPrice),
      gridLines: parseInt(gridLines),
      mode,
      orders,
      
      // TP/SL Configuration
      takeProfitEnabled,
      takeProfitType, // 'Percent' or 'Price'
      takeProfitValue: parseFloat(takeProfitValue),
      stopLossEnabled,
      stopLossType, // 'Percent' or 'Price'
      stopLossValue: parseFloat(stopLossValue),

      totalPnL: 0,
      totalTrades: 0,
      runningTime: 0,
      currentPrice: config.currentPrice,
      marginRequired: parseFloat(totalInvestment),
      totalRequired: parseFloat(totalInvestment) * (parseInt(leverage || 1)),
      
      activeOrdersCount: 0,
      lastOrderTime: 0
    };

    // Save to storage
    const bots = storage.getGridBots() || [];
    storage.saveGridBots([bot, ...bots]);

    return bot;
  },

  updateBot(id, updates) {
    const bots = storage.getGridBots() || [];
    const index = bots.findIndex(b => b.id === id);
    if (index !== -1) {
        bots[index] = { ...bots[index], ...updates };
        storage.saveGridBots(bots);
        return bots[index];
    }
    return null;
  },
  
  // Method to check for price updates
  processPriceUpdate(bot, currentPrice) {
    return this.processTick(bot, currentPrice);
  },

  checkAndExpireBots() {
      const bots = storage.getGridBots() || [];
      let hasUpdates = false;
      const now = Date.now();

      const updatedBots = bots.map(bot => {
          if (bot.status === 'active' && bot.expiryTime && now >= bot.expiryTime) {
              hasUpdates = true;
              return { ...bot, status: 'expired' };
          }
          return bot;
      });

      if (hasUpdates) {
          storage.saveGridBots(updatedBots);
      }
      return updatedBots;
  },

  // Simulate tick update
  processTick(bot, currentPrice) {
    if (!bot || bot.status !== 'active') return bot;

    // Check Expiry
    if (bot.expiryTime && Date.now() > bot.expiryTime) {
        const expiredBot = { ...bot, status: 'expired' };
        storage.saveGridBots(storage.getGridBots().map(b => b.id === bot.id ? expiredBot : b));
        return expiredBot;
    }

    const orders = Array.isArray(bot.orders) ? bot.orders : [];
    let executedOrderCount = 0;
    
    const updatedOrders = orders.map(order => {
      if (order.status === 'OPEN') {
        const crossed = (order.type === 'BUY' && currentPrice <= order.price) ||
                        (order.type === 'SELL' && currentPrice >= order.price);
        
        if (crossed) {
          // *** Integration Point: Execute Order via orderPlacementService ***
          if (bot.templateId) {
             const template = templateService.getTemplateById(bot.templateId);
             
             if (template) {
                 try {
                     const executedOrder = orderPlacementService.placeOrderFromTemplate(
                        template,
                        'bot',
                        bot.id,
                        bot.name,
                        currentPrice,
                        { 
                           type: 'LIMIT', 
                           price: order.price, // Override price with Grid level
                           direction: order.type === 'BUY' ? 'Long' : 'Short'
                        }
                     );
                     
                     if (executedOrder) {
                       executedOrderCount++;
                       console.log(`[GridBot] Executed level ${order.gridIndex} at ${order.price}`);
                     }
                 } catch (e) {
                     console.error("[GridBot] Execution error:", e);
                 }
             }
          }
          
          return {
            ...order,
            status: 'FILLED',
            lastFilledAt: Date.now(),
            filledPrice: order.price
          };
        }
      } 
      return order;
    });

    if (executedOrderCount > 0) {
       const pnlChange = (Math.random() - 0.45) * (bot.investment * 0.001 * executedOrderCount); // Simple sim PnL
       
       const updatedBot = {
        ...bot,
        currentPrice,
        orders: updatedOrders,
        totalPnL: (bot.totalPnL || 0) + pnlChange,
        totalTrades: (bot.totalTrades || 0) + executedOrderCount,
        lastOrderTime: Date.now(),
        activeOrdersCount: (bot.activeOrdersCount || 0) + executedOrderCount
      };

      const bots = storage.getGridBots() || [];
      const newBots = bots.map(b => b.id === updatedBot.id ? updatedBot : b);
      storage.saveGridBots(newBots);
      
      return updatedBot;
    }

    return bot;
  },

  deleteBot(id) {
    storage.deleteGridBot(id);
  },

  toggleBot(id) {
    const bots = storage.getGridBots() || [];
    const bot = bots.find(b => b.id === id);
    if (bot) {
      bot.status = bot.status === 'active' ? 'stopped' : 'active';
      const newBots = bots.map(b => b.id === id ? bot : b);
      storage.saveGridBots(newBots);
    }
  }
};