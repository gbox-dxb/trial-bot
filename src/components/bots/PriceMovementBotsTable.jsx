import React from 'react';
import { priceMovementBotEngine } from '@/lib/priceMovementBotEngine';
import { Play, Pause, Trash2, FileText, Settings, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function PriceMovementBotsTable({ bots = [], onRefresh }) {
  
  const toggleBot = (id) => {
    priceMovementBotEngine.toggleBotStatus(id);
    onRefresh();
  };

  const deleteBot = (id) => {
    priceMovementBotEngine.deleteBot(id);
    onRefresh();
  };

  if (!bots.length) {
      return (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <Activity className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No active Price Momentum bots.</p>
          </div>
      );
  }

  return (
    <div className="overflow-auto max-h-[400px]">
       <table className="w-full text-sm text-left whitespace-nowrap">
           <thead className="bg-slate-900/80 text-gray-400 sticky top-0 backdrop-blur z-10 border-b border-slate-700">
               <tr>
                   <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Status</th>
                   <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Template</th>
                   <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Strategy Config</th>
                   <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Last Trigger</th>
                   <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Active Orders</th>
                   <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-right">Actions</th>
               </tr>
           </thead>
           <tbody className="divide-y divide-slate-800 text-gray-300">
               {bots.map(bot => {
                   const isActive = bot.status === 'active';
                   return (
                       <tr key={bot.id} className="hover:bg-slate-800/40 transition-colors">
                           <td className="px-4 py-3">
                               <Badge variant={isActive ? "default" : "outline"} className={isActive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "text-gray-500 border-gray-700"}>
                                    {isActive ? 'ACTIVE' : 'PAUSED'}
                               </Badge>
                           </td>
                           <td className="px-4 py-3">
                               <div className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded w-fit text-xs border border-slate-700">
                                   <FileText className="w-3 h-3 text-purple-400" />
                                   <span className="font-medium text-gray-200">{bot.templateName || 'Unspecified'}</span>
                               </div>
                           </td>
                           <td className="px-4 py-3">
                               <div className="flex flex-col gap-1 text-[10px]">
                                   <div className="flex items-center gap-2">
                                       <span className="text-gray-400">Threshold:</span>
                                       <span className="text-white font-bold">{bot.threshold}%</span>
                                       <span className="text-gray-500 mx-1">|</span>
                                       <span className="text-gray-400">Confirm:</span>
                                       <span className="text-white">{bot.confirmationPeriod}c</span>
                                   </div>
                                   <div className="flex items-center gap-2">
                                       <span className={`px-1 rounded bg-slate-800 ${bot.direction === 'Up' ? 'text-green-400' : bot.direction === 'Down' ? 'text-red-400' : 'text-blue-400'}`}>
                                           {bot.direction}
                                       </span>
                                       <span className="text-gray-500">•</span>
                                       <span className="text-gray-300">{bot.sensitivity} Sens.</span>
                                       <span className="text-gray-500">•</span>
                                       <span className="text-gray-300">{bot.riskLevel}</span>
                                   </div>
                               </div>
                           </td>
                           <td className="px-4 py-3">
                               {bot.lastTriggerTime ? (
                                   <span className="text-xs font-mono text-gray-400">
                                       {format(bot.lastTriggerTime, 'HH:mm:ss')}
                                   </span>
                               ) : (
                                   <span className="text-[10px] italic text-gray-600">Waiting...</span>
                               )}
                           </td>
                           <td className="px-4 py-3">
                               <span className="font-mono font-bold text-white bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                                   {bot.activeOrdersCount || 0}
                               </span>
                           </td>
                           <td className="px-4 py-3 text-right">
                               <div className="flex justify-end gap-1">
                                   <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleBot(bot.id)}>
                                       {isActive ? <Pause className="w-3.5 h-3.5 text-yellow-400"/> : <Play className="w-3.5 h-3.5 text-green-400"/>}
                                   </Button>
                                   <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteBot(bot.id)}>
                                       <Trash2 className="w-3.5 h-3.5 text-red-400"/>
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