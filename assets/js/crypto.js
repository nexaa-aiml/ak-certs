/**
 * AI KSHETRA 2026 - Participant Authentication & Cryptographic Utilities
 * NEXAA – Next Gen Engineers & AI Association
 *
 * PRIVACY & SECURITY ARCHITECTURE:
 * - Phone numbers are normalized and hashed into 64-char lowercase hexadecimal SHA-256.
 * - Raw phone numbers are NEVER stored in localStorage, session, DOM, or URL.
 * - Phone numbers are NEVER printed to browser console or analytics.
 * - Input fields are wiped from memory immediately after verification.
 * - The data layer is modular: can easily be switched to a Serverless API endpoint.
 */

(function (window) {
  'use strict';

  // Cache participants dataset in memory during session
  let cachedParticipants = null;

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

    // Strip all non-digit characters
    const digits = rawInput.replace(/\D/g, '');

    // 12-digit format starting with country code 91
    if (digits.length === 12 && digits.startsWith('91')) {
      const ten = digits.slice(2);
      if (/^[6-9]\d{9}$/.test(ten)) return ten;
    }

    // 11-digit format starting with trunk prefix 0
    if (digits.length === 11 && digits.startsWith('0')) {
      const ten = digits.slice(1);
      if (/^[6-9]\d{9}$/.test(ten)) return ten;
    }

    // Standard 10-digit format starting with 6, 7, 8, or 9
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
   * Loads the static participants dataset
   * @returns {Promise<Array>}
   */
  async function loadParticipants() {
    if (cachedParticipants) {
      return cachedParticipants;
    }

    const url = window.AI_CONFIG.getParticipantsDataUrl();
    try {
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`HTTP_${response.status}_DATA_FETCH_FAILED`);
      }
      cachedParticipants = await response.json();
      return cachedParticipants;
    } catch (err) {
      console.error("> [AI_KSHETRA_AUTH] Database load failed:", err.message);
      throw new Error("DATABASE_OFFLINE: Unable to load participant database.");
    }
  }

  /**
   * Looks up participant record by raw phone input
   * Raw input is immediately normalized, hashed, and discarded from scope.
   *
   * @param {string} rawPhone
   * @returns {Promise<{success: boolean, participant?: object, error?: string, code?: string}>}
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
      // Compute SHA-256 hash
      const phoneHash = await computeSha256(normalized);

      // Load dataset
      const participants = await loadParticipants();

      // Find match
      const matched = participants.find(p => p.phoneHash === phoneHash);

      if (!matched) {
        return {
          success: false,
          code: "PARTICIPANT_NOT_FOUND",
          error: "No participant record found for the provided registered number."
        };
      }

      // Return copy of participant record WITHOUT any phone info
      return {
        success: true,
        participant: {
          certificateId: matched.certificateId,
          name: matched.name,
          event: matched.event,
          eventTrack: matched.eventTrack || "",
          college: matched.college,
          certificateType: matched.certificateType || "Certificate of Participation",
          date: matched.date || "09 October 2026"
        }
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
   * Looks up participant record by Certificate ID (e.g. AIK26-0001)
   * Used for public verification and view pages.
   *
   * @param {string} certId
   * @returns {Promise<{success: boolean, participant?: object, error?: string, code?: string}>}
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
      const participants = await loadParticipants();
      const matched = participants.find(p => p.certificateId.toUpperCase() === cleanId);

      if (!matched) {
        return {
          success: false,
          code: "CERTIFICATE_NOT_FOUND",
          error: `The supplied certificate ID "${cleanId}" could not be verified in the official registry.`
        };
      }

      return {
        success: true,
        participant: {
          certificateId: matched.certificateId,
          name: matched.name,
          event: matched.event,
          eventTrack: matched.eventTrack || "",
          college: matched.college,
          certificateType: matched.certificateType || "Certificate of Participation",
          date: matched.date || "09 October 2026"
        }
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
    loadParticipants
  };

})(window);
