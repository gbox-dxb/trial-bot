import React, { useState } from 'react';
import DCABotsTable from './DCABotsTable';
import DCAOrderTrackingModal from './DCAOrderTrackingModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Layers, DollarSign } from 'lucide-react';

export default function DCAManagementSection({ bots, onRefresh }) {
  const [selectedBotForDetails, setSelectedBotForDetails] = useState(null);

  // Calculate Stats
  const activeBots = bots.filter(b => b.status === 'active');
  const totalInvested = activeBots.reduce((sum, b) => sum + (b.totalInvested || 0), 0);
  const totalOrders = activeBots.reduce((sum, b) => sum + (b.ordersExecuted || 0), 0);

  const handleEdit = (bot) => {
      // Scroll to top or trigger edit mode in parent
      const element = document.getElementById('dca-form');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
      // Note: Full edit logic usually requires lifting state to DCABot page
  };

  const handleViewDetails = (bot) => {
      setSelectedBotForDetails(bot);
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-none">
             <Card className="bg-slate-900/40 border-purple-500/20">
                 <CardContent className="p-4 flex items-center gap-4">
                     <div className="p-2 bg-purple-500/20 rounded-full"><Activity className="w-5 h-5 text-purple-400"/></div>
                     <div>
                         <p className="text-xs text-gray-500">Active DCAs</p>
                         <p className="text-lg font-bold text-white">{activeBots.length}</p>
                     </div>
                 </CardContent>
             </Card>
             <Card className="bg-slate-900/40 border-purple-500/20">
                 <CardContent className="p-4 flex items-center gap-4">
                     <div className="p-2 bg-green-500/20 rounded-full"><DollarSign className="w-5 h-5 text-green-400"/></div>
                     <div>
                         <p className="text-xs text-gray-500">Total Invested</p>
                         <p className="text-lg font-bold text-white">${totalInvested.toFixed(2)}</p>
                     </div>
                 </CardContent>
             </Card>
             <Card className="bg-slate-900/40 border-purple-500/20">
                 <CardContent className="p-4 flex items-center gap-4">
                     <div className="p-2 bg-blue-500/20 rounded-full"><Layers className="w-5 h-5 text-blue-400"/></div>
                     <div>
                         <p className="text-xs text-gray-500">Orders Executed</p>
                         <p className="text-lg font-bold text-white">{totalOrders}</p>
                     </div>
                 </CardContent>
             </Card>
        </div>

        {/* Main Table Area */}
        <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col min-h-0">
             <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80 flex justify-between items-center flex-none">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    DCA Management Console
                  </h3>
             </div>
             <div className="flex-1 overflow-auto min-h-0">
                 <DCABotsTable 
                     bots={bots}
                     onRefresh={onRefresh}
                     onEdit={handleEdit}
                     onView={handleViewDetails}
                 />
             </div>
        </div>

        <DCAOrderTrackingModal 
            isOpen={!!selectedBotForDetails}
            onClose={() => setSelectedBotForDetails(null)}
            dcaBot={selectedBotForDetails}
        />
    </div>
  );
}