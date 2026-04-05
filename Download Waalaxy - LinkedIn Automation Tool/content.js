/**
 * Waalaxy LinkedIn Automation Tool — Content Script
 * Injected on LinkedIn pages. Features:
 * - Profile detection & contact discovery
 * - Floating contact info overlay on profiles
 * - Recruiter quick-contact panel on job pages
 * - Badge injection & sidebar integration
 * - Automation action execution
 */

(function () {
  'use strict';

  if (window.__WX_INJECTED) return;
  window.__WX_INJECTED = true;

  const BADGE_ID = 'wx-badge';
  const CONTACT_OVERLAY_ID = 'wx-contact-overlay';
  const RECRUITER_PANEL_ID = 'wx-recruiter-panel';

  let currentProfileData = null;
  let currentJobData = null;
  let currentPageType = null;
  let lastUrl = location.href;
  let retryCount = 0;
  let contactData = null;

  // ─── Init ─────────────────────────────────────

  function init() {
    console.log('[WX] Waalaxy LinkedIn Automation v3.0 initialized');
    processCurrentPage();
    observePageChanges();
  }

  // ─── Page Change Observer ─────────────────────

  function observePageChanges() {
    setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        retryCount = 0;
        cleanup();
        setTimeout(() => processCurrentPage(), 600);
      }
    }, 500);

    const observer = new MutationObserver(debounce(() => {
      const pt = detectPageType();
      if (pt === 'profile' && (!currentProfileData || !currentProfileData.name)) {
        processCurrentPage();
      }
      if (pt === 'job' && (!currentJobData || !currentJobData.jobTitle)) {
        processCurrentPage();
      }
    }, 1500));

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  // ─── Page Type Detection ──────────────────────

  function detectPageType() {
    const url = window.location.href;
    if (url.match(/linkedin\.com\/in\/[^/]+/)) return 'profile';
    if (url.includes('/jobs/view/') || url.match(/\/jobs\/collections\/.*currentJobId/)) return 'job';
    if (url.includes('/company/')) return 'company';
    if (url.includes('/search/results/people')) return 'search_people';
    if (url.includes('/search/results/')) return 'search';
    if (url.includes('/jobs/')) return 'jobs_list';
    if (url.includes('/messaging/')) return 'messaging';
    return 'other';
  }

  // ─── Process Current Page ─────────────────────

  function processCurrentPage() {
    const pageType = detectPageType();
    currentPageType = pageType;
    console.log('[WX] Processing:', pageType);

    switch (pageType) {
      case 'profile': handleProfilePage(); break;
      case 'job': handleJobPage(); break;
      case 'jobs_list': handleJobsList(); break;
      case 'search_people': handlePeopleSearch(); break;
    }
  }

  // ═══════════════════════════════════════════════
  //  PROFILE PAGE — Contact Overlay
  // ═══════════════════════════════════════════════

  async function handleProfilePage() {
    try {
      const nameSelectors = [
        'h1.text-heading-xlarge', '.pv-text-details__left-panel h1',
        '.top-card-layout__title', 'h1[tabindex="-1"]', 'main h1'
      ];

      let nameFound = false;
      for (const sel of nameSelectors) {
        try { await waitForElement(sel, 3000); nameFound = true; break; } catch { /* next */ }
      }

      if (!nameFound && retryCount < 5) {
        retryCount++;
        setTimeout(() => handleProfilePage(), 1000);
        return;
      }

      await sleep(500);
      currentProfileData = ProfileScraper.extractProfile();

      if (!currentProfileData.name) {
        if (retryCount < 5) { retryCount++; setTimeout(() => handleProfilePage(), 1500); return; }
        return;
      }

      // Find contacts
      contactData = ContactFinder.findContacts(currentProfileData);
      currentProfileData.foundEmails = contactData.emails;
      currentProfileData.foundPhones = contactData.phones;
      currentProfileData.workEmails = contactData.workEmails;
      currentProfileData.personalEmails = contactData.personalEmails;

      console.log('[WX] Profile:', currentProfileData.name, '|',
        contactData.emails.length, 'emails,', contactData.phones.length, 'phones');

      injectBadge('profile');
      injectContactOverlay();

      chrome.runtime.sendMessage({
        type: 'PROFILE_DETECTED',
        data: currentProfileData
      }).catch(() => {});

    } catch (e) {
      console.warn('[WX] Profile error:', e);
      if (retryCount < 5) { retryCount++; setTimeout(() => handleProfilePage(), 2000); }
    }
  }

  // ─── Contact Info Overlay (on profile pages) ──

  function injectContactOverlay() {
    if (document.getElementById(CONTACT_OVERLAY_ID)) return;
    if (!contactData || (contactData.emails.length === 0 && contactData.phones.length === 0)) return;

    const overlay = document.createElement('div');
    overlay.id = CONTACT_OVERLAY_ID;
    overlay.className = 'wx-contact-overlay';

    const verifiedEmails = contactData.verifiedEmails || [];
    const workEmails = contactData.workEmails || [];
    const personalEmails = contactData.personalEmails || [];
    const phones = contactData.phones || [];

    let emailsHtml = '';

    if (verifiedEmails.length > 0) {
      emailsHtml += `<div class="wx-co-section"><div class="wx-co-section-title">✅ Verified</div>`;
      verifiedEmails.forEach(e => {
        emailsHtml += `<div class="wx-co-item wx-co-verified">
          <span class="wx-co-email">${escapeHtml(e.email)}</span>
          <div class="wx-co-actions">
            <button class="wx-co-btn wx-co-copy" data-copy="${escapeHtml(e.email)}" title="Copy">📋</button>
            <button class="wx-co-btn wx-co-draft" data-email="${escapeHtml(e.email)}" data-type="work" title="Draft Email">✉️</button>
          </div>
        </div>`;
      });
      emailsHtml += '</div>';
    }

    if (workEmails.length > 0) {
      emailsHtml += `<div class="wx-co-section"><div class="wx-co-section-title">💼 Work Email</div>`;
      workEmails.slice(0, 3).forEach(e => {
        emailsHtml += `<div class="wx-co-item">
          <span class="wx-co-email">${escapeHtml(e.email)}</span>
          <span class="wx-co-conf">${e.confidence}%</span>
          <div class="wx-co-actions">
            <button class="wx-co-btn wx-co-copy" data-copy="${escapeHtml(e.email)}" title="Copy">📋</button>
            <button class="wx-co-btn wx-co-draft" data-email="${escapeHtml(e.email)}" data-type="work" title="Draft Email">✉️</button>
          </div>
        </div>`;
      });
      emailsHtml += '</div>';
    }

    if (personalEmails.length > 0) {
      emailsHtml += `<div class="wx-co-section"><div class="wx-co-section-title">👤 Personal Email</div>`;
      personalEmails.slice(0, 2).forEach(e => {
        emailsHtml += `<div class="wx-co-item">
          <span class="wx-co-email">${escapeHtml(e.email)}</span>
          <span class="wx-co-conf">${e.confidence}%</span>
          <div class="wx-co-actions">
            <button class="wx-co-btn wx-co-copy" data-copy="${escapeHtml(e.email)}" title="Copy">📋</button>
            <button class="wx-co-btn wx-co-draft" data-email="${escapeHtml(e.email)}" data-type="personal" title="Draft Email">✉️</button>
          </div>
        </div>`;
      });
      emailsHtml += '</div>';
    }

    let phonesHtml = '';
    if (phones.length > 0) {
      phonesHtml = `<div class="wx-co-section"><div class="wx-co-section-title">📞 Phone</div>`;
      phones.forEach(p => {
        const phone = typeof p === 'string' ? p : p.phone;
        phonesHtml += `<div class="wx-co-item">
          <span class="wx-co-phone">${escapeHtml(phone)}</span>
          <div class="wx-co-actions">
            <button class="wx-co-btn wx-co-copy" data-copy="${escapeHtml(phone)}" title="Copy">📋</button>
            <a href="tel:${phone.replace(/[^\d+]/g, '')}" class="wx-co-btn" title="Call">📞</a>
          </div>
        </div>`;
      });
      phonesHtml += '</div>';
    }

    const totalContacts = (verifiedEmails.length + workEmails.length + personalEmails.length + phones.length);

    overlay.innerHTML = `
      <div class="wx-co-header" id="wx-co-toggle">
        <div class="wx-co-header-left">
          <span class="wx-co-icon">📧</span>
          <span class="wx-co-title">Contact Info</span>
          <span class="wx-co-count">${totalContacts}</span>
        </div>
        <span class="wx-co-chevron">▼</span>
      </div>
      <div class="wx-co-body" id="wx-co-body">
        ${emailsHtml}
        ${phonesHtml}
        <div class="wx-co-footer">
          <button class="wx-co-footer-btn" id="wx-co-copy-all">📋 Copy All</button>
          <button class="wx-co-footer-btn" id="wx-co-open-sidebar">🚀 Open Sidebar</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Toggle expand
    overlay.querySelector('#wx-co-toggle').addEventListener('click', () => {
      overlay.classList.toggle('wx-co-expanded');
    });

    // Copy buttons
    overlay.querySelectorAll('.wx-co-copy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const text = btn.dataset.copy;
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = '✅';
          setTimeout(() => btn.textContent = '📋', 1500);
        });
      });
    });

    // Draft email buttons
    overlay.querySelectorAll('.wx-co-draft').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openSidebar();
      });
    });

    // Copy all
    overlay.querySelector('#wx-co-copy-all')?.addEventListener('click', () => {
      const allInfo = [];
      if (currentProfileData.name) allInfo.push(`Name: ${currentProfileData.name}`);
      if (currentProfileData.title) allInfo.push(`Title: ${currentProfileData.title}`);
      if (currentProfileData.company) allInfo.push(`Company: ${currentProfileData.company}`);
      contactData.emails.slice(0, 5).forEach(e => allInfo.push(`Email: ${e.email} (${e.confidence}% ${e.type})`));
      contactData.phones.forEach(p => allInfo.push(`Phone: ${typeof p === 'string' ? p : p.phone}`));
      navigator.clipboard.writeText(allInfo.join('\n'));
      if (WX?.Utils) WX.Utils.showToast('Contact info copied!', 'success');
    });

    // Open sidebar
    overlay.querySelector('#wx-co-open-sidebar')?.addEventListener('click', openSidebar);

    // Auto expand after short delay
    setTimeout(() => overlay.classList.add('wx-co-expanded'), 1500);
    setTimeout(() => overlay.classList.remove('wx-co-expanded'), 4000);
  }

  // ═══════════════════════════════════════════════
  //  JOB PAGE — Recruiter Quick-Contact Panel
  // ═══════════════════════════════════════════════

  async function handleJobPage() {
    try {
      const jobSelectors = [
        '.job-details-jobs-unified-top-card__job-title',
        '.jobs-unified-top-card__job-title', 'h1.t-24',
        '.top-card-layout__title'
      ];

      let found = false;
      for (const sel of jobSelectors) {
        try { await waitForElement(sel, 3000); found = true; break; } catch { /* next */ }
      }

      if (!found && retryCount < 3) {
        retryCount++;
        setTimeout(() => handleJobPage(), 1500);
        return;
      }

      await sleep(500);
      currentJobData = ProfileScraper.extractJobListing();
      if (!currentJobData.jobTitle) return;

      console.log('[WX] Job:', currentJobData.jobTitle, 'at', currentJobData.company);

      injectBadge('job');

      if (currentJobData.recruiter) {
        injectRecruiterPanel();
      }

      chrome.runtime.sendMessage({
        type: 'JOB_DETECTED',
        data: currentJobData
      }).catch(() => {});

    } catch (e) {
      console.warn('[WX] Job error:', e);
    }
  }

  // ─── Recruiter Quick-Contact Panel ────────────

  function injectRecruiterPanel() {
    const recruiterSections = document.querySelectorAll(
      '.hirer-card__hirer-information, .jobs-poster__header, .jobs-poster, .hiring-team-card, .job-details-jobs-unified-top-card__hiring-manager'
    );

    if (recruiterSections.length === 0) return;

    const recruiterContacts = ContactFinder.findRecruiterContacts(
      currentJobData.recruiter,
      currentJobData
    );

    if (!recruiterContacts) return;

    recruiterSections.forEach(section => {
      if (section.querySelector('.wx-recruiter-btn')) return;

      const btn = document.createElement('button');
      btn.className = 'wx-recruiter-btn';
      btn.innerHTML = `<span class="wx-rb-icon">✉️</span><span class="wx-rb-text">Contact</span>`;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showRecruiterPanel(section, recruiterContacts);
      });

      section.style.position = 'relative';
      section.appendChild(btn);
    });
  }

  function showRecruiterPanel(anchor, contacts) {
    // Remove existing panel
    document.getElementById(RECRUITER_PANEL_ID)?.remove();

    const panel = document.createElement('div');
    panel.id = RECRUITER_PANEL_ID;
    panel.className = 'wx-recruiter-panel';

    const topWork = contacts.topWorkEmail;
    const topPersonal = contacts.topPersonalEmail;

    let optionsHtml = '';

    // Work email
    if (topWork) {
      optionsHtml += `
        <button class="wx-rp-option" data-action="email-work" data-email="${escapeHtml(topWork.email)}">
          <span class="wx-rp-icon">💼</span>
          <div class="wx-rp-info">
            <span class="wx-rp-label">Work Email</span>
            <span class="wx-rp-detail">${escapeHtml(topWork.email)}</span>
          </div>
          <span class="wx-rp-conf">${topWork.confidence}%</span>
        </button>`;
    }

    // Personal email
    if (topPersonal) {
      optionsHtml += `
        <button class="wx-rp-option" data-action="email-personal" data-email="${escapeHtml(topPersonal.email)}">
          <span class="wx-rp-icon">👤</span>
          <div class="wx-rp-info">
            <span class="wx-rp-label">Personal Email</span>
            <span class="wx-rp-detail">${escapeHtml(topPersonal.email)}</span>
          </div>
          <span class="wx-rp-conf">${topPersonal.confidence}%</span>
        </button>`;
    }

    // LinkedIn message
    if (contacts.linkedinUrl) {
      optionsHtml += `
        <button class="wx-rp-option" data-action="linkedin-msg">
          <span class="wx-rp-icon">💬</span>
          <div class="wx-rp-info">
            <span class="wx-rp-label">LinkedIn Message</span>
            <span class="wx-rp-detail">Send tailored message</span>
          </div>
        </button>`;
    }

    // Phone (if any)
    contacts.phones.forEach(p => {
      const phone = typeof p === 'string' ? p : p.phone;
      optionsHtml += `
        <button class="wx-rp-option" data-action="call" data-phone="${escapeHtml(phone)}">
          <span class="wx-rp-icon">📞</span>
          <div class="wx-rp-info">
            <span class="wx-rp-label">Call</span>
            <span class="wx-rp-detail">${escapeHtml(phone)}</span>
          </div>
        </button>`;
    });

    // Copy all
    optionsHtml += `
      <button class="wx-rp-option wx-rp-copy-all" data-action="copy-all">
        <span class="wx-rp-icon">📋</span>
        <div class="wx-rp-info">
          <span class="wx-rp-label">Copy All Contact Info</span>
        </div>
      </button>`;

    panel.innerHTML = `
      <div class="wx-rp-header">
        <span class="wx-rp-name">${escapeHtml(contacts.name)}</span>
        <span class="wx-rp-title">${escapeHtml(contacts.title || '')}</span>
        <button class="wx-rp-close" id="wx-rp-close">✕</button>
      </div>
      <div class="wx-rp-body">${optionsHtml}</div>
    `;

    document.body.appendChild(panel);

    // Position near anchor
    const rect = anchor.getBoundingClientRect();
    panel.style.top = `${rect.bottom + window.scrollY + 8}px`;
    panel.style.left = `${Math.min(rect.left, window.innerWidth - 340)}px`;

    requestAnimationFrame(() => panel.classList.add('wx-rp-visible'));

    // Close
    panel.querySelector('#wx-rp-close').addEventListener('click', () => {
      panel.classList.remove('wx-rp-visible');
      setTimeout(() => panel.remove(), 200);
    });

    // Actions
    panel.querySelectorAll('.wx-rp-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const action = opt.dataset.action;

        if (action === 'email-work' || action === 'email-personal') {
          const email = opt.dataset.email;
          // Open Gmail compose via tab
          const subject = encodeURIComponent(`Re: ${currentJobData.jobTitle} at ${currentJobData.company}`);
          const body = encodeURIComponent(`Hi ${contacts.name.split(' ')[0]},\n\nI noticed the ${currentJobData.jobTitle} position at ${currentJobData.company} and wanted to express my interest.\n\nI'd love to discuss how my experience aligns with this role.\n\nBest regards`);
          window.open(`https://mail.google.com/mail/?view=cm&to=${email}&su=${subject}&body=${body}`, '_blank');
        }

        if (action === 'linkedin-msg') {
          openSidebar();
        }

        if (action === 'call') {
          window.open(`tel:${opt.dataset.phone.replace(/[^\d+]/g, '')}`, '_self');
        }

        if (action === 'copy-all') {
          const info = [];
          info.push(`Name: ${contacts.name}`);
          if (contacts.title) info.push(`Title: ${contacts.title}`);
          if (topWork) info.push(`Work Email: ${topWork.email}`);
          if (topPersonal) info.push(`Personal Email: ${topPersonal.email}`);
          contacts.phones.forEach(p => info.push(`Phone: ${typeof p === 'string' ? p : p.phone}`));
          if (contacts.linkedinUrl) info.push(`LinkedIn: ${contacts.linkedinUrl}`);
          navigator.clipboard.writeText(info.join('\n')).then(() => {
            opt.querySelector('.wx-rp-label').textContent = '✅ Copied!';
            setTimeout(() => {
              opt.querySelector('.wx-rp-label').textContent = 'Copy All Contact Info';
            }, 2000);
          });
        }
      });
    });

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', function closePanel(e) {
        if (!panel.contains(e.target) && !anchor.contains(e.target)) {
          panel.classList.remove('wx-rp-visible');
          setTimeout(() => panel.remove(), 200);
          document.removeEventListener('click', closePanel);
        }
      });
    }, 100);
  }

  // ═══════════════════════════════════════════════
  //  SEARCH & JOB LIST HANDLERS
  // ═══════════════════════════════════════════════

  function handleJobsList() {
    injectBadge('search');
  }

  function handlePeopleSearch() {
    injectBadge('search');
    injectSearchImportButton();
  }

  function injectSearchImportButton() {
    if (document.getElementById('wx-import-search-btn')) return;

    const searchHeader = document.querySelector('.search-results-container');
    if (!searchHeader) return;

    const btn = document.createElement('button');
    btn.id = 'wx-import-search-btn';
    btn.className = 'wx-search-import-btn';
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      <span>Import to Waalaxy</span>
    `;
    btn.addEventListener('click', () => {
      const results = LinkedInActions.scrapeSearchResults();
      chrome.runtime.sendMessage({
        type: 'SEARCH_RESULTS_SCRAPED',
        data: results
      }).catch(() => {});

      if (WX?.Utils) WX.Utils.showToast(`${results.length} profiles imported!`, 'success');
    });

    searchHeader.insertBefore(btn, searchHeader.firstChild);
  }

  // ═══════════════════════════════════════════════
  //  BADGE INJECTION
  // ═══════════════════════════════════════════════

  function injectBadge(type) {
    if (document.getElementById(BADGE_ID)) return;

    const badge = document.createElement('div');
    badge.id = BADGE_ID;
    badge.className = `wx-badge wx-badge-${type}`;

    const icon = type === 'job' ? '💼' : type === 'search' ? '🔍' : '🚀';

    badge.innerHTML = `
      <div class="wx-badge-inner">
        <span class="wx-badge-icon">${icon}</span>
        <span class="wx-badge-label">Waalaxy</span>
        <span class="wx-badge-pulse"></span>
      </div>
    `;

    badge.addEventListener('click', openSidebar);
    document.body.appendChild(badge);

    requestAnimationFrame(() => badge.classList.add('wx-badge-visible'));
  }

  // ═══════════════════════════════════════════════
  //  UTILITIES
  // ═══════════════════════════════════════════════

  function cleanup() {
    document.getElementById(BADGE_ID)?.remove();
    document.getElementById(CONTACT_OVERLAY_ID)?.remove();
    document.getElementById(RECRUITER_PANEL_ID)?.remove();
    document.querySelectorAll('.wx-recruiter-btn').forEach(b => b.remove());
    currentProfileData = null;
    currentJobData = null;
    contactData = null;
  }

  function openSidebar() {
    chrome.runtime.sendMessage({
      type: 'OPEN_SIDEBAR',
      data: {
        pageType: currentPageType,
        profile: currentProfileData,
        job: currentJobData,
        contacts: contactData
      }
    }).catch(() => {});
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);

      const observer = new MutationObserver((_, obs) => {
        const el = document.querySelector(selector);
        if (el) { obs.disconnect(); resolve(el); }
      });

      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => { observer.disconnect(); reject(new Error(`Timeout: ${selector}`)); }, timeout);
    });
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // ─── Message Handler ──────────────────────────

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'GET_PAGE_DATA':
        if (!currentProfileData && !currentJobData) {
          const pt = detectPageType();
          if (pt === 'profile') {
            currentProfileData = ProfileScraper.extractProfile();
            if (currentProfileData.name) {
              contactData = ContactFinder.findContacts(currentProfileData);
              currentProfileData.foundEmails = contactData.emails;
              currentProfileData.foundPhones = contactData.phones;
            }
          } else if (pt === 'job') {
            currentJobData = ProfileScraper.extractJobListing();
          }
        }
        sendResponse({
          pageType: currentPageType || detectPageType(),
          profile: currentProfileData,
          job: currentJobData,
          contacts: contactData
        });
        break;

      case 'REFRESH_DATA':
        retryCount = 0;
        cleanup();
        processCurrentPage();
        sendResponse({ ok: true });
        break;

      case 'EXTRACT_PROFILE':
        currentProfileData = ProfileScraper.extractProfile();
        if (currentProfileData.name) {
          contactData = ContactFinder.findContacts(currentProfileData);
          currentProfileData.foundEmails = contactData.emails;
          currentProfileData.foundPhones = contactData.phones;
        }
        sendResponse(currentProfileData);
        break;

      case 'SCRAPE_SEARCH_RESULTS':
        sendResponse(typeof LinkedInActions !== 'undefined'
          ? LinkedInActions.scrapeSearchResults()
          : ProfileScraper.extractSearchResults());
        break;

      case 'EXECUTE_ACTION':
        if (typeof LinkedInActions !== 'undefined') {
          LinkedInActions.execute(message.action)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
        } else {
          sendResponse({ success: false, error: 'LinkedInActions not available' });
        }
        return true;

      case 'COMPOSE_EMAIL':
        if (typeof EmailComposer !== 'undefined') {
          const result = EmailComposer.compose(message.data.service, message.data);
          sendResponse(result);
        } else {
          // Direct Gmail compose fallback
          const d = message.data;
          window.open(`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(d.to || '')}&su=${encodeURIComponent(d.subject || '')}&body=${encodeURIComponent(d.body || '')}`, '_blank');
          sendResponse({ success: true });
        }
        break;
    }
    return true;
  });

  // ─── Start ────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 500));
  } else {
    setTimeout(init, 500);
  }

})();
