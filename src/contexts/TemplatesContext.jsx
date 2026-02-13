import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { positionTemplatesService } from '@/lib/positionTemplatesService';
import { useToast } from '@/components/ui/use-toast';

const TemplatesContext = createContext(null);

export function TemplatesProvider({ children }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceChange24h, setPriceChange24h] = useState(null);
  const { toast } = useToast();

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await positionTemplatesService.fetchTemplates();
      setTemplates(data);
    } catch (err) {
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to fetch templates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createTemplate = useCallback(async (templateData) => {
    try {
      const newTemplate = await positionTemplatesService.createTemplate({
        ...templateData,
        status: 'PENDING'
      });
      setTemplates(prev => [newTemplate, ...prev]);
      toast({
        title: "Success",
        description: "Template created successfully"
      });
      return { success: true, data: newTemplate };
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to create template",
        variant: "destructive"
      });
      return { success: false, error: err.message };
    }
  }, [toast]);

  const updateTemplate = useCallback(async (id, templateData) => {
    try {
      const updated = await positionTemplatesService.updateTemplate(id, templateData);
      setTemplates(prev => prev.map(t => t.id === id ? updated : t));
      toast({
        title: "Success",
        description: "Template updated successfully"
      });
      return { success: true, data: updated };
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to update template",
        variant: "destructive"
      });
      return { success: false, error: err.message };
    }
  }, [toast]);

  const deleteTemplate = useCallback(async (id) => {
    try {
      await positionTemplatesService.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast({
        title: "Success",
        description: "Template deleted successfully"
      });
      return { success: true };
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete template",
        variant: "destructive"
      });
      return { success: false, error: err.message };
    }
  }, [toast]);

  const duplicateTemplate = useCallback(async (template) => {
    const duplicate = {
      ...template,
      id: undefined,
      name: `${template.name} (Copy)`,
      status: 'PENDING',
      createdAt: Date.now()
    };
    return createTemplate(duplicate);
  }, [createTemplate]);

  const disableTemplate = useCallback(async (id) => {
    return updateTemplate(id, { status: 'DISABLED' });
  }, [updateTemplate]);

  const subscribeToPrice = useCallback((symbol) => {
    if (!symbol) {
      setCurrentPrice(null);
      setPriceChange24h(null);
      return;
    }

    const unsubscribe = positionTemplatesService.subscribeToPrice(symbol, (data) => {
      setCurrentPrice(data.price);
      setPriceChange24h(data.change24h);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return (
    <TemplatesContext.Provider value={{
      templates,
      loading,
      error,
      currentPrice,
      priceChange24h,
      fetchTemplates,
      createTemplate,
      updateTemplate,
      deleteTemplate,
      duplicateTemplate,
      disableTemplate,
      subscribeToPrice
    }}>
      {children}
    </TemplatesContext.Provider>
  );
}

export function useTemplates() {
  const context = useContext(TemplatesContext);
  if (!context) {
    throw new Error('useTemplates must be used within TemplatesProvider');
  }
  return context;
}