import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { keyManagement } from '@/lib/keyManagement';
import { BinanceConnector } from '@/lib/connectors/BinanceConnector';
import { MexcConnector } from '@/lib/connectors/MexcConnector';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function Exchanges() {
  const [exchanges, setExchanges] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', exchange: 'Binance', type: 'Futures', mode: 'Live',
    apiKey: '', apiSecret: '', status: 'inactive', balance: 0
  });

  const { toast } = useToast();
  const userId = 'user-1';

  useEffect(() => {
    loadExchanges();
  }, []);

  const loadExchanges = () => {
    // getExchangeAccounts now returns merged list of Live and Demo accounts
    setExchanges(keyManagement.getExchangeAccounts(userId));
  };

  const handleTestConnection = async () => {
    if (formData.mode === 'Demo') {
      // Set a default balance for Demo mode immediately upon "Test"
      setFormData(p => ({ ...p, status: 'active', balance: 10000 }));
      toast({ title: "Demo Ready", description: "Demo account verified with 10,000 USDT balance." });
      return;
    }

    setIsTesting(true);
    try {
      const connector = formData.exchange === 'Binance' ? BinanceConnector : MexcConnector;
      const result = await connector.validateKeys({ ...formData, marketType: formData.type });

      if (result.valid) {
        try {
          const bal = await connector.getBalance({ ...formData, marketType: formData.type });
          setFormData(p => ({ ...p, status: 'active', balance: bal.USDT.available }));
          toast({ title: "Connected!", description: `API Keys are valid on ${formData.mode}.` });
        } catch (e) {
          setFormData(p => ({ ...p, status: 'active', balance: 0 }));
        }
      } else {
        setFormData(p => ({ ...p, status: 'error' }));
        toast({ variant: 'destructive', title: "Connection Failed", description: result.error });
      }
    } catch (e) {
      setFormData(p => ({ ...p, status: 'error' }));
    } finally {
      setIsTesting(false);
    }
  };

  const isSaveDisabled = () => {
    if (!formData.name) return true;
    if (formData.mode === 'Demo') return false;
    return !formData.apiKey || !formData.apiSecret;
  };

  const handleSave = () => {
    if (isSaveDisabled()) return;

    if (formData.mode === 'Demo') {
      // Explicitly use saveDemoAccount for demo accounts
      keyManagement.saveDemoAccount({
        name: formData.name,
        exchange: formData.exchange,
        type: formData.type,
        balance: formData.balance || 10000,
        leverage: 20
      });
    } else {
      keyManagement.saveExchangeKeys(
        userId, formData.exchange, formData.type, formData.mode,
        formData.apiKey, formData.apiSecret, formData.name
      );
    }

    loadExchanges();
    setIsAddDialogOpen(false);
    setFormData({ name: '', exchange: 'Binance', type: 'Futures', mode: 'Live', apiKey: '', apiSecret: '', status: 'inactive', balance: 0 });
    toast({ title: "Account Saved" });
  };

  const handleDelete = (id) => {
    keyManagement.deleteExchangeAccount(userId, id);
    loadExchanges();
    toast({ title: "Account Deleted" });
  };

  return (
    <>
      <Helmet><title>Exchanges</title></Helmet>
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">My Exchanges</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 font-bold"><Plus className="mr-2 h-4 w-4" /> Add Account</Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700 text-white">
              <DialogHeader><DialogTitle>Connect Exchange</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <Input placeholder="Nickname" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-[#0F1419]" />
                <div className="grid grid-cols-2 gap-2">
                  <select className="bg-[#0F1419] p-2 rounded border border-slate-800 text-white" value={formData.exchange} onChange={e => setFormData({ ...formData, exchange: e.target.value })}>
                    <option value="Binance">Binance</option><option value="Mexc">MEXC</option>
                  </select>
                  <select className="bg-[#0F1419] p-2 rounded border border-slate-800 text-white" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                    <option value="Spot">Spot</option><option value="Futures">Futures</option>
                  </select>
                </div>
                <select className="w-full bg-[#0F1419] p-2 rounded border border-slate-800 text-white" value={formData.mode} onChange={e => setFormData({ ...formData, mode: e.target.value, status: 'inactive' })}>
                  <option value="Live">Live Trading</option>
                  <option value="Testnet">Testnet</option>
                  <option value="Demo">Demo / Paper</option>
                </select>

                {formData.mode !== 'Demo' && (
                  <>
                    <Input placeholder="API Key" value={formData.apiKey} onChange={e => setFormData({ ...formData, apiKey: e.target.value })} className="bg-[#0F1419]" />
                    <Input type="password" placeholder="API Secret" value={formData.apiSecret} onChange={e => setFormData({ ...formData, apiSecret: e.target.value })} className="bg-[#0F1419]" />
                  </>
                )}

                <div className="flex items-center gap-2">
                  <Button onClick={handleTestConnection} disabled={isTesting || formData.mode === 'Demo'} variant="outline" className="flex-1 border-slate-600">
                    {isTesting ? <RefreshCw className="animate-spin h-4 w-4" /> : 'Test Connection'}
                  </Button>
                  <Button onClick={handleSave} disabled={isSaveDisabled()} className="flex-1 bg-green-600 hover:bg-green-700">Save</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exchanges.map(ex => (
            <div key={ex.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 relative group">
              <div className="flex justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white text-lg">{ex.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary">{ex.exchange}</Badge>
                    <Badge variant="outline">{ex.type}</Badge>
                    <Badge className={ex.mode === 'Live' ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}>{ex.mode}</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(ex.id)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <p className="text-xs text-gray-400 uppercase">Balance</p>
                <p className="text-xl font-mono text-white">${(ex.balance || 0).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {exchanges.length === 0 && <p className="text-gray-500 text-center col-span-full">No accounts connected.</p>}
        </div>
      </div>
    </>
  );
}