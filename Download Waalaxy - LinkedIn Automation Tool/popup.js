/**
 * Waalaxy — Popup Controller
 * Quick stats dashboard and action buttons.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    // Load stats
    const leads = await msg('GET_LEADS') || [];
    const campaigns = await msg('GET_CAMPAIGNS') || [];
    const active = campaigns.filter(c => c.status === 'active');
    const status = await msg('GET_AUTO_STATUS') || {};
    const counters = await msg('GET_DAILY_COUNTERS') || {};

    let totalSent = 0, totalReplied = 0;
    campaigns.forEach(c => {
      totalSent += c.stats?.sent || 0;
      totalReplied += c.stats?.replied || 0;
    });

    document.getElementById('pop-leads').textContent = leads.length;
    document.getElementById('pop-campaigns').textContent = active.length;
    document.getElementById('pop-sent').textContent = totalSent;
    document.getElementById('pop-rate').textContent = totalSent > 0
      ? Math.round((totalReplied / totalSent) * 100) + '%' : '0%';

    // Automation
    const dot = document.getElementById('pop-auto-dot');
    const text = document.getElementById('pop-auto-text');
    if (status.running && !status.paused) { dot.className = 'wx-pop-auto-dot running'; text.textContent = 'Running'; }
    else if (status.paused) { dot.className = 'wx-pop-auto-dot paused'; text.textContent = 'Paused'; }
    else { text.textContent = 'Idle'; }

    document.getElementById('pop-auto-queue').textContent = `Queue: ${status.queueLength || 0}`;

    // Daily counters
    document.getElementById('pop-cnt-conn').textContent = counters.connections || 0;
    document.getElementById('pop-cnt-msg').textContent = counters.messages || 0;
    document.getElementById('pop-cnt-vis').textContent = counters.visits || 0;
    document.getElementById('pop-cnt-email').textContent = counters.emails || 0;

    // Buttons
    document.getElementById('pop-btn-save').addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_PROFILE' }, async (profile) => {
            if (profile && profile.name) {
              await msg('SAVE_LEAD', profile);
              document.getElementById('pop-btn-save').textContent = '✅ Saved!';
              setTimeout(() => { document.getElementById('pop-btn-save').textContent = '💾 Quick Save Lead'; }, 2000);
            }
          });
        }
      } catch (e) { /* not on LinkedIn */ }
    });

    document.getElementById('pop-btn-sidebar').addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        chrome.runtime.sendMessage({ type: 'OPEN_SIDEBAR' });
        window.close();
      }
    });
  }

  function msg(type, data) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ type, data }, response => {
        if (chrome.runtime.lastError) { resolve(null); return; }
        resolve(response);
      });
    });
  }
})();
