/**
 * Waalaxy LinkedIn Enhancer - Contact Enrichment Module
 * Extracts and displays real email/phone from LinkedIn profiles
 */
(function() {
  'use strict';

  var PANEL_ID = 'wlx-contact-enrichment-panel';

  // SVG Icons
  var ICONS = {
    email: '<svg viewBox="0 0 24 24" fill="none" stroke="#007bff" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 4l10 8 10-8"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="#00d4aa" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>',
    work: '<svg viewBox="0 0 24 24" fill="none" stroke="#ff9f43" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>',
    copy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
    draft: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    contact: '<svg viewBox="0 0 24 24" fill="#00d4aa"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
    rocket: '<svg viewBox="0 0 24 24" fill="#00d4aa"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
  };

  // Fetch contact info from LinkedIn's contact info API
  function fetchContactInfo(publicIdentifier) {
    var csrfToken = WLX.utils.getCSRFToken();
    var url = 'https://www.linkedin.com/voyager/api/identity/profiles/' +
              publicIdentifier + '/profileContactInfo';

    return fetch(url, {
      headers: {
        'csrf-token': csrfToken,
        'x-restli-protocol-version': '2.0.0',
        'accept': 'application/vnd.linkedin.normalized+json+2.1'
      },
      credentials: 'include'
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var result = {
        emails: [],
        phones: [],
        websites: [],
        twitter: '',
        address: ''
      };

      if (data.data) {
        var d = data.data;
        if (d.emailAddress) result.emails.push({ value: d.emailAddress, type: 'personal' });
        if (d.phoneNumbers) {
          d.phoneNumbers.forEach(function(p) {
            result.phones.push({ value: p.number, type: p.type || 'mobile' });
          });
        }
        if (d.websites) {
          d.websites.forEach(function(w) {
            result.websites.push({ value: w.url, type: w.type && w.type.category || 'website' });
          });
        }
        if (d.twitterHandles && d.twitterHandles.length > 0) {
          result.twitter = d.twitterHandles[0].name;
        }
        if (d.address) result.address = d.address;
      }

      // Also check the included array
      if (data.included) {
        data.included.forEach(function(item) {
          if (item.emailAddress && result.emails.findIndex(function(e) { return e.value === item.emailAddress; }) === -1) {
            result.emails.push({ value: item.emailAddress, type: 'personal' });
          }
          if (item.phoneNumbers) {
            item.phoneNumbers.forEach(function(p) {
              if (result.phones.findIndex(function(ph) { return ph.value === p.number; }) === -1) {
                result.phones.push({ value: p.number, type: p.type || 'mobile' });
              }
            });
          }
        });
      }

      return result;
    })
    .catch(function(err) {
      console.log('[WLX] Contact info fetch error:', err);
      return { emails: [], phones: [], websites: [], twitter: '', address: '' };
    });
  }

  // Fetch additional profile data for email guessing
  function fetchProfileDetails(publicIdentifier) {
    var csrfToken = WLX.utils.getCSRFToken();
    var url = 'https://www.linkedin.com/voyager/api/identity/profiles/' + publicIdentifier;

    return fetch(url, {
      headers: {
        'csrf-token': csrfToken,
        'x-restli-protocol-version': '2.0.0',
        'accept': 'application/vnd.linkedin.normalized+json+2.1'
      },
      credentials: 'include'
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var result = { firstName: '', lastName: '', company: '', industryName: '' };
      if (data.data) {
        result.firstName = data.data.firstName || '';
        result.lastName = data.data.lastName || '';
        result.industryName = data.data.industryName || '';
      }
      if (data.included) {
        data.included.forEach(function(item) {
          if (item.$type && item.$type.includes('Company') && item.name) {
            result.company = item.name;
          }
          if (item.$type && item.$type.includes('Position') && item.companyName && !result.company) {
            result.company = item.companyName;
          }
        });
      }
      return result;
    })
    .catch(function() {
      return { firstName: '', lastName: '', company: '', industryName: '' };
    });
  }

  // Build the contact panel HTML
  function buildContactPanel(contactInfo, profileData, guessedEmails) {
    var html = '<div class="wlx-contact-panel" id="' + PANEL_ID + '">';
    html += '<div class="wlx-contact-panel-header">' + ICONS.contact +
            ' <span>Contact Information</span>' +
            '<span class="wlx-unlimited-badge" style="margin-left:auto">UNLIMITED</span></div>';

    // Real emails
    contactInfo.emails.forEach(function(email) {
      html += buildContactItem(email.value, email.type + ' email', 'email', ICONS.email, email.value);
    });

    // Real phones
    contactInfo.phones.forEach(function(phone) {
      html += buildContactItem(phone.value, phone.type, 'phone', ICONS.phone, phone.value);
    });

    // Guessed work emails
    if (guessedEmails && guessedEmails.length > 0) {
      html += '<div style="padding:8px 12px;font-size:11px;color:#8b949e;margin-top:8px;">' +
              'Probable Work Emails (based on name + company pattern)</div>';
      guessedEmails.forEach(function(email) {
        html += buildContactItem(email, 'work email (estimated)', 'work-email', ICONS.work, email);
      });
    }

    // Websites
    if (contactInfo.websites && contactInfo.websites.length > 0) {
      contactInfo.websites.forEach(function(site) {
        html += '<a href="' + site.value + '" target="_blank" class="wlx-contact-item">' +
                '<div class="wlx-contact-item-icon email">' + ICONS.email + '</div>' +
                '<div class="wlx-contact-item-details">' +
                '<div class="wlx-contact-item-label">' + site.type + '</div>' +
                '<div class="wlx-contact-item-value">' + site.value + '</div>' +
                '</div></a>';
      });
    }

    // Twitter
    if (contactInfo.twitter) {
      html += '<a href="https://twitter.com/' + contactInfo.twitter + '" target="_blank" class="wlx-contact-item">' +
              '<div class="wlx-contact-item-icon email" style="background:rgba(29,161,242,0.2)">' +
              '<svg viewBox="0 0 24 24" fill="#1DA1F2" width="16" height="16"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>' +
              '</div>' +
              '<div class="wlx-contact-item-details">' +
              '<div class="wlx-contact-item-label">Twitter</div>' +
              '<div class="wlx-contact-item-value">@' + contactInfo.twitter + '</div>' +
              '</div></a>';
    }

    // Quick outreach buttons
    html += '<div style="padding:10px 0 4px;display:flex;gap:6px;flex-wrap:wrap">';

    if (contactInfo.emails.length > 0) {
      html += '<button class="wlx-action-btn primary" onclick="WLX.outreach.openDraft(\'email\')">' +
              ICONS.draft + ' Draft Tailored Email</button>';
    }
    if (guessedEmails && guessedEmails.length > 0 && contactInfo.emails.length === 0) {
      html += '<button class="wlx-action-btn primary" onclick="WLX.outreach.openDraft(\'email\')">' +
              ICONS.draft + ' Draft Work Email</button>';
    }
    html += '<button class="wlx-action-btn" onclick="WLX.outreach.openDraft(\'linkedin\')">' +
            ICONS.draft + ' Draft LinkedIn Message</button>';
    if (contactInfo.phones.length > 0) {
      html += '<a class="wlx-action-btn" href="tel:' + contactInfo.phones[0].value + '">' +
              ICONS.phone + ' Call</a>';
    }
    html += '</div>';

    html += '</div>';
    return html;
  }

  function buildContactItem(value, label, type, icon, rawValue) {
    return '<div class="wlx-contact-item" onclick="event.stopPropagation()">' +
           '<div class="wlx-contact-item-icon ' + type + '">' + icon + '</div>' +
           '<div class="wlx-contact-item-details">' +
           '<div class="wlx-contact-item-label">' + label + '</div>' +
           '<div class="wlx-contact-item-value">' + value + '</div>' +
           '</div>' +
           '<div class="wlx-contact-actions">' +
           '<button class="wlx-action-btn" onclick="WLX.utils.copyToClipboard(\'' + rawValue.replace(/'/g, "\\'") + '\')">' +
           ICONS.copy + ' Copy</button>' +
           (type.indexOf('email') !== -1 ?
             '<a class="wlx-action-btn" href="mailto:' + rawValue + '" target="_blank">' + ICONS.draft + ' Email</a>' : '') +
           '</div></div>';
  }

  // Inject the contact panel into a profile page
  function injectContactPanel() {
    if (!WLX.utils.isProfilePage()) return;
    if (document.getElementById(PANEL_ID)) return;

    var profileData = WLX.utils.extractProfileData();
    if (!profileData.publicIdentifier) return;

    // Show loading panel immediately
    var target = document.querySelector('.pv-top-card') ||
                 document.querySelector('[class*="artdeco-card"]') ||
                 document.querySelector('main section');
    if (!target) return;

    var loadingDiv = document.createElement('div');
    loadingDiv.id = PANEL_ID;
    loadingDiv.className = 'wlx-contact-panel';
    loadingDiv.innerHTML = '<div class="wlx-contact-panel-header">' + ICONS.contact +
                          ' <span>Loading contact info...</span>' +
                          '<div class="wlx-spinner"></div></div>';
    target.parentNode.insertBefore(loadingDiv, target.nextSibling);

    // Fetch real contact info and profile details in parallel
    Promise.all([
      fetchContactInfo(profileData.publicIdentifier),
      fetchProfileDetails(profileData.publicIdentifier)
    ]).then(function(results) {
      var contactInfo = results[0];
      var details = results[1];

      // Store for outreach use
      WLX.currentProfile = profileData;
      WLX.currentContact = contactInfo;
      WLX.currentDetails = details;

      // Generate guessed work emails
      var fn = details.firstName || profileData.firstName;
      var ln = details.lastName || profileData.lastName;
      var company = details.company || profileData.company;
      var guessedEmails = WLX.utils.guessEmails(fn, ln, company);

      // Replace loading panel with full panel
      var panel = document.getElementById(PANEL_ID);
      if (panel) {
        panel.outerHTML = buildContactPanel(contactInfo, profileData, guessedEmails);
      }
    });
  }

  // Watch for page navigation (LinkedIn is an SPA)
  var lastUrl = '';
  function watchForNavigation() {
    setInterval(function() {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        // Remove old panel
        var old = document.getElementById(PANEL_ID);
        if (old) old.remove();
        // Wait a moment for page to load then inject
        setTimeout(injectContactPanel, 1500);
        setTimeout(function() { WLX.recruiter.injectRecruiterIcons(); }, 2000);
      }
    }, 1000);
  }

  // Initialize
  WLX.contactEnrichment = {
    init: function() {
      setTimeout(injectContactPanel, 2000);
      watchForNavigation();
    },
    fetchContactInfo: fetchContactInfo,
    fetchProfileDetails: fetchProfileDetails
  };
})();
