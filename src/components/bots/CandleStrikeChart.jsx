import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { binanceApi } from '@/lib/binanceApi';
import { binanceWS } from '@/lib/binanceWebSocket';
import { Loader2, Eye, PauseCircle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { candleStrikeBotEngine } from '@/lib/candleStrikeBotEngine';
import DetectionProgressDisplay from '@/components/bots/DetectionProgressDisplay';

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

export default function CandleStrikeChart({ 
  symbol = 'BTCUSDT', 
  activeBot = null,
  previewConfig = null,
  fixedColor
}) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef({
    candle: null
  });
  
  const { themeData } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [candles, setCandles] = useState([]);
  const [consecutiveCount, setConsecutiveCount] = useState(0);

  const strategyConfig = activeBot || previewConfig || {};
  const timeframe = strategyConfig.timeframe || '1m';
  const targetColor = fixedColor || strategyConfig.candleColor || 'GREEN';
  const targetCount = strategyConfig.candleCount || 3;

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
    }

    const { clientWidth, clientHeight } = chartContainerRef.current;
    
    const chart = createChart(chartContainerRef.current, {
      width: clientWidth || 800, 
      height: clientHeight || 600, 
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: themeData.colors['--muted'] },
      grid: { vertLines: { color: themeData.colors['--border'] }, horzLines: { color: themeData.colors['--border'] } },
      timeScale: { borderColor: themeData.colors['--border'], timeVisible: true, secondsVisible: true },
    });

    chartRef.current = chart;

    seriesRef.current.candle = chart.addCandlestickSeries({
      upColor: themeData.colors['--success'], 
      downColor: themeData.colors['--danger'],
      borderUpColor: themeData.colors['--success'], 
      borderDownColor: themeData.colors['--danger'], 
      wickUpColor: themeData.colors['--success'], 
      wickDownColor: themeData.colors['--danger'],
    });

    const handleResize = () => {
         if (chartContainerRef.current && chartRef.current) {
            chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
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
  }, [themeData]);

  // Data Fetching & Markers
  useEffect(() => {
    let isActive = true;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await binanceApi.fetchCandleData(symbol, timeframe);
        if (isActive && chartRef.current && seriesRef.current.candle) {
          const validData = cleanData(data);
          seriesRef.current.candle.setData(validData);
          setCandles(validData);
          
          // Safe fit content
          try {
            chartRef.current.timeScale().fitContent();
          } catch (e) {
            console.warn("Failed to fit content", e);
          }
        }
      } catch (error) {
        console.error("Failed to load candle data", error);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadData();

    const stream = `${symbol.toLowerCase()}@kline_${timeframe}`;
    binanceWS.subscribe(stream);
    
    const cleanup = binanceWS.onKlineUpdate((kline) => {
      if (kline.symbol !== symbol || kline.interval !== timeframe) return;
      
      setCandles(prev => {
          const newCandles = [...prev];
          const last = newCandles[newCandles.length - 1];
          if (last && Math.abs(last.time - kline.time) < 2) {
              newCandles[newCandles.length - 1] = kline;
          } else {
              newCandles.push(kline);
          }
          if (newCandles.length > 200) newCandles.shift();
          return newCandles;
      });

      if (seriesRef.current.candle) {
        seriesRef.current.candle.update(kline);
      }
    });

    return () => {
      isActive = false;
      binanceWS.unsubscribe(stream);
      cleanup();
    };
  }, [symbol, timeframe]);

  // Update Markers & Count
  useEffect(() => {
      if (!seriesRef.current.candle || candles.length === 0) return;

      const count = candleStrikeBotEngine.countConsecutive(candles, targetColor);
      setConsecutiveCount(count);

      const markers = [];
      const len = candles.length;
      
      for (let i = 0; i < count; i++) {
          const index = len - 1 - i;
          if (index >= 0) {
              const c = candles[index];
              markers.push({
                  time: c.time,
                  position: targetColor === 'GREEN' ? 'belowBar' : 'aboveBar',
                  color: targetColor === 'GREEN' ? '#10b981' : '#ef4444',
                  shape: targetColor === 'GREEN' ? 'arrowUp' : 'arrowDown',
                  text: `${count - i}`,
                  size: 1
              });
          }
      }

      markers.sort((a, b) => a.time - b.time);
      seriesRef.current.candle.setMarkers(markers);

  }, [candles, targetColor, themeData]);

  // Overlay for badges (Simplified, as we have the bottom bar now)
  const getStatusOverlay = () => {
      if (activeBot?.status === 'PAUSED') {
          return (
             <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
                 <div className="px-4 py-2 rounded-full border bg-slate-900/80 border-slate-700 text-gray-500 flex items-center gap-2">
                     <PauseCircle className="w-4 h-4"/>
                     <span className="font-bold text-xs uppercase">Strategy Paused</span>
                 </div>
             </div>
          );
      }
      return null;
  };

  return (
    <div className="relative w-full h-full bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden flex flex-col">
       {getStatusOverlay()}

       <div className="flex flex-wrap justify-between items-center p-4 border-b border-[var(--border)] z-10 bg-[var(--surface)]">
          <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">{symbol}</span>
             <span className="px-2 py-0.5 rounded bg-[var(--surface-hover)] text-[10px] text-[var(--text)] font-mono">{timeframe}</span>
          </div>
       </div>

       <div className="relative flex-1 w-full min-h-0">
           {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg)]/80 z-20 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
              </div>
           )}
           <div ref={chartContainerRef} className="w-full h-full" />
       </div>

       {/* Detection Display - Always Visible at Bottom of Chart Component */}
       <div className="flex-none z-20">
           <DetectionProgressDisplay 
                currentCount={consecutiveCount}
                targetCount={targetCount}
                color={targetColor}
                timeframe={timeframe}
           />
       </div>
    </div>
  );
}