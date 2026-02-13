import { storage } from './storage';

// This service simulates the backend MEXC API integration
// In a real production app, this would call your Node.js backend
// which would then call MEXC API to avoid exposing keys.

export const mexcService = {
  // Simulate validating API keys and permissions
  async validateKeys(apiKey, apiSecret) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Mock validation logic
        if (apiKey.length < 10 || apiSecret.length < 10) {
          reject(new Error("Invalid API Key format"));
          return;
        }
        
        // Mock successful connection data
        resolve({
            permissions: ['SPOT', 'FUTURES', 'READ'],
            ipWhitelisted: true,
            balance: {
                USDT: 5000.00,
                BTC: 0.05,
                ETH: 1.2
            },
            leverage: {
                max: 125,
                current: 20
            }
        });
      }, 1500); // Simulate network delay
    });
  },

  // Get active exchange accounts from storage
  getAccounts() {
      return storage.getExchanges();
  },

  // --- LIVE TRADING METHODS ---

  async placeMarketOrder(apiKey, apiSecret, pair, side, amount, leverage) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!apiKey) { reject(new Error("Missing API Key")); return; }
        
        // Random failure simulation (5% chance)
        if (Math.random() < 0.05) {
            reject(new Error("MEXC API Error: System Busy"));
            return;
        }

        const filledPrice = side === 'BUY' || side === 'LONG' 
            ? (Math.random() * 1000 + 40000) // Mock BTC price
            : (Math.random() * 1000 + 40000);

        resolve({
            orderId: `mexc-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            status: 'FILLED',
            avgPrice: filledPrice,
            executedQty: amount / filledPrice, // Amount is usually in USDT for this app
            executedAmount: amount,
            fee: amount * 0.0006, // 0.06% fee
            time: Date.now()
        });
      }, 600);
    });
  },

  async placeLimitOrder(apiKey, apiSecret, pair, side, amount, price, leverage) {
      return new Promise((resolve) => {
          setTimeout(() => {
              resolve({
                  orderId: `mexc-limit-${Date.now()}`,
                  status: 'NEW',
                  price: price,
                  origQty: amount / price,
                  time: Date.now()
              });
          }, 400);
      });
  },

  async closePosition(apiKey, apiSecret, positionId) {
      return new Promise((resolve) => {
          setTimeout(() => {
              resolve({
                  success: true,
                  closePrice: 42150.50, // Mock
                  pnl: (Math.random() * 200) - 50, // Mock PnL
                  time: Date.now()
              });
          }, 500);
      });
  },

  async getAccountBalance(apiKey, apiSecret) {
      return new Promise((resolve) => {
          setTimeout(() => {
              resolve({
                  USDT: { available: 4500.20, frozen: 500.00 },
                  BTC: { available: 0.02, frozen: 0.0 }
              });
          }, 300);
      });
  }
};