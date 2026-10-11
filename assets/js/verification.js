/**
 * AI KSHETRA 2026 - Certificate Verification Logic
 * NEXAA - Next Gen Engineers & AI Association
 *
 * Official Terminal / CLI Aesthetic with Zero Text Overflow
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
        <div class="terminal-card" style="text-align:center; padding: 3rem 1.5rem;">
          <div class="corner-marker corner-tl">+</div>
          <div class="corner-marker corner-tr">+</div>
          <div class="corner-marker corner-bl">+</div>
          <div class="corner-marker corner-br">+</div>
          <div class="terminal-tag">// QUERYING_REGISTRY...</div>
          <p style="font-family: var(--font-mono); color: var(--primary); margin-top: 1rem; font-weight: 700;">
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
          showError("CERTIFICATE_NOT_FOUND", res.error || "The supplied certificate ID could not be verified in the registry.");
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
          <span>[&checkmark;]</span> OFFICIAL CERTIFICATE AUTHENTIC &amp; VALID
        </div>

        <div class="cert-card-name-box" style="margin-bottom: 1.25rem;">
          <span class="cert-name-label">// PARTICIPANT_NAME</span>
          <div class="cert-card-name" style="font-size: 1.2rem; color: var(--primary);">${escHtml(cert.name).toUpperCase()}</div>
        </div>

        <div class="terminal-kv-grid">
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
            <span class="kv-val">${escHtml(cert.eventTrack || 'AI Kshetra 2026 Challenge')}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">CREDENTIAL TYPE:</span>
            <span class="kv-val">${escHtml(cert.certificateType || 'Certificate of Participation')}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">INSTITUTION:</span>
            <span class="kv-val">${escHtml(cert.college)}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">ORGANIZED BY:</span>
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

        <div class="action-row" style="margin-top: 1.75rem;">
          <button type="button" class="btn btn-primary" id="btnVerifyDownloadPdf">
            [ &darr; DOWNLOAD PDF ]
          </button>
          <button type="button" class="btn btn-outline" onclick="window.print()">
            [ PRINT RECORD ]
          </button>
          <a href="../index.html" class="btn btn-dark">
            [ GET ALL MY CERTIFICATES ]
          </a>
        </div>
      `;

      // Wire PDF download
      const btnDl = document.getElementById('btnVerifyDownloadPdf');
      if (btnDl && window.AI_CERT) {
        btnDl.addEventListener('click', () => {
          window.AI_CERT.downloadPdf(cert.certificateId, btnDl);
        });
      }

      // Smooth scroll with sticky navbar clearance
      setTimeout(() => {
        const yOffset = -120;
        const y = resultContainer.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }, 50);
    }

    function showError(code, msg) {
      if (!resultContainer) return;

      resultContainer.className = "terminal-card verification-card status-failed";
      resultContainer.innerHTML = `
        <div class="corner-marker corner-tl">+</div>
        <div class="corner-marker corner-tr">+</div>
        <div class="corner-marker corner-bl">+</div>
        <div class="corner-marker corner-br">+</div>

        <div class="terminal-tag" style="color: #dc2626;">// ERROR_CODE: ${escHtml(code)}</div>
        <h2 class="section-title"><span class="prompt">&gt;_</span> CERTIFICATE_NOT_FOUND</h2>

        <div class="status-badge invalid-badge">
          <span>[&cross;]</span> CERTIFICATE COULD NOT BE VERIFIED
        </div>

        <p class="error-desc">${escHtml(msg)}</p>

        <div class="info-note" style="margin-top: 1.25rem;">
          <span class="note-prefix">// DIAGNOSTIC_CHECKLIST:</span>
          <ul>
            <li>Ensure you scanned the correct QR code from the original printed certificate.</li>
            <li>The QR code link must not be altered or truncated.</li>
            <li>Contact NEXAA support desk if the issue persists.</li>
          </ul>
        </div>

        <div class="action-row" style="margin-top: 1.5rem;">
          <a href="../index.html" class="btn btn-primary">[ GET MY CERTIFICATE -&gt; ]</a>
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