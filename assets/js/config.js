/**
 * AI KSHETRA 2026 - Central Configuration
 * NEXAA – Next Gen Engineers & AI Association
 * R.V.R. & J.C. College of Engineering, Guntur
 */

(function (window) {
  'use strict';

  // Production Deployed URL on GitHub Pages
  const PRODUCTION_BASE_URL = "https://nexaa-aiml.github.io/ak-certs";

  function detectBaseUrl() {
    if (window.AI_OVERRIDE_BASE_URL) {
      return window.AI_OVERRIDE_BASE_URL.replace(/\/+$/, '');
    }

    const loc = window.location;
    // If running in production on github.io or deployed domain
    if (loc.hostname.endsWith('github.io')) {
      return PRODUCTION_BASE_URL;
    }

    if (!loc.origin || loc.origin === 'null' || loc.protocol === 'file:') {
      return PRODUCTION_BASE_URL;
    }

    // On local dev server, return local URL or fallback
    return loc.origin + (loc.pathname.includes('/ak-certs') ? '/ak-certs' : '');
  }

  // Determine root relative prefix based on HTML attribute: <html data-root="./">
  function getRootPath() {
    const rootAttr = document.documentElement.getAttribute('data-root');
    if (rootAttr) return rootAttr;

    // Fallback: estimate from pathname depth
    const depth = window.location.pathname.split('/').filter(Boolean).length;
    if (depth <= 1) return './';
    if (depth === 2) return '../';
    return '../../';
  }

  const CONFIG = {
    // Configurable base URL for QR codes and verification links
    SITE_BASE_URL: detectBaseUrl(),

    // Event & Association Metadata
    EVENT_NAME: "AI KSHETRA 2026",
    ORGANIZER: "NEXAA – Next Gen Engineers & AI Association",
    INSTITUTION: "R.V.R. & J.C. College of Engineering, Guntur",
    EVENT_DATE: "09 October 2026",
    
    // Relative path to participant dataset
    getParticipantsDataUrl: function () {
      const root = getRootPath();
      return root + 'data/participants.json';
    },

    // Relative path to static pre-generated Python PDF (e.g. certificates/AIK26-0001.pdf)
    getCertificatePdfUrl: function (certId) {
      const root = getRootPath();
      return root + 'certificates/' + encodeURIComponent(certId) + '.pdf';
    },

    // Resolves a relative portal URL (e.g. 'verify/?id=AIK26-0001')
    resolvePortalUrl: function (relativePath) {
      const cleanRel = relativePath.replace(/^\/+/, '');
      if (this.SITE_BASE_URL) {
        return this.SITE_BASE_URL + '/' + cleanRel;
      }
      const root = getRootPath();
      return root + cleanRel;
    },

    // Helpers
    getRootPath: getRootPath
  };

  window.AI_CONFIG = CONFIG;
})(window);
