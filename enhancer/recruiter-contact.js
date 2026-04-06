/**
 * Waalaxy LinkedIn Enhancer - Recruiter Quick Contact Module
 * Adds contact icons next to recruiter profiles on job listings
 */
(function() {
  'use strict';

  var ICONS = {
    rocket: '<svg viewBox="0 0 24 24" fill="#fff" width="18" height="18"><path d="M12 2.5c-3.81 0-7.24 1.47-9.83 3.85L12 16.73l9.83-10.38C19.24 3.97 15.81 2.5 12 2.5zM3.15 7.33L12 18.69l8.85-11.36c-.59.35-1.2.66-1.85.92L12 16.73 4.99 8.25c-.65-.26-1.26-.57-1.84-.92zM12 22l-4-4h8l-4 4z"/></svg>',
    email: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007bff" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 4l10 8 10-8"/></svg>',
    phone: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>',
    linkedin: '<svg width="16" height="16" viewBox="0 0 24 24" fill="#0a66c2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    work: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff9f43" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>',
    draft: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'
  };

  // Find recruiter/hirer elements on job pages
  function findRecruiterElements() {
    var selectors = [
      '.hirer-card__hirer-information',
      '.jobs-poster__header',
      '[class*="hiring-team"]',
      '[class*="hirer-card"]',
      '.job-details-jobs-unified-top-card__hiring-manager',
      '.jobs-details__main-content [class*="hirer"]'
    ];

    var elements = [];
    selectors.forEach(function(sel) {
      document.querySelectorAll(sel).forEach(function(el) {
        if (!el.querySelector('.wlx-recruiter-icon')) {
          elements.push(el);
        }
      });
    });
    return elements;
  }

  // Create the quick-contact icon with dropdown
  function createRecruiterIcon(recruiterEl) {
    // Extract recruiter info
    var nameEl = recruiterEl.querySelector('a[href*="/in/"]') ||
                 recruiterEl.querySelector('.jobs-poster__name') ||
                 recruiterEl.querySelector('strong') ||
                 recruiterEl.querySelector('[class*="name"]');

    var name = nameEl ? nameEl.textContent.trim() : 'Recruiter';
    var profileLink = '';
    var linkEl = recruiterEl.querySelector('a[href*="/in/"]');
    if (linkEl) profileLink = linkEl.getAttribute('href');

    var publicId = '';
    if (profileLink) {
      var match = profileLink.match(/\/in\/([^/?]+)/);
      if (match) publicId = match[1];
    }

    // Get job data for context
    var jobData = WLX.utils.extractJobData();

    // Create the icon button
    var iconBtn = document.createElement('div');
    iconBtn.className = 'wlx-recruiter-icon';
    iconBtn.title = 'Quick Contact ' + name;
    iconBtn.innerHTML = ICONS.rocket;

    // Create dropdown
    var dropdown = document.createElement('div');
    dropdown.className = 'wlx-recruiter-dropdown';

    dropdown.innerHTML =
      '<div style="padding:8px 12px;font-size:12px;color:#00d4aa;font-weight:700;border-bottom:1px solid #30363d;margin-bottom:4px">' +
      'Contact ' + name + '</div>' +

      '<div class="wlx-recruiter-dropdown-item" data-action="tailored-email">' +
      '<div class="wlx-contact-item-icon email">' + ICONS.email + '</div>' +
      '<div><div style="font-weight:600">Send Tailored Email</div>' +
      '<div style="font-size:11px;color:#8b949e">AI-crafted for this job posting</div></div></div>' +

      '<div class="wlx-recruiter-dropdown-item" data-action="work-email">' +
      '<div class="wlx-contact-item-icon work-email">' + ICONS.work + '</div>' +
      '<div><div style="font-weight:600">Find Work Email</div>' +
      '<div style="font-size:11px;color:#8b949e">Guess company email pattern</div></div></div>' +

      '<div class="wlx-recruiter-dropdown-item" data-action="linkedin-msg">' +
      '<div class="wlx-contact-item-icon" style="background:rgba(10,102,194,0.2)">' + ICONS.linkedin + '</div>' +
      '<div><div style="font-weight:600">LinkedIn Message</div>' +
      '<div style="font-size:11px;color:#8b949e">Tailored connection request</div></div></div>' +

      '<div class="wlx-recruiter-dropdown-item" data-action="phone">' +
      '<div class="wlx-contact-item-icon phone">' + ICONS.phone + '</div>' +
      '<div><div style="font-weight:600">Find Phone Number</div>' +
      '<div style="font-size:11px;color:#8b949e">Lookup direct number</div></div></div>' +

      (profileLink ?
      '<a href="' + profileLink + '" target="_blank" class="wlx-recruiter-dropdown-item">' +
      '<div class="wlx-contact-item-icon" style="background:rgba(10,102,194,0.2)">' + ICONS.linkedin + '</div>' +
      '<div><div style="font-weight:600">View Full Profile</div>' +
      '<div style="font-size:11px;color:#8b949e">Open LinkedIn profile</div></div></a>' : '');

    // Toggle dropdown on click
    iconBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      // Close other dropdowns
      document.querySelectorAll('.wlx-recruiter-dropdown.active').forEach(function(d) {
        if (d !== dropdown) d.classList.remove('active');
      });
      dropdown.classList.toggle('active');
    });

    // Handle dropdown item clicks
    dropdown.addEventListener('click', function(e) {
      var item = e.target.closest('[data-action]');
      if (!item) return;
      e.preventDefault();
      e.stopPropagation();

      var action = item.getAttribute('data-action');
      dropdown.classList.remove('active');

      switch(action) {
        case 'tailored-email':
          WLX.outreach.openDraft('job-email', {
            recruiterName: name,
            publicIdentifier: publicId,
            jobData: jobData
          });
          break;
        case 'work-email':
          handleWorkEmailLookup(publicId, name, jobData);
          break;
        case 'linkedin-msg':
          WLX.outreach.openDraft('job-linkedin', {
            recruiterName: name,
            publicIdentifier: publicId,
            jobData: jobData
          });
          break;
        case 'phone':
          handlePhoneLookup(publicId, name);
          break;
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
      dropdown.classList.remove('active');
    });

    // Append icon and dropdown
    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:inline-flex;position:relative;vertical-align:middle;';
    wrapper.appendChild(iconBtn);
    wrapper.appendChild(dropdown);

    // Insert after recruiter name or at end of element
    if (nameEl && nameEl.parentNode) {
      nameEl.parentNode.insertBefore(wrapper, nameEl.nextSibling);
    } else {
      recruiterEl.appendChild(wrapper);
    }
  }

  // Handle work email lookup
  function handleWorkEmailLookup(publicId, name, jobData) {
    if (!publicId) {
      var nameParts = name.split(' ');
      var company = jobData.company || '';
      var emails = WLX.utils.guessEmails(nameParts[0], nameParts.slice(1).join(' '), company);
      showEmailResults(emails, name, company);
      return;
    }

    WLX.utils.showToast('Looking up work email for ' + name + '...');

    WLX.contactEnrichment.fetchProfileDetails(publicId).then(function(details) {
      var fn = details.firstName || name.split(' ')[0];
      var ln = details.lastName || name.split(' ').slice(1).join(' ');
      var company = details.company || jobData.company || '';
      var emails = WLX.utils.guessEmails(fn, ln, company);

      // Also fetch real contact info
      return WLX.contactEnrichment.fetchContactInfo(publicId).then(function(contact) {
        if (contact.emails.length > 0) {
          contact.emails.forEach(function(e) {
            if (emails.indexOf(e.value) === -1) emails.unshift(e.value);
          });
        }
        showEmailResults(emails, name, company);
      });
    });
  }

  function showEmailResults(emails, name, company) {
    if (emails.length === 0) {
      WLX.utils.showToast('Could not determine email pattern for ' + name);
      return;
    }
    WLX.outreach.openDraft('email', {
      recruiterName: name,
      emails: emails,
      company: company
    });
  }

  // Handle phone lookup
  function handlePhoneLookup(publicId, name) {
    if (!publicId) {
      WLX.utils.showToast('Visit their profile to find phone number');
      return;
    }

    WLX.utils.showToast('Looking up phone for ' + name + '...');

    WLX.contactEnrichment.fetchContactInfo(publicId).then(function(contact) {
      if (contact.phones.length > 0) {
        var phone = contact.phones[0].value;
        WLX.utils.showToast('Phone found: ' + phone + ' - Copied!');
        WLX.utils.copyToClipboard(phone);
      } else {
        WLX.utils.showToast('No phone number available for ' + name + '. Try visiting their profile.');
      }
    });
  }

  // Inject recruiter icons on job pages
  function injectRecruiterIcons() {
    if (!WLX.utils.isJobPage()) return;

    var recruiterEls = findRecruiterElements();
    recruiterEls.forEach(function(el) {
      createRecruiterIcon(el);
    });
  }

  // Also inject icons on search results with recruiter badges
  function injectSearchResultIcons() {
    if (!WLX.utils.isSearchPage() && !WLX.utils.isJobPage()) return;

    // Find job cards in search results
    document.querySelectorAll('.job-card-container, .jobs-search-results__list-item').forEach(function(card) {
      if (card.querySelector('.wlx-recruiter-icon')) return;

      var recruiterEl = card.querySelector('[class*="hiring-team"]') ||
                        card.querySelector('[class*="hirer"]');
      if (recruiterEl) {
        createRecruiterIcon(recruiterEl);
      }
    });
  }

  WLX.recruiter = {
    init: function() {
      setTimeout(function() {
        injectRecruiterIcons();
        injectSearchResultIcons();
      }, 2500);

      // Re-inject on scroll (lazy loaded content)
      var scrollTimer;
      window.addEventListener('scroll', function() {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function() {
          injectRecruiterIcons();
          injectSearchResultIcons();
        }, 500);
      });
    },
    injectRecruiterIcons: injectRecruiterIcons
  };
})();
