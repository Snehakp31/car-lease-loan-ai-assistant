import re

# ---------------------------------------
# STEP 1: Extract key fields from contract
# ---------------------------------------
def extract_key_fields(text):
    fields = {}

    # Loan Amount
    loan_amount = re.search(r"Loan Amount[:\s₹]*([\d,]+)", text)
    if loan_amount:
        fields["loan_amount"] = int(loan_amount.group(1).replace(",", ""))

    # Interest Rate
    interest = re.search(r"Interest Rate.*?([\d.]+)%", text)
    if interest:
        fields["interest_rate"] = float(interest.group(1))

    # Loan Tenure
    tenure = re.search(r"(Tenure|Loan Tenure)[:\s]*(\d+)", text)
    if tenure:
        fields["tenure_months"] = int(tenure.group(2))

    return fields


# ---------------------------------------
# STEP 2: Normalize extracted values
# ---------------------------------------
def normalize_fields(fields):
    scores = {}

    # Interest rate scoring (lower interest = better)
    interest = fields.get("interest_rate", 15)
    scores["interest_score"] = max(0, 100 - interest * 5)

    # Tenure scoring (shorter tenure = better)
    tenure = fields.get("tenure_months", 60)
    scores["tenure_score"] = max(0, 100 - tenure)

    return scores


# ---------------------------------------
# STEP 3: Compute final fairness score
# ---------------------------------------
def compute_final_score(scores):
    if not scores:
        return 0
    return int(sum(scores.values()) / len(scores))


# ---------------------------------------
# STEP 4: Interpret score
# ---------------------------------------
def interpret_score(score):
    if score >= 80:
        return "Excellent"
    elif score >= 60:
        return "Good"
    elif score >= 40:
        return "Average"
    else:
        return "Poor"


# ---------------------------------------
# STEP 5: MAIN FUNCTION (used by backend)
# ---------------------------------------
def calculate_fairness_score(text):
    extracted_fields = extract_key_fields(text)
    normalized_scores = normalize_fields(extracted_fields)
    score = compute_final_score(normalized_scores)

    return {
        "fairness_score": score,
        "rating": interpret_score(score),
        "details": extracted_fields
    }
