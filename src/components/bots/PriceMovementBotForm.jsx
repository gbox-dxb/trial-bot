import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { priceMovementBotEngine } from '@/lib/priceMovementBotEngine';
import { templateService } from '@/lib/templateService';
import { 
    Activity, ShieldCheck, ArrowRight, FileText, CheckCircle, ChevronDown, ChevronUp, Zap, BarChart2, TrendingUp
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

const SectionHeader = ({ title, icon: Icon, expanded, onToggle, required }) => (
  <div 
    className="flex items-center justify-between p-3 bg-slate-800/40 cursor-pointer select-none hover:bg-slate-800/60 transition-colors rounded-t-lg border-b border-slate-700/50"
    onClick={onToggle}
  >
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-purple-400" />
      <span className="font-bold text-gray-200 text-xs uppercase tracking-wider">{title}</span>
      {required && <span className="text-red-500 ml-1">*</span>}
    </div>
    {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
  </div>
);

export default function PriceMovementBotForm({ onConfigChange, onBotCreated }) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [expanded, setExpanded] = useState({ template: true, strategy: true });
  
  // -- State --
  const [config, setConfig] = useState({
    // Template
    templateId: '',
    
    // Strategy Settings
    threshold: 1.5, // %
    confirmationPeriod: 3, // candles
    direction: 'Both', // Up, Down, Both
    sensitivity: 'Medium', // Low, Medium, High
    trendConfirmation: true,
    riskLevel: 'Moderate', // Conservative, Moderate, Aggressive
  });

  // Use ref to prevent infinite loops
  const onConfigChangeRef = useRef(onConfigChange);
  useEffect(() => {
      onConfigChangeRef.current = onConfigChange;
  }, [onConfigChange]);

  // Load Templates
  useEffect(() => {
    setTemplates(templateService.getTemplates());
  }, []);

  // Sync config with parent safely
  useEffect(() => {
      if (onConfigChangeRef.current) {
          onConfigChangeRef.current(config);
      }
  }, [config]);

  const selectedTemplate = templates.find(t => t.id === config.templateId);

  // -- Handlers --
  const handleChange = (field, value) => {
      const newConfig = { ...config, [field]: value };
      setConfig(newConfig);
  };

  const handleCreate = () => {
      if (!config.templateId) {
          toast({ title: 'Template Required', description: 'Please select a trading template.', variant: 'destructive' });
          return;
      }
      
      const newBot = {
          ...config,
          templateName: selectedTemplate?.name || 'Unknown Template',
          activeOrdersCount: 0,
          createdAt: Date.now()
      };
      
      priceMovementBotEngine.createBot(newBot);
      
      toast({ 
          title: 'Bot Created Successfully!', 
          description: `Will auto-place orders using ${selectedTemplate?.name} when triggered.`,
          variant: "default",
          className: "bg-green-900 border-green-600 text-white" 
      });
      
      if (onBotCreated) onBotCreated();
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/90 backdrop-blur-md border-l border-purple-500/20 overflow-hidden">
       <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
           
           {/* 1. Trading Template */}
           <div className="border border-slate-700/50 rounded-lg overflow-hidden bg-slate-800/20">
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
                                       onChange={(e) => handleChange('templateId', e.target.value)}
                                       className="w-full bg-slate-900 border border-gray-700 rounded p-2 text-xs text-white font-medium focus:border-purple-500"
                                   >
                                       <option value="">-- Choose Strategy Template --</option>
                                       {templates.map(t => (
                                           <option key={t.id} value={t.id}>{t.name}</option>
                                       ))}
                                   </select>
                               </div>
                               
                               {selectedTemplate ? (
                                   <Card className="p-3 bg-purple-900/20 border-purple-500/20">
                                       <div className="flex items-start gap-2 mb-2">
                                           <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />
                                           <div>
                                               <div className="text-xs font-bold text-white">{selectedTemplate.name}</div>
                                               <div className="text-[10px] text-gray-400">{selectedTemplate.description || 'No description'}</div>
                                           </div>
                                       </div>
                                       <div className="grid grid-cols-2 gap-2 text-[10px]">
                                           <div className="flex justify-between p-1.5 bg-slate-900/50 rounded">
                                               <span className="text-gray-400">Pairs:</span>
                                               <span className="text-white font-mono truncate max-w-[80px]">
                                                   {(selectedTemplate.pairs || []).join(', ') || 'All'}
                                               </span>
                                           </div>
                                            <div className="flex justify-between p-1.5 bg-slate-900/50 rounded">
                                               <span className="text-gray-400">Leverage:</span>
                                               <span className="text-white font-mono">{selectedTemplate.config?.leverage}x</span>
                                           </div>
                                           <div className="flex justify-between p-1.5 bg-slate-900/50 rounded">
                                               <span className="text-gray-400">Size:</span>
                                               <span className="text-white font-mono">
                                                   {selectedTemplate.config?.sizeMode === 'PERCENT' ? `${selectedTemplate.config?.baseOrderSize}%` : `$${selectedTemplate.config?.baseOrderSize}`}
                                               </span>
                                           </div>
                                           <div className="flex justify-between p-1.5 bg-slate-900/50 rounded">
                                               <span className="text-gray-400">TP/SL:</span>
                                               <span className="text-blue-300 font-mono">
                                                   {selectedTemplate.config?.takeProfitEnabled ? 'ON' : 'OFF'} / {selectedTemplate.config?.stopLossEnabled ? 'ON' : 'OFF'}
                                               </span>
                                           </div>
                                       </div>
                                   </Card>
                               ) : (
                                   <div className="text-[10px] text-yellow-500/80 italic p-2 bg-yellow-900/10 rounded border border-yellow-500/20 text-center">
                                       Select a template to define assets and orders
                                   </div>
                               )}
                           </div>
                       </motion.div>
                   )}
               </AnimatePresence>
           </div>

           {/* 2. Strategy Settings */}
           <div className="border border-slate-700/50 rounded-lg overflow-hidden bg-slate-800/20">
               <SectionHeader 
                   title="Strategy Settings" 
                   icon={Activity} 
                   expanded={expanded.strategy} 
                   onToggle={() => setExpanded(p => ({...p, strategy: !p.strategy}))}
               />
               <AnimatePresence>
                   {expanded.strategy && (
                       <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                           <div className="p-3 space-y-4">
                               
                               {/* Movement Threshold */}
                               <div>
                                   <div className="flex justify-between items-center mb-2">
                                       <label className="text-[10px] text-gray-400">Price Movement Threshold</label>
                                       <span className="text-xs font-bold text-purple-400">{config.threshold}%</span>
                                   </div>
                                   <Slider 
                                       value={[config.threshold]} 
                                       min={0.1} max={10} step={0.1}
                                       onValueChange={([v]) => handleChange('threshold', v)}
                                       className="py-2"
                                   />
                               </div>

                               {/* Confirmation Period */}
                               <div>
                                   <label className="text-[10px] text-gray-400 block mb-1">Confirmation Period (Candles)</label>
                                   <div className="relative">
                                       <Input 
                                           type="number" 
                                           min={1} max={50}
                                           value={config.confirmationPeriod}
                                           onChange={(e) => handleChange('confirmationPeriod', parseInt(e.target.value))}
                                           className="h-8 bg-slate-950 border-slate-700 text-xs font-bold pl-8"
                                       />
                                       <BarChart2 className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
                                   </div>
                               </div>

                               {/* Direction */}
                               <div className="space-y-1">
                                   <label className="text-[10px] text-gray-400">Trade Direction</label>
                                   <div className="flex bg-slate-900 p-1 rounded-lg">
                                       {['Up', 'Down', 'Both'].map(m => (
                                           <button key={m} onClick={() => handleChange('direction', m)}
                                               className={`flex-1 py-1 text-xs rounded-md transition-colors ${config.direction === m ? 'bg-purple-600 text-white shadow' : 'text-gray-500 hover:text-white'}`}>
                                               {m}
                                           </button>
                                       ))}
                                   </div>
                               </div>

                               {/* Sensitivity */}
                               <div className="space-y-1">
                                   <label className="text-[10px] text-gray-400">Sensitivity</label>
                                   <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                                       {['Low', 'Medium', 'High'].map(s => (
                                           <button key={s} onClick={() => handleChange('sensitivity', s)}
                                               className={`flex-1 py-1 text-[10px] rounded-md transition-colors ${config.sensitivity === s ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-white'}`}>
                                               {s}
                                           </button>
                                       ))}
                                   </div>
                               </div>

                               {/* Trend Confirmation & Risk */}
                               <div className="grid grid-cols-2 gap-3 pt-2">
                                   <div className="flex flex-col gap-2">
                                       <label className="text-[10px] text-gray-400">Trend Confirm</label>
                                       <div className="flex items-center gap-2 h-8">
                                           <Switch 
                                               checked={config.trendConfirmation}
                                               onCheckedChange={(c) => handleChange('trendConfirmation', c)}
                                           />
                                           <span className="text-[10px] text-gray-300">{config.trendConfirmation ? 'Yes' : 'No'}</span>
                                       </div>
                                   </div>
                                   
                                   <div className="flex flex-col gap-1">
                                       <label className="text-[10px] text-gray-400">Risk Level</label>
                                       <select 
                                           value={config.riskLevel}
                                           onChange={(e) => handleChange('riskLevel', e.target.value)}
                                           className="w-full bg-slate-950 border border-slate-700 rounded text-xs p-1.5 text-white h-8"
                                       >
                                           <option value="Conservative">Conservative</option>
                                           <option value="Moderate">Moderate</option>
                                           <option value="Aggressive">Aggressive</option>
                                       </select>
                                   </div>
                               </div>

                           </div>
                       </motion.div>
                   )}
               </AnimatePresence>
           </div>

       </div>

       {/* Footer */}
       <div className="p-4 bg-slate-900 border-t border-purple-500/20 space-y-2">
           <Button onClick={handleCreate} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold h-10 shadow-lg">
               Create Bot <ArrowRight className="ml-2 w-4 h-4" />
           </Button>
       </div>
    </div>
  );
}