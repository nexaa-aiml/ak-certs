# AI KSHETRA 2026 — PYTHON PDF & DATA INTEGRATION GUIDE
> **NEXAA – Next Gen Engineers & AI Association**  
> **R.V.R. & J.C. College of Engineering, Guntur**

This guide explains how to adapt your existing Python certificate generation project so that its generated PDFs and participant records integrate seamlessly into this GitHub Pages certificate portal.

---

## 🏗️ Architecture & Workflow Overview

```text
[ Your Python System ]
   ├── Reads Participant Database / CSV
   ├── Normalizes Indian Mobile Numbers -> 10 digits
   ├── Computes SHA-256 Hashes
   ├── Injects Verification QR Code -> Embeds into PDF
   ├── Saves PDFs to:       /certificates/AIK26-XXXX.pdf
   └── Saves Dataset to:    /data/participants.json
            │
            ▼ (Transfer / Copy files to this repo)
[ This GitHub Pages Repository ]
   ├── git add certificates/ data/participants.json
   ├── git commit -m "Update certificates & participants"
   └── git push origin main
            │
            ▼ (Automated GitHub Actions Deployment)
[ Live Portal https://<user>.github.io/<repo>/ ]
   ├── Participant enters phone -> Browser hashes -> Matches JSON
   ├── [ DOWNLOAD PDF ] -> Serves the pre-generated Python PDF directly!
   └── Scan QR code -> Opens /verify/?id=AIK26-XXXX -> Authentic!
```

When participants search using their phone number, the web portal locates the record in `data/participants.json`. When they click **[ DOWNLOAD CERTIFICATE (PDF) ]**, the portal directly serves your pre-generated PDF from `/certificates/{certificateId}.pdf`.

---

## 1. Participant JSON Schema

Output file: `data/participants.json`

Your Python script should output an array of participant JSON objects matching this exact format:

```json
[
  {
    "certificateId": "AIK26-0001",
    "phoneHash": "4ca10787a27eb098939c0f91a62cc3e831c26b9a2444655ad1ffeb6a4cbaee64",
    "name": "Aarav Sharma",
    "event": "Open Sesame",
    "eventTrack": "Technical Quiz & Puzzle Challenge",
    "college": "R.V.R. & J.C. College of Engineering",
    "certificateType": "Certificate of Participation",
    "date": "09 October 2026"
  }
]
```

### Key Field Requirements:
- `certificateId` *(string)*: Unique identifier formatted as `AIK26-0001`, `AIK26-0002`, etc. Must match the filename of the PDF (`certificates/AIK26-0001.pdf`).
- `phoneHash` *(string)*: 64-character lowercase hexadecimal SHA-256 hash of the normalized 10-digit phone number. **Never put raw phone numbers in this file.**
- `name` *(string)*: Participant full name.
- `event` *(string)*: Event challenge name (`Open Sesame`, `Code Warz`, `World of Agents`, etc.).
- `eventTrack` *(string, optional)*: Subtitle/track name.
- `college` *(string)*: Institution name.
- `certificateType` *(string)*: E.g., `"Certificate of Participation"`, `"Certificate of Merit"`.
- `date` *(string)*: E.g., `"09 October 2026"`.

---

## 2. Phone Normalization & SHA-256 in Python

The web browser normalizes the phone number entered by the participant before hashing it. Your Python script **must use the exact same normalization** so that the hashes match:

```python
import re
import hashlib

def normalize_phone_number(raw_phone: str) -> str | None:
    """
    Normalizes Indian mobile numbers to standard 10 digits.
    Handles:
      - '9876543210'      -> '9876543210'
      - '+919876543210'   -> '9876543210'
      - '919876543210'    -> '9876543210'
      - '09876543210'     -> '9876543210'
      - '+91 98765-43210' -> '9876543210'
    """
    if not raw_phone:
        return None
    
    # Remove all non-digits (spaces, dashes, parentheses, +)
    digits = re.sub(r'\D', '', str(raw_phone))
    
    # 12 digits starting with country code 91
    if len(digits) == 12 and digits.startswith('91'):
        ten = digits[2:]
        if re.match(r'^[6-9]\d{9}$', ten):
            return ten
            
    # 11 digits starting with trunk prefix 0
    if len(digits) == 11 and digits.startswith('0'):
        ten = digits[1:]
        if re.match(r'^[6-9]\d{9}$', ten):
            return ten
            
    # Standard 10 digits starting with 6, 7, 8, or 9
    if len(digits) == 10 and re.match(r'^[6-9]\d{9}$', digits):
        return digits
        
    return None


def hash_phone_number(normalized_phone: str) -> str:
    """
    Computes 64-char lowercase hexadecimal SHA-256 hash.
    Identical to browser crypto.subtle.digest('SHA-256').
    """
    return hashlib.sha256(normalized_phone.encode('utf-8')).hexdigest().lower()
```

---

## 3. PDF Naming Convention

Save your generated PDF files directly in the `certificates/` directory using the `certificateId`:

```text
certificates/
├── AIK26-0001.pdf
├── AIK26-0002.pdf
├── AIK26-0003.pdf
...
```

The portal automatically checks for `certificates/<certificateId>.pdf` and downloads it directly when the participant clicks **[ DOWNLOAD CERTIFICATE (PDF) ]**.

---

## 4. QR Code Verification URL

Inside your Python PDF generation routine, include a QR code pointing to the public verification endpoint:

```python
SITE_BASE_URL = "https://<your-username>.github.io/<your-repo-name>"

def get_verification_url(certificate_id: str) -> str:
    return f"{SITE_BASE_URL.rstrip('/')}/verify/?id={certificate_id}"
```

### Example generating QR with the `qrcode` library in Python:
```python
import qrcode
import io

qr = qrcode.QRCode(box_size=3, border=1)
qr.add_data(get_verification_url("AIK26-0001"))
qr.make(fit=True)
qr_img = qr.make_image(fill_color="black", back_color="white")

# Save to buffer or file for insertion into your PDF template
buffer = io.BytesIO()
qr_img.save(buffer, format="PNG")
buffer.seek(0)
```

---

## 5. Ready-to-Use Python Export Snippet

Here is a template you can drop directly into your existing Python script:

```python
import csv
import json
from pathlib import Path

def export_portal_data(participant_list, output_json_path, output_pdf_folder):
    """
    Takes your participant records, saves data/participants.json,
    and guides PDF placement.
    """
    json_records = []
    
    for item in participant_list:
        raw_phone = item.get("phone")
        norm_phone = normalize_phone_number(raw_phone)
        
        if not norm_phone:
            print(f"[SKIP] Invalid phone: {raw_phone} for {item.get('name')}")
            continue
            
        cert_id = item.get("certificateId")
        
        record = {
            "certificateId": cert_id,
            "phoneHash": hash_phone_number(norm_phone),
            "name": item.get("name"),
            "event": item.get("event"),
            "eventTrack": item.get("eventTrack", ""),
            "college": item.get("college", "R.V.R. & J.C. College of Engineering"),
            "certificateType": item.get("certificateType", "Certificate of Participation"),
            "date": item.get("date", "09 October 2026")
        }
        json_records.append(record)
        
        # In your existing PDF generator:
        # your_pdf_generator(record, output_path=f"{output_pdf_folder}/{cert_id}.pdf")

    # Write JSON
    Path(output_json_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(json_records, f, indent=2, ensure_ascii=False)
        
    print(f"Exported {len(json_records)} participant records to {output_json_path}")
```

---

## 6. Transferring & Deploying to GitHub Pages

Once your Python script finishes running:

### Step 1: Copy/Move the files to this repository
- Copy your generated PDFs into `certificates/`
- Copy your generated JSON into `data/participants.json`

```bash
# Example bash copy commands (if generated in another folder):
cp -r /path/to/my_python_project/output_pdfs/*.pdf ./certificates/
cp /path/to/my_python_project/output/participants.json ./data/participants.json
```

### Step 2: Commit and Push
```bash
git add certificates/ data/participants.json
git commit -m "feat: add Python-generated PDF certificates and updated participants dataset"
git push origin main
```

Within 1–2 minutes, GitHub Actions will publish the updated PDFs and participants dataset. Participants can immediately retrieve and download the Python-generated PDFs.

---

## 7. Reference Python Script in this Repository

A working script demonstrating this entire workflow is available at:
[`scripts/python_generate_certificates.py`](file:///c:/playGround/proj_web/cert-site/scripts/python_generate_certificates.py)

You can run it anytime with:
```bash
python scripts/python_generate_certificates.py
```
It reads `data/sample-participants.csv`, normalizes all phone numbers, hashes them, updates `data/participants.json`, and generates sample PDFs into `certificates/AIK26-XXXX.pdf`.
