/**
 * Waalaxy LinkedIn Automation Tool — Storage Manager
 * Wrapper around chrome.storage.local with namespaced keys.
 */

const StorageManager = {
  PREFIX: 'wx_',

  _key(name) {
    return `${this.PREFIX}${name}`;
  },

  async get(name, defaultValue = null) {
    const key = this._key(name);
    return new Promise(resolve => {
      chrome.storage.local.get(key, result => {
        resolve(result[key] !== undefined ? result[key] : defaultValue);
      });
    });
  },

  async set(name, value) {
    const key = this._key(name);
    return new Promise(resolve => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  },

  async remove(name) {
    const key = this._key(name);
    return new Promise(resolve => {
      chrome.storage.local.remove(key, resolve);
    });
  },

  async getMultiple(names) {
    const keys = names.map(n => this._key(n));
    return new Promise(resolve => {
      chrome.storage.local.get(keys, result => {
        const output = {};
        names.forEach(n => {
          output[n] = result[this._key(n)] !== undefined ? result[this._key(n)] : null;
        });
        resolve(output);
      });
    });
  },

  async setMultiple(obj) {
    const prefixed = {};
    for (const [k, v] of Object.entries(obj)) {
      prefixed[this._key(k)] = v;
    }
    return new Promise(resolve => {
      chrome.storage.local.set(prefixed, resolve);
    });
  },

  // ─── Convenience methods ─────────────────

  async getSettings() {
    return this.get('settings', {
      openaiApiKey: '',
      aiModel: 'gpt-4o-mini',
      showBadge: true,
      autoExtract: true,
      defaultTone: 'professional',
      userName: '',
      userTitle: '',
      userCompany: '',
      userEmail: '',
      userPhone: '',
      userLinkedIn: '',
      theme: 'dark',
      autoConnect: false,
      maxDailyConnections: 80,
      maxDailyMessages: 120,
      maxDailyVisits: 150,
      maxDailyFollows: 50,
      maxDailyLikes: 100,
      delayMin: 3,
      delayMax: 8,
      longPauseEvery: 15,
      longPauseSeconds: 30
    });
  },

  async updateSettings(updates) {
    const current = await this.getSettings();
    const merged = { ...current, ...updates };
    await this.set('settings', merged);
    return merged;
  },

  async getLeads() {
    return this.get('leads', []);
  },

  async saveLeads(leads) {
    return this.set('leads', leads);
  },

  async getStats() {
    return this.get('stats', {
      leadsSaved: 0,
      messagesDrafted: 0,
      emailsFound: 0,
      profilesViewed: 0,
      connectsSent: 0,
      emailsDrafted: 0,
      campaignsRun: 0
    });
  },

  async incrementStat(key, amount = 1) {
    const stats = await this.getStats();
    stats[key] = (stats[key] || 0) + amount;
    await this.set('stats', stats);
    return stats;
  },

  async getOutreachHistory() {
    return this.get('outreach_history', []);
  },

  async addOutreachEntry(entry) {
    const history = await this.getOutreachHistory();
    history.unshift({
      ...entry,
      id: `out_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString()
    });
    if (history.length > 1000) history.length = 1000;
    await this.set('outreach_history', history);
    return history[0];
  },

  async getTemplates() {
    return this.get('templates', []);
  },

  async saveTemplate(template) {
    const templates = await this.getTemplates();
    template.id = template.id || `tpl_${Date.now()}`;
    template.createdAt = template.createdAt || new Date().toISOString();
    const idx = templates.findIndex(t => t.id === template.id);
    if (idx >= 0) templates[idx] = template;
    else templates.push(template);
    await this.set('templates', templates);
    return template;
  },

  async getDailyCounters() {
    const today = new Date().toISOString().split('T')[0];
    const counters = await this.get('daily_counters', { date: today });
    if (counters.date !== today) {
      const reset = { date: today, connections: 0, messages: 0, visits: 0, follows: 0, likes: 0, emails: 0 };
      await this.set('daily_counters', reset);
      return reset;
    }
    return counters;
  },

  async incrementDailyCounter(type, amount = 1) {
    const counters = await this.getDailyCounters();
    counters[type] = (counters[type] || 0) + amount;
    await this.set('daily_counters', counters);
    return counters;
  }
};

if (typeof self !== 'undefined') self.StorageManager = StorageManager;
if (typeof window !== 'undefined') window.StorageManager = StorageManager;
