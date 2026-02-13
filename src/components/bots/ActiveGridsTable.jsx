import React, { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { gridBotEngine } from '@/lib/gridBotEngine';
import { Play, Pause, Trash2, Edit, TrendingUp, TrendingDown, Clock, Shield, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function ActiveGridsTable({ refreshTrigger }) {
  const [bots, setBots] = useState([]);
  const [editingBot, setEditingBot] = useState(null);
  const [tpSlEdit, setTpSlEdit] = useState({ tp: '', sl: '' });
  const { toast } = useToast();

  useEffect(() => {
    loadBots();
    // Periodic refresh for PnL and Countdown
    const interval = setInterval(() => {
        gridBotEngine.checkAndExpireBots(); // Auto-expire logic
        loadBots();
    }, 2000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const loadBots = () => {
    const loadedBots = storage.getGridBots() || [];
    // Ensure bots is an array and filter out invalid entries if necessary
    setBots(Array.isArray(loadedBots) ? loadedBots.reverse() : []);
  };

  const handleCloseGrid = (id) => {
      // In a real app, this would close all open orders
      gridBotEngine.deleteBot(id);
      loadBots();
      toast({ title: "Grid Closed", description: "All orders cancelled." });
  };

  const handleEditTPSL = (bot) => {
      setEditingBot(bot);
      setTpSlEdit({ 
          tp: bot.takeProfitValue || '', 
          sl: bot.stopLossValue || '' 
      });
  };

  const saveTPSL = () => {
      if (editingBot) {
          const updates = {
              takeProfitEnabled: !!tpSlEdit.tp,
              takeProfitValue: parseFloat(tpSlEdit.tp) || 0,
              stopLossEnabled: !!tpSlEdit.sl,
              stopLossValue: parseFloat(tpSlEdit.sl) || 0
          };
          gridBotEngine.updateBot(editingBot.id, updates);
          setEditingBot(null);
          loadBots();
          toast({ title: "Updated", description: "TP/SL settings updated." });
      }
  };

  const getRemainingTime = (expiry) => {
      if (!expiry) return 'Unlimited';
      const diff = expiry - Date.now();
      if (diff <= 0) return 'Expired';
      
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      return `${hours}h ${minutes}m`;
  };

  if (bots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-[#A0A9B8]">
        <div className="p-3 rounded-full bg-[#1A1F26] mb-3"><TrendingUp className="w-6 h-6 text-[#A0A9B8]" /></div>
        <p className="text-sm">No active grid bots found.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-custom custom-scrollbar bg-[#1A1F26]">
      <table className="w-full min-w-[900px]">
        <thead className="bg-[#0F1419]/80 text-[10px] uppercase text-[#A0A9B8] font-bold tracking-wider border-b border-custom">
          <tr>
            <th className="px-4 py-3 text-left">Grid / Pair</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Validity</th>
            <th className="px-4 py-3 text-left">TP / SL</th>
            <th className="px-4 py-3 text-left">Progress</th>
            <th className="px-4 py-3 text-left">Profit/Loss</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-custom text-sm">
          {bots.map((bot, index) => {
            if (!bot) return null; // Safety check for null bot objects
            
            const isExpired = bot.status === 'expired';
            const isActive = bot.status === 'active';
            const orders = Array.isArray(bot.orders) ? bot.orders : [];
            const filledOrdersCount = orders.filter(o => o.status === 'FILLED').length;
            const totalGridLines = bot.gridLines || 1; // Prevent division by zero
            const progressPercentage = (filledOrdersCount / totalGridLines) * 100;
            
            // Ensure stable key
            const rowKey = bot.id || `grid-bot-${index}-${bot.pair}`;

            return (
              <tr key={rowKey} className="hover:bg-[#252B33] transition-colors group">
                {/* Grid / Pair */}
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{bot.pair || 'Unknown'}</span>
                          <span className="text-[10px] bg-[#0F1419] text-[#A0A9B8] px-1.5 rounded">{bot.leverage || 1}x</span>
                      </div>
                      <span className={`text-[10px] font-medium ${bot.strategyDirection === 'Long' ? 'text-[#00FF41]' : bot.strategyDirection === 'Short' ? 'text-[#FF3B30]' : 'text-[#9D4EDD]'}`}>
                          {bot.strategyDirection || 'Neutral'} Strategy
                      </span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                   <div className="flex items-center gap-1.5">
                       {isActive && <div className="w-2 h-2 rounded-full bg-[#00FF41] animate-pulse"></div>}
                       {isExpired && <div className="w-2 h-2 rounded-full bg-[#FF3B30]"></div>}
                       <span className={`text-xs font-bold uppercase ${isActive ? 'text-[#00FF41]' : 'text-[#A0A9B8]'}`}>{bot.status || 'Unknown'}</span>
                   </div>
                </td>

                {/* Validity */}
                <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-[#A0A9B8]">
                        <Clock className="w-3.5 h-3.5 text-[#A0A9B8]" />
                        <span className="font-mono">{getRemainingTime(bot.expiryTime)}</span>
                    </div>
                </td>

                {/* TP / SL */}
                <td className="px-4 py-3">
                    <div className="flex gap-1">
                        {bot.takeProfitEnabled ? (
                            <Badge variant="outline" className="border-custom text-[#00FF41] bg-[#00FF41]/10 text-[10px] h-5">
                                TP: {bot.takeProfitValue}{bot.takeProfitType === 'Percent' ? '%' : ''}
                            </Badge>
                        ) : <span className="text-[#A0A9B8] text-[10px]">-</span>}
                        {bot.stopLossEnabled && (
                            <Badge variant="outline" className="border-custom text-[#FF3B30] bg-[#FF3B30]/10 text-[10px] h-5">
                                SL: {bot.stopLossValue}{bot.stopLossType === 'Percent' ? '%' : ''}
                            </Badge>
                        )}
                    </div>
                </td>

                {/* Progress */}
                <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 w-24">
                        <div className="flex justify-between text-[10px] text-[#A0A9B8]">
                            <span>{filledOrdersCount} Filled</span>
                            <span>{totalGridLines} Total</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#0F1419] rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-[#9D4EDD]" 
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>
                </td>

                {/* PnL */}
                <td className="px-4 py-3">
                    <div className={`font-mono font-bold ${(bot.totalPnL || 0) >= 0 ? 'text-[#00FF41]' : 'text-[#FF3B30]'}`}>
                        {(bot.totalPnL || 0) >= 0 ? '+' : ''}{(bot.totalPnL || 0).toFixed(2)} USDT
                    </div>
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-[#252B33]" onClick={() => handleEditTPSL(bot)} title="Edit TP/SL">
                            <Edit className="w-3.5 h-3.5 text-[#00D9FF]" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-[#252B33]" onClick={() => handleCloseGrid(bot.id)} title="Close Grid">
                            <XCircle className="w-3.5 h-3.5 text-[#FF3B30]" />
                        </Button>
                    </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Edit TP/SL Dialog */}
      <Dialog open={!!editingBot} onOpenChange={(o) => !o && setEditingBot(null)}>
          <DialogContent className="bg-[#1A1F26] border-custom text-white shadow-glow-purple">
              <DialogHeader>
                  <DialogTitle>Update TP / SL</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                      <label className="text-xs text-[#A0A9B8]">Take Profit</label>
                      <Input 
                        value={tpSlEdit.tp} 
                        onChange={(e) => setTpSlEdit(p => ({...p, tp: e.target.value}))}
                        className="bg-[#0F1419] border-custom text-white"
                        placeholder="Value..."
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="text-xs text-[#A0A9B8]">Stop Loss</label>
                      <Input 
                        value={tpSlEdit.sl} 
                        onChange={(e) => setTpSlEdit(p => ({...p, sl: e.target.value}))}
                        className="bg-[#0F1419] border-custom text-white"
                        placeholder="Value..."
                      />
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingBot(null)} className="border-custom hover:bg-[#252B33] text-white">Cancel</Button>
                  <Button onClick={saveTPSL} className="bg-[#9D4EDD] hover:bg-[#8B3FCC] text-white">Save Changes</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}