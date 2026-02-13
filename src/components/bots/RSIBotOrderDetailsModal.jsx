import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Bot, FileText, Activity, Clock, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

export default function RSIBotOrderDetailsModal({ isOpen, onClose, order }) {
  if (!order) return null;

  const rsiMeta = order.rsiMetadata || {};
  const tmplMeta = order.templateMetadata || {};
  const isLong = order.direction === 'LONG' || order.direction === 'Long' || order.direction === 'BUY';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-custom text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-400" />
            RSI Bot Execution Details
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Order ID: <span className="font-mono text-xs">{order.id}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {/* Bot Strategy Info */}
          <Card className="p-4 bg-slate-800/50 border-custom">
            <h3 className="text-sm font-semibold text-blue-300 flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4" /> Strategy Trigger
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Bot Name:</span>
                <span className="text-slate-200">{rsiMeta.botName || 'Unknown Bot'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Condition:</span>
                <Badge variant="outline" className={rsiMeta.triggerCondition === 'Oversold' ? 'text-green-400 border-green-500/30' : 'text-red-400 border-red-500/30'}>
                  {rsiMeta.triggerCondition}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Trigger RSI:</span>
                <span className="font-mono font-bold text-yellow-400">{rsiMeta.triggerRSI ? rsiMeta.triggerRSI.toFixed(2) : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                 <span className="text-slate-400">Config:</span>
                 <span className="text-slate-300 text-xs">
                    Len: {rsiMeta.rsiConfig?.length} | TF: {rsiMeta.rsiConfig?.timeframe}
                 </span>
              </div>
            </div>
          </Card>

          {/* Template Info */}
          <Card className="p-4 bg-slate-800/50 border-custom">
            <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4" /> Template Used
            </h3>
            <div className="space-y-2 text-sm">
               <div className="flex justify-between">
                <span className="text-slate-400">Template:</span>
                <span className="text-slate-200">{tmplMeta.name || 'Custom'}</span>
              </div>
               <div className="flex justify-between">
                <span className="text-slate-400">Order Type:</span>
                <span className="text-slate-200">{tmplMeta.settings?.orderType || 'MARKET'}</span>
              </div>
               <div className="flex justify-between">
                <span className="text-slate-400">TP Setting:</span>
                <span className="text-green-400 font-mono">
                    {tmplMeta.settings?.takeProfitEnabled ? `${tmplMeta.settings.takeProfit.percent}%` : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SL Setting:</span>
                <span className="text-red-400 font-mono">
                    {tmplMeta.settings?.stopLossEnabled ? `${tmplMeta.settings.stopLoss.percent}%` : 'Disabled'}
                </span>
              </div>
            </div>
          </Card>

          {/* Execution Details */}
          <Card className="p-4 bg-slate-800/50 border-custom md:col-span-2">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4" /> Execution Summary
            </h3>
            <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-custom">
               <div className="flex flex-col">
                  <span className="text-xs text-slate-500">Pair</span>
                  <span className="text-lg font-bold text-white">{order.pair}</span>
               </div>
               <ArrowRight className="text-slate-600" />
               <div className="flex flex-col items-center">
                  <span className="text-xs text-slate-500">Direction</span>
                  <Badge className={isLong ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                     {isLong ? <TrendingUp className="w-3 h-3 mr-1"/> : <TrendingDown className="w-3 h-3 mr-1"/>}
                     {order.direction}
                  </Badge>
               </div>
               <ArrowRight className="text-slate-600" />
               <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-500">Entry Price</span>
                  <span className="text-lg font-mono text-white">${order.entryPrice}</span>
               </div>
            </div>
            <div className="mt-2 text-right text-xs text-slate-500">
               Executed {formatDistanceToNow(order.createdAt, { addSuffix: true })}
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}