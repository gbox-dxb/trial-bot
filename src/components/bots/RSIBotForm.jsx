import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { rsiTradingLogic } from '@/lib/rsiTradingLogic';
import { templateService } from '@/lib/templateService';
import { Card } from '@/components/ui/card';
import { 
  ChevronDown, ChevronUp, Activity, FileText, CheckCircle, Layers, MousePointerClick
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SafetySettingsPanel from '@/components/bots/SafetySettingsPanel';

const SectionHeader = ({ title, icon: Icon, expanded, onToggle, required }) => (
  <div 
    className="flex items-center justify-between p-3 bg-[#1A1F26] hover:bg-[#252B33] cursor-pointer select-none transition-colors rounded-t-lg border-b border-[#2A3038]"
    onClick={onToggle}
  >
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-[#00D9FF]" />
      <span className="font-bold text-white text-xs uppercase tracking-wider">{title}</span>
      {required && <span className="text-[#FF3B30] ml-1">*</span>}
    </div>
    {expanded ? <ChevronUp className="w-3.5 h-3.5 text-[#A0A9B8]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#A0A9B8]" />}
  </div>
);

const DEFAULT_CONFIG = {
  pair: 'BTCUSDT',
  selectedCoins: [], 
  timeframe: '15m',
  rsiLength: 14,
  triggerType: 'Oversold', 
  rsiValue: 30, // Default threshold
  triggerMode: 'Touches', // Default to Touches as requested
  direction: 'Auto',
  
  // Risk Settings
  cooldown: 30,
  cooldownUnit: 'Sec',
  cooldownSeconds: 30,
  oneTradeAtATime: true,
  maxTradesPerDay: 10,
  
  templateId: '',
  status: 'Waiting' 
};

export default function RSIBotForm({ onBotCreated, selectedBot, onConfigChange }) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  
  const [config, setConfig] = useState(() => {
      const saved = localStorage.getItem('rsiBotFormState');
      if (saved) {
          const parsed = JSON.parse(saved);
          return { ...DEFAULT_CONFIG, ...parsed };
      }
      return DEFAULT_CONFIG;
  });

  const [expanded, setExpanded] = useState({ rsi: true, template: true, risk: true });
  const [errors, setErrors] = useState({});
  
  const onConfigChangeRef = useRef(onConfigChange);
  useEffect(() => {
      onConfigChangeRef.current = onConfigChange;
  }, [onConfigChange]);

  useEffect(() => {
      setTemplates(templateService.getTemplates());
  }, []);

  const selectedTemplate = templates.find(t => t.id === config.templateId);

  useEffect(() => {
      if (selectedBot) {
          // Parse cooldown seconds back to display values if needed, or trust stored values
          let displayCooldown = selectedBot.cooldown || selectedBot.cooldownSeconds || 30;
          let displayUnit = selectedBot.cooldownUnit || 'Sec';
          
          if (!selectedBot.cooldownUnit && selectedBot.cooldownSeconds) {
              if (selectedBot.cooldownSeconds % 3600 === 0) {
                  displayCooldown = selectedBot.cooldownSeconds / 3600;
                  displayUnit = 'Hour';
              } else if (selectedBot.cooldownSeconds % 60 === 0) {
                   displayCooldown = selectedBot.cooldownSeconds / 60;
                   displayUnit = 'Min';
              } else {
                  displayCooldown = selectedBot.cooldownSeconds;
                  displayUnit = 'Sec';
              }
          }

          setConfig({
              ...DEFAULT_CONFIG,
              ...selectedBot,
              cooldown: displayCooldown,
              cooldownUnit: displayUnit
          });
      }
  }, [selectedBot]);

  useEffect(() => {
      localStorage.setItem('rsiBotFormState', JSON.stringify(config));
      const validation = rsiTradingLogic.validateRSIBot(config);
      
      setErrors(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(validation.errors)) {
              return validation.errors;
          }
          return prev;
      });

      if (onConfigChangeRef.current) {
          onConfigChangeRef.current(config);
      }
  }, [config]);

  const handleChange = (field, value) => {
      setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleTemplateSelect = (templateId) => {
      const tmpl = templates.find(t => t.id === templateId);
      if (tmpl) {
          const coins = tmpl.selectedCoins || [];
          setConfig(prev => ({
              ...prev,
              templateId,
              selectedCoins: coins,
              pair: coins.length > 0 ? coins[0] : (tmpl.symbol || prev.pair),
              rsiLength: tmpl.config?.rsiLength || prev.rsiLength,
              rsiValue: tmpl.config?.rsiValue || prev.rsiValue,
              triggerType: tmpl.config?.triggerType || prev.triggerType
          }));
          toast({ title: "Template Applied", description: `Loaded settings from ${tmpl.name}` });
      } else {
          setConfig(prev => ({ ...prev, templateId: '', selectedCoins: [] }));
      }
  };
  
  const handleSubmit = () => {
      const validation = rsiTradingLogic.validateRSIBot(config);
      if (!validation.isValid) {
          toast({ variant: "destructive", title: "Invalid Configuration", description: "Please check all fields." });
          return;
      }
      
      if (!config.templateId) {
          toast({ variant: "destructive", title: "Template Required", description: "Select a trading template." });
          return;
      }

      // Calculate cooldown seconds
      let seconds = config.cooldown;
      if (config.cooldownUnit === 'Min') seconds *= 60;
      if (config.cooldownUnit === 'Hour') seconds *= 3600;
      
      // Ensure we are passing the explicit user configuration
      const newBot = {
          ...config,
          id: selectedBot ? selectedBot.id : `rsi-${Date.now()}`,
          status: selectedBot ? selectedBot.status : 'Waiting', 
          createdAt: Date.now(),
          activeOrdersCount: selectedBot ? selectedBot.activeOrdersCount : 0,
          dailyTradeCount: selectedBot ? selectedBot.dailyTradeCount : 0,
          lastResetDate: selectedBot ? selectedBot.lastResetDate : null,
          templateName: selectedTemplate?.name,
          
          // Numeric conversions
          rsiLength: parseInt(config.rsiLength),
          rsiValue: parseFloat(config.rsiValue),
          cooldownSeconds: parseInt(seconds),
          maxTradesPerDay: parseInt(config.maxTradesPerDay)
      };

      onBotCreated(newBot);

      toast({ 
          title: "Bot Created", 
          description: `RSI Bot for ${config.pair} is now WAITING for trigger.`,
          className: "bg-blue-900 border-[#2A3038] text-white"
      });
      
      if (!selectedBot) {
          setConfig(DEFAULT_CONFIG);
          localStorage.removeItem('rsiBotFormState');
      }
  };

  const isMultiCoin = config.selectedCoins && config.selectedCoins.length > 1;

  return (
    <div className="h-full flex flex-col bg-[#0F1419]/90 backdrop-blur-xl border-l border-[#2A3038] overflow-hidden">
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            
            {/* RSI Settings */}
            <div className="border border-[#2A3038] rounded-lg overflow-hidden bg-[#1A1F26]">
                <SectionHeader 
                    title="RSI Settings" 
                    icon={Activity} 
                    expanded={expanded.rsi} 
                    onToggle={() => setExpanded(p => ({...p, rsi: !p.rsi}))}
                />
                <AnimatePresence>
                {expanded.rsi && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="p-3 space-y-3">
                             <div className="grid grid-cols-2 gap-3">
                                 <div>
                                     <label className="text-[10px] text-[#A0A9B8] block mb-1">Trigger Cond</label>
                                     <select 
                                        value={config.triggerType} 
                                        onChange={e => handleChange('triggerType', e.target.value)}
                                        className="w-full bg-[#0F1419] border border-[#2A3038] rounded text-xs p-1.5 text-white focus:border-[#00D9FF] outline-none"
                                     >
                                        <option value="Oversold">Oversold (Buy)</option>
                                        <option value="Overbought">Overbought (Sell)</option>
                                     </select>
                                 </div>
                                 <div>
                                     <label className="text-[10px] text-[#A0A9B8] block mb-1">Length</label>
                                     <Input 
                                        type="number" 
                                        value={config.rsiLength} 
                                        onChange={e => handleChange('rsiLength', parseInt(e.target.value))}
                                        className="h-8 bg-[#0F1419] border-[#2A3038] text-xs text-white"
                                     />
                                 </div>
                             </div>
                                 
                             <div className="flex items-center gap-3">
                                 <div className="flex-1">
                                     <label className="text-[10px] text-[#A0A9B8] block">RSI Threshold</label>
                                     <Input 
                                        type="number" 
                                        value={config.rsiValue}
                                        onChange={e => handleChange('rsiValue', parseFloat(e.target.value))}
                                        className="h-8 bg-[#0F1419] border-[#2A3038] text-xs font-bold text-white"
                                     />
                                 </div>
                                 <div className="flex-1">
                                      <label className="text-[10px] text-[#A0A9B8] block">Trigger Mode</label>
                                      <div className="relative">
                                          <select 
                                            value={config.triggerMode}
                                            onChange={e => handleChange('triggerMode', e.target.value)}
                                            className="w-full h-8 bg-[#0F1419] border border-[#2A3038] rounded text-xs px-2 text-white outline-none focus:border-[#00D9FF] appearance-none"
                                          >
                                              <option value="Touches">Touches</option>
                                              <option value="Crosses">Crosses</option>
                                          </select>
                                          <MousePointerClick className="w-3 h-3 text-[#A0A9B8] absolute right-2 top-2.5 pointer-events-none" />
                                      </div>
                                 </div>
                             </div>

                             <div className="text-[10px] text-[#A0A9B8] bg-[#0F1419] p-2 rounded border border-[#2A3038]">
                                {config.triggerMode === 'Touches' ? (
                                    <span>Bot triggers immediately when RSI <strong>touches or exceeds</strong> the threshold.</span>
                                ) : (
                                    <span>Bot triggers when RSI <strong>crosses</strong> the threshold from the previous value.</span>
                                )}
                             </div>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>

            {/* Template Selection */}
            <div className="border border-[#2A3038] rounded-lg overflow-hidden bg-[#1A1F26]">
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
                                   onChange={(e) => handleTemplateSelect(e.target.value)}
                                   className="w-full bg-[#0F1419] border border-[#2A3038] rounded p-2 text-xs text-white font-medium focus:border-[#00D9FF] outline-none"
                               >
                                   <option value="">-- Choose Strategy Template --</option>
                                   {templates.map(t => (
                                       <option key={t.id} value={t.id}>{t.name}</option>
                                   ))}
                               </select>
                            </div>
                            
                            {selectedTemplate ? (
                               <Card className="p-3 bg-[#252B33]/50 border-[#2A3038]">
                                   <div className="flex items-start gap-2 mb-2">
                                       <CheckCircle className="w-4 h-4 text-[#00FF41] mt-0.5" />
                                       <div>
                                           <div className="text-xs font-bold text-white">{selectedTemplate.name}</div>
                                           <div className="text-[10px] text-[#A0A9B8]">{selectedTemplate.description || 'No description'}</div>
                                       </div>
                                   </div>
                                   
                                   {isMultiCoin && (
                                       <div className="mb-2 p-1.5 bg-[#0F1419]/50 rounded border border-[#2A3038]">
                                           <div className="flex items-center gap-1 mb-1 text-[#00D9FF]">
                                               <Layers className="w-3 h-3"/>
                                               <span className="text-[10px] font-bold">Multi-Coin Strategy</span>
                                           </div>
                                           <div className="flex flex-wrap gap-1">
                                               {config.selectedCoins.map(c => (
                                                   <span key={c} className="text-[9px] bg-[#252B33] text-white px-1 rounded">{c}</span>
                                               ))}
                                           </div>
                                       </div>
                                   )}
                                   
                                   <div className="grid grid-cols-2 gap-2 text-[10px]">
                                       <div className="flex justify-between p-1.5 bg-[#0F1419]/50 rounded">
                                           <span className="text-[#A0A9B8]">Leverage:</span>
                                           <span className="text-white font-mono">{selectedTemplate.config?.leverage}x</span>
                                       </div>
                                       <div className="flex justify-between p-1.5 bg-[#0F1419]/50 rounded">
                                           <span className="text-[#A0A9B8]">Size:</span>
                                           <span className="text-white font-mono">
                                               {selectedTemplate.config?.sizeMode === 'PERCENT' ? `${selectedTemplate.config?.baseOrderSize}%` : `$${selectedTemplate.config?.baseOrderSize}`}
                                           </span>
                                       </div>
                                   </div>
                               </Card>
                            ) : (
                               <div className="text-[10px] text-[#FF6B35] italic p-2 bg-[#FF6B35]/10 rounded border border-[#2A3038] text-center">
                                   Please select a template to define order parameters
                               </div>
                            )}
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>

            {/* Risk Management */}
            <SafetySettingsPanel 
                config={config} 
                onChange={handleChange} 
                expanded={expanded.risk} 
                onToggle={() => setExpanded(p => ({...p, risk: !p.risk}))} 
            />
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0F1419] border-t border-[#2A3038] space-y-2 flex-none">
            <Button 
                onClick={handleSubmit}
                disabled={Object.keys(errors).length > 0}
                className="w-full font-bold h-10 bg-[#00D9FF] text-[#0F1419] hover:bg-[#00B8E0] shadow-glow-cyan"
            >
                {selectedBot ? 'Update RSI Bot' : 'Create RSI Bot'}
            </Button>
        </div>
    </div>
  );
}