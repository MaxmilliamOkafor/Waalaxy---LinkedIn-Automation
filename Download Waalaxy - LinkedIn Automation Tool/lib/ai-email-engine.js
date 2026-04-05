/**
 * Waalaxy LinkedIn Automation Tool — AI Email Engine
 * Auto Gmail-inspired AI drafting with context awareness, tone control,
 * template library, and subject line generation.
 * Uses OpenAI API (user's own key) — zero limitations.
 */

const AIEmailEngine = {
  // ─── Built-in Template Library ──────────────────

  TEMPLATES: [
    {
      id: 'cold_outreach_recruiter',
      name: 'Cold Outreach to Recruiter',
      icon: '🎯',
      category: 'job',
      subjectTemplate: 'Re: {jobTitle} — Experienced {userTitle} Interested',
      bodyTemplate: `Dear {firstName},

I came across the {jobTitle} position at {company} and was immediately drawn to the opportunity. {aboutCompanyLine}

{userIntroLine}

I believe my background in {relevantSkills} aligns well with what you're looking for. I'd love the chance to discuss how I can contribute to {company}'s success.

Would you be open to a brief call this week?

Best regards,
{userName}
{userTitle}{userCompanyLine}
{userEmail}{userPhoneLine}`
    },
    {
      id: 'warm_intro',
      name: 'Warm Introduction',
      icon: '🤝',
      category: 'networking',
      subjectTemplate: 'Connecting via LinkedIn — {userName}',
      bodyTemplate: `Hi {firstName},

I noticed we share connections in the {industry} space, and I've been following {company}'s work with great interest.

{userIntroLine}

I'd love to connect and explore potential synergies between what we're doing. Perhaps we could set up a brief call?

Looking forward to hearing from you!

Best,
{userName}
{userTitle}{userCompanyLine}`
    },
    {
      id: 'job_application_email',
      name: 'Job Application Email',
      icon: '💼',
      category: 'job',
      subjectTemplate: 'Application: {jobTitle} at {company}',
      bodyTemplate: `Dear {firstName},

I'm writing to express my strong interest in the {jobTitle} position at {company}. {aboutCompanyLine}

{userIntroLine}

Key highlights of my background:
• {highlight1}
• {highlight2}
• {highlight3}

I've attached my resume for your review and would welcome the opportunity to discuss how my experience can benefit your team.

Thank you for your time and consideration.

Best regards,
{userName}
{userTitle}{userCompanyLine}
{userEmail}{userPhoneLine}`
    },
    {
      id: 'follow_up',
      name: 'Follow-Up After Connection',
      icon: '🔄',
      category: 'networking',
      subjectTemplate: 'Great connecting, {firstName}!',
      bodyTemplate: `Hi {firstName},

Thank you for connecting on LinkedIn! I'm glad we're now in each other's networks.

{userIntroLine}

I'd love to learn more about your work at {company}. Would you be open to a quick 15-minute chat sometime this week?

No pressure at all — just thought it could be mutually beneficial.

Best,
{userName}`
    },
    {
      id: 'interview_thank_you',
      name: 'Thank You After Interview',
      icon: '🙏',
      category: 'job',
      subjectTemplate: 'Thank you — {jobTitle} interview',
      bodyTemplate: `Dear {firstName},

Thank you so much for taking the time to speak with me about the {jobTitle} role at {company}. I truly enjoyed our conversation.

{interviewHighlights}

I'm even more excited about the opportunity after learning more about the team and the direction {company} is heading.

Please don't hesitate to reach out if you need any additional information from me.

Best regards,
{userName}
{userEmail}{userPhoneLine}`
    },
    {
      id: 'content_engagement',
      name: 'Reaching Out After Content',
      icon: '📝',
      category: 'networking',
      subjectTemplate: 'Loved your recent post, {firstName}',
      bodyTemplate: `Hi {firstName},

I recently came across your {contentType} about {contentTopic} and found it incredibly insightful. {specificInsight}

{userIntroLine}

I'd love to continue the conversation and hear more of your thoughts on this topic. Would you be open to connecting?

Best,
{userName}`
    },
    {
      id: 'partnership_inquiry',
      name: 'Partnership / Collaboration',
      icon: '🚀',
      category: 'business',
      subjectTemplate: 'Collaboration opportunity — {userName} × {company}',
      bodyTemplate: `Hi {firstName},

I've been following {company}'s impressive work in the {industry} space, and I believe there's an exciting opportunity for collaboration.

{userIntroLine}

{collaborationIdea}

I'd love to set up a brief call to explore this further. Would next week work for you?

Best regards,
{userName}
{userTitle}{userCompanyLine}`
    },
    {
      id: 'referral_request',
      name: 'Referral Request',
      icon: '🌟',
      category: 'job',
      subjectTemplate: 'Quick question about {company}',
      bodyTemplate: `Hi {firstName},

I hope you're doing well! I noticed you work at {company}, and I'm very interested in the {jobTitle} position that's currently open.

{userIntroLine}

Would you be comfortable providing a referral or connecting me with the hiring team? I'd be happy to share my resume for your review first.

Either way, I appreciate your time and any guidance you can offer.

Best,
{userName}
{userEmail}`
    },
    {
      id: 'linkedin_message_cold',
      name: 'LinkedIn Cold Message',
      icon: '💬',
      category: 'linkedin',
      subjectTemplate: '',
      bodyTemplate: `Hi {firstName}, I came across your profile and was impressed by your work as {title} at {company}. {userIntroLine} Would love to connect and share ideas. Looking forward!`
    },
    {
      id: 'linkedin_connection_note',
      name: 'LinkedIn Connection Note (300 chars)',
      icon: '🔗',
      category: 'linkedin',
      subjectTemplate: '',
      bodyTemplate: `Hi {firstName}! Impressed by your work at {company}. I'm {userName}, {userTitle}. Would love to connect and exchange ideas. Let's chat!`
    },
    {
      id: 'recruiter_direct_email',
      name: 'Direct Email to Recruiter',
      icon: '📧',
      category: 'job',
      subjectTemplate: '{jobTitle} position — {userName}',
      bodyTemplate: `Dear {firstName},

I noticed you posted the {jobTitle} role at {company} on LinkedIn, and I wanted to reach out directly to express my strong interest.

{userIntroLine}

{jobRelevanceSection}

I've attached my resume and would welcome the opportunity to discuss this role further.

Best regards,
{userName}
{userTitle}{userCompanyLine}
{userEmail}{userPhoneLine}
LinkedIn: {userLinkedIn}`
    },
    {
      id: 'alumni_outreach',
      name: 'Alumni Connection',
      icon: '🎓',
      category: 'networking',
      subjectTemplate: 'Fellow {schoolName} alumni here!',
      bodyTemplate: `Hi {firstName},

I noticed we're both {schoolName} alumni — always great to connect with fellow graduates!

{userIntroLine}

I'd love to hear about your experience at {company}. Would you be open to a brief chat?

Go {schoolMascot}! 🎓

Best,
{userName}`
    }
  ],

  // ─── Tone Presets ─────────────────────────────

  TONES: {
    professional: 'Write in a professional, polished tone. Be respectful and business-appropriate.',
    casual: 'Write in a friendly, casual tone. Be approachable and warm, like chatting with a friend.',
    enthusiastic: 'Write with genuine enthusiasm and energy. Show excitement about the opportunity.',
    concise: 'Write as concisely as possible. Every word should count. Get to the point quickly.',
    empathetic: 'Write with empathy and understanding. Acknowledge the recipient\'s perspective.',
    confident: 'Write with confidence and authority. Show expertise without being arrogant.'
  },

  // ─── Main AI Draft Method ────────────────────

  async draftEmail(options) {
    const {
      templateId,
      variables = {},
      settings = {},
      customPrompt = '',
      tone = 'professional',
      type = 'email' // 'email', 'linkedin_message', 'connection_note', 'subject'
    } = options;

    // If we have an API key, use AI
    if (settings.openaiApiKey) {
      return this._aiDraft(options);
    }

    // Otherwise, use template fallback
    return this._templateDraft(options);
  },

  // ─── AI-Powered Drafting ─────────────────────

  async _aiDraft(options) {
    const {
      templateId,
      variables = {},
      settings = {},
      customPrompt = '',
      tone = 'professional',
      type = 'email'
    } = options;

    const toneInstruction = this.TONES[tone] || this.TONES.professional;

    const contextParts = [];

    // Build context from variables
    if (variables.name) contextParts.push(`Recipient: ${variables.name}`);
    if (variables.title) contextParts.push(`Their role: ${variables.title}`);
    if (variables.company) contextParts.push(`Their company: ${variables.company}`);
    if (variables.about) contextParts.push(`Their bio: ${variables.about.substring(0, 300)}`);
    if (variables.experience?.length) {
      contextParts.push(`Their experience: ${variables.experience.map(e => `${e.title} at ${e.company}`).join(', ')}`);
    }
    if (variables.education?.length) {
      contextParts.push(`Their education: ${variables.education.map(e => `${e.degree} from ${e.school}`).join(', ')}`);
    }
    if (variables.skills?.length) {
      contextParts.push(`Their skills: ${variables.skills.slice(0, 5).join(', ')}`);
    }
    if (variables.jobTitle) contextParts.push(`Job posting: ${variables.jobTitle} at ${variables.company}`);
    if (variables.jobDescription) contextParts.push(`Job description excerpt: ${variables.jobDescription.substring(0, 500)}`);
    if (variables.userName) contextParts.push(`\nSender: ${variables.userName}`);
    if (variables.userTitle) contextParts.push(`Sender role: ${variables.userTitle}`);
    if (variables.userCompany) contextParts.push(`Sender company: ${variables.userCompany}`);
    if (variables.mutualConnections) contextParts.push(`Mutual connections: ${variables.mutualConnections}`);

    let systemPrompt;
    let userPrompt;

    if (type === 'connection_note') {
      systemPrompt = `You are an expert LinkedIn outreach writer. Write a LinkedIn connection request note. STRICT MAX 300 CHARACTERS. ${toneInstruction} Be genuine, personal, specific. No generic messages. Return ONLY the note text.`;
      userPrompt = `Write a connection note to:\n${contextParts.join('\n')}\n\n${customPrompt || 'Write a compelling connection note.'}`;
    } else if (type === 'linkedin_message') {
      systemPrompt = `You are an expert LinkedIn message writer. Write a compelling LinkedIn direct message. ${toneInstruction} Be genuine, personal, concise (max 500 chars). No clichés. Return ONLY the message text.`;
      userPrompt = `Write a LinkedIn message to:\n${contextParts.join('\n')}\n\n${customPrompt || 'Write a compelling LinkedIn message.'}`;
    } else if (type === 'subject') {
      systemPrompt = `You are an email subject line expert. Write ONE compelling email subject line. Max 60 characters. Return ONLY the subject line text, nothing else.`;
      userPrompt = `Write a subject line for an email to:\n${contextParts.join('\n')}\n\n${customPrompt || 'Write a compelling subject line.'}`;
    } else {
      // Full email
      systemPrompt = `You are an expert outreach email writer, similar to Auto Gmail's AI assistant. Write personalized, compelling outreach emails that get responses.

Key rules:
- ${toneInstruction}
- Be genuine and human — NEVER sound robotic or generic
- Personalize based on the recipient's specific role, company, background, and interests
- Keep messages well-structured with clear paragraphs
- Never use clichés like "I hope this email finds you well" or "I came across your profile"
- Always include a clear, specific call to action
- Include a professional sign-off with the sender's info
- Sound like a real person, not a template
- If it's a job-related email, make specific connections between the sender's experience and the job requirements`;

      userPrompt = customPrompt
        ? `${customPrompt}\n\nContext:\n${contextParts.join('\n')}`
        : `Write a personalized outreach email based on this context:\n${contextParts.join('\n')}`;

      // If template selected, add template context
      if (templateId) {
        const template = this.TEMPLATES.find(t => t.id === templateId);
        if (template) {
          userPrompt += `\n\nUse a style similar to this template: "${template.name}"`;
        }
      }
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.openaiApiKey}`
        },
        body: JSON.stringify({
          model: settings.aiModel || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.8,
          max_tokens: type === 'subject' ? 60 : type === 'connection_note' ? 200 : 800
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error: ${response.status}`);
      }

      const result = await response.json();
      let message = result.choices?.[0]?.message?.content?.trim();

      if (!message) throw new Error('Empty AI response');

      // No message length limits enforced

      return {
        success: true,
        message,
        type,
        model: settings.aiModel || 'gpt-4o-mini',
        source: 'ai'
      };

    } catch (error) {
      console.error('[WX] AI draft error:', error);
      // Fallback to template
      const fallback = this._templateDraft(options);
      return { ...fallback, error: error.message, source: 'fallback' };
    }
  },

  // ─── Template-Based Drafting ─────────────────

  _templateDraft(options) {
    const {
      templateId,
      variables = {},
      type = 'email'
    } = options;

    // Find template
    let template = templateId
      ? this.TEMPLATES.find(t => t.id === templateId)
      : null;

    // Auto-select template based on context
    if (!template) {
      if (variables.jobTitle && variables.recruiter) {
        template = this.TEMPLATES.find(t => t.id === 'cold_outreach_recruiter');
      } else if (variables.jobTitle) {
        template = this.TEMPLATES.find(t => t.id === 'job_application_email');
      } else if (type === 'connection_note') {
        template = this.TEMPLATES.find(t => t.id === 'linkedin_connection_note');
      } else if (type === 'linkedin_message') {
        template = this.TEMPLATES.find(t => t.id === 'linkedin_message_cold');
      } else {
        template = this.TEMPLATES.find(t => t.id === 'warm_intro');
      }
    }

    if (!template) {
      return {
        success: true,
        message: this._genericFallback(variables, type),
        type,
        source: 'template'
      };
    }

    let body = template.bodyTemplate;
    let subject = template.subjectTemplate || '';

    // Replace variables
    const firstName = (variables.name || 'there').split(' ')[0];
    const replacements = {
      '{firstName}': firstName,
      '{name}': variables.name || 'there',
      '{lastName}': variables.lastName || '',
      '{title}': variables.title || 'your role',
      '{company}': variables.company || 'your company',
      '{jobTitle}': variables.jobTitle || 'the open position',
      '{userName}': variables.userName || '',
      '{userTitle}': variables.userTitle || '',
      '{userCompany}': variables.userCompany || '',
      '{userEmail}': variables.userEmail || '',
      '{userPhone}': variables.userPhone || '',
      '{userLinkedIn}': variables.userLinkedIn || '',
      '{industry}': variables.industry || 'technology',
      '{location}': variables.location || '',
      '{about}': variables.about || '',
      '{userIntroLine}': variables.userTitle
        ? `I'm ${variables.userName || 'a professional'}, ${variables.userTitle}${variables.userCompany ? ` at ${variables.userCompany}` : ''}.`
        : '',
      '{userCompanyLine}': variables.userCompany ? `\n${variables.userCompany}` : '',
      '{userPhoneLine}': variables.userPhone ? `\n${variables.userPhone}` : '',
      '{aboutCompanyLine}': variables.company ? `I've been following ${variables.company}'s growth and am impressed by the team's work.` : '',
      '{relevantSkills}': (variables.skills || []).slice(0, 3).join(', ') || 'my field',
      '{highlight1}': variables.experience?.[0] ? `${variables.experience[0].title} experience` : 'Strong technical background',
      '{highlight2}': (variables.skills || [])[0] ? `Expertise in ${variables.skills[0]}` : 'Proven track record of results',
      '{highlight3}': variables.education?.[0] ? `${variables.education[0].degree} from ${variables.education[0].school}` : 'Passionate about driving innovation',
      '{schoolName}': variables.education?.[0]?.school || 'our university',
      '{schoolMascot}': 'team',
      '{interviewHighlights}': 'Our discussion about the team\'s direction and goals really resonated with me.',
      '{contentType}': 'post',
      '{contentTopic}': variables.industry || 'industry trends',
      '{specificInsight}': 'Your perspective was refreshing and thought-provoking.',
      '{collaborationIdea}': 'I think our complementary expertise could create something special.',
      '{jobRelevanceSection}': variables.userTitle
        ? `With my background as ${variables.userTitle}${variables.userCompany ? ` at ${variables.userCompany}` : ''}, I'm confident I can make an immediate impact on your team.`
        : 'I believe my experience aligns well with the requirements outlined in the job description.'
    };

    for (const [key, value] of Object.entries(replacements)) {
      body = body.split(key).join(value);
      subject = subject.split(key).join(value);
    }

    // Clean empty lines
    body = body.replace(/\n{3,}/g, '\n\n').trim();

    // No message length limits enforced

    return {
      success: true,
      message: body,
      subject: subject || undefined,
      templateId: template.id,
      templateName: template.name,
      type,
      source: 'template'
    };
  },

  _genericFallback(variables, type) {
    const firstName = (variables.name || 'there').split(' ')[0];
    const company = variables.company || 'your company';

    if (type === 'connection_note') {
      return `Hi ${firstName}! Impressed by your work at ${company}. Would love to connect and exchange ideas.`;
    }

    if (type === 'linkedin_message') {
      return `Hi ${firstName}, I noticed your work at ${company} and found it impressive. ${variables.userTitle ? `I'm ${variables.userName}, ${variables.userTitle}.` : ''} Would love to connect and share ideas!`;
    }

    if (variables.jobTitle) {
      return `Hi ${firstName},\n\nI'm interested in the ${variables.jobTitle} position at ${company}. ${variables.userTitle ? `As a ${variables.userTitle}` : 'With my background'}, I believe I can contribute meaningfully to your team.\n\nWould you be open to a brief conversation?\n\nBest regards,\n${variables.userName || ''}`;
    }

    return `Hi ${firstName},\n\nI came across your profile and was impressed by your work at ${company}. ${variables.userTitle ? `I'm ${variables.userName}, ${variables.userTitle}.` : ''}\n\nI'd love to connect and explore potential opportunities to collaborate.\n\nBest,\n${variables.userName || ''}`;
  },

  // ─── Subject Line Generation ─────────────────

  async draftSubjectLine(options) {
    return this.draftEmail({ ...options, type: 'subject' });
  },

  // ─── Get Templates ───────────────────────────

  getTemplates(category = null) {
    if (category) {
      return this.TEMPLATES.filter(t => t.category === category);
    }
    return this.TEMPLATES;
  },

  getCategories() {
    return [
      { id: 'job', name: 'Job Search', icon: '💼' },
      { id: 'networking', name: 'Networking', icon: '🌐' },
      { id: 'business', name: 'Business', icon: '🚀' },
      { id: 'linkedin', name: 'LinkedIn Messages', icon: '💬' }
    ];
  }
};

if (typeof self !== 'undefined') self.AIEmailEngine = AIEmailEngine;
if (typeof window !== 'undefined') window.AIEmailEngine = AIEmailEngine;
