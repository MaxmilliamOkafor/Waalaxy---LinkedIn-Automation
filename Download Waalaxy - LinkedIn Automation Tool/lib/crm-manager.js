/**
 * Waalaxy LinkedIn Automation Tool — CRM Manager
 * 7-stage pipeline with tags, notes, activity timeline, and bulk operations.
 */

const CRMManager = {
  STAGES: [
    { id: 'new', name: 'New', icon: '🆕', color: '#6366f1' },
    { id: 'contacted', name: 'Contacted', icon: '📤', color: '#8b5cf6' },
    { id: 'connected', name: 'Connected', icon: '🤝', color: '#06b6d4' },
    { id: 'replied', name: 'Replied', icon: '💬', color: '#10b981' },
    { id: 'meeting', name: 'Meeting', icon: '📅', color: '#f59e0b' },
    { id: 'won', name: 'Won', icon: '🏆', color: '#22c55e' },
    { id: 'lost', name: 'Lost', icon: '✕', color: '#ef4444' }
  ],

  async init() {
    const data = await this._getData();
    if (!data.initialized) {
      data.initialized = true;
      data.stages = {};
      this.STAGES.forEach(s => { data.stages[s.id] = []; });
      data.activities = [];
      data.tags = [];
      await this._saveData(data);
    }
  },

  // ─── Pipeline Operations ──────────────────────

  async getPipelineOverview() {
    const data = await this._getData();
    const leads = await this._getLeads();

    const overview = this.STAGES.map(stage => {
      const leadIds = (data.stages?.[stage.id] || []);
      const stageLeads = leadIds.map(id => leads.find(l => l.id === id)).filter(Boolean);
      return {
        ...stage,
        leads: stageLeads,
        count: stageLeads.length
      };
    });

    return overview;
  },

  async moveToStage(leadId, stageId) {
    const data = await this._getData();
    if (!data.stages) data.stages = {};

    // Remove from all stages
    for (const sid of Object.keys(data.stages)) {
      data.stages[sid] = (data.stages[sid] || []).filter(id => id !== leadId);
    }

    // Add to new stage
    if (!data.stages[stageId]) data.stages[stageId] = [];
    data.stages[stageId].push(leadId);

    // Log activity
    this._addActivity(data, {
      leadId,
      type: 'stage_change',
      detail: `Moved to ${stageId}`,
      timestamp: new Date().toISOString()
    });

    await this._saveData(data);
    return { success: true };
  },

  async getLeadCRMData(leadId) {
    const data = await this._getData();
    const stage = Object.entries(data.stages || {}).find(([_, ids]) => ids.includes(leadId));
    const activities = (data.activities || []).filter(a => a.leadId === leadId);
    const leadNotes = (data.notes || {})[leadId] || [];
    const leadTags = (data.leadTags || {})[leadId] || [];

    return {
      stageId: stage ? stage[0] : 'new',
      activities,
      notes: leadNotes,
      tags: leadTags
    };
  },

  // ─── Notes ────────────────────────────────────

  async addNote(leadId, note) {
    const data = await this._getData();
    if (!data.notes) data.notes = {};
    if (!data.notes[leadId]) data.notes[leadId] = [];

    const entry = {
      id: `note_${Date.now()}`,
      text: note,
      createdAt: new Date().toISOString()
    };

    data.notes[leadId].unshift(entry);

    this._addActivity(data, {
      leadId,
      type: 'note_added',
      detail: note.substring(0, 100),
      timestamp: new Date().toISOString()
    });

    await this._saveData(data);
    return entry;
  },

  // ─── Tags ─────────────────────────────────────

  async addTag(leadId, tag) {
    const data = await this._getData();
    if (!data.leadTags) data.leadTags = {};
    if (!data.leadTags[leadId]) data.leadTags[leadId] = [];

    if (!data.leadTags[leadId].includes(tag)) {
      data.leadTags[leadId].push(tag);
    }

    // Track all tags
    if (!data.allTags) data.allTags = [];
    if (!data.allTags.includes(tag)) data.allTags.push(tag);

    await this._saveData(data);
    return { success: true };
  },

  async removeTag(leadId, tag) {
    const data = await this._getData();
    if (data.leadTags?.[leadId]) {
      data.leadTags[leadId] = data.leadTags[leadId].filter(t => t !== tag);
    }
    await this._saveData(data);
    return { success: true };
  },

  async getAllTags() {
    const data = await this._getData();
    return data.allTags || [];
  },

  // ─── Activity Log ────────────────────────────

  async logAction(leadId, actionType, details = {}) {
    const data = await this._getData();

    this._addActivity(data, {
      leadId,
      type: actionType,
      detail: JSON.stringify(details),
      timestamp: new Date().toISOString()
    });

    // Auto-advance stage based on action
    if (actionType === 'connect' || actionType === 'message') {
      const currentStage = Object.entries(data.stages || {}).find(([_, ids]) => ids.includes(leadId));
      if (currentStage && currentStage[0] === 'new') {
        await this.moveToStage(leadId, 'contacted');
      }
    }

    await this._saveData(data);
  },

  async getRecentActivities(limit = 50) {
    const data = await this._getData();
    return (data.activities || []).slice(0, limit);
  },

  _addActivity(data, activity) {
    if (!data.activities) data.activities = [];
    data.activities.unshift(activity);
    if (data.activities.length > 500) data.activities.length = 500;
  },

  // ─── Bulk Operations ─────────────────────────

  async bulkMoveToStage(leadIds, stageId) {
    for (const id of leadIds) {
      await this.moveToStage(id, stageId);
    }
    return { success: true, moved: leadIds.length };
  },

  async bulkAddTag(leadIds, tag) {
    for (const id of leadIds) {
      await this.addTag(id, tag);
    }
    return { success: true, tagged: leadIds.length };
  },

  // ─── Storage ─────────────────────────────────

  async _getData() {
    return new Promise(resolve => {
      chrome.storage.local.get('wx_crm_data', r => resolve(r.wx_crm_data || {}));
    });
  },

  async _saveData(data) {
    return new Promise(resolve => {
      chrome.storage.local.set({ wx_crm_data: data }, resolve);
    });
  },

  async _getLeads() {
    return new Promise(resolve => {
      chrome.storage.local.get('wx_leads', r => resolve(r.wx_leads || []));
    });
  }
};

if (typeof self !== 'undefined') self.CRMManager = CRMManager;
