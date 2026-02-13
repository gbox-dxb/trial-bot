import { useEffect, useRef } from 'react';
import { storage } from '@/lib/storage';
import { candleStrikeBotEngine } from '@/lib/candleStrikeBotEngine';
import { useToast } from '@/components/ui/use-toast';
import { binanceWS } from '@/lib/binanceWebSocket';
import { binanceApi } from '@/lib/binanceApi';

export function useCandleStrikeMonitor() {
  const { toast } = useToast();
  const activeSubscriptions = useRef(new Set());
  const candleCache = useRef(new Map()); // Key format: "SYMBOL:TIMEFRAME"

  useEffect(() => {
    // Function to manage subscriptions based on active bots
    const manageSubscriptions = async () => {
        // We only need to monitor for bots that are waiting or active (for chart data)
        const bots = storage.getCandleStrikeBots().filter(b => b.status === 'WAITING' || b.status === 'ACTIVE');
        
        const neededStreams = new Set();
        
        bots.forEach(bot => {
            if (bot.pair && bot.timeframe) {
                // Construct stream name strictly based on bot's timeframe
                const streamKey = `${bot.pair.toLowerCase()}@kline_${bot.timeframe}`;
                neededStreams.add(streamKey);
                
                // Initialize cache if missing to ensure we have history for consecutive check
                const cacheKey = `${bot.pair}:${bot.timeframe}`;
                if (!candleCache.current.has(cacheKey)) {
                    // Fetch initial historic data (last 30 candles)
                    binanceApi.fetchCandleData(bot.pair, bot.timeframe, 30).then(data => {
                        if (data && data.length > 0) {
                             candleCache.current.set(cacheKey, data);
                        }
                    });
                }
            }
        });

        // Subscribe to new needed streams
        const toSubscribe = [];
        neededStreams.forEach(stream => {
            if (!activeSubscriptions.current.has(stream)) {
                toSubscribe.push(stream);
                activeSubscriptions.current.add(stream);
            }
        });

        if (toSubscribe.length > 0) {
            binanceWS.subscribe(toSubscribe);
        }
    };

    const interval = setInterval(manageSubscriptions, 5000); 
    manageSubscriptions(); 

    return () => clearInterval(interval);
  }, []);

  // Process Real-time Updates
  useEffect(() => {
    const handleKlineUpdate = (kline) => {
        // Cache Key MUST include timeframe to separate 1m data from 5m data
        const cacheKey = `${kline.symbol}:${kline.interval}`;
        let currentCandles = candleCache.current.get(cacheKey) || [];

        // Update local cache logic
        const lastCandle = currentCandles[currentCandles.length - 1];
        const newTime = kline.time; 
        
        let updatedCandles = [...currentCandles];
        
        if (lastCandle && Math.abs(lastCandle.time - newTime) < 2) {
             // Update current candle
             updatedCandles[updatedCandles.length - 1] = kline;
        } else {
             // New candle formed
             updatedCandles.push(kline);
        }
        
        // Keep cache size manageable
        if (updatedCandles.length > 50) updatedCandles = updatedCandles.slice(-50);
        
        candleCache.current.set(cacheKey, updatedCandles);
        
        // Independent Bot Monitoring
        // Iterate through all WAITING bots
        const bots = storage.getCandleStrikeBots().filter(b => b.status === 'WAITING');
        
        bots.forEach(bot => {
            // Strict matching: Symbol AND Timeframe
            if (bot.pair === kline.symbol && bot.timeframe === kline.interval) {
                // Pass the specific candle history for this bot's timeframe.
                // NOTE: updatedCandles includes the current forming candle at the end.
                candleStrikeBotEngine.checkTrigger(bot, updatedCandles).then(result => {
                    if (result && result.order) {
                        toast({
                            title: `Candle Strategy Executed!`,
                            description: `${bot.pair}: ${bot.candleCount} ${bot.candleColor} candles target reached. Order executed.`,
                            className: "bg-emerald-600 text-white border-emerald-700 font-medium"
                        });
                    }
                });
            }
        });
    };

    const cleanup = binanceWS.onKlineUpdate(handleKlineUpdate);
    return () => cleanup();
  }, [toast]);
}