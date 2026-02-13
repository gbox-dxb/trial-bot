import React, { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { Play, Pause, Trash2, Edit, Activity, FileText, Clock, AlertCircle, Shield, MousePointerClick } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { usePrice } from '@/contexts/PriceContext';
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';

export default function RSIBotsTable({ refreshTrigger, onEdit }) {
  const [bots, setBots] = useState([]);
  const { toast } = useToast();
  const { prices } = usePrice();

  useEffect(() => {
    loadBots();
  }, [refreshTrigger]);

  const loadBots = () => {
    setBots(storage.getRSIBots().reverse());
  };

  const handleToggle = (bot) => {
    let newStatus;
    if (bot.status === 'Stopped') {
        newStatus = 'Waiting';
    } else {
        newStatus = 'Stopped';
    }
    
    const updated = { ...bot, status: newStatus };
    const allBots = storage.getRSIBots().map(b => b.id === bot.id ? updated : b);
    storage.saveRSIBots(allBots);
    setBots(allBots);
    toast({ title: "Bot Updated", description: `Bot status changed to ${newStatus}` });
  };

  const handleDelete = (id) => {
    storage.deleteRSIBot(id);
    loadBots();
    toast({ title: "Bot Deleted", variant: "destructive" });
  };

  if (bots.length === 0) {
      return <div className="p-8 text-center text-[#A0A9B8]">No RSI bots created yet.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#2A3038] bg-[#1A1F26]">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-[#0F1419]/90 text-[#A0A9B8] text-[10px] uppercase font-bold sticky top-0 backdrop-blur-md border-b border-[#2A3038]">
            <tr>
                <th className="px-4 py-3">Pair / Timeframe</th>
                <th className="px-4 py-3">Trigger Config</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Safety & Limits</th>
                <th className="px-4 py-3">Live Monitor</th>
                <th className="px-4 py-3 text-right">Actions</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-[#2A3038]">
            {bots.map(bot => {
                const mockLiveRSI = bot.lastRSI || '-'; 
                const isActive = bot.status === 'Active';
                const isWaiting = bot.status === 'Waiting';
                const isStopped = bot.status === 'Stopped';

                return (
                <tr key={bot.id} className="hover:bg-[#252B33] transition-colors">
                    <td className="px-4 py-3">
                        <div className="font-bold text-white">{bot.pair}</div>
                        <div className="text-[10px] text-[#A0A9B8]">{bot.timeframe}</div>
                    </td>
                    <td className="px-4 py-3">
                        <div className="text-xs text-[#A0A9B8] flex flex-col gap-0.5">
                            <span className="flex items-center gap-1">
                                {bot.rsiLength} Period RSI
                            </span>
                            <div className="flex items-center gap-2">
                                <span className={`font-mono font-bold ${bot.triggerType === 'Oversold' ? 'text-[#00FF41]' : 'text-[#FF3B30]'}`}>
                                    {bot.triggerType === 'Oversold' ? '≤' : '≥'} {bot.rsiValue}
                                </span>
                                <Badge variant="outline" className="text-[9px] border-[#2A3038] text-[#A0A9B8] px-1.5 h-4">
                                    {bot.triggerMode || 'Touches'}
                                </Badge>
                            </div>
                        </div>
                    </td>
                    <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                            <Badge className={`w-fit text-[10px] px-2 py-0.5 font-bold ${
                                isActive 
                                    ? 'bg-[#00FF41]/20 text-[#00FF41] border border-[#00FF41]/30 shadow-glow-green' 
                                    : isWaiting
                                        ? 'bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30 animate-pulse' 
                                        : 'bg-[#FF3B30]/20 text-[#FF3B30] border border-[#FF3B30]/30'
                            }`}>
                                {isWaiting ? 'WAITING' : (bot.status || 'STOPPED')}
                            </Badge>
                            {isActive && bot.lastActiveTime && (
                                <span className="text-[9px] text-[#A0A9B8] flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    {formatDistanceToNow(bot.lastActiveTime, { addSuffix: true })}
                                </span>
                            )}
                        </div>
                    </td>
                    <td className="px-4 py-3">
                         <div className="flex flex-col gap-1 text-[10px] text-[#A0A9B8]">
                             {bot.oneTradeAtATime && (
                                 <span className="flex items-center gap-1 text-[#00D9FF]">
                                     <Shield className="w-2.5 h-2.5" /> 1 Trade at a time
                                 </span>
                             )}
                             <span className="flex items-center gap-1">
                                 <Clock className="w-2.5 h-2.5" /> CD: {bot.cooldownSeconds}s
                             </span>
                             <span className="font-mono">
                                 Daily: <span className="text-white font-bold">{bot.dailyTradeCount || 0}</span> / {bot.maxTradesPerDay || 10}
                             </span>
                         </div>
                    </td>
                    <td className="px-4 py-3">
                         <div className="flex items-center gap-2">
                             <div className="text-xs">
                                 <span className="text-[#A0A9B8] mr-1">RSI:</span> 
                                 <span className={`font-mono font-bold ${
                                     typeof mockLiveRSI === 'number' && (
                                         (bot.triggerType === 'Oversold' && mockLiveRSI <= bot.rsiValue + 5) || 
                                         (bot.triggerType !== 'Oversold' && mockLiveRSI >= bot.rsiValue - 5)
                                     ) ? 'text-[#FF6B35]' : 'text-white'
                                 }`}>
                                     {typeof mockLiveRSI === 'number' ? mockLiveRSI.toFixed(2) : mockLiveRSI}
                                 </span>
                             </div>
                         </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                             <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#252B33]" onClick={() => handleToggle(bot)}>
                                {isStopped ? <Play className="w-3 h-3 text-[#00FF41]"/> : <Pause className="w-3 h-3 text-[#FF6B35]"/>}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#252B33]" onClick={() => onEdit(bot)}>
                                <Edit className="w-3 h-3 text-[#00D9FF]"/>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#252B33]" onClick={() => handleDelete(bot.id)}>
                                <Trash2 className="w-3 h-3 text-[#FF3B30]"/>
                            </Button>
                        </div>
                    </td>
                </tr>
            )})}
        </tbody>
      </table>
    </div>
  );
}