import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAnalytics } from '@/hooks/useAnalytics';
import { analyticsExport } from '@/lib/analyticsExport';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown, DollarSign, Activity, Percent } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import OverviewCard from '@/components/analytics/OverviewCard';
import PerformanceChart from '@/components/analytics/PerformanceChart';
import StatisticsTable from '@/components/analytics/StatisticsTable';

export default function MyAnalytics() {
  const { data, loading } = useAnalytics();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('trading-stats');

  const handleExport = () => {
    analyticsExport.exportToCSV(data);
    toast({ title: "Export Started", description: "Your analytics data is being downloaded." });
  };

  if (loading || !data) {
    return <div className="p-8 text-center text-[#A0A9B8] animate-pulse">Loading analytics engine...</div>;
  }

  return (
    <>
      <Helmet><title>My Analytics - Trading Platform</title></Helmet>
      
      <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">My Analytics</h1>
            <p className="text-[#A0A9B8] mt-1">Detailed performance metrics and trading insights</p>
          </div>
          <Button onClick={handleExport} variant="outline" className="border-custom text-white hover:bg-[#252B33]">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-[#1A1F26] p-1 border border-custom">
            <TabsTrigger value="trading-stats">Trading Stats</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="coins">Coin Analytics</TabsTrigger>
            <TabsTrigger value="bots">Bot Performance</TabsTrigger>
            <TabsTrigger value="risk">Risk Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="trading-stats" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <OverviewCard 
                title="Total Trades" 
                value={data.overview.totalTrades} 
                icon={Activity}
              />
              <OverviewCard 
                title="Win Rate" 
                value={`${data.overview.winRate.toFixed(1)}%`} 
                icon={Percent}
                trend={data.overview.winRate > 50 ? 'up' : 'down'}
                valueClassName={data.overview.winRate > 50 ? 'text-[#00FF41]' : 'text-[#FF6B35]'}
              />
              <OverviewCard 
                title="Total PnL" 
                value={`$${data.overview.totalPnL.toFixed(2)}`} 
                icon={DollarSign}
                trend={data.overview.totalPnL >= 0 ? 'up' : 'down'}
                valueClassName={data.overview.totalPnL >= 0 ? 'text-[#00FF41]' : 'text-[#FF3B30]'}
              />
              <OverviewCard 
                title="Avg Profit" 
                value={`$${data.details.avgProfitPerTrade.toFixed(2)}`} 
                icon={TrendingUp}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <OverviewCard 
                title="Largest Win" 
                value={`$${data.details.largestWin.toFixed(2)}`} 
                icon={TrendingUp}
                className="bg-[#00FF41]/10 border-custom"
                valueClassName="text-[#00FF41]"
              />
              <OverviewCard 
                title="Largest Loss" 
                value={`$${data.details.largestLoss.toFixed(2)}`} 
                icon={TrendingDown}
                className="bg-[#FF3B30]/10 border-custom"
                valueClassName="text-[#FF3B30]"
              />
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6 animate-fade-in">
            <div className="bg-[#1A1F26] border border-custom rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Cumulative P&L</h3>
              <PerformanceChart data={data.charts.timeline} height={400} />
            </div>
          </TabsContent>

          <TabsContent value="coins" className="space-y-6 animate-fade-in">
             <StatisticsTable 
               data={data.coins}
               columns={[
                 { header: 'Coin', key: 'symbol' },
                 { header: 'Trades', key: 'trades', align: 'right' },
                 { header: 'Win Rate', key: 'winRate', align: 'right', render: (r) => `${r.winRate.toFixed(1)}%` },
                 { header: 'Volume', key: 'volume', align: 'right', render: (r) => `$${r.volume.toFixed(0)}` },
                 { header: 'Best Trade', key: 'bestTrade', align: 'right', render: (r) => <span className="text-[#00FF41]">${r.bestTrade.toFixed(2)}</span> },
                 { header: 'Total PnL', key: 'pnl', align: 'right', render: (r) => <span className={r.pnl >= 0 ? 'text-[#00FF41]' : 'text-[#FF3B30]'}>${r.pnl.toFixed(2)}</span> },
               ]}
             />
          </TabsContent>

          <TabsContent value="bots" className="space-y-6 animate-fade-in">
             <StatisticsTable 
               data={data.bots}
               columns={[
                 { header: 'Bot Name', key: 'name' },
                 { header: 'Type', key: 'type', render: (r) => <span className="text-xs bg-[#252B33] px-2 py-1 rounded text-white">{r.type}</span> },
                 { header: 'Status', key: 'status', render: (r) => <span className={`text-xs px-2 py-1 rounded ${r.status === 'active' ? 'bg-[#00FF41]/20 text-[#00FF41]' : 'bg-[#252B33] text-[#A0A9B8]'}`}>{r.status}</span> },
                 { header: 'Trades', key: 'tradeCount', align: 'right' },
                 { header: 'Win Rate', key: 'winRate', align: 'right', render: (r) => `${r.winRate.toFixed(1)}%` },
                 { header: 'Total PnL', key: 'totalPnL', align: 'right', render: (r) => <span className={r.totalPnL >= 0 ? 'text-[#00FF41]' : 'text-[#FF3B30]'}>${r.totalPnL.toFixed(2)}</span> },
               ]}
             />
          </TabsContent>

          <TabsContent value="risk" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <OverviewCard 
                title="Max Drawdown" 
                value={`$${Math.abs(data.details.maxDrawdown).toFixed(2)}`} 
                subtext="From peak equity"
                icon={TrendingDown}
                valueClassName="text-[#FF3B30]"
              />
              <OverviewCard 
                title="Profit Factor" 
                value={(Math.abs(data.overview.totalPnL) / (Math.abs(data.details.maxDrawdown) || 1)).toFixed(2)}
                subtext="Gross Profit / Gross Loss"
                icon={Activity}
              />
               <OverviewCard 
                title="Portfolio Exposure" 
                value={`${(data.overview.openPositions || 0)} Active`}
                subtext="Open positions count"
                icon={Activity}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}