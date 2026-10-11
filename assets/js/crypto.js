/**
 * AI KSHETRA 2026 - Participant Authentication & Cryptographic Utilities
 * NEXAA - Next Gen Engineers & AI Association
 *
 * PRIVACY & SECURITY ARCHITECTURE:
 * - Phone numbers are normalized and hashed into 64-char lowercase hexadecimal SHA-256.
 * - Raw phone numbers are NEVER stored in localStorage, session, DOM, or URL.
 * - Phone numbers are NEVER printed to browser console or analytics.
 * - Input fields are wiped from memory immediately after verification.
 *
 * MULTI-CERTIFICATE SUPPORT:
 * - One phone number can map to MULTIPLE certificate entries (one per event).
 * - verifyParticipantByPhone() returns an array of all matching certificates.
 * - The site renders a card for each certificate with its own PDF download button.
 */

(function (window) {
  'use strict';

  // Cache certificates dataset in memory during session
  let cachedCertificates = null;

  /**
   * Normalizes an Indian mobile phone number
   * Handles:
   *   9876543210
   *   +919876543210
   *   919876543210
   *   09876543210
   *   +91 98765-43210
   *
   * @param {string} rawInput
   * @returns {string|null} 10-digit normalized string or null if invalid
   */
  function normalizePhoneNumber(rawInput) {
    if (!rawInput || typeof rawInput !== 'string') return null;

    const digits = rawInput.replace(/\D/g, '');

    if (digits.length === 12 && digits.startsWith('91')) {
      const ten = digits.slice(2);
      if (/^[6-9]\d{9}$/.test(ten)) return ten;
    }

    if (digits.length === 11 && digits.startsWith('0')) {
      const ten = digits.slice(1);
      if (/^[6-9]\d{9}$/.test(ten)) return ten;
    }

    if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
      return digits;
    }

    return null;
  }

  /**
   * Computes SHA-256 hash using the native Web Crypto API
   * @param {string} text
   * @returns {Promise<string>} 64-character lowercase hex string
   */
  async function computeSha256(text) {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error("CRYPTO_API_UNAVAILABLE: Web Crypto API (crypto.subtle) is required. Please ensure HTTPS or localhost.");
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Loads the unified certificates dataset (data/participants.json)
   * @returns {Promise<Array>}
   */
  async function loadCertificates() {
    if (cachedCertificates) {
      return cachedCertificates;
    }

    const url = window.AI_CONFIG.getCertificatesDataUrl();
    try {
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`HTTP_${response.status}_DATA_FETCH_FAILED`);
      }
      cachedCertificates = await response.json();
      return cachedCertificates;
    } catch (err) {
      console.error('> [AI_KSHETRA_AUTH] Database load failed:', err.message);
      throw new Error("DATABASE_OFFLINE: Unable to load certificate database.");
    }
  }

  /**
   * Sanitizes a certificate record for safe exposure to the UI.
   * Returns only fields needed for display. Never includes phoneHash.
   * @param {object} cert
   * @returns {object}
   */
  function sanitizeCert(cert) {
    return {
      certificateId: cert.certificateId,
      name: cert.name,
      event: cert.event,
      eventTrack: cert.eventTrack || '',
      college: cert.college,
      certificateType: cert.certificateType || 'Certificate of Participation',
      date: cert.date || '09 October 2026',
      pdfFile: cert.pdfFile || (cert.certificateId + '.pdf')
    };
  }

  /**
   * Looks up ALL certificate records that match the given phone number.
   * A participant who attended multiple events will have multiple certificates.
   *
   * Raw input is immediately normalized, hashed, and discarded from scope.
   *
   * @param {string} rawPhone
   * @returns {Promise<{success: boolean, certificates?: object[], error?: string, code?: string}>}
   */
  async function verifyParticipantByPhone(rawPhone) {
    const normalized = normalizePhoneNumber(rawPhone);

    if (!normalized) {
      return {
        success: false,
        code: "INVALID_PHONE_FORMAT",
        error: "Please enter a valid 10-digit Indian mobile number."
      };
    }

    try {
      const phoneHash = await computeSha256(normalized);
      const certs = await loadCertificates();

      // Find ALL certificates matching this phone hash
      const matched = certs.filter(c => c.phoneHash === phoneHash);

      if (matched.length === 0) {
        return {
          success: false,
          code: "PARTICIPANT_NOT_FOUND",
          error: "No certificate record found for the provided registered number."
        };
      }

      return {
        success: true,
        certificates: matched.map(sanitizeCert)
      };
    } catch (err) {
      return {
        success: false,
        code: "CRYPTO_OR_NETWORK_ERROR",
        error: err.message || "An unexpected error occurred while querying the database."
      };
    }
  }

  /**
   * Looks up a single certificate record by Certificate ID (e.g. AIK26-0001)
   * Used for public verification and QR code scan pages.
   *
   * @param {string} certId
   * @returns {Promise<{success: boolean, certificate?: object, error?: string, code?: string}>}
   */
  async function verifyParticipantById(certId) {
    if (!certId || typeof certId !== 'string') {
      return {
        success: false,
        code: "INVALID_CERTIFICATE_ID",
        error: "Certificate ID parameter is missing or empty."
      };
    }

    const cleanId = certId.trim().toUpperCase();

    try {
      const certs = await loadCertificates();
      const matched = certs.find(c => c.certificateId.toUpperCase() === cleanId);

      if (!matched) {
        return {
          success: false,
          code: "CERTIFICATE_NOT_FOUND",
          error: `The supplied certificate ID "${cleanId}" could not be verified in the official registry.`
        };
      }

      return {
        success: true,
        // Keep backward compatibility by also exposing .participant for verify page
        certificate: sanitizeCert(matched),
        participant: sanitizeCert(matched)
      };
    } catch (err) {
      return {
        success: false,
        code: "VERIFICATION_ERROR",
        error: err.message || "Failed to communicate with verification registry."
      };
    }
  }

  // Export module
  window.AI_AUTH = {
    normalizePhoneNumber,
    computeSha256,
    verifyParticipantByPhone,
    verifyParticipantById,
    loadCertificates
  };

})(window);