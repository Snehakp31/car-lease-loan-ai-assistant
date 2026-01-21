import React, { useState } from "react";
import Login from "./components/Login";
import "./App.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("Choose PDF File");
  const [extractedText, setExtractedText] = useState("");
  const [hiddenFees, setHiddenFees] = useState([]);
  const [fairnessScore, setFairnessScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("Your Name");

  const charCount = extractedText.length;

  /* ================= UPLOAD + OCR ================= */
  const uploadAndExtract = async () => {
    if (!file) {
      toast.error("Please select a PDF file first");
      return;
    }

    setLoading(true);
    setExtractedText("");
    setHiddenFees([]);
    setFairnessScore(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      const textRes = await fetch(
        `http://127.0.0.1:5000/contracts/${uploadData.file_name}`
      );

      const textData = await textRes.json();

      setExtractedText(textData.extracted_text || "No text found.");
      setFairnessScore(textData.fairness_score || null);
      setHiddenFees(textData.hidden_fees || []);

      toast.success("Text extracted successfully!");
    } catch (err) {
      toast.error("Error extracting text");
    } finally {
      setLoading(false);
    }
  };

  /* ================= COUNTER EMAIL ================= */
  const generateCounterEmail = () => {
    if (!fairnessScore) {
      toast.error("Please analyze a contract first");
      return;
    }

    const subject = encodeURIComponent(
      "Request for Revision of Loan Terms – Contract Review"
    );

    const concerns =
      hiddenFees.length > 0
        ? hiddenFees
            .map(
              (r, i) =>
                `${i + 1}. ${r.type} (${r.risk} Risk): ${r.message}`
            )
            .join("\n")
        : "No major risky clauses detected.";

    const body = encodeURIComponent(`
Dear Sir/Madam,

I have reviewed the loan agreement carefully.

Summary:
- Fairness Score: ${fairnessScore.fairness_score}
- Rating: ${fairnessScore.rating}

Concerns:
${concerns}

Kindly request clarification or revision.

Regards,
${userName}
`);

    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`,
      "_blank"
    );

    toast.success("Counter-email generated!");
  };

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    setIsLoggedIn(false);
    setFile(null);
    setExtractedText("");
    setHiddenFees([]);
    setFairnessScore(null);
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="app">
      <ToastContainer />

      <header className="app-header">
        <h1>CAR-LEASE-LOAN-AI-ASSISTANT</h1>
      </header>

      {/* Username */}
      <div className="username-container">
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Your Name"
          className="username-input"
        />
      </div>

      {/* Upload */}
      <div className="card">
        <h2>Upload Contract PDF</h2>

        <input
          type="file"
          id="pdfFile"
          accept=".pdf"
          hidden
          onChange={(e) => {
            setFile(e.target.files[0]);
            setFileName(e.target.files[0]?.name || "Choose PDF File");
          }}
        />

        <label htmlFor="pdfFile" className="file-picker">
          {fileName}
        </label>

        <button
          className="primary-btn"
          onClick={uploadAndExtract}
          disabled={loading}
        >
          {loading ? "Processing..." : "Upload & Extract"}
        </button>
      </div>

      {/* ================= FAIRNESS SCORE (UPDATED) ================= */}
      {fairnessScore && (
        <div className="card fairness-card">
          <h2>Fairness Score</h2>

          <span
            className={`rating-badge ${fairnessScore.rating.toLowerCase()}`}
          >
            {fairnessScore.rating}
          </span>

          <p className="score-number">
            {fairnessScore.fairness_score} / 100
          </p>
          
          {/* Contract Details */}
          <h4>Contract Details</h4>
          <ul>
            <li>📉 Interest Rate: {fairnessScore.details.interest_rate}%</li>
            <li>💰 Loan Amount: ₹{fairnessScore.details.loan_amount}</li>
            <li>
              📆 Tenure: {fairnessScore.details.tenure_months} months
            </li>
          </ul>
          {/* Risk Summary */}
          {hiddenFees.length > 0 && (
            <div className="risk-summary">
              <p>
                This contract contains{" "}
                <strong>{hiddenFees.length} risky clauses</strong>.
              </p>
            </div>
          )}


          {/* Risk Section */}
          {hiddenFees.length > 0 && (
            <div className="risk-section">
              <h3 className="risk-title">
                ⚠️ Hidden / Risky Clauses Detected
              </h3>

              {hiddenFees.map((fee, index) => (
                <div
                  key={index}
                  className={`risk-card ${fee.risk.toLowerCase()}`}
                >
                  <div className="risk-header">
                    <span className="risk-type">{fee.type}</span>
                    <span
                      className={`risk-badge ${fee.risk.toLowerCase()}`}
                    >
                      {fee.risk} Risk
                    </span>
                  </div>
                  <p className="risk-message">{fee.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Score Bar */}
          <div className="score-bar">
            <div
              className="score-fill"
              style={{
                width: `${fairnessScore.fairness_score}%`,
              }}
            />
          </div>

          

          
          {/* Counter Email */}
          <button
            className="primary-btn email-btn"
            onClick={generateCounterEmail}
          >
            ✉️ Generate Counter-Email
          </button>
        </div>
      )}

      {/* Extracted Text */}
      <div className="card">
        <h2>Extracted Text</h2>
        <textarea value={extractedText} readOnly rows="14" />
        <p className="char-count">{charCount} characters</p>
      </div>

      <div className="logout-container">
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <footer className="footer">OCR powered by pdfplumber</footer>
    </div>
  );
}

export default App;
