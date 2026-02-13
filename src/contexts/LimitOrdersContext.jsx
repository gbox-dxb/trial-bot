import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { limitOrdersService } from '@/lib/limitOrdersService';
import { useToast } from '@/components/ui/use-toast';

const LimitOrdersContext = createContext(null);

export function LimitOrdersProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    exchange: 'ALL',
    accountType: 'ALL',
    symbol: '',
    status: []
  });
  const { toast } = useToast();

  const fetchLimitOrders = useCallback(async (customFilters) => {
    setLoading(true);
    setError(null);
    try {
      const filterParams = customFilters || filters;
      const data = await limitOrdersService.fetchLimitOrders(filterParams);
      setOrders(data);
    } catch (err) {
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to fetch limit orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  const createLimitOrder = useCallback(async (orderData) => {
    try {
      const newOrder = await limitOrdersService.createLimitOrder({
        ...orderData,
        status: 'PENDING',
        createdAt: Date.now()
      });
      setOrders(prev => [newOrder, ...prev]);
      toast({
        title: "Success",
        description: "Limit order created successfully"
      });
      return { success: true, data: newOrder };
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to create limit order",
        variant: "destructive"
      });
      return { success: false, error: err.message };
    }
  }, [toast]);

  const updateLimitOrder = useCallback(async (id, orderData) => {
    try {
      const updated = await limitOrdersService.updateLimitOrder(id, orderData);
      setOrders(prev => prev.map(o => o.id === id ? updated : o));
      toast({
        title: "Success",
        description: "Limit order updated successfully"
      });
      return { success: true, data: updated };
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to update limit order",
        variant: "destructive"
      });
      return { success: false, error: err.message };
    }
  }, [toast]);

  const placeLimitOrder = useCallback(async (id) => {
    try {
      const placed = await limitOrdersService.placeLimitOrder(id);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'PLACED' } : o));
      toast({
        title: "Success",
        description: "Limit order placed successfully"
      });
      return { success: true, data: placed };
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to place limit order",
        variant: "destructive"
      });
      return { success: false, error: err.message };
    }
  }, [toast]);

  const cancelLimitOrder = useCallback(async (id) => {
    try {
      await limitOrdersService.cancelLimitOrder(id);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'CANCELLED' } : o));
      toast({
        title: "Success",
        description: "Limit order cancelled successfully"
      });
      return { success: true };
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to cancel limit order",
        variant: "destructive"
      });
      return { success: false, error: err.message };
    }
  }, [toast]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      exchange: 'ALL',
      accountType: 'ALL',
      symbol: '',
      status: []
    });
  }, []);

  useEffect(() => {
    fetchLimitOrders();
  }, [filters]);

  useEffect(() => {
    const unsubscribe = limitOrdersService.subscribeToPrices((update) => {
      setOrders(prev => prev.map(order => 
        order.id === update.orderId ? { ...order, ...update } : order
      ));
    });

    return unsubscribe;
  }, []);

  return (
    <LimitOrdersContext.Provider value={{
      orders,
      loading,
      error,
      filters,
      fetchLimitOrders,
      createLimitOrder,
      updateLimitOrder,
      placeLimitOrder,
      cancelLimitOrder,
      updateFilters,
      clearFilters
    }}>
      {children}
    </LimitOrdersContext.Provider>
  );
}

export function useLimitOrders() {
  const context = useContext(LimitOrdersContext);
  if (!context) {
    throw new Error('useLimitOrders must be used within LimitOrdersProvider');
  }
  return context;
}