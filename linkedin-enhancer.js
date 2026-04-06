/**
 * Waalaxy LinkedIn Enhancer - Main Entry Point
 * Loads all enhancement modules: contact enrichment, recruiter contacts, outreach drafts
 */
(function() {
  'use strict';

  // Inject CSS styles
  function injectStyles() {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = chrome.runtime.getURL('linkedin-enhancer-styles.css');
    document.head.appendChild(link);
  }

  // Load a script file
  function loadScript(path) {
    return new Promise(function(resolve, reject) {
      var script = document.createElement('script');
      script.src = chrome.runtime.getURL(path);
      script.onload = function() {
        resolve();
        script.remove();
      };
      script.onerror = reject;
      (document.head || document.documentElement).appendChild(script);
    });
  }

  // Initialize all modules
  function init() {
    injectStyles();

    // Load modules in order (utils first, then features)
    loadScript('enhancer/utils.js')
      .then(function() { return loadScript('enhancer/outreach-drafts.js'); })
      .then(function() { return loadScript('enhancer/contact-enrichment.js'); })
      .then(function() { return loadScript('enhancer/recruiter-contact.js'); })
      .then(function() {
        // Initialize all modules
        if (window.WLX && window.WLX.contactEnrichment) window.WLX.contactEnrichment.init();
        if (window.WLX && window.WLX.recruiter) window.WLX.recruiter.init();
        console.log('[Waalaxy Unlimited] LinkedIn Enhancer loaded - All features active, zero limitations');
      })
      .catch(function(err) {
        console.error('[Waalaxy Unlimited] Error loading modules:', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
