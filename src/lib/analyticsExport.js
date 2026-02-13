export const analyticsExport = {
  exportToCSV(data) {
    if (!data) return;

    // 1. Prepare Trades CSV
    const tradeRows = [
      ['Date', 'Symbol', 'Type', 'Side', 'Price', 'Size', 'PnL', 'Status'],
      ...data.recentActivity.filter(i => i.pnl !== undefined).map(t => [
        new Date(t.timestamp || t.closedAt).toISOString(),
        t.symbol || t.pair,
        t.type,
        t.side,
        t.price || t.entryPrice,
        t.size || t.amount,
        t.pnl || t.finalPnL,
        t.status
      ])
    ];

    // 2. Prepare Coin Stats CSV
    const coinRows = [
      ['Symbol', 'Trades', 'Wins', 'Win Rate %', 'Total PnL', 'Volume', 'Best Trade'],
      ...data.coins.map(c => [
        c.symbol,
        c.trades,
        c.wins,
        c.winRate.toFixed(2),
        c.pnl.toFixed(2),
        c.volume.toFixed(2),
        c.bestTrade.toFixed(2)
      ])
    ];

    // Combine into one file (simple approach: just trades for now as it's most common, 
    // or we could do multiple files, but let's do a comprehensive single file with sections)
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    csvContent += "--- TRADING PERFORMANCE METRICS ---\n";
    csvContent += `Total PnL,${data.overview.totalPnL}\n`;
    csvContent += `Win Rate,${data.overview.winRate.toFixed(2)}%\n`;
    csvContent += `Total Trades,${data.overview.totalTrades}\n\n`;

    csvContent += "--- COIN PERFORMANCE ---\n";
    csvContent += coinRows.map(e => e.join(",")).join("\n");
    
    csvContent += "\n\n--- TRADE HISTORY ---\n";
    csvContent += tradeRows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.setAttribute("download", `trading_analytics_${timestamp}.csv`);
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
  }
};