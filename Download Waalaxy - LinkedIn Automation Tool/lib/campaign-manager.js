/**
 * Waalaxy LinkedIn Automation Tool — Campaign Manager
 * Campaign lifecycle: Draft → Active → Paused → Completed.
 * CSV import, analytics, lead management within campaigns.
 */

const CampaignManager = {
  // ─── Campaign CRUD ────────────────────────────

  async getCampaigns() {
    return new Promise(resolve => {
      chrome.storage.local.get('wx_campaigns', r => resolve(r.wx_campaigns || []));
    });
  },

  async getCampaign(id) {
    const campaigns = await this.getCampaigns();
    return campaigns.find(c => c.id === id) || null;
  },

  async createCampaign(data) {
    const campaigns = await this.getCampaigns();

    const campaign = {
      id: `camp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: data.name || 'Untitled Campaign',
      description: data.description || '',
      status: 'draft',
      sequence: data.sequence || null,
      leads: data.leads || [],
      stats: {
        sent: 0, accepted: 0, replied: 0, bounced: 0, emailsSent: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null
    };

    campaigns.unshift(campaign);
    await this._saveCampaigns(campaigns);
    return campaign;
  },

  async updateCampaign(id, updates) {
    const campaigns = await this.getCampaigns();
    const idx = campaigns.findIndex(c => c.id === id);
    if (idx >= 0) {
      campaigns[idx] = { ...campaigns[idx], ...updates, updatedAt: new Date().toISOString() };
      await this._saveCampaigns(campaigns);
      return campaigns[idx];
    }
    return null;
  },

  async deleteCampaign(id) {
    let campaigns = await this.getCampaigns();
    campaigns = campaigns.filter(c => c.id !== id);
    await this._saveCampaigns(campaigns);
    return { success: true };
  },

  // ─── Campaign Lifecycle ───────────────────────

  async startCampaign(id) {
    const campaign = await this.getCampaign(id);
    if (!campaign) throw new Error('Campaign not found');
    if (!campaign.sequence) throw new Error('No sequence assigned');
    if (!campaign.leads || campaign.leads.length === 0) throw new Error('No leads in campaign');

    campaign.status = 'active';
    campaign.startedAt = new Date().toISOString();

    // Initialize sequence for each lead
    for (const lead of campaign.leads) {
      if (typeof SequenceRunner !== 'undefined') {
        SequenceRunner.addLeadToSequence(campaign.sequence, lead);
      }
    }

    await this.updateCampaign(id, campaign);
    return campaign;
  },

  async pauseCampaign(id) {
    return this.updateCampaign(id, { status: 'paused' });
  },

  async resumeCampaign(id) {
    return this.updateCampaign(id, { status: 'active' });
  },

  async completeCampaign(id) {
    return this.updateCampaign(id, {
      status: 'completed',
      completedAt: new Date().toISOString()
    });
  },

  // ─── Lead Management ─────────────────────────

  async addLeadsToCampaign(campaignId, newLeads) {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) return null;

    const existingUrls = new Set(campaign.leads.map(l => l.linkedinUrl));
    const toAdd = newLeads.filter(l => !existingUrls.has(l.linkedinUrl));

    campaign.leads = [...campaign.leads, ...toAdd];
    await this.updateCampaign(campaignId, { leads: campaign.leads });

    return { added: toAdd.length, total: campaign.leads.length };
  },

  async removeLeadFromCampaign(campaignId, leadId) {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) return null;

    campaign.leads = campaign.leads.filter(l => l.id !== leadId);
    await this.updateCampaign(campaignId, { leads: campaign.leads });

    return { success: true };
  },

  // ─── CSV Import ──────────────────────────────

  async importCSVLeads(csvText) {
    const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
    const results = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].match(/(".*?"|[^,]+)/g) || [];
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = (values[idx] || '').replace(/^"|"$/g, '').trim();
      });

      // Map to lead format
      const lead = {
        id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: obj['name'] || obj['full name'] || `${obj['first name'] || ''} ${obj['last name'] || ''}`.trim(),
        firstName: obj['first name'] || obj['firstname'] || '',
        lastName: obj['last name'] || obj['lastname'] || '',
        title: obj['title'] || obj['job title'] || obj['position'] || '',
        company: obj['company'] || obj['organization'] || '',
        email: obj['email'] || obj['e-mail'] || '',
        phone: obj['phone'] || obj['telephone'] || '',
        linkedinUrl: obj['linkedin'] || obj['linkedin url'] || obj['profile url'] || '',
        location: obj['location'] || obj['city'] || '',
        status: 'new',
        source: 'csv',
        savedAt: new Date().toISOString()
      };

      if (!lead.firstName && lead.name) {
        const parts = lead.name.split(' ');
        lead.firstName = parts[0] || '';
        lead.lastName = parts.slice(1).join(' ') || '';
      }

      if (lead.name || lead.email || lead.linkedinUrl) {
        results.push(lead);
      }
    }

    return results;
  },

  // ─── Stats ────────────────────────────────────

  async updateCampaignStats(campaignId) {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign || !campaign.sequence) return;

    const leads = Object.values(campaign.sequence.leads || {});
    const stats = {
      sent: leads.filter(l => l.currentStep > 0).length,
      accepted: leads.filter(l => l.completedSteps?.includes(2)).length,
      replied: leads.filter(l => l.status === 'replied').length,
      completed: leads.filter(l => l.status === 'completed').length,
      active: leads.filter(l => l.status === 'active').length,
      emailsSent: leads.filter(l => l.completedSteps?.some(s => campaign.sequence.steps[s]?.type === 'email')).length,
      total: leads.length,
      responseRate: leads.length > 0
        ? Math.round((leads.filter(l => l.status === 'replied' || l.status === 'completed').length / leads.length) * 100)
        : 0
    };

    await this.updateCampaign(campaignId, { stats });
    return stats;
  },

  // ─── Storage ─────────────────────────────────

  async _saveCampaigns(campaigns) {
    return new Promise(resolve => {
      chrome.storage.local.set({ wx_campaigns: campaigns }, resolve);
    });
  }
};

if (typeof self !== 'undefined') self.CampaignManager = CampaignManager;
