import { keyManagement } from './keyManagement';
import { TRADING_PAIRS } from './mockData';

export const exchangeService = {
  getExchangeConfig(exchangeType) {
    const configs = {
      'binance': {
        maxLeverage: 125,
        minLeverage: 1,
        supportedPairs: TRADING_PAIRS,
        fees: { maker: 0.02, taker: 0.04 }
      },
      'mexc': {
        maxLeverage: 200,
        minLeverage: 1,
        supportedPairs: TRADING_PAIRS,
        fees: { maker: 0.02, taker: 0.06 }
      },
      'demo': {
        maxLeverage: 125,
        minLeverage: 1,
        supportedPairs: TRADING_PAIRS,
        fees: { maker: 0.02, taker: 0.04 }
      }
    };
    
    return configs[exchangeType?.toLowerCase()] || configs.demo;
  },

  getAccountBalance(userId, accountId) {
    try {
      const credentials = keyManagement.getDecryptedKeys(userId, accountId);
      if (!credentials) return { available: 0, total: 0 };
      
      // If it's a demo account, it should have a persistent balance field in the credentials object
      // returned by getDecryptedKeys (since getDecryptedKeys merges the full demo object)
      if (credentials.mode === 'Demo') {
        const balance = credentials.balance !== undefined ? credentials.balance : 10000.00;
        return { available: balance, total: balance, currency: 'USDT' };
      }
      
      // For live accounts, this would be an API call
      // Mocking a live balance for now as we don't have a backend proxy
      return { available: 5240.50, total: 5240.50, currency: 'USDT' };
    } catch (error) {
      console.error('Error fetching account balance:', error);
      return { available: 0, total: 0 };
    }
  },

  getSupportedPairs(accountId, userId = 'user-1') {
    try {
      if (!accountId) return TRADING_PAIRS; // Default fallback if no account

      const credentials = keyManagement.getDecryptedKeys(userId, accountId);
      if (!credentials) return TRADING_PAIRS; // Fallback if creds not found
      
      const config = this.getExchangeConfig(credentials.exchange);
      return config.supportedPairs || TRADING_PAIRS;
    } catch (error) {
      console.error('Error fetching supported pairs:', error);
      return TRADING_PAIRS;
    }
  },

  getLeverageRange(accountId, userId = 'user-1') {
    try {
      if (!accountId) return { min: 1, max: 125 };

      const credentials = keyManagement.getDecryptedKeys(userId, accountId);
      if (!credentials) return { min: 1, max: 125 };
      
      const config = this.getExchangeConfig(credentials.exchange);
      return { min: config.minLeverage, max: config.maxLeverage };
    } catch (error) {
      console.error('Error fetching leverage range:', error);
      return { min: 1, max: 125 };
    }
  }
};