import io
import os
import secrets
from functools import wraps
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
try:
    from pypdf import PdfMerger as PdfMergerClass
except (ImportError, AttributeError):
    from pypdf import PdfWriter as PdfMergerClass
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_LEFT

app = Flask(__name__)
CORS(app)

# Authentication Configuration
# Default master password is 'tajdoc2026' if not set in environment
MASTER_PASSWORD = os.environ.get("APP_PASSWORD", "tajdoc2026")
# In-memory active tokens mapped to role and session info
ACTIVE_SESSIONS = {}

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        token = None
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()
        elif request.cookies.get("auth_token"):
            token = request.cookies.get("auth_token")

        if not token or token not in ACTIVE_SESSIONS:
            return jsonify({
                "error": "Authentication required. Please enter the master password.",
                "authenticated": False
            }), 401

        request.user_session = ACTIVE_SESSIONS[token]
        return f(*args, **kwargs)
    return decorated

@app.route("/", methods=["GET"])
def index():
    return jsonify({"message": "PDF Tools API is running"})

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "running", "message": "PDF Tools API is running"})

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    password = data.get("password", "")

    if not password:
        return jsonify({"error": "Please enter the password."}), 400

    if password == MASTER_PASSWORD:
        # Create a secure session token
        token = secrets.token_hex(24)
        ACTIVE_SESSIONS[token] = {
            "role": "superadmin",
            "privileges": ["merge_pdf", "text_to_pdf", "system_status", "unlimited_processing"],
            "user": "admin"
        }
        return jsonify({
            "success": True,
            "token": token,
            "role": "superadmin",
            "user": "admin",
            "message": "Super Admin access granted"
        })
    else:
        return jsonify({"error": "Invalid master password. Access denied."}), 401

@app.route("/api/auth-check", methods=["GET"])
def auth_check():
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()

    if token and token in ACTIVE_SESSIONS:
        session = ACTIVE_SESSIONS[token]
        return jsonify({
            "authenticated": True,
            "role": session.get("role", "superadmin"),
            "user": session.get("user", "admin")
        })

    return jsonify({"authenticated": False}), 401

@app.route("/api/logout", methods=["POST"])
def logout():
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
        ACTIVE_SESSIONS.pop(token, None)
    return jsonify({"success": True, "message": "Logged out successfully"})

@app.route("/merge-pdf", methods=["POST"])
@token_required
def merge_pdf():
    # Extract uploaded files (supports "files", "files[]", or multiple file keys)
    uploaded_files = []
    if "files" in request.files:
        uploaded_files = request.files.getlist("files")
    elif "files[]" in request.files:
        uploaded_files = request.files.getlist("files[]")
    else:
        # Check for sequential keys like file1, file2, file3... or any uploaded file items
        sorted_keys = sorted(request.files.keys())
        for key in sorted_keys:
            f = request.files[key]
            if f and f.filename:
                uploaded_files.append(f)

    # Filter out empty entries
    uploaded_files = [f for f in uploaded_files if f and f.filename]

    if len(uploaded_files) < 2:
        return jsonify({"error": "Please select at least 2 PDF files to merge."}), 400

    if len(uploaded_files) > 5:
        return jsonify({"error": "You can merge a maximum of 5 PDF files at a time."}), 400

    # Verify that all files are PDFs
    for f in uploaded_files:
        if not f.filename.lower().endswith(".pdf"):
            return jsonify({"error": "Only PDF files are supported."}), 400

    try:
        merger = PdfMergerClass()
        for f in uploaded_files:
            file_bytes = io.BytesIO(f.read())
            merger.append(file_bytes)

        output_stream = io.BytesIO()
        merger.write(output_stream)
        merger.close()

        output_stream.seek(0)

        return send_file(
            output_stream,
            mimetype="application/pdf",
            as_attachment=True,
            download_name="merged.pdf"
        )
    except Exception as e:
        return jsonify({"error": "Unable to merge the PDFs."}), 400

@app.route("/text-to-pdf", methods=["POST"])
@token_required
def text_to_pdf():
    data = request.get_json(silent=True) or {}
    title = data.get("title", "").strip()
    text = data.get("text", "").strip()

    if not text:
        return jsonify({"error": "Please enter some text."}), 400

    try:
        buffer = io.BytesIO()
        # Standard A4 portrait with 54pt (0.75 in) margins
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=54,
            rightMargin=54,
            topMargin=54,
            bottomMargin=54
        )

        styles = getSampleStyleSheet()
        
        # Custom styles for clean, simple readable font
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            alignment=TA_CENTER if title else TA_LEFT,
            spaceAfter=14
        )
        
        body_style = ParagraphStyle(
            "DocBody",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=11,
            leading=16,
            alignment=TA_LEFT,
            spaceAfter=8
        )

        story = []

        if title:
            # Escape HTML/XML entities in title for reportlab
            safe_title = title.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            story.append(Paragraph(safe_title, title_style))
            story.append(Spacer(1, 14))

        # Split lines/paragraphs to ensure natural flow and multi-page wrapping
        paragraphs = text.split("\n")
        for para in paragraphs:
            if para.strip():
                safe_para = para.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                story.append(Paragraph(safe_para, body_style))
            else:
                story.append(Spacer(1, 8))

        doc.build(story)
        buffer.seek(0)

        return send_file(
            buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name="document.pdf"
        )
    except Exception as e:
        return jsonify({"error": "Unable to create PDF."}), 400

if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
