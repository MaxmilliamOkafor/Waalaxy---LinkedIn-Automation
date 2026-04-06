/**
 * Waalaxy LinkedIn Enhancer - Utility Functions
 */
const WLX = window.WLX || {};
window.WLX = WLX;

WLX.utils = {
  // Show toast notification
  showToast: function(message, duration) {
    duration = duration || 3000;
    var existing = document.querySelector('.wlx-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'wlx-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, duration);
  },

  // Copy text to clipboard
  copyToClipboard: function(text) {
    navigator.clipboard.writeText(text).then(function() {
      WLX.utils.showToast('Copied: ' + text);
    });
  },

  // Wait for element to appear
  waitForElement: function(selector, timeout) {
    timeout = timeout || 10000;
    return new Promise(function(resolve, reject) {
      var el = document.querySelector(selector);
      if (el) return resolve(el);
      var observer = new MutationObserver(function(mutations, obs) {
        var el = document.querySelector(selector);
        if (el) { obs.disconnect(); resolve(el); }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(function() { observer.disconnect(); reject(new Error('Timeout')); }, timeout);
    });
  },

  // Extract profile data from current LinkedIn page
  extractProfileData: function() {
    var data = {
      name: '',
      firstName: '',
      lastName: '',
      headline: '',
      company: '',
      location: '',
      profileUrl: window.location.href,
      publicIdentifier: ''
    };

    // Get name
    var nameEl = document.querySelector('h1.text-heading-xlarge') ||
                 document.querySelector('.pv-top-card--list li') ||
                 document.querySelector('[data-anonymize="person-name"]');
    if (nameEl) {
      data.name = nameEl.textContent.trim();
      var parts = data.name.split(' ');
      data.firstName = parts[0] || '';
      data.lastName = parts.slice(1).join(' ') || '';
    }

    // Get headline
    var headlineEl = document.querySelector('.text-body-medium.break-words') ||
                     document.querySelector('[data-anonymize="headline"]');
    if (headlineEl) data.headline = headlineEl.textContent.trim();

    // Get company
    var companyEl = document.querySelector('.pv-top-card--experience-list-item') ||
                    document.querySelector('[data-anonymize="company-name"]');
    if (companyEl) data.company = companyEl.textContent.trim();

    // Get location
    var locationEl = document.querySelector('.text-body-small.inline.t-black--light.break-words') ||
                     document.querySelector('[data-anonymize="location"]');
    if (locationEl) data.location = locationEl.textContent.trim();

    // Get public identifier from URL
    var match = window.location.pathname.match(/\/in\/([^/]+)/);
    if (match) data.publicIdentifier = match[1];

    return data;
  },

  // Extract job listing data
  extractJobData: function() {
    var data = {
      title: '',
      company: '',
      location: '',
      description: '',
      recruiterName: '',
      jobUrl: window.location.href
    };

    var titleEl = document.querySelector('.job-details-jobs-unified-top-card__job-title h1') ||
                  document.querySelector('.jobs-unified-top-card__job-title') ||
                  document.querySelector('.t-24.t-bold.inline');
    if (titleEl) data.title = titleEl.textContent.trim();

    var companyEl = document.querySelector('.job-details-jobs-unified-top-card__company-name') ||
                    document.querySelector('.jobs-unified-top-card__company-name');
    if (companyEl) data.company = companyEl.textContent.trim();

    var locationEl = document.querySelector('.job-details-jobs-unified-top-card__bullet') ||
                     document.querySelector('.jobs-unified-top-card__bullet');
    if (locationEl) data.location = locationEl.textContent.trim();

    var descEl = document.querySelector('.jobs-description__content') ||
                 document.querySelector('.jobs-box__html-content');
    if (descEl) data.description = descEl.textContent.trim().substring(0, 500);

    // Find recruiter/poster name
    var recruiterEl = document.querySelector('.jobs-poster__name') ||
                      document.querySelector('.hirer-card__hirer-information a') ||
                      document.querySelector('[class*="hiring-team"] a');
    if (recruiterEl) data.recruiterName = recruiterEl.textContent.trim();

    return data;
  },

  // Generate email pattern guesses from name and company
  guessEmails: function(firstName, lastName, company) {
    if (!firstName || !company) return [];
    var f = firstName.toLowerCase().replace(/[^a-z]/g, '');
    var l = lastName ? lastName.toLowerCase().replace(/[^a-z]/g, '') : '';
    var domain = company.toLowerCase()
      .replace(/\s*(inc|ltd|llc|corp|co|group|gmbh|sa|plc)\.?$/i, '')
      .replace(/[^a-z0-9]/g, '') + '.com';

    var emails = [];
    if (f && l) {
      emails.push(f + '.' + l + '@' + domain);
      emails.push(f + l + '@' + domain);
      emails.push(f[0] + l + '@' + domain);
      emails.push(f + '@' + domain);
      emails.push(f + '_' + l + '@' + domain);
      emails.push(l + '.' + f + '@' + domain);
    } else if (f) {
      emails.push(f + '@' + domain);
    }
    return emails;
  },

  // Check if on a profile page
  isProfilePage: function() {
    return /\/in\/[^/]+/.test(window.location.pathname);
  },

  // Check if on a job listing page
  isJobPage: function() {
    return /\/jobs\//.test(window.location.pathname);
  },

  // Check if on search results
  isSearchPage: function() {
    return /\/search\//.test(window.location.pathname);
  },

  // Get CSRF token from cookies
  getCSRFToken: function() {
    var match = document.cookie.match(/JSESSIONID="?([^";]+)"?/);
    return match ? match[1] : '';
  },

  // LinkedIn API call helper
  linkedinAPI: function(url, method) {
    method = method || 'GET';
    return fetch(url, {
      method: method,
      headers: {
        'csrf-token': WLX.utils.getCSRFToken(),
        'x-restli-protocol-version': '2.0.0'
      },
      credentials: 'include'
    }).then(function(r) { return r.json(); });
  }
};
