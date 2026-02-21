import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import CandleStrikeChart from '@/components/bots/CandleStrikeChart';
import CandleStrikeForm from '@/components/bots/CandleStrikeForm';
import CandleStrikeBotsTable from '@/components/bots/CandleStrikeBotsTable';
import MultiChartContainer from '@/components/MultiChartContainer';
import { Button } from '@/components/ui/button';
import { candleStrikeBotEngine } from '@/lib/candleStrikeBotEngine';
import { useCandleStrikeMonitor } from '@/hooks/useCandleStrikeMonitor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Reusable component for each Strategy Tab
const StrategyView = ({ color }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingBot, setEditingBot] = useState(null);
  const [config, setConfig] = useState({});

  const handleBotCreated = (config) => {
    if (editingBot) {
      candleStrikeBotEngine.updateBot({ ...editingBot, ...config });
      setEditingBot(null);
    } else {
      candleStrikeBotEngine.createBot(config);
    }
    setRefreshTrigger(prev => prev + 1);
  };

  const handleConfigChange = (newConfig) => {
    setConfig(newConfig);
  };

  const handleEdit = (bot) => {
    setEditingBot(bot);
  };

  const isMultiCoin = config.selectedCoins && config.selectedCoins.length > 1;
  const isGreen = color === 'GREEN';

  return (
    <div className="flex-1 flex flex-col gap-4 h-full min-h-0">
      {/* Main Area: Chart + Form */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-[600px]">
        {/* Chart */}
        <div className={cn(
          "flex-1 min-w-0 rounded-2xl overflow-hidden border shadow-xl backdrop-blur-sm relative flex flex-col",
          isGreen ? "border-custom bg-slate-900/30" : "border-custom bg-slate-900/30"
        )}>
          <div className="flex-1 w-full h-full min-h-0 relative z-10">
            {isMultiCoin ? (
              <MultiChartContainer coins={config.selectedCoins} />
            ) : (
              <CandleStrikeChart
                symbol={editingBot ? editingBot.pair : (config.pair || 'BTCUSDT')}
                activeBot={editingBot}
                previewConfig={!editingBot ? config : null}
                fixedColor={color}
              />
            )}
          </div>
        </div>

        {/* Form */}
        <div className={cn(
          "w-full lg:w-[380px] xl:w-[420px] flex-none rounded-2xl overflow-hidden border shadow-2xl backdrop-blur-md flex flex-col h-full",
          isGreen ? "border-custom bg-slate-900/40" : "border-custom bg-slate-900/40"
        )}>
          <CandleStrikeForm
            onBotCreated={handleBotCreated}
            onConfigChange={handleConfigChange}
            selectedBot={editingBot}
            fixedColor={color}
          />
        </div>
      </div>

      {/* Bottom Table */}
      <div className="h-[250px] flex-none rounded-xl border border-custom bg-slate-900/50 backdrop-blur overflow-hidden shadow-lg flex flex-col">
        <div className={cn(
          "px-4 py-2 border-b flex justify-between items-center flex-none",
          isGreen ? "border-custom bg-slate-900/50" : "border-custom bg-slate-900/50"
        )}>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active {color} Bots</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-4 text-red-400 hover:text-red-300 hover:bg-red-900 rounded-full transition-all duration-300"
            >
              Delete All
            </Button>
            <span className="text-[10px] text-gray-600">Auto-refreshing</span>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <CandleStrikeBotsTable
            refreshTrigger={refreshTrigger}
            onEdit={handleEdit}
            filterColor={color}
          />
        </div>
      </div>
    </div>
  );
};

export default function CandleStrike() {
  // Global monitoring hook - handles all bots regardless of color
  useCandleStrikeMonitor();

  return (
    <>
      <Helmet>
        <title>Candle Strike Bot - Surf Strategy</title>
        <meta name="description" content="Automated surf strategy trading based on wave detection" />
      </Helmet>

      <div className="flex flex-col p-4 lg:p-6 overflow-hidden bg-[#0F1419]">
        <Tabs defaultValue="green" className="w-full h-full">

          <TabsList className="flex items-end justify-end w-full bg-slate-800/50 p-1 mb-4 rounded-xl ms-auto border border-custom">
            <TabsTrigger
              value="green"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg font-bold transition-all duration-300"
            >
              Green Strategies (Long)
            </TabsTrigger>
            <TabsTrigger
              value="red"
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg font-bold transition-all duration-300"
            >
              Red Strategies (Short)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="green" className="flex-1 min-h-0 mt-0 data-[state=active]:flex flex-col">
            <StrategyView color="GREEN" />
          </TabsContent>

          <TabsContent value="red" className="flex-1 min-h-0 mt-0 data-[state=active]:flex flex-col">
            <StrategyView color="RED" />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}