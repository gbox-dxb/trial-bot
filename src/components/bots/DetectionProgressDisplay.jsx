import React from 'react';
import { cn } from '@/lib/utils';
import { Flame, CheckCircle2, XCircle, Timer } from 'lucide-react';

export default function DetectionProgressDisplay({ 
  currentCount, 
  targetCount, 
  color, 
  timeframe 
}) {
  const isGreen = color === 'GREEN';
  const percentage = Math.min(100, Math.max(0, (currentCount / targetCount) * 100));
  
  // Generate pills for each step
  const steps = Array.from({ length: targetCount }, (_, i) => i + 1);

  return (
    <div className="w-full bg-slate-900/50 border-t border-slate-800 p-3 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Left: Status Text */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full border-2 shadow-lg",
            isGreen 
              ? "bg-emerald-950/30 border-emerald-500/50 text-emerald-400" 
              : "bg-red-950/30 border-red-500/50 text-red-400"
          )}>
            <Flame className={cn("w-5 h-5", currentCount > 0 && "animate-pulse")} />
          </div>
          <div>
            <div className="flex items-center gap-2">
               <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Detection Progress</span>
               <span className="bg-slate-800 text-[10px] px-1.5 py-0.5 rounded text-gray-300 font-mono">{timeframe}</span>
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
               {currentCount >= targetCount ? (
                 <span className={cn(isGreen ? "text-emerald-400" : "text-red-400")}>Target Reached!</span>
               ) : (
                 <>
                   <span>{currentCount}</span>
                   <span className="text-gray-500">/</span>
                   <span>{targetCount}</span>
                   <span className={cn("text-xs uppercase ml-1", isGreen ? "text-emerald-500" : "text-red-500")}>
                     {isGreen ? 'Green' : 'Red'} Candles
                   </span>
                 </>
               )}
            </div>
          </div>
        </div>

        {/* Center/Right: Visual Pills */}
        <div className="flex-1 w-full sm:w-auto flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] uppercase text-gray-500 font-bold px-1">
                <span>Start</span>
                <span>Target</span>
            </div>
            <div className="flex gap-1 h-3 w-full">
                {steps.map((step) => {
                    const active = step <= currentCount;
                    const isLast = step === targetCount;
                    
                    return (
                        <div 
                            key={step}
                            className={cn(
                                "flex-1 rounded-sm transition-all duration-300 relative group",
                                active 
                                  ? (isGreen ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]")
                                  : "bg-slate-800 border border-slate-700/50"
                            )}
                        >
                            {/* Tooltip for step */}
                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap z-10">
                                 <div className="bg-black text-white text-[9px] px-1.5 py-0.5 rounded">
                                     Candle #{step}
                                 </div>
                             </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Right: Timer/Wait indicator if locked (Optional placeholder for now) */}
        {currentCount > 0 && currentCount < targetCount && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-blue-400 animate-pulse bg-blue-900/10 px-2 py-1 rounded border border-blue-500/20">
                <Timer className="w-3.5 h-3.5" />
                <span>Monitoring...</span>
            </div>
        )}
      </div>
    </div>
  );
}