/**
 * AI KSHETRA 2026 - Certificate Rendering, QR Generation & PDF Export
 * NEXAA – Next Gen Engineers & AI Association
 * R.V.R. & J.C. College of Engineering, Guntur
 */

(function (window) {
  'use strict';

  /**
   * Generates a deterministic QR Code pointing to public verification page
   * @param {string} containerId - DOM ID of element
   * @param {string} certId - Unique Certificate ID (e.g. AIK26-0001)
   */
  function renderQrCode(containerId, certId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = ''; // Clear previous

    // Construct public verification URL
    let verifyUrl = "";
    if (window.AI_CONFIG.SITE_BASE_URL) {
      verifyUrl = `${window.AI_CONFIG.SITE_BASE_URL}/verify/?id=${encodeURIComponent(certId)}`;
    } else {
      // Relative fallback
      const root = window.AI_CONFIG.getRootPath();
      verifyUrl = `${window.location.origin}${window.location.pathname.replace(/\/certificate(\/view)?\/?.*$/, '')}/verify/?id=${encodeURIComponent(certId)}`;
    }

    // Set QR code verification text link if present
    const linkEl = document.getElementById('certVerifyUrlText');
    if (linkEl) {
      linkEl.textContent = verifyUrl;
      linkEl.href = verifyUrl;
    }

    if (window.QRCode) {
      new window.QRCode(container, {
        text: verifyUrl,
        width: 110,
        height: 110,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: window.QRCode.CorrectLevel.M
      });
    } else {
      console.warn("> [AI_CERT] QRCode library not loaded yet.");
    }
  }

  /**
   * Populates the certificate HTML template with participant data
   * @param {object} p - Participant record
   */
  function populateCertificate(p) {
    if (!p) return;

    const elName = document.getElementById('certParticipantName');
    const elEvent = document.getElementById('certEventName');
    const elCollege = document.getElementById('certCollegeName');
    const elId = document.getElementById('certIdDisplay');
    const elDate = document.getElementById('certDateDisplay');
    const elType = document.getElementById('certTypeDisplay');

    if (elName) elName.textContent = p.name || 'PARTICIPANT NAME';
    if (elEvent) elEvent.textContent = p.event || 'EVENT NAME';
    if (elCollege) elCollege.textContent = p.college || 'R.V.R. & J.C. College of Engineering';
    if (elId) elId.textContent = p.certificateId || 'AIK26-XXXX';
    if (elDate) elDate.textContent = p.date || '09 October 2026';
    if (elType) elType.textContent = (p.certificateType || 'CERTIFICATE OF PARTICIPATION').toUpperCase();

    // Render QR code
    renderQrCode('certQrCode', p.certificateId);
  }

  /**
   * Initiates browser native print dialog with landscape A4 presets
   */
  function printCertificate() {
    window.print();
  }

  /**
   * Downloads certificate PDF.
   * Priority 1: Direct download of pre-generated static Python PDF (certificates/AIK26-XXXX.pdf)
   * Priority 2: In-browser dynamic client generation via html2pdf.js / window.print
   * @param {string} certId
   */
  async function downloadPdf(certId) {
    const downloadBtn = document.getElementById('btnDownloadPdf');
    const originalText = downloadBtn ? downloadBtn.innerHTML : '';
    if (downloadBtn) {
      downloadBtn.innerHTML = `[ PREPARING PDF... ]`;
      downloadBtn.disabled = true;
    }

    const cleanId = certId ? certId.trim().toUpperCase() : 'AIK26';
    const filename = `AI_Kshetra_2026_Certificate_${cleanId}.pdf`;
    const staticPdfUrl = window.AI_CONFIG.getCertificatePdfUrl(cleanId);

    // 1. Try serving pre-generated Python PDF from certificates/ directory
    try {
      const response = await fetch(staticPdfUrl);
      if (response.ok) {
        const blob = await response.blob();
        // Verify it is a valid file (not a 404 HTML fallback)
        if (blob.type.includes('pdf') || blob.size > 1000) {
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
          return;
        }
      }
    } catch (err) {
      console.log("> Static PDF not found or network error, falling back to dynamic generator:", err.message);
    } finally {
      if (downloadBtn) {
        downloadBtn.innerHTML = originalText;
        downloadBtn.disabled = false;
      }
    }

    // 2. Fallback: Dynamic in-browser canvas generation
    const certElement = document.getElementById('printableCertificate');
    if (!certElement) {
      alert("> ERROR: Certificate canvas element not found.");
      return;
    }

    if (downloadBtn) {
      downloadBtn.innerHTML = `[ GENERATING PDF... ]`;
      downloadBtn.disabled = true;
    }

    if (window.html2pdf) {
      const opt = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2.5,
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'landscape'
        }
      };

      try {
        await window.html2pdf().set(opt).from(certElement).save();
      } catch (err) {
        console.error("> PDF generation failed:", err);
        alert("> WARNING: Direct PDF rendering failed. Opening native Print dialog as high-quality fallback.");
        window.print();
      } finally {
        if (downloadBtn) {
          downloadBtn.innerHTML = originalText;
          downloadBtn.disabled = false;
        }
      }
    } else {
      alert("> NOTICE: PDF library loading. Launching system Print-to-PDF dialog.");
      window.print();
      if (downloadBtn) {
        downloadBtn.innerHTML = originalText;
        downloadBtn.disabled = false;
      }
    }
  }

  window.AI_CERT = {
    renderQrCode,
    populateCertificate,
    printCertificate,
    downloadPdf
  };

})(window);
