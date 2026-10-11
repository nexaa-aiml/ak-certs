/**
 * AI KSHETRA 2026 - Certificate Verification Logic
 * NEXAA - Next Gen Engineers & AI Association
 *
 * VERIFICATION METHOD: QR CODE ONLY
 *
 * This module auto-triggers when the verify page is loaded with a ?id= URL parameter,
 * which is embedded in every printed certificate QR code.
 *
 * There is NO manual certificate ID entry. Participants must scan the QR code
 * printed on their physical or digital certificate.
 *
 * QR code URL format: /verify/?id=AIK26-XXXX
 */

(function (window) {
  'use strict';

  function initVerification() {
    const resultContainer = document.getElementById('verificationResult');
    const qrOnlyNotice = document.getElementById('qrOnlyNotice');

    // Read ?id= parameter from URL (set by QR code scan)
    const urlParams = new URLSearchParams(window.location.search);
    const certId = urlParams.get('id');

    if (!certId) {
      // No QR param - show the "scan QR" instruction panel, hide result area
      if (qrOnlyNotice) qrOnlyNotice.style.display = 'block';
      if (resultContainer) resultContainer.style.display = 'none';
      return;
    }

    // QR param present - hide instruction panel and run verification
    if (qrOnlyNotice) qrOnlyNotice.style.display = 'none';
    if (resultContainer) {
      resultContainer.style.display = 'block';
      resultContainer.innerHTML = `
        <div class="terminal-card" style="text-align:center; padding: 2.5rem;">
          <div class="terminal-tag">// QUERYING_REGISTRY...</div>
          <p style="font-family: var(--font-mono); color: var(--primary); margin-top: 1rem;">
            &gt; VERIFYING CERTIFICATE ID [${escHtml(certId.toUpperCase())}]...
          </p>
        </div>`;
    }

    executeVerification(certId.trim());

    async function executeVerification(id) {
      try {
        const res = await window.AI_AUTH.verifyParticipantById(id);

        if (res.success && res.certificate) {
          showSuccess(res.certificate);
        } else {
          showError("CERTIFICATE_NOT_FOUND", res.error || "The supplied certificate ID could not be verified.");
        }
      } catch (err) {
        showError("REGISTRY_ERROR", err.message || "An error occurred while connecting to the verification registry.");
      }
    }

    function showSuccess(cert) {
      if (!resultContainer) return;

      resultContainer.className = "terminal-card verification-card status-success";
      resultContainer.innerHTML = `
        <div class="corner-marker corner-tl">+</div>
        <div class="corner-marker corner-tr">+</div>
        <div class="corner-marker corner-bl">+</div>
        <div class="corner-marker corner-br">+</div>

        <div class="terminal-tag">// QR_SCAN_VERIFIED</div>
        <h1 class="page-title"><span class="prompt">&gt;_</span> CERTIFICATE_VERIFIED</h1>

        <div class="status-badge authentic-badge" style="margin-bottom: 1.5rem;">
          <span class="icon">[&checkmark;]</span> OFFICIAL CERTIFICATE AUTHENTIC &amp; VALID
        </div>

        <div class="terminal-kv-grid">
          <div class="kv-row">
            <span class="kv-key">PARTICIPANT NAME:</span>
            <span class="kv-val highlight-val" style="font-size: 1.3rem; color: var(--primary);">${escHtml(cert.name)}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">CERTIFICATE ID:</span>
            <span class="kv-val highlight-val">${escHtml(cert.certificateId)}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">EVENT CHALLENGE:</span>
            <span class="kv-val" style="font-weight: 800;">${escHtml(cert.event)}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">TRACK / DETAILS:</span>
            <span class="kv-val">${escHtml(cert.eventTrack || 'Official Challenge Track')}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">CREDENTIAL TYPE:</span>
            <span class="kv-val">${escHtml(cert.certificateType || 'Certificate of Participation')}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">COLLEGE / INSTITUTION:</span>
            <span class="kv-val">${escHtml(cert.college)}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">ORGANISED BY:</span>
            <span class="kv-val">AI Kshetra 2026 &mdash; NEXAA</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">ISSUED BY:</span>
            <span class="kv-val">NEXAA &mdash; R.V.R. &amp; J.C. College of Engineering, Guntur</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">DATE OF ISSUE:</span>
            <span class="kv-val">${escHtml(cert.date)}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">STATUS:</span>
            <span class="kv-val status-text-verified">[&checkmark;] VERIFIED &bull; OFFICIAL REGISTRY RECORD</span>
          </div>
        </div>

        <div class="action-row" style="margin-top: 1.75rem; display: flex; gap: 1rem; flex-wrap: wrap;">
          <button type="button" class="btn btn-primary" id="btnVerifyDownloadPdf">
            [ &darr; DOWNLOAD PDF ]
          </button>
          <button type="button" class="btn btn-outline" onclick="window.print()">[ PRINT RECORD ]</button>
        </div>
      `;

      // Wire PDF download
      const btnDl = document.getElementById('btnVerifyDownloadPdf');
      if (btnDl && window.AI_CERT) {
        btnDl.addEventListener('click', () => {
          window.AI_CERT.downloadPdf(cert.certificateId, btnDl);
        });
      }

      resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function showError(code, msg) {
      if (!resultContainer) return;

      resultContainer.className = "terminal-card verification-card status-failed";
      resultContainer.innerHTML = `
        <div class="corner-marker corner-tl">+</div>
        <div class="corner-marker corner-tr">+</div>
        <div class="corner-marker corner-bl">+</div>
        <div class="corner-marker corner-br">+</div>

        <div class="terminal-tag">// ERROR_CODE: ${escHtml(code)}</div>
        <h2 class="section-title">&gt;_ CERTIFICATE_NOT_FOUND</h2>

        <div class="status-badge invalid-badge">
          <span class="icon">[&cross;]</span> CERTIFICATE COULD NOT BE VERIFIED
        </div>

        <p class="error-desc">${escHtml(msg)}</p>

        <div class="info-note" style="margin-top: 1rem;">
          <span class="note-prefix">// DIAGNOSTIC_CHECKLIST:</span>
          <ul>
            <li>Ensure you scanned the correct QR code from the original printed certificate.</li>
            <li>The QR code link must not be altered or truncated.</li>
            <li>Contact NEXAA support if the issue persists.</li>
          </ul>
        </div>

        <div class="action-row" style="margin-top: 1.5rem;">
          <a href="../index.html" class="btn btn-outline">[ RETURN HOME ]</a>
        </div>
      `;
    }
  }

  function escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  window.AI_VERIFY = { initVerification };
  document.addEventListener('DOMContentLoaded', initVerification);
})(window);