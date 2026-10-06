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
    const promptStatus = document.getElementById('promptStatus');

    if (!btnVerify) return;

    // Check if query parameter ?id=... is present in URL
    const urlParams = new URLSearchParams(window.location.search);
    const queryId = urlParams.get('id');

    if (queryId) {
      if (inputCertId) inputCertId.value = queryId;
      executeVerification(queryId);
    }

    btnVerify.addEventListener('click', () => {
      const id = inputCertId.value.trim();
      executeVerification(id);
    });

    if (inputCertId) {
      inputCertId.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          executeVerification(inputCertId.value.trim());
        }
      });
    }

    async function executeVerification(certId) {
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
          showSuccess(res.participant);
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

    function showSuccess(p) {
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

        <div class="terminal-tag">// 02 / VERIFICATION_REPORT</div>
        <h2 class="section-title">&gt;_ CERTIFICATE_VERIFICATION</h2>

        <div class="status-badge authentic-badge">
          <span class="icon">[✓]</span> CERTIFICATE AUTHENTIC & VALID
        </div>

        <div class="terminal-kv-grid">
          <div class="kv-row">
            <span class="kv-key">CERTIFICATE ID:</span>
            <span class="kv-val highlight-val">${p.certificateId}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">PARTICIPANT:</span>
            <span class="kv-val">${p.name}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">EVENT:</span>
            <span class="kv-val">${p.event}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">TRACK / DETAILS:</span>
            <span class="kv-val">${p.eventTrack || 'Official Challenge Track'}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">INSTITUTION:</span>
            <span class="kv-val">${p.college}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">ORGANIZATION:</span>
            <span class="kv-val">AI Kshetra 2026</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">ISSUED BY:</span>
            <span class="kv-val">NEXAA &mdash; R.V.R. & J.C. College of Engineering, Guntur</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">DATE:</span>
            <span class="kv-val">${p.date}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">STATUS:</span>
            <span class="kv-val status-text-verified">VERIFIED &bull; OFFICIAL RECORD</span>
          </div>
        </div>

        <div class="action-row" style="margin-top: 1.5rem;">
          <a href="${viewUrl}" class="btn btn-primary">[ VIEW CERTIFICATE -&gt; ]</a>
          <button type="button" class="btn btn-outline" onclick="window.print()">[ PRINT RECORD ]</button>
        </div>
      `;

      if (promptStatus) {
        promptStatus.innerHTML = `&gt; STATUS: RECORD FOUND. CERTIFICATE ID [${p.certificateId}] VERIFIED.`;
      }
    }

    function showError(code, msg) {
      if (!resultContainer) return;

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
