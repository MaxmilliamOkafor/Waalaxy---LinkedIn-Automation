/**
 * Waalaxy LinkedIn Automation Tool — Sequence Runner
 * Multi-step campaign sequences with scheduling and pre-built templates.
 */

const SequenceRunner = {
  // ─── Pre-Built Sequence Templates ─────────────

  TEMPLATES: [
    {
      id: 'cold_outreach',
      name: 'Cold Outreach',
      icon: '🎯',
      description: 'Visit → Connect → Message → Follow-up → Email',
      steps: [
        { type: 'visit', delay: 0, label: 'Visit Profile' },
        { type: 'wait', delay: 86400, label: 'Wait 1 day' },
        { type: 'connect', delay: 0, label: 'Send Connection', noteTemplate: 'linkedin_connection_note' },
        { type: 'wait', delay: 259200, label: 'Wait 3 days' },
        { type: 'message', delay: 0, label: 'Send Message', messageTemplate: 'linkedin_message_cold' },
        { type: 'wait', delay: 432000, label: 'Wait 5 days' },
        { type: 'message', delay: 0, label: 'Follow-up Message' },
        { type: 'wait', delay: 172800, label: 'Wait 2 days' },
        { type: 'email', delay: 0, label: 'Send Email', emailTemplate: 'warm_intro' }
      ]
    },
    {
      id: 'job_application',
      name: 'Job Application',
      icon: '💼',
      description: 'Visit → Connect → Apply Message → Follow-up → Email Recruiter',
      steps: [
        { type: 'visit', delay: 0, label: 'Visit Profile' },
        { type: 'connect', delay: 0, label: 'Connect with Note', noteTemplate: 'linkedin_connection_note' },
        { type: 'wait', delay: 172800, label: 'Wait 2 days' },
        { type: 'message', delay: 0, label: 'Application Message', messageTemplate: 'linkedin_message_cold' },
        { type: 'wait', delay: 432000, label: 'Wait 5 days' },
        { type: 'message', delay: 0, label: 'Follow-up' },
        { type: 'wait', delay: 172800, label: 'Wait 2 days' },
        { type: 'email', delay: 0, label: 'Email Recruiter', emailTemplate: 'recruiter_direct_email' }
      ]
    },
    {
      id: 'networking',
      name: 'Networking',
      icon: '🌐',
      description: 'Visit → Follow → Connect → Chat → Email',
      steps: [
        { type: 'visit', delay: 0, label: 'Visit Profile' },
        { type: 'follow', delay: 0, label: 'Follow' },
        { type: 'wait', delay: 86400, label: 'Wait 1 day' },
        { type: 'connect', delay: 0, label: 'Connect', noteTemplate: 'linkedin_connection_note' },
        { type: 'wait', delay: 259200, label: 'Wait 3 days' },
        { type: 'message', delay: 0, label: 'Chat Request' },
        { type: 'wait', delay: 259200, label: 'Wait 3 days' },
        { type: 'email', delay: 0, label: 'Email Follow-up', emailTemplate: 'follow_up' }
      ]
    },
    {
      id: 'recruiter_response',
      name: 'Recruiter Response',
      icon: '📩',
      description: 'Visit → Connect → Interest Message → Email',
      steps: [
        { type: 'visit', delay: 0, label: 'Visit Profile' },
        { type: 'connect', delay: 0, label: 'Connect', noteTemplate: 'linkedin_connection_note' },
        { type: 'wait', delay: 86400, label: 'Wait 1 day' },
        { type: 'message', delay: 0, label: 'Express Interest' },
        { type: 'wait', delay: 259200, label: 'Wait 3 days' },
        { type: 'email', delay: 0, label: 'Direct Email', emailTemplate: 'cold_outreach_recruiter' }
      ]
    },
    {
      id: 'content_engagement',
      name: 'Content Engagement',
      icon: '❤️',
      description: 'Like → Comment → Connect → Message → Email',
      steps: [
        { type: 'like', delay: 0, label: 'Like Post' },
        { type: 'comment', delay: 0, label: 'Comment' },
        { type: 'wait', delay: 86400, label: 'Wait 1 day' },
        { type: 'connect', delay: 0, label: 'Connect' },
        { type: 'wait', delay: 259200, label: 'Wait 3 days' },
        { type: 'message', delay: 0, label: 'Send Message' },
        { type: 'wait', delay: 172800, label: 'Wait 2 days' },
        { type: 'email', delay: 0, label: 'Email', emailTemplate: 'content_engagement' }
      ]
    },
    {
      id: 'warm_followup',
      name: 'Warm Follow-Up',
      icon: '🔥',
      description: 'Visit → Endorse → Connect → Message → Email',
      steps: [
        { type: 'visit', delay: 0, label: 'Visit Profile' },
        { type: 'endorse', delay: 0, label: 'Endorse Skills' },
        { type: 'wait', delay: 86400, label: 'Wait 1 day' },
        { type: 'connect', delay: 0, label: 'Connect', noteTemplate: 'linkedin_connection_note' },
        { type: 'wait', delay: 172800, label: 'Wait 2 days' },
        { type: 'message', delay: 0, label: 'Send Message' },
        { type: 'wait', delay: 259200, label: 'Wait 3 days' },
        { type: 'email', delay: 0, label: 'Email', emailTemplate: 'warm_intro' }
      ]
    },
    {
      id: 'referral_strategy',
      name: 'Referral Strategy',
      icon: '🌟',
      description: 'Visit → Follow → Endorse → Connect → Referral Request',
      steps: [
        { type: 'visit', delay: 0, label: 'Visit Profile' },
        { type: 'follow', delay: 0, label: 'Follow' },
        { type: 'wait', delay: 86400, label: 'Wait 1 day' },
        { type: 'endorse', delay: 0, label: 'Endorse Skills' },
        { type: 'wait', delay: 86400, label: 'Wait 1 day' },
        { type: 'connect', delay: 0, label: 'Connect' },
        { type: 'wait', delay: 172800, label: 'Wait 2 days' },
        { type: 'message', delay: 0, label: 'Referral Request' },
        { type: 'wait', delay: 259200, label: 'Wait 3 days' },
        { type: 'email', delay: 0, label: 'Email Referral Request', emailTemplate: 'referral_request' }
      ]
    },
    {
      id: 'alumni_connect',
      name: 'Alumni Connection',
      icon: '🎓',
      description: 'Visit → Connect with Alumni Note → Message → Email',
      steps: [
        { type: 'visit', delay: 0, label: 'Visit Profile' },
        { type: 'connect', delay: 0, label: 'Connect (Alumni Note)' },
        { type: 'wait', delay: 172800, label: 'Wait 2 days' },
        { type: 'message', delay: 0, label: 'Alumni Chat' },
        { type: 'wait', delay: 259200, label: 'Wait 3 days' },
        { type: 'email', delay: 0, label: 'Email', emailTemplate: 'alumni_outreach' }
      ]
    }
  ],

  // ─── Sequence Management ──────────────────────

  createSequence(templateId) {
    const template = this.TEMPLATES.find(t => t.id === templateId);
    if (!template) return null;

    return {
      id: `seq_${Date.now()}`,
      templateId: template.id,
      name: template.name,
      icon: template.icon,
      steps: template.steps.map((step, idx) => ({
        ...step,
        id: `step_${idx}`,
        index: idx
      })),
      leads: {},
      createdAt: new Date().toISOString()
    };
  },

  /**
   * Add a lead to a sequence
   */
  addLeadToSequence(sequence, lead) {
    if (!sequence.leads) sequence.leads = {};
    sequence.leads[lead.id || lead.linkedinUrl] = {
      leadId: lead.id || lead.linkedinUrl,
      currentStep: 0,
      status: 'active',
      startedAt: new Date().toISOString(),
      nextActionAt: new Date().toISOString(),
      completedSteps: [],
      leadData: lead
    };
    return sequence;
  },

  /**
   * Get pending actions that are ready to execute
   */
  scheduleSequenceActions(sequence, campaignId) {
    const actions = [];
    const now = new Date();

    for (const [leadKey, leadState] of Object.entries(sequence.leads || {})) {
      if (leadState.status !== 'active') continue;
      if (new Date(leadState.nextActionAt) > now) continue;

      const currentStep = sequence.steps[leadState.currentStep];
      if (!currentStep) {
        leadState.status = 'completed';
        continue;
      }

      if (currentStep.type === 'wait') {
        leadState.nextActionAt = new Date(Date.now() + (currentStep.delay * 1000)).toISOString();
        leadState.currentStep++;
        continue;
      }

      actions.push({
        type: currentStep.type,
        leadId: leadKey,
        profileUrl: leadState.leadData?.linkedinUrl,
        sequenceId: sequence.id,
        campaignId,
        stepIndex: leadState.currentStep,
        note: currentStep.noteTemplate ? undefined : undefined,
        message: currentStep.messageTemplate ? undefined : undefined,
        emailTemplate: currentStep.emailTemplate,
        priority: 5
      });
    }

    return actions;
  },

  /**
   * Advance a lead to the next step after action completion
   */
  advanceLead(sequence, leadId) {
    const leadState = sequence.leads?.[leadId];
    if (!leadState || leadState.status !== 'active') return;

    leadState.completedSteps.push(leadState.currentStep);
    leadState.currentStep++;

    // Check if next step is a wait
    const nextStep = sequence.steps[leadState.currentStep];
    if (!nextStep) {
      leadState.status = 'completed';
      leadState.completedAt = new Date().toISOString();
    } else if (nextStep.type === 'wait') {
      leadState.nextActionAt = new Date(Date.now() + (nextStep.delay * 1000)).toISOString();
      leadState.currentStep++;
    } else {
      leadState.nextActionAt = new Date().toISOString();
    }

    return sequence;
  },

  getTemplates() {
    return this.TEMPLATES;
  }
};

if (typeof self !== 'undefined') self.SequenceRunner = SequenceRunner;
