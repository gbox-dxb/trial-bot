import React from 'react';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

export default function SafetySettingsPanel({ 
    config, 
    onChange, 
    expanded, 
    onToggle 
}) {
  return (
    <div className="border border-[#2A3038] rounded-lg overflow-hidden bg-[#1A1F26]">
        <div 
            className="flex items-center justify-between p-3 bg-[#1A1F26] hover:bg-[#252B33] cursor-pointer select-none transition-colors rounded-t-lg border-b border-[#2A3038]"
            onClick={onToggle}
        >
            <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#00D9FF]" />
            <span className="font-bold text-white text-xs uppercase tracking-wider">Safety Settings</span>
            </div>
            {expanded ? <ChevronUp className="w-3.5 h-3.5 text-[#A0A9B8]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#A0A9B8]" />}
        </div>
        <AnimatePresence>
            {expanded && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="p-3 space-y-4">
                        {/* Cooldown */}
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <label className="text-[10px] text-[#A0A9B8] block mb-1">Cooldown</label>
                                <Input 
                                    type="number" 
                                    value={config.cooldown}
                                    onChange={(e) => onChange('cooldown', Math.max(0, parseInt(e.target.value) || 0))}
                                    className="h-8 bg-[#0F1419] border-[#2A3038] text-xs font-bold text-white"
                                    min="0"
                                />
                            </div>
                            <div className="w-20">
                                <select 
                                    value={config.cooldownUnit || 'Sec'}
                                    onChange={(e) => onChange('cooldownUnit', e.target.value)}
                                    className="w-full bg-[#0F1419] border border-[#2A3038] rounded text-xs p-1.5 text-white h-8 outline-none focus:border-[#00D9FF]"
                                >
                                    <option value="Sec">Sec</option>
                                    <option value="Min">Min</option>
                                    <option value="Hour">Hour</option>
                                </select>
                            </div>
                        </div>
                        
                        {/* One Trade At A Time */}
                        <div className="flex items-center space-x-2 pt-1">
                            <Checkbox 
                                id="oneTrade"
                                checked={config.oneTradeAtATime}
                                onCheckedChange={(c) => onChange('oneTradeAtATime', c)}
                                className="border-[#2A3038] data-[state=checked]:bg-[#00D9FF] data-[state=checked]:border-[#00D9FF]"
                            />
                            <label htmlFor="oneTrade" className="text-xs text-[#A0A9B8] font-medium leading-none cursor-pointer select-none hover:text-white transition-colors">
                                One trade at a time
                            </label>
                        </div>

                        {/* Max Trades Per Day */}
                        <div>
                            <label className="text-[10px] text-[#A0A9B8] block mb-1">Max Trades Per Day</label>
                            <Input 
                                type="number" 
                                value={config.maxTradesPerDay}
                                onChange={(e) => onChange('maxTradesPerDay', Math.min(100, Math.max(1, parseInt(e.target.value) || 0)))}
                                className="h-8 bg-[#0F1419] border-[#2A3038] text-xs font-bold text-white"
                                min="1"
                                max="100"
                                placeholder="e.g. 10"
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
}