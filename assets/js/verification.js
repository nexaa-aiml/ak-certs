/**
 * AI KSHETRA 2026 - Certificate Verification Logic
 * NEXAA – Next Gen Engineers & AI Association
 */

(function (window) {
  'use strict';

  function initVerification() {
    const inputCertId = document.getElementById('inputCertId');
    const btnVerify = document.getElementById('btnVerifyCert');
    const resultContainer = document.getElementById('verificationResult');
    const querySection = document.getElementById('verifyQueryBox');
    const promptStatus = document.getElementById('promptStatus');

    if (!btnVerify) return;

    // Check if query parameter ?id=... is present in URL (e.g. from scanned QR code)
    const urlParams = new URLSearchParams(window.location.search);
    const queryId = urlParams.get('id');

    if (queryId) {
      if (inputCertId) inputCertId.value = queryId;
      // Auto-hide the manual search form so participant details show directly at the top
      if (querySection) {
        querySection.style.display = 'none';
      }
      executeVerification(queryId, true);
    }

    btnVerify.addEventListener('click', () => {
      const id = inputCertId.value.trim();
      executeVerification(id, false);
    });

    if (inputCertId) {
      inputCertId.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          executeVerification(inputCertId.value.trim(), false);
        }
      });
    }

    async function executeVerification(certId, isFromQr) {
      if (!certId) {
        showError("INVALID_INPUT", "Please enter a valid Certificate ID (e.g. AIK26-0001).");
        return;
      }

      if (promptStatus) {
        promptStatus.innerHTML = `&gt; QUERYING REGISTRY FOR ID: [${certId}]...`;
      }
      btnVerify.disabled = true;
      btnVerify.innerHTML = `[ VERIFYING... ]`;

      try {
        const res = await window.AI_AUTH.verifyParticipantById(certId);

        if (res.success && res.participant) {
          showSuccess(res.participant, isFromQr);
        } else {
          showError("CERTIFICATE_NOT_FOUND", res.error || "The supplied certificate ID could not be verified.");
        }
      } catch (err) {
        showError("REGISTRY_ERROR", err.message || "An error occurred while connecting to the verification registry.");
      } finally {
        btnVerify.disabled = false;
        btnVerify.innerHTML = `[ VERIFY CERTIFICATE -&gt; ]`;
      }
    }

    function showSuccess(p, isFromQr) {
      if (!resultContainer) return;

      const root = window.AI_CONFIG.getRootPath();
      const viewUrl = `${root}certificate/view/index.html?id=${encodeURIComponent(p.certificateId)}`;

      resultContainer.className = "terminal-card verification-card status-success";
      resultContainer.style.display = "block";
      resultContainer.innerHTML = `
        <div class="corner-marker corner-tl">+</div>
        <div class="corner-marker corner-tr">+</div>
        <div class="corner-marker corner-bl">+</div>
        <div class="corner-marker corner-br">+</div>

        <div class="terminal-tag">// 01 / ${isFromQr ? 'QR_SCAN_VERIFIED' : 'AUTHENTICITY_REPORT'}</div>
        <h1 class="page-title"><span class="prompt">&gt;_</span> CERTIFICATE_VERIFIED</h1>

        <div class="status-badge authentic-badge" style="margin-bottom: 1.5rem;">
          <span class="icon">[✓]</span> OFFICIAL CERTIFICATE AUTHENTIC &amp; VALID
        </div>

        <div class="terminal-kv-grid">
          <div class="kv-row">
            <span class="kv-key">PARTICIPANT NAME:</span>
            <span class="kv-val highlight-val" style="font-size: 1.3rem; color: var(--primary);">${p.name}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">CERTIFICATE ID:</span>
            <span class="kv-val highlight-val">${p.certificateId}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">EVENT CHALLENGE:</span>
            <span class="kv-val" style="font-weight: 800;">${p.event}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">TRACK / DETAILS:</span>
            <span class="kv-val">${p.eventTrack || 'Official Challenge Track'}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">CREDENTIAL TYPE:</span>
            <span class="kv-val">${p.certificateType || 'Certificate of Participation'}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">COLLEGE / INSTITUTION:</span>
            <span class="kv-val">${p.college}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">ORGANIZATION:</span>
            <span class="kv-val">AI Kshetra 2026</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">ISSUED BY:</span>
            <span class="kv-val">NEXAA &mdash; R.V.R. &amp; J.C. College of Engineering, Guntur</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">DATE OF ISSUE:</span>
            <span class="kv-val">${p.date}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">STATUS:</span>
            <span class="kv-val status-text-verified">[✓] VERIFIED &bull; OFFICIAL REGISTRY RECORD</span>
          </div>
        </div>

        <div class="action-row" style="margin-top: 1.75rem; display: flex; gap: 1rem; flex-wrap: wrap;">
          <a href="${viewUrl}" class="btn btn-primary">[ VIEW FULL CERTIFICATE -&gt; ]</a>
          <button type="button" class="btn btn-outline" id="btnDirectDownloadPdf">[ DOWNLOAD PDF ]</button>
          <button type="button" class="btn btn-outline" onclick="window.print()">[ PRINT RECORD ]</button>
          <button type="button" class="btn btn-dark" id="btnVerifyAnother">[ VERIFY ANOTHER ID ]</button>
        </div>
      `;

      // Wire direct PDF download button
      const btnDirectDownload = document.getElementById('btnDirectDownloadPdf');
      if (btnDirectDownload && window.AI_CERT) {
        btnDirectDownload.addEventListener('click', () => {
          window.AI_CERT.downloadPdf(p.certificateId);
        });
      }

      // Wire "Verify another" button to show search box
      const btnVerifyAnother = document.getElementById('btnVerifyAnother');
      if (btnVerifyAnother && querySection) {
        btnVerifyAnother.addEventListener('click', () => {
          querySection.style.display = 'block';
          querySection.scrollIntoView({ behavior: 'smooth' });
          if (inputCertId) {
            inputCertId.value = '';
            inputCertId.focus();
          }
        });
      }

      // Scroll smoothly to result if on mobile
      resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

      if (promptStatus) {
        promptStatus.innerHTML = `&gt; STATUS: RECORD FOUND. CERTIFICATE ID [${p.certificateId}] VERIFIED.`;
      }
    }

    function showError(code, msg) {
      if (!resultContainer) return;

      // Ensure search form is visible so user can retry
      if (querySection) {
        querySection.style.display = 'block';
      }

      resultContainer.className = "terminal-card verification-card status-failed";
      resultContainer.style.display = "block";
      resultContainer.innerHTML = `
        <div class="corner-marker corner-tl">+</div>
        <div class="corner-marker corner-tr">+</div>
        <div class="corner-marker corner-bl">+</div>
        <div class="corner-marker corner-br">+</div>

        <div class="terminal-tag">// ERROR_CODE: ${code}</div>
        <h2 class="section-title">&gt;_ CERTIFICATE_VERIFICATION</h2>

        <div class="status-badge invalid-badge">
          <span class="icon">[✗]</span> CERTIFICATE NOT FOUND
        </div>

        <p class="error-desc">${msg}</p>

        <div class="info-note" style="margin-top: 1rem;">
          <span class="note-prefix">// DIAGNOSTIC_CHECKLIST:</span>
          <ul>
            <li>Check for typographical errors in the Certificate ID (format: <code>AIK26-XXXX</code>).</li>
            <li>Ensure the ID belongs to AI Kshetra 2026 issued by NEXAA.</li>
            <li>If scanned from a QR code, confirm the link is unchanged.</li>
          </ul>
        </div>

        <div class="action-row" style="margin-top: 1.5rem;">
          <button type="button" class="btn btn-outline" onclick="document.getElementById('inputCertId').focus();">[ TRY AGAIN ]</button>
        </div>
      `;

      if (promptStatus) {
        promptStatus.innerHTML = `&gt; ERROR: QUERY RETURNED ZERO MATCHING RECORDS.`;
      }
    }
  }

  window.AI_VERIFY = {
    initVerification
  };

  document.addEventListener('DOMContentLoaded', initVerification);
})(window);
