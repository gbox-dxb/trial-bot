import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Copy, Power, Trash2, MoreVertical } from 'lucide-react';
import { useTemplates } from '@/contexts/TemplatesContext';
import { useToast } from '@/components/ui/use-toast';

export default function TemplatesTable({ onEdit }) {
  const { templates, deleteTemplate, duplicateTemplate, disableTemplate } = useTemplates();
  const { toast } = useToast();
  const [activeMenu, setActiveMenu] = useState(null);

  const handleDelete = async (id, template) => {
    if (template.status === 'ACTIVE') {
      toast({
        title: "Cannot Delete",
        description: "Active templates cannot be deleted",
        variant: "destructive"
      });
      return;
    }
    
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate(id);
    }
  };

  const handleDuplicate = async (template) => {
    await duplicateTemplate(template);
    setActiveMenu(null);
  };

  const handleDisable = async (id) => {
    await disableTemplate(id);
    setActiveMenu(null);
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-yellow-500/20 text-yellow-400',
      ACTIVE: 'bg-green-500/20 text-green-400',
      DISABLED: 'bg-gray-500/20 text-gray-400'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || styles.PENDING}`}>
        {status}
      </span>
    );
  };

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No templates created yet</p>
        <p className="text-sm text-gray-500 mt-2">Create your first position template to get started</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-purple-500/20 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Exchange</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Symbol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Direction</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Leverage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">TP/SL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Order Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-500/10">
            {templates.map((template, index) => (
              <motion.tr
                key={template.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-slate-700/30"
              >
                <td className="px-6 py-4 text-white font-medium">{template.name}</td>
                <td className="px-6 py-4 text-gray-300">{template.exchange}</td>
                <td className="px-6 py-4 text-gray-300">{template.symbol}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    template.direction === 'LONG' ? 'bg-green-500/20 text-green-400' :
                    template.direction === 'SHORT' ? 'bg-red-500/20 text-red-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {template.direction}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-300">
                  {template.amount} {template.amountMode === 'PERCENT' ? '%' : 'USDT'}
                </td>
                <td className="px-6 py-4 text-gray-300">
                  {template.leverage ? `${template.leverage}x` : '-'}
                </td>
                <td className="px-6 py-4 text-gray-300">
                  {template.takeProfitEnabled && template.stopLossEnabled ? 'Both' :
                   template.takeProfitEnabled ? 'TP Only' :
                   template.stopLossEnabled ? 'SL Only' : 'None'}
                </td>
                <td className="px-6 py-4 text-gray-300">{template.orderType}</td>
                <td className="px-6 py-4">{getStatusBadge(template.status)}</td>
                <td className="px-6 py-4">
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === template.id ? null : template.id)}
                      className="p-2 hover:bg-slate-700 rounded-lg"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    {activeMenu === template.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-purple-500/20 rounded-lg shadow-xl z-10">
                        <button
                          onClick={() => { onEdit(template); setActiveMenu(null); }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-slate-800 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => handleDuplicate(template)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-slate-800 flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" /> Duplicate
                        </button>
                        <button
                          onClick={() => handleDisable(template.id)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-slate-800 flex items-center gap-2"
                        >
                          <Power className="w-4 h-4" /> Disable
                        </button>
                        <button
                          onClick={() => { handleDelete(template.id, template); setActiveMenu(null); }}
                          className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-800 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}