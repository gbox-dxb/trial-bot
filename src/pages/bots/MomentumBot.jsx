import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import MomentumChart from '@/components/bots/MomentumChart';
import MomentumBotForm from '@/components/bots/MomentumBotForm';
import MomentumBotsTable from '@/components/bots/MomentumBotsTable';
import MultiChartContainer from '@/components/MultiChartContainer';
import { useMomentumBotMonitor } from '@/hooks/useMomentumBotMonitor';

export default function MomentumBot() {
  const [selectedBot, setSelectedBot] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentConfig, setCurrentConfig] = useState({ 
    selectedCoins: [], 
    pair: 'BTCUSDT' 
  });
  
  useMomentumBotMonitor();

  const handleBotCreated = () => {
     setRefreshTrigger(p => p + 1);
     setSelectedBot(null);
  };

  const handleEdit = (bot) => {
      setSelectedBot(bot);
      // Update config for visual preview
      setCurrentConfig({
        selectedCoins: bot.pairs || [],
        pair: (bot.pairs && bot.pairs.length > 0) ? bot.pairs[0] : bot.pair || 'BTCUSDT'
      });
  };

  const handleConfigChange = (config) => {
      setCurrentConfig({
          selectedCoins: config.selectedCoins || [],
          pair: config.pair || 'BTCUSDT'
      });
  };

  const isMultiCoin = currentConfig.selectedCoins && currentConfig.selectedCoins.length > 1;

  return (
    <>
      <Helmet>
        <title>Momentum Bot - Dollar Movement Strategy</title>
      </Helmet>
      
      <div className="h-[calc(100vh-6rem)] flex flex-col gap-4 p-4">
          {/* Main Content Area */}
          <div className="flex-1 flex gap-4 min-h-0">
              {/* Left: Chart */}
              <div className="flex-[3] flex flex-col min-h-0 bg-slate-900/30 rounded-xl overflow-hidden border border-custom shadow-xl relative">
                  {isMultiCoin ? (
                      <MultiChartContainer coins={currentConfig.selectedCoins} />
                  ) : (
                      <MomentumChart 
                          symbol={selectedBot ? (selectedBot.pairs?.[0] || selectedBot.pair) : currentConfig.pair} 
                          dollarMoveAmount={selectedBot?.dollarMoveAmount || 50}
                          referencePrice={selectedBot?.referencePrice}
                          activeBot={selectedBot}
                      />
                  )}
              </div>
              
              {/* Right: Form */}
              <div className="w-[380px] flex-none rounded-xl overflow-hidden border border-custom shadow-xl">
                  <MomentumBotForm 
                      onBotCreated={handleBotCreated} 
                      onConfigChange={handleConfigChange}
                      selectedBot={selectedBot} 
                  />
              </div>
          </div>

          {/* Bottom: Table */}
          <div className="h-[250px] flex-none">
              <MomentumBotsTable 
                  refreshTrigger={refreshTrigger} 
                  onEdit={handleEdit}
              />
          </div>
      </div>
    </>
  );
}