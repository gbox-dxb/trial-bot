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

      // Hedge Mode Side Support
      if (!intent.positionSide && intent.marketType === 'Futures') {
        intent.positionSide = (rawSide === 'LONG' || rawSide === 'BUY') ? 'LONG' : 'SHORT';
      }

      // 4. Mode Injection
      if (!intent.mode) intent.mode = credentials.mode;

      // 5. Account Setup (Futures only)
      let symbolInfo = null;
      if (credentials.marketType === 'Futures') {
        const marginMode = credentials.marginMode || 'CROSS';

        // A. Fetch Symbol Constraints (Selective Failure Fix)
        if (connector.getSymbolInfo) {
          symbolInfo = await connector.getSymbolInfo(intent.symbol, credentials);
        }

        // B. Instrumentation (Per User Request)
        console.log(`[OrderRouter] Symbol Constraints for ${intent.symbol}:`, symbolInfo);

        // C. Auto-Adjustment (Min Qty & Notional)
        if (symbolInfo) {
          // Adjust for stepSize and minQty
          intent.quantity = orderValidationUtils.formatQuantity(intent.quantity, intent.symbol, symbolInfo);

          // Adjust for minNotional
          intent.quantity = orderValidationUtils.adjustToMinNotional(
            intent.quantity,
            intent.price,
            symbolInfo.minNotional,
            symbolInfo.stepSize
          );
        }

        // D. Ensure Margin Mode
        if (connector.setMarginMode) {
          await connector.setMarginMode(intent.symbol, marginMode, credentials);
        }

        // E. Ensure Leverage
        if (intent.leverage) {
          await connector.setLeverage(intent.symbol, intent.leverage, credentials);
        }

        // F. Final Payload Log
        console.log('[OrderRouter] Final Order Payload:', JSON.stringify({
          symbol: intent.symbol,
          side: intent.side,
          positionSide: intent.positionSide,
          quantity: intent.quantity,
          leverage: intent.leverage,
          notional: (intent.quantity * intent.price).toFixed(2),
          requiredMargin: (intent.quantity * intent.price / intent.leverage).toFixed(2)
        }, null, 2));
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