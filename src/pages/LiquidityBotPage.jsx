import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Chart from '@/components/Chart';
import LiquidityOverlay from '@/components/LiquidityOverlay';
import { detectLiquidityPools } from '@/lib/liquidityPools';
import { binanceApi } from '@/lib/binanceApi';
import { generateMockCandles } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Droplets, Wallet, PlayCircle, StopCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Simple order form component reused logic
const LiquidityOrderForm = ({ isRunning, onStart, onStop }) => {
  return (
    <div className="p-4 flex flex-col gap-4 h-full">
       <div className="flex items-center gap-2 mb-2">
         <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
           <Droplets className="w-5 h-5" />
         </div>
         <h2 className="font-bold text-white">Liquidity Hunter</h2>
       </div>
       
       <div className="space-y-4 flex-1">
         <div className="space-y-2">
           <label className="text-xs text-gray-400">Pair</label>
           <Input value="BTCUSDT" disabled className="bg-[#0F1419] border-[#2A3038] text-white" />
         </div>
         
         <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
               <label className="text-xs text-gray-400">Timeframe</label>
               <Input value="15m" disabled className="bg-[#0F1419] border-[#2A3038] text-white" />
            </div>
            <div className="space-y-2">
               <label className="text-xs text-gray-400">Amount (USDT)</label>
               <Input defaultValue="1000" className="bg-[#0F1419] border-[#2A3038] text-white" />
            </div>
         </div>

         <div className="p-3 bg-[#1A1F26] rounded-lg border border-[#2A3038] space-y-2">
            <div className="flex justify-between text-xs">
               <span className="text-gray-400">Strategy</span>
               <span className="text-white font-medium">Swing Zones</span>
            </div>
            <div className="flex justify-between text-xs">
               <span className="text-gray-400">Buy Zone</span>
               <span className="text-red-400">Above Swing High</span>
            </div>
             <div className="flex justify-between text-xs">
               <span className="text-gray-400">Sell Zone</span>
               <span className="text-green-400">Below Swing Low</span>
            </div>
         </div>
       </div>

       <div className="mt-auto pt-4 border-t border-[#2A3038]">
          {isRunning ? (
            <Button onClick={onStop} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 gap-2">
               <StopCircle className="w-5 h-5" /> Stop Engine
            </Button>
          ) : (
             <Button onClick={onStart} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 gap-2 shadow-glow-blue">
               <PlayCircle className="w-5 h-5" /> Start Engine
            </Button>
          )}
       </div>
    </div>
  );
};

export default function LiquidityBotPage() {
  const [chartInstance, setChartInstance] = useState(null);
  const [candleData, setCandleData] = useState([]);
  const [liquidityData, setLiquidityData] = useState(null);
  const [isBotRunning, setIsBotRunning] = useState(false);
  const { toast } = useToast();

  const handleChartReady = ({ chart, series }) => {
    setChartInstance({ chart, series });
  };

  // Fetch data effect (simulated access to chart data source)
  // In a real app, Chart component should lift state up, but here we re-fetch to generate overlays
  useEffect(() => {
    const fetchData = async () => {
      // Fetch matching data to what Chart uses
      // Note: In production this double-fetch is inefficient, better to lift state from Chart
      try {
        let data = await binanceApi.fetchCandleData('BTCUSDT', '15m');
        if (!data || data.length === 0) data = generateMockCandles('BTCUSDT', '15m');
        
        // Clean data matches Chart.jsx logic
        const cleaned = data.map(d => ({...d, time: Math.floor(Number(d.time))})).sort((a,b) => a.time - b.time);
        
        setCandleData(cleaned);
        const liq = detectLiquidityPools(cleaned);
        setLiquidityData(liq);
      } catch (e) {
        console.error("Error fetching liquidity data", e);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    setIsBotRunning(true);
    toast({
      title: "Liquidity Engine Started",
      description: "Scanning for swing points and liquidity pools...",
      className: "bg-blue-900 border-blue-800 text-white"
    });
  };

  const handleStop = () => {
    setIsBotRunning(false);
    toast({
      title: "Engine Stopped",
      description: "Liquidity scanning paused.",
      className: "bg-red-900 border-red-800 text-white"
    });
  };

  return (
    <>
      <Helmet>
        <title>Liquidity Pools - GBOX Bot</title>
        <meta name="description" content="Advanced liquidity pool detection and trading strategy" />
      </Helmet>

      <div className="h-[calc(100vh-6rem)] flex flex-col gap-4 p-4 lg:p-6 overflow-hidden bg-[#0F1419]">
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
          
          {/* Left: Chart */}
          <div className="flex-1 min-w-0 rounded-2xl overflow-hidden border border-[#2A3038] shadow-xl bg-slate-900/30 backdrop-blur-sm relative flex flex-col">
            <div className="absolute top-4 left-4 z-10 flex gap-2">
               <div className="px-3 py-1 bg-[#1A1F26]/80 backdrop-blur rounded-full border border-[#2A3038] text-xs font-mono text-gray-300 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-red-500"></span>
                 BSLQ: Buy Side Liquidity
               </div>
               <div className="px-3 py-1 bg-[#1A1F26]/80 backdrop-blur rounded-full border border-[#2A3038] text-xs font-mono text-gray-300 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-green-500"></span>
                 SSLQ: Sell Side Liquidity
               </div>
            </div>

            <div className="flex-1 w-full h-full min-h-0 relative">
              <Chart 
                symbol="BTCUSDT" 
                timeframe="15m" 
                onChartReady={handleChartReady}
              />
              
              {chartInstance && liquidityData && (
                <LiquidityOverlay 
                  chart={chartInstance.chart}
                  series={chartInstance.series}
                  candles={candleData}
                  liquidityData={liquidityData}
                />
              )}
            </div>
          </div>

          {/* Right: Controls */}
          <div className="w-full lg:w-[360px] flex-none rounded-2xl overflow-hidden border border-[#2A3038] shadow-2xl bg-slate-900/40 backdrop-blur-md flex flex-col h-full">
             <LiquidityOrderForm isRunning={isBotRunning} onStart={handleStart} onStop={handleStop} />
          </div>
        </div>

        {/* Bottom: Active Bots/Positions */}
        <div className="h-[250px] flex-none rounded-xl border border-[#2A3038] bg-slate-900/50 backdrop-blur overflow-hidden shadow-lg flex flex-col">
           <div className="px-4 py-3 border-b border-[#2A3038] bg-slate-900/80 flex justify-between items-center flex-none">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Active Liquidity Positions
              </h3>
           </div>
           <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              {isBotRunning ? (
                 <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <span>Scanning market structure...</span>
                 </div>
              ) : (
                 <span>Start the engine to view active positions</span>
              )}
           </div>
        </div>
      </div>
    </>
  );
}