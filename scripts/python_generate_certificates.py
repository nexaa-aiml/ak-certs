#!/usr/bin/env python3
"""
AI KSHETRA 2026 - Python Certificate & Dataset Generator
NEXAA - Next Gen Engineers & AI Association
R.V.R. & J.C. College of Engineering, Guntur

This script:
1. Reads participant details from CSV or raw dictionary records.
2. Normalizes Indian phone numbers (handling +91, 91, 0, spaces, dashes).
3. Computes the SHA-256 hash using Python's standard `hashlib`.
4. Outputs the privacy-preserving `data/participants.json`.
5. Generates high-quality A4 landscape PDF certificates into `certificates/<id>.pdf`
   with embedded verification QR codes.
"""

import os
import re
import csv
import json
import hashlib
from pathlib import Path

# Optional: ReportLab & QRCode for direct PDF rendering
try:
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.pdfgen import canvas
    from reportlab.lib import colors
    import qrcode
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


# =====================================================================
# CONFIGURATION
# =====================================================================
# Update with your GitHub Pages URL or leave empty for auto-detection
SITE_BASE_URL = "https://your-username.github.io/your-repo-name"

EVENT_NAME = "AI KSHETRA 2026"
EVENT_DATE = "09 October 2026"
INSTITUTION = "R.V.R. & J.C. College of Engineering"
ORGANIZER = "NEXAA - Next Gen Engineers & AI Association"


# =====================================================================
# 1. PHONE NORMALIZATION & SHA-256 HASHING
# =====================================================================
def normalize_phone_number(raw_phone: str) -> str | None:
    """
    Normalizes Indian mobile phone numbers to a clean 10-digit string.
    
    Accepts:
        - "9876543210"
        - "+919876543210"
        - "919876543210"
        - "09876543210"
        - "+91 98765-43210"
    
    Returns:
        10-digit string starting with 6, 7, 8, or 9, or None if invalid.
    """
    if not raw_phone:
        return None
    
    # Strip all non-digit characters
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
    Computes 64-character lowercase hexadecimal SHA-256 hash.
    Matches browser `crypto.subtle.digest('SHA-256')` exactly.
    """
    return hashlib.sha256(normalized_phone.encode('utf-8')).hexdigest().lower()


# =====================================================================
# 2. PDF CERTIFICATE GENERATOR (REPORTLAB)
# =====================================================================
def generate_pdf_certificate(participant: dict, output_pdf_path: str, site_base_url: str):
    """
    Generates an official A4 landscape PDF certificate.
    """
    if not REPORTLAB_AVAILABLE:
        print(f"Skipping PDF creation for {participant['certificateId']} (reportlab/qrcode not installed)")
        return

    # A4 Landscape dimensions in points (841.89 x 595.27)
    width, height = landscape(A4)
    c = canvas.Canvas(output_pdf_path, pagesize=landscape(A4))
    c.setTitle(f"AI Kshetra 2026 - {participant['name']} - {participant['certificateId']}")

    # Colors
    magenta = colors.HexColor("#ff007a")
    dark_gray = colors.HexColor("#111827")
    muted_gray = colors.HexColor("#4b5563")

    # 1. Outer Border
    c.setStrokeColor(dark_gray)
    c.setLineWidth(2.5)
    c.rect(25, 25, width - 50, height - 50)

    # 2. Inner Magenta Border
    c.setStrokeColor(magenta)
    c.setLineWidth(1)
    c.rect(32, 32, width - 64, height - 64)

    # 3. Corner tick marks
    c.setFillColor(magenta)
    c.setFont("Courier-Bold", 16)
    c.drawString(36, height - 46, "+")
    c.drawString(width - 46, height - 46, "+")
    c.drawString(36, 38, "+")
    c.drawString(width - 46, 38, "+")

    # 4. Header Institution & Event Title
    c.setFillColor(dark_gray)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(55, height - 70, INSTITUTION)

    c.setFont("Helvetica", 9)
    c.setFillColor(muted_gray)
    c.drawString(55, height - 85, "Autonomous Institution • Accredited by NBA & NAAC 'A+' Grade • Guntur, AP")
    c.drawString(55, height - 98, ORGANIZER)

    # Event Brand Badge (Right aligned)
    c.setFillColor(magenta)
    c.setFont("Courier-Bold", 18)
    c.drawRightString(width - 55, height - 70, ">_ " + EVENT_NAME)
    c.setFont("Courier", 9)
    c.setFillColor(dark_gray)
    c.drawRightString(width - 55, height - 86, "ANNUAL NATIONAL AI SYMPOSIUM")

    # Header Divider Line
    c.setStrokeColor(colors.HexColor("#e5e7eb"))
    c.setLineWidth(1)
    c.line(55, height - 110, width - 55, height - 110)

    # 5. Certificate Main Body
    c.setFillColor(dark_gray)
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(width / 2, height - 160, participant.get("certificateType", "CERTIFICATE OF PARTICIPATION").upper())

    c.setFont("Times-Italic", 14)
    c.setFillColor(muted_gray)
    c.drawCentredString(width / 2, height - 190, "This certificate is proudly presented to")

    # Participant Name (Underlined in Magenta)
    c.setFont("Helvetica-Bold", 26)
    c.setFillColor(dark_gray)
    c.drawCentredString(width / 2, height - 235, participant["name"].upper())

    # Magenta underline below name
    name_width = c.stringWidth(participant["name"].upper(), "Helvetica-Bold", 26)
    c.setStrokeColor(magenta)
    c.setLineWidth(2)
    c.line((width - name_width) / 2 - 20, height - 245, (width + name_width) / 2 + 20, height - 245)

    # Achievement Statement
    c.setFont("Helvetica", 12)
    c.setFillColor(dark_gray)
    c.drawCentredString(
        width / 2, height - 280,
        f"of {participant['college']} for successfully participating in"
    )

    c.setFont("Courier-Bold", 14)
    c.setFillColor(magenta)
    c.drawCentredString(width / 2, height - 305, f"[ {participant['event'].upper()} ]")

    c.setFont("Helvetica", 11)
    c.setFillColor(dark_gray)
    c.drawCentredString(
        width / 2, height - 330,
        f"as part of {EVENT_NAME}, organized by {ORGANIZER} on {participant.get('date', EVENT_DATE)}."
    )

    # 6. QR Code Generation for Verification
    cert_id = participant["certificateId"]
    verify_url = f"{site_base_url.rstrip('/')}/verify/?id={cert_id}"
    
    qr = qrcode.QRCode(box_size=3, border=1)
    qr.add_data(verify_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    import io
    from reportlab.lib.utils import ImageReader
    img_buffer = io.BytesIO()
    qr_img.save(img_buffer, format='PNG')
    img_buffer.seek(0)
    reader = ImageReader(img_buffer)

    # Draw QR code on left side of footer
    c.drawImage(reader, 55, 60, width=80, height=80)

    c.setFont("Courier-Bold", 7)
    c.setFillColor(magenta)
    c.drawString(55, 50, f"ID: {cert_id}")
    c.setFont("Courier", 6)
    c.setFillColor(muted_gray)
    c.drawString(55, 42, "SCAN TO VERIFY")

    # 7. Signature blocks
    sig_y = 70
    sigs = [
        ("Dr. K. Swaminathan", "Faculty Coordinator", "NEXAA / AI Kshetra 2026", 260),
        ("P. Hemanth Kumar", "Student Convener", "NEXAA Association", 470),
        ("Dr. K. Ravindra", "Principal / HOD", "R.V.R. & J.C. CoE, Guntur", 680)
    ]

    for name, role, dept, x in sigs:
        c.setStrokeColor(dark_gray)
        c.setLineWidth(1)
        c.line(x - 80, sig_y + 35, x + 80, sig_y + 35)

        c.setFont("Times-Italic", 12)
        c.setFillColor(colors.HexColor("#1e3a8a"))
        c.drawCentredString(x, sig_y + 42, name)

        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(dark_gray)
        c.drawCentredString(x, sig_y + 20, name)

        c.setFont("Helvetica", 7.5)
        c.setFillColor(muted_gray)
        c.drawCentredString(x, sig_y + 8, role)
        c.drawCentredString(x, sig_y - 2, dept)

    c.save()
    print(f"  [OK] Generated PDF: {output_pdf_path}")


# =====================================================================
# 3. MAIN DATA PROCESSING & EXPORT WORKFLOW
# =====================================================================
def process_and_export(csv_path: str, json_out_path: str, pdf_out_dir: str, site_base_url: str):
    """
    Converts participant CSV into hashed JSON and generates matching PDFs.
    """
    Path(json_out_path).parent.mkdir(parents=True, exist_ok=True)
    Path(pdf_out_dir).mkdir(parents=True, exist_ok=True)

    participants = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        seq = 1
        for row in reader:
            raw_phone = row.get('phone') or row.get('mobile') or row.get('registered_phone')
            norm_phone = normalize_phone_number(raw_phone)
            
            if not norm_phone:
                print(f"  [WARN] Skipping invalid phone '{raw_phone}' for participant '{row.get('name')}'")
                continue

            cert_id = row.get('certificateId') or f"AIK26-{str(seq).zfill(4)}"
            seq += 1

            record = {
                "certificateId": cert_id,
                "phoneHash": hash_phone_number(norm_phone),
                "name": row.get('name', 'Participant').strip(),
                "event": row.get('event', 'Open Sesame').strip(),
                "eventTrack": row.get('eventTrack', '').strip(),
                "college": row.get('college', INSTITUTION).strip(),
                "certificateType": row.get('certificateType', 'Certificate of Participation').strip(),
                "date": row.get('date', EVENT_DATE).strip()
            }
            participants.append(record)

            # Generate PDF matching the certificateId
            pdf_path = os.path.join(pdf_out_dir, f"{cert_id}.pdf")
            generate_pdf_certificate(record, pdf_path, site_base_url)

    # Save data/participants.json
    with open(json_out_path, 'w', encoding='utf-8') as f:
        json.dump(participants, f, indent=2, ensure_ascii=False)

    print("\n=======================================================")
    print(f"SUCCESS: Exported {len(participants)} records.")
    print(f"  JSON output: {json_out_path}")
    print(f"  PDF output : {pdf_out_dir}/")
    print("=======================================================")


if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent.parent
    csv_file = base_dir / "data" / "sample-participants.csv"
    json_file = base_dir / "data" / "participants.json"
    pdf_dir = base_dir / "certificates"

    print("> Generating certificates & dataset from CSV...")
    process_and_export(
        csv_path=str(csv_file),
        json_out_path=str(json_file),
        pdf_out_dir=str(pdf_dir),
        site_base_url=SITE_BASE_URL
    )
