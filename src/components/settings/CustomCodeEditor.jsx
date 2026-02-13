import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { customCodeService } from '@/lib/customCodeService';
import { useToast } from '@/components/ui/use-toast';
import { Save, Play, RefreshCcw } from 'lucide-react';
import { themes } from '@/lib/themes';

export default function CustomCodeEditor({ onSave, initialCode = null }) {
  const { toast } = useToast();
  const [code, setCode] = useState(initialCode || {
    name: 'New Custom CSS',
    content: '/* Enter your custom CSS here */\n',
    scope: 'global',
    device: 'all',
    themeSpecific: false,
    targetTheme: 'dark'
  });

  const handleSave = () => {
    if (!code.name || !code.content) {
      toast({ variant: "destructive", title: "Error", description: "Name and content are required." });
      return;
    }

    if (initialCode) {
      customCodeService.updateCode(initialCode.id, code);
      toast({ title: "Updated", description: "Custom code updated successfully." });
    } else {
      customCodeService.addCode(code);
      toast({ title: "Saved", description: "New custom code added." });
      setCode({ name: 'New Custom CSS', content: '', scope: 'global', device: 'all', themeSpecific: false, targetTheme: 'dark' });
    }
    if (onSave) onSave();
  };

  return (
    <div className="space-y-4 bg-[#1A1F26] p-4 rounded-xl border border-[#2A3038]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div>
           <label className="text-xs font-bold text-[#A0A9B8] uppercase mb-1 block">Name</label>
           <input 
             value={code.name}
             onChange={e => setCode({...code, name: e.target.value})}
             className="w-full bg-[#0F1419] border border-[#2A3038] rounded p-2 text-white text-sm focus:border-[#00D9FF] outline-none"
             placeholder="e.g., Header Tweaks"
           />
         </div>
         
         <div className="flex gap-2">
           <div className="flex-1">
             <label className="text-xs font-bold text-[#A0A9B8] uppercase mb-1 block">Scope</label>
             <select 
               value={code.scope}
               onChange={e => setCode({...code, scope: e.target.value})}
               className="w-full bg-[#0F1419] border border-[#2A3038] rounded p-2 text-white text-sm outline-none"
             >
               <option value="global">Global (Entire App)</option>
               <option value="dashboard">Dashboard Only</option>
               <option value="terminal">Terminal Only</option>
             </select>
           </div>
           <div className="flex-1">
             <label className="text-xs font-bold text-[#A0A9B8] uppercase mb-1 block">Device</label>
             <select 
               value={code.device}
               onChange={e => setCode({...code, device: e.target.value})}
               className="w-full bg-[#0F1419] border border-[#2A3038] rounded p-2 text-white text-sm outline-none"
             >
               <option value="all">All Devices</option>
               <option value="desktop">Desktop Only</option>
               <option value="mobile">Mobile Only</option>
             </select>
           </div>
         </div>
      </div>

      <div>
         <div className="flex items-center gap-2 mb-2">
            <input 
              type="checkbox" 
              id="themeSpecific"
              checked={code.themeSpecific}
              onChange={e => setCode({...code, themeSpecific: e.target.checked})}
              className="rounded border-[#2A3038] bg-[#0F1419] text-[#00D9FF]"
            />
            <label htmlFor="themeSpecific" className="text-sm text-white">Apply only to specific theme</label>
         </div>
         
         {code.themeSpecific && (
            <select 
               value={code.targetTheme}
               onChange={e => setCode({...code, targetTheme: e.target.value})}
               className="w-full bg-[#0F1419] border border-[#2A3038] rounded p-2 text-white text-sm outline-none"
            >
               {Object.keys(themes).map(t => <option key={t} value={t}>{themes[t].name}</option>)}
            </select>
         )}
      </div>

      <div className="relative">
        <label className="text-xs font-bold text-[#A0A9B8] uppercase mb-1 block flex justify-between">
          <span>CSS Content</span>
          <span>{code.content.length} chars</span>
        </label>
        <textarea 
          value={code.content}
          onChange={e => setCode({...code, content: e.target.value})}
          className="w-full h-64 font-mono text-sm bg-[#0F1419] text-white border border-[#2A3038] rounded p-4 outline-none focus:ring-1 ring-[#00D9FF] resize-y leading-relaxed"
          placeholder=".my-class { color: red; }"
          spellCheck={false}
        />
      </div>

      <div className="flex gap-2 justify-end">
         <Button variant="outline" onClick={() => setCode({...code, content: ''})} className="border-[#2A3038] text-[#A0A9B8] hover:bg-[#252B33] hover:text-white">
            <RefreshCcw className="w-4 h-4 mr-2" /> Reset
         </Button>
         <Button onClick={handleSave} className="bg-[#00D9FF] text-[#0F1419] hover:bg-[#00B8E0] font-bold shadow-glow-cyan">
            <Save className="w-4 h-4 mr-2" /> Save & Apply
         </Button>
      </div>
    </div>
  );
}