import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { templateService } from '@/lib/templateService';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    ChevronDown, ChevronUp, FileText, CheckCircle, Shield, Layers, Flame, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const SectionHeader = ({ title, icon: Icon, expanded, onToggle, required, colorClass }) => (
    <div
        className={cn(
            "flex items-center justify-between p-3 cursor-pointer select-none transition-colors rounded-t-lg border-b border-custom",
            expanded ? "bg-[#1A1F26]" : "bg-[#0F1419] hover:bg-[#1A1F26]"
        )}
        onClick={onToggle}
    >
        <div className="flex items-center gap-2">
            <Icon className={cn("w-4 h-4", colorClass)} />
            <span className="font-bold text-white text-xs uppercase tracking-wider">{title}</span>
            {required && <span className="text-[#FF3B30] ml-1">*</span>}
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-[#A0A9B8]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#A0A9B8]" />}
    </div>
);

const DEFAULT_CONFIG = {
    templateId: '',
    selectedCoins: [],
    strategyType: 'Candle Strategy',
    timeframe: '1m',
    candleColor: 'GREEN',
    candleCount: 3,
    cooldown: 60, // Increased default safety delay
    oneTradeAtATime: true,
    maxTradesPerDay: 10,
    pair: 'BTCUSDT',
};

export default function CandleStrikeForm({ onBotCreated, selectedBot, onConfigChange, fixedColor }) {
    const { toast } = useToast();
    const [templates, setTemplates] = useState([]);

    const [config, setConfig] = useState(() => {
        return selectedBot ? { ...DEFAULT_CONFIG, ...selectedBot } : { ...DEFAULT_CONFIG, candleColor: fixedColor || 'GREEN' };
    });

    const [expanded, setExpanded] = useState({
        template: true,
        strategy: true,
        safetySettings: true
    });

    const [errors, setErrors] = useState({});
    const onConfigChangeRef = useRef(onConfigChange);

    useEffect(() => { onConfigChangeRef.current = onConfigChange; }, [onConfigChange]);

    useEffect(() => { setTemplates(templateService.getTemplates()); }, []);

    useEffect(() => {
        if (onConfigChangeRef.current) onConfigChangeRef.current(config);
    }, [config]);

    useEffect(() => {
        if (selectedBot) {
            setConfig({ ...DEFAULT_CONFIG, ...selectedBot });
        } else if (fixedColor) {
            setConfig(prev => ({ ...prev, candleColor: fixedColor }));
        }
    }, [selectedBot, fixedColor]);

    const handleChange = (field, value) => setConfig(prev => ({ ...prev, [field]: value }));

    const handleTemplateChange = (templateId) => {
        const tmpl = templates.find(t => t.id === templateId);
        const coins = tmpl?.selectedCoins || [];
        const pair = coins.length > 0 ? coins[0] : (tmpl?.symbol || DEFAULT_CONFIG.pair);

        setConfig(prev => ({ ...prev, templateId, selectedCoins: coins, pair }));
    };

    const validate = () => {
        const errs = {};
        if (!config.templateId) errs.template = "Template Required";
        if (!config.candleCount || config.candleCount < 1) errs.candleCount = "Min 1 candle";
        if (!config.timeframe) errs.timeframe = "Timeframe required";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) {
            toast({ variant: "destructive", title: "Validation Error", description: "Please check all required fields." });
            return;
        }
        const selectedTemplate = templates.find(t => t.id === config.templateId);
        console.log("Selected Template for Bot Creation:", selectedTemplate);

        const templateConfig = selectedTemplate?.config || {};

        onBotCreated({
            ...templateConfig, // 1. Base: All Trading Settings from Template (Lev, Size, TP/SL, etc.)
            ...config,         // 2. Override: Strategy Settings from Form (Pair, Color, Count, Timeframe)
            id: selectedBot?.id,
            createdAt: selectedBot?.createdAt || Date.now(),
            templateName: selectedTemplate?.name,
            currentConsecutiveCount: 0,
            candleColor: fixedColor || config.candleColor,

            // Explicitly ensure these are set for the grid if missing in template (fallbacks)
            leverage: templateConfig.leverage || 1,
            baseOrderSize: templateConfig.baseOrderSize || 0,
            sizeMode: templateConfig.sizeMode || 'USDT',
        });

        toast({ title: "Success", description: `${fixedColor} Candle Strategy Bot created successfully.` });

        if (!selectedBot) setConfig({ ...DEFAULT_CONFIG, candleColor: fixedColor || 'GREEN' });
    };

    const isGreen = fixedColor === 'GREEN';
    const accentColor = isGreen ? 'text-[#00FF41]' : 'text-[#FF3B30]';
    const accentBorder = isGreen ? 'focus:border-[#00FF41]' : 'focus:border-[#FF3B30]';
    const buttonGradient = isGreen
        ? 'bg-[#00FF41] hover:bg-[#00E039] text-[#0F1419]'
        : 'bg-[#FF3B30] hover:bg-[#E6342B] text-white';

    return (
        <div className="h-full flex flex-col bg-[#0F1419]/90 backdrop-blur-xl border-l border-custom overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">

                {/* 1. Template Selection */}
                <div className="border border-custom rounded-lg overflow-hidden bg-[#1A1F26]">
                    <SectionHeader title="Trading Template" icon={FileText} expanded={expanded.template} onToggle={() => setExpanded(p => ({ ...p, template: !p.template }))} required colorClass={accentColor} />
                    <AnimatePresence>
                        {expanded.template && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                <div className="p-3 space-y-3">
                                    <select value={config.templateId} onChange={(e) => handleTemplateChange(e.target.value)} className={cn("w-full bg-[#0F1419] border border-custom rounded p-2 text-xs text-white font-medium outline-none", accentBorder)}>
                                        <option value="">-- Choose Strategy Template --</option>
                                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                    {errors.template && <p className="text-[9px] text-[#FF3B30]">{errors.template}</p>}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 2. Strategy Settings - COLOR SPECIFIC */}
                <div className="border border-custom rounded-lg overflow-hidden bg-[#1A1F26]">
                    <SectionHeader
                        title={`${fixedColor} Detection Strategy`}
                        icon={Target}
                        expanded={expanded.strategy}
                        onToggle={() => setExpanded(p => ({ ...p, strategy: !p.strategy }))}
                        required
                        colorClass={accentColor}
                    />
                    <AnimatePresence>
                        {expanded.strategy && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                <div className="p-3 space-y-4">
                                    <div className={cn("p-2 rounded border border-dashed text-center text-xs", isGreen ? "bg-[#00FF41]/10 border-[#00FF41]/30 text-[#00FF41]" : "bg-[#FF3B30]/10 border-[#FF3B30]/30 text-[#FF3B30]")}>
                                        Monitoring only for <strong>{fixedColor}</strong> candle formations
                                    </div>

                                    <div>
                                        <label className="text-[10px] text-[#A0A9B8] block mb-1">Timeframe</label>
                                        <select value={config.timeframe} onChange={(e) => handleChange('timeframe', e.target.value)} disabled={!!selectedBot} className={cn("w-full bg-[#0F1419] border border-custom rounded text-xs p-1.5 text-white transition-colors outline-none", accentBorder)}>
                                            {['1m', '3m', '5m', '15m', '1h', '4h'].map(tf => <option key={tf} value={tf}>{tf}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-[10px] text-[#A0A9B8]">
                                                Consecutive {isGreen ? 'Green' : 'Red'} Candles
                                            </label>
                                            <span className={cn("text-[10px] font-bold", accentColor)}>{config.candleCount}</span>
                                        </div>
                                        <div className="flex gap-4 items-center">
                                            <Slider value={[config.candleCount]} min={1} max={15} step={1} onValueChange={([v]) => handleChange('candleCount', v)} className="py-2 flex-1" />
                                            <Input type="number" min={1} max={15} value={config.candleCount} onChange={(e) => handleChange('candleCount', parseInt(e.target.value))} className={cn("w-16 h-8 bg-[#0F1419] border-custom text-xs font-bold text-center text-white", accentBorder)} />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 3. Safety Settings */}
                <div className="border border-custom rounded-lg overflow-hidden bg-[#1A1F26]">
                    <SectionHeader title="Safety & Locks" icon={Shield} expanded={expanded.safetySettings} onToggle={() => setExpanded(p => ({ ...p, safetySettings: !p.safetySettings }))} colorClass={accentColor} />
                    <AnimatePresence>
                        {expanded.safetySettings && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                <div className="p-3 space-y-4">
                                    <div>
                                        <label className="text-[10px] text-[#A0A9B8] block mb-1">Safety Delay (Lock Duration)</label>
                                        <div className="flex items-center gap-2">
                                            <Input type="number" value={config.cooldown} onChange={(e) => handleChange('cooldown', parseInt(e.target.value))} className={cn("h-8 bg-[#0F1419] border-custom text-xs font-bold text-white", accentBorder)} />
                                            <span className="text-xs text-[#A0A9B8]">seconds</span>
                                        </div>
                                        <p className="text-[9px] text-[#A0A9B8] mt-1">Global lock applied to ALL strategies after execution.</p>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="oneTrade" checked={config.oneTradeAtATime} onCheckedChange={(c) => handleChange('oneTradeAtATime', c)} className={cn("border-[#A0A9B8]", isGreen ? "data-[state=checked]:bg-[#00FF41]" : "data-[state=checked]:bg-[#FF3B30]")} />
                                        <label htmlFor="oneTrade" className="text-xs text-gray-300 font-medium leading-none cursor-pointer">One trade at a time</label>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="p-4 bg-[#0F1419] border-t border-custom space-y-2 flex-none">
                <Button onClick={handleSubmit} disabled={!selectedBot && !config.templateId} className={cn("w-full font-bold h-10 shadow-lg", buttonGradient)}>
                    {selectedBot ? 'Update Bot' : `Start ${fixedColor} Bot`}
                </Button>
            </div>
        </div>
    );
}