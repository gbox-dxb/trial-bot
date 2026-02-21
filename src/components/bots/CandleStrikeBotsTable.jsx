import React, { useState, useEffect } from 'react';
import { candleStrikeBotEngine } from '@/lib/candleStrikeBotEngine';
import { Play, Pause, Trash2, Edit, FileText, Activity, Flame, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

export default function CandleStrikeBotsTable({ refreshTrigger, onEdit, filterColor }) {
    const [bots, setBots] = useState([]);
    const [lockStatus, setLockStatus] = useState({ locked: false, remaining: 0, executingColor: null });
    const { toast } = useToast();

    useEffect(() => {
        loadBots();
        const interval = setInterval(loadBots, 1000);
        return () => clearInterval(interval);
    }, [refreshTrigger, filterColor]);

    const loadBots = () => {
        // Get all bots but only display the ones matching the current color tab (Green vs Red)
        const loadedBots = candleStrikeBotEngine.getBotsByColor(filterColor).reverse();
        setBots(loadedBots);

        setLockStatus(candleStrikeBotEngine.isSystemLocked());
    };

    const handleToggle = (id) => {
        if (!id) return;
        candleStrikeBotEngine.toggleBot(id);
        loadBots();
        toast({ title: "Bot Updated", description: "Bot status toggled successfully." });
    };

    const handleDelete = (bot) => {
        // 1. Debugging Log: Inspect the full object structure
        console.log("Delete requested for bot object:", bot);

        // 2. Validate Bot Object
        if (!bot) {
            console.error("Delete failed: Bot object provided is null/undefined");
            toast({
                title: "Delete Error",
                description: "Cannot delete: Bot data is missing.",
                variant: "destructive"
            });
            return;
        }

        // 3. Robust ID Extraction
        const botId = bot.id || bot._id || bot.botId;

        if (!botId) {
            console.error("Delete failed: No valid ID found in bot object. Object keys:", Object.keys(bot));
            toast({
                title: "Delete Error",
                description: "Invalid bot ID. Cannot delete this bot.",
                variant: "destructive"
            });
            return;
        }

        // 4. Call Engine Delete with validated ID
        try {
            const success = candleStrikeBotEngine.deleteBot(botId);

            if (success) {
                loadBots(); // Refresh the table immediately
                toast({
                    title: "Bot Deleted",
                    description: "Strategy bot removed successfully.",
                });
            } else {
                console.warn(`Delete failed: Engine returned false for ID ${botId}`);
                toast({
                    title: "Delete Failed",
                    description: "Could not find the specified bot in storage.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error("Exception during delete:", error);
            toast({
                title: "Delete Error",
                description: error.message || "An unexpected error occurred during deletion.",
                variant: "destructive"
            });
        }
    };

    const formatCountdown = (ms) => {
        const s = Math.ceil(ms / 1000);
        return `${s}s`;
    };

    const getStatusBadge = (status, isLocked) => {
        if (isLocked) {
            return (
                <Badge variant="outline" className="bg-[#FF6B35]/10 text-[#FF6B35] ring-1 ring-[#FF6B35]/30 border-0 px-2 py-0.5 flex items-center gap-1 font-bold">
                    <Lock className="w-3 h-3" /> LOCKED
                </Badge>
            );
        }
        switch (status) {
            case 'WAITING':
                return <Badge variant="outline" className="bg-[#00D9FF]/10 text-[#00D9FF] ring-1 ring-[#00D9FF]/30 border-0 px-2 py-0.5 animate-pulse font-bold"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> WAITING</Badge>;
            case 'ACTIVE':
                return <Badge variant="outline" className="bg-[#00FF41]/10 text-[#00FF41] ring-1 ring-[#00FF41]/30 border-0 px-2 py-0.5 font-bold">ACTIVE</Badge>;
            case 'PAUSED':
                return <Badge variant="outline" className="bg-[#252B33] text-[#A0A9B8] ring-1 ring-[#2A3038] border-0 px-2 py-0.5 font-bold">PAUSED</Badge>;
            default:
                return <Badge variant="outline" className="bg-[#252B33] text-white border-custom">{status}</Badge>;
        }
    };

    if (bots.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-40 text-[#A0A9B8] bg-[#1A1F26] rounded-lg border border-custom">
                <Flame className={cn("w-8 h-8 mb-2 opacity-50", filterColor === 'GREEN' ? 'text-[#00FF41]' : 'text-[#FF3B30]')} />
                <p className="text-sm">No {filterColor} Strategy bots.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-custom bg-[#1A1F26]">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#0F1419]/90 text-[#A0A9B8] uppercase text-[10px] font-bold border-b border-custom sticky top-0 backdrop-blur z-10">
                    <tr>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Strategy Config</th>
                        <th className="px-4 py-3">Position / Size</th>
                        <th className="px-4 py-3">TP / SL</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Detection Progress</th>
                        <th className="px-4 py-3">Execution Lock</th>
                        <th className="px-4 py-3">Template</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-custom">
                    {bots.map((bot) => {
                        const isPaused = bot.status === 'PAUSED';
                        const progress = typeof bot.currentConsecutiveCount === 'number' ? bot.currentConsecutiveCount : 0;
                        const target = bot.candleCount || 1;
                        const percent = Math.min(100, (progress / target) * 100);
                        const isGreen = bot.candleColor === 'GREEN';

                        const botId = bot.id || bot._id || `temp-${Math.random()}`;

                        return (
                            <tr key={botId} className="hover:bg-[#252B33] transition-colors">
                                <td className="px-4 py-3">
                                    {getStatusBadge(bot.status, lockStatus.locked && bot.status === 'WAITING')}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white">{bot.pair}</span>
                                            <span className="bg-[#252B33] px-1 rounded text-[10px] text-[#A0A9B8]">{bot.timeframe}</span>
                                        </div>
                                        <div className="text-[10px] text-[#A0A9B8] flex items-center gap-1.5">
                                            <span>Target:</span>
                                            <span className="font-bold text-white">{bot.candleCount}</span>
                                            <span className={cn("font-bold text-[9px] px-1 rounded border", isGreen ? "border-[#00FF41]/30 bg-[#00FF41]/10 text-[#00FF41]" : "border-[#FF3B30]/30 bg-[#FF3B30]/10 text-[#FF3B30]")}>
                                                {bot.candleColor}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-white">
                                            {bot.perCoinSize?.[bot.pair] || bot.baseOrderSize || 0} {bot.sizeMode || 'USDT'}
                                        </span>
                                        <span className="text-[10px] text-[#A0A9B8]">
                                            Mrg: {((bot.perCoinSize?.[bot.pair] || bot.baseOrderSize || 0) / (bot.perCoinLeverage?.[bot.pair] || bot.leverage || 1)).toFixed(2)}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col gap-1 text-[10px]">
                                        {(bot.takeProfitMode || bot.takeProfit) && (
                                            <div className="flex justify-between w-24">
                                                <span className="text-[#A0A9B8]">TP ({bot.takeProfitMode || 'UNK'}):</span>
                                                <span className="text-[#00FF41] font-mono">
                                                    {bot.takeProfitMode === 'PRICE' && `$${bot.takeProfit?.price || 0}`}
                                                    {bot.takeProfitMode === 'PERCENT' && `${bot.takeProfit?.percent || 0}%`}
                                                    {bot.takeProfitMode === 'PROFIT' && `$${bot.takeProfit?.profit || 0}`}
                                                    {!bot.takeProfitMode && (bot.takeProfit?.profit || bot.takeProfit?.percent || bot.takeProfit?.price || '0')}
                                                </span>
                                            </div>
                                        )}
                                        {(bot.stopLossMode || bot.stopLoss) && (
                                            <div className="flex justify-between w-24">
                                                <span className="text-[#A0A9B8]">SL ({bot.stopLossMode || 'UNK'}):</span>
                                                <span className="text-[#FF3B30] font-mono">
                                                    {bot.stopLossMode === 'PRICE' && `$${bot.stopLoss?.price || 0}`}
                                                    {bot.stopLossMode === 'PERCENT' && `${bot.stopLoss?.percent || 0}%`}
                                                    {bot.stopLossMode === 'LOSS' && `$${bot.stopLoss?.loss || 0}`}
                                                    {!bot.stopLossMode && (bot.stopLoss?.loss || bot.stopLoss?.percent || bot.stopLoss?.price || '0')}
                                                </span>
                                            </div>
                                        )}
                                        {!bot.takeProfitMode && !bot.stopLossMode && !bot.takeProfit && !bot.stopLoss && <span className="text-[#A0A9B8] italic">Not Set</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant="outline" className="bg-[#252B33] text-white border-custom font-mono">
                                        {bot.perCoinLeverage?.[bot.pair] || bot.leverage || '1'}x
                                    </Badge>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="w-32">
                                        <div className="flex justify-between text-[10px] mb-1">
                                            <span className="text-[#A0A9B8]">Match ({isGreen ? 'GREEN' : 'RED'})</span>
                                            <span className={cn("font-bold", isGreen ? "text-[#00FF41]" : "text-[#FF3B30]")}>
                                                {progress}/{target}
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-[#0F1419] rounded-full overflow-hidden border border-custom">
                                            <div
                                                className={cn("h-full transition-all duration-300 ease-out", isGreen ? "bg-[#00FF41] shadow-glow-green" : "bg-[#FF3B30] shadow-glow-orange")}
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    {lockStatus.locked ? (
                                        <div className="flex items-center gap-2 text-xs text-[#FF6B35] animate-pulse font-bold">
                                            <Lock className="w-3 h-3" />
                                            <span className="font-mono">{formatCountdown(lockStatus.remaining)}</span>
                                            {lockStatus.executingColor && (
                                                <span className="text-[9px] opacity-70">
                                                    ({lockStatus.executingColor === 'GREEN' ? 'Green' : 'Red'} Executed)
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-[#00FF41] flex items-center gap-1 font-bold">
                                            <Activity className="w-3 h-3" /> Ready
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5 opacity-80 bg-[#0F1419] px-2 py-0.5 rounded border border-custom w-fit">
                                        <FileText className="w-3 h-3 text-[#9D4EDD]" />
                                        <span className="text-xs text-[#A0A9B8] truncate w-20" title={bot.templateName}>
                                            {bot.templateName}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#252B33]" onClick={() => handleToggle(bot.id)}>
                                            {isPaused ? <Play className="w-3 h-3 text-[#00FF41]" /> : <Pause className="w-3 h-3 text-[#FF6B35]" />}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#252B33]" onClick={() => onEdit(bot)}>
                                            <Edit className="w-3 h-3 text-[#00D9FF]" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 hover:bg-[#FF3B30]/20 hover:text-[#FF3B30]"
                                            onClick={() => handleDelete(bot)}
                                            title="Delete Bot"
                                        >
                                            <Trash2 className="w-3 h-3 text-[#FF3B30]/70" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}