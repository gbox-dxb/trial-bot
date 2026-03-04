import { apiProxy } from '@/lib/apiProxy';

/**
 * Binance Connector
 * 
 * Refactored to use apiProxy for all network requests.
 * Client-side signing and timestamp generation have been removed/delegated.
 */
export const BinanceConnector = {

  async validateKeys(credentials) {
    try {
      // Use appropriate endpoint for validation based on market type
      const isFutures = credentials.marketType === 'Futures';
      const endpoint = isFutures ? '/fapi/v2/account' : '/api/v3/account';

      await apiProxy.request('binance', endpoint, 'GET', {}, {}, credentials);
      return { valid: true };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  },

  async getBalance(credentials) {
    let balances = { USDT: { available: 0, total: 0 } };

    try {
      if (credentials.marketType === 'Futures') {
        const data = await apiProxy.request('binance', '/fapi/v2/account', 'GET', {}, {}, credentials);
        const usdt = data.assets.find(a => a.asset === 'USDT');
        balances.USDT = {
          available: parseFloat(usdt?.availableBalance || 0),
          total: parseFloat(usdt?.walletBalance || 0)
        };
      } else {
        const data = await apiProxy.request('binance', '/api/v3/account', 'GET', {}, {}, credentials);
        const usdt = data.balances.find(b => b.asset === 'USDT');
        balances.USDT = {
          available: parseFloat(usdt?.free || 0),
          total: parseFloat(usdt?.free || 0) + parseFloat(usdt?.locked || 0)
        };
      }
    } catch (error) {
      console.error('Binance Balance Check Failed:', error);
    }

    return balances;
  },

  async placeOrder(intent, credentials) {
    const isFutures = credentials.marketType === 'Futures';
    const endpoint = isFutures ? '/fapi/v1/order' : '/api/v3/order';

    const params = {
      symbol: intent.symbol,
      side: intent.side.toUpperCase(),
      type: intent.orderType.toUpperCase(),
      quantity: intent.quantity,
      // timestamp is added by proxy
    };

    // Support Hedge Mode if configured
    if (isFutures && credentials.positionMode === 'Hedge' && intent.positionSide) {
      params.positionSide = intent.positionSide.toUpperCase();
    }

    if (intent.orderType === 'LIMIT') {
      params.price = intent.price;
      params.timeInForce = 'GTC';
    }

    const data = await apiProxy.request('binance', endpoint, 'POST', params, {}, credentials);

    return {
      orderId: data.orderId,
      status: data.status,
      avgPrice: parseFloat(data.avgPrice || data.cummulativeQuoteQty / data.executedQty || 0),
      totalFilled: parseFloat(data.executedQty),
      timestamp: data.updateTime || data.transactTime
    };
  },

  async setLeverage(symbol, leverage, credentials) {
    if (credentials.marketType !== 'Futures') return;

    await apiProxy.request('binance', '/fapi/v1/leverage', 'POST', {
      symbol,
      leverage
    }, {}, credentials);
  },

  async setMarginMode(symbol, mode, credentials) {
    if (credentials.marketType !== 'Futures') return;
    try {
      const marginType = mode.toUpperCase() === 'ISOLATED' ? 'ISOLATED' : 'CROSSED';
      await apiProxy.request('binance', '/fapi/v1/marginType', 'POST', {
        symbol,
        marginType
      }, {}, credentials);
    } catch (e) {
      // Binance often fails if already set to that mode
      console.warn('Binance setMarginMode failed:', e.message);
    }
  },

  async getOpenPositions(credentials) {
    if (credentials.marketType !== 'Futures') return [];
    try {
      const data = await apiProxy.request('binance', '/fapi/v2/positionRisk', 'GET', {}, {}, credentials);
      return data.filter(p => parseFloat(p.positionAmt) !== 0);
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getOpenOrders(credentials) {
    const isFutures = credentials.marketType === 'Futures';
    const endpoint = isFutures ? '/fapi/v1/openOrders' : '/api/v3/openOrders';
    try {
      return await apiProxy.request('binance', endpoint, 'GET', {}, {}, credentials);
    } catch (e) {
      return [];
    }
  },

  async cancelOrder(orderId, symbol, credentials) {
    const isFutures = credentials.marketType === 'Futures';
    const endpoint = isFutures ? '/fapi/v1/order' : '/api/v3/order';

    return await apiProxy.request('binance', endpoint, 'DELETE', {
      symbol,
      orderId
    }, {}, credentials);
  },

  async getSymbolInfo(symbol, credentials) {
    const isFutures = credentials.marketType === 'Futures';
    if (!isFutures) return null; // Simplified for now

    try {
      const data = await apiProxy.request('binance', '/fapi/v1/exchangeInfo', 'GET', {}, {}, credentials);
      const symbolData = data.symbols.find(s => s.symbol === symbol);
      if (!symbolData) return null;

      const lotSize = symbolData.filters.find(f => f.filterType === 'LOT_SIZE');
      const minNotional = symbolData.filters.find(f => f.filterType === 'MIN_NOTIONAL');
      const priceFilter = symbolData.filters.find(f => f.filterType === 'PRICE_FILTER');

      return {
        minQty: parseFloat(lotSize?.minQty || 0),
        stepSize: parseFloat(lotSize?.stepSize || 0),
        minNotional: parseFloat(minNotional?.minNotional || 0),
        tickSize: parseFloat(priceFilter?.tickSize || 0),
        maxLeverage: symbolData.leverage || 125 // Note: Some symbols have lower max leverage
      };
    } catch (e) {
      console.error('Failed to fetch Binance symbol info:', e);
      return null;
    }
  },

  async placeTpSlOrders() { return null; },
  async closePosition() { return null; }
};