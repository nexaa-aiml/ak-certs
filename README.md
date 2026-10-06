# AI KSHETRA 2026 — OFFICIAL CERTIFICATE PORTAL
> **NEXAA – Next Gen Engineers & AI Association**  
> **R.V.R. & J.C. College of Engineering, Guntur**

A high-performance, terminal-styled, static certificate retrieval and verification portal built for GitHub Pages deployment. Designed to match the command-line visual ecosystem of the official **AI Kshetra 2026** platform.

---

## ⚡ Key Features

- **CLI / PowerShell Visual Identity**: Monospace typography, electric magenta accents (`#ff007a`), bracket navigation `[ ]`, technical corner markers (`+`), and zero-radius sharp geometries matching the reference website.
- **Privacy-Preserving Client Authentication**: Mobile numbers are normalized and converted into one-way **SHA-256 hashes** via the native browser Web Crypto API. Raw phone numbers are never stored in `localStorage`, never exposed in URLs, never rendered in the DOM, and never sent unhashed over the wire.
- **Dual Verification Architecture**:
  - **Direct Lookup**: Participant retrieves their certificate using their registered Indian mobile number.
  - **Public Ledger Verification**: Anyone can verify certificate authenticity by entering the unique Certificate ID (e.g. `AIK26-0001`) or scanning the QR code on the certificate.
- **Deterministic QR Codes**: Standalone offline client QR generation pointing directly to the public verification endpoint `https://<user>.github.io/<repo>/verify/?id=AIK26-XXXX`.
- **A4 Landscape Print & PDF Generation**:
  - **Pixel-perfect PDF**: Client-side vector/canvas export via `html2pdf.js`.
  - **Browser Print Engine**: Custom `@media print` rules specifically tuned for 297mm &times; 210mm A4 landscape output.
- **100% GitHub Pages & Subfolder Safe**: Base-path auto-detection ensures all routing, scripts, data fetches, and QR URLs work identically on localhost, custom domains, or subpath repositories (`https://<username>.github.io/<repository-name>/`).

---

## 📁 Project Directory Structure

```text
/
├── index.html                   # Terminal landing page & quick retrieval portal
├── 404.html                     # Fallback routing handler for GitHub Pages
├── robots.txt                   # Search crawler directives
├── certificate/
│   ├── index.html               # Dedicated participant authentication page
│   └── view/
│       └── index.html           # Public certificate viewer & PDF export
├── verify/
│   └── index.html               # Certificate verification registry (ID & QR)
├── about/
│   └── index.html               # NEXAA & institutional background page
├── assets/
│   ├── css/
│   │   ├── main.css             # Terminal UI design system
│   │   └── certificate.css      # A4 landscape certificate & print styles
│   └── js/
│       ├── config.js            # Base URL & central configuration
│       ├── crypto.js            # Indian phone normalization & SHA-256 Web Crypto
│       ├── certificate.js       # QR generation, canvas rendering & PDF export
│       ├── verification.js      # Public verification controller
│       ├── app.js               # Main retrieval portal controller
│       └── vendor/
│           ├── qrcode.min.js    # Standalone QR code engine
│           └── html2pdf.bundle.min.js # Standalone PDF generator
├── certificates/                # Static pre-generated Python PDFs (AIK26-XXXX.pdf)
├── docs/
│   └── PYTHON_INTEGRATION_GUIDE.md # Python PDF generation & transfer guide
├── data/
│   ├── participants.json        # Hashed participant dataset (generated via Python/Node)
│   ├── sample-participants.csv  # CSV template for organizers
│   └── README.md                # Data management guide
├── scripts/
│   ├── python_generate_certificates.py # Working Python PDF & JSON generator
│   ├── generate-hashes.js       # Node.js CLI dataset generator
│   └── hash-generator.html      # Browser GUI tool for organizers
└── .github/
    └── workflows/
        └── deploy.yml           # Automated GitHub Pages CI/CD workflow
```

---

## 🚀 Quick Start & Local Testing

### Option 1: Using Node.js Local Server
```bash
# Start a simple HTTP server in the project directory:
npx serve .
# Or using Python 3:
python -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

> [!NOTE]
> Web Crypto (`crypto.subtle`) requires a **Secure Context** (HTTPS or localhost). Always run from an HTTP server or localhost, not directly via raw `file://` protocol.

### Test Credentials (Preloaded in Demo Dataset)
| Phone Number | Normalized | Certificate ID | Participant | Event |
| :--- | :--- | :--- | :--- | :--- |
| `9876543210` | `9876543210` | `AIK26-0001` | Aarav Sharma | Open Sesame |
| `+91 91234 56780` | `9123456780` | `AIK26-0002` | Pooja Reddy | Code Warz |
| `09988776655` | `9988776655` | `AIK26-0003` | Sai Teja Varma | World of Agents |
| `9848012345` | `9848012345` | `AIK26-0004` | Kavya Sree N. | Open Sesame |

---

## ⚙️ Configuration (`SITE_BASE_URL`)

The portal features **automatic base URL detection**. By default, it inspects `window.location` and automatically sets the base URL for QR codes:
- If running on `https://alice.github.io/cert-site/`, it automatically resolves to `https://alice.github.io/cert-site`.
- If running on a custom domain `https://certificates.aikshetra.org/`, it resolves to `https://certificates.aikshetra.org`.

### Manual Override (Optional)
If you wish to force a fixed production base URL, you can uncomment or set `window.AI_OVERRIDE_BASE_URL` in `assets/js/config.js` or directly inside the `<head>` of your pages:
```html
<script>
  window.AI_OVERRIDE_BASE_URL = "https://your-username.github.io/your-repo-name";
</script>
```

---

## 🛠️ Adding Participants & Generating Hashes

### Method A: CLI Script (Recommended)
1. Add participant details to `data/sample-participants.csv` or create your own CSV:
   ```csv
   phone,name,event,eventTrack,college,certificateType,date
   9876543210,Aarav Sharma,Open Sesame,Technical Quiz & Puzzle Challenge,R.V.R. & J.C. College of Engineering,Certificate of Participation,09 October 2026
   ```
2. Run the generator script:
   ```bash
   node scripts/generate-hashes.js data/sample-participants.csv data/participants.json
   ```
   The script normalizes all phone numbers, generates SHA-256 hashes, assigns sequential `AIK26-XXXX` IDs, and writes the updated `data/participants.json`.

### Method B: Browser Web GUI Tool
Open `scripts/hash-generator.html` in any web browser. Paste your CSV rows, click **[ GENERATE HASHED JSON -> ]**, and download the resulting `participants.json`.

---

## 🚢 Deploying to GitHub Pages

1. **Create a GitHub Repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: AI Kshetra 2026 Certificate Portal"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. **Enable GitHub Pages**:
   - Go to your repository on GitHub &rarr; **Settings** &rarr; **Pages**.
   - Under **Build and deployment** &rarr; **Source**: Select **GitHub Actions** (the included `.github/workflows/deploy.yml` will automatically build and publish).
   - Alternatively, choose **Deploy from a branch** &rarr; select branch `main` &rarr; folder `/ (root)` &rarr; click **Save**.
3. **Verify Deployment**:
   Your site will be live within 1–2 minutes at:  
   `https://<your-username>.github.io/<your-repo-name>/`

---

## 🔒 Security & Privacy Architecture

### What is Protected:
1. **No Raw Phone Numbers in Repo**: Only 64-character SHA-256 hashes are stored in `data/participants.json`.
2. **No Phone Numbers in URLs or QR Codes**: Verification URLs and QR codes only reference the non-sensitive public `certificateId` (e.g. `?id=AIK26-0001`).
3. **Zero Browser Persistence**: Phone numbers entered into the input fields are immediately wiped from the DOM and discarded from memory upon lookup.
4. **No Console Logging**: The authentication logic explicitly avoids printing phone numbers in console messages or diagnostics.

### Static Hosting Limitations & Serverless Migration:
Because static files on GitHub Pages can be downloaded in full by any user, an adversary with access to rainbow tables could theoretically compute hashes for all 10-digit Indian phone numbers ($10^{10}$ combinations) and attempt to cross-reference them.

#### How to Migrate to a Serverless API (Zero Frontend Rewriting):
To achieve full confidentiality, the lookup function in `assets/js/crypto.js` can be directed to an authenticated serverless endpoint (e.g., Cloudflare Workers, AWS Lambda, or Supabase):
```javascript
// In assets/js/crypto.js - replace static fetch with:
const response = await fetch('https://api.aikshetra.org/lookup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phoneHash: phoneHash })
});
```
The server checks the hash in a private database and returns only the single matching participant record. The UI, certificate generator, and verification flow remain identical.

---

## 📜 License
Developed for **AI KSHETRA 2026** by **NEXAA – Next Gen Engineers & AI Association**, R.V.R. & J.C. College of Engineering, Guntur.
