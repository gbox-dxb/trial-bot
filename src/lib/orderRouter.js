import { keyManagement } from './keyManagement';
import { orderEvents } from './orderEvents';
import { validateOrder } from './orderValidation';
import { storage } from './storage';
import { DemoConnector } from './connectors/DemoConnector';
import { BinanceConnector } from './connectors/BinanceConnector';
import { MexcConnector } from './connectors/MexcConnector';
import { v4 as uuidv4 } from 'uuid';

const connectors = {
  'binance': BinanceConnector,
  'mexc': MexcConnector,
  'demo': DemoConnector
};

export const orderRouter = {
  async executeOrder(intent, currentPrices) {
    const { userId, exchangeAccountId } = intent;

    // 1. Load Credentials
    const credentials = keyManagement.getDecryptedKeys(userId, exchangeAccountId);
    if (!credentials) {
      return { success: false, error: 'Exchange account not found or invalid credentials' };
    }

    // 2. Resolve Connector
    let connector;
    if (credentials.mode === 'Demo') {
      connector = connectors.demo;
    } else {
      connector = connectors[credentials.exchange.toLowerCase()];
    }

    if (!connector) {
      return { success: false, error: `Unsupported exchange: ${credentials.exchange}` };
    }

    try {
      // 3. Robust Side Mapping (Safety layer)
      const rawSide = (intent.side || intent.direction || 'BUY').toString().toUpperCase();
      intent.side = (rawSide === 'LONG' || rawSide === 'BUY') ? 'BUY' : 'SELL';

      // 4. Mode Injection
      if (!intent.mode) intent.mode = credentials.mode;

      // 5. Set Leverage (Futures only)
      if (credentials.marketType === 'Futures' && intent.leverage) {
        await connector.setLeverage(intent.symbol, intent.leverage, credentials);
      }

      // 6. Place Order
      const result = await connector.placeOrder(intent, credentials, currentPrices);

      // 7. Determine Status & Type logic
      // Market orders execute immediately -> become ACTIVE positions
      // Limit orders are placed -> become PENDING orders
      const isMarket = intent.orderType === 'Market';
      const status = isMarket ? 'ACTIVE' : 'PENDING';

      const orderRecord = {
        id: uuidv4(),
        ...intent,
        ...result,
        status, // 'ACTIVE' or 'PENDING'
        exchangeAccountId,
        createdAt: Date.now(),
        // Normalize fields for storage
        pair: intent.symbol,
        direction: intent.direction || intent.side, // Use preserved direction for UI
        entryPrice: intent.price,
        margin: (intent.quantity * intent.price) / intent.leverage, // Estimated
        tp: intent.takeProfit,
        sl: intent.stopLoss,
        tpMode: intent.tpMode,
        slMode: intent.slMode
      };

      // Save to Storage
      storage.saveOrder(orderRecord);

      // Update Balance in local cache if needed
      keyManagement.updateAccountDetails(userId, exchangeAccountId, {
        lastBalanceUpdate: Date.now()
      });

      // Emit events
      orderEvents.emit('order.created', orderRecord);

      return { success: true, data: result };

    } catch (error) {
      console.error('Order Execution Error:', error);
      orderEvents.emit('bot.error', { botId: intent.botId, error: error.message });
      return { success: false, error: error.message };
    }
  }
};