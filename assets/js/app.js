/**
 * AI KSHETRA 2026 - Main Certificate Retrieval Portal Controller
 * NEXAA – Next Gen Engineers & AI Association
 * R.V.R. & J.C. College of Engineering, Guntur
 */

(function (window) {
  'use strict';

  function initPortal() {
    const inputPhone = document.getElementById('inputPhoneNumber');
    const btnLookup = document.getElementById('btnLookupParticipant');
    const statusPrompt = document.getElementById('terminalStatusPrompt');
    const resultPanel = document.getElementById('portalResultPanel');
    const certPreviewSection = document.getElementById('certPreviewSection');
    const btnDownload = document.getElementById('btnDownloadPdf');
    const btnPrint = document.getElementById('btnPrintCert');

    let currentParticipant = null;

    if (!btnLookup) return;

    btnLookup.addEventListener('click', handleLookup);

    if (inputPhone) {
      inputPhone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          handleLookup();
        }
      });
      // Helpful placeholder formatting
      inputPhone.addEventListener('input', () => {
        // Clear previous error state on typing
        if (resultPanel && resultPanel.classList.contains('status-failed')) {
          resultPanel.style.display = 'none';
        }
      });
    }

    async function handleLookup() {
      const raw = inputPhone.value.trim();

      if (!raw) {
        showError("EMPTY_INPUT", "Please enter your 10-digit registered Indian mobile number.");
        return;
      }

      // Update terminal status log
      setStatus("&gt; VERIFYING PARTICIPANT CREDENTIALS...<br>&gt; COMPUTING SHA-256 HASH & QUERYING INDEX...");
      btnLookup.disabled = true;
      btnLookup.innerHTML = `[ VERIFYING... ]`;

      try {
        const res = await window.AI_AUTH.verifyParticipantByPhone(raw);

        // PRIVACY CRITICAL REQUIREMENT:
        // Wipe input field immediately from DOM and memory
        inputPhone.value = '';

        if (res.success && res.participant) {
          currentParticipant = res.participant;
          showSuccess(res.participant);
        } else {
          showError(res.code || "PARTICIPANT_NOT_FOUND", res.error || "No participant was found with the supplied registered phone number.");
        }
      } catch (err) {
        showError("SYSTEM_ERROR", err.message || "An unexpected error occurred during database lookup.");
      } finally {
        btnLookup.disabled = false;
        btnLookup.innerHTML = `[ VERIFY PARTICIPANT -&gt; ]`;
      }
    }

    function setStatus(html) {
      if (statusPrompt) {
        statusPrompt.innerHTML = html;
      }
    }

    function showSuccess(p) {
      setStatus(`&gt; ACCESS_GRANTED<br>&gt; PARTICIPANT RECORD LOCATED: [${p.certificateId}]`);

      if (resultPanel) {
        const root = window.AI_CONFIG.getRootPath();
        const publicViewUrl = `${root}certificate/view/index.html?id=${encodeURIComponent(p.certificateId)}`;

        resultPanel.className = "terminal-card portal-result-card status-success";
        resultPanel.style.display = "block";
        resultPanel.innerHTML = `
          <div class="corner-marker corner-tl">+</div>
          <div class="corner-marker corner-tr">+</div>
          <div class="corner-marker corner-bl">+</div>
          <div class="corner-marker corner-br">+</div>

          <div class="terminal-tag">// 02 / AUTHENTICATION_SUCCESS</div>
          <h2 class="section-title">&gt;_ ACCESS_GRANTED</h2>

          <div class="status-badge authentic-badge">
            <span class="icon">[✓]</span> PARTICIPANT RECORD LOCATED
          </div>

          <p class="section-intro" style="margin-bottom: 1rem;">
            Official participation record verified. Your certificate is ready for generation and download.
          </p>

          <div class="terminal-kv-grid">
            <div class="kv-row">
              <span class="kv-key">CERTIFICATE ID:</span>
              <span class="kv-val highlight-val">${p.certificateId}</span>
            </div>
            <div class="kv-row">
              <span class="kv-key">PARTICIPANT NAME:</span>
              <span class="kv-val">${p.name}</span>
            </div>
            <div class="kv-row">
              <span class="kv-key">EVENT CHALLENGE:</span>
              <span class="kv-val">${p.event}</span>
            </div>
            <div class="kv-row">
              <span class="kv-key">COLLEGE / INSTITUTION:</span>
              <span class="kv-val">${p.college}</span>
            </div>
            <div class="kv-row">
              <span class="kv-key">DATE OF EVENT:</span>
              <span class="kv-val">${p.date}</span>
            </div>
            <div class="kv-row">
              <span class="kv-key">ISSUED BY:</span>
              <span class="kv-val">NEXAA &bull; R.V.R. & J.C. College of Engineering</span>
            </div>
          </div>

          <div class="action-row" style="margin-top: 1.5rem; gap: 1rem; display: flex; flex-wrap: wrap;">
            <button type="button" id="btnRevealCertificate" class="btn btn-primary">
              [ GENERATE / VIEW CERTIFICATE -&gt; ]
            </button>
            <a href="${publicViewUrl}" class="btn btn-outline" target="_blank">
              [ OPEN DIRECT LINK &#8599; ]
            </a>
          </div>
        `;

        // Bind generator button
        const btnReveal = document.getElementById('btnRevealCertificate');
        if (btnReveal) {
          btnReveal.addEventListener('click', () => {
            renderCertificateSection(p);
          });
        }
      }

      // Auto-render certificate if preview section exists on page
      if (certPreviewSection) {
        renderCertificateSection(p);
      }
    }

    function renderCertificateSection(p) {
      if (!certPreviewSection) return;

      certPreviewSection.style.display = "block";
      window.AI_CERT.populateCertificate(p);

      // Scroll smoothly to certificate preview
      certPreviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function showError(code, msg) {
      setStatus(`&gt; ERROR: AUTHENTICATION_FAILED [${code}]`);

      if (resultPanel) {
        resultPanel.className = "terminal-card portal-result-card status-failed";
        resultPanel.style.display = "block";
        resultPanel.innerHTML = `
          <div class="corner-marker corner-tl">+</div>
          <div class="corner-marker corner-tr">+</div>
          <div class="corner-marker corner-bl">+</div>
          <div class="corner-marker corner-br">+</div>

          <div class="terminal-tag">// ERROR_CODE: ${code}</div>
          <h2 class="section-title">&gt;_ ACCESS_DENIED</h2>

          <div class="status-badge invalid-badge">
            <span class="icon">[✗]</span> PARTICIPANT NOT FOUND
          </div>

          <p class="error-desc">${msg}</p>

          <div class="info-note" style="margin-top: 1rem;">
            <span class="note-prefix">// TROUBLESHOOTING_TIPS:</span>
            <ul>
              <li>Enter the exact 10-digit Indian mobile number provided during event registration.</li>
              <li>Prefixes like +91 or leading 0 are automatically accepted and normalized.</li>
              <li>If you attended with a team, ensure you enter the registered phone number.</li>
              <li>Contact NEXAA event support desk if your number is not registered.</li>
            </ul>
          </div>

          <div class="action-row" style="margin-top: 1.5rem;">
            <button type="button" class="btn btn-outline" onclick="document.getElementById('inputPhoneNumber').focus();">
              [ TRY AGAIN ]
            </button>
          </div>
        `;
      }

      if (certPreviewSection) {
        certPreviewSection.style.display = "none";
      }
    }

    // Bind PDF & Print actions if present on page
    if (btnDownload) {
      btnDownload.addEventListener('click', () => {
        if (currentParticipant) {
          window.AI_CERT.downloadPdf(currentParticipant.certificateId);
        } else {
          // Check query id
          const id = new URLSearchParams(window.location.search).get('id') || 'AIK26';
          window.AI_CERT.downloadPdf(id);
        }
      });
    }

    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        window.AI_CERT.printCertificate();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initPortal);
})(window);
