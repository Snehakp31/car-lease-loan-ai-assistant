def generate_negotiation_email(score, risky_clauses, details):
    email = f"""
Subject: Request for Review of Loan Agreement Terms

Dear Team,

Thank you for sharing the loan agreement. I have reviewed the terms and would like to discuss a few points before proceeding.

Key observations:
- Interest Rate: {details.get("interest_rate")}%
- Loan Amount: ₹{details.get("loan_amount")}
- Tenure: {details.get("tenure_months")} months
- Overall Fairness Score: {score} (Average)

Areas of concern:
"""

    for clause in risky_clauses:
        email += f"""
- {clause['type']}: {clause['description']} (Risk Level: {clause['risk']})
"""

    email += """

I kindly request a review of the above clauses and would appreciate if more favorable terms can be offered.

Looking forward to your response.

Best regards,
[Your Name]
"""

    return email
