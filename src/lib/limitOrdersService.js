import { v4 as uuidv4 } from 'uuid';

class LimitOrdersService {
  constructor() {
    this.orders = this.loadOrders();
    this.updateSubscribers = [];
  }

  loadOrders() {
    const stored = localStorage.getItem('limitOrders');
    return stored ? JSON.parse(stored) : [];
  }

  saveOrders() {
    localStorage.setItem('limitOrders', JSON.stringify(this.orders));
  }

  async fetchLimitOrders(filters) {
    return new Promise((resolve) => {
      let filtered = [...this.orders];

      if (filters.exchange !== 'ALL') {
        filtered = filtered.filter(o => o.exchange === filters.exchange);
      }

      if (filters.accountType !== 'ALL') {
        filtered = filtered.filter(o => o.accountType === filters.accountType);
      }

      if (filters.symbol) {
        filtered = filtered.filter(o => 
          o.symbol.toLowerCase().includes(filters.symbol.toLowerCase())
        );
      }

      if (filters.status && filters.status.length > 0) {
        filtered = filtered.filter(o => filters.status.includes(o.status));
      }

      setTimeout(() => resolve(filtered), 100);
    });
  }

  async createLimitOrder(orderData) {
    return new Promise((resolve) => {
      const newOrder = {
        id: uuidv4(),
        ...orderData,
        status: 'PENDING',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      this.orders.unshift(newOrder);
      this.saveOrders();
      setTimeout(() => resolve(newOrder), 100);
    });
  }

  async updateLimitOrder(id, orderData) {
    return new Promise((resolve, reject) => {
      const index = this.orders.findIndex(o => o.id === id);
      if (index === -1) {
        return reject(new Error('Order not found'));
      }
      if (this.orders[index].status === 'PLACED' || this.orders[index].status === 'FILLED') {
        return reject(new Error('Cannot edit placed or filled orders'));
      }
      this.orders[index] = {
        ...this.orders[index],
        ...orderData,
        updatedAt: Date.now()
      };
      this.saveOrders();
      setTimeout(() => resolve(this.orders[index]), 100);
    });
  }

  async placeLimitOrder(id) {
    return new Promise((resolve, reject) => {
      const index = this.orders.findIndex(o => o.id === id);
      if (index === -1) {
        return reject(new Error('Order not found'));
      }
      this.orders[index].status = 'PLACED';
      this.orders[index].placedAt = Date.now();
      this.saveOrders();
      this.notifySubscribers({ orderId: id, status: 'PLACED' });
      setTimeout(() => resolve(this.orders[index]), 100);
    });
  }

  async cancelLimitOrder(id) {
    return new Promise((resolve, reject) => {
      const index = this.orders.findIndex(o => o.id === id);
      if (index === -1) {
        return reject(new Error('Order not found'));
      }
      if (this.orders[index].status === 'FILLED') {
        return reject(new Error('Cannot cancel filled orders'));
      }
      this.orders[index].status = 'CANCELLED';
      this.orders[index].cancelledAt = Date.now();
      this.saveOrders();
      this.notifySubscribers({ orderId: id, status: 'CANCELLED' });
      setTimeout(() => resolve(), 100);
    });
  }

  subscribeToPrices(callback) {
    this.updateSubscribers.push(callback);
    return () => {
      this.updateSubscribers = this.updateSubscribers.filter(cb => cb !== callback);
    };
  }

  notifySubscribers(update) {
    this.updateSubscribers.forEach(callback => callback(update));
  }
}

export const limitOrdersService = new LimitOrdersService();