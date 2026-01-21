from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import pdfplumber
from fairness_score import calculate_fairness_score
from hidden_fees import detect_hidden_fees  
from negotiation_assistant import generate_negotiation_email

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app, resources={r"/*": {"origins": "*"}})

# ---------- FOLDERS ----------
UPLOAD_FOLDER = "data/uploads"
EXTRACTED_TEXT_FOLDER = "data/extracted_text"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(EXTRACTED_TEXT_FOLDER, exist_ok=True)

# ---------- SERVE FRONTEND ----------
@app.route("/")
def serve_index():
    return send_from_directory('../frontend', 'index.html')

@app.route("/<path:filename>")
def serve_static_files(filename):
    return send_from_directory('../frontend', filename)

@app.route("/negotiate", methods=["POST"])
def negotiate():
    data = request.json

    email = generate_negotiation_email(
        score=data["fairness_score"],
        risky_clauses=data["risky_clauses"],
        details=data["details"]
    )

    return jsonify({"negotiation_email": email})

# ---------- OCR FUNCTION ----------
def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

        if not text.strip():
            text = "No text could be extracted from this PDF"

    except Exception as e:
        print(f"PDF extraction error: {e}")
        text = f"Error extracting text from PDF: {str(e)}"

    return text

# ---------- UPLOAD API ----------
@app.route("/upload", methods=["POST"])
def upload_file():
    print("Upload endpoint hit!")

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files allowed"}), 400

    pdf_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(pdf_path)

    extracted_text = extract_text_from_pdf(pdf_path)

    text_file_name = file.filename.replace(".pdf", ".txt")
    text_path = os.path.join(EXTRACTED_TEXT_FOLDER, text_file_name)

    with open(text_path, "w", encoding="utf-8") as f:
        f.write(extracted_text)

    return jsonify({
        "message": "File uploaded and text extracted",
        "file_name": file.filename,
        "text_file": text_file_name
    })

# ---------- GET EXTRACTED TEXT + FAIRNESS + HIDDEN FEES ----------
@app.route("/contracts/<filename>", methods=["GET"])
def get_contract_text(filename):
    text_path = os.path.join(
        EXTRACTED_TEXT_FOLDER,
        filename.replace(".pdf", ".txt")
    )

    if not os.path.exists(text_path):
        return jsonify({"error": "Text file not found"}), 404

    with open(text_path, "r", encoding="utf-8") as f:
        extracted_text = f.read()

    # ✅ FAIRNESS SCORE
    fairness_result = calculate_fairness_score(extracted_text)

    # ✅ HIDDEN FEES DETECTION (ADDED)
    hidden_fees = detect_hidden_fees(extracted_text)

    # ✅ RETURN EVERYTHING
    return jsonify({
        "extracted_text": extracted_text,
        "fairness_score": fairness_result,
        "hidden_fees": hidden_fees
    })

# ---------- RUN ----------
if __name__ == "__main__":
    print("\n" + "=" * 50)
    print("🚀 PDF Extractor Server Starting...")
    print("=" * 50)
    print(f"📂 Upload folder: {os.path.abspath(UPLOAD_FOLDER)}")
    print(f"📄 Text folder: {os.path.abspath(EXTRACTED_TEXT_FOLDER)}")
    print(f"🌐 Frontend folder: {os.path.abspath('../frontend')}")
    print("✅ Server running at: http://127.0.0.1:5000")
    print("=" * 50 + "\n")

    app.run(debug=True, port=5000)
