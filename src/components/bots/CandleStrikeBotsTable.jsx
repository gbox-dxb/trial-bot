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
        const loadedBots = candleStrikeBotEngine.getBotsByColor(filterColor).reverse();
        setBots(loadedBots || []);
        setLockStatus(candleStrikeBotEngine.isSystemLocked() || { locked: false });
    };

    const handleToggle = (id) => {
        if (!id) return;
        candleStrikeBotEngine.toggleBot(id);
        loadBots();
        toast({ title: "Bot Updated", description: "Bot status toggled successfully." });
    };

    const handleDelete = (bot) => {
        if (!bot) return;
        const botId = bot.id || bot._id || bot.botId;
        if (!botId) return;

        try {
            const success = candleStrikeBotEngine.deleteBot(botId);
            if (success) {
                loadBots();
                toast({ title: "Bot Deleted", description: "Strategy bot removed successfully." });
            }
        } catch (error) {
            toast({ title: "Delete Error", description: error.message, variant: "destructive" });
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
                return <Badge variant="outline" className="bg-[#252B33] text-white border-custom px-2 py-0.5">{status}</Badge>;
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
                        <th className="px-4 py-3">Source / Pairs</th>
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
                        const botId = bot.id || bot._id || `bot-${Math.random()}`;
                        const isPaused = bot.status === 'PAUSED';
                        const progress = typeof bot.currentConsecutiveCount === 'number' ? bot.currentConsecutiveCount : 0;
                        const target = bot.candleCount || 1;
                        const percent = Math.min(100, (progress / target) * 100);
                        const isGreen = bot.candleColor === 'GREEN';

                        // Safely handle numeric display to prevent crashes
                        const marginVal = Number(bot.margin || 0);
                        const levVal = Number(bot.leverage || 1);
                        const requiredMargin = marginVal / levVal;

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
                                        <span className="font-mono font-medium text-slate-200">
                                            ${marginVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-[10px] text-slate-500">
                                            margin used: ${requiredMargin.toFixed(2)}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="font-mono font-medium text-slate-200 text-[10px]">
                                            TP (Profit Target): {typeof bot.tp === 'object' ? JSON.stringify(bot.tp) : (bot.tp || '0.00')}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-mono">
                                            SL (Loss Target): {typeof bot.sl === 'object' ? JSON.stringify(bot.sl) : (bot.sl || '0.00')}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-slate-200 font-mono">
                                    ${(Number(bot.entryPrice) || 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col gap-1 w-24">
                                        <div className="h-1.5 w-full bg-[#0F1419] rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full transition-all duration-500", isGreen ? "bg-[#00FF41]" : "bg-[#FF3B30]")}
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                        <span className="text-[9px] text-[#A0A9B8] font-bold uppercase">{progress}/{target} Candles</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    {lockStatus.locked && lockStatus.executingColor === bot.candleColor ? (
                                        <div className="flex items-center gap-1.5 text-[#FF6B35] font-bold text-[10px]">
                                            <Activity className="w-3 h-3 animate-pulse" />
                                            EXECUTING ({formatCountdown(lockStatus.remaining)})
                                        </div>
                                    ) : (
                                        <span className="text-[#A0A9B8] text-[10px]">READY</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant="outline" className="bg-[#252B33] text-[#A0A9B8] border-custom text-[10px]">
                                        <FileText className="w-3 h-3 mr-1" /> STANDARD
                                    </Badge>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:bg-blue-900/20" onClick={() => onEdit(bot)}>
                                            <Edit className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className={cn("h-8 w-8", isPaused ? "text-emerald-400" : "text-yellow-400")} onClick={() => handleToggle(botId)}>
                                            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-900/20" onClick={() => handleDelete(bot)}>
                                            <Trash2 className="w-3.5 h-3.5" />
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
