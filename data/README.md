# AI KSHETRA 2026 — PARTICIPANT DATA MANAGEMENT GUIDE
> NEXAA – Next Gen Engineers & AI Association  
> R.V.R. & J.C. College of Engineering, Guntur

This directory contains the static participant records used by the AI Kshetra 2026 Certificate Portal.

---

## 1. Data Schema Overview

File: `data/participants.json`

Every participant record adheres to the following structure:

```json
{
  "certificateId": "AIK26-0001",
  "phoneHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "name": "Aarav Sharma",
  "event": "Open Sesame",
  "eventTrack": "Technical Quiz & Puzzle Challenge",
  "college": "R.V.R. & J.C. College of Engineering",
  "certificateType": "Certificate of Participation",
  "date": "09 October 2026"
}
```

### Field Descriptions:
- `certificateId` *(string)*: Unique immutable identifier in the format `AIK26-XXXX` (e.g., `AIK26-0001`). Must never be reused or changed.
- `phoneHash` *(string)*: 64-character lowercase hexadecimal SHA-256 hash of the normalized 10-digit Indian phone number. **NEVER store raw phone numbers here.**
- `name` *(string)*: Full participant name as it should appear on the certificate.
- `event` *(string)*: Name of the event (`Open Sesame`, `Code Warz`, `World of Agents`, etc.).
- `eventTrack` *(string, optional)*: Subtitle / category of event.
- `college` *(string)*: Participant's educational institution.
- `certificateType` *(string)*: Usually `"Certificate of Participation"`, `"Certificate of Merit"`, or `"Winner"`.
- `date` *(string)*: Event issue date (default: `"09 October 2026"`).

---

## 2. Phone Number Normalization & Hashing

Phone numbers must be normalized before computing the SHA-256 hash:
1. Strip all non-digit characters (spaces, hyphens, parentheses, etc.).
2. If prefixed with country code `91` (12 digits), strip `91` to leave 10 digits.
3. If prefixed with `0` (11 digits), strip `0` to leave 10 digits.
4. Verify the number is a valid 10-digit Indian mobile number starting with `6`, `7`, `8`, or `9`.
5. Compute the lowercase hexadecimal SHA-256 hash of the 10-digit string.

### Example:
- Raw input: `+91 98765-43210`
- Normalized: `9876543210`
- SHA-256 Hash: `4ca10787a27eb098939c0f91a62cc3e831c26b9a2444655ad1ffeb6a4cbaee64`

---

## 3. How Organizers Can Add Participants

### Option A: Using the CLI Script (Recommended)
1. Prepare a CSV file (e.g. `participants.csv`) with the columns:
   ```csv
   phone,name,event,eventTrack,college,certificateType,date
   9876543210,Aarav Sharma,Open Sesame,Technical Quiz & Puzzle Challenge,R.V.R. & J.C. College of Engineering,Certificate of Participation,09 October 2026
   ```
2. Run the generator script:
   ```bash
   node scripts/generate-hashes.js participants.csv data/participants.json
   ```
3. The script will automatically validate numbers, compute SHA-256 hashes, assign sequential certificate IDs (`AIK26-0001`...), and write `data/participants.json`.

### Option B: Using the Web GUI Tool (No CLI Required)
Open `scripts/hash-generator.html` in your web browser.  
Paste names, phone numbers, and event information. Click **Generate JSON**, and download or copy the resulting dataset into `data/participants.json`.

---

## 4. Deploying Updated Data to GitHub Pages

Once `data/participants.json` has been updated:
```bash
git add data/participants.json
git commit -m "Update participant dataset: add new records"
git push origin main
```
GitHub Pages will automatically build and publish the new dataset within 1–2 minutes.

---

## 5. Security & Privacy Notice for Static Hosting

> [!WARNING]
> **Static GitHub Pages Security Boundary:**
> 
> Because this portal is hosted entirely statically on GitHub Pages, `data/participants.json` is publicly downloadable by anyone inspecting network requests.
>
> While raw phone numbers are replaced with SHA-256 hashes (which prevents casual human reading and prevents phone numbers from appearing in URLs, DOM, QR codes, or logs), unsalted SHA-256 hashes of 10-digit numbers have a finite keyspace ($10^{10}$) and can theoretically be reversed via precomputed rainbow tables or brute-force dictionary attacks.
>
> **Best Practice for Higher Privacy:**  
> For production deployments requiring confidentiality of attendance lists:
> - Migrate the lookup to a lightweight Serverless API (e.g. Cloudflare Worker, AWS Lambda, or Vercel Edge Function).
> - Store the participant list behind the serverless function.
> - The client sends `POST /api/lookup { phone }` over HTTPS, and the server returns only that single participant's certificate record upon match.
> 
> The frontend data access layer in `assets/js/crypto.js` and `assets/js/certificate.js` has been cleanly decoupled to enable seamless transition to a serverless backend without altering the UI.
