/**
 * Waalaxy Unlimited - Web App Modifier
 * Injects into app.waalaxy.com to remove all credit/plan limitations from the UI
 */
(function() {
  'use strict';

  const UNLIMITED_LABEL = '\u221E Unlimited';
  const POLL_INTERVAL = 1500;

  // Override credit/coin/token displays to show Unlimited
  function overrideCreditDisplays() {
    // Target the top nav bar credit badge (e.g., "25 credits")
    const allElements = document.querySelectorAll('button, span, div, a, p');
    allElements.forEach(el => {
      const text = el.textContent.trim();
      // Match patterns like "25 credits", "0 credits", "100 coins", "5 tokens"
      if (/^\d+\s*(credits?|coins?|tokens?|cr[eé]dits?)$/i.test(text)) {
        el.textContent = UNLIMITED_LABEL;
        el.style.color = '#00d4aa';
        el.style.fontWeight = 'bold';
      }
    });

    // Target specific Waalaxy credit badge with coin icon
    document.querySelectorAll('[class*="credit"], [class*="coin"], [class*="token"], [data-testid*="credit"]').forEach(el => {
      const text = el.textContent.trim();
      if (/\d+\s*(credits?|coins?|tokens?)/i.test(text)) {
        el.innerHTML = el.innerHTML.replace(/\d+\s*(credits?|coins?|tokens?)/gi, UNLIMITED_LABEL);
        el.style.color = '#00d4aa';
      }
    });
  }

  // Override plan/subscription displays
  function overridePlanDisplays() {
    const planKeywords = ['freemium', 'free trial', 'free plan', 'starter', 'basic plan', 'trial ended', 'trial expires', 'subscribe', 'upgrade'];
    const allElements = document.querySelectorAll('span, div, p, h1, h2, h3, h4, button, a');
    allElements.forEach(el => {
      if (el.children.length > 2) return; // Skip containers
      const text = el.textContent.trim().toLowerCase();
      planKeywords.forEach(keyword => {
        if (text === keyword || text === `${keyword} plan`) {
          el.textContent = 'Business Plan';
          el.style.color = '#00d4aa';
        }
      });
    });
  }

  // Hide upgrade/subscribe banners and modals
  function hideUpgradeBanners() {
    const selectors = [
      '[class*="upgrade"]', '[class*="Upgrade"]',
      '[class*="paywall"]', '[class*="Paywall"]',
      '[class*="subscribe-banner"]',
      '[class*="trial-banner"]', '[class*="TrialBanner"]',
      '[class*="limit-reached"]', '[class*="LimitReached"]',
      '[class*="quota-warning"]', '[class*="QuotaWarning"]',
      '[data-testid*="upgrade"]', '[data-testid*="paywall"]',
      '[data-testid*="subscribe-modal"]'
    ];

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        const text = (el.textContent || '').toLowerCase();
        if (text.includes('upgrade') || text.includes('subscribe') || text.includes('limit reached') || text.includes('quota')) {
          // Only hide if it's a banner/modal, not a nav item
          if (el.offsetHeight > 40 || el.classList.toString().includes('modal') || el.classList.toString().includes('banner')) {
            el.style.display = 'none';
          }
        }
      });
    });
  }

  // Override the "Subscribe" button in the top nav to show "Business"
  function overrideSubscribeButton() {
    document.querySelectorAll('button, a').forEach(el => {
      const text = el.textContent.trim().toLowerCase();
      if (text === 'subscribe' || text === 'upgrade' || text === 'upgrade now') {
        el.textContent = 'Business';
        el.style.background = 'linear-gradient(135deg, #00d4aa 0%, #007bff 100%)';
        el.style.color = '#fff';
        el.style.border = 'none';
        el.style.pointerEvents = 'none';
      }
    });
  }

  // Intercept and modify fetch/XHR responses for plan/credit data
  function interceptAPIResponses() {
    // Override fetch
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const response = await originalFetch.apply(this, args);
      const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');

      if (url.includes('/plans') || url.includes('/subscription') || url.includes('/credits') ||
          url.includes('/quotas') || url.includes('/free-trial') || url.includes('/user/me') ||
          url.includes('/isAllowedTo')) {
        const clone = response.clone();
        try {
          const data = await clone.json();
          const modified = modifyAPIResponse(url, data);
          return new Response(JSON.stringify(modified), {
            status: 200,
            statusText: 'OK',
            headers: response.headers
          });
        } catch(e) {
          return response;
        }
      }
      return response;
    };

    // Override XMLHttpRequest
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      this._interceptUrl = url;
      return origOpen.call(this, method, url, ...rest);
    };

    XMLHttpRequest.prototype.send = function(...args) {
      if (this._interceptUrl && (
        this._interceptUrl.includes('/plans') ||
        this._interceptUrl.includes('/subscription') ||
        this._interceptUrl.includes('/credits') ||
        this._interceptUrl.includes('/quotas') ||
        this._interceptUrl.includes('/isAllowedTo')
      )) {
        this.addEventListener('readystatechange', function() {
          if (this.readyState === 4) {
            try {
              const data = JSON.parse(this.responseText);
              const modified = modifyAPIResponse(this._interceptUrl, data);
              Object.defineProperty(this, 'responseText', { value: JSON.stringify(modified) });
              Object.defineProperty(this, 'response', { value: JSON.stringify(modified) });
            } catch(e) {}
          }
        });
      }
      return origSend.apply(this, args);
    };
  }

  function modifyAPIResponse(url, data) {
    if (!data || typeof data !== 'object') return data;

    // Modify plan data
    if (url.includes('/plans') || url.includes('/subscription')) {
      if (data.planName) data.planName = 'business';
      if (data.plan) data.plan = 'business';
      if (data.name) data.name = 'business';
      if (data.role) data.role = 'business_role';
      if (data.isTrial !== undefined) data.isTrial = false;
      if (data.isPremium !== undefined) data.isPremium = true;
      if (data.expirationDate) data.expirationDate = '2099-12-31T23:59:59.999Z';
    }

    // Modify credit data
    if (url.includes('/credits') || url.includes('/quotas')) {
      if (data.remaining !== undefined) data.remaining = 999999;
      if (data.used !== undefined) data.used = 0;
      if (data.limit !== undefined) data.limit = 999999;
      if (data.max !== undefined) data.max = 999999;
      if (data.current !== undefined) data.current = 0;
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (item.remaining !== undefined) item.remaining = 999999;
          if (item.limit !== undefined) item.limit = 999999;
          if (item.max !== undefined) item.max = 999999;
          if (item.used !== undefined) item.used = 0;
          if (item.current !== undefined) item.current = 0;
          if (item.value !== undefined && typeof item.value === 'number') item.value = 999999;
        });
      }
    }

    // Modify isAllowedTo
    if (url.includes('/isAllowedTo')) {
      if (data.isAllowed !== undefined) data.isAllowed = true;
      if (data.allowed !== undefined) data.allowed = true;
      data.isAllowed = true;
    }

    // Modify free trial
    if (url.includes('/free-trial')) {
      data.isTrial = false;
      data.isPremium = true;
    }

    // Modify user data
    if (url.includes('/user/me')) {
      if (data.isPremiumSubscriber !== undefined) data.isPremiumSubscriber = true;
      if (data.freeTrial) data.freeTrial = null;
      if (data.hasAccessToAIGeneration !== undefined) data.hasAccessToAIGeneration = true;
    }

    return data;
  }

  // Run everything
  function init() {
    interceptAPIResponses();

    // Initial run
    setTimeout(() => {
      overrideCreditDisplays();
      overridePlanDisplays();
      hideUpgradeBanners();
      overrideSubscribeButton();
    }, 2000);

    // Continuous polling for dynamic content
    setInterval(() => {
      overrideCreditDisplays();
      overridePlanDisplays();
      hideUpgradeBanners();
      overrideSubscribeButton();
    }, POLL_INTERVAL);

    // MutationObserver for real-time updates
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0 || mutation.type === 'characterData') {
          shouldUpdate = true;
          break;
        }
      }
      if (shouldUpdate) {
        overrideCreditDisplays();
        overridePlanDisplays();
        overrideSubscribeButton();
      }
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
