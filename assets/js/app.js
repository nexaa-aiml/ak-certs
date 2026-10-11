/**
 * AI KSHETRA 2026 - Main Certificate Retrieval Portal Controller
 * NEXAA - Next Gen Engineers & AI Association
 * R.V.R. & J.C. College of Engineering, Guntur
 *
 * Official Terminal / CLI Aesthetic with Zero Text Overflow
 */

(function (window) {
  'use strict';

  function initPortal() {
    const inputPhone = document.getElementById('inputPhoneNumber');
    const btnLookup = document.getElementById('btnLookupParticipant');
    const statusPrompt = document.getElementById('terminalStatusPrompt');
    const resultPanel = document.getElementById('portalResultPanel');

    if (!btnLookup) return;

    btnLookup.addEventListener('click', handleLookup);

    if (inputPhone) {
      inputPhone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleLookup();
      });
      inputPhone.addEventListener('input', () => {
        if (resultPanel && resultPanel.style.display !== 'none') {
          resultPanel.style.display = 'none';
        }
      });
    }

    async function handleLookup() {
      const raw = inputPhone ? inputPhone.value.trim() : '';

      if (!raw) {
        showError("EMPTY_INPUT", "Please enter your 10-digit registered Indian mobile number.");
        return;
      }

      setStatus('&gt; QUERYING REGISTRY WITH SECURE SHA-256 HASH...');
      btnLookup.disabled = true;
      btnLookup.innerHTML = '[ SEARCHING... ]';

      try {
        const res = await window.AI_AUTH.verifyParticipantByPhone(raw);

        // PRIVACY: Wipe input immediately after lookup
        if (inputPhone) inputPhone.value = '';

        if (res.success && res.certificates && res.certificates.length > 0) {
          showSuccess(res.certificates);
        } else {
          showError(res.code || "PARTICIPANT_NOT_FOUND", res.error || "No certificate was found for the supplied registered phone number.");
        }
      } catch (err) {
        showError("SYSTEM_ERROR", err.message || "An unexpected error occurred during database lookup.");
      } finally {
        btnLookup.disabled = false;
        btnLookup.innerHTML = '[ GET MY CERTIFICATES -&gt; ]';
      }
    }

    function setStatus(html) {
      if (statusPrompt) statusPrompt.innerHTML = html;
    }

    /**
     * Renders the success panel showing all certificates for this participant.
     * @param {object[]} certs - Array of sanitized certificate records
     */
    function showSuccess(certs) {
      const count = certs.length;
      const firstName = certs[0].name;

      setStatus(
        '&gt; ACCESS_GRANTED: ' + count + ' CERTIFICATE(S) FOUND FOR: ' + escHtml(firstName).toUpperCase()
      );

      if (!resultPanel) return;

      // Build certificate cards HTML
      const cardsHtml = certs.map((c, idx) => {
        const badgeClass = c.certificateType && c.certificateType.toLowerCase().includes('merit')
          ? 'merit-badge'
          : 'participation-badge';

        return `
          <div class="cert-result-card" id="certCard_${idx}">
            <div class="corner-marker corner-tl">+</div>
            <div class="corner-marker corner-tr">+</div>
            <div class="corner-marker corner-bl">+</div>
            <div class="corner-marker corner-br">+</div>

            <div class="cert-card-header">
              <span class="cert-card-event-tag">&gt; EVENT_${String(idx + 1).padStart(3, '0')}</span>
              <span class="cert-card-type-badge ${badgeClass}">[ ${escHtml(c.certificateType).toUpperCase()} ]</span>
            </div>

            <div class="cert-card-event-info">
              <div class="cert-card-event-title">${escHtml(c.event)}</div>
              <div class="cert-card-track">${escHtml(c.eventTrack || 'AI KSHETRA 2026')}</div>
            </div>

            <div class="cert-card-name-box">
              <span class="cert-name-label">// PRESENTED_TO</span>
              <div class="cert-card-name">${escHtml(c.name).toUpperCase()}</div>
            </div>

            <div class="cert-card-details">
              <div class="cert-detail-row">
                <span class="cert-detail-key">CERTIFICATE ID:</span>
                <span class="cert-detail-val cert-id-pill">${escHtml(c.certificateId)}</span>
              </div>
              <div class="cert-detail-row">
                <span class="cert-detail-key">INSTITUTION:</span>
                <span class="cert-detail-val">${escHtml(c.college)}</span>
              </div>
              <div class="cert-detail-row">
                <span class="cert-detail-key">ISSUE DATE:</span>
                <span class="cert-detail-val">${escHtml(c.date)}</span>
              </div>
            </div>

            <div class="info-note cert-card-note">
              <span class="note-prefix">// NOTE:</span> E-Certificate is digitally verified &amp; signed by NEXAA.
            </div>

            <div class="cert-card-actions">
              <button
                type="button"
                class="btn cert-dl-btn"
                data-certid="${escHtml(c.certificateId)}"
                id="btnDl_${idx}"
              >
                [ &darr; DOWNLOAD PDF ]
              </button>
              <a
                href="${window.AI_CONFIG.resolvePortalUrl('verify/?id=' + encodeURIComponent(c.certificateId))}"
                class="btn cert-verify-link"
                target="_blank"
                rel="noopener"
              >
                [ VERIFY AUTHENTICITY &#8599; ]
              </a>
            </div>
          </div>
        `;
      }).join('');

      resultPanel.className = "portal-result-section status-success";
      resultPanel.style.display = "block";
      resultPanel.innerHTML = `
        <div class="results-meta-header">
          <div class="corner-marker corner-tl">+</div>
          <div class="corner-marker corner-tr">+</div>
          <div class="corner-marker corner-bl">+</div>
          <div class="corner-marker corner-br">+</div>

          <div>
            <div class="terminal-tag">// 02 / OFFICIAL_CREDENTIALS</div>
            <h2 class="section-title" style="margin-bottom: 0.35rem;"><span class="prompt">&gt;_</span> CERTIFICATES_READY</h2>
            <div class="status-badge authentic-badge" style="margin-bottom: 0;">
              <span>[&checkmark;]</span>
              ${count} CERTIFICATE${count !== 1 ? 'S' : ''} FOUND &bull; ${escHtml(firstName).toUpperCase()}
            </div>
          </div>

          ${count > 1 ? `
          <button type="button" class="btn btn-download-all" id="btnDlAll">
            [ &darr; DOWNLOAD ALL (${count}) CERTIFICATES ]
          </button>` : ''}
        </div>

        <p class="subtitle" style="margin-bottom: 1.25rem;">
          Your official certificates are digitally signed by NEXAA. Tap below to download individual PDF certificates or all at once.
        </p>

        <div class="cert-results-grid">
          ${cardsHtml}
        </div>
      `;

      // Wire bulk download button if multiple certificates
      if (count > 1) {
        const btnAll = document.getElementById('btnDlAll');
        if (btnAll) {
          btnAll.addEventListener('click', async () => {
            btnAll.disabled = true;
            const originalText = btnAll.innerHTML;
            btnAll.innerHTML = '[ DOWNLOADING ALL... ]';
            for (let i = 0; i < certs.length; i++) {
              await window.AI_CERT.downloadPdf(certs[i].certificateId);
              await new Promise(r => setTimeout(r, 600));
            }
            btnAll.innerHTML = '[ &checkmark; ALL DOWNLOADED ]';
            setTimeout(() => {
              btnAll.disabled = false;
              btnAll.innerHTML = originalText;
            }, 3000);
          });
        }
      }

      // Wire up each individual download button
      certs.forEach((c, idx) => {
        const btn = document.getElementById('btnDl_' + idx);
        if (btn) {
          btn.addEventListener('click', () => {
            window.AI_CERT.downloadPdf(c.certificateId, btn);
          });
        }
      });

      // Smooth scroll with sticky navbar clearance
      setTimeout(() => {
        const yOffset = -120;
        const y = resultPanel.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }, 50);
    }

    function showError(code, msg) {
      setStatus('&gt; ERROR: ' + code);

      if (!resultPanel) return;

      resultPanel.className = "terminal-card portal-result-card status-failed";
      resultPanel.style.display = "block";
      resultPanel.innerHTML = `
        <div class="corner-marker corner-tl">+</div>
        <div class="corner-marker corner-tr">+</div>
        <div class="corner-marker corner-bl">+</div>
        <div class="corner-marker corner-br">+</div>

        <div class="terminal-tag" style="color: #dc2626;">// ERROR_CODE: ${escHtml(code)}</div>
        <h2 class="section-title"><span class="prompt">&gt;_</span> ACCESS_DENIED</h2>

        <div class="status-badge invalid-badge">
          <span>[&cross;]</span> PARTICIPANT NOT FOUND
        </div>

        <p class="error-desc">${escHtml(msg)}</p>

        <div class="info-note" style="margin-top: 1.25rem;">
          <span class="note-prefix">// TROUBLESHOOTING:</span>
          <ul>
            <li>Enter the exact 10-digit Indian mobile number provided during event registration.</li>
            <li>Prefixes like +91 or leading 0 are automatically accepted and normalized.</li>
            <li>If you participated in a team, ensure you use the phone number you registered under.</li>
            <li>Contact the NEXAA event help desk if your phone number is not found.</li>
          </ul>
        </div>

        <div class="action-row" style="margin-top: 1.5rem;">
          <button type="button" class="btn btn-outline" onclick="document.getElementById('inputPhoneNumber').focus();">
            [ TRY AGAIN ]
          </button>
        </div>
      `;

      setTimeout(() => {
        const yOffset = -120;
        const y = resultPanel.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }, 50);
    }

    /** Minimal HTML escape to prevent XSS in dynamically built innerHTML */
    function escHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
  }

  document.addEventListener('DOMContentLoaded', initPortal);
})(window);