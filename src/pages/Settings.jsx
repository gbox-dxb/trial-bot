import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ThemeSelector from '@/components/settings/ThemeSelector';
import CustomCodeEditor from '@/components/settings/CustomCodeEditor';
import CustomCodeList from '@/components/settings/CustomCodeList';
import AboutTab from '@/components/settings/AboutTab';
import { customCodeService } from '@/lib/customCodeService';
import { Palette, Code, Info, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('theme');
  const [codes, setCodes] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingCode, setEditingCode] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    setCodes(customCodeService.getCodes());
  }, [refreshTrigger]);

  const handleRefresh = () => setRefreshTrigger(p => p + 1);
  
  const handleEdit = (code) => {
    setEditingCode(code);
    setShowEditor(true);
  };

  const handleAddNew = () => {
    setEditingCode(null);
    setShowEditor(true);
  };

  return (
    <>
      <Helmet>
        <title>Settings - GB Trading Bot</title>
      </Helmet>
      
      <div className="max-w-6xl mx-auto space-y-6 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Settings</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-[var(--bg-secondary)] border border-custom p-1 rounded-lg">
            <TabsTrigger value="theme" className="data-[state=active]:bg-[var(--primary-accent)] data-[state=active]:text-[var(--primary-contrast)] flex gap-2">
               <Palette className="w-4 h-4" /> Theme
            </TabsTrigger>
            <TabsTrigger value="custom-code" className="data-[state=active]:bg-[var(--primary-accent)] data-[state=active]:text-[var(--primary-contrast)] flex gap-2">
               <Code className="w-4 h-4" /> Custom Code
            </TabsTrigger>
            <TabsTrigger value="about" className="data-[state=active]:bg-[var(--primary-accent)] data-[state=active]:text-[var(--primary-contrast)] flex gap-2">
               <Info className="w-4 h-4" /> About
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="theme" className="mt-0">
                <ThemeSelector />
              </TabsContent>

              <TabsContent value="custom-code" className="mt-0 space-y-6">
                {!showEditor ? (
                   <div className="space-y-4">
                      <div className="flex justify-between items-center bg-[var(--card-bg)] p-4 rounded-xl border border-custom">
                         <div>
                            <h2 className="font-bold text-[var(--text-primary)]">Custom CSS Injection</h2>
                            <p className="text-sm text-[var(--text-secondary)]">Inject custom styles to override the current theme.</p>
                         </div>
                         <Button onClick={handleAddNew}>
                            <Plus className="w-4 h-4 mr-2" /> Add New
                         </Button>
                      </div>
                      <CustomCodeList codes={codes} onRefresh={handleRefresh} onEdit={handleEdit} />
                   </div>
                ) : (
                   <div>
                      <div className="flex items-center gap-2 mb-4">
                         <Button variant="ghost" onClick={() => setShowEditor(false)}>
                            &larr; Back to List
                         </Button>
                         <h2 className="font-bold text-[var(--text-primary)]">
                            {editingCode ? 'Edit Custom Code' : 'Create Custom Code'}
                         </h2>
                      </div>
                      <CustomCodeEditor 
                        initialCode={editingCode} 
                        onSave={() => {
                           handleRefresh();
                           setShowEditor(false);
                        }} 
                      />
                   </div>
                )}
              </TabsContent>

              <TabsContent value="about" className="mt-0">
                 <AboutTab />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </>
  );
}