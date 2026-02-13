import { storage } from './storage';
import { templateService } from './templateService';
import { orderPlacementService } from './orderPlacementService';

export const momentumBotEngine = {
  
  // Helper to notify UI components of changes
  notifyChange() {
    window.dispatchEvent(new Event('momentum-bots-updated'));
  },

  createBot(config) {
    const bots = storage.getMomentumBots();
    const newBot = {
      ...config,
      id: config.id || `mom-${Date.now()}`,
      status: 'Waiting',
      createdAt: Date.now(),
      
      // Tracking
      lastTriggerTime: 0,
      activeOrdersCount: 0,
      dailyTradeCount: 0,
      dailyTradeResetTime: new Date().setHours(24, 0, 0, 0), // Next midnight
      triggerDetails: null,

      // Default Safety Settings if not provided
      cooldown: config.cooldown ?? 0,
      cooldownUnit: config.cooldownUnit || 'Sec',
      oneTradeAtATime: config.oneTradeAtATime ?? false,
      maxTradesPerDay: config.maxTradesPerDay ?? 999
    };
    
    storage.saveMomentumBots([...bots, newBot]);
    this.notifyChange();
    return newBot;
  },

  updateBot(id, updates) {
    const bots = storage.getMomentumBots();
    const index = bots.findIndex(b => b.id === id);
    if (index !== -1) {
      bots[index] = { ...bots[index], ...updates };
      storage.saveMomentumBots(bots);
      console.log(`[Momentum Engine] Bot ${id} updated:`, updates);
      this.notifyChange();
    }
  },

  deleteBot(id) {
    storage.deleteMomentumBot(id);
    this.notifyChange();
  },

  // --- Safety Helpers ---

  resetDailyTradeCountIfNeeded(bot) {
    const now = Date.now();
    if (now >= bot.dailyTradeResetTime) {
      return {
        dailyTradeCount: 0,
        dailyTradeResetTime: new Date().setHours(24, 0, 0, 0) + (24 * 60 * 60 * 1000)
      };
    }
    return null;
  },

  getCooldownDurationMs(bot) {
    const val = parseInt(bot.cooldown || 0);
    const unit = bot.cooldownUnit || 'Sec';
    if (unit === 'Min') return val * 60 * 1000;
    if (unit === 'Hour') return val * 60 * 60 * 1000;
    return val * 1000; // Default Sec
  },

  isCooldownActive(bot) {
    if (!bot.cooldown || bot.cooldown <= 0) return false;
    const cooldownMs = this.getCooldownDurationMs(bot);
    const timeSinceLast = Date.now() - (bot.lastTriggerTime || 0);
    return timeSinceLast < cooldownMs;
  },

  canExecuteTrade(bot) {
      // 1. Status Check
      if (bot.status !== 'Waiting') {
        return { allowed: false, reason: 'Status not Waiting' };
      }

      // 2. Cooldown Check
      if (this.isCooldownActive(bot)) {
        const remaining = (this.getCooldownDurationMs(bot) - (Date.now() - bot.lastTriggerTime)) / 1000;
        return { allowed: false, reason: `Cooldown active (${remaining.toFixed(1)}s)` };
      }

      // 3. One Trade At A Time
      if (bot.oneTradeAtATime && bot.activeOrdersCount > 0) {
          return { allowed: false, reason: 'One trade at a time limit reached' };
      }

      // 4. Daily Limit Check
      const resetUpdates = this.resetDailyTradeCountIfNeeded(bot);
      const currentDailyCount = resetUpdates ? 0 : (bot.dailyTradeCount || 0);
      
      if (currentDailyCount >= (bot.maxTradesPerDay || 999)) {
          return { allowed: false, reason: 'Daily trade limit reached' };
      }

      return { allowed: true, updates: resetUpdates };
  },

  /**
   * Checks if price movement within timeframe meets dollar trigger amount.
   * Logic: |CurrentPrice - OpenPrice| > DollarAmount
   */
  checkTriggers(bot, currentCandle) {
    if (!currentCandle) return null;
    if (bot.status !== 'Waiting') return null;

    const open = parseFloat(currentCandle.open);
    const close = parseFloat(currentCandle.close);
    const delta = close - open;
    const absDelta = Math.abs(delta);
    const dollarAmount = parseFloat(bot.dollarAmount) || 50;

    // Check Trigger Condition: strictly greater than
    if (absDelta > dollarAmount) {
        
        // Safety Pre-check
        const safetyCheck = this.canExecuteTrade(bot);
        if (!safetyCheck.allowed) {
            // Log occasionally
            return null;
        }

        const signal = delta > 0 ? 'LONG' : 'SHORT';
        
        // Direction Constraints
        if (bot.directionMode === 'Long Only' && signal === 'SHORT') return null;
        if (bot.directionMode === 'Short Only' && signal === 'LONG') return null;

        if (bot.lastTriggeredCandleTime === currentCandle.time) return null;

        return {
            signal,
            delta,
            price: close,
            openPrice: open,
            timestamp: Date.now(),
            candleTime: currentCandle.time,
            safetyUpdates: safetyCheck.updates 
        };
    }

    return null;
  },

  /**
   * Executes trade and updates bot status
   */
  executeTrade(bot, trigger) {
     const { signal, price, safetyUpdates, candleTime } = trigger;

     // Final Safety Check before commitment
     const safetyCheck = this.canExecuteTrade(bot);
     if (!safetyCheck.allowed) return null;

     if (bot.templateId) {
         const template = templateService.getTemplateById(bot.templateId);
         if (template) {
             try {
                 // Place Order
                 const order = orderPlacementService.placeOrderFromTemplate(
                     template,
                     'bot',
                     bot.id,
                     `Momentum (${bot.timeframe})`,
                     price,
                     {
                         direction: signal === 'LONG' ? 'Long' : 'Short'
                     }
                 );

                 if (order) {
                    console.log(`[Momentum Engine] TRIGGER FIRED for ${bot.pair}. Order ${order.id}`);
                    
                    // Determine new counters
                    let newDailyCount = (bot.dailyTradeCount || 0) + 1;
                    let newResetTime = bot.dailyTradeResetTime;

                    if (safetyUpdates) {
                        newDailyCount = 1;
                        newResetTime = safetyUpdates.dailyTradeResetTime;
                    } else if (this.resetDailyTradeCountIfNeeded(bot)) {
                        const reset = this.resetDailyTradeCountIfNeeded(bot);
                        newDailyCount = 1;
                        newResetTime = reset.dailyTradeResetTime;
                    }

                    const updates = {
                        status: 'Active', 
                        lastTriggerTime: Date.now(),
                        lastTriggeredCandleTime: candleTime,
                        activeOrdersCount: (bot.activeOrdersCount || 0) + 1,
                        dailyTradeCount: newDailyCount,
                        dailyTradeResetTime: newResetTime,
                        triggerDetails: {
                            price: price,
                            delta: trigger.delta,
                            signal: signal,
                            time: Date.now(),
                            orderId: order.id,
                            templateName: template.name
                        }
                    };
                    
                    this.updateBot(bot.id, updates);
                    return { order, updates };
                 }
             } catch (e) {
                 console.error("[Momentum Execution] Exception:", e);
             }
         }
     }
     return null;
  }
};