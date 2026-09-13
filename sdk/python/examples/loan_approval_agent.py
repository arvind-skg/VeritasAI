"""
VeritasAI Example: Loan Approval AI Agent
Demonstrates integrating VeritasAI into a production underwriting agent.
"""
from veritasai import VeritasAI

# Initialize VeritasAI client
# Replace with your agent's API key generated in the VeritasAI Dashboard
client = VeritasAI(
    api_key="vra_live_your_agent_key_here",
    base_url="http://localhost:4000/api/v1"
)

def evaluate_loan_application(applicant: dict) -> dict:
    """
    Company proprietary loan underwriting model.
    Runs entirely on company infrastructure.
    """
    credit_score = applicant.get("credit_score", 0)
    income = applicant.get("income", 0)
    requested_amount = applicant.get("requested_amount", 0)

    # Business decision logic
    if credit_score >= 700 and income > 50000:
        decision = "approved"
        risk_level = "LOW"
        approved_amount = requested_amount
        rate = 6.25
    elif credit_score >= 620 and income > 40000:
        decision = "conditional_approval"
        risk_level = "MEDIUM"
        approved_amount = min(requested_amount, income * 2)
        rate = 8.75
    else:
        decision = "rejected"
        risk_level = "HIGH"
        approved_amount = 0
        rate = 0.0

    result = {
        "decision": decision,
        "approved_amount": approved_amount,
        "interest_rate": rate,
    }

    # 1-Line Cryptographic Telemetry Recording via VeritasAI
    # Private customer PII (e.g. name, SSN, income) is salted & hashed client-side
    evidence = client.log_decision(
        decision=decision,
        input_data={
            "credit_score": credit_score,
            "income": income,
            "requested_amount": requested_amount,
        },
        output=result,
        metadata={
            "application_id": applicant.get("application_id"),
            "underwriting_model": "credit-eval-v3.1",
        },
        risk_level=risk_level,
        event_type="loan_underwriting"
    )

    print(f"Decision: {decision} | Secured Cryptographic Receipt: {evidence.event_id}")
    return result

if __name__ == "__main__":
    applicant = {
        "application_id": "APP-8421",
        "name": "Alice Smith",
        "credit_score": 745,
        "income": 85000,
        "requested_amount": 300000
    }
    # Note: Requires a valid active API key to run standalone
    print("Example Loan Agent ready for integration.")
