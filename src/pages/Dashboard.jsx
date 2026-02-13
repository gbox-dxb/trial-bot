import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Wallet, TrendingUp, BarChart3, Activity, ArrowRight, Layers, Cpu, Zap, Bot } from 'lucide-react';
import OverviewCard from '@/components/analytics/OverviewCard';
import PerformanceChart from '@/components/analytics/PerformanceChart';
import ActivityFeed from '@/components/analytics/ActivityFeed';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { storage } from '@/lib/storage';

export default function Dashboard() {
  const { data, loading } = useAnalytics();

  // Real-time bot stats for dashboard
  const botStats = useMemo(() => {
    const bots = storage.getRSIBots();
    const waiting = bots.filter(b => b.status === 'Waiting').length;
    const active = bots.filter(b => b.status === 'Active').length;
    return { waiting, active, total: bots.length };
  }, []);

  if (loading || !data) {
    return <div className="flex h-screen items-center justify-center bg-[#0F1419] text-[#A0A9B8]">Initializing Dashboard...</div>;
  }

  const { overview, charts, coins, recentActivity } = data;

  // Filter for Bot orders in recent activity
  const botOrders = recentActivity.filter(a => a.botId);

  return (
    <>
      <Helmet><title>Dashboard - Trading Terminal</title></Helmet>

      <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
            <p className="text-[#A0A9B8]">Welcome back. Here's your portfolio overview.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/positions"><Button variant="secondary" className="bg-[#252B33] text-white hover:bg-[#333B44]">Manage Positions</Button></Link>
            <Link to="/analytics"><Button variant="outline" className="border-custom text-white hover:bg-[#252B33]">Full Analytics</Button></Link>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <OverviewCard
            title="Total Balance"
            value={`$${overview.totalBalance.toFixed(2)}`}
            icon={Wallet}
            className="border-custom bg-[#1A1F26]"
          />
          <OverviewCard
            title="Total PnL"
            value={`$${overview.totalPnL.toFixed(2)}`}
            icon={TrendingUp}
            trend={overview.totalPnL >= 0 ? 'up' : 'down'}
            valueClassName={overview.totalPnL >= 0 ? 'text-[#00FF41]' : 'text-[#FF3B30]'}
          />
          <OverviewCard
            title="RSI Bots"
            value={`${botStats.active} Active`}
            subtext={`${botStats.waiting} Waiting`}
            icon={Activity}
            valueClassName="text-[#00FF41]"
          />
          <OverviewCard
            title="Active Bots"
            value={overview.activeBots}
            icon={Cpu}
            valueClassName="text-[#00D9FF]"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Chart Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-[#1A1F26] border-custom">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold text-white">Portfolio Performance</CardTitle>
                <Activity className="h-4 w-4 text-[#A0A9B8]" />
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <PerformanceChart data={charts.timeline} height={300} />
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#1A1F26] border border-custom flex flex-col justify-center shadow-lg">
                <span className="text-xs text-[#A0A9B8] uppercase font-bold">Volume Traded</span>
                <span className="text-lg font-mono font-bold text-white mt-1">${overview.totalVolume.toFixed(0)}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#1A1F26] border border-custom flex flex-col justify-center shadow-lg">
                <span className="text-xs text-[#A0A9B8] uppercase font-bold">Active Positions</span>
                <span className="text-lg font-mono font-bold text-white mt-1">{overview.openPositions}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#1A1F26] border border-custom flex flex-col justify-center shadow-lg">
                <span className="text-xs text-[#A0A9B8] uppercase font-bold">Fees Paid</span>
                <span className="text-lg font-mono font-bold text-[#FF3B30] mt-1">${overview.totalFees.toFixed(2)}</span>
              </div>
            </div>

            {/* Recent Bot Orders */}
            <Card className="bg-[#1A1F26] border-custom">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Bot className="h-4 w-4 text-[#00D9FF]" /> Recent Bot Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {botOrders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0F1419] border border-custom">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#00D9FF]/10 p-1.5 rounded-lg">
                          <Bot className="h-4 w-4 text-[#00D9FF]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{order.pair}</span>
                            <span className={`text-[10px] px-1.5 rounded font-bold ${order.side === 'LONG' || order.side === 'BUY' ? 'bg-[#00FF41]/10 text-[#00FF41]' : 'bg-[#FF3B30]/10 text-[#FF3B30]'}`}>{order.side}</span>
                          </div>
                          <span className="text-xs text-[#A0A9B8]">{order.botName || 'Trading Bot'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono font-bold text-white">${order.entryPrice ? order.entryPrice.toFixed(2) : order.price}</div>
                        <div className="text-[10px] text-[#A0A9B8]">{new Date(order.createdAt).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}
                  {botOrders.length === 0 && (
                    <div className="text-center py-6 text-[#A0A9B8] text-sm">No bot activity yet</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">

            {/* Active Bots Summary */}
            <Card className="bg-[#1A1F26] border-custom overflow-hidden">
              <div className="h-1 bg-[#0F1419]" />
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#FF6B35]" /> System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#A0A9B8]">Active Strategies</span>
                  <span className="text-white font-bold bg-[#0F1419] px-2 py-0.5 rounded border border-custom">{overview.activeBots}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#A0A9B8]">RSI Bots Waiting</span>
                  <span className="text-[#FF6B35] font-bold">{botStats.waiting}</span>
                </div>
                <Button className="w-full bg-[#252B33] hover:bg-[#333B44] text-white border border-custom" size="sm" asChild>
                  <Link to="/bots/rsi">Manage RSI Bots</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-[#1A1F26] border-custom h-[500px] flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <ActivityFeed activities={recentActivity.slice(0, 15)} />
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </>
  );
}