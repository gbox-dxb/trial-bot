import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'mexc-trading-platform-secret-key-2026';

export const storage = {
  // Encrypt sensitive data
  encrypt(data) {
    try {
      return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
    } catch (e) {
      console.error("Encryption failed", e);
      return JSON.stringify(data);
    }
  },

  // Decrypt sensitive data
  decrypt(encryptedData) {
    try {
      if (!encryptedData) return null;
      if (encryptedData.trim().startsWith('[') || encryptedData.trim().startsWith('{')) {
          return JSON.parse(encryptedData);
      }
      const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted ? JSON.parse(decrypted) : null;
    } catch (error) {
      return null;
    }
  },

  // --- User Management ---
  getUser() {
    const data = localStorage.getItem('user');
    return data ? JSON.parse(data) : null;
  },

  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  // --- Active Orders / Positions ---
  getActiveOrders() {
    const data = localStorage.getItem('activeOrders');
    return data ? JSON.parse(data) : [];
  },

  // Generic save method for Order Router
  saveOrder(order) {
    // We treat all live orders (Market/Limit) as "Active" in the system until Closed
    this.saveActiveOrder(order);
  },

  saveActiveOrder(order) {
    const orders = this.getActiveOrders();
    // Prevent duplicates if possible
    const existing = orders.find(o => o.id === order.id);
    if (!existing) {
        orders.unshift(order);
        localStorage.setItem('activeOrders', JSON.stringify(orders));
    }
  },

  updateActiveOrder(orderId, updates) {
    const orders = this.getActiveOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates };
      localStorage.setItem('activeOrders', JSON.stringify(orders));
      return true;
    }
    return false;
  },

  deleteActiveOrder(orderId) {
    const orders = this.getActiveOrders();
    const filtered = orders.filter(o => o.id !== orderId);
    localStorage.setItem('activeOrders', JSON.stringify(filtered));
  },

  // --- Closed Orders / History ---
  saveClosedOrder(order) {
    const orders = this.getClosedOrders();
    orders.unshift(order);
    localStorage.setItem('closedOrders', JSON.stringify(orders.slice(0, 1000))); // Limit history
  },

  getClosedOrders() {
    const data = localStorage.getItem('closedOrders');
    return data ? JSON.parse(data) : [];
  },

  // --- Bot Linked Orders ---
  getBotOrders(botId) {
    const active = this.getActiveOrders().filter(o => o.botId === botId);
    const closed = this.getClosedOrders().filter(o => o.botId === botId);
    return [...active, ...closed];
  },

  getBotOrderStats(botId) {
    const orders = this.getBotOrders(botId);
    return {
      total: orders.length,
      active: orders.filter(o => o.status === 'ACTIVE' || o.status === 'PLACED').length,
      closed: orders.filter(o => o.status === 'CLOSED' || o.status === 'FILLED').length
    };
  },

  // --- Positions (Legacy/Context compatibility) ---
  savePositions(positions) {
    localStorage.setItem('positions', JSON.stringify(positions));
  },

  setPositions(positions) {
    this.savePositions(positions);
  },

  getPositions() {
    const data = localStorage.getItem('positions');
    return data ? JSON.parse(data) : [];
  },

  // --- Trades ---
  getTrades() {
    const data = localStorage.getItem('trades');
    return data ? JSON.parse(data) : [];
  },

  setTrades(trades) {
    localStorage.setItem('trades', JSON.stringify(trades));
  },

  // --- Bot Specific Trades ---
  getPriceMovementTrades() {
    const data = localStorage.getItem('priceMovementTrades');
    return data ? JSON.parse(data) : [];
  },

  setPriceMovementTrades(trades) {
    localStorage.setItem('priceMovementTrades', JSON.stringify(trades));
  },

  getDCATrades() {
    const data = localStorage.getItem('dcaTrades');
    return data ? JSON.parse(data) : [];
  },

  setDCATrades(trades) {
    localStorage.setItem('dcaTrades', JSON.stringify(trades));
  },

  // --- DCA Order Links & Stats ---
  saveDCAOrderLink(orderId, dcaBotId) {
    const links = this._get('dcaOrderLinks');
    links.push({ orderId, dcaBotId, timestamp: Date.now() });
    this._save('dcaOrderLinks', links);
  },

  getDCAOrders(dcaBotId) {
      const active = this.getActiveOrders().filter(o => o.dcaBotId === dcaBotId);
      const closed = this.getClosedOrders().filter(o => o.dcaBotId === dcaBotId);
      return [...active, ...closed];
  },

  getDCAStatistics(dcaBotId) {
      const orders = this.getDCAOrders(dcaBotId);
      const filled = orders.filter(o => o.status === 'FILLED' || o.status === 'CLOSED');
      const pending = orders.filter(o => o.status === 'OPEN' || o.status === 'PENDING');
      
      const totalInvested = filled.reduce((sum, o) => sum + (o.filledSize || o.size || 0) * (o.avgFillPrice || o.price || 0), 0);
      
      return {
          totalInvested,
          ordersExecuted: filled.length,
          pendingOrders: pending.length
      };
  },

  // --- PnL History ---
  getPnLHistory() {
    const data = localStorage.getItem('pnlHistory');
    return data ? JSON.parse(data) : [];
  },

  setPnLHistory(history) {
    localStorage.setItem('pnlHistory', JSON.stringify(history));
  },

  // --- Exchange Accounts ---
  getExchanges() {
    const data = localStorage.getItem('exchangeAccounts_user-1');
    return data ? JSON.parse(data) : [];
  },
  
  setExchanges(exchanges) {
     localStorage.setItem('exchangeAccounts_user-1', JSON.stringify(exchanges));
  },

  // --- Bot Storage ---
  setBots(bots) {
    if (!bots) return;
    if (typeof bots === 'object' && !Array.isArray(bots)) {
      if (bots.momentumBots) this.saveMomentumBots(bots.momentumBots);
      if (bots.rsiBots) this.saveRSIBots(bots.rsiBots);
      if (bots.candleStrikeBots) this.saveCandleStrikeBots(bots.candleStrikeBots);
      if (bots.gridBots) this.saveGridBots(bots.gridBots);
      if (bots.dcaBots) this.saveDCABots(bots.dcaBots);
      if (bots.priceMovementBots) this.savePriceMovementBots(bots.priceMovementBots);
      return;
    }
    if (Array.isArray(bots)) {
        const momentum = bots.filter(b => b.type === 'MOMENTUM');
        const rsi = bots.filter(b => b.type === 'RSI');
        const candle = bots.filter(b => b.type === 'CANDLE_STRIKE');
        const grid = bots.filter(b => b.type === 'GRID');
        const dca = bots.filter(b => b.type === 'DCA');
        const pm = bots.filter(b => b.type === 'PRICE_MOVEMENT');

        if (momentum.length) this.saveMomentumBots(momentum);
        if (rsi.length) this.saveRSIBots(rsi);
        if (candle.length) this.saveCandleStrikeBots(candle);
        if (grid.length) this.saveGridBots(grid);
        if (dca.length) this.saveDCABots(dca);
        if (pm.length) this.savePriceMovementBots(pm);
    }
  },

  getMomentumBots() { return this._get('momentumBots'); },
  saveMomentumBots(bots) { this._save('momentumBots', bots); },
  deleteMomentumBot(id) { this._delete('momentumBots', id); },
  
  getRSIBots() { return this._get('rsiBots'); },
  saveRSIBots(bots) { this._save('rsiBots', bots); },
  deleteRSIBot(id) { this._delete('rsiBots', id); },
  updateRSIBot(id, updates) { this._update('rsiBots', id, updates); },
  
  getCandleStrikeBots() { return this._get('candleStrikeBots'); },
  saveCandleStrikeBots(bots) { this._save('candleStrikeBots', bots); },
  deleteCandleStrikeBot(id) { this._delete('candleStrikeBots', id); },
  
  getGridBots() { return this._get('gridBots'); },
  saveGridBots(bots) { this._save('gridBots', bots); },
  deleteGridBot(id) { this._delete('gridBots', id); },
  
  getPriceMovementBots() { return this._get('priceMovementBots'); },
  savePriceMovementBots(bots) { this._save('priceMovementBots', bots); },
  deletePriceMovementBot(id) { this._delete('priceMovementBots', id); },
  
  getDCABots() { return this._get('dcaBots'); },
  saveDCABots(bots) { this._save('dcaBots', bots); },
  deleteDCABot(id) { this._delete('dcaBots', id); },

  // Helper
  _get(key) {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : [];
  },
  _save(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },
  _delete(key, id) {
    const items = this._get(key);
    const filtered = items.filter(i => i.id !== id);
    this._save(key, filtered);
  },
  _update(key, id, updates) {
      const items = this._get(key);
      const index = items.findIndex(i => i.id === id);
      if (index !== -1) {
          items[index] = { ...items[index], ...updates };
          this._save(key, items);
      }
  }
};