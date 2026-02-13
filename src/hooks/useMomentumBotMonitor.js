import { useEffect, useRef } from 'react';
import { storage } from '@/lib/storage';
import { momentumBotEngine } from '@/lib/momentumBotEngine';
import { useToast } from '@/components/ui/use-toast';
import { binanceWS } from '@/lib/binanceWebSocket';

export function useMomentumBotMonitor() {
  const { toast } = useToast();
  const activeSubscriptions = useRef(new Set());
  
  // 1. Manage Subscriptions
  useEffect(() => {
    const manageSubscriptions = () => {
        // Only monitor Waiting bots
        const bots = storage.getMomentumBots().filter(b => b.status === 'Waiting');
        const neededStreams = new Set();
        
        bots.forEach(bot => {
            if (bot.pair && bot.timeframe) {
                const streamName = `${bot.pair.toLowerCase()}@kline_${bot.timeframe}`;
                neededStreams.add(streamName);
            }
        });

        // Subscribe new
        const toSubscribe = [];
        neededStreams.forEach(stream => {
            if (!activeSubscriptions.current.has(stream)) {
                toSubscribe.push(stream);
                activeSubscriptions.current.add(stream);
                console.log(`[Monitor] Subscribing to stream: ${stream}`);
            }
        });

        if (toSubscribe.length > 0) {
            binanceWS.subscribe(toSubscribe);
        }
    };

    const interval = setInterval(manageSubscriptions, 3000); 
    manageSubscriptions(); 

    return () => clearInterval(interval);
  }, []);

  // 2. Process Real-time Updates
  useEffect(() => {
    const handleKlineUpdate = (kline) => {
        // kline: { symbol: 'BTCUSDT', interval: '1m', open, close, ... }
        
        const bots = storage.getMomentumBots().filter(b => b.status === 'Waiting');
        
        bots.forEach(bot => {
            // Precise matching
            if (bot.pair === kline.symbol && bot.timeframe === kline.interval) {
                
                // Debug log occasionally or on significant moves
                // console.log(`[Monitor] ${bot.pair}: Close=${kline.close}`);
                
                const trigger = momentumBotEngine.checkTriggers(bot, kline);
                
                if (trigger) {
                    console.log(`[Monitor] >>> TRIGGER CONFIRMED for ${bot.pair} <<<`);
                    const result = momentumBotEngine.executeTrade(bot, trigger);
                    
                    if (result && result.order) {
                        toast({
                            title: `Momentum Triggered: ${bot.pair}`,
                            description: `Moved $${Math.abs(trigger.delta).toFixed(2)} in ${bot.timeframe}. Order Placed.`,
                            className: "bg-emerald-600 text-white border-emerald-700 font-medium"
                        });
                    } else {
                         console.warn(`[Monitor] Trigger fired but execution failed or blocked.`);
                    }
                }
            }
        });
    };

    const cleanup = binanceWS.onKlineUpdate(handleKlineUpdate);
    return () => cleanup();
  }, [toast]);
}