import { useEffect, useRef } from 'react';
import { usePrice } from '@/contexts/PriceContext';
import { dcaBotEngine } from '@/lib/dcaBotEngine';
import { storage } from '@/lib/storage';

export function useDCABotMonitor(onUpdate) {
  const { prices } = usePrice();
  const processingRef = useRef(false);
  const pricesRef = useRef(prices);
  const onUpdateRef = useRef(onUpdate);

  // Keep refs updated
  useEffect(() => {
    pricesRef.current = prices;
  }, [prices]);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    const process = async () => {
      if (processingRef.current) return;
      processingRef.current = true;

      try {
        const bots = storage.getDCABots();
        let hasChanges = false;
        const currentPrices = pricesRef.current;

        bots.forEach(bot => {
          if (bot.status === 'active' && currentPrices[bot.pair]) {
             const result = dcaBotEngine.checkTrigger(bot, currentPrices[bot.pair]);
             if (result) hasChanges = true;
          }
        });

        if (hasChanges && onUpdateRef.current) {
            onUpdateRef.current();
        }
      } catch (err) {
        console.error("DCA Bot Monitor Error:", err);
      } finally {
        processingRef.current = false;
      }
    };

    const interval = setInterval(process, 1000); // Check every second
    return () => clearInterval(interval);
  }, []); // Empty dependency array to prevent infinite loop
}