/**
 * Waalaxy LinkedIn Enhancer - Tailored Outreach Draft System
 * Generates personalized outreach messages for emails and LinkedIn messages
 */
(function() {
  'use strict';

  // Message templates for different outreach scenarios
  var TEMPLATES = {
    // LinkedIn connection request (300 char limit)
    linkedinConnect: {
      networking: function(p) {
        return 'Hi ' + p.firstName + ', I came across your profile and was impressed by your work' +
               (p.company ? ' at ' + p.company : '') + '. I\'d love to connect and explore potential synergies. Looking forward to connecting!';
      },
      jobSeeker: function(p) {
        return 'Hi ' + p.firstName + ', I noticed your experience' +
               (p.company ? ' at ' + p.company : '') + ' and I\'m very interested in opportunities in ' +
               (p.industry || 'your field') + '. I\'d appreciate the chance to connect and learn more. Thanks!';
      },
      recruiter: function(p) {
        return 'Hi ' + p.firstName + ', I saw ' +
               (p.jobTitle ? 'the ' + p.jobTitle + ' role' : 'an exciting role') +
               (p.company ? ' at ' + p.company : '') +
               '. My background aligns well with this position. I\'d love to connect and discuss further!';
      }
    },

    // LinkedIn direct message
    linkedinMessage: {
      networking: function(p) {
        return 'Hi ' + p.firstName + ',\n\n' +
               'Thank you for connecting! I\'ve been following your work' +
               (p.company ? ' at ' + p.company : '') + ' and I\'m really impressed by ' +
               (p.headline ? 'your expertise in ' + p.headline : 'what you\'ve accomplished') + '.\n\n' +
               'I\'d love to schedule a quick call to discuss potential collaboration opportunities. ' +
               'Would you have 15 minutes this week?\n\n' +
               'Best regards';
      },
      jobSeeker: function(p) {
        return 'Hi ' + p.firstName + ',\n\n' +
               'Thank you for connecting! I\'m reaching out because I\'m very interested in ' +
               (p.company ? 'opportunities at ' + p.company : 'exploring new opportunities') + '.\n\n' +
               'I bring ' + (p.industry ? 'strong experience in ' + p.industry : 'relevant experience') +
               ' and I believe I could add significant value to your team.\n\n' +
               'Would you be open to a brief chat about current or upcoming opportunities? ' +
               'I\'d be happy to share my resume and discuss how my skills align.\n\n' +
               'Thank you for your time!';
      }
    },

    // Email outreach
    email: {
      networking: function(p) {
        return {
          subject: 'Connecting from LinkedIn - ' + (p.senderName || 'A fellow professional'),
          body: 'Hi ' + p.firstName + ',\n\n' +
                'I hope this email finds you well. I came across your LinkedIn profile and was impressed by your work' +
                (p.company ? ' at ' + p.company : '') + '.\n\n' +
                (p.headline ? 'Your expertise in ' + p.headline + ' particularly caught my attention. ' : '') +
                'I\'d love to connect and explore how we might collaborate or support each other\'s work.\n\n' +
                'Would you be available for a brief 15-minute call this week? I\'m flexible on timing.\n\n' +
                'Looking forward to hearing from you.\n\n' +
                'Best regards,\n' +
                (p.senderName || '[Your Name]')
        };
      },
      jobApplication: function(p) {
        return {
          subject: 'Application for ' + (p.jobTitle || 'Open Position') + (p.company ? ' at ' + p.company : ''),
          body: 'Dear ' + p.firstName + ',\n\n' +
                'I am writing to express my strong interest in the ' +
                (p.jobTitle || 'position') + (p.company ? ' at ' + p.company : '') +
                (p.jobUrl ? ' that I found on LinkedIn' : '') + '.\n\n' +
                'With my background in ' + (p.industry || 'this field') +
                ', I am confident that my skills and experience align well with the requirements of this role. ' +
                'I am particularly drawn to this opportunity because of ' +
                (p.company ? p.company + '\'s reputation for innovation and growth' : 'the exciting challenges it presents') + '.\n\n' +
                (p.jobDescription ?
                  'Based on the job description, I believe my experience in the following areas would be particularly relevant:\n' +
                  '- [Key skill 1 matching the role]\n' +
                  '- [Key skill 2 matching the role]\n' +
                  '- [Key skill 3 matching the role]\n\n' : '') +
                'I have attached my resume for your review and would welcome the opportunity to discuss how I can contribute to your team. ' +
                'Would you have time for a brief conversation this week?\n\n' +
                'Thank you for your consideration.\n\n' +
                'Best regards,\n' +
                (p.senderName || '[Your Name]') + '\n' +
                (p.senderPhone || '[Your Phone]') + '\n' +
                (p.senderEmail || '[Your Email]')
        };
      },
      coldOutreach: function(p) {
        return {
          subject: 'Quick question, ' + p.firstName,
          body: 'Hi ' + p.firstName + ',\n\n' +
                'I noticed your role' + (p.company ? ' at ' + p.company : '') +
                ' and wanted to reach out briefly.\n\n' +
                (p.headline ? 'Given your expertise in ' + p.headline + ', ' : '') +
                'I thought you might be interested in [your value proposition].\n\n' +
                'I\'d love to share how [specific benefit] could help ' +
                (p.company || 'your team') + ' achieve [specific outcome].\n\n' +
                'Would you have 10 minutes this week for a quick chat?\n\n' +
                'Best,\n' +
                (p.senderName || '[Your Name]')
        };
      }
    },

    // Job-specific recruiter outreach
    jobRecruiter: {
      email: function(p) {
        return {
          subject: 'Re: ' + (p.jobTitle || 'Open Position') + ' - Enthusiastic Candidate',
          body: 'Dear ' + p.recruiterName + ',\n\n' +
                'I came across the ' + (p.jobTitle || 'position') +
                (p.company ? ' at ' + p.company : '') +
                ' and I\'m very excited about this opportunity.\n\n' +
                (p.jobDescription ?
                  'After reading the job description, I was particularly drawn to the role because:\n' +
                  '- The responsibilities align closely with my experience\n' +
                  '- I am passionate about the industry and the company\'s mission\n' +
                  '- I can bring immediate value with my relevant skill set\n\n' : '') +
                'My key qualifications include:\n' +
                '- [Relevant experience/achievement 1]\n' +
                '- [Relevant experience/achievement 2]\n' +
                '- [Relevant experience/achievement 3]\n\n' +
                'I would love the opportunity to discuss this role further and share how my background ' +
                'can contribute to ' + (p.company || 'the team') + '\'s success.\n\n' +
                'I am available for a call at your convenience. Please find my resume attached.\n\n' +
                'Thank you for your time and consideration.\n\n' +
                'Best regards,\n' +
                (p.senderName || '[Your Name]') + '\n' +
                (p.senderPhone || '[Your Phone]') + '\n' +
                (p.senderEmail || '[Your Email]')
        };
      },
      linkedin: function(p) {
        return 'Hi ' + p.recruiterName + ',\n\n' +
               'I\'m very interested in the ' + (p.jobTitle || 'position') +
               (p.company ? ' at ' + p.company : '') + ' you\'re hiring for.\n\n' +
               'My background includes [brief relevant experience], and I believe I\'d be a strong fit.\n\n' +
               'Would you be open to a quick conversation? I\'d love to learn more about the role ' +
               'and share how I can contribute.\n\n' +
               'Thank you!';
      }
    }
  };

  // Open outreach draft modal
  function openDraft(type, context) {
    context = context || {};

    // Gather profile/job data
    var profileData = WLX.currentProfile || WLX.utils.extractProfileData();
    var contactData = WLX.currentContact || {};
    var detailsData = WLX.currentDetails || {};
    var jobData = context.jobData || WLX.utils.extractJobData();

    var params = {
      firstName: context.recruiterName ? context.recruiterName.split(' ')[0] : (profileData.firstName || detailsData.firstName || ''),
      lastName: profileData.lastName || detailsData.lastName || '',
      company: detailsData.company || profileData.company || jobData.company || '',
      headline: profileData.headline || '',
      industry: detailsData.industryName || '',
      recruiterName: context.recruiterName || '',
      jobTitle: jobData.title || '',
      jobDescription: jobData.description || '',
      jobUrl: jobData.jobUrl || '',
      senderName: '',
      senderEmail: '',
      senderPhone: ''
    };

    // Determine available emails
    var emails = context.emails || [];
    if (contactData.emails) {
      contactData.emails.forEach(function(e) {
        if (emails.indexOf(e.value) === -1) emails.push(e.value);
      });
    }

    // Generate message based on type
    var draftContent = '';
    var draftSubject = '';
    var tabs = [];

    switch(type) {
      case 'email':
        var emailDraft = TEMPLATES.email.networking(params);
        draftSubject = emailDraft.subject;
        draftContent = emailDraft.body;
        tabs = [
          { id: 'networking', label: 'Networking', gen: function() { var d = TEMPLATES.email.networking(params); return { subject: d.subject, body: d.body }; } },
          { id: 'job', label: 'Job Application', gen: function() { var d = TEMPLATES.email.jobApplication(params); return { subject: d.subject, body: d.body }; } },
          { id: 'cold', label: 'Cold Outreach', gen: function() { var d = TEMPLATES.email.coldOutreach(params); return { subject: d.subject, body: d.body }; } }
        ];
        break;

      case 'linkedin':
        draftContent = TEMPLATES.linkedinConnect.networking(params);
        tabs = [
          { id: 'networking', label: 'Networking', gen: function() { return { body: TEMPLATES.linkedinConnect.networking(params) }; } },
          { id: 'job', label: 'Job Seeker', gen: function() { return { body: TEMPLATES.linkedinConnect.jobSeeker(params) }; } },
          { id: 'message', label: 'Direct Message', gen: function() { return { body: TEMPLATES.linkedinMessage.networking(params) }; } }
        ];
        break;

      case 'job-email':
        var jobEmailDraft = TEMPLATES.jobRecruiter.email(params);
        draftSubject = jobEmailDraft.subject;
        draftContent = jobEmailDraft.body;
        tabs = [
          { id: 'tailored', label: 'Tailored Application', gen: function() { var d = TEMPLATES.jobRecruiter.email(params); return { subject: d.subject, body: d.body }; } },
          { id: 'cold', label: 'Cold Outreach', gen: function() { var d = TEMPLATES.email.coldOutreach(params); return { subject: d.subject, body: d.body }; } }
        ];
        break;

      case 'job-linkedin':
        draftContent = TEMPLATES.jobRecruiter.linkedin(params);
        tabs = [
          { id: 'recruiter', label: 'Recruiter Message', gen: function() { return { body: TEMPLATES.jobRecruiter.linkedin(params) }; } },
          { id: 'connect', label: 'Connection Request', gen: function() { return { body: TEMPLATES.linkedinConnect.recruiter(params) }; } }
        ];
        break;

      default:
        draftContent = TEMPLATES.linkedinConnect.networking(params);
    }

    showDraftModal(type, draftSubject, draftContent, tabs, emails, params);
  }

  // Show the draft modal UI
  function showDraftModal(type, subject, content, tabs, emails, params) {
    // Remove existing modal
    var existing = document.querySelector('.wlx-outreach-modal');
    if (existing) existing.remove();

    var isEmail = type.indexOf('email') !== -1;

    var modal = document.createElement('div');
    modal.className = 'wlx-outreach-modal';

    var contextHtml = '';
    if (params.recruiterName || params.jobTitle) {
      contextHtml = '<div class="wlx-outreach-context">';
      if (params.recruiterName) contextHtml += '<strong>To:</strong> ' + params.recruiterName + '<br>';
      if (params.jobTitle) contextHtml += '<strong>Job:</strong> ' + params.jobTitle + '<br>';
      if (params.company) contextHtml += '<strong>Company:</strong> ' + params.company;
      contextHtml += '</div>';
    }

    var emailSelectHtml = '';
    if (isEmail && emails && emails.length > 0) {
      emailSelectHtml = '<div style="margin-bottom:12px">' +
        '<label style="display:block;font-size:12px;color:#8b949e;margin-bottom:4px">Send to:</label>' +
        '<select id="wlx-email-select" style="width:100%;padding:8px 12px;background:#0d1117;border:1px solid #30363d;border-radius:8px;color:#e1e4e8;font-size:13px">';
      emails.forEach(function(em) {
        emailSelectHtml += '<option value="' + em + '">' + em + '</option>';
      });
      emailSelectHtml += '</select></div>';
    }

    var subjectHtml = '';
    if (isEmail) {
      subjectHtml = '<div style="margin-bottom:8px">' +
        '<label style="display:block;font-size:12px;color:#8b949e;margin-bottom:4px">Subject:</label>' +
        '<input id="wlx-subject-input" type="text" value="' + (subject || '').replace(/"/g, '&quot;') + '" ' +
        'style="width:100%;padding:8px 12px;background:#0d1117;border:1px solid #30363d;border-radius:8px;color:#e1e4e8;font-size:13px;box-sizing:border-box" /></div>';
    }

    var tabsHtml = '<div class="wlx-outreach-tabs">';
    tabs.forEach(function(tab, i) {
      tabsHtml += '<button class="wlx-outreach-tab' + (i === 0 ? ' active' : '') + '" data-tab-id="' + tab.id + '">' + tab.label + '</button>';
    });
    tabsHtml += '</div>';

    modal.innerHTML =
      '<div class="wlx-outreach-modal-content">' +
        '<div class="wlx-outreach-modal-title">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="#00d4aa"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>' +
          ' Draft Outreach Message' +
          '<span class="wlx-unlimited-badge" style="margin-left:8px;font-size:10px">NO LIMITS</span>' +
          '<button class="wlx-outreach-modal-close" id="wlx-modal-close">&times;</button>' +
        '</div>' +
        contextHtml +
        tabsHtml +
        emailSelectHtml +
        subjectHtml +
        '<textarea class="wlx-outreach-textarea" id="wlx-draft-textarea">' + content + '</textarea>' +
        '<div class="wlx-outreach-footer">' +
          '<button class="wlx-action-btn" id="wlx-copy-draft">Copy to Clipboard</button>' +
          (isEmail ? '<button class="wlx-action-btn primary" id="wlx-send-email">Open in Email Client</button>' : '') +
          (!isEmail ? '<button class="wlx-action-btn primary" id="wlx-copy-and-close">Copy & Close</button>' : '') +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    // Tab switching
    modal.querySelectorAll('.wlx-outreach-tab').forEach(function(tabBtn) {
      tabBtn.addEventListener('click', function() {
        modal.querySelectorAll('.wlx-outreach-tab').forEach(function(t) { t.classList.remove('active'); });
        tabBtn.classList.add('active');

        var tabId = tabBtn.getAttribute('data-tab-id');
        var tab = tabs.find(function(t) { return t.id === tabId; });
        if (tab) {
          var generated = tab.gen();
          document.getElementById('wlx-draft-textarea').value = generated.body || '';
          var subjectInput = document.getElementById('wlx-subject-input');
          if (subjectInput && generated.subject) subjectInput.value = generated.subject;
        }
      });
    });

    // Close modal
    document.getElementById('wlx-modal-close').addEventListener('click', function() {
      modal.remove();
    });
    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.remove();
    });

    // Copy to clipboard
    var copyBtn = document.getElementById('wlx-copy-draft');
    if (copyBtn) {
      copyBtn.addEventListener('click', function() {
        var text = document.getElementById('wlx-draft-textarea').value;
        navigator.clipboard.writeText(text).then(function() {
          copyBtn.textContent = 'Copied!';
          copyBtn.style.color = '#00d4aa';
          setTimeout(function() { copyBtn.textContent = 'Copy to Clipboard'; copyBtn.style.color = ''; }, 2000);
        });
      });
    }

    // Copy & Close
    var copyCloseBtn = document.getElementById('wlx-copy-and-close');
    if (copyCloseBtn) {
      copyCloseBtn.addEventListener('click', function() {
        var text = document.getElementById('wlx-draft-textarea').value;
        navigator.clipboard.writeText(text).then(function() {
          WLX.utils.showToast('Message copied to clipboard!');
          modal.remove();
        });
      });
    }

    // Open in email client
    var sendBtn = document.getElementById('wlx-send-email');
    if (sendBtn) {
      sendBtn.addEventListener('click', function() {
        var emailSelect = document.getElementById('wlx-email-select');
        var to = emailSelect ? emailSelect.value : '';
        var subjectInput = document.getElementById('wlx-subject-input');
        var subj = subjectInput ? subjectInput.value : '';
        var body = document.getElementById('wlx-draft-textarea').value;

        var mailtoUrl = 'mailto:' + encodeURIComponent(to) +
                        '?subject=' + encodeURIComponent(subj) +
                        '&body=' + encodeURIComponent(body);
        window.open(mailtoUrl);
        WLX.utils.showToast('Opening email client...');
      });
    }
  }

  WLX.outreach = {
    openDraft: openDraft,
    templates: TEMPLATES
  };
})();
