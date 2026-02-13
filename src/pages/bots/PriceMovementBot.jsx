import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import PriceMovementChart from '@/components/bots/PriceMovementChart';
import PriceMovementBotForm from '@/components/bots/PriceMovementBotForm';
import PriceMovementBotsTable from '@/components/bots/PriceMovementBotsTable';
import PriceMovementPositions from '@/components/bots/PriceMovementPositions';
import PriceMovementTrades from '@/components/bots/PriceMovementTrades';
import { usePriceMovementMonitor } from '@/hooks/usePriceMovementMonitor';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { storage } from '@/lib/storage';

export default function PriceMovementBot() {
  const [selectedConfig, setSelectedConfig] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Data State
  const [bots, setBots] = useState([]);
  const [positions, setPositions] = useState([]);
  const [trades, setTrades] = useState([]);

  // Load Data Helper
  const refreshData = () => {
      setBots(storage.getPriceMovementBots());
      setPositions(storage.getPriceMovementPositions());
      setTrades(storage.getPriceMovementTrades());
  };

  // Initial Load & Refresh Trigger
  useEffect(() => {
      refreshData();
  }, [refreshTrigger]);

  // Monitor Hook - Triggers refresh when engine acts
  usePriceMovementMonitor(() => {
      setRefreshTrigger(prev => prev + 1);
  });

  const handleBotCreated = () => {
     setRefreshTrigger(prev => prev + 1);
  };

  const handleConfigChange = (newConfig) => {
    setSelectedConfig(newConfig);
  };

  return (
    <>
      <Helmet>
        <title>Price Movement Bot - MEXC Trading</title>
      </Helmet>
      
      <div className="h-[calc(100vh-6rem)] flex flex-col gap-4">
          
          <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
              {/* Left: Form */}
              <div className="w-full lg:w-[350px] flex-none rounded-xl overflow-hidden border border-purple-500/20 shadow-xl bg-slate-900/50">
                  <PriceMovementBotForm onConfigChange={handleConfigChange} onBotCreated={handleBotCreated} />
              </div>

              {/* Center: Chart */}
              <div className="flex-1 flex flex-col min-h-[400px] lg:min-h-0 bg-slate-900/30 rounded-xl overflow-hidden shadow-xl">
                  <PriceMovementChart 
                      symbol={selectedConfig.pair} 
                      timeframe={selectedConfig.timeframe || '15m'}
                      referencePrice={selectedConfig.referencePrice}
                      thresholdUp={selectedConfig.thresholdUp}
                      thresholdDown={selectedConfig.thresholdDown}
                  />
              </div>

              {/* Right: Data Tables */}
              <div className="w-full lg:w-[400px] flex-none rounded-xl overflow-hidden border border-purple-500/20 shadow-xl bg-slate-900/50 flex flex-col">
                  <div className="p-3 bg-slate-900/80 border-b border-purple-500/20">
                      <h3 className="font-bold text-white">Bot Activity</h3>
                  </div>
                  <div className="flex-1 p-2 overflow-hidden">
                      <Tabs defaultValue="active" className="h-full flex flex-col">
                          <TabsList className="grid w-full grid-cols-3 mb-2 bg-slate-800">
                              <TabsTrigger value="active">Bots</TabsTrigger>
                              <TabsTrigger value="positions">Positions</TabsTrigger>
                              <TabsTrigger value="history">History</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="active" className="flex-1 overflow-auto">
                              <PriceMovementBotsTable bots={bots} onRefresh={() => setRefreshTrigger(p => p+1)} />
                          </TabsContent>
                          
                          <TabsContent value="positions" className="flex-1 overflow-auto">
                              <PriceMovementPositions positions={positions} onRefresh={() => setRefreshTrigger(p => p+1)} />
                          </TabsContent>
                          
                          <TabsContent value="history" className="flex-1 overflow-auto">
                              <PriceMovementTrades trades={trades} />
                          </TabsContent>
                      </Tabs>
                  </div>
              </div>
          </div>
      </div>
    </>
  );
}