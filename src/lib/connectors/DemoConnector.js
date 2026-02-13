import { v4 as uuidv4 } from 'uuid';
import { orderEvents } from '../orderEvents';

// In-memory storage for demo simulation
// In a real app with persistent storage, this would load from DB/LocalStorage
let simulatedWallets = new Map(); // accountId -> balance
let simulatedPositions = new Map(); // orderId -> position
let simulatedOrders = new Map(); // orderId -> order

export const DemoConnector = {
  
  _ensureWallet(accountId) {
    if (!simulatedWallets.has(accountId)) {
      simulatedWallets.set(accountId, 10000); // Default 10k USDT
    }
    return simulatedWallets.get(accountId);
  },

  async validateKeys() {
    return { valid: true, permissions: ['READ', 'TRADING'] };
  },

  async getBalance(credentials) {
    const balance = this._ensureWallet(credentials.id);
    return {
      USDT: { available: balance, total: balance },
      updatedAt: Date.now()
    };
  },

  async placeOrder(intent, credentials, currentPrices) {
    const balance = this._ensureWallet(credentials.id);
    const price = intent.orderType === 'Market' ? (currentPrices[intent.symbol] || 0) : intent.price;
    
    if (!price) throw new Error(`Price unavailable for ${intent.symbol}`);

    const notional = intent.quantity * price;
    const margin = intent.marketType === 'Futures' ? notional / (intent.leverage || 1) : notional;

    if (balance < margin) {
      throw new Error(`Insufficient demo balance. Req: ${margin.toFixed(2)}, Avail: ${balance.toFixed(2)}`);
    }

    // Deduct balance (simplified margin model)
    simulatedWallets.set(credentials.id, balance - margin);

    const orderId = uuidv4();
    const order = {
      orderId,
      symbol: intent.symbol,
      side: intent.side,
      price: price,
      quantity: intent.quantity,
      status: 'FILLED', // Instant fill for demo
      fills: [{ price: price, qty: intent.quantity, commission: 0 }],
      avgPrice: price,
      totalFilled: intent.quantity,
      timestamp: Date.now()
    };

    // Track position for futures logic simulation
    if (intent.marketType === 'Futures') {
      simulatedPositions.set(orderId, {
        ...order,
        leverage: intent.leverage,
        margin: margin,
        accountId: credentials.id
      });
    }

    simulatedOrders.set(orderId, order);
    
    // Emit event
    orderEvents.emit('order.filled', {
      orderId,
      fillPrice: price,
      fillQuantity: intent.quantity,
      totalFilled: intent.quantity
    });

    return order;
  },

  async setLeverage(symbol, leverage, credentials) {
    return { symbol, leverage }; // No-op for demo
  },

  async closePosition(symbol, credentials, currentPrices) {
    // Find open positions for this symbol/account
    // This is a simplified close all for symbol logic
    const price = currentPrices[symbol];
    if (!price) throw new Error('Price unavailable');

    let totalPnL = 0;
    
    for (const [id, pos] of simulatedPositions.entries()) {
      if (pos.accountId === credentials.id && pos.symbol === symbol) {
        // Calculate PnL
        const diff = price - pos.price;
        const pnl = pos.side === 'BUY' || pos.side === 'LONG' ? diff * pos.quantity : -diff * pos.quantity;
        
        totalPnL += pnl;
        
        // Return margin + pnl to wallet
        const currentBal = simulatedWallets.get(credentials.id);
        simulatedWallets.set(credentials.id, currentBal + pos.margin + pnl);
        
        simulatedPositions.delete(id);
      }
    }

    return { success: true, pnl: totalPnL };
  },
  
  // Dummy implementations for compatibility
  async placeTpSlOrders() { return true; },
  async getOpenPositions() { return Array.from(simulatedPositions.values()); },
  async getOpenOrders() { return []; },
  async cancelOrder() { return { status: 'CANCELLED' }; }
};