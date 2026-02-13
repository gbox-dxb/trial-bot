import React, { useState } from 'react';
import { dcaBotEngine } from '@/lib/dcaBotEngine';
import { Play, Pause, Trash2, Edit, XOctagon, Eye } from 'lucide-react';
import { usePrice } from '@/contexts/PriceContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from 'date-fns';

export default function DCABotsTable({ bots = [], onRefresh, onEdit, onView }) {
  const { prices } = usePrice();
  const { toast } = useToast();
  const [botToCancel, setBotToCancel] = useState(null);
  
  const toggleBot = (id) => {
    dcaBotEngine.toggleBot(id);
    onRefresh();
    toast({ title: "Status Updated", description: "Bot status has been toggled." });
  };

  const deleteBot = (id) => {
    dcaBotEngine.deleteBot(id);
    onRefresh();
    toast({ title: "Bot Deleted", description: "DCA Bot removed." });
  };

  const handleCancelBot = () => {
      if (!botToCancel) return;
      dcaBotEngine.updateDCAStatus(botToCancel, 'cancelled');
      onRefresh();
      toast({ title: "Bot Cancelled", description: "DCA Bot has been cancelled." });
      setBotToCancel(null);
  };

  if (!bots.length) {
      return (
          <div className="flex flex-col items-center justify-center h-48 text-[#A0A9B8] space-y-2">
              <div className="p-3 rounded-full bg-[#1A1F26]">
                  <XOctagon className="w-6 h-6 opacity-50"/>
              </div>
              <p className="text-sm">No active DCA bots found.</p>
          </div>
      );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-custom bg-[#1A1F26]">
       <table className="w-full text-sm text-left">
           <thead className="bg-[#0F1419]/90 text-[#A0A9B8] sticky top-0 backdrop-blur-md z-10 border-b border-custom">
               <tr>
                   <th className="px-4 py-3 font-medium">Bot ID / Pair</th>
                   <th className="px-4 py-3 font-medium">Invested</th>
                   <th className="px-4 py-3 font-medium">Progress</th>
                   <th className="px-4 py-3 font-medium">Status</th>
                   <th className="px-4 py-3 font-medium">Created / Next Order</th>
                   <th className="px-4 py-3 font-medium text-right">Actions</th>
               </tr>
           </thead>
           <tbody className="divide-y divide-custom text-white">
               {bots.map(bot => {
                   const isLong = bot.direction === 'Long';
                   const currentPrice = prices[bot.pair] || bot.currentPrice;
                   const leverage = bot.leverage || 1;

                   return (
                       <tr key={bot.id} className="hover:bg-[#252B33] transition-colors group">
                           <td className="px-4 py-3">
                               <div className="font-bold flex flex-col gap-1">
                                   <div className="flex items-center gap-2">
                                       <span className="text-white">{bot.pair}</span>
                                       <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${isLong ? 'text-[#00FF41] border-[#00FF41]/30 bg-[#00FF41]/10' : 'text-[#FF3B30] border-[#FF3B30]/30 bg-[#FF3B30]/10'}`}>
                                           {bot.direction} {leverage}x
                                       </span>
                                   </div>
                                   <span className="text-[10px] text-[#A0A9B8] font-mono">{bot.id.substring(0, 12)}...</span>
                               </div>
                           </td>
                           <td className="px-4 py-3">
                               <div className="text-white font-mono">${bot.totalInvested?.toFixed(2) || '0.00'}</div>
                               <div className="text-[10px] text-[#A0A9B8]">Total Invested</div>
                           </td>
                           <td className="px-4 py-3">
                               <div className="w-full max-w-[100px] flex flex-col gap-1">
                                   <div className="flex justify-between text-[10px] text-[#A0A9B8]">
                                       <span>{bot.ordersExecuted || 0} Executed</span>
                                       <span>{bot.pendingOrders || 0} Pending</span>
                                   </div>
                                   <div className="w-full bg-[#252B33] h-1.5 rounded-full overflow-hidden">
                                       <div className="bg-[#9D4EDD] h-full transition-all duration-500" style={{ width: `${(bot.dcaOrdersFilled / bot.maxDCAOrders) * 100}%` }}></div>
                                   </div>
                               </div>
                           </td>
                           <td className="px-4 py-3">
                               <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase border flex w-fit items-center gap-1 font-bold ${
                                   bot.status === 'active' 
                                   ? 'bg-[#00FF41]/10 text-[#00FF41] border-[#00FF41]/20 shadow-glow-green' 
                                   : bot.status === 'cancelled' || bot.status === 'closed' ? 'bg-[#252B33] text-[#A0A9B8] border-custom'
                                   : 'bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/20'
                               }`}>
                                   <span className={`w-1.5 h-1.5 rounded-full ${bot.status === 'active' ? 'bg-[#00FF41] animate-pulse' : 'bg-[#A0A9B8]'}`}></span>
                                   {bot.status}
                               </span>
                           </td>
                           <td className="px-4 py-3">
                               <div className="flex flex-col text-xs text-[#A0A9B8]">
                                   <span>Created: {formatDistanceToNow(bot.createdAt, { addSuffix: true })}</span>
                                   {bot.status === 'active' && bot.nextOrderTime && (
                                       <span className="text-[#00D9FF]">Next: {formatDistanceToNow(bot.nextOrderTime, { addSuffix: true })}</span>
                                   )}
                               </div>
                           </td>
                           <td className="px-4 py-3 text-right">
                               <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                   <button onClick={() => onView(bot)} className="p-1.5 hover:bg-[#252B33] rounded text-[#00D9FF]" title="View Details">
                                       <Eye className="w-3.5 h-3.5"/>
                                   </button>
                                   
                                   {bot.status !== 'cancelled' && bot.status !== 'closed' && (
                                       <>
                                           <button onClick={() => toggleBot(bot.id)} className="p-1.5 hover:bg-[#252B33] rounded text-[#FF6B35]" title={bot.status === 'active' ? 'Pause' : 'Resume'}>
                                               {bot.status === 'active' ? <Pause className="w-3.5 h-3.5"/> : <Play className="w-3.5 h-3.5"/>}
                                           </button>
                                           
                                           <button 
                                              onClick={() => setBotToCancel(bot.id)}
                                              className="p-1.5 hover:bg-[#252B33] rounded text-[#FF3B30]" 
                                              title="Cancel Bot"
                                           >
                                              <XOctagon className="w-3.5 h-3.5"/>
                                           </button>
                                       </>
                                   )}
                                   
                                   <button onClick={() => deleteBot(bot.id)} className="p-1.5 hover:bg-[#252B33] rounded text-[#FF3B30]" title="Delete Record">
                                       <Trash2 className="w-3.5 h-3.5"/>
                                   </button>
                               </div>
                           </td>
                       </tr>
                   );
               })}
           </tbody>
       </table>

       <Dialog open={!!botToCancel} onOpenChange={(open) => !open && setBotToCancel(null)}>
          <DialogContent className="bg-[#1A1F26] border-custom text-white shadow-glow-purple">
              <DialogHeader>
                  <DialogTitle>Cancel DCA Bot?</DialogTitle>
                  <DialogDescription className="text-[#A0A9B8]">
                      This will stop all future orders. Existing open positions may need manual closing.
                  </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="ghost" onClick={() => setBotToCancel(null)} className="border-custom hover:bg-[#252B33] hover:text-white">
                    No, Keep Active
                  </Button>
                  <Button variant="destructive" onClick={handleCancelBot} className="bg-[#FF3B30] hover:bg-[#E6342B]">
                    Yes, Cancel Bot
                  </Button>
              </DialogFooter>
          </DialogContent>
       </Dialog>
    </div>
  );
}