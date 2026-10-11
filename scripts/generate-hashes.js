#!/usr/bin/env node
/**
 * AI KSHETRA 2026 - Certificate Dataset Generator
 * NEXAA - Next Gen Engineers & AI Association
 * R.V.R. & J.C. College of Engineering, Guntur
 *
 * Usage:
 *   node scripts/generate-hashes.js              # Generates sample dataset in data/participants.json
 *   node scripts/generate-hashes.js <input.csv>  # Converts custom CSV to data/participants.json
 *
 * Output: data/participants.json
 *   This is the single authoritative data file used by the portal.
 *
 * Multi-event support:
 *   A single participant can have multiple rows (one per event).
 *   The same phone number will yield all matching certificates when looked up.
 *
 * CSV column format:
 *   phone, name, event, eventTrack, college, certificateType, date
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SITE_BASE_URL = "https://nexaa-aiml.github.io/ak-certs";
const CERT_ID_PREFIX = "AIK26";

function normalizePhoneNumber(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');

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

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function parseCSV(content) {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const matches = [];
    let match;
    while ((match = regex.exec(lines[i])) !== null) {
      if (match.index === regex.lastIndex) regex.lastIndex++;
      let val = match[1] || '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1).replace(/""/g, '"');
      }
      matches.push(val.trim());
      if (matches.length === headers.length) break;
    }

    if (matches.length > 0) {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = matches[idx] || ''; });
      rows.push(obj);
    }
  }
  return rows;
}

/** Derive a safe suffix for QR filename from event name */
function eventSlug(eventName) {
  return (eventName || 'Event').replace(/[^a-zA-Z0-9]/g, '');
}

function main() {
  const args = process.argv.slice(2);
  const inputPath = args[0];
  const outputPath = args[1] || path.join(__dirname, '../data/participants.json');

  let rawList = [];

  if (inputPath && fs.existsSync(inputPath)) {
    console.log('> Reading input data from: ' + inputPath);
    const content = fs.readFileSync(inputPath, 'utf8');
    if (inputPath.endsWith('.csv')) {
      rawList = parseCSV(content);
    } else if (inputPath.endsWith('.json')) {
      rawList = JSON.parse(content);
    } else {
      console.error('> ERROR: Unsupported file format. Use .csv or .json');
      process.exit(1);
    }
  } else {
    console.log('> No input file specified. Using demo sample data.');
    rawList = DEMO_DATA;
  }

  // Load existing file to preserve certificate IDs for already-printed QRs
  let existingIds = {};
  if (fs.existsSync(outputPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      existing.forEach(e => { existingIds[e.certificateId] = true; });
      console.log('> Loaded ' + existing.length + ' existing certificate IDs to preserve.');
    } catch (e) {
      // ignore parse errors
    }
  }

  const processed = [];
  let seq = 1;

  for (const item of rawList) {
    const rawPhone = item.phone || item.phonenumber || item.mobile || item.registered_phone;
    const normalized = normalizePhoneNumber(rawPhone);

    if (!normalized) {
      console.warn('> [SKIP] Invalid phone: "' + rawPhone + '" for "' + (item.name || 'Unnamed') + '"');
      continue;
    }

    // Use existing certId if provided, otherwise auto-assign sequential
    const certId = item.certificateId || (CERT_ID_PREFIX + '-' + String(seq).padStart(4, '0'));
    seq++;

    const phoneHash = sha256(normalized);
    const pdfFile = certId + '.pdf';
    const verificationUrl = SITE_BASE_URL + '/verify/?id=' + certId;
    const qrPath = 'certificates/qrs/' + certId + '_' + eventSlug(item.event) + '.png';

    processed.push({
      certificateId: certId,
      phoneHash,
      name: item.name || 'Participant',
      event: item.event || 'AI Kshetra 2026',
      eventTrack: item.eventTrack || item.event_track || '',
      college: item.college || 'R.V.R. & J.C. College of Engineering',
      certificateType: item.certificateType || item.certificatetype || 'Certificate of Participation',
      date: item.date || '09 October 2026',
      pdfFile,
      verificationUrl,
      qrPath
    });
  }

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(processed, null, 2), 'utf8');

  console.log('==================================================');
  console.log('> CERTIFICATE DATASET GENERATED SUCCESSFULLY');
  console.log('> Total valid records: ' + processed.length);
  console.log('> Saved to: ' + outputPath);
  console.log('==================================================');
  console.log('> Next steps:');
  console.log('  1. Run Python cert generator to produce PDFs in certificates/');
  console.log('  2. git add data/participants.json certificates/');
  console.log('  3. git push origin main');
  console.log('==================================================');
}

// Demo sample data - replace with real CSV input
const DEMO_DATA = [
  {
    phone: "9876543210",
    name: "Demo Participant 1",
    event: "Open Sesame",
    eventTrack: "Technical Quiz & Puzzle Challenge",
    college: "R.V.R. & J.C. College of Engineering",
    certificateType: "Certificate of Participation",
    date: "09 October 2026"
  },
  {
    phone: "9876543210", // Same phone - participated in two events
    name: "Demo Participant 1",
    event: "Code Warz",
    eventTrack: "Competitive Programming",
    college: "R.V.R. & J.C. College of Engineering",
    certificateType: "Certificate of Participation",
    date: "09 October 2026"
  }
];

main();