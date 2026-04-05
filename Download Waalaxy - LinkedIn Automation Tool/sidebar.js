/**
 * Waalaxy LinkedIn Automation Tool — Sidebar Controller
 * Full controller logic for all 6 tabs: Dashboard, Campaigns, Pipeline,
 * Contacts, Outreach, and Email Composer.
 */

(function () {
  'use strict';

  let currentProfile = null;
  let currentJob = null;
  let currentContacts = null;
  let settings = {};
  let leads = [];
  let selectedSequenceId = null;
  let wizardLeads = [];
  let selectedEmailTemplate = null;
  let selectedOutreachType = 'linkedin_message';
  let selectedTone = 'professional';
  let selectedEmailTone = 'professional';

  // ═══════════════════════════════════════════════
  //  INIT
  // ═══════════════════════════════════════════════

  document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    await loadPageData();
    initTabs();
    initDashboard();
    initCampaigns();
    initPipeline();
    initContacts();
    initOutreach();
    initEmail();
    initSettingsPanel();
  });

  async function loadSettings() {
    settings = await msg('GET_SETTINGS') || {};
  }

  async function loadPageData() {
    try {
      const data = await msg('GET_PAGE_DATA');
      if (data) {
        currentProfile = data.profile;
        currentJob = data.job;
        currentContacts = data.contacts;
        updateProfileCard();
      }
    } catch (e) { /* tab not ready */ }
  }

  // ═══════════════════════════════════════════════
  //  TAB NAVIGATION
  // ═══════════════════════════════════════════════

  function initTabs() {
    document.querySelectorAll('.wx-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.wx-tab').forEach(t => t.classList.remove('wx-tab-active'));
        document.querySelectorAll('.wx-panel').forEach(p => p.classList.remove('wx-panel-active'));
        tab.classList.add('wx-tab-active');
        const panelId = `panel-${tab.dataset.tab}`;
        document.getElementById(panelId)?.classList.add('wx-panel-active');

        // Refresh tab data
        if (tab.dataset.tab === 'dashboard') refreshDashboard();
        if (tab.dataset.tab === 'campaigns') refreshCampaigns();
        if (tab.dataset.tab === 'pipeline') refreshPipeline();
        if (tab.dataset.tab === 'contacts') refreshContacts();
        if (tab.dataset.tab === 'email') refreshEmailTab();
      });
    });

    // Top bar buttons
    document.getElementById('btn-settings').addEventListener('click', () => {
      document.getElementById('settings-overlay').style.display = 'block';
    });

    document.getElementById('btn-refresh').addEventListener('click', async () => {
      await loadPageData();
      refreshDashboard();
    });
  }

  // ═══════════════════════════════════════════════
  //  DASHBOARD
  // ═══════════════════════════════════════════════

  function initDashboard() {
    // Profile card actions
    document.getElementById('btn-save-lead')?.addEventListener('click', async () => {
      if (!currentProfile) return;
      await msg('SAVE_LEAD', currentProfile);
      showToast('Lead saved!', 'success');
      refreshDashboard();
    });

    document.getElementById('btn-draft-msg')?.addEventListener('click', () => {
      document.querySelector('[data-tab="outreach"]').click();
    });

    // Automation controls
    document.getElementById('btn-auto-start')?.addEventListener('click', async () => {
      await msg('START_AUTOMATION');
      refreshAutoStatus();
    });

    document.getElementById('btn-auto-pause')?.addEventListener('click', async () => {
      await msg('PAUSE_AUTOMATION');
      refreshAutoStatus();
    });

    document.getElementById('btn-auto-stop')?.addEventListener('click', async () => {
      await msg('STOP_AUTOMATION');
      refreshAutoStatus();
    });

    refreshDashboard();
  }

  async function refreshDashboard() {
    // Stats
    const allLeads = await msg('GET_LEADS') || [];
    leads = allLeads;
    const campaigns = await msg('GET_CAMPAIGNS') || [];
    const activeCampaigns = campaigns.filter(c => c.status === 'active');

    document.getElementById('stat-leads').textContent = allLeads.length;
    document.getElementById('stat-campaigns').textContent = activeCampaigns.length;

    // Calculate messages sent and response rate
    let totalSent = 0, totalReplied = 0;
    campaigns.forEach(c => {
      totalSent += c.stats?.sent || 0;
      totalReplied += c.stats?.replied || 0;
    });

    document.getElementById('stat-sent').textContent = totalSent;
    document.getElementById('stat-response').textContent = totalSent > 0
      ? Math.round((totalReplied / totalSent) * 100) + '%' : '0%';

    // Daily counters
    const counters = await msg('GET_DAILY_COUNTERS') || {};
    document.getElementById('cnt-connections').textContent = counters.connections || 0;
    document.getElementById('cnt-messages').textContent = counters.messages || 0;
    document.getElementById('cnt-visits').textContent = counters.visits || 0;
    document.getElementById('cnt-emails').textContent = counters.emails || 0;

    // Automation status
    refreshAutoStatus();

    // Activity feed
    const activities = await msg('GET_RECENT_ACTIVITIES', { limit: 10 }) || [];
    const feed = document.getElementById('activity-feed');
    if (activities.length === 0) {
      feed.innerHTML = '<div class="wx-empty-state">No recent activity</div>';
    } else {
      feed.innerHTML = activities.map(a => {
        const icons = { stage_change: '📋', note_added: '📝', connect: '🤝', message: '💬', visit: '👁', email: '📧' };
        return `<div class="wx-activity-item">
          <span class="wx-activity-icon">${icons[a.type] || '⚡'}</span>
          <span class="wx-activity-text">${esc(a.detail || a.type)}</span>
          <span class="wx-activity-time">${timeAgo(a.timestamp)}</span>
        </div>`;
      }).join('');
    }
  }

  function refreshAutoStatus() {
    msg('GET_AUTO_STATUS').then(status => {
      if (!status) return;
      const dot = document.getElementById('auto-dot');
      const text = document.getElementById('auto-text');
      const queue = document.getElementById('auto-queue');

      dot.className = 'wx-auto-dot';
      if (status.running && !status.paused) { dot.classList.add('running'); text.textContent = 'Running'; }
      else if (status.paused) { dot.classList.add('paused'); text.textContent = 'Paused'; }
      else { text.textContent = 'Idle'; }

      queue.textContent = `Queue: ${status.queueLength || 0}`;
    });
  }

  function updateProfileCard() {
    const card = document.getElementById('profile-card');
    if (!currentProfile || !currentProfile.name) { card.style.display = 'none'; return; }

    card.style.display = 'block';
    document.getElementById('pc-name').textContent = currentProfile.name;
    document.getElementById('pc-title').textContent = currentProfile.title || '';
    document.getElementById('pc-company').textContent = currentProfile.company || '';

    const avatar = document.getElementById('pc-avatar');
    if (currentProfile.profileImage) { avatar.src = currentProfile.profileImage; avatar.style.display = 'block'; }
    else { avatar.style.display = 'none'; }

    // Badges
    const badges = document.getElementById('pc-badges');
    let badgesHtml = '';
    const emailCount = (currentProfile.foundEmails || []).length;
    const phoneCount = (currentProfile.foundPhones || []).length;
    if (emailCount > 0) badgesHtml += `<span class="wx-pc-badge wx-pc-badge-email">📧 ${emailCount} emails</span>`;
    if (phoneCount > 0) badgesHtml += `<span class="wx-pc-badge wx-pc-badge-phone">📞 ${phoneCount} phones</span>`;
    if (currentProfile.connectionDegree) badgesHtml += `<span class="wx-pc-badge wx-pc-badge-degree">${currentProfile.connectionDegree}</span>`;
    badges.innerHTML = badgesHtml;
  }

  // ═══════════════════════════════════════════════
  //  CAMPAIGNS
  // ═══════════════════════════════════════════════

  function initCampaigns() {
    document.getElementById('btn-new-campaign').addEventListener('click', showWizard);
    document.getElementById('wizard-next-1')?.addEventListener('click', () => wizardGoTo(2));
    document.getElementById('wizard-next-2')?.addEventListener('click', () => wizardGoTo(3));
    document.getElementById('wizard-back-2')?.addEventListener('click', () => wizardGoTo(1));
    document.getElementById('wizard-back-3')?.addEventListener('click', () => wizardGoTo(2));

    document.getElementById('wizard-import-csv')?.addEventListener('click', () => {
      document.getElementById('csv-file-input').click();
    });

    document.getElementById('csv-file-input')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      const imported = await msg('IMPORT_CSV_LEADS', { csv: text });
      wizardLeads = imported || [];
      document.getElementById('wizard-lead-count').style.display = 'block';
      document.getElementById('wizard-leads-num').textContent = wizardLeads.length;
    });

    document.getElementById('wizard-import-saved')?.addEventListener('click', async () => {
      wizardLeads = await msg('GET_LEADS') || [];
      document.getElementById('wizard-lead-count').style.display = 'block';
      document.getElementById('wizard-leads-num').textContent = wizardLeads.length;
    });

    document.getElementById('wizard-launch')?.addEventListener('click', launchCampaign);

    refreshCampaigns();
  }

  function showWizard() {
    const wizard = document.getElementById('campaign-wizard');
    wizard.style.display = 'block';
    wizardGoTo(1);
    loadSequenceTemplates();
  }

  function wizardGoTo(step) {
    document.querySelectorAll('.wx-wizard-step').forEach(s => {
      s.classList.remove('wx-ws-active', 'wx-ws-done');
      if (parseInt(s.dataset.step) < step) s.classList.add('wx-ws-done');
      if (parseInt(s.dataset.step) === step) s.classList.add('wx-ws-active');
    });
    document.querySelectorAll('.wx-wizard-panel').forEach(p => p.classList.remove('wx-wp-active'));
    document.getElementById(`wizard-step-${step}`)?.classList.add('wx-wp-active');
  }

  async function loadSequenceTemplates() {
    const templates = await msg('GET_SEQUENCE_TEMPLATES') || [];
    const grid = document.getElementById('sequence-grid');
    grid.innerHTML = templates.map(t => `
      <div class="wx-seq-card ${selectedSequenceId === t.id ? 'selected' : ''}" data-id="${t.id}">
        <span class="wx-seq-icon">${t.icon}</span>
        <div class="wx-seq-info">
          <div class="wx-seq-name">${esc(t.name)}</div>
          <div class="wx-seq-desc">${esc(t.description)}</div>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.wx-seq-card').forEach(card => {
      card.addEventListener('click', () => {
        grid.querySelectorAll('.wx-seq-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedSequenceId = card.dataset.id;
      });
    });
  }

  async function launchCampaign() {
    const name = document.getElementById('wizard-name').value.trim();
    if (!name) { showToast('Please enter a campaign name', 'warning'); return; }
    if (!selectedSequenceId) { showToast('Please select a sequence', 'warning'); return; }
    if (wizardLeads.length === 0) { showToast('Please add leads', 'warning'); return; }

    // Create the sequence from template
    const templates = await msg('GET_SEQUENCE_TEMPLATES') || [];
    const seqTemplate = templates.find(t => t.id === selectedSequenceId);
    const sequence = {
      id: `seq_${Date.now()}`,
      templateId: seqTemplate.id,
      name: seqTemplate.name,
      steps: seqTemplate.steps,
      leads: {}
    };

    const campaign = await msg('CREATE_CAMPAIGN', {
      name,
      description: document.getElementById('wizard-desc').value.trim(),
      sequence,
      leads: wizardLeads
    });

    if (campaign) {
      await msg('START_CAMPAIGN', { id: campaign.id });
      showToast('Campaign launched! 🚀', 'success');
      document.getElementById('campaign-wizard').style.display = 'none';
      selectedSequenceId = null;
      wizardLeads = [];
      refreshCampaigns();
    }
  }

  async function refreshCampaigns() {
    const campaigns = await msg('GET_CAMPAIGNS') || [];
    const list = document.getElementById('campaign-list');

    if (campaigns.length === 0) {
      list.innerHTML = '<div class="wx-empty-state">No campaigns yet. Create your first!</div>';
      return;
    }

    list.innerHTML = campaigns.map(c => {
      const total = c.leads?.length || 0;
      const sent = c.stats?.sent || 0;
      const progress = total > 0 ? Math.round((sent / total) * 100) : 0;
      const statusClass = `wx-cc-status-${c.status}`;

      return `<div class="wx-campaign-card" data-id="${c.id}">
        <div class="wx-cc-header">
          <span class="wx-cc-name">${esc(c.name)}</span>
          <span class="wx-cc-status ${statusClass}">${c.status}</span>
        </div>
        <div class="wx-cc-stats">
          <span>👥 ${total} leads</span>
          <span>📤 ${sent} sent</span>
          <span>📊 ${c.stats?.responseRate || 0}% rate</span>
        </div>
        <div class="wx-cc-progress"><div class="wx-cc-progress-bar" style="width:${progress}%"></div></div>
        <div class="wx-cc-actions">
          ${c.status === 'active' ? `<button class="wx-btn wx-btn-xs wx-btn-ghost" onclick="pauseCampaign('${c.id}')">⏸</button>` : ''}
          ${c.status === 'paused' ? `<button class="wx-btn wx-btn-xs wx-btn-primary" onclick="resumeCampaign('${c.id}')">▶</button>` : ''}
          ${c.status === 'draft' ? `<button class="wx-btn wx-btn-xs wx-btn-primary" onclick="startCampaign('${c.id}')">🚀</button>` : ''}
          <button class="wx-btn wx-btn-xs wx-btn-danger" onclick="deleteCampaign('${c.id}')">🗑</button>
        </div>
      </div>`;
    }).join('');
  }

  // Campaign actions (globally accessible)
  window.pauseCampaign = async (id) => { await msg('PAUSE_CAMPAIGN', { id }); refreshCampaigns(); };
  window.resumeCampaign = async (id) => { await msg('RESUME_CAMPAIGN', { id }); refreshCampaigns(); };
  window.startCampaign = async (id) => { await msg('START_CAMPAIGN', { id }); refreshCampaigns(); };
  window.deleteCampaign = async (id) => { await msg('DELETE_CAMPAIGN', { id }); refreshCampaigns(); };

  // ═══════════════════════════════════════════════
  //  PIPELINE
  // ═══════════════════════════════════════════════

  function initPipeline() {
    refreshPipeline();
  }

  async function refreshPipeline() {
    const overview = await msg('GET_PIPELINE_OVERVIEW') || [];
    const container = document.getElementById('pipeline-container');

    if (overview.length === 0) {
      container.innerHTML = '<div class="wx-empty-state">Pipeline loading...</div>';
      return;
    }

    container.innerHTML = overview.map(stage => `
      <div class="wx-pipeline-stage" data-stage="${stage.id}">
        <div class="wx-ps-header" onclick="this.parentElement.classList.toggle('wx-ps-expanded')">
          <div class="wx-ps-left">
            <span class="wx-ps-icon">${stage.icon}</span>
            <span class="wx-ps-name">${stage.name}</span>
            <span class="wx-ps-count">${stage.count}</span>
          </div>
          <span style="color:var(--text-muted);font-size:10px">▼</span>
        </div>
        <div class="wx-ps-body">
          ${stage.leads.length === 0
            ? '<div class="wx-empty-state" style="padding:8px">No leads in this stage</div>'
            : stage.leads.map(l => `
              <div class="wx-ps-lead">
                <span class="wx-ps-lead-name">${esc(l.name || 'Unknown')}</span>
                <span class="wx-ps-lead-company">${esc(l.company || '')}</span>
              </div>
            `).join('')}
        </div>
      </div>
    `).join('');
  }

  // ═══════════════════════════════════════════════
  //  CONTACTS
  // ═══════════════════════════════════════════════

  function initContacts() {
    document.getElementById('contact-search')?.addEventListener('input', (e) => {
      renderContacts(e.target.value);
    });

    document.querySelectorAll('#contact-filters .wx-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#contact-filters .wx-chip').forEach(c => c.classList.remove('wx-chip-active'));
        chip.classList.add('wx-chip-active');
        renderContacts(document.getElementById('contact-search').value, chip.dataset.filter);
      });
    });

    document.getElementById('btn-export-csv')?.addEventListener('click', async () => {
      const result = await msg('EXPORT_CSV');
      if (result?.csv) {
        const blob = new Blob([result.csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `waalaxy_contacts_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('CSV exported!', 'success');
      }
    });

    refreshContacts();
  }

  async function refreshContacts() {
    leads = await msg('GET_LEADS') || [];
    renderContacts();
  }

  function renderContacts(search = '', filter = 'all') {
    let filtered = leads;

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(l =>
        (l.name || '').toLowerCase().includes(q) ||
        (l.company || '').toLowerCase().includes(q) ||
        (l.title || '').toLowerCase().includes(q)
      );
    }

    if (filter !== 'all') {
      filtered = filtered.filter(l => l.status === filter);
    }

    const list = document.getElementById('contact-list');
    if (filtered.length === 0) {
      list.innerHTML = '<div class="wx-empty-state">No contacts found</div>';
      return;
    }

    list.innerHTML = filtered.map(l => {
      const initial = (l.name || '?').charAt(0).toUpperCase();
      const hasEmail = (l.foundEmails || l.emails || []).length > 0;
      const hasPhone = (l.foundPhones || l.phones || []).length > 0;

      return `<div class="wx-contact-item" data-id="${l.id}">
        ${l.profileImage
          ? `<img class="wx-ci-avatar" src="${l.profileImage}" alt="">`
          : `<div class="wx-ci-avatar-placeholder">${initial}</div>`}
        <div class="wx-ci-info">
          <div class="wx-ci-name">${esc(l.name || 'Unknown')}</div>
          <div class="wx-ci-title">${esc(l.title || '')}${l.company ? ` · ${esc(l.company)}` : ''}</div>
          <div class="wx-ci-meta">
            ${hasEmail ? '<span class="wx-ci-badge wx-ci-badge-has-email">📧 Email</span>' : ''}
            ${hasPhone ? '<span class="wx-ci-badge wx-ci-badge-has-phone">📞 Phone</span>' : ''}
          </div>
        </div>
        <div class="wx-ci-actions">
          <button class="wx-btn wx-btn-xs wx-btn-ghost" onclick="event.stopPropagation(); deleteLead('${l.id}')" title="Delete">🗑</button>
        </div>
      </div>`;
    }).join('');
  }

  window.deleteLead = async (id) => {
    await msg('DELETE_LEAD', { id });
    refreshContacts();
    showToast('Contact removed', 'info');
  };

  // ═══════════════════════════════════════════════
  //  OUTREACH (LinkedIn Messages)
  // ═══════════════════════════════════════════════

  function initOutreach() {
    // Type selection
    document.querySelectorAll('.wx-ot-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.wx-ot-btn').forEach(b => b.classList.remove('wx-ot-active'));
        btn.classList.add('wx-ot-active');
        selectedOutreachType = btn.dataset.type;
      });
    });

    // Tone selection (outreach panel)
    document.querySelectorAll('#panel-outreach .wx-tone-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#panel-outreach .wx-tone-btn').forEach(b => b.classList.remove('wx-tone-active'));
        btn.classList.add('wx-tone-active');
        selectedTone = btn.dataset.tone;
      });
    });

    // Generate
    document.getElementById('btn-generate-msg')?.addEventListener('click', generateOutreach);
    document.getElementById('btn-regenerate')?.addEventListener('click', generateOutreach);

    // Copy
    document.getElementById('btn-copy-msg')?.addEventListener('click', () => {
      const text = document.getElementById('msg-preview').textContent;
      navigator.clipboard.writeText(text);
      showToast('Message copied!', 'success');
    });

    // Save template
    document.getElementById('btn-save-template')?.addEventListener('click', async () => {
      const message = document.getElementById('msg-preview').textContent;
      await msg('SAVE_TEMPLATE', {
        name: `Template ${Date.now()}`,
        body: message,
        type: selectedOutreachType
      });
      showToast('Template saved!', 'success');
    });
  }

  async function generateOutreach() {
    const customPrompt = document.getElementById('outreach-custom').value.trim();

    const variables = buildVariables();

    const result = await msg('AI_DRAFT_EMAIL', {
      variables,
      settings,
      customPrompt,
      tone: selectedTone,
      type: selectedOutreachType
    });

    if (result) {
      document.getElementById('outreach-result').style.display = 'block';
      document.getElementById('msg-preview').textContent = result.message || '';
      document.getElementById('msg-meta').textContent =
        `Source: ${result.source || 'template'} ${result.model ? `· Model: ${result.model}` : ''}${result.error ? ` · ⚠️ ${result.error}` : ''}`;
    }
  }

  // ═══════════════════════════════════════════════
  //  EMAIL COMPOSER
  // ═══════════════════════════════════════════════

  function initEmail() {
    // Tone selection
    document.querySelectorAll('.wx-email-tone').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.wx-email-tone').forEach(b => b.classList.remove('wx-tone-active'));
        btn.classList.add('wx-tone-active');
        selectedEmailTone = btn.dataset.tone;
      });
    });

    // Generate email
    document.getElementById('btn-generate-email')?.addEventListener('click', generateEmail);
    document.getElementById('btn-regenerate-email')?.addEventListener('click', generateEmail);

    // Copy email
    document.getElementById('btn-copy-email')?.addEventListener('click', () => {
      const subject = document.getElementById('email-subject').value;
      const body = document.getElementById('email-body').textContent;
      const to = document.getElementById('email-to').value;
      navigator.clipboard.writeText(`To: ${to}\nSubject: ${subject}\n\n${body}`);
      showToast('Email draft copied!', 'success');
    });

    // Send buttons
    document.querySelectorAll('.wx-send-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const service = btn.dataset.service;
        const to = document.getElementById('email-to').value;
        const subject = document.getElementById('email-subject').value;
        const body = document.getElementById('email-body').textContent;

        // Compose via content script (needs window.open from page context)
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: 'COMPOSE_EMAIL',
              data: { service, to, subject, body }
            });
          }
        });

        showToast(`Opening ${service}...`, 'info');
      });
    });

    // Email type select (discovered emails)
    document.getElementById('email-type-select')?.addEventListener('change', (e) => {
      if (e.target.value) {
        document.getElementById('email-to').value = e.target.value;
      }
    });

    loadEmailTemplates();
  }

  async function loadEmailTemplates() {
    const templates = await msg('GET_EMAIL_TEMPLATES') || [];
    const categories = await msg('GET_TEMPLATE_CATEGORIES') || [];

    // Categories
    const catContainer = document.getElementById('email-template-categories');
    catContainer.innerHTML = [
      { id: null, name: 'All', icon: '📄' },
      ...categories
    ].map(c => `
      <button class="wx-chip ${c.id === null ? 'wx-chip-active' : ''}" data-cat="${c.id || 'all'}">${c.icon} ${c.name}</button>
    `).join('');

    catContainer.querySelectorAll('.wx-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        catContainer.querySelectorAll('.wx-chip').forEach(c => c.classList.remove('wx-chip-active'));
        chip.classList.add('wx-chip-active');
        renderEmailTemplates(templates, chip.dataset.cat === 'all' ? null : chip.dataset.cat);
      });
    });

    renderEmailTemplates(templates);
  }

  function renderEmailTemplates(templates, category = null) {
    const filtered = category ? templates.filter(t => t.category === category) : templates;
    const list = document.getElementById('email-template-list');

    list.innerHTML = filtered.map(t => `
      <div class="wx-template-item ${selectedEmailTemplate === t.id ? 'selected' : ''}" data-id="${t.id}">
        <span class="wx-ti-icon">${t.icon}</span>
        <span class="wx-ti-name">${esc(t.name)}</span>
      </div>
    `).join('');

    list.querySelectorAll('.wx-template-item').forEach(item => {
      item.addEventListener('click', () => {
        list.querySelectorAll('.wx-template-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        selectedEmailTemplate = item.dataset.id;
      });
    });
  }

  function refreshEmailTab() {
    // Populate discovered emails in the select dropdown
    const select = document.getElementById('email-type-select');
    select.innerHTML = '<option value="">Select discovered email...</option>';

    const emails = currentProfile?.foundEmails || currentContacts?.emails || [];
    emails.forEach(e => {
      const email = typeof e === 'string' ? e : e.email;
      const conf = e.confidence || '?';
      const type = e.type || '';
      select.innerHTML += `<option value="${esc(email)}">${esc(email)} (${conf}% ${type})</option>`;
    });

    // Recipient card
    const card = document.getElementById('email-recipient-card');
    if (currentProfile?.name || currentJob?.recruiter) {
      card.style.display = 'block';
      const isRecruiter = currentJob?.recruiter;
      document.getElementById('er-name').textContent = isRecruiter ? currentJob.recruiter.name : currentProfile?.name || '';
      document.getElementById('er-detail').textContent = isRecruiter
        ? `${currentJob.recruiter.title || ''} · Re: ${currentJob.jobTitle || ''}`
        : `${currentProfile?.title || ''} · ${currentProfile?.company || ''}`;
    } else {
      card.style.display = 'none';
    }
  }

  async function generateEmail() {
    const customPrompt = document.getElementById('email-custom-prompt').value.trim();
    const variables = buildVariables();

    // Generate body
    const bodyResult = await msg('AI_DRAFT_EMAIL', {
      templateId: selectedEmailTemplate,
      variables,
      settings,
      customPrompt,
      tone: selectedEmailTone,
      type: 'email'
    });

    // Generate subject
    const subjectResult = await msg('AI_DRAFT_SUBJECT', {
      variables,
      settings,
      tone: selectedEmailTone
    });

    if (bodyResult) {
      document.getElementById('email-preview-section').style.display = 'block';
      document.getElementById('email-body').textContent = bodyResult.message || '';
      document.getElementById('email-subject').value = (subjectResult?.message || bodyResult.subject || '').replace(/^["']|["']$/g, '');
    }
  }

  // ═══════════════════════════════════════════════
  //  SETTINGS
  // ═══════════════════════════════════════════════

  function initSettingsPanel() {
    document.getElementById('btn-close-settings')?.addEventListener('click', () => {
      document.getElementById('settings-overlay').style.display = 'none';
    });

    // Load settings into fields
    populateSettings();

    // Range sliders
    ['set-max-connections', 'set-max-messages', 'set-max-visits'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          const lblId = id.replace('set-max-', 'lbl-');
          document.getElementById(lblId).textContent = el.value;
        });
      }
    });

    document.getElementById('set-delay-min')?.addEventListener('input', updateDelayLabel);
    document.getElementById('set-delay-max')?.addEventListener('input', updateDelayLabel);

    // Save
    document.getElementById('btn-save-settings')?.addEventListener('click', saveSettings);
  }

  function updateDelayLabel() {
    const min = document.getElementById('set-delay-min').value;
    const max = document.getElementById('set-delay-max').value;
    document.getElementById('lbl-delay').textContent = `${min}-${max}`;
  }

  function populateSettings() {
    document.getElementById('set-name').value = settings.userName || '';
    document.getElementById('set-title').value = settings.userTitle || '';
    document.getElementById('set-company').value = settings.userCompany || '';
    document.getElementById('set-email').value = settings.userEmail || '';
    document.getElementById('set-phone').value = settings.userPhone || '';
    document.getElementById('set-linkedin').value = settings.userLinkedIn || '';
    document.getElementById('set-api-key').value = settings.openaiApiKey || '';
    document.getElementById('set-model').value = settings.aiModel || 'gpt-4o-mini';
    document.getElementById('set-tone').value = settings.defaultTone || 'professional';
    document.getElementById('set-email-service').value = settings.defaultEmailService || 'gmail';
    document.getElementById('set-max-connections').value = settings.maxDailyConnections || 80;
    document.getElementById('set-max-messages').value = settings.maxDailyMessages || 120;
    document.getElementById('set-max-visits').value = settings.maxDailyVisits || 150;
    document.getElementById('set-delay-min').value = settings.delayMin || 3;
    document.getElementById('set-delay-max').value = settings.delayMax || 8;

    document.getElementById('lbl-connections').textContent = settings.maxDailyConnections || 80;
    document.getElementById('lbl-messages').textContent = settings.maxDailyMessages || 120;
    document.getElementById('lbl-visits').textContent = settings.maxDailyVisits || 150;
    updateDelayLabel();
  }

  async function saveSettings() {
    const updates = {
      userName: document.getElementById('set-name').value,
      userTitle: document.getElementById('set-title').value,
      userCompany: document.getElementById('set-company').value,
      userEmail: document.getElementById('set-email').value,
      userPhone: document.getElementById('set-phone').value,
      userLinkedIn: document.getElementById('set-linkedin').value,
      openaiApiKey: document.getElementById('set-api-key').value,
      aiModel: document.getElementById('set-model').value,
      defaultTone: document.getElementById('set-tone').value,
      defaultEmailService: document.getElementById('set-email-service').value,
      maxDailyConnections: parseInt(document.getElementById('set-max-connections').value),
      maxDailyMessages: parseInt(document.getElementById('set-max-messages').value),
      maxDailyVisits: parseInt(document.getElementById('set-max-visits').value),
      delayMin: parseInt(document.getElementById('set-delay-min').value),
      delayMax: parseInt(document.getElementById('set-delay-max').value)
    };

    settings = await msg('UPDATE_SETTINGS', updates);
    showToast('Settings saved!', 'success');
    document.getElementById('settings-overlay').style.display = 'none';
  }

  // ═══════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════

  function buildVariables() {
    const vars = {
      name: currentProfile?.name || currentJob?.recruiter?.name || '',
      firstName: currentProfile?.firstName || (currentJob?.recruiter?.name || '').split(' ')[0] || '',
      lastName: currentProfile?.lastName || '',
      title: currentProfile?.title || currentJob?.recruiter?.title || '',
      company: currentProfile?.company || currentJob?.company || '',
      about: currentProfile?.about || '',
      location: currentProfile?.location || currentJob?.location || '',
      linkedinUrl: currentProfile?.linkedinUrl || '',
      experience: currentProfile?.experience || [],
      education: currentProfile?.education || [],
      skills: currentProfile?.skills || [],
      jobTitle: currentJob?.jobTitle || '',
      jobDescription: currentJob?.description || '',
      userName: settings.userName || '',
      userTitle: settings.userTitle || '',
      userCompany: settings.userCompany || '',
      userEmail: settings.userEmail || '',
      userPhone: settings.userPhone || '',
      userLinkedIn: settings.userLinkedIn || '',
      mutualConnections: currentProfile?.mutualConnections || ''
    };
    return vars;
  }

  function msg(type, data) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ type, data }, response => {
        if (chrome.runtime.lastError) { resolve(null); return; }
        resolve(response);
      });
    });
  }

  function esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  }

  function showToast(message, type = 'info') {
    const existing = document.querySelector('.wx-sidebar-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `wx-sidebar-toast`;
    toast.style.cssText = `
      position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%) translateY(20px);
      padding: 8px 16px; background: ${type === 'success' ? '#059669' : type === 'warning' ? '#d97706' : type === 'error' ? '#dc2626' : '#4f46e5'};
      color: #fff; border-radius: 8px; font-size: 12px; font-weight: 600; z-index: 10000;
      opacity: 0; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

})();
