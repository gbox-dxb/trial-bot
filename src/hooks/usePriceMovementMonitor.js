import { useEffect, useRef } from 'react';
import { usePrice } from '@/contexts/PriceContext';
import { priceMovementBotEngine } from '@/lib/priceMovementBotEngine';

export function usePriceMovementMonitor(onActivity) {
  const { prices } = usePrice();
  const processingRef = useRef(false);
  const pricesRef = useRef(prices);
  const onActivityRef = useRef(onActivity);

  useEffect(() => {
    pricesRef.current = prices;
  }, [prices]);

  useEffect(() => {
    onActivityRef.current = onActivity;
  }, [onActivity]);

  useEffect(() => {
    const process = async () => {
      if (processingRef.current) return;
      processingRef.current = true;

      try {
        const currentPrices = pricesRef.current;
        const hasActivity = priceMovementBotEngine.processPriceUpdates(currentPrices);
        if (hasActivity && onActivityRef.current) {
            onActivityRef.current();
        }
      } catch (err) {
        console.error("PM Bot Monitor Error:", err);
      } finally {
        processingRef.current = false;
      }
    };

    const interval = setInterval(process, 1000); // Check every second
    return () => clearInterval(interval);
  }, []); // Empty dependency
}