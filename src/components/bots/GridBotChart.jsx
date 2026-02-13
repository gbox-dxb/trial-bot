import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { binanceApi } from '@/lib/binanceApi';
import { binanceWS } from '@/lib/binanceWebSocket';
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
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

export default function GridBotChart({ 
  symbol = 'BTCUSDT', 
  timeframe = '15m',
  lowerPrice, 
  upperPrice, 
  gridCount, 
  entryPrice,
  tpPrice,
  slPrice
}) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef({ candle: null, gridLines: [] });
  const resizeObserverRef = useRef(null);
  
  const { themeData } = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Cleanup previous chart instance
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const { clientWidth, clientHeight } = chartContainerRef.current;
    
    // Default colors from theme
    const textColor = themeData.colors['--muted'];
    const gridColor = themeData.colors['--border'];
    const upColor = themeData.colors['--success'];
    const downColor = themeData.colors['--danger'];
    const bgColor = 'transparent';

    const chart = createChart(chartContainerRef.current, {
      width: clientWidth || 600,
      height: clientHeight || 400,
      layout: { 
        background: { type: ColorType.Solid, color: bgColor }, 
        textColor 
      },
      grid: { 
        vertLines: { color: gridColor }, 
        horzLines: { color: gridColor } 
      },
      timeScale: { 
        borderColor: gridColor, 
        timeVisible: true,
        rightOffset: 12,
      },
      rightPriceScale: {
        borderColor: gridColor,
      },
      crosshair: {
        mode: 1, // Normal mode
      },
    });

    chartRef.current = chart;

    seriesRef.current.candle = chart.addCandlestickSeries({
      upColor, 
      downColor, 
      borderUpColor: upColor, 
      borderDownColor: downColor, 
      wickUpColor: upColor, 
      wickDownColor: downColor,
    });

    // Resize Observer for responsive chart
    resizeObserverRef.current = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width === 0 || height === 0) return;
      
      if (chartRef.current) {
        chartRef.current.applyOptions({ width, height });
      }
    });

    resizeObserverRef.current.observe(chartContainerRef.current);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [themeData]);

  // Data Fetching
  useEffect(() => {
    let isActive = true;
    
    const loadData = async () => {
      if (!chartRef.current || !seriesRef.current.candle) return;

      setIsLoading(true);
      try {
        let data = await binanceApi.fetchCandleData(symbol, timeframe);
        
        // Fallback to mock data if API fails or empty
        if (!data || data.length === 0) {
          console.warn('GridBotChart: Using mock data');
          data = generateMockCandles(symbol, timeframe);
        }

        if (isActive && chartRef.current && seriesRef.current.candle) {
          const validData = cleanData(data);
          seriesRef.current.candle.setData(validData);
          
          // Safe fit content
          try {
            chartRef.current.timeScale().fitContent();
          } catch (e) {
            console.warn("Failed to fit content", e);
          }
          
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to load chart data", error);
        setIsLoading(false);
      }
    };

    // Small delay to ensure container is ready
    const initTimeout = setTimeout(() => {
        loadData();
    }, 50);

    // WebSocket subscription
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
      clearTimeout(initTimeout);
      binanceWS.unsubscribe(stream); 
      cleanup(); 
    };
  }, [symbol, timeframe]);

  // Grid Lines Logic
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current.candle) return;
    
    // Clean up old lines
    try {
        seriesRef.current.gridLines.forEach(l => {
            try {
                seriesRef.current.candle.removePriceLine(l);
            } catch(e) { /* ignore */ }
        });
    } catch(e) { console.warn(e); }
    
    seriesRef.current.gridLines = [];

    // Entry Price
    if (entryPrice) {
      seriesRef.current.gridLines.push(seriesRef.current.candle.createPriceLine({
        price: parseFloat(entryPrice), 
        color: themeData.colors['--success'], 
        lineWidth: 2, 
        lineStyle: 0, 
        title: 'ENTRY',
        axisLabelVisible: true,
      }));
    }
    
    // Stop Loss
    if (slPrice) {
      seriesRef.current.gridLines.push(seriesRef.current.candle.createPriceLine({
        price: parseFloat(slPrice), 
        color: themeData.colors['--danger'], 
        lineWidth: 2, 
        lineStyle: 0, 
        title: 'SL',
        axisLabelVisible: true,
      }));
    }

    // Take Profit
    if (tpPrice) {
      seriesRef.current.gridLines.push(seriesRef.current.candle.createPriceLine({
        price: parseFloat(tpPrice), 
        color: themeData.colors['--success'], 
        lineWidth: 2, 
        lineStyle: 0, 
        title: 'TP',
        axisLabelVisible: true,
      }));
    }
    
    // Grid Levels
    const low = parseFloat(lowerPrice);
    const high = parseFloat(upperPrice);
    const count = parseInt(gridCount);
    
    if (low && high && count > 1 && high > low) {
       // Lower Bound
       seriesRef.current.gridLines.push(seriesRef.current.candle.createPriceLine({
         price: low, 
         color: themeData.colors['--info'], 
         lineWidth: 2, 
         title: 'LOWER',
         axisLabelVisible: true,
       }));
       
       // Upper Bound
       seriesRef.current.gridLines.push(seriesRef.current.candle.createPriceLine({
         price: high, 
         color: themeData.colors['--info'], 
         lineWidth: 2, 
         title: 'UPPER',
         axisLabelVisible: true,
       }));
       
       // Internal Grid Lines
       const step = (high - low) / count;
       for (let i = 1; i < count; i++) {
         seriesRef.current.gridLines.push(seriesRef.current.candle.createPriceLine({
           price: low + (i * step), 
           color: themeData.colors['--info'], 
           lineWidth: 1, 
           lineStyle: 2, 
           axisLabelVisible: false,
         }));
       }
    }
  }, [lowerPrice, upperPrice, gridCount, entryPrice, tpPrice, slPrice, themeData]);

  return (
    <div className="relative w-full h-full min-h-[500px] bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden flex flex-col">
       <div className="flex justify-between items-center p-4 border-b border-[var(--border)] z-10 bg-[var(--surface)]">
          <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">{symbol} CHART</span>
             <span className="px-2 py-0.5 rounded bg-[var(--surface-hover)] text-[10px] text-[var(--text)] font-mono">{timeframe}</span>
          </div>
       </div>

       {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg)]/80 z-20 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
          </div>
       )}

       <div 
         ref={chartContainerRef} 
         className="flex-1 w-full h-full relative"
         style={{ minHeight: '450px' }}
       />
    </div>
  );
}