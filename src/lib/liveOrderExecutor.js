import { mexcService } from './mexcService';

// Utility to handle execution logic, safety checks, and logging for LIVE orders
export const liveOrderExecutor = {
  
  // Validate if balance is sufficient for the trade
  async validateBalance(exchangeAccount, amount, leverage) {
    if (!exchangeAccount) return { valid: false, error: "No account connected" };
    
    // In a real scenario, we'd fetch the specific coin balance (e.g., USDT)
    // For simulation, we check the account equity from the context/service
    const requiredMargin = amount / leverage;
    
    try {
        const balance = await mexcService.getAccountBalance(
            exchangeAccount.apiKeyEncrypted, 
            exchangeAccount.apiSecretEncrypted
        );
        
        // Assuming trading USDT-M Futures
        if (balance.USDT.available < requiredMargin) {
            return { valid: false, error: `Insufficient USDT Balance. Required: $${requiredMargin.toFixed(2)}, Available: $${balance.USDT.available.toFixed(2)}` };
        }
        
        return { valid: true };
    } catch (error) {
        console.error("Balance check failed", error);
        // Fallback for simulation if API fails
        return { valid: true, warning: "Could not verify balance real-time" };
    }
  },

  // Validate minimum order size (approximate for major pairs)
  validateOrderSize(pair, amount) {
    const minOrderSize = 5; // USDT
    if (amount < minOrderSize) {
        return { valid: false, error: `Amount $${amount} is below minimum order size ($${minOrderSize})` };
    }
    return { valid: true };
  },

  async placeMarketOrder(exchangeAccount, pair, side, amount, leverage) {
    console.log(`[LIVE EXECUTOR] Placing MARKET ${side} on ${pair} for $${amount} (Lev: ${leverage}x)`);
    
    try {
        // 1. Validate Keys presence
        if (!exchangeAccount.apiKeyEncrypted) throw new Error("Missing API Credentials");

        // 2. Execute
        const result = await mexcService.placeMarketOrder(
            exchangeAccount.apiKeyEncrypted, 
            exchangeAccount.apiSecretEncrypted, 
            pair, 
            side, 
            amount, 
            leverage
        );
        
        // 3. Log Success
        console.log(`[LIVE EXECUTOR] Order Filled:`, result);
        return { success: true, data: result };

    } catch (error) {
        console.error(`[LIVE EXECUTOR] Order Failed:`, error);
        return { success: false, error: error.message };
    }
  },

  async placeLimitOrder(exchangeAccount, pair, side, amount, price, leverage) {
    console.log(`[LIVE EXECUTOR] Placing LIMIT ${side} on ${pair} at $${price}`);
    try {
        const result = await mexcService.placeLimitOrder(
            exchangeAccount.apiKeyEncrypted, 
            exchangeAccount.apiSecretEncrypted, 
            pair, 
            side, 
            amount, 
            price, 
            leverage
        );
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
  },

  async closePosition(exchangeAccount, positionId) {
    console.log(`[LIVE EXECUTOR] Closing Position ${positionId}`);
    try {
        const result = await mexcService.closePosition(
            exchangeAccount.apiKeyEncrypted, 
            exchangeAccount.apiSecretEncrypted, 
            positionId
        );
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
  }
};