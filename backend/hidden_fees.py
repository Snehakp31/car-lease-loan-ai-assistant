def detect_hidden_fees(text):
    findings = []

    lower_text = text.lower()

    if "late fee" in lower_text or "penalty" in lower_text:
        findings.append({
            "type": "Late Payment Penalty",
            "risk": "High",
            "message": "Late payment penalty clause detected."
        })

    if "early termination" in lower_text or "foreclosure" in lower_text:
        findings.append({
            "type": "Early Termination",
            "risk": "Medium",
            "message": "Early termination charges may apply."
        })

    if "mileage" in lower_text and "charge" in lower_text:
        findings.append({
            "type": "Mileage Overage",
            "risk": "Medium",
            "message": "Extra charges for excess mileage detected."
        })

    if "maintenance" in lower_text:
        findings.append({
            "type": "Maintenance Responsibility",
            "risk": "Low",
            "message": "Maintenance responsibility mentioned."
        })

    if "insurance" in lower_text:
        findings.append({
            "type": "Insurance Clause",
            "risk": "Low",
            "message": "Insurance coverage requirements detected."
        })

    if "purchase option" in lower_text or "buyout" in lower_text:
        findings.append({
            "type": "Purchase Option",
            "risk": "Low",
            "message": "Buyout / purchase option clause present."
        })

    return findings
