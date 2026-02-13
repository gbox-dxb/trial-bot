import { useEffect, useRef, useState } from 'react';
import { storage } from '@/lib/storage';
import { binanceApi } from '@/lib/binanceApi';
import { rsiTradingLogic } from '@/lib/rsiTradingLogic';
import { useToast } from '@/components/ui/use-toast';

export function useRSIBotMonitor() {
  const { toast } = useToast();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const processingRef = useRef(false);

  useEffect(() => {
    const monitorBots = async () => {
      if (processingRef.current) return;
      processingRef.current = true;

      try {
        const bots = storage.getRSIBots();
        // Monitor Waiting/Active. We must continually scan 'Active' bots too if they allow multiple trades (controlled by One Trade At A Time),
        // but typically a bot that just fired becomes 'Active'. In this system, 'Active' just means it has history. 
        // We continue scanning unless Stopped.
        const monitorableBots = bots.filter(b => b.status !== 'Stopped');

        if (monitorableBots.length === 0) {
          processingRef.current = false;
          return;
        }

        let hasUpdates = false;
        
        for (const bot of monitorableBots) {
          // 0. Daily Reset Check
          const resetCheck = rsiTradingLogic.resetDailyTradeCount(bot);
          if (resetCheck.needsReset) {
              bot.dailyTradeCount = 0;
              bot.lastResetDate = resetCheck.today;
              hasUpdates = true;
          }

          // 1. Fetch data - Increased to 200 for better RSI accuracy
          const candles = await binanceApi.fetchCandleData(bot.pair, bot.timeframe, 200);
          if (!candles || candles.length < bot.rsiLength + 2) continue;

          // 2. Calculate RSI
          const rsiData = rsiTradingLogic.calculateRSI(candles, bot.rsiLength);
          if (rsiData.length < 2) continue;

          const currentRSI = rsiData[rsiData.length - 1].value;
          const previousRSI = rsiData[rsiData.length - 2].value;
          const currentPrice = candles[candles.length - 1].close;

          if (!bot.lastRSI || Math.abs(bot.lastRSI - currentRSI) > 0.1) {
              bot.lastRSI = currentRSI;
              hasUpdates = true;
          }

          // 3. Check Triggers strictly
          const isTriggered = rsiTradingLogic.checkRSITrigger(
            currentRSI, 
            previousRSI, 
            bot.triggerType, 
            bot.rsiValue, 
            bot.triggerMode || 'Touches'
          );

          if (isTriggered) {
             // 4. RISK MANAGEMENT VALIDATION
             const cooldownCheck = rsiTradingLogic.validateCooldown(bot);
             if (!cooldownCheck.valid) {
                 // Log quietly to avoid spamming console
                 if (!bot.lastLog || Date.now() - bot.lastLog > 10000) {
                    console.log(`[RSI Monitor] Skipped ${bot.pair}: ${cooldownCheck.reason}`);
                    bot.lastLog = Date.now();
                 }
                 continue; 
             }

             const oneTradeCheck = rsiTradingLogic.validateOneTradeAtATime(bot);
             if (!oneTradeCheck.valid) {
                 if (!bot.lastLog || Date.now() - bot.lastLog > 10000) {
                    console.log(`[RSI Monitor] Skipped ${bot.pair}: ${oneTradeCheck.reason}`);
                    bot.lastLog = Date.now();
                 }
                 continue;
             }
             
             const dailyLimitCheck = rsiTradingLogic.validateMaxTradesPerDay(bot);
             if (!dailyLimitCheck.valid) {
                 if (!bot.lastLog || Date.now() - bot.lastLog > 10000) {
                     console.log(`[RSI Monitor] Skipped ${bot.pair}: ${dailyLimitCheck.reason}`);
                     bot.lastLog = Date.now();
                 }
                 continue;
             }

             console.log(`[RSI Monitor] Trigger detected for ${bot.pair} (${bot.triggerMode}). RSI: ${currentRSI.toFixed(2)} (Prev: ${previousRSI.toFixed(2)})`);
             
             // 5. Execute Strategy IMMEDIATELY
             const order = rsiTradingLogic.executeRSIStrategy(bot, currentPrice, currentRSI);

             if (order) {
                 const now = Date.now();
                 bot.lastTriggerTime = now;
                 bot.lastOrderTime = now; // Update for cooldown
                 bot.activeOrdersCount = (bot.activeOrdersCount || 0) + 1;
                 bot.dailyTradeCount = (bot.dailyTradeCount || 0) + 1;
                 bot.status = 'Active'; 
                 bot.lastActiveTime = now;
                 
                 toast({
                   title: "RSI Trigger Executed",
                   description: `${bot.pair} ${bot.triggerMode === 'Crosses' ? 'crossed' : 'touched'} ${bot.rsiValue}. Order placed!`,
                   className: "bg-emerald-900 border-emerald-800 text-white"
                 });
                 
                 hasUpdates = true;
             }
          }
        }
        
        if (hasUpdates) {
            setRefreshTrigger(p => p + 1);
            // Bulk update
            const allBots = storage.getRSIBots();
            const updatedBots = allBots.map(b => {
                 const updatedBot = monitorableBots.find(rb => rb.id === b.id);
                 return updatedBot || b;
             });
            storage.saveRSIBots(updatedBots);
        }

      } catch (err) {
        console.error("RSI Monitor Error:", err);
      } finally {
        processingRef.current = false;
      }
    };

    const interval = setInterval(monitorBots, 3000);
    return () => clearInterval(interval);
  }, [toast]);

  return { refreshTrigger };
}