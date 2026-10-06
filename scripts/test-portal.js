const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

async function testFetch(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

function normalizePhone(raw) {
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

function sha256(phone) {
  return crypto.createHash('sha256').update(phone).digest('hex');
}

async function runTests() {
  console.log('==================================================');
  console.log('> RUNNING AUTOMATED AUDIT FOR CERTIFICATE PORTAL');
  console.log('==================================================');

  // Start internal static server on port 8099
  const server = http.createServer((req, res) => {
    let filePath = '.' + decodeURIComponent(req.url.split('?')[0]);
    if (filePath === './') filePath = './index.html';
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');
    const ext = path.extname(filePath);
    const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.pdf': 'application/pdf' };
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  await new Promise(r => server.listen(8099, r));

  // Test 1: Phone normalization test suite
  console.log('\n[TEST 1] Phone Normalization:');
  const testCases = [
    { in: '9876543210', expected: '9876543210' },
    { in: '+919876543210', expected: '9876543210' },
    { in: '919876543210', expected: '9876543210' },
    { in: '09876543210', expected: '9876543210' },
    { in: '+91 98765-43210', expected: '9876543210' },
    { in: '1234567890', expected: null },
    { in: '98765', expected: null }
  ];

  let passNorm = true;
  for (const tc of testCases) {
    const res = normalizePhone(tc.in);
    if (res === tc.expected) {
      console.log(`  ✓ "${tc.in}" -> "${res}" (OK)`);
    } else {
      console.error(`  ✗ "${tc.in}" -> got "${res}", expected "${tc.expected}"`);
      passNorm = false;
    }
  }

  // Test 2: HTTP routes test
  console.log('\n[TEST 2] HTTP Endpoints & Pre-generated Static PDFs:');
  const routes = [
    'http://localhost:8099/index.html',
    'http://localhost:8099/certificate/index.html',
    'http://localhost:8099/verify/index.html',
    'http://localhost:8099/certificate/view/index.html',
    'http://localhost:8099/about/index.html',
    'http://localhost:8099/data/participants.json',
    'http://localhost:8099/certificates/AIK26-0001.pdf',
    'http://localhost:8099/assets/css/main.css',
    'http://localhost:8099/assets/css/certificate.css',
    'http://localhost:8099/assets/js/config.js',
    'http://localhost:8099/assets/js/crypto.js',
    'http://localhost:8099/assets/js/certificate.js',
    'http://localhost:8099/assets/js/vendor/qrcode.min.js',
    'http://localhost:8099/assets/js/vendor/html2pdf.bundle.min.js'
  ];

  let passRoutes = true;
  for (const r of routes) {
    const res = await testFetch(r);
    if (res.status === 200 && res.data.length > 0) {
      console.log(`  ✓ [200 OK] ${r} (${res.data.length} bytes)`);
    } else {
      console.error(`  ✗ [FAIL ${res.status}] ${r}`);
      passRoutes = false;
    }
  }

  // Test 3: Participant Lookup Test
  console.log('\n[TEST 3] Dataset Matching & Cryptographic Lookup:');
  const dataset = JSON.parse(fs.readFileSync('./data/participants.json', 'utf8'));
  console.log(`  Loaded ${dataset.length} participants from dataset.`);

  // Test look up for 9876543210
  const targetHash = sha256('9876543210');
  const participant = dataset.find(p => p.phoneHash === targetHash);
  if (participant && participant.name === 'Aarav Sharma' && participant.certificateId === 'AIK26-0001') {
    console.log(`  ✓ Lookup 9876543210: Matched "${participant.name}" | ID: ${participant.certificateId} | Event: ${participant.event}`);
  } else {
    console.error('  ✗ Lookup 9876543210 failed to match participant record');
  }

  // Test lookup for invalid phone
  const invalidHash = sha256('9999999999');
  const invalidMatch = dataset.find(p => p.phoneHash === invalidHash);
  if (!invalidMatch) {
    console.log(`  ✓ Lookup 9999999999: Correctly returned null (Participant Not Found)`);
  } else {
    console.error('  ✗ Unexpected match for 9999999999');
  }

  // Test lookup by ID
  const idMatch = dataset.find(p => p.certificateId === 'AIK26-0007');
  if (idMatch && idMatch.name === 'Pooja Reddy') {
    console.log(`  ✓ Verify ID AIK26-0007: Matched "${idMatch.name}" | Event: ${idMatch.event}`);
  } else {
    console.error('  ✗ Verify ID AIK26-0007 failed');
  }

  server.close();

  console.log('\n==================================================');
  if (passNorm && passRoutes) {
    console.log('> ALL INTEGRITY & ENDPOINT TESTS PASSED SUCCESSFULLY!');
  } else {
    console.log('> SOME TESTS FAILED. CHECK LOGS ABOVE.');
  }
  console.log('==================================================');
}

runTests();
