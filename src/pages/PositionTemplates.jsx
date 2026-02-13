import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TemplatesProvider, useTemplates } from '@/contexts/TemplatesContext';
import TemplateForm from '@/components/templates/TemplateForm';
import TemplatesTable from '@/components/templates/TemplatesTable';

function PositionTemplatesContent() {
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const { createTemplate, updateTemplate, loading } = useTemplates();

  const handleCreateClick = () => {
    setEditingTemplate(null);
    setShowForm(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleSubmit = async (formData) => {
    if (editingTemplate) {
      return await updateTemplate(editingTemplate.id, formData);
    } else {
      return await createTemplate(formData);
    }
  };

  return (
    <>
      <Helmet>
        <title>Position Templates - GB Trading Bot</title>
        <meta name="description" content="Create and manage position templates for automated trading" />
      </Helmet>

      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Position Templates</h1>
            <p className="text-gray-400">Create reusable trading position templates</p>
          </div>
          <Button
            onClick={handleCreateClick}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Template
          </Button>
        </div>

        {/* Templates Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <TemplatesTable onEdit={handleEdit} />
        )}

        {/* Template Form Modal */}
        <AnimatePresence>
          {showForm && (
            <TemplateForm
              template={editingTemplate}
              onClose={() => setShowForm(false)}
              onSubmit={handleSubmit}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default function PositionTemplates() {
  return (
    <TemplatesProvider>
      <PositionTemplatesContent />
    </TemplatesProvider>
  );
}