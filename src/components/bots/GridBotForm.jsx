import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePrice } from '@/contexts/PriceContext';
import { storage } from '@/lib/storage';
import { gridBotEngine } from '@/lib/gridBotEngine';
import { templateService } from '@/lib/templateService';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import {
  Info, ChevronDown, ChevronUp, Settings, TrendingUp, Activity, ArrowRight, Search, TrendingDown, Clock, FileText, CheckCircle2, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TRADING_PAIRS } from '@/lib/mockData';

const SectionHeader = ({ title, icon: Icon, expanded, onToggle, required }) => (
  <div 
    className="flex items-center justify-between p-3 bg-[#1A1F26] cursor-pointer select-none hover:bg-[#252B33] transition-colors rounded-t-lg border-b border-custom"
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

const RadioGroup = ({ options, value, onChange, colorMap = {} }) => (
  <div className="flex bg-[#0F1419] p-1 rounded-lg border border-custom">
    {options.map((option) => {
      const isSelected = value === option.value;
      let activeClass = 'bg-[#1A1F26] text-white shadow-sm ring-1 ring-[#2A3038]';
      
      if (isSelected && colorMap[option.value]) {
        if (colorMap[option.value] === 'green') activeClass = 'bg-[#00FF41]/20 text-[#00FF41] ring-1 ring-[#00FF41]/50';
        if (colorMap[option.value] === 'red') activeClass = 'bg-[#FF3B30]/20 text-[#FF3B30] ring-1 ring-[#FF3B30]/50';
        if (colorMap[option.value] === 'blue') activeClass = 'bg-[#00D9FF]/20 text-[#00D9FF] ring-1 ring-[#00D9FF]/50';
        if (colorMap[option.value] === 'purple') activeClass = 'bg-[#9D4EDD]/20 text-[#9D4EDD] ring-1 ring-[#9D4EDD]/50';
      }

      return (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`flex-1 py-1.5 px-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
            isSelected ? activeClass : 'text-[#A0A9B8] hover:text-white'
          }`}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

const DEFAULT_CONFIG = {
  templateId: '',
  pair: 'BTCUSDT',
  selectedCoins: [], // For multi-coin support
  exchangeAccountId: 'mexc_futures_demo',
  timeframe: '15m',
  lowerPrice: '',
  upperPrice: '',
  gridLines: 10,
  // Removed investment and leverage
  strategyDirection: 'Neutral', 
  
  takeProfitEnabled: false,
  takeProfitType: 'Percent', // or 'Price'
  takeProfitValue: 1.5,
  
  stopLossEnabled: false,
  stopLossType: 'Percent', // or 'Price'
  stopLossValue: 2.0,
  
  validity: 'Unlimited', // 1h, 4h, 24h, 7d, 30d, Unlimited
  
  pumpProtectionEnabled: false,
  orderType: 'Market',
  startCondition: 'Immediate',
};

const VALIDITY_OPTIONS = [
    { label: '1 Hour', value: '1h' },
    { label: '4 Hours', value: '4h' },
    { label: '24 Hours', value: '24h' },
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: 'Unlimited', value: 'Unlimited' },
];

export default function GridBotForm({ onConfigChange, onBotCreated, existingBot = null }) {
  const { useLivePrice, useTicker } = usePrice();
  const { toast } = useToast();
  
  // State
  const [config, setConfig] = useState(() => existingBot || DEFAULT_CONFIG);
  const [templates, setTemplates] = useState([]);
  const [pairSearch, setPairSearch] = useState('');
  const [showPairDropdown, setShowPairDropdown] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ template: true, gridConfig: true, validity: true });
  const [errors, setErrors] = useState({});
  const pairDropdownRef = useRef(null);

  // Live Data
  const currentPrice = useLivePrice(config.pair);
  const ticker = useTicker(config.pair);

  // Use ref to prevent infinite loops
  const onConfigChangeRef = useRef(onConfigChange);
  useEffect(() => {
      onConfigChangeRef.current = onConfigChange;
  }, [onConfigChange]);

  // Load Templates
  useEffect(() => {
      const allTemplates = templateService.getTemplates();
      setTemplates(allTemplates);
  }, []);

  // Populate from Template
  const handleTemplateSelect = (tId) => {
      const template = templates.find(t => t.id === tId);
      if (template) {
          const newConfig = {
              ...config,
              templateId: tId,
              // If template has selectedCoins (array > 1), use those
              selectedCoins: template.selectedCoins || [],
              pair: (template.selectedCoins && template.selectedCoins.length > 0) ? template.selectedCoins[0] : (template.symbol || config.pair),
              gridLines: template.config?.gridLines || config.gridLines,
              takeProfitEnabled: template.config?.takeProfitEnabled || false,
              takeProfitValue: template.config?.takeProfit?.percent || config.takeProfitValue,
              stopLossEnabled: template.config?.stopLossEnabled || false,
              stopLossValue: template.config?.stopLoss?.percent || config.stopLossValue,
          };
          
          setConfig(newConfig);
          toast({ title: "Template Applied", description: `Loaded settings from ${template.name}` });
      } else {
          setConfig(prev => ({ ...prev, templateId: '', selectedCoins: [] }));
      }
  };

  // Initialize Ranges
  useEffect(() => {
    if (currentPrice && (!config.lowerPrice || !config.upperPrice) && !existingBot) {
      setConfig(prev => ({
        ...prev,
        lowerPrice: (currentPrice * 0.95).toFixed(2),
        upperPrice: (currentPrice * 1.05).toFixed(2)
      }));
    }
  }, [currentPrice, config.pair, existingBot]);

  // Calculations
  const calculations = useMemo(() => {
    const low = parseFloat(config.lowerPrice) || 0;
    const high = parseFloat(config.upperPrice) || 0;
    const lines = parseInt(config.gridLines) || 2;
    // Removed investment and leverage calculations
    
    let gridSpacing = 0;
    let profitPerGrid = 0;

    if (low > 0 && high > 0 && lines > 0 && high > low) {
      const range = high - low;
      gridSpacing = range / lines;
      const avgPrice = (high + low) / 2;
      profitPerGrid = ((gridSpacing / avgPrice) * 100);
    }

    // TP/SL Targets
    const priceToUse = currentPrice || 0;
    let tpPrice = 0;
    let slPrice = 0;

    if (config.takeProfitEnabled) {
        if (config.takeProfitType === 'Price') tpPrice = parseFloat(config.takeProfitValue);
        else {
            const dirMult = config.strategyDirection === 'Short' ? -1 : 1;
            tpPrice = priceToUse * (1 + (parseFloat(config.takeProfitValue) / 100) * dirMult);
        }
    }

    if (config.stopLossEnabled) {
        if (config.stopLossType === 'Price') slPrice = parseFloat(config.stopLossValue);
        else {
            const dirMult = config.strategyDirection === 'Short' ? -1 : 1;
            slPrice = priceToUse * (1 - (parseFloat(config.stopLossValue) / 100) * dirMult);
        }
    }

    // Expiry
    let expiryDate = null;
    if (config.validity && config.validity !== 'Unlimited') {
        const now = Date.now();
        const durationMap = { '1h': 3600000, '4h': 14400000, '24h': 86400000, '7d': 604800000, '30d': 2592000000 };
        if (durationMap[config.validity]) expiryDate = new Date(now + durationMap[config.validity]);
    }

    return {
      gridSpacing: gridSpacing.toFixed(2),
      profitPerGrid: profitPerGrid.toFixed(2),
      tpPrice: tpPrice.toFixed(2),
      slPrice: slPrice.toFixed(2),
      expiryDate,
      isValid: low < high && lines >= 2
    };
  }, [config, currentPrice]);

  // Report changes
  useEffect(() => {
      if (onConfigChangeRef.current) {
          onConfigChangeRef.current({ ...config, currentPrice, tpPrice: calculations.tpPrice, slPrice: calculations.slPrice });
      }
  }, [config, currentPrice, calculations]);

  const handleInputChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleCreate = () => {
      if (!calculations.isValid) return;
      
      const newBot = gridBotEngine.createBot({
          ...config,
          currentPrice
      });

      toast({ 
          title: "Grid Created Successfully", 
          description: `Active on ${config.pair}. ID: ${newBot.id.substring(0,8)}...`,
          className: "bg-[#00FF41]/10 border-[#00FF41] text-white"
      });

      if (onBotCreated) onBotCreated();
      
      if (!existingBot) {
          // Reset relevant fields
          setConfig(prev => ({
              ...DEFAULT_CONFIG,
              pair: prev.pair,
              lowerPrice: (currentPrice * 0.95).toFixed(2),
              upperPrice: (currentPrice * 1.05).toFixed(2)
          }));
      }
  };

  const formatCurrency = (val) => val ? `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '...';

  // Determine if multi-coin mode is active
  const isMultiCoin = config.selectedCoins && config.selectedCoins.length > 1;
  const selectedTemplate = templates.find(t => t.id === config.templateId);

  return (
    <div className="flex flex-col h-full bg-[#1A1F26] border-r border-custom">
       
       {/* 1. Header with Pair Selector (Disabled if Multi-Coin) */}
       <div className="flex-none p-4 border-b border-custom space-y-3 bg-[#0F1419]/90 z-20">
          <div className="flex items-center justify-between relative" ref={pairDropdownRef}>
             {isMultiCoin ? (
                 <div className="flex items-center gap-2">
                     <Layers className="w-5 h-5 text-[#9D4EDD]" />
                     <div className="text-white font-bold">Multi-Coin Grid ({config.selectedCoins.length})</div>
                 </div>
             ) : (
                 <button 
                   onClick={() => setShowPairDropdown(!showPairDropdown)}
                   className="flex items-center gap-2 text-xl font-bold text-white hover:text-[#00D9FF] transition-colors"
                 >
                   {config.pair} <ChevronDown className="w-4 h-4 text-[#A0A9B8]" />
                 </button>
             )}

             <div className="text-right">
                <div className="text-sm font-mono text-white font-bold animate-in fade-in">
                  {isMultiCoin ? 'N/A' : formatCurrency(currentPrice)}
                </div>
                {!isMultiCoin && (
                    <div className={`text-[10px] font-mono flex items-center justify-end gap-1 ${ticker?.percent >= 0 ? 'text-[#00FF41]' : 'text-[#FF3B30]'}`}>
                       {ticker?.percent >= 0 ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}
                       {ticker?.percent > 0 ? '+' : ''}{ticker?.percent ? ticker.percent : '0.00'}%
                    </div>
                )}
             </div>

             <AnimatePresence>
             {showPairDropdown && !isMultiCoin && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 w-[280px] bg-[#1A1F26] border border-custom rounded-xl shadow-2xl mt-2 p-2 z-50"
                >
                   <div className="relative mb-2">
                     <Search className="absolute left-2 top-2 w-4 h-4 text-[#A0A9B8]" />
                     <input 
                       className="w-full bg-[#0F1419] border border-custom rounded-lg py-1.5 pl-8 text-xs text-white focus:border-[#9D4EDD] outline-none"
                       placeholder="Search pair..."
                       value={pairSearch}
                       onChange={e => setPairSearch(e.target.value)}
                       autoFocus
                     />
                   </div>
                   <div className="max-h-[200px] overflow-y-auto custom-scrollbar space-y-1">
                      {TRADING_PAIRS.filter(p => p.toLowerCase().includes(pairSearch.toLowerCase())).map(p => (
                        <button key={p} onClick={() => { setConfig(prev => ({...prev, pair: p})); setShowPairDropdown(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium hover:bg-[#252B33] transition-colors flex justify-between items-center ${config.pair === p ? 'bg-[#9D4EDD]/20 text-[#9D4EDD]' : 'text-[#A0A9B8]'}`}
                        >
                          <span>{p}</span>
                        </button>
                      ))}
                   </div>
                </motion.div>
             )}
             </AnimatePresence>
          </div>
          {isMultiCoin && (
             <div className="flex flex-wrap gap-1">
                 {config.selectedCoins.map(coin => (
                     <span key={coin} className="text-[10px] bg-[#252B33] text-[#A0A9B8] px-1.5 py-0.5 rounded">{coin}</span>
                 ))}
             </div>
          )}
       </div>

       {/* Scrollable Form Content */}
       <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          
          {/* Template Section */}
          <div className="border border-custom rounded-lg overflow-hidden bg-[#1A1F26]">
             <SectionHeader 
                title="Trading Template" 
                icon={FileText} 
                expanded={expandedSections.template} 
                onToggle={() => setExpandedSections(s => ({...s, template: !s.template}))}
             />
             <AnimatePresence>
             {expandedSections.template && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="p-3 space-y-3">
                        <select 
                            value={config.templateId}
                            onChange={(e) => handleTemplateSelect(e.target.value)}
                            className="w-full bg-[#0F1419] border border-custom rounded p-2 text-xs text-white outline-none focus:border-[#00D9FF]"
                        >
                            <option value="">-- Select Saved Template --</option>
                            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        
                        {/* Selected Template Preview Card */}
                        {selectedTemplate ? (
                           <Card className="p-3 bg-[#252B33] border-custom mt-3 animate-in fade-in zoom-in-95 duration-200">
                               <div className="flex items-start gap-2 mb-3">
                                   <CheckCircle2 className="w-5 h-5 text-[#00FF41] mt-0.5" />
                                   <div>
                                       <div className="text-sm font-bold text-white">{selectedTemplate.name}</div>
                                       <div className="text-[10px] text-[#A0A9B8]">{selectedTemplate.description || 'No description'}</div>
                                   </div>
                               </div>
                               
                               {/* Coins Section */}
                               <div className="mb-3 p-2 bg-[#0F1419] rounded border border-custom">
                                   <div className="flex justify-between items-center mb-1">
                                       <span className="text-[10px] text-[#A0A9B8]">Selected Assets</span>
                                       <span className="text-[10px] font-mono text-[#9D4EDD]">{isMultiCoin ? `${config.selectedCoins.length} Pairs` : 'Single Pair'}</span>
                                   </div>
                                   {isMultiCoin ? (
                                       <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto custom-scrollbar">
                                           {config.selectedCoins.map(c => (
                                               <span key={c} className="text-[9px] bg-[#252B33] text-[#A0A9B8] px-1.5 py-0.5 rounded border border-custom">{c}</span>
                                           ))}
                                       </div>
                                   ) : (
                                       <div className="font-mono text-sm text-white font-bold">
                                           {config.pair}
                                       </div>
                                   )}
                               </div>
                               
                               {/* Stats Grid */}
                               <div className="grid grid-cols-2 gap-2 text-[10px]">
                                   <div className="flex justify-between p-2 bg-[#0F1419] rounded border border-custom">
                                       <span className="text-[#A0A9B8]">Leverage:</span>
                                       <span className="text-white font-mono font-bold">{selectedTemplate.config?.leverage || 1}x</span>
                                   </div>
                                   <div className="flex justify-between p-2 bg-[#0F1419] rounded border border-custom">
                                       <span className="text-[#A0A9B8]">Size:</span>
                                       <span className="text-white font-mono font-bold">
                                           {selectedTemplate.config?.sizeMode === 'PERCENT' ? `${selectedTemplate.config?.baseOrderSize}%` : `$${selectedTemplate.config?.baseOrderSize || 0}`}
                                       </span>
                                   </div>
                                   <div className="flex justify-between p-2 bg-[#0F1419] rounded border border-custom">
                                       <span className="text-[#A0A9B8]">TP:</span>
                                       <span className={`font-mono font-bold ${selectedTemplate.config?.takeProfitEnabled ? 'text-[#00FF41]' : 'text-[#A0A9B8]'}`}>
                                           {selectedTemplate.config?.takeProfitEnabled ? `${selectedTemplate.config?.takeProfit?.percent}%` : 'OFF'}
                                       </span>
                                   </div>
                                   <div className="flex justify-between p-2 bg-[#0F1419] rounded border border-custom">
                                       <span className="text-[#A0A9B8]">SL:</span>
                                       <span className={`font-mono font-bold ${selectedTemplate.config?.stopLossEnabled ? 'text-[#FF3B30]' : 'text-[#A0A9B8]'}`}>
                                           {selectedTemplate.config?.stopLossEnabled ? `${selectedTemplate.config?.stopLoss?.percent}%` : 'OFF'}
                                       </span>
                                   </div>
                               </div>
                           </Card>
                        ) : (
                           <div className="text-[10px] text-[#FF6B35]/80 italic p-2 bg-[#FF6B35]/10 rounded border border-custom text-center">
                               Select a template to view details
                           </div>
                        )}
                    </div>
                </motion.div>
             )}
             </AnimatePresence>
          </div>

          {/* Strategy Direction */}
          <div className="space-y-2">
             <label className="text-[10px] font-bold text-[#A0A9B8] uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-3 h-3" /> Strategy Direction
             </label>
             <RadioGroup 
                options={[ { label: 'Neutral', value: 'Neutral' }, { label: 'Long', value: 'Long' }, { label: 'Short', value: 'Short' } ]}
                value={config.strategyDirection}
                onChange={(val) => handleInputChange('strategyDirection', val)}
                colorMap={{ 'Neutral': 'purple', 'Long': 'green', 'Short': 'red' }}
             />
          </div>

          {/* Grid Configuration */}
          <div className="border border-custom rounded-xl overflow-hidden bg-[#1A1F26]">
             <SectionHeader 
                title="Grid Configuration" 
                icon={Settings} 
                expanded={expandedSections.gridConfig} 
                onToggle={() => setExpandedSections(s => ({...s, gridConfig: !s.gridConfig}))}
             />
             <AnimatePresence>
             {expandedSections.gridConfig && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-[#0F1419]">
                   <div className="p-3 space-y-4">
                      {isMultiCoin ? (
                         <div className="text-xs text-[#FF6B35] bg-[#FF6B35]/10 p-2 rounded border border-custom">
                            Price ranges will be calculated dynamically for each coin relative to its current price.
                         </div>
                      ) : (
                          <div className="grid grid-cols-2 gap-3">
                             <div className="space-y-1">
                                <label className="text-[10px] text-[#A0A9B8]">Lower Price</label>
                                <Input type="number" className="h-8 bg-[#1A1F26] border-[#2A3038] text-white text-xs" value={config.lowerPrice} onChange={(e) => handleInputChange('lowerPrice', e.target.value)} />
                             </div>
                             <div className="space-y-1">
                                <label className="text-[10px] text-[#A0A9B8]">Upper Price</label>
                                <Input type="number" className="h-8 bg-[#1A1F26] border-[#2A3038] text-white text-xs" value={config.upperPrice} onChange={(e) => handleInputChange('upperPrice', e.target.value)} />
                             </div>
                          </div>
                      )}
                      
                      <div className="space-y-2">
                         <div className="flex justify-between items-center"><label className="text-[10px] text-[#A0A9B8]">Grid Count ({config.gridLines})</label><span className="text-[10px] text-[#00FF41]">Profit/Grid: {calculations.profitPerGrid}%</span></div>
                         <Slider value={[config.gridLines]} min={2} max={100} step={1} onValueChange={([val]) => handleInputChange('gridLines', val)} />
                      </div>
                   </div>
                </motion.div>
             )}
             </AnimatePresence>
          </div>

          {/* TP / SL / Validity */}
          <div className="space-y-3">
             {/* Take Profit */}
             <div className="p-3 bg-[#1A1F26] rounded-xl border border-custom space-y-3">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Checkbox id="tp" checked={config.takeProfitEnabled} onCheckedChange={(c) => handleInputChange('takeProfitEnabled', c)} className="data-[state=checked]:bg-[#00FF41] border-[#A0A9B8]"/>
                       <label htmlFor="tp" className="text-xs font-bold text-gray-300">Take Profit</label>
                    </div>
                    {config.takeProfitEnabled && (
                        <div className="flex bg-[#0F1419] rounded p-0.5 border border-custom">
                           <button onClick={() => handleInputChange('takeProfitType', 'Percent')} className={`px-2 py-0.5 text-[9px] rounded ${config.takeProfitType==='Percent' ? 'bg-[#00FF41]/20 text-[#00FF41]' : 'text-[#A0A9B8]'}`}>%</button>
                           <button onClick={() => handleInputChange('takeProfitType', 'Price')} className={`px-2 py-0.5 text-[9px] rounded ${config.takeProfitType==='Price' ? 'bg-[#00FF41]/20 text-[#00FF41]' : 'text-[#A0A9B8]'}`}>$</button>
                        </div>
                    )}
                 </div>
                 {config.takeProfitEnabled && (
                    <div className="pl-6">
                        <Input type="number" className="h-8 bg-[#0F1419] border-[#2A3038] text-white text-xs" value={config.takeProfitValue} onChange={(e) => handleInputChange('takeProfitValue', e.target.value)} />
                        {!isMultiCoin && <div className="text-[10px] text-[#00FF41] mt-1 text-right">Target: ${calculations.tpPrice}</div>}
                    </div>
                 )}
             </div>

             {/* Stop Loss */}
             <div className="p-3 bg-[#1A1F26] rounded-xl border border-custom space-y-3">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Checkbox id="sl" checked={config.stopLossEnabled} onCheckedChange={(c) => handleInputChange('stopLossEnabled', c)} className="data-[state=checked]:bg-[#FF3B30] border-[#A0A9B8]"/>
                       <label htmlFor="sl" className="text-xs font-bold text-gray-300">Stop Loss</label>
                    </div>
                    {config.stopLossEnabled && (
                        <div className="flex bg-[#0F1419] rounded p-0.5 border border-custom">
                           <button onClick={() => handleInputChange('stopLossType', 'Percent')} className={`px-2 py-0.5 text-[9px] rounded ${config.stopLossType==='Percent' ? 'bg-[#FF3B30]/20 text-[#FF3B30]' : 'text-[#A0A9B8]'}`}>%</button>
                           <button onClick={() => handleInputChange('stopLossType', 'Price')} className={`px-2 py-0.5 text-[9px] rounded ${config.stopLossType==='Price' ? 'bg-[#FF3B30]/20 text-[#FF3B30]' : 'text-[#A0A9B8]'}`}>$</button>
                        </div>
                    )}
                 </div>
                 {config.stopLossEnabled && (
                    <div className="pl-6">
                        <Input type="number" className="h-8 bg-[#0F1419] border-[#2A3038] text-white text-xs" value={config.stopLossValue} onChange={(e) => handleInputChange('stopLossValue', e.target.value)} />
                        {!isMultiCoin && <div className="text-[10px] text-[#FF3B30] mt-1 text-right">Trigger: ${calculations.slPrice}</div>}
                    </div>
                 )}
             </div>

             {/* Validity */}
             <div className="p-3 bg-[#1A1F26] rounded-xl border border-custom space-y-2">
                <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#9D4EDD]" />
                    <span className="text-xs font-bold text-gray-300">Grid Validity</span>
                </div>
                <select 
                    value={config.validity} 
                    onChange={(e) => handleInputChange('validity', e.target.value)}
                    className="w-full bg-[#0F1419] border border-custom rounded p-1.5 text-xs text-white outline-none"
                >
                    {VALIDITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {calculations.expiryDate && (
                    <div className="text-[10px] text-[#A0A9B8] text-right">Expires: {calculations.expiryDate.toLocaleString()}</div>
                )}
             </div>
          </div>
       </div>

       {/* Footer Actions */}
       <div className="flex-none p-4 bg-[#0F1419] border-t border-custom space-y-3 z-20">
          <Button 
            className="w-full bg-[#9D4EDD] hover:bg-[#8B3FCC] text-white font-bold h-10 shadow-glow-purple"
            disabled={!calculations.isValid && !isMultiCoin}
            onClick={handleCreate}
          >
             {existingBot ? "Update Grid" : "Create Grid"} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
       </div>
    </div>
  );
}