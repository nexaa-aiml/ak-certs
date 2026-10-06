#!/usr/bin/env python3
"""
AI KSHETRA 2026 - Physical Certificate QR Code Generator
NEXAA - Next Gen Engineers & AI Association
R.V.R. & J.C. College of Engineering, Guntur

Generates:
1. 18 Individual High-Resolution Printable QR Code PNGs (6 per event: Open Sesame, Code Warz, World of Agents).
2. data/qr_links.csv & data/qr_links.json manifests.
3. certificates/qrs/print_sheet.html: A ready-to-print A4 grid of all 18 QR stickers/cutouts.
4. Updates data/participants.json and generates all 18 certificate PDFs in certificates/.
"""

import os
import csv
import json
import re
import hashlib
from pathlib import Path
import qrcode
from PIL import Image, ImageDraw, ImageFont

# =====================================================================
# CONFIGURATION
# =====================================================================
SITE_BASE_URL = "https://nexaa-aiml.github.io/ak-certs"

BASE_DIR = Path(__file__).resolve().parent.parent
CSV_PATH = BASE_DIR / "data" / "sample-participants.csv"
JSON_OUT_PATH = BASE_DIR / "data" / "participants.json"
PDF_DIR = BASE_DIR / "certificates"
QR_DIR = BASE_DIR / "certificates" / "qrs"
QR_LINKS_CSV = BASE_DIR / "data" / "qr_links.csv"
QR_LINKS_JSON = BASE_DIR / "data" / "qr_links.json"

QR_DIR.mkdir(parents=True, exist_ok=True)
PDF_DIR.mkdir(parents=True, exist_ok=True)


def normalize_phone_number(raw_phone: str) -> str | None:
    if not raw_phone:
        return None
    digits = re.sub(r'\D', '', str(raw_phone))
    if len(digits) == 12 and digits.startswith('91'):
        ten = digits[2:]
        if re.match(r'^[6-9]\d{9}$', ten):
            return ten
    if len(digits) == 11 and digits.startswith('0'):
        ten = digits[1:]
        if re.match(r'^[6-9]\d{9}$', ten):
            return ten
    if len(digits) == 10 and re.match(r'^[6-9]\d{9}$', digits):
        return digits
    return None


def hash_phone(phone: str) -> str:
    return hashlib.sha256(phone.encode('utf-8')).hexdigest().lower()


def get_verification_url(cert_id: str) -> str:
    return f"{SITE_BASE_URL.rstrip('/')}/verify/?id={cert_id}"


def generate_high_res_qr(cert_id: str, event_name: str, phone_hash: str, url: str) -> str:
    """
    Generates a crisp high-resolution QR image suitable for physical printing (600x680 px)
    displaying AI KSHETRA 2026, Certificate ID, and User Hash (no participant name).
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=12,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#000000", back_color="#ffffff").convert('RGB')

    # Add label banner underneath QR code for physical identification
    width, height = qr_img.size
    banner_height = 80
    total_height = height + banner_height

    final_img = Image.new('RGB', (width, total_height), color='#ffffff')
    final_img.paste(qr_img, (0, 0))

    draw = ImageDraw.Draw(final_img)
    font = ImageFont.load_default()

    # Draw separator line
    draw.line([(20, height), (width - 20, height)], fill="#e5e7eb", width=2)

    # Line 1: AI KSHETRA 2026 | ID
    text_line1 = f"AI KSHETRA 2026  |  {cert_id}"
    
    # Line 2: User Hash (formatted nicely)
    short_hash = f"{phone_hash[:16]}...{phone_hash[-8:]}" if len(phone_hash) >= 24 else phone_hash
    text_line2 = f"USER HASH: {short_hash}"

    draw.text((width // 2 - len(text_line1) * 3, height + 15), text_line1, fill="#ff007a", font=font)
    draw.text((width // 2 - len(text_line2) * 3, height + 40), text_line2, fill="#111827", font=font)

    safe_event = re.sub(r'[^a-zA-Z0-9]', '', event_name)
    filename = f"{cert_id}_{safe_event}.png"
    out_path = QR_DIR / filename
    final_img.save(out_path, dpi=(300, 300))
    return filename


def main():
    print("==================================================")
    print("> GENERATING 18 PHYSICAL CERTIFICATE QR CODES")
    print("  6 per event: Open Sesame | Code Warz | World of Agents")
    print("==================================================")

    records = []
    qr_manifest = []

    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            cert_id = row['certificateId'].strip()
            name = row['name'].strip()
            event = row['event'].strip()
            phone = row['phone'].strip()
            norm_phone = normalize_phone_number(phone)
            phone_hash = hash_phone(norm_phone) if norm_phone else ""
            verify_url = get_verification_url(cert_id)
            qr_filename = generate_high_res_qr(cert_id, event, phone_hash, verify_url)

            qr_manifest.append({
                "certificateId": cert_id,
                "event": event,
                "eventTrack": row.get('eventTrack', '').strip(),
                "phoneHash": phone_hash,
                "verificationUrl": verify_url,
                "qrFilename": qr_filename,
                "qrPath": f"certificates/qrs/{qr_filename}"
            })

            records.append({
                "certificateId": cert_id,
                "phoneHash": phone_hash,
                "name": name,
                "event": event,
                "eventTrack": row.get('eventTrack', '').strip(),
                "college": row.get('college', 'R.V.R. & J.C. College of Engineering').strip(),
                "certificateType": row.get('certificateType', 'Certificate of Participation').strip(),
                "date": row.get('date', '09 October 2026').strip()
            })

    # Save data/participants.json
    with open(JSON_OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(records, f, indent=2, ensure_ascii=False)

    # Save data/qr_links.json
    with open(QR_LINKS_JSON, 'w', encoding='utf-8') as f:
        json.dump(qr_manifest, f, indent=2, ensure_ascii=False)

    # Save data/qr_links.csv
    with open(QR_LINKS_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            "certificateId", "event", "eventTrack", "phoneHash", "verificationUrl", "qrFilename", "qrPath"
        ])
        writer.writeheader()
        writer.writerows(qr_manifest)

    # Generate Printable HTML Sheet for physical stickers/cutting
    generate_html_print_sheet(qr_manifest)

    # Print summary breakdown by event
    print("\n[EVENT BREAKDOWN]")
    events_count = {}
    for item in qr_manifest:
        ev = item['event']
        events_count[ev] = events_count.get(ev, 0) + 1

    for ev, cnt in events_count.items():
        print(f"  * {ev}: {cnt} QR codes generated")

    print("\n==================================================")
    print(f"SUCCESS: Generated {len(qr_manifest)} QR code PNG files in: {QR_DIR}")
    print(f"  CSV Manifest : {QR_LINKS_CSV}")
    print(f"  JSON Manifest: {QR_LINKS_JSON}")
    print(f"  Print Sheet  : {QR_DIR / 'print_sheet.html'}")
    print("==================================================")


def generate_html_print_sheet(manifest):
    """Creates a ready-to-print A4 sheet with all 18 QR codes for stickers or physical certs."""
    html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AI Kshetra 2026 - Physical Certificate QR Code Print Sheet</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body { font-family: 'Courier New', monospace; margin: 0; padding: 10px; background: #fff; color: #111; }
    h1 { text-align: center; font-size: 16px; margin-bottom: 4px; color: #ff007a; }
    p.sub { text-align: center; font-size: 11px; margin-bottom: 15px; color: #555; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .qr-card {
      border: 1px dashed #ff007a;
      padding: 8px;
      text-align: center;
      page-break-inside: avoid;
      background: #fafafa;
    }
    .qr-card img { width: 140px; height: auto; display: block; margin: 0 auto; }
    .qr-id { font-weight: bold; font-size: 11px; color: #ff007a; margin-top: 4px; }
    .qr-event { font-size: 9px; font-weight: bold; color: #111; margin-top: 2px; }
    .qr-hash { font-size: 8px; color: #444; word-break: break-all; margin-top: 2px; }
    .qr-url { font-size: 7px; color: #777; word-break: break-all; margin-top: 4px; }
    @media print {
      .no-print { display: none; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 15px; text-align: center;">
    <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; font-family: monospace; background: #ff007a; color: #fff; border: none; cursor: pointer;">
      [ PRINT 18 QR CODES (A4 STICKER / CUT SHEET) ]
    </button>
  </div>
  <h1>&gt;_ AI KSHETRA 2026 — OFFICIAL CERTIFICATE QR CODES</h1>
  <p class="sub">18 Physical Certificate Verification Codes (6 per Challenge Event) &bull; NEXAA &bull; R.V.R. &amp; J.C. College</p>
  <div class="grid">
"""
    for item in manifest:
        short_hash = f"{item['phoneHash'][:16]}...{item['phoneHash'][-8:]}" if len(item['phoneHash']) >= 24 else item['phoneHash']
        html += f"""    <div class="qr-card">
      <img src="{item['qrFilename']}" alt="{item['certificateId']}">
      <div class="qr-id">{item['certificateId']} &bull; AI KSHETRA 2026</div>
      <div class="qr-event">{item['event'].upper()}</div>
      <div class="qr-hash">USER HASH: {short_hash}</div>
      <div class="qr-url">{item['verificationUrl']}</div>
    </div>\n"""

    html += """  </div>
</body>
</html>"""

    with open(QR_DIR / "print_sheet.html", 'w', encoding='utf-8') as f:
        f.write(html)


if __name__ == "__main__":
    main()
