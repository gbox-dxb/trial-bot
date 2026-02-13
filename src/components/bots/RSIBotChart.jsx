import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { binanceApi } from '@/lib/binanceApi';
import { binanceWS } from '@/lib/binanceWebSocket';
import { rsiTradingLogic } from '@/lib/rsiTradingLogic';
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

export default function RSIBotChart({ 
  symbol = 'BTCUSDT', 
  timeframe = '15m',
  rsiLength = 14,
  rsiValue = 30,
  triggerType = 'Oversold',
  activeBotState // passed status from parent which gets it from storage/hooks
}) {
  const chartContainerRef = useRef(null);
  const rsiContainerRef = useRef(null);
  const chartRef = useRef(null);
  const rsiChartRef = useRef(null);
  const seriesRef = useRef({ candle: null, rsi: null, overboughtLine: null, oversoldLine: null, triggerLine: null });
  const { themeData } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [currentRSI, setCurrentRSI] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Initializing...");

  // Status mapping
  const getStatusDisplay = () => {
      if (activeBotState === 'Active') return { color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/50', msg: 'Strategy Triggered & Active' };
      if (activeBotState === 'Waiting') return { color: 'text-slate-300', bg: 'bg-slate-700/50', border: 'border-slate-600', msg: 'Scanning Market...' };
      if (activeBotState === 'Stopped') return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', msg: 'Bot Stopped' };
      return { color: 'text-slate-400', bg: 'bg-slate-800', border: 'border-slate-700', msg: 'Initializing...' };
  };

  const statusStyle = getStatusDisplay();

  useEffect(() => {
    if (!chartContainerRef.current || !rsiContainerRef.current) return;
    const textColor = themeData.colors['--muted'];
    const gridColor = themeData.colors['--border'];
    const upColor = themeData.colors['--success'];
    const downColor = themeData.colors['--danger'];
    const rsiColor = themeData.colors['--secondary'];

    if (!chartRef.current) {
        // Main Chart
        const chart = createChart(chartContainerRef.current, {
          layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor },
          grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
          timeScale: { borderColor: gridColor, timeVisible: true },
        });
        // RSI Chart
        const rsiChart = createChart(rsiContainerRef.current, {
          layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor },
          grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
          timeScale: { visible: false }, 
          rightPriceScale: { borderColor: gridColor },
        });

        chartRef.current = chart;
        rsiChartRef.current = rsiChart;

        seriesRef.current.candle = chart.addCandlestickSeries({ upColor, downColor, borderUpColor: upColor, borderDownColor: downColor });
        seriesRef.current.rsi = rsiChart.addLineSeries({ color: rsiColor, lineWidth: 2 });
        
        // Static RSI Levels (30/70)
        seriesRef.current.overboughtLine = seriesRef.current.rsi.createPriceLine({ price: 70, color: downColor, lineWidth: 1, lineStyle: 2, axisLabelVisible: false });
        seriesRef.current.oversoldLine = seriesRef.current.rsi.createPriceLine({ price: 30, color: upColor, lineWidth: 1, lineStyle: 2, axisLabelVisible: false });

        // Sync Time Scales with Null Safety
        chart.timeScale().subscribeVisibleTimeRangeChange((range) => {
            if (range && rsiChartRef.current) {
                try {
                    rsiChartRef.current.timeScale().setVisibleRange(range);
                } catch (e) {
                    // Ignore errors during resize/destroy or invalid range
                }
            }
        });

        const handleResize = () => {
          if (chartContainerRef.current && chartRef.current) {
             chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
          }
          if (rsiContainerRef.current && rsiChartRef.current) {
             rsiChartRef.current.applyOptions({ width: rsiContainerRef.current.clientWidth, height: rsiContainerRef.current.clientHeight });
          }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        
        return () => {
          window.removeEventListener('resize', handleResize);
          if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
          }
          if (rsiChartRef.current) {
            rsiChartRef.current.remove();
            rsiChartRef.current = null;
          }
        };
    } else {
        // Theme updates
        chartRef.current.applyOptions({ layout: { textColor }, grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } } });
        rsiChartRef.current.applyOptions({ layout: { textColor }, grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } } });
        seriesRef.current.candle.applyOptions({ upColor, downColor, borderUpColor: upColor, borderDownColor: downColor });
        seriesRef.current.rsi.applyOptions({ color: rsiColor });
    }
  }, [themeData]);

  // Data Updates
  useEffect(() => {
    let isActive = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch more candles to ensure stable RSI calculation
        let data = await binanceApi.fetchCandleData(symbol, timeframe, 200);
        if (!data || data.length === 0) data = generateMockCandles(symbol, timeframe);
        
        if (isActive && chartRef.current && seriesRef.current.candle && seriesRef.current.rsi) {
          const validData = cleanData(data);
          if (validData.length > 0) {
            seriesRef.current.candle.setData(validData);
            
            // Use shared RSI logic
            const rsiData = rsiTradingLogic.calculateRSI(validData, rsiLength);
            seriesRef.current.rsi.setData(cleanData(rsiData));
            
            if (rsiData.length > 0) {
                const lastRSI = rsiData[rsiData.length-1].value;
                setCurrentRSI(lastRSI);
            }
            
            // Fit content safely
            try {
                chartRef.current.timeScale().fitContent();
            } catch (e) {
                console.warn("Failed to fit content", e);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load RSI chart data", error);
      } finally {
        if (isActive) setIsLoading(false);
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
             // Update Candle
             const candleUpdate = { ...kline, time: validTime };
             seriesRef.current.candle.update(candleUpdate);
             
             // Note: For real-time RSI updates, we would ideally recalculate based on the new candle.
             // For this implementation, we rely on the periodic refresh or simplified updates.
         }
       }
    });
    return () => { isActive = false; binanceWS.unsubscribe(stream); cleanup(); };
  }, [symbol, timeframe, rsiLength]);

  // Dynamic Trigger Line Logic
  useEffect(() => {
      if (!rsiChartRef.current || !seriesRef.current.rsi) return;
      
      // Remove old trigger line
      if (seriesRef.current.triggerLine) { 
          try {
            seriesRef.current.rsi.removePriceLine(seriesRef.current.triggerLine); 
          } catch (e) { /* ignore */ }
          seriesRef.current.triggerLine = null; 
      }
      
      // Add new trigger line
      if (rsiValue) {
          seriesRef.current.triggerLine = seriesRef.current.rsi.createPriceLine({
              price: parseFloat(rsiValue), 
              color: themeData.colors['--warning'], 
              lineWidth: 1, 
              lineStyle: 0, // Solid
              title: `TRIG ${rsiValue}`,
              axisLabelVisible: true
          });
      }
  }, [rsiValue, triggerType, themeData]);

  return (
    <div className="flex flex-col h-full bg-[var(--surface)] rounded-xl border border-[var(--border)] p-2 relative">
       {/* Status Overlay */}
       <div className="absolute top-4 right-4 z-20 flex flex-col items-end pointer-events-none">
            <div className={`px-3 py-1.5 rounded-lg backdrop-blur-md border shadow-lg flex items-center gap-2 ${statusStyle.bg} ${statusStyle.border}`}>
                 <div className={`w-2 h-2 rounded-full ${activeBotState === 'Active' ? 'bg-green-400 animate-ping' : activeBotState === 'Waiting' ? 'bg-slate-400' : 'bg-yellow-400'}`}></div>
                 <span className={`text-xs font-bold font-mono ${statusStyle.color}`}>
                     {activeBotState ? `${activeBotState} - ${statusStyle.msg}` : statusMessage}
                 </span>
            </div>
       </div>

       {/* Main Price Chart */}
       <div className="flex-grow relative min-h-0 border-b border-[var(--border)]">
           {isLoading && <div className="absolute inset-0 flex items-center justify-center z-20"><Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" /></div>}
           <div className="absolute top-2 left-2 z-10 text-xs font-bold text-[var(--muted)] flex items-center gap-2">{symbol} {timeframe}</div>
           <div ref={chartContainerRef} className="w-full h-full" />
       </div>
       
       {/* RSI Indicator Panel */}
       <div className="h-[25%] flex-none relative bg-[var(--background)]/30">
           <div className="absolute top-1 left-2 z-10 flex items-center gap-2">
               <span className="text-[10px] font-bold text-[var(--secondary)]">RSI ({rsiLength})</span>
               {currentRSI && <span className={`text-[10px] font-mono font-bold ${
                   (triggerType === 'Oversold' && currentRSI <= rsiValue) || (triggerType === 'Overbought' && currentRSI >= rsiValue)
                   ? 'text-[var(--warning)] animate-pulse'
                   : 'text-[var(--text)]'
               }`}>
                   {currentRSI.toFixed(2)}
               </span>}
           </div>
           <div ref={rsiContainerRef} className="w-full h-full" />
       </div>
    </div>
  );
}