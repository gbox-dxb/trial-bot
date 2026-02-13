import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Loader2, Coins } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TemplateSaveDialog({ isOpen, onClose, onSave, selectedCoins = [] }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setIsSaving(false);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setIsSaving(true);
    // Simulate slight delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onSave({ 
      name, 
      description,
      selectedCoins // Include selected coins in the save payload
    });
    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e1e2d] text-white border-slate-700 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Save className="w-5 h-5" />
            </div>
            Save Strategy Template
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Template Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. BTC Scalping Strategy"
              className="bg-slate-950 border-slate-700 text-white placeholder:text-gray-600 focus:border-emerald-500"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Included Pairs ({selectedCoins.length})
            </label>
            <div className="flex flex-wrap gap-1 p-2 bg-slate-950 rounded-md border border-slate-800 min-h-[40px] max-h-[80px] overflow-y-auto custom-scrollbar">
              {selectedCoins.length > 0 ? (
                selectedCoins.map(coin => (
                  <Badge key={coin} variant="secondary" className="bg-slate-800 text-slate-300 text-[10px]">
                    {coin}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-slate-600 italic">No pairs selected</span>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe market conditions and strategy details..."
              className="w-full h-24 px-3 py-2 rounded-md bg-slate-950 border border-slate-700 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="border-slate-600 text-gray-300 hover:bg-slate-800 hover:text-white">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!name.trim() || isSaving}
            className="bg-[#10b981] hover:bg-emerald-600 text-white font-medium"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Template'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}