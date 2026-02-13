/**
 * Calculates unrealized PnL for a position
 * @param {string} direction 'LONG' or 'SHORT'
 * @param {number} entryPrice Entry price of the position
 * @param {number} currentPrice Current market price
 * @param {number} quantity Position size in units of asset
 * @returns {object} { pnl: number, percentage: number }
 */
export const calculateUnrealizedPnL = (direction, entryPrice, currentPrice, quantity, initialMargin) => {
    if (!entryPrice || !currentPrice || !quantity) {
        return { pnl: 0, percentage: 0 };
    }

    let pnl = 0;
    
    if (direction === 'LONG') {
        pnl = (currentPrice - entryPrice) * quantity;
    } else {
        pnl = (entryPrice - currentPrice) * quantity;
    }

    // Percentage based on initial margin used
    const percentage = initialMargin > 0 ? (pnl / initialMargin) * 100 : 0;

    return {
        pnl,
        percentage
    };
};