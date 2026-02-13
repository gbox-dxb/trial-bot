import React from 'react';
import { Bot, Heart, ExternalLink } from 'lucide-react';

export default function AboutTab() {
  return (
    <div className="max-w-2xl mx-auto text-center space-y-8 py-8">
      <div className="flex justify-center">
        <div className="p-4 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] shadow-lg shadow-[var(--primary)]/20">
           <Bot className="w-16 h-16 text-white" />
        </div>
      </div>
      
      <div>
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
           GB Trading Bot
        </h2>
        <p className="text-[var(--muted)] text-lg">Advanced Automated Trading Platform</p>
        <p className="text-[var(--muted)] text-sm mt-1">Version 2.4.0</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
         <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            <h3 className="font-bold mb-2 text-[var(--text)]">System Status</h3>
            <div className="space-y-2 text-sm text-[var(--muted)]">
               <div className="flex justify-between">
                 <span>Engine Core</span>
                 <span className="text-[var(--success)]">Operational</span>
               </div>
               <div className="flex justify-between">
                 <span>WebSocket Feed</span>
                 <span className="text-[var(--success)]">Connected</span>
               </div>
               <div className="flex justify-between">
                 <span>Database Sync</span>
                 <span className="text-[var(--warning)]">Local Storage Mode</span>
               </div>
            </div>
         </div>

         <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            <h3 className="font-bold mb-2 text-[var(--text)]">Resources</h3>
            <ul className="space-y-2 text-sm">
               <li>
                  <a href="#" className="flex items-center gap-2 text-[var(--primary)] hover:underline">
                     <ExternalLink className="w-3 h-3" /> Documentation
                  </a>
               </li>
               <li>
                  <a href="#" className="flex items-center gap-2 text-[var(--primary)] hover:underline">
                     <ExternalLink className="w-3 h-3" /> API Reference
                  </a>
               </li>
               <li>
                  <a href="#" className="flex items-center gap-2 text-[var(--primary)] hover:underline">
                     <ExternalLink className="w-3 h-3" /> Support Center
                  </a>
               </li>
            </ul>
         </div>
      </div>

      <div className="text-sm text-[var(--muted)] pt-8 border-t border-[var(--border)]">
         <p className="flex items-center justify-center gap-1">
            Made with <Heart className="w-3 h-3 text-[var(--danger)] fill-[var(--danger)]" /> by Horizons
         </p>
      </div>
    </div>
  );
}