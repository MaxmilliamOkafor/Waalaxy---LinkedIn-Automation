/**
 * Waalaxy LinkedIn Automation Tool — Shared Utilities
 * Common helpers used across all modules.
 */

const WX = window.WX || {};

WX.Utils = {
  /**
   * Generate a unique ID
   */
  uid(prefix = '') {
    return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  },

  /**
   * Sleep / delay
   */
  sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  },

  /**
   * Human-like random delay between min and max ms
   */
  humanDelay(min = 2000, max = 6000) {
    const ms = min + Math.random() * (max - min);
    return new Promise(r => setTimeout(r, ms));
  },

  /**
   * Debounce function
   */
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  /**
   * Throttle function
   */
  throttle(fn, limit = 300) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Clean text — collapse whitespace
   */
  clean(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
  },

  /**
   * Format date relative (e.g., "2 hours ago")
   */
  timeAgo(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    const intervals = [
      { label: 'y', seconds: 31536000 },
      { label: 'mo', seconds: 2592000 },
      { label: 'w', seconds: 604800 },
      { label: 'd', seconds: 86400 },
      { label: 'h', seconds: 3600 },
      { label: 'm', seconds: 60 }
    ];

    for (const i of intervals) {
      const count = Math.floor(seconds / i.seconds);
      if (count >= 1) return `${count}${i.label} ago`;
    }
    return 'just now';
  },

  /**
   * Format number with comma separators
   */
  formatNum(n) {
    return (n || 0).toLocaleString();
  },

  /**
   * Truncate text
   */
  truncate(str, len = 100) {
    if (!str || str.length <= len) return str || '';
    return str.substring(0, len - 3) + '...';
  },

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    }
  },

  /**
   * Show a toast notification on the page
   */
  showToast(message, type = 'info', duration = 3000) {
    const existing = document.getElementById('wx-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'wx-toast';
    toast.className = `wx-toast wx-toast-${type}`;

    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    toast.innerHTML = `<span class="wx-toast-icon">${icons[type] || 'ℹ️'}</span><span class="wx-toast-msg">${message}</span>`;

    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('wx-toast-visible'));

    setTimeout(() => {
      toast.classList.remove('wx-toast-visible');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  /**
   * Sanitize a string for HTML display
   */
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },

  /**
   * Parse CSV text into array of objects
   */
  parseCSV(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
    const results = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].match(/(".*?"|[^,]+)/g) || [];
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = (values[idx] || '').replace(/^"|"$/g, '').trim();
      });
      results.push(obj);
    }

    return results;
  },

  /**
   * Map CSV column names to our lead fields
   */
  mapCSVToLeads(csvRows) {
    const fieldMap = {
      name: ['name', 'full name', 'fullname', 'contact name', 'lead name'],
      firstName: ['first name', 'firstname', 'first', 'given name'],
      lastName: ['last name', 'lastname', 'last', 'surname', 'family name'],
      title: ['title', 'job title', 'position', 'role', 'headline'],
      company: ['company', 'organization', 'org', 'employer', 'company name'],
      email: ['email', 'e-mail', 'email address', 'mail'],
      phone: ['phone', 'telephone', 'tel', 'mobile', 'phone number'],
      linkedinUrl: ['linkedin', 'linkedin url', 'linkedin profile', 'profile url', 'url'],
      location: ['location', 'city', 'region', 'country']
    };

    return csvRows.map(row => {
      const lead = {};
      for (const [field, aliases] of Object.entries(fieldMap)) {
        for (const alias of aliases) {
          if (row[alias] !== undefined && row[alias]) {
            lead[field] = row[alias];
            break;
          }
        }
      }

      // Build full name if we have first + last
      if (!lead.name && (lead.firstName || lead.lastName)) {
        lead.name = `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
      }

      // Split name into first/last if not already
      if (lead.name && !lead.firstName) {
        const parts = lead.name.split(' ');
        lead.firstName = parts[0] || '';
        lead.lastName = parts.slice(1).join(' ') || '';
      }

      return lead;
    }).filter(l => l.name || l.email || l.linkedinUrl);
  }
};

window.WX = WX;
