import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LimitOrdersProvider, useLimitOrders } from '@/contexts/LimitOrdersContext';
import LimitOrderForm from '@/components/limitorders/LimitOrderForm';
import LimitOrdersTable from '@/components/limitorders/LimitOrdersTable';

const EXCHANGES = ['ALL', 'Binance', 'MEXC', 'DEMO Binance', 'DEMO MEXC'];
const ACCOUNT_TYPES = ['ALL', 'Spot', 'Futures'];
const STATUSES = ['PENDING', 'PLACED', 'PARTIALLY FILLED', 'FILLED', 'CANCELLED', 'FAILED'];

function LimitsOrderContent() {
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const { createLimitOrder, updateLimitOrder, loading, filters, updateFilters, clearFilters } = useLimitOrders();

  const handleCreateClick = () => {
    setEditingOrder(null);
    setShowForm(true);
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setShowForm(true);
  };

  const handleSubmit = async (formData) => {
    if (editingOrder) {
      return await updateLimitOrder(editingOrder.id, formData);
    } else {
      return await createLimitOrder(formData);
    }
  };

  const handleStatusToggle = (status) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    updateFilters({ status: newStatuses });
  };

  const activeFilterCount = 
    (filters.exchange !== 'ALL' ? 1 : 0) +
    (filters.accountType !== 'ALL' ? 1 : 0) +
    (filters.symbol ? 1 : 0) +
    filters.status.length;

  return (
    <>
      <Helmet>
        <title>Limit Orders - GB Trading Bot</title>
        <meta name="description" content="Manage and track your limit orders across exchanges" />
      </Helmet>

      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Limit Orders</h1>
            <p className="text-gray-400">Create and manage limit orders across your exchanges</p>
          </div>
          <Button
            onClick={handleCreateClick}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Limit Order
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-purple-500/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Filters</h3>
              {activeFilterCount > 0 && (
                <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </div>
            {activeFilterCount > 0 && (
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="text-gray-400"
              >
                Clear Filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Exchange Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Exchange</label>
              <select
                value={filters.exchange}
                onChange={(e) => updateFilters({ exchange: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                {EXCHANGES.map(ex => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
            </div>

            {/* Account Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Account Type</label>
              <select
                value={filters.accountType}
                onChange={(e) => updateFilters({ accountType: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                {ACCOUNT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Symbol Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
              <Input
                value={filters.symbol}
                onChange={(e) => updateFilters({ symbol: e.target.value })}
                placeholder="e.g., BTCUSDT"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusToggle(status)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      filters.status.includes(status)
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-900 text-gray-400 hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <LimitOrdersTable onEdit={handleEdit} />
        )}

        {/* Limit Order Form Modal */}
        <AnimatePresence>
          {showForm && (
            <LimitOrderForm
              order={editingOrder}
              onClose={() => setShowForm(false)}
              onSubmit={handleSubmit}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default function LimitsOrder() {
  return (
    <LimitOrdersProvider>
      <LimitsOrderContent />
    </LimitOrdersProvider>
  );
}