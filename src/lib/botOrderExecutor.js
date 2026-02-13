import { v4 as uuidv4 } from 'uuid';
import { storage } from './storage';
import { templateService } from './templateService';

export const botOrderExecutor = {
  /**
   * Main function to execute an order from a bot trigger based on a template.
   * @param {string} botId - The ID of the bot triggering the order.
   * @param {string} botType - The type of bot (e.g., 'GridBot', 'RSIBot').
   * @param {string} templateId - The ID of the template to use for order configuration.
   * @param {number} currentPrice - The current price of the asset.
   * @param {object} overrides - Optional overrides for the order (e.g., specific side or size).
   * @returns {object|null} - The created order object or null if failed.
   */
  executeOrderFromTemplate(botId, botType, templateId, currentPrice, overrides = {}) {
    try {
      // 1. Fetch Template
      const template = templateService.getTemplateById(templateId);
      
      if (!template) {
        console.warn(`[BotOrderExecutor] Template ${templateId} not found for bot ${botId}`);
        return null;
      }

      // 2. Validate Order
      if (!this.validateBotOrder(template, currentPrice)) {
        console.warn(`[BotOrderExecutor] Order validation failed for bot ${botId}`);
        return null;
      }

      // 3. Create Order Object
      const order = this.createOrderFromTemplate(template, botId, botType, currentPrice, overrides);

      // 4. Save/Execute Order
      storage.saveActiveOrder(order);
      
      // 5. Link Order to Bot (Conceptually linked via metadata in order, but we can add explicit linking logic if needed)
      // This is largely handled by including botId in the order object itself.
      
      console.log(`[BotOrderExecutor] Order executed for ${botType} (${botId}): ${order.id}`);
      return order;

    } catch (error) {
      console.error(`[BotOrderExecutor] Failed to execute order for bot ${botId}:`, error);
      return null;
    }
  },

  /**
   * Validates if an order can be placed based on the template and current market conditions.
   * @param {object} template - The order template.
   * @param {number} currentPrice - The current price.
   * @returns {boolean} - True if valid.
   */
  validateBotOrder(template, currentPrice) {
    if (!template.config) return false;
    if (!currentPrice || currentPrice <= 0) return false;
    // Add more validation logic here (e.g., check account balance, max orders)
    return true;
  },

  /**
   * Converts a template into a standard order object.
   * @param {object} template - The source template.
   * @param {string} botId - The ID of the bot.
   * @param {string} botType - The type of the bot.
   * @param {number} currentPrice - Current market price.
   * @param {object} overrides - Overrides for specific fields.
   * @returns {object} - The constructed order object.
   */
  createOrderFromTemplate(template, botId, botType, currentPrice, overrides = {}) {
    const { config } = template;
    
    // Determine size
    const size = config.sizeMode === 'USDT' ? parseFloat(config.baseOrderSize) : 100; // Fallback size
    const leverage = parseFloat(config.leverage) || 1;
    
    // Determine direction
    let direction = config.direction || 'Long';
    if (overrides.direction) direction = overrides.direction;
    
    // Normalize Side
    const side = (direction === 'Long' || direction === 'BUY') ? 'LONG' : 'SHORT';
    
    const pair = overrides.pair || template.pair || config.pair || 'BTCUSDT';

    return {
      id: uuidv4(),
      botId: botId,
      botType: botType,
      botName: overrides.botName || `${botType} Strategy`,
      templateId: template.id,
      templateName: template.name,
      
      pair: pair,
      symbol: pair, // Alias for unified table
      side: side,
      type: overrides.type || 'MARKET', // Default to Market for immediate bot entry usually
      
      entryPrice: currentPrice,
      quantity: (size * leverage) / currentPrice,
      size: size, // Margin/Invested Amount
      leverage: leverage,
      
      accountId: config.accountId || 'demo',
      
      // Risk Management
      tp: config.takeProfitEnabled ? parseFloat(config.takeProfit) : null,
      sl: config.stopLossEnabled ? parseFloat(config.stopLoss) : null,
      
      status: 'ACTIVE', // Or PLACED
      createdAt: Date.now(),
      updatedAt: Date.now(),
      
      source: `BOT_${botType.toUpperCase()}`
    };
  },

  /**
   * Retrieves all orders associated with a specific bot.
   * @param {string} botId 
   * @returns {Array}
   */
  getBotOrders(botId) {
    return storage.getBotOrders(botId);
  }
};