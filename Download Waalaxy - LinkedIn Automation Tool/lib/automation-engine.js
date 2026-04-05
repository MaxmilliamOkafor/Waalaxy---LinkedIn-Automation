/**
 * Waalaxy LinkedIn Automation Tool — Automation Engine
 * Priority queue with human-like delays and daily counters.
 * Unlimited usage — no daily caps or restrictions.
 */

const AutomationEngine = {
  _queue: [],
  _running: false,
  _paused: false,
  _processing: false,
  _listeners: {},
  _dailyCounters: {},
  _limits: null,
  _actionCount: 0,

  async init() {
    this._dailyCounters = await this._loadCounters();
    this._limits = await this._getLimits();
    this._queue = await this._loadQueue();
    console.log('[WX] AutomationEngine initialized');
  },

  // ─── Queue Management ─────────────────────────

  async enqueue(action) {
    action.id = action.id || `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    action.status = 'queued';
    action.priority = action.priority || 5;
    action.createdAt = new Date().toISOString();

    this._queue.push(action);
    this._queue.sort((a, b) => a.priority - b.priority);
    await this._saveQueue();

    this._emit('queued', action);
    return action;
  },

  async enqueueBatch(actions) {
    const results = [];
    for (const a of actions) {
      results.push(await this.enqueue(a));
    }
    return results;
  },

  async removeFromQueue(actionId) {
    this._queue = this._queue.filter(a => a.id !== actionId);
    await this._saveQueue();
  },

  clearQueue() {
    this._queue = [];
    this._saveQueue();
  },

  getQueue() {
    return [...this._queue];
  },

  // ─── Engine Control ───────────────────────────

  async start() {
    if (this._running) return;
    this._running = true;
    this._paused = false;
    this._emit('started');
    console.log('[WX] Automation started');
    this._processLoop();
  },

  pause() {
    this._paused = true;
    this._emit('paused');
    console.log('[WX] Automation paused');
  },

  resume() {
    if (!this._running) return this.start();
    this._paused = false;
    this._emit('resumed');
    console.log('[WX] Automation resumed');
    this._processLoop();
  },

  stop() {
    this._running = false;
    this._paused = false;
    this._emit('stopped');
    console.log('[WX] Automation stopped');
  },

  getStatus() {
    return {
      running: this._running,
      paused: this._paused,
      queueLength: this._queue.length,
      processing: this._processing,
      dailyCounters: { ...this._dailyCounters },
      actionCount: this._actionCount
    };
  },

  // ─── Processing Loop ─────────────────────────

  async _processLoop() {
    if (!this._running || this._paused || this._processing) return;

    while (this._running && !this._paused && this._queue.length > 0) {
      this._processing = true;

      const action = this._queue[0];

      // Minimal delay between actions
      const delayMs = (1 + Math.random() * 2) * 1000;
      await new Promise(r => setTimeout(r, delayMs));

      if (!this._running || this._paused) break;

      try {
        // Execute action via content script
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url || !tab.url.includes('linkedin.com')) {
          throw new Error('No active LinkedIn tab');
        }

        const result = await chrome.tabs.sendMessage(tab.id, {
          type: 'EXECUTE_ACTION',
          action: action
        });

        if (result && result.success) {
          action.status = 'completed';
          action.completedAt = new Date().toISOString();
          this._queue.shift();
          await this._incrementCounter(action.type);
          this._actionCount++;
          this._emit('action_completed', action);
        } else {
          throw new Error(result?.error || 'Action execution failed');
        }

      } catch (error) {
        action.status = 'failed';
        action.error = error.message;
        action.failedAt = new Date().toISOString();
        action.retries = (action.retries || 0) + 1;

        if (action.retries >= 3) {
          this._queue.shift();
          this._emit('action_failed', action);
        } else {
          // Move to back of queue for retry
          this._queue.shift();
          this._queue.push(action);
          action.status = 'retry';
        }
      }

      await this._saveQueue();

    }

    this._processing = false;

    if (this._queue.length === 0 && this._running) {
      this.stop();
      this._emit('queue_empty');
    }
  },

  // ─── Daily Counters ──────────────────────────

  _checkLimit(actionType) {
    // Unlimited usage — no daily caps
    return true;
  },

  async _incrementCounter(actionType) {
    const typeMap = {
      'connect': 'connections', 'message': 'messages',
      'visit': 'visits', 'view': 'visits',
      'follow': 'follows', 'like': 'likes',
      'endorse': 'endorsements', 'comment': 'comments'
    };

    const counter = typeMap[actionType];
    if (counter) {
      this._dailyCounters[counter] = (this._dailyCounters[counter] || 0) + 1;
      await this._saveCounters();
    }
  },

  async _loadCounters() {
    return new Promise(resolve => {
      chrome.storage.local.get('wx_daily_counters', result => {
        const counters = result.wx_daily_counters || {};
        const today = new Date().toISOString().split('T')[0];
        if (counters.date !== today) {
          resolve({ date: today, connections: 0, messages: 0, visits: 0, follows: 0, likes: 0, endorsements: 0, comments: 0 });
        } else {
          resolve(counters);
        }
      });
    });
  },

  async _saveCounters() {
    return new Promise(resolve => {
      chrome.storage.local.set({ wx_daily_counters: this._dailyCounters }, resolve);
    });
  },

  getDailyCounters() {
    return { ...this._dailyCounters };
  },

  // ─── Limits ──────────────────────────────────

  async _getLimits() {
    // Unlimited — no caps enforced
    return {
      maxDailyConnections: Infinity,
      maxDailyMessages: Infinity,
      maxDailyVisits: Infinity,
      maxDailyFollows: Infinity,
      maxDailyLikes: Infinity,
      delayMin: 1,
      delayMax: 3,
      longPauseEvery: Infinity,
      longPauseSeconds: 0
    };
  },

  async updateLimits(newLimits) {
    // No-op — limits are removed
    return {};
  },

  // ─── Queue Persistence ───────────────────────

  async _loadQueue() {
    return new Promise(resolve => {
      chrome.storage.local.get('wx_queue', result => {
        resolve(result.wx_queue || []);
      });
    });
  },

  async _saveQueue() {
    return new Promise(resolve => {
      chrome.storage.local.set({ wx_queue: this._queue }, resolve);
    });
  },

  // ─── Event System ────────────────────────────

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  },

  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
  },

  _emit(event, data) {
    (this._listeners[event] || []).forEach(cb => {
      try { cb(data); } catch (e) { console.warn('[WX] Event error:', e); }
    });
  }
};

if (typeof self !== 'undefined') self.AutomationEngine = AutomationEngine;
