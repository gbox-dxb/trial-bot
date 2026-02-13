import { orderRouter } from './orderRouter';
import { usePrice } from '@/contexts/PriceContext'; // Only valid in components
// For non-component usage, we expect caller to pass prices or router fetches them

/**
 * Main Entry Point for Order Execution
 * @param {Object} intent 
 * @param {Object} currentPrices - Map of symbol -> price (optional, but recommended for validation)
 */
export const executeOrder = async (intent, currentPrices = {}) => {
  // Basic Structural Validation
  const required = ['userId', 'exchangeAccountId', 'symbol', 'side', 'quantity'];
  const missing = required.filter(field => !intent[field]);
  
  if (missing.length > 0) {
    return { success: false, error: `Missing required fields: ${missing.join(', ')}` };
  }

  // Normalize
  const normalizedIntent = {
    orderType: 'Market',
    mode: 'Live', // Default to live unless account specifies Demo
    ...intent,
    side: intent.side.toUpperCase(),
    symbol: intent.symbol.toUpperCase()
  };

  return await orderRouter.executeOrder(normalizedIntent, currentPrices);
};