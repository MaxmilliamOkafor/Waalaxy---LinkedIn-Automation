/**
 * Waalaxy LinkedIn Automation Tool — Background Service Worker
 * Central hub: message routing, automation engine, AI drafting,
 * campaign management, CRM, alarms, and notifications.
 */

// ─── Import Modules ─────────────────────────────
importScripts(
  'lib/storage-manager.js',
  'lib/automation-engine.js',
  'lib/sequence-runner.js',
  'lib/crm-manager.js',
  'lib/campaign-manager.js',
  'lib/ai-email-engine.js',
  'lib/email-composer.js'
);

// ─── Side Panel Setup ──────────────────────────
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});

// ─── Install & Context Menus ───────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'wx-draft-outreach',
    title: '🚀 Draft Outreach Message',
    contexts: ['page'],
    documentUrlPatterns: ['https://*.linkedin.com/*']
  });

  chrome.contextMenus.create({
    id: 'wx-save-lead',
    title: '💾 Save as Lead',
    contexts: ['page'],
    documentUrlPatterns: ['https://*.linkedin.com/*']
  });

  chrome.contextMenus.create({
    id: 'wx-find-contacts',
    title: '📧 Find Contact Info',
    contexts: ['page'],
    documentUrlPatterns: ['https://*.linkedin.com/*']
  });

  // Initialize defaults
  chrome.storage.local.get('wx_settings', (result) => {
    if (!result.wx_settings) {
      chrome.storage.local.set({
        wx_settings: {
          openaiApiKey: '',
          aiModel: 'gpt-4o-mini',
          showBadge: true,
          autoExtract: true,
          defaultTone: 'professional',
          defaultEmailService: 'gmail',
          userName: '',
          userTitle: '',
          userCompany: '',
          userEmail: '',
          userPhone: '',
          userLinkedIn: '',
          theme: 'dark',
          maxDailyConnections: 999999,
          maxDailyMessages: 999999,
          maxDailyVisits: 999999,
          maxDailyFollows: 999999,
          maxDailyLikes: 999999,
          delayMin: 1,
          delayMax: 3,
          longPauseEvery: 999999,
          longPauseSeconds: 0
        }
      });
    }
  });

  CRMManager.init();
});

// ─── Alarms ────────────────────────────────────
chrome.alarms.create('wx-sequence-check', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'wx-sequence-check') {
    await processScheduledActions();
  }
});

async function processScheduledActions() {
  try {
    const campaigns = await CampaignManager.getCampaigns();
    const active = campaigns.filter(c => c.status === 'active');

    for (const campaign of active) {
      if (!campaign.sequence) continue;
      const actions = SequenceRunner.scheduleSequenceActions(campaign.sequence, campaign.id);
      if (actions.length > 0) {
        await AutomationEngine.enqueueBatch(actions);
        await CampaignManager.updateCampaign(campaign.id, campaign);
      }
    }
  } catch (e) {
    console.warn('[WX] Sequence check error:', e);
  }
}

// ─── Context Menu Handlers ─────────────────────
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'wx-draft-outreach') {
    openSidePanel(tab);
  } else if (info.menuItemId === 'wx-save-lead') {
    chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_PROFILE' }, (response) => {
      if (response && response.name) saveLead(response);
    });
  } else if (info.menuItemId === 'wx-find-contacts') {
    openSidePanel(tab);
  }
});

// ─── Extension Icon Click ──────────────────────
chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes('linkedin.com')) {
    openSidePanel(tab);
  }
});

// ─── Side Panel Opener ─────────────────────────
async function openSidePanel(tab) {
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
    await chrome.sidePanel.setOptions({
      tabId: tab.id,
      path: 'sidebar.html',
      enabled: true
    });
  } catch (e) {
    console.warn('[WX] Side panel error:', e);
  }
}

// ═══════════════════════════════════════════════════
//  MESSAGE ROUTER — 40+ message types
// ═══════════════════════════════════════════════════

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    // ─── Core ──────────────────────────
    case 'OPEN_SIDEBAR':
      if (sender.tab) openSidePanel(sender.tab);
      sendResponse({ ok: true });
      break;

    case 'PROFILE_DETECTED':
    case 'JOB_DETECTED':
      sendResponse({ ok: true });
      break;

    case 'GET_PAGE_DATA':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_PAGE_DATA' }, sendResponse);
        } else {
          sendResponse(null);
        }
      });
      return true;

    // ─── AI Drafting ───────────────────
    case 'AI_DRAFT':
      handleAIDraft(message.data).then(sendResponse);
      return true;

    case 'AI_DRAFT_EMAIL':
      AIEmailEngine.draftEmail(message.data).then(sendResponse);
      return true;

    case 'AI_DRAFT_SUBJECT':
      AIEmailEngine.draftSubjectLine(message.data).then(sendResponse);
      return true;

    case 'GET_EMAIL_TEMPLATES':
      sendResponse(AIEmailEngine.getTemplates(message.data?.category));
      break;

    case 'GET_TEMPLATE_CATEGORIES':
      sendResponse(AIEmailEngine.getCategories());
      break;

    // ─── Email Compose ─────────────────
    case 'COMPOSE_EMAIL':
      // Forward to active tab for email compose (needs window.open)
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'COMPOSE_EMAIL',
            data: message.data
          }, sendResponse);
        } else {
          sendResponse({ error: 'No active tab' });
        }
      });
      return true;

    // ─── Leads ─────────────────────────
    case 'SAVE_LEAD':
      saveLead(message.data).then(sendResponse);
      return true;

    case 'GET_LEADS':
      getLeads().then(sendResponse);
      return true;

    case 'DELETE_LEAD':
      deleteLead(message.data.id).then(sendResponse);
      return true;

    case 'UPDATE_LEAD':
      updateLead(message.data.id, message.data.updates).then(sendResponse);
      return true;

    // ─── Settings ──────────────────────
    case 'GET_SETTINGS':
      getSettings().then(sendResponse);
      return true;

    case 'UPDATE_SETTINGS':
      updateSettings(message.data).then(sendResponse);
      return true;

    // ─── Stats ─────────────────────────
    case 'GET_STATS':
      getStats().then(sendResponse);
      return true;

    case 'EXPORT_CSV':
      exportCSV().then(sendResponse);
      return true;

    case 'GET_TEMPLATES':
      getCustomTemplates().then(sendResponse);
      return true;

    case 'SAVE_TEMPLATE':
      saveCustomTemplate(message.data).then(sendResponse);
      return true;

    case 'SAVE_OUTREACH':
      saveOutreach(message.data).then(sendResponse);
      return true;

    // ─── Campaigns ─────────────────────
    case 'GET_CAMPAIGNS':
      CampaignManager.getCampaigns().then(sendResponse);
      return true;

    case 'CREATE_CAMPAIGN':
      CampaignManager.createCampaign(message.data).then(sendResponse);
      return true;

    case 'START_CAMPAIGN':
      CampaignManager.startCampaign(message.data.id).then(sendResponse).catch(e => {
        sendResponse({ error: e.message });
      });
      return true;

    case 'PAUSE_CAMPAIGN':
      CampaignManager.pauseCampaign(message.data.id).then(sendResponse);
      return true;

    case 'RESUME_CAMPAIGN':
      CampaignManager.resumeCampaign(message.data.id).then(sendResponse);
      return true;

    case 'DELETE_CAMPAIGN':
      CampaignManager.deleteCampaign(message.data.id).then(() => sendResponse({ ok: true }));
      return true;

    case 'IMPORT_CSV_LEADS':
      CampaignManager.importCSVLeads(message.data.csv).then(sendResponse);
      return true;

    case 'ADD_LEADS_TO_CAMPAIGN':
      CampaignManager.addLeadsToCampaign(message.data.campaignId, message.data.leads).then(sendResponse);
      return true;

    case 'GET_SEQUENCE_TEMPLATES':
      sendResponse(SequenceRunner.getTemplates());
      break;

    // ─── CRM ───────────────────────────
    case 'GET_PIPELINE_OVERVIEW':
      CRMManager.getPipelineOverview().then(sendResponse);
      return true;

    case 'MOVE_TO_STAGE':
      CRMManager.moveToStage(message.data.leadId, message.data.stageId).then(sendResponse);
      return true;

    case 'GET_LEAD_CRM_DATA':
      CRMManager.getLeadCRMData(message.data.leadId).then(sendResponse);
      return true;

    case 'ADD_NOTE':
      CRMManager.addNote(message.data.leadId, message.data.note).then(sendResponse);
      return true;

    case 'ADD_TAG':
      CRMManager.addTag(message.data.leadId, message.data.tag).then(sendResponse);
      return true;

    case 'REMOVE_TAG':
      CRMManager.removeTag(message.data.leadId, message.data.tag).then(sendResponse);
      return true;

    case 'GET_ALL_TAGS':
      CRMManager.getAllTags().then(sendResponse);
      return true;

    case 'GET_RECENT_ACTIVITIES':
      CRMManager.getRecentActivities(message.data?.limit || 50).then(sendResponse);
      return true;

    // ─── Automation ────────────────────
    case 'GET_AUTO_STATUS':
      sendResponse(AutomationEngine.getStatus());
      break;

    case 'START_AUTOMATION':
      AutomationEngine.start().then(() => sendResponse({ ok: true }));
      return true;

    case 'PAUSE_AUTOMATION':
      AutomationEngine.pause();
      sendResponse({ ok: true });
      break;

    case 'STOP_AUTOMATION':
      AutomationEngine.stop();
      sendResponse({ ok: true });
      break;

    case 'GET_DAILY_COUNTERS':
      sendResponse(AutomationEngine.getDailyCounters());
      break;

    case 'GET_AUTOMATION_LIMITS':
      AutomationEngine._getLimits().then(sendResponse);
      return true;

    case 'UPDATE_AUTOMATION_LIMITS':
      AutomationEngine.updateLimits(message.data).then(sendResponse);
      return true;

    default:
      break;
  }
});

// ─── Initialize Automation Engine ──────────────
AutomationEngine.init();

AutomationEngine.on('action_completed', async (action) => {
  if (action.sequenceId && action.campaignId) {
    try {
      const campaign = await CampaignManager.getCampaign(action.campaignId);
      if (campaign && campaign.sequence) {
        SequenceRunner.advanceLead(campaign.sequence, action.leadId);
        await CampaignManager.updateCampaign(action.campaignId, campaign);
        await CampaignManager.updateCampaignStats(action.campaignId);
      }
    } catch (e) {
      console.warn('[WX] Sequence advance error:', e);
    }
  }

  CRMManager.logAction(action.leadId, action.type, {
    campaignId: action.campaignId,
    sequenceId: action.sequenceId
  });
});

AutomationEngine.on('action_failed', (action) => {
  console.error('[WX] Action failed:', action.type, action.error);
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Action Failed',
    message: `${action.type} failed: ${action.error}`
  });
});

// ═══════════════════════════════════════════════════
//  AI DRAFTING (Legacy compatibility)
// ═══════════════════════════════════════════════════

async function handleAIDraft(data) {
  const settings = await getSettings();
  return AIEmailEngine.draftEmail({
    templateId: data.templateId,
    variables: data.variables,
    settings,
    customPrompt: data.templatePrompt,
    tone: settings.defaultTone || 'professional',
    type: data.type || 'linkedin_message'
  });
}

// ═══════════════════════════════════════════════════
//  STORAGE WRAPPERS
// ═══════════════════════════════════════════════════

async function getSettings() {
  return new Promise(resolve => {
    chrome.storage.local.get('wx_settings', r => resolve(r.wx_settings || {}));
  });
}

async function updateSettings(updates) {
  const current = await getSettings();
  const merged = { ...current, ...updates };
  return new Promise(resolve => {
    chrome.storage.local.set({ wx_settings: merged }, () => resolve(merged));
  });
}

async function getLeads() {
  return new Promise(resolve => {
    chrome.storage.local.get('wx_leads', r => resolve(r.wx_leads || []));
  });
}

async function saveLead(lead) {
  const leads = await getLeads();
  const existing = leads.findIndex(l => l.linkedinUrl === lead.linkedinUrl);
  const entry = {
    ...lead,
    id: lead.id || `lead_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    savedAt: lead.savedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: lead.status || 'new',
    notes: lead.notes || ''
  };

  if (existing >= 0) leads[existing] = { ...leads[existing], ...entry };
  else leads.unshift(entry);

  return new Promise(resolve => {
    chrome.storage.local.set({ wx_leads: leads }, () => {
      // Auto-add to CRM
      CRMManager.moveToStage(entry.id, entry.status === 'new' ? 'new' : 'contacted').catch(() => {});
      resolve(entry);
    });
  });
}

async function deleteLead(id) {
  let leads = await getLeads();
  leads = leads.filter(l => l.id !== id);
  return new Promise(resolve => {
    chrome.storage.local.set({ wx_leads: leads }, () => resolve({ ok: true }));
  });
}

async function updateLead(id, updates) {
  const leads = await getLeads();
  const idx = leads.findIndex(l => l.id === id);
  if (idx >= 0) {
    leads[idx] = { ...leads[idx], ...updates, updatedAt: new Date().toISOString() };
    return new Promise(resolve => {
      chrome.storage.local.set({ wx_leads: leads }, () => resolve(leads[idx]));
    });
  }
  return null;
}

async function getStats() {
  return new Promise(resolve => {
    chrome.storage.local.get('wx_stats', r => {
      resolve(r.wx_stats || {
        leadsSaved: 0, messagesDrafted: 0, emailsFound: 0,
        profilesViewed: 0, connectsSent: 0, emailsDrafted: 0, campaignsRun: 0
      });
    });
  });
}

async function getCustomTemplates() {
  return new Promise(resolve => {
    chrome.storage.local.get('wx_custom_templates', r => resolve(r.wx_custom_templates || []));
  });
}

async function saveCustomTemplate(template) {
  const templates = await getCustomTemplates();
  template.id = template.id || `tpl_${Date.now()}`;
  template.createdAt = template.createdAt || new Date().toISOString();
  const idx = templates.findIndex(t => t.id === template.id);
  if (idx >= 0) templates[idx] = template;
  else templates.push(template);
  return new Promise(resolve => {
    chrome.storage.local.set({ wx_custom_templates: templates }, () => resolve(template));
  });
}

async function saveOutreach(data) {
  return new Promise(resolve => {
    chrome.storage.local.get('wx_outreach_history', r => {
      const history = r.wx_outreach_history || [];
      history.unshift({ ...data, id: `out_${Date.now()}`, createdAt: new Date().toISOString() });
      if (history.length > 1000) history.length = 1000;
      chrome.storage.local.set({ wx_outreach_history: history }, () => resolve({ ok: true }));
    });
  });
}

async function exportCSV() {
  const leads = await getLeads();
  if (!leads.length) return { csv: '' };

  const headers = ['Name', 'Title', 'Company', 'Email', 'Phone', 'LinkedIn URL', 'Status', 'Notes', 'Saved At'];
  const rows = leads.map(l => [
    l.name || '', l.title || '', l.company || '',
    (l.foundEmails || l.emails || []).map(e => e.email || e).join('; '),
    (l.foundPhones || l.phones || []).map(p => p.phone || p).join('; '),
    l.linkedinUrl || '', l.status || '', (l.notes || '').replace(/"/g, '""'), l.savedAt || ''
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  return { csv };
}

// ─── Global Error Handler ──────────────────────
self.addEventListener('unhandledrejection', (e) => {
  console.warn('[WX] Unhandled rejection:', e.reason);
  e.preventDefault();
});
