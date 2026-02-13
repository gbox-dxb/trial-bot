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

export default function DCABotChart({ 
  symbol = 'BTCUSDT', 
  timeframe = '1h', 
  levels = [], 
  entryPrice,
  tpPrice,
  direction = 'Long'
}) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef({ candle: null, lines: [] });
  const resizeObserverRef = useRef(null);
  
  const { themeData } = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const textColor = themeData.colors['--muted'];
    const gridColor = themeData.colors['--border'];
    const upColor = themeData.colors['--success'];
    const downColor = themeData.colors['--danger'];
    const bgColor = 'transparent';

    // Cleanup previous instance if it exists (though useEffect dependency should handle this)
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const { clientWidth, clientHeight } = chartContainerRef.current;

    const chart = createChart(chartContainerRef.current, {
      width: clientWidth,
      height: clientHeight,
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
        mode: 1, // CrosshairMode.Normal
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
  }, [themeData]); // Re-create chart on theme change to update colors cleanly

  // Fetch Data
  useEffect(() => {
    let isActive = true;
    
    const loadData = async () => {
      if (!chartRef.current || !seriesRef.current.candle) return;
      
      setIsLoading(true);
      try {
        let data = await binanceApi.fetchCandleData(symbol, timeframe);
        
        // Fallback to mock data if API fails or returns empty
        if (!data || data.length === 0) {
          console.warn('Using mock data for chart');
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

    loadData();

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
      binanceWS.unsubscribe(stream); 
      cleanup(); 
    };
  }, [symbol, timeframe]);

  // Update Levels (Lines)
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current.candle) return;

    // Clear old lines
    try {
      // Note: lightweight-charts doesn't strictly track lines for us in a collection, 
      // we have to manually remove them using the reference we stored.
      seriesRef.current.lines.forEach(l => {
        // Safety check if line still exists in series
        try {
          seriesRef.current.candle.removePriceLine(l);
        } catch(e) { /* ignore if already removed */ }
      });
    } catch(e) { console.warn(e); }
    
    seriesRef.current.lines = [];

    // Add Entry Line
    if (entryPrice) {
      seriesRef.current.lines.push(seriesRef.current.candle.createPriceLine({
        price: parseFloat(entryPrice), 
        color: themeData.colors['--text'], 
        lineWidth: 1, 
        lineStyle: 2, // Dashed
        title: 'ENTRY',
        axisLabelVisible: true,
      }));
    }

    // Add Take Profit Line
    if (tpPrice) {
      seriesRef.current.lines.push(seriesRef.current.candle.createPriceLine({
        price: parseFloat(tpPrice), 
        color: themeData.colors['--warning'], 
        lineWidth: 2, 
        lineStyle: 0, // Solid
        title: 'TAKE PROFIT',
        axisLabelVisible: true,
      }));
    }

    // Add DCA Level Lines
    if (levels && levels.length > 0) {
      levels.forEach(lvl => {
        const isFilled = lvl.filled;
        // Logic: Filled = Success color, Pending = Info/Danger depending on direction
        const color = isFilled 
          ? themeData.colors['--success'] 
          : (direction === 'Long' ? themeData.colors['--info'] : themeData.colors['--danger']);
        
        if (lvl.price) {
          seriesRef.current.lines.push(seriesRef.current.candle.createPriceLine({
            price: parseFloat(lvl.price), 
            color: color, 
            lineWidth: 1, 
            lineStyle: isFilled ? 0 : 2, // Solid if filled, dashed if pending
            title: `DCA ${lvl.orderNumber}`,
            axisLabelVisible: true,
          }));
        }
      });
    }
  }, [levels, entryPrice, tpPrice, direction, themeData]);

  return (
    <div className="relative w-full h-full min-h-[500px] flex flex-col bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg)]/80 z-20 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
        </div>
      )}
      <div 
        ref={chartContainerRef} 
        className="flex-1 w-full h-full relative"
        style={{ minHeight: '500px' }} // Ensure inner container has height
      />
    </div>
  );
}