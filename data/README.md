# AI KSHETRA 2026 - CERTIFICATE DATA MANAGEMENT GUIDE
> NEXAA - Next Gen Engineers & AI Association
> R.V.R. & J.C. College of Engineering, Guntur

This directory contains the authoritative certificate dataset used by the AI Kshetra 2026 Certificate Portal.

---

## Architecture Overview

The portal uses a **single unified JSON file** (`data/participants.json`) as its only data source.
This replaces the previous split of multiple JSON files.

The Python certificate generator produces:
1. **PDF files** → dropped into `certificates/<certId>.pdf`
2. **`data/participants.json`** → the single authoritative dataset file this portal reads

The site is static (GitHub Pages). It fetches `data/participants.json`, hashes the phone number client-side with SHA-256, finds all matching certificates, and serves the corresponding PDFs for download.

---

## Data Schema — `data/participants.json`

```json
{
  "certificateId": "AIK26-0001",
  "phoneHash": "e3b0c44298fc1c149afbf4c8996fb924...",
  "name": "Aarav Sharma",
  "event": "Open Sesame",
  "eventTrack": "Technical Quiz & Puzzle Challenge",
  "college": "R.V.R. & J.C. College of Engineering",
  "certificateType": "Certificate of Participation",
  "date": "09 October 2026",
  "pdfFile": "AIK26-0001.pdf",
  "verificationUrl": "https://nexaa-aiml.github.io/ak-certs/verify/?id=AIK26-0001",
  "qrPath": "certificates/qrs/AIK26-0001_OpenSesame.png"
}
```

### Field Descriptions
| Field | Type | Description |
|---|---|---|
| `certificateId` | string | Unique ID in format `AIK26-XXXX`. Pre-assigned IDs 0001–0018 are frozen (QR codes printed). |
| `phoneHash` | string | SHA-256 hash of the normalized 10-digit phone number. Never store raw numbers. |
| `name` | string | Full name as it appears on the certificate. |
| `event` | string | Event name (`Open Sesame`, `Code Warz`, `World of Agents`). |
| `eventTrack` | string | Subtitle/category of the event. |
| `college` | string | Participant's institution. |
| `certificateType` | string | `"Certificate of Participation"` or `"Certificate of Merit"`. |
| `date` | string | Issue date, e.g. `"09 October 2026"`. |
| `pdfFile` | string | Filename of the pre-generated PDF, e.g. `"AIK26-0001.pdf"`. |
| `verificationUrl` | string | Full public URL to the verify page for this cert. |
| `qrPath` | string | Relative path to the QR code PNG image. |

---

## Multi-Certificate Support

**One phone number can appear in multiple entries** — one per event attended.
When a participant scans their QR or enters their phone number, the portal returns ALL matching
certificates and shows a download button for each PDF.

Example: A participant who attended both Open Sesame and Code Warz will have 2 entries
with the same `phoneHash` but different `certificateId`, `event`, and `pdfFile`.

---

## Phone Number Normalization & Hashing

Before computing the SHA-256 hash:
1. Strip all non-digit characters (spaces, hyphens, parentheses, etc.).
2. If prefixed with country code `91` (12 digits), strip `91`.
3. If prefixed with `0` (11 digits), strip `0`.
4. Verify the result is a valid 10-digit Indian mobile number starting with `6`–`9`.
5. Compute SHA-256 of the 10-digit string.

**Example:**
- Raw input: `+91 98765-43210`
- Normalized: `9876543210`
- SHA-256: `4ca10787a27eb098939c0f91a62cc3e831c26b9a2444655ad1ffeb6a4cbaee64`

---

## Workflow: Adding New Participants

### Step 1 — Python Certificate Generator (separate project)
Your Python project should:
1. Generate PDF certificates → save to `certificates/<certId>.pdf`
2. Compute SHA-256 hashes for each phone number
3. Write `data/participants.json` using the schema above

The IDs `AIK26-0001` through `AIK26-0018` are assigned to printed QR codes —
they are kept at the beginning of `participants.json`.

New participants get sequential IDs starting from `AIK26-0019`.

### Step 2 — Deploy
```bash
git add data/participants.json certificates/
git commit -m "Add certificates for AI Kshetra 2026 batch"
git push origin main
```
GitHub Pages auto-publishes within 1–2 minutes.

---

## Security Notes

> **Static GitHub Pages Security Boundary:**
> `data/participants.json` is publicly downloadable. Phone numbers are stored only as
> SHA-256 hashes (not reversible without brute-force over the ~10^10 number space).
>
> For higher privacy, migrate the lookup to a serverless function (Cloudflare Worker,
> AWS Lambda, etc.) that accepts `POST { phone }` and returns only the matching records.
> The frontend `crypto.js` is cleanly decoupled to support this migration.