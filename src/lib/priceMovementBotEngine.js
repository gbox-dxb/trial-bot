import { storage } from './storage';
import { templateService } from './templateService';
import { v4 as uuidv4 } from 'uuid';

export const priceMovementBotEngine = {
    createBot(config) {
        const bot = { 
            ...config, 
            id: `pm-${Date.now()}-${uuidv4().slice(0, 4)}`, 
            status: 'active', 
            activeOrdersCount: 0,
            lastTriggerTime: 0
        };
        const bots = storage.getPriceMovementBots();
        storage.savePriceMovementBots([bot, ...bots]);
        return bot;
    },

    deleteBot(id) {
        storage.deletePriceMovementBot(id);
    },

    toggleBotStatus(id) {
        const bots = storage.getPriceMovementBots();
        const updated = bots.map(b => b.id === id ? { ...b, status: b.status === 'active' ? 'paused' : 'active' } : b);
        storage.savePriceMovementBots(updated);
    },

    // Called by hook when price updates
    processPriceUpdate(pair, currentPrice) {
        const bots = storage.getPriceMovementBots();
        
        bots.forEach(bot => {
            if (bot.status !== 'active') return;

            // 1. Fetch Template to check if this pair is relevant
            const template = templateService.getTemplateById(bot.templateId);
            if (!template) return;

            // If template specifies pairs, check if current pair is included
            const relevantPairs = template.pairs || [];
            if (relevantPairs.length > 0 && !relevantPairs.includes(pair)) {
                return;
            }

            this.checkTriggerConditions(bot, template, pair, currentPrice);
        });
    },

    checkTriggerConditions(bot, template, pair, currentPrice) {
        // Time cooldown check (1 minute)
        if (Date.now() - (bot.lastTriggerTime || 0) < 60000) return;

        const sensitivityMap = { 'Low': 0.001, 'Medium': 0.005, 'High': 0.01 }; // Probability
        const chance = sensitivityMap[bot.sensitivity] || 0.005;
        const roll = Math.random();

        // Simulate trend check if enabled
        const trendAligned = bot.trendConfirmation ? Math.random() > 0.4 : true; 

        if (roll < chance && trendAligned) {
            // Determine direction based on config
            let direction = 'LONG';
            if (bot.direction === 'Down') direction = 'SHORT';
            else if (bot.direction === 'Both') direction = Math.random() > 0.5 ? 'LONG' : 'SHORT';

            this.executeBotOrder(bot, template, pair, currentPrice, direction);
        }
    },

    executeBotOrder(bot, template, pair, price, direction) {
        const { config } = template;
        const size = config.sizeMode === 'USDT' ? config.baseOrderSize : 100; // Default fallback
        const leverage = config.leverage || 5;

        const order = {
            id: uuidv4(),
            pair: pair,
            direction: direction,
            leverage: leverage,
            entryPrice: price,
            quantity: (size * leverage) / price,
            margin: size,
            accountId: config.accountId || 'demo',
            createdAt: Date.now(),
            status: 'ACTIVE',
            tp: config.takeProfitEnabled ? config.takeProfit : null,
            sl: config.stopLossEnabled ? config.stopLoss : null,
            source: 'Price Movement Bot',
            templateName: template.name,
            botId: bot.id
        };

        // Save active order
        storage.saveActiveOrder(order);

        // Update bot stats
        const bots = storage.getPriceMovementBots();
        const updatedBots = bots.map(b => {
            if (b.id === bot.id) {
                return {
                    ...b,
                    activeOrdersCount: (b.activeOrdersCount || 0) + 1,
                    lastTriggerTime: Date.now()
                };
            }
            return b;
        });
        storage.savePriceMovementBots(updatedBots);

        console.log(`[PriceMomentum] Bot ${bot.id} triggered on ${pair} (${direction})`);
    }
};