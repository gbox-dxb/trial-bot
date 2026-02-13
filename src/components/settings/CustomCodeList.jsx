import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, CheckCircle, XCircle } from 'lucide-react';
import { customCodeService } from '@/lib/customCodeService';

export default function CustomCodeList({ codes, onRefresh, onEdit }) {
  const toggleStatus = (code) => {
    customCodeService.updateCode(code.id, { status: code.status === 'enabled' ? 'disabled' : 'enabled' });
    onRefresh();
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this code?')) {
      customCodeService.deleteCode(id);
      onRefresh();
    }
  };

  if (!codes || codes.length === 0) {
    return <div className="text-center p-8 text-[var(--muted)] bg-[var(--surface)] rounded-xl border border-[var(--border)]">No custom code entries found.</div>;
  }

  return (
    <div className="space-y-2">
      {codes.map(code => (
        <div key={code.id} className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg hover:border-[var(--primary)] transition-colors">
          <div className="flex-1">
             <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-[var(--text)]">{code.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${code.status === 'enabled' ? 'border-green-500/30 text-green-500 bg-green-500/10' : 'border-gray-500/30 text-gray-500 bg-gray-500/10'}`}>
                   {code.status}
                </span>
                {code.themeSpecific && (
                   <span className="text-[10px] px-2 py-0.5 rounded-full border border-purple-500/30 text-purple-400 bg-purple-500/10">
                      {code.targetTheme}
                   </span>
                )}
             </div>
             <div className="text-xs text-[var(--muted)] flex gap-3">
               <span>Scope: {code.scope}</span>
               <span>Device: {code.device}</span>
               <span>Updated: {new Date(code.updatedAt).toLocaleDateString()}</span>
             </div>
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => toggleStatus(code)} className="h-8 w-8 p-0 text-[var(--muted)] hover:text-[var(--text)]">
               {code.status === 'enabled' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onEdit(code)} className="h-8 w-8 p-0 text-[var(--info)]">
               <Edit className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleDelete(code.id)} className="h-8 w-8 p-0 text-[var(--danger)]">
               <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}