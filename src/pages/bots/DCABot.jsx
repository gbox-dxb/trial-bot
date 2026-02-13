import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import DCABotChart from '@/components/bots/DCABotChart';
import DCABotForm from '@/components/bots/DCABotForm';
import DCABotsTable from '@/components/bots/DCABotsTable';
import MultiChartContainer from '@/components/MultiChartContainer';
import { useDCABotMonitor } from '@/hooks/useDCABotMonitor';
import { storage } from '@/lib/storage';

export default function DCABot() {
  const [selectedConfig, setSelectedConfig] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [bots, setBots] = useState([]);
  const [editingBot, setEditingBot] = useState(null);

  // Refresh data from storage
  const refreshData = () => {
      setBots(storage.getDCABots());
  };

  // Initial load and refresh on trigger
  useEffect(() => {
      refreshData();
  }, [refreshTrigger]);

  // Background monitor
  const handleMonitorUpdate = useCallback(() => {
      setRefreshTrigger(prev => prev + 1);
  }, []);

  useDCABotMonitor(handleMonitorUpdate);

  const handleBotCreated = () => {
     setRefreshTrigger(prev => prev + 1);
     setEditingBot(null);
  };

  const handleConfigChange = useCallback((vizData) => {
    setSelectedConfig(vizData);
  }, []);
  
  const handleEditBot = (bot) => {
      setEditingBot(bot);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleViewBot = (bot) => {
      console.log("Viewing bot", bot);
  };

  const isMultiCoin = selectedConfig.selectedCoins && selectedConfig.selectedCoins.length > 1;

  return (
    <>
      <Helmet>
        <title>DCA Bot - MEXC Trading</title>
      </Helmet>
      
      {/* Main Layout Container */}
      <div className="h-[calc(100vh-6rem)] flex flex-col gap-4 p-4 lg:p-6 overflow-hidden bg-[#0F1419]">
          
          {/* Top Section: Chart (Left) + Config (Right) */}
          <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
              
              {/* Left Column: Chart Area */}
              <div className="flex-1 min-w-0 rounded-2xl overflow-hidden border border-custom shadow-xl bg-slate-900/30 backdrop-blur-sm relative flex flex-col">
                  {/* Chart Component Container */}
                  <div className="flex-1 w-full h-full min-h-0 z-10 relative">
                      {isMultiCoin ? (
                          <MultiChartContainer coins={selectedConfig.selectedCoins} />
                      ) : (
                          <DCABotChart 
                              symbol={selectedConfig.pair || 'BTCUSDT'} 
                              entryPrice={selectedConfig.entryPrice}
                              tpPrice={selectedConfig.tpPrice}
                              levels={selectedConfig.levels}
                              direction={selectedConfig.direction}
                          />
                      )}
                  </div>
              </div>

              {/* Right Column: Config Panel */}
              <div className="w-full lg:w-[360px] flex-none rounded-2xl overflow-hidden border border-custom shadow-2xl bg-slate-900/40 backdrop-blur-md flex flex-col h-full">
                  <DCABotForm 
                      onConfigChange={handleConfigChange} 
                      onBotCreated={handleBotCreated}
                      selectedBot={editingBot}
                  />
              </div>

          </div>

          {/* Bottom Section: Active Bots Table */}
          <div className="h-[250px] flex-none rounded-xl border border-custom bg-slate-900/50 backdrop-blur overflow-hidden shadow-lg flex flex-col">
              <div className="px-4 py-3 border-b border-custom bg-slate-900/80 flex justify-between items-center flex-none">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Active DCA Bots
                  </h3>
                  <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-gray-500">
                          Total Active: <span className="text-white font-bold">{bots.filter(b => b.status === 'active').length}</span>
                      </span>
                  </div>
              </div>
              
              <div className="flex-1 min-h-0 overflow-hidden">
                   <DCABotsTable 
                      bots={bots} 
                      onRefresh={() => setRefreshTrigger(p => p+1)} 
                      onEdit={handleEditBot}
                      onView={handleViewBot} 
                   />
              </div>
          </div>
      </div>
    </>
  );
}