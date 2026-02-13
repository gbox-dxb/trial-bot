// Browser-compatible Event Emitter implementation
// Replaces Node.js 'events' module for client-side compatibility

class BrowserEventEmitter {
  constructor() {
    this.events = {};
    this.eventHistory = [];
    this.MAX_HISTORY = 100;
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  off(event, listenerToRemove) {
    if (!this.events[event]) return this;
    this.events[event] = this.events[event].filter(listener => listener !== listenerToRemove);
    return this;
  }

  emit(event, data) {
    const timestamp = Date.now();
    const eventData = { ...data, timestamp, event };
    
    // Store in history
    this.eventHistory.unshift(eventData);
    if (this.eventHistory.length > this.MAX_HISTORY) {
      this.eventHistory.pop();
    }

    if (!this.events[event]) return false;

    this.events[event].forEach(listener => {
      try {
        listener(eventData);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });

    return true;
  }

  getHistory() {
    return this.eventHistory;
  }
  
  // Alias for 'off' to maintain compatibility with some Node patterns if needed
  removeListener(event, listener) {
    return this.off(event, listener);
  }
  
  // Alias for 'on'
  addListener(event, listener) {
    return this.on(event, listener);
  }
}

// Singleton instance
export const orderEvents = new BrowserEventEmitter();