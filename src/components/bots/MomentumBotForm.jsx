import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { momentumBotEngine } from '@/lib/momentumBotEngine';
import { templateService } from '@/lib/templateService';
import { 
    FileText, CheckCircle, ChevronDown, ChevronUp, Zap, DollarSign, Layers
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import SafetySettingsPanel from './SafetySettingsPanel';

const SectionHeader = ({ title, icon: Icon, expanded, onToggle, required }) => (
  <div 
    className="flex items-center justify-between p-3 bg-[#1A1F26] cursor-pointer select-none hover:bg-[#252B33] transition-colors rounded-t-lg border-b border-[#2A3038]"
    onClick={onToggle}
  >
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-[#9D4EDD]" />
      <span className="font-bold text-white text-xs uppercase tracking-wider">{title}</span>
      {required && <span className="text-[#FF3B30] ml-1">*</span>}
    </div>
    {expanded ? <ChevronUp className="w-3.5 h-3.5 text-[#A0A9B8]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#A0A9B8]" />}
  </div>
);

export default function MomentumBotForm({ onBotCreated, selectedBot, onConfigChange }) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [expanded, setExpanded] = useState({ 
    template: true, 
    dollarTrigger: true,
    safetySettings: true
  });
  
  // -- State --
  const [config, setConfig] = useState(() => selectedBot ? { ...selectedBot } : {
    // Template
    templateId: '',
    selectedCoins: [], 
    pair: 'BTCUSDT', 
    
    // Dollar Trigger
    dollarAmount: 50,
    timeframe: '15m',
    directionMode: 'Auto (Bi-directional)',
    
    // Safety
    cooldown: 30,
    cooldownUnit: 'Sec',
    oneTradeAtATime: true,
    maxTradesPerDay: 10,

    // Status
    status: 'Waiting' 
  });

  const onConfigChangeRef = useRef(onConfigChange);
  useEffect(() => {
      onConfigChangeRef.current = onConfigChange;
  }, [onConfigChange]);

  useEffect(() => {
    setTemplates(templateService.getTemplates());
  }, []);

  useEffect(() => {
    // Populate form if selecting a bot for edit
    if (selectedBot) {
        setConfig({
            ...selectedBot,
            // Ensure defaults for potentially missing fields in older bots
            cooldown: selectedBot.cooldown ?? 30,
            cooldownUnit: selectedBot.cooldownUnit || 'Sec',
            oneTradeAtATime: selectedBot.oneTradeAtATime ?? true,
            maxTradesPerDay: selectedBot.maxTradesPerDay ?? 10
        });
    }
  }, [selectedBot]);

  useEffect(() => {
    if (onConfigChangeRef.current) {
      onConfigChangeRef.current(config);
    }
  }, [config]);

  const selectedTemplate = templates.find(t => t.id === config.templateId);

  const handleChange = (field, value) => {
      setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleTemplateChange = (templateId) => {
      const tmpl = templates.find(t => t.id === templateId);
      
      let newSelectedCoins = [];
      let newPair = config.pair;

      if (tmpl) {
          if (tmpl.selectedCoins && Array.isArray(tmpl.selectedCoins) && tmpl.selectedCoins.length > 0) {
              newSelectedCoins = tmpl.selectedCoins;
          } else if (tmpl.pairs && Array.isArray(tmpl.pairs) && tmpl.pairs.length > 0) {
              newSelectedCoins = tmpl.pairs;
          } else if (tmpl.symbol) {
              newSelectedCoins = [tmpl.symbol];
          }
          
          if (newSelectedCoins.length > 0) {
              newPair = newSelectedCoins[0];
          }
      }

      setConfig(prev => ({
          ...prev,
          templateId,
          selectedCoins: newSelectedCoins,
          pair: newPair,
      }));
  };

  const handleCreate = () => {
      if (!config.templateId) {
          toast({ title: 'Template Required', description: 'Please select a trading template.', variant: 'destructive' });
          return;
      }
      
      const newBot = {
          ...config,
          templateName: selectedTemplate?.name || 'Unknown Template',
          pairs: config.selectedCoins.length > 0 ? config.selectedCoins : [config.pair],
          activeOrdersCount: 0,
          createdAt: Date.now(),
          status: 'Waiting',
          mode: 'LIVE' 
      };
      
      if (selectedBot) {
          momentumBotEngine.updateBot(selectedBot.id, newBot);
          toast({ title: 'Bot Updated', description: 'Configuration saved successfully.' });
      } else {
          momentumBotEngine.createBot(newBot);
          toast({ 
              title: 'Momentum Bot Created', 
              description: `Strategy: Move $${config.dollarAmount} in ${config.timeframe}`,
              className: "bg-[#00FF41]/10 border-[#00FF41] text-white" 
          });
          
          setConfig({
            templateId: '',
            selectedCoins: [],
            pair: 'BTCUSDT',
            dollarAmount: 50,
            timeframe: '15m',
            directionMode: 'Auto (Bi-directional)',
            cooldown: 30,
            cooldownUnit: 'Sec',
            oneTradeAtATime: true,
            maxTradesPerDay: 10,
            status: 'Waiting'
          });
      }
      
      if (onBotCreated) onBotCreated();
  };

  const isMultiCoin = config.selectedCoins && config.selectedCoins.length > 1;

  return (
    <div className="h-full flex flex-col bg-[#1A1F26] border-l border-[#2A3038] overflow-hidden">
       <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
           
           {/* 1. Trading Template */}
           <div className="border border-[#2A3038] rounded-lg overflow-hidden bg-[#0F1419]/50">
               <SectionHeader 
                   title="Trading Template" 
                   icon={FileText} 
                   expanded={expanded.template} 
                   onToggle={() => setExpanded(p => ({...p, template: !p.template}))}
                   required
               />
               <AnimatePresence>
                   {expanded.template && (
                       <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                           <div className="p-3 space-y-3">
                               <div className="space-y-2">
                                   <select 
                                       value={config.templateId} 
                                       onChange={(e) => handleTemplateChange(e.target.value)}
                                       className="w-full bg-[#1A1F26] border border-[#2A3038] rounded p-2 text-xs text-white font-medium focus:border-[#9D4EDD] outline-none"
                                   >
                                       <option value="">-- Select Saved Template --</option>
                                       {templates.map(t => (
                                           <option key={t.id} value={t.id}>{t.name}</option>
                                       ))}
                                   </select>
                               </div>
                               
                               {selectedTemplate ? (
                                   <Card className="p-3 bg-[#252B33] border-[#2A3038]">
                                       <div className="flex items-start gap-2 mb-2">
                                           <CheckCircle className="w-4 h-4 text-[#00FF41] mt-0.5" />
                                           <div>
                                               <div className="text-xs font-bold text-white">{selectedTemplate.name}</div>
                                               <div className="text-[10px] text-[#A0A9B8]">{selectedTemplate.description || 'No description'}</div>
                                           </div>
                                       </div>
                                       
                                       {isMultiCoin && (
                                            <div className="mb-2 p-1.5 bg-[#0F1419]/50 rounded border border-[#2A3038]">
                                                <div className="flex items-center gap-1 mb-1 text-[#9D4EDD]">
                                                    <Layers className="w-3 h-3"/>
                                                    <span className="text-[10px] font-bold">Multi-Coin Strategy</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {config.selectedCoins.map(c => (
                                                        <span key={c} className="text-[9px] bg-[#252B33] text-[#A0A9B8] px-1 rounded">{c}</span>
                                                    ))}
                                                </div>
                                            </div>
                                       )}

                                       <div className="grid grid-cols-2 gap-2 text-[10px]">
                                           {!isMultiCoin && (
                                               <div className="flex justify-between p-1.5 bg-[#0F1419]/50 rounded">
                                                   <span className="text-[#A0A9B8]">Pair:</span>
                                                   <span className="text-white font-mono truncate max-w-[80px]">
                                                       {config.pair}
                                                   </span>
                                               </div>
                                           )}
                                            <div className="flex justify-between p-1.5 bg-[#0F1419]/50 rounded">
                                               <span className="text-[#A0A9B8]">Leverage:</span>
                                               <span className="text-white font-mono">{selectedTemplate.config?.leverage}x</span>
                                           </div>
                                       </div>
                                   </Card>
                               ) : (
                                   <div className="text-[10px] text-[#FF6B35]/80 italic p-2 bg-[#FF6B35]/10 rounded border border-[#FF6B35]/20 text-center">
                                       Select a template to define execution parameters
                                   </div>
                               )}
                           </div>
                       </motion.div>
                   )}
               </AnimatePresence>
           </div>

           {/* 2. Dollar Trigger */}
           <div className="border border-[#2A3038] rounded-lg overflow-hidden bg-[#0F1419]/50">
               <SectionHeader 
                   title="Dollar Trigger" 
                   icon={DollarSign} 
                   expanded={expanded.dollarTrigger} 
                   onToggle={() => setExpanded(p => ({...p, dollarTrigger: !p.dollarTrigger}))}
                   required
               />
               <AnimatePresence>
                   {expanded.dollarTrigger && (
                       <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                           <div className="p-3 space-y-4">
                               <div className="text-[10px] text-[#A0A9B8] bg-[#1A1F26] p-2 rounded border border-[#2A3038] italic text-center">
                                 Strategy triggers when price moves 
                                 <span className="text-white font-bold mx-1">${config.dollarAmount}</span>
                                 within 
                                 <span className="text-white font-bold mx-1">{config.timeframe}</span>
                               </div>

                               <div>
                                   <label className="text-[10px] text-[#A0A9B8] block mb-1">Dollar Amount (USDT)</label>
                                   <Input 
                                       type="number" 
                                       value={config.dollarAmount}
                                       onChange={(e) => handleChange('dollarAmount', parseFloat(e.target.value))}
                                       className="h-8 bg-[#1A1F26] border-[#2A3038] text-xs font-bold text-white"
                                       placeholder="e.g. 50"
                                   />
                               </div>

                               <div className="grid grid-cols-2 gap-3">
                                   <div>
                                       <label className="text-[10px] text-[#A0A9B8] block mb-1">Timeframe</label>
                                       <select 
                                           value={config.timeframe}
                                           onChange={(e) => handleChange('timeframe', e.target.value)}
                                           className="w-full bg-[#1A1F26] border border-[#2A3038] rounded text-xs p-1.5 text-white h-8 outline-none"
                                       >
                                           <option value="1m">1 Minute</option>
                                           <option value="5m">5 Minutes</option>
                                           <option value="15m">15 Minutes</option>
                                           <option value="1h">1 Hour</option>
                                           <option value="4h">4 Hours</option>
                                           <option value="1d">1 Day</option>
                                       </select>
                                   </div>
                                   <div>
                                       <label className="text-[10px] text-[#A0A9B8] block mb-1">Direction</label>
                                       <select 
                                           value={config.directionMode}
                                           onChange={(e) => handleChange('directionMode', e.target.value)}
                                           className="w-full bg-[#1A1F26] border border-[#2A3038] rounded text-xs p-1.5 text-white h-8 outline-none"
                                       >
                                           <option>Auto (Bi-directional)</option>
                                           <option>Long Only</option>
                                           <option>Short Only</option>
                                       </select>
                                   </div>
                               </div>
                           </div>
                       </motion.div>
                   )}
               </AnimatePresence>
           </div>
           
           {/* 3. Safety Settings */}
           <SafetySettingsPanel 
                config={config} 
                onChange={handleChange}
                expanded={expanded.safetySettings}
                onToggle={() => setExpanded(p => ({...p, safetySettings: !p.safetySettings}))}
           />

       </div>

       {/* Footer */}
       <div className="p-4 bg-[#0F1419] border-t border-[#2A3038] space-y-2">
           <Button onClick={handleCreate} disabled={!selectedTemplate} className="w-full bg-[#9D4EDD] hover:bg-[#8B3FCC] text-white font-bold h-10 shadow-glow-purple">
               {selectedBot ? 'Update Bot' : 'Create Bot'} <Zap className="ml-2 w-4 h-4 fill-current" />
           </Button>
       </div>
    </div>
  );
}