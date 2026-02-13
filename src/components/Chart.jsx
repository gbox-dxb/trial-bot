import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { binanceApi } from '@/lib/binanceApi';
import { binanceWS } from '@/lib/binanceWebSocket';
import { technicalIndicators } from '@/lib/technicalIndicators';
import { Loader2, X } from 'lucide-react';
import { generateMockCandles } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

const cleanData = (data) => {
  if (!Array.isArray(data)) return [];
  const uniqueMap = new Map();
  data.forEach(item => {
    if (item && (typeof item.time === 'number' || typeof item.time === 'string')) {
      // Ensure time is treated consistently
      const time = Math.floor(Number(item.time));
      if (!isNaN(time) && time > 0) {
        uniqueMap.set(time, { ...item, time });
      }
    }
  });
  return Array.from(uniqueMap.values()).sort((a, b) => a.time - b.time);
};

export default function Chart({ 
  symbol = 'BTCUSDT', 
  timeframe = '15m', 
  signals = [], 
  coins = [], 
  onRemoveCoin,
  onChartReady
}) {
  const { themeData } = useTheme();
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef({
    candle: null,
    volume: null,
    rsi: null,
    bbUpper: null,
    bbLower: null,
    bbMiddle: null
  });
  
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [activeSymbol, setActiveSymbol] = useState(symbol);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [indicators, setIndicators] = useState({ rsi: true, bb: false });

  const timeframes = ['1m', '3m', '5m', '15m', '1h', '4h', '1D', '1W'];

  // Sync active symbol
  useEffect(() => {
    if (coins && coins.length > 0) {
      if (!coins.includes(activeSymbol)) {
        setActiveSymbol(coins[0]);
      }
    } else if (symbol && activeSymbol !== symbol) {
      setActiveSymbol(symbol);
    }
  }, [coins, symbol, activeSymbol]);

  // Apply theme options
  useEffect(() => {
    if (chartRef.current && themeData) {
      chartRef.current.applyOptions({
        layout: { 
          background: { color: '#0F1419' }, 
          textColor: '#FFFFFF'
        },
        grid: {
          vertLines: { color: '#2A3038' },
          horzLines: { color: '#2A3038' },
        },
        timeScale: { borderColor: '#2A3038' },
        rightPriceScale: { borderColor: '#2A3038' },
      });
    }
  }, [themeData]);

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: { 
        background: { color: '#0F1419' }, 
        textColor: '#FFFFFF'
      },
      grid: {
        vertLines: { color: '#2A3038' },
        horzLines: { color: '#2A3038' },
      },
      timeScale: { borderColor: '#2A3038', timeVisible: true },
      rightPriceScale: { borderColor: '#2A3038' },
      crosshair: { mode: 1 },
      autoSize: true,
    });

    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#00FF41', 
      downColor: '#FF3B30',
      borderUpColor: '#00FF41', 
      borderDownColor: '#FF3B30',
      wickUpColor: '#00FF41', 
      wickDownColor: '#FF3B30',
    });
    seriesRef.current.candle = candleSeries;

    seriesRef.current.volume = chart.addHistogramSeries({
      color: '#9D4EDD',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    seriesRef.current.bbUpper = chart.addLineSeries({ color: 'rgba(0, 217, 255, 0.3)', lineWidth: 1, visible: false });
    seriesRef.current.bbLower = chart.addLineSeries({ color: 'rgba(0, 217, 255, 0.3)', lineWidth: 1, visible: false });
    seriesRef.current.bbMiddle = chart.addLineSeries({ color: '#00D9FF', lineWidth: 2, visible: false });

    // Expose chart instance if callback provided
    if (onChartReady) {
      onChartReady({ chart, series: candleSeries, container: chartContainerRef.current });
    }

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if(chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []);

  // Fetch & Update Data
  useEffect(() => {
    let isActive = true;
    const currentSymbol = activeSymbol || symbol;
    const streamName = `${currentSymbol.toLowerCase()}@kline_${selectedTimeframe}`;

    const loadData = async () => {
      setIsLoading(true);
      try {
        let data = await binanceApi.fetchCandleData(currentSymbol, selectedTimeframe);
        
        if (!data || data.length === 0) {
          data = generateMockCandles(currentSymbol, selectedTimeframe);
        }

        if (isActive && chartRef.current && seriesRef.current.candle) {
          const validData = cleanData(data);
          setChartData(validData);
          seriesRef.current.candle.setData(validData);
          
          if (seriesRef.current.volume) {
             seriesRef.current.volume.setData(validData.map(d => ({
              time: d.time, value: d.volume,
              color: d.close > d.open ? 'rgba(0, 255, 65, 0.3)' : 'rgba(255, 59, 48, 0.3)'
            })));
          }

          updateIndicators(validData);
          
          // Safe fit content
          try {
            chartRef.current.timeScale().fitContent();
          } catch (e) {
            console.warn("Failed to fit content", e);
          }
          
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load chart data", err);
        setIsLoading(false);
      }
    };

    loadData();

    binanceWS.subscribe(streamName);
    const cleanup = binanceWS.onKlineUpdate((candle) => {
      if (candle.symbol !== currentSymbol) return; 

      if (seriesRef.current.candle) {
        const validTime = Math.floor(Number(candle.time));
        if (!isNaN(validTime)) {
          const cleanCandle = { ...candle, time: validTime };
          seriesRef.current.candle.update(cleanCandle);
          
          // Update local state for indicators/overlays
          setChartData(prev => {
             const newData = [...prev];
             const idx = newData.findIndex(d => d.time === validTime);
             if (idx !== -1) newData[idx] = cleanCandle;
             else newData.push(cleanCandle);
             return newData;
          });

          if (seriesRef.current.volume) {
            seriesRef.current.volume.update({
              time: validTime, value: candle.volume,
              color: candle.close > candle.open ? 'rgba(0, 255, 65, 0.3)' : 'rgba(255, 59, 48, 0.3)'
            });
          }
        }
      }
    });

    return () => {
      isActive = false;
      binanceWS.unsubscribe(streamName);
      cleanup();
    };
  }, [activeSymbol, symbol, selectedTimeframe]);

  useEffect(() => {
    if (seriesRef.current.candle && signals.length > 0) {
      const markers = signals.map(s => ({
        time: Math.floor(Number(s.time)),
        position: s.side === 'LONG' ? 'belowBar' : 'aboveBar',
        color: s.side === 'LONG' ? '#00FF41' : '#FF3B30',
        shape: s.side === 'LONG' ? 'arrowUp' : 'arrowDown',
        text: s.side
      })).filter(m => !isNaN(m.time));
      seriesRef.current.candle.setMarkers(markers);
    }
  }, [signals]);

  const updateIndicators = (data) => {
    if (indicators.bb) {
      const { upper, middle, lower } = technicalIndicators.calculateBollingerBands(data);
      seriesRef.current.bbUpper.setData(cleanData(upper));
      seriesRef.current.bbMiddle.setData(cleanData(middle));
      seriesRef.current.bbLower.setData(cleanData(lower));
      seriesRef.current.bbUpper.applyOptions({ visible: true });
      seriesRef.current.bbMiddle.applyOptions({ visible: true });
      seriesRef.current.bbLower.applyOptions({ visible: true });
    } else {
       if (seriesRef.current.bbUpper) {
         seriesRef.current.bbUpper.applyOptions({ visible: false });
         seriesRef.current.bbMiddle.applyOptions({ visible: false });
         seriesRef.current.bbLower.applyOptions({ visible: false });
       }
    }
  };

  useEffect(() => {
    updateIndicators(chartData);
  }, [indicators, chartData]);

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex flex-col gap-3 flex-none">
        
        {coins && coins.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar w-full">
            {coins.map((coin) => (
              <button
                key={coin}
                onClick={() => setActiveSymbol(coin)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shadow-sm border",
                  activeSymbol === coin
                    ? "bg-[#00D9FF] text-[#0F1419] border-[#00D9FF] shadow-glow-cyan"
                    : "bg-[#1A1F26] text-[#A0A9B8] border-[#2A3038] hover:bg-[#252B33] hover:text-white"
                )}
              >
                <span>{coin}</span>
                {onRemoveCoin && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveCoin(coin);
                    }}
                    className="rounded-full p-0.5 transition-colors hover:bg-white/20"
                  >
                    <X size={12} strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-2">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  selectedTimeframe === tf
                    ? 'bg-[#00D9FF] text-[#0F1419] shadow-glow-cyan'
                    : 'bg-[#1A1F26] text-[#A0A9B8] hover:bg-[#252B33] hover:text-white border border-[#2A3038]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
             <span className="text-xs font-bold text-white bg-[#1A1F26] px-3 py-1.5 rounded-lg border border-[#2A3038]">
                {activeSymbol}
             </span>
             <button 
               onClick={() => setIndicators(p => ({ ...p, bb: !p.bb }))}
               className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${indicators.bb ? 'bg-[#9D4EDD] text-white shadow-glow-purple' : 'bg-[#1A1F26] text-[#A0A9B8] border border-[#2A3038] hover:bg-[#252B33]'}`}
             >
               BB
             </button>
          </div>
        </div>
      </div>
      
      <div className="relative bg-[#0F1419] rounded-xl border-2 border-[#2A3038] flex-1 min-h-0 overflow-hidden shadow-xl">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0F1419]/90 z-10 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 text-[#00D9FF] animate-spin" />
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
}