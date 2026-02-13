import React, { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { Play, Pause, Trash2, Edit, TrendingUp, TrendingDown, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import GridBotForm from './GridBotForm';

export default function GridBotsTable({ refreshTrigger }) {
  const [bots, setBots] = useState([]);
  const [editingBot, setEditingBot] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBots();
    const interval = setInterval(loadBots, 2000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const loadBots = () => {
    setBots(storage.getGridBots().reverse());
  };

  const handleToggle = (bot) => {
    const newStatus = bot.status === 'active' ? 'stopped' : 'active';
    const updatedBots = bots.map(b => 
      b.id === bot.id ? { ...b, status: newStatus } : b
    );
    storage.saveGridBots(updatedBots);
    setBots(updatedBots);
    
    toast({
      title: `Bot ${newStatus === 'active' ? 'Resumed' : 'Stopped'}`,
      description: `${bot.pair} grid bot is now ${newStatus}.`
    });
  };

  const handleDelete = (id) => {
    const updatedBots = bots.filter(b => b.id !== id);
    storage.saveGridBots(updatedBots);
    setBots(updatedBots);
    toast({ title: "Bot Deleted", variant: "destructive" });
  };

  const handleEdit = (bot) => {
    setEditingBot(bot);
    setIsEditOpen(true);
  };

  const onBotUpdated = () => {
    setIsEditOpen(false);
    loadBots();
  };

  if (bots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-slate-900/30 rounded-xl border border-dashed border-custom">
        <div className="p-4 rounded-full bg-slate-800/50 mb-4">
            <TrendingUp className="w-8 h-8 text-purple-500/50" />
        </div>
        <h3 className="text-lg font-medium text-white mb-1">No Active Grid Bots</h3>
        <p className="text-gray-500 text-sm">Create a new bot to start automating your trades.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-custom custom-scrollbar">
      <table className="w-full bg-slate-900/50 backdrop-blur-xl min-w-[800px]">
        <thead className="bg-slate-900 text-[11px] uppercase text-gray-400 font-medium tracking-wider">
          <tr>
            <th className="px-6 py-4 text-left">Pair / Strategy</th>
            <th className="px-6 py-4 text-left">Range / Grids</th>
            <th className="px-6 py-4 text-left">Investment</th>
            <th className="px-6 py-4 text-left">Safety</th>
            <th className="px-6 py-4 text-left">Status</th>
            <th className="px-6 py-4 text-left">P/L (Total)</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-custom">
          {bots.map((bot) => {
            const isLong = bot.strategyDirection === 'Long';
            const isShort = bot.strategyDirection === 'Short';
            const strategyColor = isLong ? 'text-green-400' : (isShort ? 'text-red-400' : 'text-purple-400');
            const Icon = isLong ? TrendingUp : (isShort ? TrendingDown : TrendingUp); // Simple logic for now

            return (
              <tr key={bot.id} className="hover:bg-purple-900/5 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${bot.status === 'active' ? 'bg-purple-500/20' : 'bg-slate-700/50'}`}>
                         <Icon className={`w-4 h-4 ${strategyColor}`} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{bot.pair}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-gray-300 font-mono">
                                {bot.leverage}x
                            </span>
                        </div>
                        <span className={`text-[10px] ${strategyColor} font-medium uppercase`}>{bot.strategyDirection || 'Neutral'}</span>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="text-xs space-y-1">
                    <div className="text-gray-300 font-mono">
                        {parseFloat(bot.lowerPrice).toLocaleString()} - {parseFloat(bot.upperPrice).toLocaleString()}
                    </div>
                    <div className="text-gray-500">
                        {bot.gridLines} Grids <span className="text-gray-600 mx-1">•</span> {bot.gridsFilled || 0} Filled
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white">${bot.totalRequired}</div>
                    <div className="text-[10px] text-gray-500">Margin: ${bot.marginRequired}</div>
                </td>

                <td className="px-6 py-4">
                    <div className="flex gap-1">
                        {bot.takeProfitEnabled && (
                            <div className="px-1.5 py-0.5 bg-green-900/30 border border-custom rounded text-[10px] text-green-400 font-mono" title={`TP: ${bot.takeProfitPercent}%`}>
                                TP
                            </div>
                        )}
                        {bot.stopLossEnabled && (
                             <div className="px-1.5 py-0.5 bg-red-900/30 border border-custom rounded text-[10px] text-red-400 font-mono" title={`SL: ${bot.stopLossPercent}%`}>
                                SL
                            </div>
                        )}
                        {bot.pumpProtectionEnabled && (
                             <div className="px-1.5 py-0.5 bg-blue-900/30 border border-custom rounded text-[10px] text-blue-400 flex items-center justify-center" title="Pump Protection Active">
                                <Shield className="w-2.5 h-2.5" />
                            </div>
                        )}
                        {!bot.takeProfitEnabled && !bot.stopLossEnabled && !bot.pumpProtectionEnabled && (
                            <span className="text-gray-600 text-[10px]">-</span>
                        )}
                    </div>
                </td>
                
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                    bot.status === 'active' 
                      ? 'bg-green-500/10 text-green-400 border-custom' 
                      : 'bg-gray-500/10 text-gray-400 border-custom'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${bot.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                    {bot.status === 'active' ? 'Running' : 'Stopped'}
                  </span>
                </td>
                
                <td className="px-6 py-4">
                    <div className={`font-mono text-sm font-bold ${bot.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {bot.totalPnL >= 0 ? '+' : ''}{bot.totalPnL?.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-gray-500">
                        {(Math.random() * 2).toFixed(2)}%
                    </div>
                </td>
                
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 hover:bg-purple-500/20 hover:text-purple-300"
                      onClick={() => handleToggle(bot)}
                    >
                      {bot.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </Button>
                    
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-blue-500/20 hover:text-blue-300"
                        onClick={() => handleEdit(bot)}
                    >
                        <Edit className="w-3.5 h-3.5" />
                    </Button>

                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 hover:bg-red-500/20 hover:text-red-300"
                      onClick={() => handleDelete(bot.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-[450px] p-0 overflow-hidden bg-transparent border-none shadow-none">
             <div className="h-[80vh]">
                 {editingBot && (
                    <GridBotForm 
                        defaultSymbol={editingBot.pair} 
                        existingBot={editingBot} 
                        onBotCreated={onBotUpdated} 
                    />
                 )}
             </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}