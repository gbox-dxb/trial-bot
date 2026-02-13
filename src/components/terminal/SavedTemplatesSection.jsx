import React, { useEffect, useState } from 'react';
import { templateService } from '@/lib/templateService';
import { orderPlacementService } from '@/lib/orderPlacementService';
import { usePrice } from '@/contexts/PriceContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, PlayCircle, FileText, Clock, Coins, Loader2, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function SavedTemplatesSection({ onSelectTemplate, className, refreshTrigger, onOrderPlaced }) {
  const [templates, setTemplates] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const { prices } = usePrice();
  const { toast } = useToast();

  const loadTemplates = () => {
    const data = templateService.getTemplates();
    // Sort by newest first
    setTemplates(data.sort((a, b) => b.createdAt - a.createdAt));
  };

  useEffect(() => {
    loadTemplates();
  }, [refreshTrigger]);

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this template?')) {
      templateService.deleteTemplate(id);
      loadTemplates();
    }
  };

  const handlePlaceOrder = async (e, template) => {
    e.stopPropagation();
    
    // 1. Get Price
    const pair = (template.selectedCoins && template.selectedCoins[0]) || template.config?.pair;
    const currentPrice = prices[pair];
    
    if (!pair || !currentPrice) {
      toast({
        variant: "destructive",
        title: "Price Unavailable",
        description: `Cannot place order. Live price for ${pair || 'pair'} is missing.`
      });
      return;
    }

    setProcessingId(template.id);

    try {
      // 2. Place Order
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay for UX
      
      const order = orderPlacementService.placeOrderFromTemplate(
        template, 
        'manual', 
        null, 
        null, 
        currentPrice
      );

      toast({
        title: "Order Placed",
        description: `Successfully executed ${order.side} order for ${order.pair} from template "${template.name}".`,
        className: "bg-emerald-900 border-emerald-800 text-white"
      });

      // 3. Notify Parent
      if (onOrderPlaced) {
        onOrderPlaced();
      }

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Execution Failed",
        description: error.message
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Card className={cn("border-purple-500/20 bg-[#1A1A1A] shadow-xl overflow-hidden flex flex-col h-full", className)}>
      <CardHeader className="bg-[#1A1A1A]/80 border-b border-purple-500/20 py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            Saved Templates
          </CardTitle>
          <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-300">
            {templates.length}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-sm">
            <FileText className="w-8 h-8 mb-2 opacity-20" />
            <p>No saved templates</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {templates.map((template) => (
              <div 
                key={template.id}
                className="p-3 hover:bg-slate-800/50 transition-colors group cursor-pointer relative"
                onClick={() => onSelectTemplate(template)}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                    {template.name}
                  </h4>
                  <div className="flex items-center gap-1 opacity-100 transition-opacity">
                     {/* Place Order Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50 bg-emerald-900/10 border border-emerald-900/30"
                      onClick={(e) => handlePlaceOrder(e, template)}
                      disabled={processingId === template.id}
                      title="Place Order Immediately"
                    >
                      {processingId === template.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <PlayCircle className="w-3.5 h-3.5" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-red-400 hover:bg-red-950/30 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDelete(e, template.id)}
                      title="Delete Template"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-xs text-slate-500 line-clamp-1 mb-2">
                  {template.description || "No description"}
                </p>
                
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1 overflow-hidden max-w-[70%]">
                    <Coins className="w-3 h-3 text-slate-600 flex-shrink-0" />
                    <span className="text-[10px] text-slate-500 truncate">
                      {template.selectedCoins && template.selectedCoins.length > 0 
                        ? template.selectedCoins.join(', ')
                        : 'No coins'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <Badge variant="secondary" className="text-[10px] bg-slate-800 text-slate-400">
                        {template.config?.orderType || 'Market'}
                     </Badge>
                     <Badge variant="secondary" className={cn(
                        "text-[10px] bg-opacity-20",
                        (template.config?.direction === 'LONG' || template.config?.direction === 'Long')
                          ? "bg-emerald-500 text-emerald-400" 
                          : "bg-red-500 text-red-400"
                     )}>
                        {template.config?.direction}
                     </Badge>
                     <span className="text-[10px] text-slate-600 font-mono">
                        {template.config?.leverage}x
                     </span>
                  </div>
                  <span className="text-[10px] text-slate-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(template.createdAt, { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}