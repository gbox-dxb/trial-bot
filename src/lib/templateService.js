import { storage } from './storage';
import { v4 as uuidv4 } from 'uuid';

export const templateService = {
  saveTemplate(template) {
    const templates = this.getTemplates();
    const newTemplate = {
      ...template,
      id: template.id || uuidv4(),
      // Ensure selectedCoins is preserved and is an array at the top level
      selectedCoins: Array.isArray(template.selectedCoins) ? template.selectedCoins : [],
      createdAt: template.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    
    // Also support older structure where coins might be in config, but prefer top-level
    if (!newTemplate.selectedCoins.length && template.config?.pairs) {
        newTemplate.selectedCoins = template.config.pairs;
    }
    
    const existingIndex = templates.findIndex(t => t.id === newTemplate.id);
    if (existingIndex >= 0) {
      templates[existingIndex] = newTemplate;
    } else {
      templates.push(newTemplate);
    }
    
    localStorage.setItem('tradingTemplates', JSON.stringify(templates));
    return newTemplate;
  },

  createTemplate(template) {
    return this.saveTemplate(template);
  },

  getTemplates() {
    const data = localStorage.getItem('tradingTemplates');
    return data ? JSON.parse(data) : [];
  },

  getTemplateById(id) {
    return this.getTemplates().find(t => t.id === id);
  },

  deleteTemplate(id) {
    const templates = this.getTemplates().filter(t => t.id !== id);
    localStorage.setItem('tradingTemplates', JSON.stringify(templates));
  },

  loadTemplate(id) {
    return this.getTemplateById(id);
  }
};