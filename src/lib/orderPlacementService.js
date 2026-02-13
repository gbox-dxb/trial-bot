import { v4 as uuidv4 } from 'uuid';
import { storage } from './storage';

export const orderPlacementService = {
  /**
   * Creates and places an order based on a template.
   * @param {object} template - The template object containing configuration.
   * @param {string} source - 'manual' or 'bot'.
   * @param {string|null} botId - ID of the bot if source is 'bot'.
   * @param {string|null} botName - Name of the bot if source is 'bot'.
   * @param {number|null} currentPrice - Current market price (required).
   * @param {object} overrides - Optional overrides for price, size, direction, etc.
   * @returns {object} The created order object.
   */
  placeOrderFromTemplate(template, source = 'manual', botId = null, botName = null, currentPrice = null, overrides = {}) {
    try {
      if (!template || !template.config) {
        throw new Error("Invalid template structure");
      }

      if (!currentPrice || currentPrice <= 0) {
        // Attempt to fallback to override price, otherwise fail
        if (overrides.price && overrides.price > 0) {
            currentPrice = overrides.price;
        } else {
            throw new Error("Valid market price is required for order placement");
        }
      }

      const { config } = template;
      
      // Determine Price (Override > Argument > Template Config)
      const price = overrides.price || currentPrice;

      // Determine Direction
      const direction = overrides.direction || config.direction || 'Long';
      
      // Determine Size
      let size = config.baseOrderSize || 100;
      if (overrides.size) size = overrides.size;
      
      // Leverage
      const leverage = overrides.leverage || config.leverage || 1;

      // Pair
      const pair = overrides.pair || (template.selectedCoins && template.selectedCoins[0]) || config.pair || 'BTCUSDT';
      
      // Normalized Side
      const side = (direction === 'Long' || direction === 'BUY' || direction === 'LONG') ? 'LONG' : 'SHORT';

      const order = {
        id: uuidv4(),
        status: 'ACTIVE',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        
        // Metadata
        templateId: template.id,
        templateName: template.name,
        source: source, // 'manual' or 'bot'
        botId: botId,
        botName: botName,
        
        // Trade Details
        pair: pair,
        symbol: pair, // Alias for compatibility
        type: overrides.type || config.orderType || 'MARKET',
        side: side,
        direction: side, // specific to this app's logic often using 'direction'
        
        entryPrice: price,
        size: size, // Margin Amount
        leverage: leverage,
        quantity: (size * leverage) / price, // Total Position Size in Coins
        margin: size,
        
        // Risk Management (Template Config)
        tp: config.takeProfitEnabled ? config.takeProfit : null,
        sl: config.stopLossEnabled ? config.stopLoss : null,
      };

      storage.saveActiveOrder(order);
      return order;
    } catch (error) {
      console.error("Order placement failed:", error);
      throw error;
    }
  },

  /**
   * Returns a human-readable source string for an order.
   * @param {object} order 
   * @returns {string}
   */
  getOrderSource(order) {
    if (order.source === 'bot') {
      return `Bot: ${order.botName || order.botId || 'Unknown Bot'}`;
    }
    if (order.source === 'manual') {
      return `Template: ${order.templateName || 'Custom'}`;
    }
    // Fallback logic for existing orders
    if (order.botId) return `Bot: ${order.botName || 'Trading Bot'}`;
    if (order.templateName) return `Template: ${order.templateName}`;
    
    return 'Manual Terminal';
  }
};