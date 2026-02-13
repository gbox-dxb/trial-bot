export class BinanceWebSocket {
  constructor() {
    this.ws = null;
    this.baseUrl = 'wss://stream.binance.com:9443/ws';
    this.subscriptions = new Set();
    this.subscriptionCounts = new Map(); // Reference counting for streams
    this.klineCallbacks = new Set();
    this.tickerCallbacks = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnected = false;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.ws = new WebSocket(this.baseUrl);

    this.ws.onopen = () => {
      console.log('Connected to Binance WebSocket');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.resubscribe();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing WS message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('Binance WebSocket Disconnected');
      this.isConnected = false;
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      this.ws.close();
    };
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const timeout = Math.pow(2, this.reconnectAttempts) * 1000;
      console.log(`Attempting reconnect in ${timeout}ms...`);
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, timeout);
    }
  }

  subscribe(streams) {
    if (!Array.isArray(streams)) streams = [streams];
    
    const streamsToSubscribe = [];

    streams.forEach(stream => {
      const currentCount = this.subscriptionCounts.get(stream) || 0;
      this.subscriptionCounts.set(stream, currentCount + 1);
      
      if (currentCount === 0) {
        this.subscriptions.add(stream);
        streamsToSubscribe.push(stream);
      }
    });

    if (streamsToSubscribe.length > 0 && this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      const msg = {
        method: 'SUBSCRIBE',
        params: streamsToSubscribe,
        id: Date.now()
      };
      this.ws.send(JSON.stringify(msg));
      console.log(`[WS] Subscribing to: ${streamsToSubscribe.join(', ')}`);
    }
  }

  unsubscribe(streams) {
    if (!Array.isArray(streams)) streams = [streams];
    
    const streamsToUnsubscribe = [];

    streams.forEach(stream => {
      const currentCount = this.subscriptionCounts.get(stream) || 0;
      if (currentCount > 0) {
        const newCount = currentCount - 1;
        this.subscriptionCounts.set(stream, newCount);
        
        if (newCount === 0) {
          this.subscriptions.delete(stream);
          streamsToUnsubscribe.push(stream);
        }
      }
    });

    if (streamsToUnsubscribe.length > 0 && this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      const msg = {
        method: 'UNSUBSCRIBE',
        params: streamsToUnsubscribe,
        id: Date.now()
      };
      this.ws.send(JSON.stringify(msg));
      console.log(`[WS] Unsubscribing from: ${streamsToUnsubscribe.join(', ')}`);
    }
  }

  resubscribe() {
    if (this.subscriptions.size > 0) {
      const streams = Array.from(this.subscriptions);
      const msg = {
        method: 'SUBSCRIBE',
        params: streams,
        id: Date.now()
      };
      this.ws.send(JSON.stringify(msg));
    }
  }

  handleMessage(data) {
    // Kline (Candlestick) Data
    if (data.e === 'kline') {
      const candle = {
        symbol: data.s,
        time: data.k.t / 1000,
        open: parseFloat(data.k.o),
        high: parseFloat(data.k.h),
        low: parseFloat(data.k.l),
        close: parseFloat(data.k.c),
        volume: parseFloat(data.k.v),
        isFinal: data.k.x,
        interval: data.k.i
      };
      this.klineCallbacks.forEach(cb => cb(candle));
    }
    
    // Ticker/Price Data
    if (data.e === '24hrTicker') {
      const ticker = {
        symbol: data.s,
        price: parseFloat(data.c),
        change: parseFloat(data.p),
        percent: parseFloat(data.P),
        high: parseFloat(data.h),
        low: parseFloat(data.l),
        volume: parseFloat(data.v),
        bid: parseFloat(data.b || data.c),
        ask: parseFloat(data.a || data.c)
      };
      this.tickerCallbacks.forEach(cb => cb(ticker));
    }
  }

  onKlineUpdate(callback) {
    this.klineCallbacks.add(callback);
    return () => this.klineCallbacks.delete(callback);
  }

  onTickerUpdate(callback) {
    this.tickerCallbacks.add(callback);
    return () => this.tickerCallbacks.delete(callback);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

export const binanceWS = new BinanceWebSocket();