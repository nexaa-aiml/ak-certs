/**
 * AI KSHETRA 2026 - Central Configuration
 * NEXAA – Next Gen Engineers & AI Association
 * R.V.R. & J.C. College of Engineering, Guntur
 */

(function (window) {
  'use strict';

  // Base URL auto-detection for GitHub Pages & Custom Domains
  // To manually override for production GitHub Pages, you can set:
  // window.AI_OVERRIDE_BASE_URL = "https://<username>.github.io/<repo-name>";
  function detectBaseUrl() {
    if (window.AI_OVERRIDE_BASE_URL) {
      return window.AI_OVERRIDE_BASE_URL.replace(/\/+$/, '');
    }

    const loc = window.location;
    if (!loc.origin || loc.origin === 'null' || loc.protocol === 'file:') {
      // Running locally from file system or origin is null
      return '';
    }

    // Check if hosted on GitHub Pages: e.g. https://username.github.io/repo-name/
    const pathSegments = loc.pathname.split('/').filter(Boolean);
    let basePath = '';

    if (loc.hostname.endsWith('github.io') && pathSegments.length > 0) {
      // The first segment of the path is the repository name
      basePath = '/' + pathSegments[0];
    } else if (loc.pathname.includes('/proj_web/cert-site')) {
      // Local development test server root if served with path prefix
      basePath = loc.pathname.substring(0, loc.pathname.indexOf('/proj_web/cert-site') + '/proj_web/cert-site'.length);
    }

    return loc.origin + basePath;
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
