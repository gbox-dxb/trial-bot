import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { themes } from '@/lib/themes';
import { Check, Palette } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Color Theme</h2>
        <p className="text-[#A0A9B8] mb-6">Choose a visual theme for the trading terminal.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(themes).map(([key, t]) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setTheme(key)}
              className={`relative p-4 rounded-xl border-2 text-left transition-all overflow-hidden group shadow-lg flex flex-col h-full ${
                theme === key 
                  ? 'border-[#00D9FF] bg-[#1A1F26] ring-1 ring-[#00D9FF]' 
                  : 'border-[#2A3038] bg-[#1A1F26] hover:bg-[#252B33]'
              }`}
            >
              {theme === key && (
                <div className="absolute top-3 right-3 p-1 bg-[#00D9FF] rounded-full text-[#0F1419] shadow-sm z-10">
                  <Check className="w-3 h-3" />
                </div>
              )}
              
              {/* Theme Preview Block */}
              <div className="w-full h-24 rounded-lg mb-4 relative overflow-hidden shadow-inner border border-[#2A3038]" 
                   style={{ backgroundColor: t.colors['--bg-primary'] }}>
                {/* Simulated UI elements */}
                <div className="absolute top-0 left-0 w-8 h-full opacity-80" style={{ backgroundColor: t.colors['--bg-secondary'] }} />
                <div className="absolute top-2 left-10 right-2 h-6 rounded opacity-90" style={{ backgroundColor: t.colors['--bg-tertiary'] }} />
                <div className="absolute top-10 left-10 w-16 h-8 rounded opacity-80" style={{ backgroundColor: t.colors['--card-bg'] }} />
                <div className="absolute top-10 left-28 w-8 h-8 rounded-full opacity-90" style={{ backgroundColor: t.colors['--primary-accent'] }} />
              </div>

              <div className="mt-auto">
                <span className="font-bold text-lg block mb-1" style={{ color: theme === key ? '#FFFFFF' : '#A0A9B8' }}>
                  {t.name}
                </span>
                
                {/* Palette Swatches */}
                <div className="flex gap-1.5 mt-2">
                   {[t.colors['--bg-primary'], t.colors['--card-bg'], t.colors['--primary-accent'], t.colors['--secondary-accent']].map((color, i) => (
                     <div 
                        key={i} 
                        className="w-5 h-5 rounded-full ring-1 ring-white/10 shadow-sm" 
                        style={{ backgroundColor: color }} 
                        title="Palette Color"
                     />
                   ))}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-xl border border-[#2A3038] bg-[#1A1F26] shadow-xl">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
          <Palette className="w-5 h-5 text-[#00D9FF]" />
          Live Preview
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-4">
               <div className="flex flex-wrap gap-4">
                  <button className="px-5 py-2.5 rounded-lg font-bold bg-[#00D9FF] text-[#0F1419] shadow-glow-cyan hover:brightness-110 transition-all">
                     Primary Action
                  </button>
                  <button className="px-5 py-2.5 rounded-lg font-bold border border-[#2A3038] text-white hover:bg-[#252B33] transition-all bg-[#1A1F26]">
                     Secondary Action
                  </button>
               </div>
               
               <div className="flex gap-2">
                 <span className="px-3 py-1 rounded text-sm font-bold bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30">Badge</span>
                 <span className="px-3 py-1 rounded text-sm font-bold border border-[#00FF41] text-[#00FF41]">Outline</span>
               </div>
           </div>

           <div className="p-5 rounded-xl bg-[#0F1419] border border-[#2A3038] shadow-inner">
              <div className="flex justify-between items-start mb-2">
                 <p className="font-bold text-lg text-white">Theme Card</p>
                 <span className="px-2 py-0.5 rounded text-xs font-bold text-[#00FF41] bg-[#00FF41]/10 border border-[#00FF41]/20">
                    ACTIVE
                 </span>
              </div>
              <p className="text-sm leading-relaxed text-[#A0A9B8]">
                This preview demonstrates how the selected theme's typography and color palette appear in a card context.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}