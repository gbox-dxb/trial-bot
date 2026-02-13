import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import GridBotChart from '@/components/bots/GridBotChart';
import GridBotForm from '@/components/bots/GridBotForm';
import ActiveGridsTable from '@/components/bots/ActiveGridsTable';
import MultiChartContainer from '@/components/MultiChartContainer';
import { useGridBotMonitor } from '@/hooks/useGridBotMonitor';
import { storage } from '@/lib/storage';
import { Activity, DollarSign, Layers } from 'lucide-react';

export default function GridBot() {
  const [selectedConfig, setSelectedConfig] = useState({ pair: 'BTCUSDT', selectedCoins: [] });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState({ totalBots: 0, totalOrders: 0, totalPnL: 0 });
  
  // Activate the background monitor
  useGridBotMonitor();

  // Load stats
  useEffect(() => {
      const bots = storage.getGridBots();
      const totalBots = bots.filter(b => b.status === 'active').length;
      const totalOrders = bots.reduce((acc, b) => acc + (b.orders ? b.orders.length : 0), 0);
      const totalPnL = bots.reduce((acc, b) => acc + (b.totalPnL || 0), 0);
      setStats({ totalBots, totalOrders, totalPnL });
  }, [refreshTrigger]);

  const handleConfigChange = (newConfig) => {
    setSelectedConfig(newConfig);
  };

  const handleBotCreated = () => {
     setRefreshTrigger(prev => prev + 1);
  };
  
  // Determine if we should show multi-chart container
  const isMultiCoin = selectedConfig.selectedCoins && selectedConfig.selectedCoins.length > 1;

  return (
    <>
      <Helmet>
        <title>Grid Bot - MEXC Trading</title>
        <meta name="description" content="Automated grid trading strategy for ranging markets" />
      </Helmet>
      
      <div className="h-[calc(100vh-6rem)] flex flex-col gap-4 p-4 lg:p-6 overflow-hidden bg-[#0F1419]">
          
          {/* Top Stats Bar */}
          <div className="flex-none grid grid-cols-3 gap-4">
              <div className="bg-slate-900/50 border border-custom p-3 rounded-xl flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg"><Activity className="w-5 h-5 text-purple-400"/></div>
                  <div>
                      <div className="text-xs text-gray-500">Active Grids</div>
                      <div className="text-lg font-bold text-white">{stats.totalBots}</div>
                  </div>
              </div>
              <div className="bg-slate-900/50 border border-custom p-3 rounded-xl flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg"><Layers className="w-5 h-5 text-blue-400"/></div>
                  <div>
                      <div className="text-xs text-gray-500">Total Orders</div>
                      <div className="text-lg font-bold text-white">{stats.totalOrders}</div>
                  </div>
              </div>
              <div className="bg-slate-900/50 border border-custom p-3 rounded-xl flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg"><DollarSign className="w-5 h-5 text-green-400"/></div>
                  <div>
                      <div className="text-xs text-gray-500">Total PnL</div>
                      <div className={`text-lg font-bold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {stats.totalPnL >= 0 ? '+' : ''}{stats.totalPnL.toFixed(2)}
                      </div>
                  </div>
              </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
              
              <div className="flex-1 flex gap-4 min-h-0">
                  {/* Chart */}
                  <div className="flex-1 min-w-0 rounded-2xl overflow-hidden border border-custom shadow-xl bg-slate-900/30 backdrop-blur-sm">
                        {isMultiCoin ? (
                            <MultiChartContainer coins={selectedConfig.selectedCoins} />
                        ) : (
                            <GridBotChart 
                                symbol={selectedConfig.pair} 
                                lowerPrice={selectedConfig.lowerPrice}
                                upperPrice={selectedConfig.upperPrice}
                                gridCount={selectedConfig.gridLines}
                                entryPrice={selectedConfig.currentPrice}
                                tpPrice={selectedConfig.tpPrice}
                                slPrice={selectedConfig.slPrice}
                            />
                        )}
                  </div>
                  
                  {/* Form */}
                  <div className="w-[360px] flex-none rounded-2xl overflow-hidden border border-custom shadow-2xl bg-slate-900/40 backdrop-blur-md">
                      <GridBotForm 
                        onConfigChange={handleConfigChange} 
                        onBotCreated={handleBotCreated} 
                      />
                  </div>
              </div>

          </div>

          {/* Bottom Area: Active Grids Table */}
          <div className="h-[280px] flex-none rounded-xl border border-custom bg-slate-900/50 backdrop-blur overflow-hidden shadow-lg flex flex-col">
              <div className="px-4 py-2 border-b border-custom bg-slate-900 flex justify-between items-center flex-none">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Grids Management</h3>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <ActiveGridsTable refreshTrigger={refreshTrigger} />
              </div>
          </div>
      </div>
    </>
  );
}