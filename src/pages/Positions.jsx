import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useUnifiedPositions } from '@/hooks/useUnifiedPositions'; // Using hook here for stats
import { usePrice } from '@/contexts/PriceContext';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatisticsSection from '@/components/positions/StatisticsSection';
import UnifiedPositionsTable from '@/components/positions/UnifiedPositionsTable';

const Positions = () => {
  const { positions } = useUnifiedPositions();
  const { prices } = usePrice();
  const [activeTab, setActiveTab] = useState('active');

  // Stats calculation logic reused for the unified data
  const stats = useMemo(() => {
    const active = positions.filter(p => !['CLOSED', 'FILLED', 'CANCELLED', 'EXPIRED'].includes(p.status));
    const closed = positions.filter(p => ['CLOSED', 'FILLED', 'CANCELLED', 'EXPIRED'].includes(p.status));
    
    // Live PnL
    let openPnL = 0;
    active.forEach(p => {
       if (p.type === 'MARKET' && p.entryPrice) {
          const curr = prices[p.symbol] || p.entryPrice;
          const isLong = ['LONG', 'BUY', 'Long'].includes(p.side);
          const diff = isLong ? curr - p.entryPrice : p.entryPrice - curr;
          openPnL += diff * (p.size / p.entryPrice);
       }
    });

    // Historic PnL (Only from Closed Market Orders usually stored with finalPnL)
    const closedPnL = closed.reduce((acc, curr) => {
        return acc + (curr.originalData?.finalPnL || curr.originalData?.pnl || 0);
    }, 0);

    const totalPnL = openPnL + closedPnL;
    const wins = closed.filter(p => (p.originalData?.finalPnL || 0) > 0);
    const totalTrades = closed.length + active.length;

    return {
      openCount: active.length,
      totalPnL,
      totalPnLPercent: 0, // Hard to calc accurate ROI across all bot types
      winRate: closed.length > 0 ? (wins.length / closed.length) * 100 : 0,
      totalTrades,
      largestWin: 0, // Simplified
      largestLoss: 0
    };
  }, [positions, prices]);

  return (
    <>
      <Helmet><title>Positions - Trading Terminal</title></Helmet>
      
      <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              Portfolio
              <span className="px-3 py-1 bg-purple-600 rounded-full text-sm font-medium animate-pulse">
                {stats.openCount} Active
              </span>
            </h1>
            <p className="text-slate-400 mt-1">Unified view of all manual orders and bot strategies.</p>
          </div>
        </div>

        <StatisticsSection stats={stats} />

        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-custom p-1 min-h-[500px]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center px-4 pt-4 pb-2 border-b border-custom mb-4">
              <TabsList className="bg-slate-800">
                <TabsTrigger value="active" className="px-6">Active Positions</TabsTrigger>
                <TabsTrigger value="history" className="px-6">History</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="active" className="px-4 pb-4 mt-0">
               <UnifiedPositionsTable showHistory={false} />
            </TabsContent>

            <TabsContent value="history" className="px-4 pb-4 mt-0">
               <UnifiedPositionsTable showHistory={true} defaultFilter="All" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Positions;