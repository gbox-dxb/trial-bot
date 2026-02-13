import { storage } from './storage';
import { v4 as uuidv4 } from 'uuid';
import { templateService } from './templateService';
import { orderPlacementService } from './orderPlacementService';

const SAFETY_STORAGE_KEY = 'cs_safety_state';

export const candleStrikeBotEngine = {
  createBot(config) {
    const bot = {
      id: `cs-${Date.now()}-${uuidv4().slice(0, 8)}`,
      status: 'WAITING',
      activeOrdersCount: 0,
      lastTriggerTime: 0,
      currentConsecutiveCount: 0,
      ...config
    };

    const bots = storage.getCandleStrikeBots() || [];
    storage.saveCandleStrikeBots([bot, ...bots]);
    return bot;
  },

  updateBot(updatedBot) {
    const bots = storage.getCandleStrikeBots() || [];
    const index = bots.findIndex(b => b.id === updatedBot.id);
    if (index !== -1) {
      const existingBot = bots[index];
      // Preserve immutable fields if needed, but allow updates
      if (existingBot.candleColor) updatedBot.candleColor = existingBot.candleColor;
      if (existingBot.timeframe) updatedBot.timeframe = existingBot.timeframe;

      bots[index] = updatedBot;
      storage.saveCandleStrikeBots(bots);
    }
  },

  deleteBot(id) {
    // 1. Strict Validation
    if (!id || typeof id !== 'string') {
        console.error("[CandleStrike] Invalid ID passed to deleteBot:", id);
        return false;
    }

    console.log(`[CandleStrike] Attempting to delete bot with ID: ${id}`);

    // 2. Get ALL bots (Green AND Red) from storage
    const bots = storage.getCandleStrikeBots() || [];
    const initialCount = bots.length;

    // 3. Filter out ONLY the specific bot with matching ID
    // Support potential legacy IDs (id or _id)
    const updatedBots = bots.filter(b => {
        const currentId = b.id || b._id;
        return currentId !== id;
    });
    
    // 4. Save back if changes occurred
    if (updatedBots.length !== initialCount) {
        console.log(`[CandleStrike] Deleted bot ${id}. Count: ${initialCount} -> ${updatedBots.length}`);
        storage.saveCandleStrikeBots(updatedBots);
        return true;
    } else {
        console.warn(`[CandleStrike] Bot ${id} not found in storage. Available IDs:`, bots.map(b => b.id || b._id));
        return false;
    }
  },

  toggleBot(id) {
    const bots = storage.getCandleStrikeBots() || [];
    const bot = bots.find(b => b.id === id);
    if (bot) {
      bot.status = bot.status === 'PAUSED' ? 'WAITING' : 'PAUSED';
      this.updateBot(bot);
    }
  },

  getBotsByColor(color) {
    const bots = storage.getCandleStrikeBots() || [];
    if (!color) return bots;
    // Filter by strategy color for display purposes
    return bots.filter(b => b.candleColor === color);
  },

  countConsecutive(candles, color) {
      if (!Array.isArray(candles) || candles.length === 0) return 0;
      let count = 0;
      for (let i = candles.length - 1; i >= 0; i--) {
          const c = candles[i];
          const open = parseFloat(c.open);
          const close = parseFloat(c.close);
          if (isNaN(open) || isNaN(close)) continue;

          const isGreen = close > open;
          const isRed = close < open; 
          
          let match = false;
          if (color === 'GREEN' && isGreen) match = true;
          if (color === 'RED' && isRed) match = true;

          if (match) count++;
          else break; 
      }
      return count;
  },

  // --- Safety & Lock System ---

  getSafetyState() {
    try {
      const stored = localStorage.getItem(SAFETY_STORAGE_KEY);
      return stored ? JSON.parse(stored) : { 
        lastExecutionTime: { GREEN: 0, RED: 0 },
        globalLockUntil: 0,
        executingColor: null
      };
    } catch {
      return { lastExecutionTime: { GREEN: 0, RED: 0 }, globalLockUntil: 0, executingColor: null };
    }
  },

  setSafetyState(state) {
    localStorage.setItem(SAFETY_STORAGE_KEY, JSON.stringify(state));
  },

  isSystemLocked() {
    const state = this.getSafetyState();
    const now = Date.now();
    if (now < state.globalLockUntil) {
      return { locked: true, remaining: state.globalLockUntil - now, executingColor: state.executingColor };
    }
    return { locked: false, remaining: 0, executingColor: null };
  },

  async checkTrigger(bot, candles) {
    if (bot.status !== 'WAITING') return null;

    // 1. Check Global Lock
    const lockStatus = this.isSystemLocked();
    if (lockStatus.locked) {
        return null; 
    }

    // 2. Check Specific Strategy Safety Delay
    const safetyState = this.getSafetyState();
    const lastExec = safetyState.lastExecutionTime[bot.candleColor] || 0;
    const cooldownMs = (bot.cooldown || 30) * 1000;
    
    // Also check bot-specific trigger time
    const botLastTrigger = bot.lastTriggerTime || 0;
    
    if (Date.now() - Math.max(lastExec, botLastTrigger) < cooldownMs) {
        return null;
    }

    const currentCount = this.countConsecutive(candles, bot.candleColor);
    
    if (currentCount !== bot.currentConsecutiveCount) {
        const updatedBot = { ...bot, currentConsecutiveCount: currentCount };
        this.updateBot(updatedBot);
    }

    if (currentCount >= bot.candleCount) {
        const latestCandle = candles[candles.length - 1];
        const price = parseFloat(latestCandle.close);
        
        if (bot.lastTriggeredCandleTime === latestCandle.time) {
            return null;
        }

        const direction = bot.candleColor === 'GREEN' ? 'LONG' : 'SHORT';
        return await this.executeTrade(bot, price, direction, latestCandle.time);
    }

    return null;
  },

  async executeTrade(bot, price, direction, candleTime) {
     const lockStatus = this.isSystemLocked();
     if (lockStatus.locked) return null;

     if (bot.templateId) {
         const template = templateService.getTemplateById(bot.templateId);
         if (template) {
             try {
                 const order = orderPlacementService.placeOrderFromTemplate(
                     template, 'bot', bot.id, `Candle Strategy (${bot.candleCount} ${bot.candleColor})`, price, { direction: direction === 'LONG' ? 'Long' : 'Short' }
                 );

                 if (order) {
                     const now = Date.now();
                     const cooldownMs = (bot.cooldown || 30) * 1000;

                     // UPDATE SAFETY STATE
                     const safetyState = this.getSafetyState();
                     safetyState.lastExecutionTime[bot.candleColor] = now;
                     
                     // Global lock
                     safetyState.globalLockUntil = now + cooldownMs;
                     safetyState.executingColor = bot.candleColor;
                     
                     this.setSafetyState(safetyState);

                     const newBotState = {
                         ...bot,
                         status: 'ACTIVE',
                         lastTriggerTime: now,
                         lastTriggeredCandleTime: candleTime,
                         activeOrdersCount: (bot.activeOrdersCount || 0) + 1,
                         currentConsecutiveCount: 0
                     };
                     
                     this.updateBot(newBotState);
                     return { order, bot: newBotState };
                 }
             } catch (e) {
                 console.error("[CandleStrike] Execution failed:", e);
             }
         }
     }
     return null;
  }
};