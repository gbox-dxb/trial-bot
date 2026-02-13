import { useEffect, useRef } from 'react';
import { usePrice } from '@/contexts/PriceContext';
import { gridBotEngine } from '@/lib/gridBotEngine';

export function useGridBotMonitor() {
  const { prices } = usePrice();
  const processingRef = useRef(false);
  const pricesRef = useRef(prices);

  useEffect(() => {
    pricesRef.current = prices;
  }, [prices]);

  useEffect(() => {
    const processBots = async () => {
      if (processingRef.current) return;
      processingRef.current = true;

      try {
        const bots = gridBotEngine.getGridBots();
        const activeBots = bots.filter(b => b.status === 'active');
        const currentPrices = pricesRef.current;

        for (const bot of activeBots) {
          const currentPrice = currentPrices[bot.pair];
          if (currentPrice) {
            gridBotEngine.processPriceUpdate(bot, currentPrice);
          }
        }
      } catch (err) {
        console.error("Grid Bot Monitor Error:", err);
      } finally {
        processingRef.current = false;
      }
    };

    // Run frequently
    const interval = setInterval(processBots, 2000);
    return () => clearInterval(interval);
  }, []); // Empty dependency array
}