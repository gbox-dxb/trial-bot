import React, { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { binanceApi } from '@/lib/binanceApi';
import { binanceWS } from '@/lib/binanceWebSocket';
import { Loader2 } from 'lucide-react';
import { generateMockCandles } from '@/lib/mockData';

// Helper to ensure data validity for lightweight-charts
const cleanData = (data) => {
  if (!Array.isArray(data)) return [];
  const uniqueMap = new Map();
  data.forEach(item => {
    if (item && (typeof item.time === 'number' || typeof item.time === 'string')) {
      const time = Math.floor(Number(item.time));
      if (!isNaN(time) && time > 0) {
        uniqueMap.set(time, { ...item, time });
      }
    }
  });
  return Array.from(uniqueMap.values()).sort((a, b) => a.time - b.time);
};

export default function PriceMovementChart({ 
  symbol = 'BTCUSDT', 
  timeframe = '15m', 
  referencePrice, 
  thresholdUp, 
  thresholdDown 
}) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef({ candle: null, lines: [] });
  const [isLoading, setIsLoading] = React.useState(true);

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: { 
          background: { type: ColorType.Solid, color: 'transparent' }, 
          textColor: '#9CA3AF' 
      },
      grid: {
        vertLines: { color: 'rgba(139, 92, 246, 0.1)' },
        horzLines: { color: 'rgba(139, 92, 246, 0.1)' },
      },
      timeScale: { 
          borderColor: 'rgba(139, 92, 246, 0.2)', 
          timeVisible: true 
      },
      rightPriceScale: { borderColor: 'rgba(139, 92, 246, 0.2)' },
    });

    chartRef.current = chart;
    seriesRef.current.candle = chart.addCandlestickSeries({
      upColor: '#10B981', downColor: '#EF4444',
      borderUpColor: '#10B981', borderDownColor: '#EF4444',
      wickUpColor: '#10B981', wickDownColor: '#EF4444',
    });

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []);

  // Fetch & Subscribe
  useEffect(() => {
    let isActive = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        let data = await binanceApi.fetchCandleData(symbol, timeframe);
        if (!data || data.length === 0) data = generateMockCandles(symbol, timeframe);
        
        if (isActive && chartRef.current) {
          seriesRef.current.candle.setData(cleanData(data));
          
          // Safe fit content
          try {
            chartRef.current.timeScale().fitContent();
          } catch (e) {
            console.warn("Failed to fit content", e);
          }
          
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to load price movement chart data", error);
        setIsLoading(false);
      }
    };

    loadData();

    const stream = `${symbol.toLowerCase()}@kline_${timeframe}`;
    binanceWS.subscribe(stream);
    
    const cleanup = binanceWS.onKlineUpdate((kline) => {
        if (kline.symbol !== symbol) return;
        if (seriesRef.current.candle) {
            const validTime = Math.floor(Number(kline.time));
            if (!isNaN(validTime)) {
              seriesRef.current.candle.update({ ...kline, time: validTime });
            }
        }
    });

    return () => {
        isActive = false;
        binanceWS.unsubscribe(stream);
        cleanup();
    };
  }, [symbol, timeframe]);

  // Update Threshold Lines
  useEffect(() => {
      if (!seriesRef.current.candle) return;
      
      // Clear existing lines
      try {
        seriesRef.current.lines.forEach(l => {
            try {
                seriesRef.current.candle.removePriceLine(l);
            } catch(e) { /* ignore */ }
        });
      } catch(e) { /* ignore */ }
      
      seriesRef.current.lines = [];

      if (referencePrice) {
          const refLine = seriesRef.current.candle.createPriceLine({
              price: referencePrice,
              color: '#d1d5db', // Gray-300
              lineWidth: 1,
              lineStyle: 2, // Dashed
              axisLabelVisible: true,
              title: 'REF',
          });
          seriesRef.current.lines.push(refLine);

          if (thresholdUp) {
              const upLine = seriesRef.current.candle.createPriceLine({
                  price: thresholdUp,
                  color: '#10B981', // Green
                  lineWidth: 2,
                  lineStyle: 1, // Dotted
                  axisLabelVisible: true,
                  title: 'TRIGGER UP',
              });
              seriesRef.current.lines.push(upLine);
          }

          if (thresholdDown) {
              const downLine = seriesRef.current.candle.createPriceLine({
                  price: thresholdDown,
                  color: '#EF4444', // Red
                  lineWidth: 2,
                  lineStyle: 1,
                  axisLabelVisible: true,
                  title: 'TRIGGER DOWN',
              });
              seriesRef.current.lines.push(downLine);
          }
      }

  }, [referencePrice, thresholdUp, thresholdDown]);

  return (
    <div className="relative w-full h-full bg-slate-900/50 rounded-xl border border-purple-500/20 p-4">
       {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-20 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
       )}
       <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
}