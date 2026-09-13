"""
VeritasAI Example: Customer Support / Refund Processing AI Agent
Demonstrates decorator and direct telemetry usage for autonomous agents.
"""
from veritasai import VeritasAI

client = VeritasAI(
    api_key="vra_live_your_agent_key_here",
    base_url="http://localhost:4000/api/v1"
)

def process_refund_request(order_id: str, amount: float, reason: str) -> dict:
    """
    Automated refund processing agent.
    """
    if amount <= 150.0:
        decision = "instant_refund_approved"
        risk = "LOW"
    elif amount <= 500.0 and reason == "damaged_item":
        decision = "refund_approved_with_verification"
        risk = "MEDIUM"
    else:
        decision = "escalated_to_human_supervisor"
        risk = "HIGH"

    # Log decision to VeritasAI
    client.log_decision(
        decision=decision,
        input_data={"amount": amount, "reason": reason},
        output={"status": decision},
        metadata={"order_id": order_id},
        risk_level=risk,
        event_type="refund_processing"
    )

    return {"order_id": order_id, "decision": decision}

if __name__ == "__main__":
    print("Example Support Agent ready for integration.")
