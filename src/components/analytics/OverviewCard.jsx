import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function OverviewCard({ title, value, subtext, trend, icon: Icon, className, valueClassName }) {
  const isPositive = trend === 'up' || (typeof value === 'string' && !value.includes('-') && !value.startsWith('0')) || (typeof value === 'number' && value >= 0);
  
  return (
    <Card className={cn("bg-[#1A1F26] backdrop-blur-sm border-custom border-2 shadow-xl hover:shadow-2xl transition-all", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-bold text-[#A0A9B8] uppercase tracking-wider">{title}</p>
          {Icon && <Icon className="h-5 w-5 text-[#00D9FF]" />}
        </div>
        <div className="flex items-baseline space-x-2">
           <div className={cn("text-3xl font-bold text-white", valueClassName)}>
             {value}
           </div>
           {subtext && (
             <div className={cn(
               "flex items-center text-sm font-bold", 
               isPositive ? "text-[#00FF41]" : "text-[#FF3B30]"
             )}>
               {isPositive ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
               {subtext}
             </div>
           )}
        </div>
      </CardContent>
    </Card>
  );
}