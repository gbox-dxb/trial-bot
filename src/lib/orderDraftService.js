import { v4 as uuidv4 } from 'uuid';

export const orderDraftService = {
  // Save order draft with price snapshot
  saveDraft(draft) {
    const drafts = this.getDrafts();
    const newDraft = {
      ...draft,
      id: draft.id || uuidv4(),
      createdAt: draft.createdAt || Date.now(),
      updatedAt: Date.now(),
      status: 'PENDING', // PENDING, EXECUTED, CANCELLED
      priceSnapshot: draft.priceSnapshot || {}
    };
    
    const existingIndex = drafts.findIndex(d => d.id === newDraft.id);
    if (existingIndex >= 0) {
      drafts[existingIndex] = newDraft;
    } else {
      drafts.push(newDraft);
    }
    
    this._save(drafts);
    return newDraft;
  },

  getDrafts() {
    const data = localStorage.getItem('orderDrafts');
    return data ? JSON.parse(data) : [];
  },

  getPendingDrafts() {
    return this.getDrafts().filter(d => d.status === 'PENDING');
  },

  getDraftById(id) {
    return this.getDrafts().find(d => d.id === id);
  },

  deleteDraft(id) {
    const drafts = this.getDrafts().filter(d => d.id !== id);
    this._save(drafts);
  },

  updateDraft(id, updates) {
    const drafts = this.getDrafts();
    const index = drafts.findIndex(d => d.id === id);
    if (index >= 0) {
      drafts[index] = { ...drafts[index], ...updates, updatedAt: Date.now() };
      this._save(drafts);
      return drafts[index];
    }
    return null;
  },

  markAsExecuted(id) {
    return this.updateDraft(id, { status: 'EXECUTED', executedAt: Date.now() });
  },

  _save(drafts) {
    localStorage.setItem('orderDrafts', JSON.stringify(drafts));
  }
};