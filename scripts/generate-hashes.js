#!/usr/bin/env node
/**
 * AI KSHETRA 2026 - Participant Phone Hash & Certificate Dataset Generator
 * NEXAA – Next Gen Engineers & AI Association
 * R.V.R. & J.C. College of Engineering, Guntur
 *
 * Usage:
 *   node scripts/generate-hashes.js              # Generates sample dataset in data/participants.json
 *   node scripts/generate-hashes.js <input.csv>  # Converts custom CSV to data/participants.json
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Normalizes Indian mobile phone numbers to standard 10 digits
 * @param {string|number} raw
 * @returns {string|null} 10-digit string or null if invalid
 */
function normalizePhoneNumber(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');

  // 12-digit format with country code 91
  if (digits.length === 12 && digits.startsWith('91')) {
    const ten = digits.slice(2);
    if (/^[6-9]\d{9}$/.test(ten)) return ten;
  }

  // 11-digit format with leading 0
  if (digits.length === 11 && digits.startsWith('0')) {
    const ten = digits.slice(1);
    if (/^[6-9]\d{9}$/.test(ten)) return ten;
  }

  // Standard 10-digit format
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return digits;
  }

  return null;
}

/**
 * Computes SHA-256 hash of a normalized phone number
 * @param {string} phone
 * @returns {string} 64-char lowercase hex string
 */
function sha256(phone) {
  return crypto.createHash('sha256').update(phone).digest('hex');
}

/**
 * Parses simple CSV content
 */
function parseCSV(content) {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    // Basic comma separation supporting quotes
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
      headers.forEach((h, idx) => {
        obj[h] = matches[idx] || '';
      });
      rows.push(obj);
    }
  }
  return rows;
}

// Sample initial participants for development & demo testing
const DEFAULT_PARTICIPANTS = [
  {
    phone: "9876543210", // Primary test number from requirements
    name: "Aarav Sharma",
    event: "Open Sesame",
    eventTrack: "Technical Quiz & Puzzle Challenge",
    college: "R.V.R. & J.C. College of Engineering",
    certificateType: "Certificate of Participation",
    date: "09 October 2026"
  },
  {
    phone: "9123456780",
    name: "Pooja Reddy",
    event: "Code Warz",
    eventTrack: "Competitive Programming",
    college: "R.V.R. & J.C. College of Engineering",
    certificateType: "Certificate of Participation",
    date: "09 October 2026"
  },
  {
    phone: "9988776655",
    name: "Sai Teja Varma",
    event: "World of Agents",
    eventTrack: "AI & Automation Challenge",
    college: "R.V.R. & J.C. College of Engineering",
    certificateType: "Certificate of Participation",
    date: "09 October 2026"
  },
  {
    phone: "9848012345",
    name: "Kavya Sree N.",
    event: "Open Sesame",
    eventTrack: "Technical Quiz & Puzzle Challenge",
    college: "Vignan's Foundation for Science, Technology & Research",
    certificateType: "Certificate of Participation",
    date: "09 October 2026"
  },
  {
    phone: "9440156789",
    name: "Manoj Kumar P.",
    event: "Code Warz",
    eventTrack: "Competitive Programming",
    college: "KL University, Vaddeswaram",
    certificateType: "Certificate of Participation",
    date: "09 October 2026"
  },
  {
    phone: "9866543219",
    name: "Bhavana Chodavarapu",
    event: "World of Agents",
    eventTrack: "AI & Automation Challenge",
    college: "R.V.R. & J.C. College of Engineering",
    certificateType: "Certificate of Participation",
    date: "09 October 2026"
  }
];

function main() {
  const args = process.argv.slice(2);
  const inputPath = args[0];
  const outputPath = args[1] || path.join(__dirname, '../data/participants.json');

  let rawList = [];

  if (inputPath && fs.existsSync(inputPath)) {
    console.log(`> Reading input data from: ${inputPath}`);
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
    console.log('> No input file specified. Using default demo participants.');
    rawList = DEFAULT_PARTICIPANTS;
  }

  const processed = [];
  let seq = 1;

  for (const item of rawList) {
    const rawPhone = item.phone || item.phonenumber || item.mobile || item.registered_phone;
    const normalized = normalizePhoneNumber(rawPhone);

    if (!normalized) {
      console.warn(`> [SKIP] Invalid phone: "${rawPhone}" for "${item.name || 'Unnamed'}"`);
      continue;
    }

    const certificateId = item.certificateId || `AIK26-${String(seq).padStart(4, '0')}`;
    seq++;

    const phoneHash = sha256(normalized);

    processed.push({
      certificateId,
      phoneHash,
      name: item.name || 'Participant',
      event: item.event || 'Open Sesame',
      eventTrack: item.eventTrack || item.event_track || '',
      college: item.college || 'R.V.R. & J.C. College of Engineering',
      certificateType: item.certificateType || item.certificatetype || 'Certificate of Participation',
      date: item.date || '09 October 2026'
    });
  }

  // Ensure output directory exists
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(processed, null, 2), 'utf8');

  console.log('==================================================');
  console.log('> PARTICIPANT DATASET GENERATED SUCCESSFULLY');
  console.log(`> Total valid records: ${processed.length}`);
  console.log(`> Saved to: ${outputPath}`);
  console.log('==================================================');
  console.log('> TEST NUMBERS FOR LOCAL VERIFICATION:');
  console.log('  1. 9876543210 -> AIK26-0001 (Aarav Sharma - Open Sesame)');
  console.log('  2. 9123456780 -> AIK26-0002 (Pooja Reddy - Code Warz)');
  console.log('  3. 9988776655 -> AIK26-0003 (Sai Teja Varma - World of Agents)');
  console.log('  4. 9848012345 -> AIK26-0004 (Kavya Sree N. - Open Sesame)');
  console.log('==================================================');
}

main();
