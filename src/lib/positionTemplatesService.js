import { v4 as uuidv4 } from 'uuid';

class PositionTemplatesService {
  constructor() {
    this.templates = this.loadTemplates();
    this.priceSubscriptions = new Map();
    this.mockPrices = {
      'BTCUSDT': { price: 45230.50, change24h: 2.45 },
      'ETHUSDT': { price: 2450.75, change24h: -1.23 },
      'BNBUSDT': { price: 312.40, change24h: 3.67 },
      'ADAUSDT': { price: 0.5234, change24h: 1.89 }
    };
  }

  loadTemplates() {
    const stored = localStorage.getItem('positionTemplates');
    return stored ? JSON.parse(stored) : [];
  }

  saveTemplates() {
    localStorage.setItem('positionTemplates', JSON.stringify(this.templates));
  }

  getTemplates() {
      return this.templates;
  }

  async fetchTemplates() {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...this.templates]), 100);
    });
  }

  async createTemplate(templateData) {
    return new Promise((resolve) => {
      const newTemplate = {
        id: uuidv4(),
        ...templateData,
        // Ensure selectedCoins is stored
        selectedCoins: templateData.selectedCoins || [],
        status: 'PENDING',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      this.templates.unshift(newTemplate);
      this.saveTemplates();
      setTimeout(() => resolve(newTemplate), 100);
    });
  }

  async updateTemplate(id, templateData) {
    return new Promise((resolve, reject) => {
      const index = this.templates.findIndex(t => t.id === id);
      if (index === -1) {
        return reject(new Error('Template not found'));
      }
      this.templates[index] = {
        ...this.templates[index],
        ...templateData,
        // Ensure selectedCoins is updated
        selectedCoins: templateData.selectedCoins || this.templates[index].selectedCoins || [],
        updatedAt: Date.now()
      };
      this.saveTemplates();
      setTimeout(() => resolve(this.templates[index]), 100);
    });
  }

  async deleteTemplate(id) {
    return new Promise((resolve, reject) => {
      const template = this.templates.find(t => t.id === id);
      if (!template) {
        return reject(new Error('Template not found'));
      }
      if (template.status === 'ACTIVE') {
        return reject(new Error('Cannot delete active template'));
      }
      this.templates = this.templates.filter(t => t.id !== id);
      this.saveTemplates();
      setTimeout(() => resolve(), 100);
    });
  }

  async fetchBinanceSymbols() {
    return new Promise((resolve) => {
      const symbols = [
        { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' },
        { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT' },
        { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT' },
        { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT' },
        { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT' },
        { symbol: 'DOGEUSDT', baseAsset: 'DOGE', quoteAsset: 'USDT' },
        { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT' },
        { symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT' },
        { symbol: 'MATICUSDT', baseAsset: 'MATIC', quoteAsset: 'USDT' },
        { symbol: 'LTCUSDT', baseAsset: 'LTC', quoteAsset: 'USDT' },
        { symbol: 'AVAXUSDT', baseAsset: 'AVAX', quoteAsset: 'USDT' },
        { symbol: 'LINKUSDT', baseAsset: 'LINK', quoteAsset: 'USDT' }
      ];
      setTimeout(() => resolve(symbols), 100);
    });
  }

  subscribeToPrice(symbol, callback) {
    const priceData = this.mockPrices[symbol] || { price: 0, change24h: 0 };
    
    callback(priceData);
    
    const interval = setInterval(() => {
      const randomChange = (Math.random() - 0.5) * 0.5;
      priceData.price = priceData.price * (1 + randomChange / 100);
      priceData.change24h = priceData.change24h + (Math.random() - 0.5) * 0.2;
      callback({ ...priceData });
    }, 3000);

    return () => clearInterval(interval);
  }
}

export const positionTemplatesService = new PositionTemplatesService();