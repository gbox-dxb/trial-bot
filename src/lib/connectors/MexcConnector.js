import { apiProxy } from '@/lib/apiProxy';

/**
 * MEXC Connector
 * 
 * Refactored to use apiProxy for all network requests.
 * Client-side signing and timestamp generation have been removed/delegated.
 */
export const MexcConnector = {

  async validateKeys(credentials) {
    try {
      // Use appropriate endpoint for validation based on market type
      const isFutures = credentials.marketType === 'Futures';
      const endpoint = isFutures ? '/api/v1/private/account/assets' : '/api/v3/account';

      await apiProxy.request('mexc', endpoint, 'GET', {}, {}, credentials);
      return { valid: true };
    } catch (e) {
      console.error('MEXC Validation Error:', e);
      return { valid: false, error: e.message };
    }
  },

  async getBalance(credentials) {
    try {
      const isFutures = credentials.marketType === 'Futures';
      const endpoint = isFutures ? '/api/v1/private/account/assets' : '/api/v3/account';

      const data = await apiProxy.request('mexc', endpoint, 'GET', {}, {}, credentials);

      if (isFutures) {
        // MEXC Futures Asset Response handling
        const usdt = data.data?.find(a => a.asset === 'USDT');
        return {
          USDT: {
            available: parseFloat(usdt?.availableBalance || 0),
            total: parseFloat(usdt?.totalBalance || 0)
          }
        };
      }
      // MEXC Spot: { balances: [{ asset: 'USDT', free: '100', locked: '0' }] }
      const usdt = data.balances?.find(b => b.asset === 'USDT');

      return {
        USDT: {
          available: parseFloat(usdt?.free || 0),
          total: parseFloat(usdt?.free || 0) + parseFloat(usdt?.locked || 0)
        }
      };
    } catch (error) {
      // Return zero balance on error to prevent crash, but log it
      console.error('MEXC Balance Check Failed:', error);
      return { USDT: { available: 0, total: 0 } };
    }
  },

  async placeOrder(intent, credentials) {
    const isFutures = credentials.marketType === 'Futures';
    const endpoint = isFutures ? '/api/v1/private/order/submit' : '/api/v3/order';

    const params = {
      symbol: intent.symbol,
      side: intent.side.toUpperCase(),
      type: intent.orderType.toUpperCase(),
      quantity: intent.quantity,
    };

    if (intent.orderType === 'LIMIT') {
      params.price = intent.price;
    }

    // Proxy handles signature & timestamp
    const data = await apiProxy.request('mexc', endpoint, 'POST', params, {}, credentials);

    return {
      orderId: data.data ? data.data.orderId : data.orderId,
      status: 'NEW',
      fills: [],
      avgPrice: 0,
      totalFilled: 0,
      timestamp: Date.now()
    };
  },

  async setLeverage(symbol, leverage, credentials) {
    if (credentials.marketType === 'Futures') {
      await apiProxy.request('mexc', '/api/v1/private/position/change_leverage', 'POST', {
        symbol,
        leverage
      }, {}, credentials);
    }
  },

  async getOpenPositions(credentials) {
    if (credentials.marketType !== 'Futures') return [];

    try {
      const data = await apiProxy.request('mexc', '/api/v1/private/position/open_positions', 'GET', {}, {}, credentials);
      // Transform MEXC positions to standard format if needed
      return data.data || [];
    } catch (e) {
      console.error('Failed to fetch positions', e);
      return [];
    }
  },

  async getOpenOrders(credentials) {
    const endpoint = credentials.marketType === 'Futures' ? '/api/v1/private/order/list/open_orders' : '/api/v3/openOrders';
    try {
      const data = await apiProxy.request('mexc', endpoint, 'GET', {}, {}, credentials);
      return Array.isArray(data) ? data : (data.data || []);
    } catch (e) {
      return [];
    }
  },

  async cancelOrder(orderId, symbol, credentials) {
    const isFutures = credentials.marketType === 'Futures';
    const endpoint = isFutures ? '/api/v1/private/order/cancel' : '/api/v3/order';

    const params = { symbol };
    if (isFutures) {
      params.orderId = orderId;
    } else {
      params.orderId = orderId;
    }

    return await apiProxy.request('mexc', endpoint, 'DELETE', params, {}, credentials);
  },

  async closePosition(symbol, credentials) {
    return null;
  },

  async placeTpSlOrders() { return null; }
};