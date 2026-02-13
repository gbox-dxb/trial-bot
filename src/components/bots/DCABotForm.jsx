import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { dcaBotEngine } from '@/lib/dcaBotEngine';
import { validateDCABot } from '@/lib/dcaBotValidation';
import { usePrice } from '@/contexts/PriceContext';
import { templateService } from '@/lib/templateService';
import { 
    AlertTriangle, TrendingUp, Plus, Trash, RotateCcw,
    FileText, Play, Zap, Shield, ChevronRight, Layers
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Link } from 'react-router-dom';

// Default Config
const DEFAULT_CONFIG = {
    exchangeAccount: 'demo-1',
    accountType: 'Futures',
    exchangeAccountId: 'mexc_futures_demo',
    timeframe: '15m',
    pair: 'BTCUSDT',
    selectedCoins: [], // Multi-coin
    direction: 'Long',
    leverage: 10,
    baseAmount: 100, 
    startCondition: 'Immediate',
    dcaMode: 'Auto',
    maxDCAOrders: 5,
    priceDeviation: 1.0, 
    orderSizeMultiplier: 1.5,
    priceDevMultiplier: 1.2,
    takeProfitPercent: 1.5,
    customDCAOrders: [],
    requiredInvestment: 0,
    templateId: null
};

export default function DCABotForm({ onConfigChange, onBotCreated, selectedBot }) {
  const { prices } = usePrice();
  const { toast } = useToast();
  
  // -- State --
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [validationErrors, setValidationErrors] = useState([]);
  const [templates, setTemplates] = useState([]);
  
  // Confirmation Modal
  const [confirmOpen, setConfirmOpen] = useState(false);

  const currentPrice = prices[config.pair] || 0;
  
  // Mock balance for validation
  const availableBalance = config.exchangeAccountId?.includes('demo') ? 10000 : 0;
  const isFutures = config.exchangeAccountId?.includes('futures');

  const onConfigChangeRef = useRef(onConfigChange);
  useEffect(() => {
      onConfigChangeRef.current = onConfigChange;
  }, [onConfigChange]);

  // -- Initialization --
  useEffect(() => {
    // Load Templates
    setTemplates(templateService.getTemplates());

    if (selectedBot) {
        setConfig({
            ...DEFAULT_CONFIG,
            ...selectedBot,
            baseAmount: Number(selectedBot.baseAmount),
            leverage: Number(selectedBot.leverage),
            maxDCAOrders: Number(selectedBot.maxDCAOrders),
            takeProfitPercent: Number(selectedBot.takeProfitPercent)
        });
    }
  }, [selectedBot]);

  // -- Calculations --
  const dcaCalculations = useMemo(() => {
    let levels = [];
    let totalInvested = config.baseAmount;
    let currentDev = 0;
    let currentSize = config.baseAmount;
    
    const stepDev = config.priceDeviation || 1.0;
    const sizeMult = config.orderSizeMultiplier || 1.0;
    const devMult = config.priceDevMultiplier || 1.0;

    if (config.dcaMode === 'Auto') {
        for (let i = 0; i < config.maxDCAOrders; i++) {
            let dev = i === 0 ? stepDev : stepDev * Math.pow(devMult, i);
            if (i === 0) currentDev = dev; else currentDev += dev;

            currentSize = i === 0 ? config.baseAmount : currentSize * sizeMult;
            
            const price = config.direction === 'Long'
                ? currentPrice * (1 - currentDev / 100)
                : currentPrice * (1 + currentDev / 100);

            levels.push({
                orderNumber: i + 1,
                deviation: currentDev,
                size: currentSize,
                price: price,
                filled: false
            });
            
            totalInvested += currentSize;
        }
    } else {
        config.customDCAOrders.forEach((ord, i) => {
            const price = config.direction === 'Long'
                ? currentPrice * (1 - ord.deviation / 100)
                : currentPrice * (1 + ord.deviation / 100);
            
            levels.push({
                orderNumber: i + 1,
                deviation: ord.deviation,
                size: ord.size,
                price: price,
                filled: false
            });
            totalInvested += ord.size;
        });
    }

    const requiredMargin = totalInvested / (isFutures ? (config.leverage || 1) : 1);
    
    const tpPrice = config.direction === 'Long'
        ? currentPrice * (1 + config.takeProfitPercent / 100)
        : currentPrice * (1 - config.takeProfitPercent / 100);

    return { levels, totalInvested, requiredMargin, tpPrice };
  }, [config, currentPrice, isFutures]);

  // -- Effects --
  useEffect(() => {
      if (onConfigChangeRef.current) {
          onConfigChangeRef.current({
              entryPrice: currentPrice,
              tpPrice: dcaCalculations.tpPrice,
              levels: dcaCalculations.levels,
              direction: config.direction,
              ...config
          });
      }
  }, [dcaCalculations, config, currentPrice]);

  useEffect(() => {
      const errors = validateDCABot(
          { ...config, requiredInvestment: dcaCalculations.requiredMargin }, 
          currentPrice, 
          availableBalance
      );
      
      // Prevent infinite loop by checking if errors actually changed
      setValidationErrors(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(errors)) {
              return errors;
          }
          return prev;
      });
  }, [config, dcaCalculations, currentPrice, availableBalance]);

  // -- Handlers --
  const handleInputChange = (field, value) => {
      setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleTemplateSelect = (e) => {
      const templateId = e.target.value;
      if (!templateId) {
          setConfig(prev => ({...DEFAULT_CONFIG})); // Reset to defaults if cleared
          return;
      }
      
      const template = templates.find(t => t.id === templateId);
      if (template && template.config) {
          const coins = template.selectedCoins || [];
          setConfig(prev => ({
              ...prev,
              ...template.config,
              templateId: template.id,
              selectedCoins: coins,
              pair: coins.length > 0 ? coins[0] : (template.config.pair || prev.pair)
          }));
          toast({ title: "Template Loaded", description: `Applied settings from ${template.name}` });
      }
  };

  const handleCreateConfirm = () => {
      if (validationErrors.length > 0) return;

      const botConfig = {
          ...config,
          requiredInvestment: dcaCalculations.requiredMargin
      };

      if (selectedBot) {
          dcaBotEngine.updateBotSettings(selectedBot.id, botConfig);
          toast({ title: "Bot Updated", description: "Your DCA bot settings have been updated." });
      } else {
          dcaBotEngine.createBot(botConfig, currentPrice);
          toast({ 
              title: "DCA Bot Created", 
              description: "Bot is active. Limit orders have been created in Terminal.",
              action: <Link to="/terminal" className="font-bold underline text-[#00D9FF]">View Orders</Link>
          });
          setConfig(DEFAULT_CONFIG);
      }
      
      setConfirmOpen(false);
      if (onBotCreated) onBotCreated();
  };

  const applyPreset = (preset) => {
      setConfig(prev => ({ ...prev, ...preset }));
      toast({ title: "Preset Applied", description: "Optimization settings loaded." });
  };

  // Custom Table Handlers
  const handleCustomOrderChange = (idx, field, val) => {
      const newOrders = [...config.customDCAOrders];
      newOrders[idx] = { ...newOrders[idx], [field]: parseFloat(val) || 0 };
      setConfig(prev => ({ ...prev, customDCAOrders: newOrders }));
  };

  const addCustomOrder = () => {
      const last = config.customDCAOrders[config.customDCAOrders.length - 1] || { deviation: 0 };
      setConfig(prev => ({
          ...prev,
          customDCAOrders: [...prev.customDCAOrders, { deviation: last.deviation + 1, size: prev.baseAmount }]
      }));
  };
  
  const removeCustomOrder = (idx) => {
      setConfig(prev => ({
          ...prev,
          customDCAOrders: prev.customDCAOrders.filter((_, i) => i !== idx)
      }));
  };

  const resetToAuto = () => {
      setConfig(prev => ({ ...prev, dcaMode: 'Auto' }));
  };

  const isMultiCoin = config.selectedCoins && config.selectedCoins.length > 1;

  return (
    <div className="h-full flex flex-col bg-[#1A1F26] border-l border-custom overflow-hidden">
       {/* Header */}
       <div className="p-4 border-b border-custom bg-[#0F1419] flex justify-between items-center flex-none">
          <h2 className="text-xl font-bold bg-gradient-to-r from-[#00D9FF] to-[#9D4EDD] bg-clip-text text-transparent">
              {selectedBot ? 'Edit DCA Bot' : 'DCA Config'}
          </h2>
       </div>

       <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-[#252B33]">
           
           {/* Section 1: Select Trading Template */}
           <section className="space-y-3">
               <div className="flex justify-between items-center text-xs text-[#A0A9B8] uppercase tracking-wider font-semibold">
                   <span>1. Select Trading Template</span>
               </div>
               
               <div className="p-3 bg-[#0F1419]/50 rounded-lg border border-custom space-y-3">
                    <div className="space-y-1">
                       <label className="text-xs text-[#A0A9B8] flex items-center gap-1"><FileText className="w-3 h-3 text-[#00D9FF]"/> Load Template</label>
                       <div className="flex gap-2">
                           <select 
                               value={config.templateId || ''} 
                               onChange={handleTemplateSelect}
                               className="flex-1 bg-[#1A1F26] text-white border border-custom rounded p-2 text-xs focus:border-[#00D9FF] outline-none"
                           >
                               <option value="">-- Default Configuration --</option>
                               {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                           </select>
                           {config.templateId && (
                               <Button 
                                   variant="ghost" 
                                   size="sm" 
                                   onClick={() => setConfig(DEFAULT_CONFIG)} 
                                   className="text-[10px] text-[#FF3B30] hover:text-[#FF3B30]/80 hover:bg-[#FF3B30]/10 h-auto px-2"
                               >
                                   Clear
                               </Button>
                           )}
                       </div>
                    </div>
                    
                    {/* Selected Template Details Summary */}
                    <div className="mt-2 p-2 bg-[#1A1F26] rounded border border-custom text-xs space-y-1">
                        {isMultiCoin ? (
                            <div className="mb-2">
                                <div className="flex items-center gap-1 text-[#9D4EDD] mb-1">
                                    <Layers className="w-3 h-3"/>
                                    <span className="font-bold">Multi-Coin Portfolio ({config.selectedCoins.length})</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {config.selectedCoins.map(c => (
                                        <span key={c} className="text-[9px] bg-[#252B33] text-white px-1 rounded">{c}</span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between">
                                <span className="text-[#A0A9B8]">Pair:</span>
                                <span className="text-white font-mono font-bold">{config.pair}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-[#A0A9B8]">Direction:</span>
                            <span className={config.direction === 'Long' ? 'text-[#00FF41]' : 'text-[#FF3B30]'}>{config.direction}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-[#A0A9B8]">Base Amount:</span>
                            <span className="text-white">${config.baseAmount}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-[#A0A9B8]">Leverage:</span>
                            <span className="text-[#9D4EDD]">{config.leverage}x</span>
                        </div>
                    </div>
               </div>
           </section>

           {/* Section 2: DCA Logic */}
           <section className="space-y-3">
               <div className="flex justify-between items-center text-xs text-[#A0A9B8] uppercase tracking-wider font-semibold">
                   <span>2. DCA Logic</span>
                   <div className="flex bg-[#0F1419] rounded p-0.5 border border-custom">
                       <button onClick={() => handleInputChange('dcaMode', 'Auto')}
                           className={`px-3 py-0.5 text-[10px] rounded transition-all ${config.dcaMode==='Auto' ? 'bg-[#9D4EDD] text-white shadow-glow-purple' : 'text-[#A0A9B8] hover:text-white'}`}>
                           Auto
                       </button>
                       <button onClick={() => handleInputChange('dcaMode', 'Custom')}
                           className={`px-3 py-0.5 text-[10px] rounded transition-all ${config.dcaMode==='Custom' ? 'bg-[#9D4EDD] text-white shadow-glow-purple' : 'text-[#A0A9B8] hover:text-white'}`}>
                           Custom
                       </button>
                   </div>
               </div>
               
               <div className="p-3 bg-[#0F1419]/50 rounded-lg border border-custom space-y-4">
                   {config.dcaMode === 'Auto' ? (
                       <div className="space-y-3">
                           <div className="space-y-1">
                               <label className="text-[10px] text-[#A0A9B8] block">Max Orders</label>
                               <input type="number" value={config.maxDCAOrders} min="2" max="50"
                                   onChange={(e) => handleInputChange('maxDCAOrders', parseInt(e.target.value) || 2)}
                                   className="w-full bg-[#1A1F26] border border-custom rounded p-2 text-sm text-white focus:border-[#00D9FF] outline-none" />
                           </div>
                           <div className="space-y-1">
                               <label className="text-[10px] text-[#A0A9B8] block">Initial Dev (%)</label>
                               <input type="number" value={config.priceDeviation} step="0.1" min="0.1"
                                   onChange={(e) => handleInputChange('priceDeviation', parseFloat(e.target.value) || 0.1)}
                                   className="w-full bg-[#1A1F26] border border-custom rounded p-2 text-sm text-white focus:border-[#00D9FF] outline-none" />
                           </div>
                           <div className="space-y-1">
                               <label className="text-[10px] text-[#A0A9B8] block">Step Scale</label>
                               <input type="number" value={config.priceDevMultiplier} step="0.1" min="1.0"
                                   onChange={(e) => handleInputChange('priceDevMultiplier', parseFloat(e.target.value) || 1.0)}
                                   className="w-full bg-[#1A1F26] border border-custom rounded p-2 text-sm text-white focus:border-[#00D9FF] outline-none" />
                           </div>
                           <div className="space-y-1">
                               <label className="text-[10px] text-[#A0A9B8] block">Volume Scale</label>
                               <input type="number" value={config.orderSizeMultiplier} step="0.1" min="1.0"
                                   onChange={(e) => handleInputChange('orderSizeMultiplier', parseFloat(e.target.value) || 1.0)}
                                   className="w-full bg-[#1A1F26] border border-custom rounded p-2 text-sm text-white focus:border-[#00D9FF] outline-none" />
                           </div>
                       </div>
                   ) : (
                       <div className="space-y-2">
                           {/* Custom Logic Table */}
                           <div className="max-h-[200px] overflow-auto border border-custom rounded bg-[#1A1F26]">
                               <table className="w-full text-[10px] text-left">
                                   <thead className="bg-[#0F1419] text-[#A0A9B8] sticky top-0">
                                       <tr>
                                           <th className="p-2 w-8">#</th>
                                           <th className="p-2">Dev %</th>
                                           <th className="p-2">Size $</th>
                                           <th className="p-2 w-8"></th>
                                       </tr>
                                   </thead>
                                   <tbody className="divide-y divide-custom">
                                       {config.customDCAOrders.map((ord, idx) => (
                                           <tr key={idx} className="group hover:bg-[#252B33]">
                                               <td className="p-2 text-[#A0A9B8]">{idx+1}</td>
                                               <td className="p-1">
                                                   <input type="number" value={ord.deviation} 
                                                        onChange={e=>handleCustomOrderChange(idx,'deviation',e.target.value)} 
                                                        className="w-16 bg-transparent border-b border-custom focus:border-[#00D9FF] outline-none text-white text-right px-1"/>
                                               </td>
                                               <td className="p-1">
                                                   <input type="number" value={ord.size} 
                                                        onChange={e=>handleCustomOrderChange(idx,'size',e.target.value)} 
                                                        className="w-16 bg-transparent border-b border-custom focus:border-[#00D9FF] outline-none text-white text-right px-1"/>
                                               </td>
                                               <td className="p-1 text-center">
                                                   <button onClick={()=>removeCustomOrder(idx)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                       <Trash className="w-3 h-3 text-[#FF3B30] hover:text-[#FF3B30]/80"/>
                                                   </button>
                                               </td>
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>
                           </div>
                           <div className="flex gap-2">
                               <Button variant="outline" size="sm" onClick={addCustomOrder} className="flex-1 text-xs h-7 border-dashed border-custom hover:border-[#9D4EDD] hover:text-[#9D4EDD]">
                                   <Plus className="w-3 h-3 mr-1"/> Add Step
                               </Button>
                               <Button variant="outline" size="sm" onClick={resetToAuto} className="flex-1 text-xs h-7 border-dashed border-custom hover:border-[#00D9FF] hover:text-[#00D9FF]">
                                   <RotateCcw className="w-3 h-3 mr-1"/> Reset
                               </Button>
                           </div>
                       </div>
                   )}
                   
                   <div className="pt-3 border-t border-custom">
                        <div className="space-y-1">
                           <label className="text-xs text-[#00FF41] font-semibold flex items-center gap-1">
                               <TrendingUp className="w-3 h-3"/> Take Profit Target
                           </label>
                           <div className="relative">
                               <input type="number" value={config.takeProfitPercent} step="0.1" min="0.1"
                                   onChange={(e) => handleInputChange('takeProfitPercent', parseFloat(e.target.value) || 0.1)}
                                   className="w-full bg-[#1A1F26] border border-[#00FF41]/30 rounded p-2 text-sm text-white focus:border-[#00FF41] outline-none pr-12 font-bold" 
                               />
                               <span className="absolute right-3 top-2 text-xs text-[#A0A9B8]">%</span>
                           </div>
                           {!isMultiCoin && <p className="text-[10px] text-[#A0A9B8] text-right">Target Price: <span className="text-[#00FF41]">${dcaCalculations.tpPrice.toFixed(2)}</span></p>}
                       </div>
                   </div>
               </div>
           </section>

           {/* Section 3: DCA Settings & Actions */}
           <section className="space-y-3">
               <div className="flex justify-between items-center text-xs text-[#A0A9B8] uppercase tracking-wider font-semibold">
                   <span>3. DCA Settings</span>
               </div>
               
               <div className="grid grid-cols-2 gap-2">
                   <Button variant="outline" size="sm" className="h-8 border-custom text-[#A0A9B8] hover:text-white hover:bg-[#252B33] flex items-center gap-2 justify-center"
                       onClick={() => applyPreset({maxDCAOrders: 10, priceDeviation: 0.5, takeProfitPercent: 1.0, orderSizeMultiplier: 1.2, priceDevMultiplier: 1.1})}>
                       <Shield className="w-3 h-3"/> Conservative
                   </Button>
                   <Button variant="outline" size="sm" className="h-8 border-custom text-[#A0A9B8] hover:text-white hover:bg-[#252B33] flex items-center gap-2 justify-center"
                       onClick={() => applyPreset({maxDCAOrders: 20, priceDeviation: 1.0, takeProfitPercent: 3.0, orderSizeMultiplier: 1.5, priceDevMultiplier: 1.2})}>
                       <Zap className="w-3 h-3"/> Aggressive
                   </Button>
               </div>
               
               {/* Validation Errors */}
               {validationErrors.length > 0 && (
                   <div className="p-3 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-lg space-y-2 animate-in slide-in-from-top-2">
                       {validationErrors.map((err, i) => (
                           <div key={i} className="flex items-center gap-2 text-[#FF3B30] text-xs font-medium">
                               <AlertTriangle className="w-3 h-3 flex-none"/> {err}
                           </div>
                       ))}
                   </div>
               )}

               <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                  <DialogTrigger asChild>
                      <Button 
                           disabled={validationErrors.length > 0}
                           className={`w-full font-bold h-12 mt-4 shadow-lg transition-all duration-300 ${
                               validationErrors.length > 0 
                               ? 'bg-[#252B33] text-[#A0A9B8] cursor-not-allowed' 
                               : 'bg-[#9D4EDD] hover:bg-[#8B3FCC] text-white shadow-glow-purple'
                           }`}>
                           {selectedBot ? 'Update Bot Configuration' : 'Create DCA Bot'} 
                           {!selectedBot && <Play className="ml-2 w-4 h-4 fill-current" />}
                      </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#1A1F26] border-custom text-white">
                      <DialogHeader>
                          <DialogTitle>Confirm DCA Bot Creation</DialogTitle>
                          <DialogDescription className="text-[#A0A9B8]">
                              Please review your settings before activating the bot.
                          </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex flex-col gap-1">
                              <span className="text-[#A0A9B8]">Assets</span>
                              {isMultiCoin ? (
                                  <span className="font-bold text-white text-xs">{config.selectedCoins.join(', ')}</span>
                              ) : (
                                  <span className="font-bold text-white">{config.pair}</span>
                              )}
                          </div>
                          <div className="flex flex-col gap-1">
                              <span className="text-[#A0A9B8]">Direction</span>
                              <span className={`font-bold ${config.direction === 'Long' ? 'text-[#00FF41]' : 'text-[#FF3B30]'}`}>{config.direction}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                              <span className="text-[#A0A9B8]">Base Investment</span>
                              <span className="font-bold text-white">${config.baseAmount}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                              <span className="text-[#A0A9B8]">Max Orders</span>
                              <span className="font-bold text-white">{config.maxDCAOrders}</span>
                          </div>
                          <div className="flex flex-col gap-1 col-span-2">
                               <span className="text-[#A0A9B8]">Total Required Margin {isMultiCoin ? '(Per Coin)' : ''}</span>
                               <span className="font-bold text-[#9D4EDD] text-lg">${dcaCalculations.requiredMargin.toFixed(2)}</span>
                          </div>
                      </div>
                      <DialogFooter>
                          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                          <Button onClick={handleCreateConfirm} className="bg-[#9D4EDD] hover:bg-[#8B3FCC] shadow-glow-purple text-white">Confirm & Launch</Button>
                      </DialogFooter>
                  </DialogContent>
               </Dialog>
           </section>
       </div>
    </div>
  );
}