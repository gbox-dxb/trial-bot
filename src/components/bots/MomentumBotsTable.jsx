import React, { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { momentumBotEngine } from '@/lib/momentumBotEngine';
import { Play, Pause, Trash2, Edit, FileText, RefreshCw, CheckCircle2, Clock, Shield, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

export default function MomentumBotsTable({ refreshTrigger, onEdit }) {
  const [bots, setBots] = useState([]);
  const [now, setNow] = useState(Date.now());
  const { toast } = useToast();

  const loadBots = () => {
    setBots(storage.getMomentumBots().reverse());
  };

  useEffect(() => {
    loadBots();
    
    // Regular polling for time-based updates (cooldowns etc)
    const interval = setInterval(() => {
        loadBots();
        setNow(Date.now());
    }, 1000); 

    // Event listener for immediate updates from engine
    const handleUpdate = () => {
        loadBots();
        setNow(Date.now());
    };
    
    window.addEventListener('momentum-bots-updated', handleUpdate);

    return () => {
        clearInterval(interval);
        window.removeEventListener('momentum-bots-updated', handleUpdate);
    };
  }, [refreshTrigger]);

  const toggleStatus = (bot) => {
    const newStatus = bot.status === 'Waiting' ? 'Paused' : 'Waiting';
    if (bot.status === 'Active') {
        momentumBotEngine.updateBot(bot.id, { status: 'Waiting', triggerDetails: null });
        toast({ title: "Bot Reset", description: "Bot is now waiting for triggers again." });
    } else {
        momentumBotEngine.updateBot(bot.id, { status: newStatus });
        toast({ title: `Bot ${newStatus}`, description: `Bot status updated.` });
    }
  };

  const deleteBot = (id) => {
    momentumBotEngine.deleteBot(id);
    toast({ title: "Bot Deleted" });
  };

  const getSafetyStatus = (bot) => {
      const cooldownMs = momentumBotEngine.getCooldownDurationMs(bot);
      const remainingCooldown = (bot.lastTriggerTime + cooldownMs) - now;
      const isCooldownActive = remainingCooldown > 0;

      return {
          remainingCooldown: isCooldownActive ? remainingCooldown : 0,
          dailyCount: bot.dailyTradeCount || 0,
          limit: bot.maxTradesPerDay || 999,
          oneTrade: bot.oneTradeAtATime
      };
  };

  if (bots.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-40 text-[#A0A9B8] bg-[#1A1F26] rounded-lg border border-[#2A3038]">
            <Clock className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No momentum bots created.</p>
        </div>
      );
  }

  return (
    <div className="bg-[#1A1F26] rounded-xl border border-[#2A3038] overflow-hidden h-full flex flex-col">
       <div className="p-3 border-b border-[#2A3038] flex justify-between items-center bg-[#0F1419]/90">
           <h3 className="font-bold text-white text-sm">Strategy Monitor</h3>
           <Button variant="ghost" size="sm" onClick={loadBots} className="h-6 w-6 p-0 hover:bg-[#252B33]"><RefreshCw className="w-3 h-3 text-[#A0A9B8]"/></Button>
       </div>
       <div className="overflow-auto flex-1 custom-scrollbar">
           <table className="w-full text-xs text-left whitespace-nowrap">
               <thead className="bg-[#0F1419]/50 text-[#A0A9B8] font-medium sticky top-0 z-10 backdrop-blur-md">
                   <tr>
                       <th className="px-3 py-2">Status</th>
                       <th className="px-3 py-2">Strategy</th>
                       <th className="px-3 py-2">Last Execution</th>
                       <th className="px-3 py-2">Template</th>
                       <th className="px-3 py-2">Safety</th>
                       <th className="px-3 py-2 text-right">Actions</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-[#2A3038] text-white">
                   {bots.map(bot => {
                       const isWaiting = bot.status === 'Waiting';
                       const isActive = bot.status === 'Active';
                       const safety = getSafetyStatus(bot);
                       const trigger = bot.triggerDetails;
                       
                       return (
                       <tr key={bot.id} className="hover:bg-[#252B33] transition-colors">
                           <td className="px-3 py-2">
                               <Badge 
                                variant="outline" 
                                className={cn(
                                    "border-0 px-2 py-0.5 font-bold",
                                    isWaiting && "bg-[#00D9FF]/20 text-[#00D9FF] ring-1 ring-[#00D9FF]/30",
                                    isActive && "bg-[#00FF41]/20 text-[#00FF41] ring-1 ring-[#00FF41]/30",
                                    (!isWaiting && !isActive) && "bg-[#FF3B30]/20 text-[#FF3B30] ring-1 ring-[#FF3B30]/30"
                                )}>
                                    {isWaiting && <Clock className="w-3 h-3 mr-1" />}
                                    {isActive && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                    {bot.status.toUpperCase()}
                               </Badge>
                           </td>
                           <td className="px-3 py-2">
                               <div className="flex flex-col">
                                   <span className="font-bold text-white">{bot.pair}</span>
                                   <div className="flex items-center gap-1 text-[10px] text-[#A0A9B8]">
                                       <span>Move ${bot.dollarAmount}</span>
                                       <span>in</span>
                                       <span className="bg-[#252B33] px-1 rounded text-gray-300">{bot.timeframe}</span>
                                   </div>
                               </div>
                           </td>
                           <td className="px-3 py-2">
                               {trigger ? (
                                   <div className="bg-[#252B33] p-1.5 rounded border border-[#2A3038] shadow-sm animate-in fade-in duration-300">
                                       <div className="flex items-center gap-1.5 mb-0.5">
                                           {trigger.signal === 'LONG' ? 
                                              <ArrowUpRight className="w-3 h-3 text-[#00FF41]" /> : 
                                              <ArrowDownRight className="w-3 h-3 text-[#FF3B30]" />
                                           }
                                           <span className="font-bold text-white">${trigger.price.toFixed(2)}</span>
                                           <span className="text-[9px] px-1 bg-[#1A1F26] rounded text-[#A0A9B8]">ORDER PLACED</span>
                                       </div>
                                       <div className="text-[10px] text-[#A0A9B8] flex justify-between gap-2">
                                          <span>Δ ${Math.abs(trigger.delta).toFixed(2)}</span>
                                          <span>{format(trigger.time, 'HH:mm:ss')}</span>
                                       </div>
                                   </div>
                               ) : (
                                   <span className="text-[#A0A9B8] italic text-[10px]">-- Waiting --</span>
                               )}
                           </td>
                           <td className="px-3 py-2">
                               <div className="flex items-center gap-1.5">
                                   <FileText className="w-3 h-3 text-[#9D4EDD]" />
                                   <span className="font-medium text-[#A0A9B8] truncate max-w-[100px]" title={bot.templateName}>
                                       {bot.templateName}
                                   </span>
                               </div>
                           </td>
                           <td className="px-3 py-2">
                               <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                       <span className={cn("text-[10px]", safety.dailyCount >= safety.limit ? "text-[#FF3B30] font-bold" : "text-[#A0A9B8]")}>
                                           {safety.dailyCount}/{safety.limit}
                                       </span>
                                       {safety.oneTrade && <Shield className="w-3 h-3 text-[#00D9FF]" />}
                                    </div>
                                    {safety.remainingCooldown > 0 && (
                                       <span className="text-[9px] text-[#FF6B35]">
                                           Cool: {(safety.remainingCooldown / 1000).toFixed(0)}s
                                       </span>
                                    )}
                               </div>
                           </td>
                           <td className="px-3 py-2 text-right">
                               <div className="flex justify-end gap-1">
                                   <button 
                                      onClick={() => toggleStatus(bot)} 
                                      className={cn("p-1.5 rounded transition", 
                                        isActive ? "text-[#00D9FF] hover:bg-[#00D9FF]/20" : "text-[#A0A9B8] hover:text-white hover:bg-[#252B33]"
                                      )}
                                      title={isActive ? "Reset to Waiting" : (isWaiting ? "Pause" : "Resume")}
                                   >
                                       {isActive ? <RefreshCw className="w-3.5 h-3.5" /> : (isWaiting ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />)}
                                   </button>
                                   <button onClick={() => onEdit(bot)} className="p-1.5 hover:bg-[#252B33] rounded text-[#00D9FF] hover:text-white transition">
                                       <Edit className="w-3.5 h-3.5" />
                                   </button>
                                   <button onClick={() => deleteBot(bot.id)} className="p-1.5 hover:bg-[#FF3B30]/20 rounded text-[#FF3B30] transition">
                                       <Trash2 className="w-3.5 h-3.5" />
                                   </button>
                               </div>
                           </td>
                       </tr>
                   )})}
               </tbody>
           </table>
       </div>
    </div>
  );
}