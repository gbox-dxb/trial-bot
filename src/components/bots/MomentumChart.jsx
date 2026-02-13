import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, LineStyle } from 'lightweight-charts';
import { binanceApi } from '@/lib/binanceApi';
import { binanceWS } from '@/lib/binanceWebSocket';
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { generateMockCandles } from '@/lib/mockData';

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

export default function MomentumChart({ 
  symbol = 'BTCUSDT', 
  activeBot
}) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef({ 
      candle: null, 
      openLine: null, 
      upperLine: null, 
      lowerLine: null,
      currentPriceLine: null
  });
  const { themeData } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [currentCandle, setCurrentCandle] = useState(null);

  // Use the bot's timeframe or default to 15m
  const timeframe = activeBot?.timeframe || '15m';
  const dollarAmount = parseFloat(activeBot?.dollarAmount || 0);

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    const textColor = themeData.colors['--muted'];
    const gridColor = themeData.colors['--border'];
    const upColor = themeData.colors['--success'];
    const downColor = themeData.colors['--danger'];

    if (!chartRef.current) {
        const chart = createChart(chartContainerRef.current, {
          layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor },
          grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
          timeScale: { borderColor: gridColor, timeVisible: true },
          crosshair: {
            mode: 1, // Magnet
          },
        });
        chartRef.current = chart;
        seriesRef.current.candle = chart.addCandlestickSeries({
          upColor, downColor, borderUpColor: upColor, borderDownColor: downColor, wickUpColor: upColor, wickDownColor: downColor,
        });

        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }
  }, [themeData]);

  // Data Fetching
  useEffect(() => {
    let isActive = true;
    const loadData = async () => {
      setIsLoading(true);
      if (seriesRef.current.candle) seriesRef.current.candle.setData([]);

      try {
        let data = await binanceApi.fetchCandleData(symbol, timeframe, 200);
        if (!data || data.length === 0) data = generateMockCandles(symbol, timeframe);

        if (isActive && chartRef.current && seriesRef.current.candle) {
            const validData = cleanData(data);
            seriesRef.current.candle.setData(validData);
            if (validData.length > 0) {
                setCurrentCandle(validData[validData.length-1]);
            }
            
            // Safe fit content
            try {
                chartRef.current.timeScale().fitContent();
            } catch (e) {
                console.warn("Failed to fit content", e);
            }
            
            setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to load momentum chart data", error);
        setIsLoading(false);
      }
    };
    loadData();

    // Subscribe to Kline
    const stream = `${symbol.toLowerCase()}@kline_${timeframe}`;
    binanceWS.subscribe(stream);
    
    const cleanup = binanceWS.onKlineUpdate((kline) => {
       if (kline.symbol !== symbol || kline.interval !== timeframe) return;
       
       setCurrentCandle(kline);
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

  // Draw Trigger Lines based on Current Candle Open and Current Price
  useEffect(() => {
      if (!seriesRef.current.candle || !currentCandle || !dollarAmount) return;
      const cs = seriesRef.current.candle;
      
      const openPrice = parseFloat(currentCandle.open);
      const closePrice = parseFloat(currentCandle.close);
      
      // Cleanup old lines
      try {
        if (seriesRef.current.openLine) cs.removePriceLine(seriesRef.current.openLine);
        if (seriesRef.current.upperLine) cs.removePriceLine(seriesRef.current.upperLine);
        if (seriesRef.current.lowerLine) cs.removePriceLine(seriesRef.current.lowerLine);
        if (seriesRef.current.currentPriceLine) cs.removePriceLine(seriesRef.current.currentPriceLine);
      } catch (e) {}

      // 1. Open Price Line
      seriesRef.current.openLine = cs.createPriceLine({
          price: openPrice,
          color: themeData.colors['--muted'],
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: 'OPEN',
      });
      
      // 2. Trigger Targets
      seriesRef.current.upperLine = cs.createPriceLine({
          price: openPrice + dollarAmount,
          color: themeData.colors['--success'],
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `TRIGGER LONG`,
      });
      
      seriesRef.current.lowerLine = cs.createPriceLine({
          price: openPrice - dollarAmount,
          color: themeData.colors['--danger'],
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `TRIGGER SHORT`,
      });

      // 3. Current Price Indicator
      seriesRef.current.currentPriceLine = cs.createPriceLine({
          price: closePrice,
          color: closePrice >= openPrice ? themeData.colors['--success'] : themeData.colors['--danger'],
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: 'CURRENT',
      });

      return () => {
        try {
            if (seriesRef.current.openLine && cs) cs.removePriceLine(seriesRef.current.openLine);
            if (seriesRef.current.upperLine && cs) cs.removePriceLine(seriesRef.current.upperLine);
            if (seriesRef.current.lowerLine && cs) cs.removePriceLine(seriesRef.current.lowerLine);
            if (seriesRef.current.currentPriceLine && cs) cs.removePriceLine(seriesRef.current.currentPriceLine);
        } catch(e) {}
      };
  }, [currentCandle, dollarAmount, themeData]);

  return (
    <div className="relative w-full h-full bg-[var(--surface)] rounded-xl border border-[var(--border)] flex flex-col p-4">
       {/* Live Data Overlay */}
       <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <div className="bg-[var(--surface)]/90 backdrop-blur border border-[var(--border)] p-3 rounded-lg shadow-xl space-y-1 w-48">
                <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-1 mb-1">
                     <span className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider">Monitor</span>
                     <span className="text-[10px] text-[var(--primary)] font-bold bg-[var(--primary)]/10 px-1 rounded">{symbol} {timeframe}</span>
                </div>
                
                {/* Price Display */}
                <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-xs">
                    <span className="text-[var(--muted)]">Open</span>
                    <span className="text-white font-mono text-right">${currentCandle ? parseFloat(currentCandle.open).toFixed(2) : '...'}</span>
                    
                    <span className="text-[var(--muted)]">Current</span>
                    <span className="text-[var(--primary)] font-mono text-right font-bold">${currentCandle ? parseFloat(currentCandle.close).toFixed(2) : '...'}</span>
                </div>

                {/* Movement Display */}
                <div className="mt-2 pt-2 border-t border-dashed border-[var(--border)]">
                    <div className="flex justify-between items-center text-xs mb-1">
                         <span className="text-[var(--muted)]">Movement</span>
                         <span className={`font-mono font-bold ${currentCandle && (parseFloat(currentCandle.close) - parseFloat(currentCandle.open)) >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                             ${currentCandle ? (parseFloat(currentCandle.close) - parseFloat(currentCandle.open)).toFixed(2) : '0.00'}
                         </span>
                    </div>
                    {/* Progress Bar for Trigger */}
                    {dollarAmount > 0 && currentCandle && (
                        <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden mt-1">
                            <div 
                                className={`h-full transition-all duration-300 ${parseFloat(currentCandle.close) >= parseFloat(currentCandle.open) ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`}
                                style={{ width: `${Math.min(100, (Math.abs(parseFloat(currentCandle.close) - parseFloat(currentCandle.open)) / dollarAmount) * 100)}%` }}
                            />
                        </div>
                    )}
                    <div className="flex justify-between text-[10px] text-[var(--muted)] mt-0.5">
                        <span>$0</span>
                        <span>Target: ${dollarAmount}</span>
                    </div>
                </div>
            </div>
       </div>

       <div className="flex-1 relative min-h-0">
           {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-[var(--bg)]/50 backdrop-blur-[2px]">
                 <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
              </div>
           )}
           <div ref={chartContainerRef} className="w-full h-full" />
       </div>
    </div>
  );
}