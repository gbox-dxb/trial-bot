import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import RSIBotChart from '@/components/bots/RSIBotChart';
import RSIBotForm from '@/components/bots/RSIBotForm';
import RSIBotsTable from '@/components/bots/RSIBotsTable';
import MultiChartContainer from '@/components/MultiChartContainer';
import { useRSIBotMonitor } from '@/hooks/useRSIBotMonitor';
import { storage } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function RSIBot() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [editingBot, setEditingBot] = useState(null);
    const [bots, setBots] = useState([]); // ✅ Added state for sync

    const [selectedConfig, setSelectedConfig] = useState({
        pair: 'BTCUSDT',
        selectedCoins: [],
        timeframe: '15m',
        rsiLength: 14,
        rsiValue: 30,
        triggerType: 'Oversold',
        status: 'Waiting'
    });

    // Start Monitor
    const { refreshTrigger: monitorTrigger } = useRSIBotMonitor();

    // ✅ Sync bots from storage
    useEffect(() => {
        const storedBots = storage.getRSIBots() || [];
        setBots(storedBots);
    }, [refreshTrigger, monitorTrigger]);

    const handleBotCreated = (config) => {
        if (editingBot) {
            const updated = bots.map(b => b.id === editingBot.id ? config : b);
            storage.saveRSIBots(updated);
            setBots(updated);
            setEditingBot(null);
        } else {
            const updated = [config, ...bots];
            storage.saveRSIBots(updated);
            setBots(updated);
        }
        setRefreshTrigger(p => p + 1);
    };

    const handleEdit = (bot) => {
        setEditingBot(bot);
        setSelectedConfig({
            pair: bot.pair,
            selectedCoins: bot.selectedCoins || [],
            timeframe: bot.timeframe,
            rsiLength: bot.rsiLength,
            rsiValue: bot.rsiValue,
            triggerType: bot.triggerType,
            status: bot.status
        });
    };

    const handleConfigChange = (newConfig) => {
        setSelectedConfig(prev => ({ ...prev, ...newConfig }));
    };

    const isMultiCoin =
        selectedConfig.selectedCoins &&
        selectedConfig.selectedCoins.length > 1;

    const activeBotState =
        editingBot ? editingBot.status : (selectedConfig.status || 'Waiting');

    // ✅ Counter now uses state (single source of truth)
    const botCount = bots.length;

    // ✅ Delete All with confirmation
    const handleDeleteAll = () => {
        if (botCount === 0) return;

        const confirmDelete = window.confirm(
            "Are you sure you want to delete all RSI bot data?"
        );

        if (!confirmDelete) return;

        storage.saveRSIBots([]);
        setBots([]);
        setRefreshTrigger(p => p + 1);
    };

    return (
        <>
            <Helmet>
                <title>RSI Bot - MEXC Trading</title>
                <meta name="description" content="Automated RSI mean reversion strategy" />
            </Helmet>

            <div className="flex flex-col gap-4 p-4 lg:p-6 overflow-hidden bg-[#0F1419]">

                <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-[700px]">

                    {/* Left Column: Chart */}
                    <div className="flex-1 min-w-0 rounded-2xl overflow-hidden border border-custom shadow-xl bg-slate-900/30 backdrop-blur-sm flex flex-col">
                        <div className="flex-1 w-full h-full min-h-0 relative z-10">
                            {isMultiCoin ? (
                                <MultiChartContainer coins={selectedConfig.selectedCoins} />
                            ) : (
                                <RSIBotChart
                                    symbol={selectedConfig.pair}
                                    timeframe={selectedConfig.timeframe}
                                    rsiLength={selectedConfig.rsiLength}
                                    rsiValue={selectedConfig.rsiValue}
                                    triggerType={selectedConfig.triggerType}
                                    activeBotState={activeBotState}
                                />
                            )}
                        </div>
                    </div>

                    {/* Right Column: Form */}
                    <div className="w-full lg:w-[380px] xl:w-[420px] flex-none rounded-2xl overflow-hidden border border-custom shadow-2xl bg-slate-900/40 backdrop-blur-md flex flex-col h-full">
                        <RSIBotForm
                            onBotCreated={handleBotCreated}
                            onConfigChange={handleConfigChange}
                            selectedBot={editingBot}
                        />
                    </div>

                </div>

                {/* Bottom Table */}
                <div className="h-[250px] flex-none rounded-xl border border-custom bg-slate-900/50 backdrop-blur overflow-hidden shadow-lg flex flex-col">

                    <div className="px-4 py-2 border-b border-custom bg-slate-900 flex justify-between items-center flex-none">

                        <div className="flex items-center gap-3">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Active RSI Bots
                            </h3>

                            <Badge
                                variant="secondary"
                                className="bg-purple-800 text-purple-200 text-[11px] border border-purple-700 px-2 py-1 rounded-full shadow-sm"
                            >
                                Total: {botCount}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-4 text-red-400 hover:text-red-300 hover:bg-red-900 rounded-full transition-all duration-300"
                                onClick={handleDeleteAll}
                                disabled={botCount === 0}
                            >
                                Delete All
                            </Button>

                            <span className="text-[10px] text-gray-600">
                                Auto-refreshing
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                        <RSIBotsTable
                            bots={bots}
                            refreshTrigger={refreshTrigger + monitorTrigger}
                            onEdit={handleEdit}
                        />
                    </div>

                </div>
            </div>
        </>
    );
}