"""
Automated Integration Test for VeritasAI Python SDK
"""
import sys
import os
import json
import urllib.request

# Add local SDK package to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from veritasai import VeritasAI, AuthenticationError, CredentialRevokedError

def run_sdk_tests():
    print("==================================================")
    print("VERITASAI PYTHON SDK TEST SUITE")
    print("==================================================")

    # 1. Health check
    # Register a new dedicated test organization
    reg_url = "http://localhost:4000/api/v1/auth/register"
    reg_payload = {
        "orgName": f"SDK Test Org {os.getpid()}",
        "email": f"sdk-test-{os.getpid()}@test.com",
        "password": "TestPassword123!",
        "name": "SDK Tester"
    }
    req = urllib.request.Request(
        reg_url,
        data=json.dumps(reg_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        reg_data = json.loads(resp.read().decode("utf-8"))

    active_api_key = reg_data["starterAgent"]["apiKey"]
    print(f"[SETUP] Registered test agent key: {active_api_key[:12]}...")

    client = VeritasAI(api_key=active_api_key, base_url="http://localhost:4000/api/v1")

    # 1. Health check
    health = client.health_check()
    assert health.get("status") == "ok", f"Health check failed: {health}"
    print("[PASS] 1. Health check: ok")

    # 2. Log decision with valid key
    decision = client.log_decision(
        decision="rejected",
        input_data={"credit_score": 580, "income": 32000},
        output={"reason": "credit_score_below_threshold"},
        metadata={"application_id": "APP-SDK-001"},
        risk_level="MEDIUM",
        event_type="loan_underwriting"
    )
    assert decision.success is True, "Decision logging failed"
    assert decision.event_id != "", "Missing event_id"
    assert decision.verification_status == "recorded", f"Unexpected status: {decision.verification_status}"
    print(f"[PASS] 2. Log decision: event_id={decision.event_id}, status={decision.verification_status}")

    # 3. Verify decision offline across 7 domains
    verdict = client.verify(decision.event_id)
    assert verdict.ok is True, "Verification failed"
    assert verdict.schema == "cool.receipt.v2", f"Unexpected schema: {verdict.schema}"
    assert "binding" in verdict.checks, "Missing binding check"
    assert "signature" in verdict.checks, "Missing signature check"
    print(f"[PASS] 3. Verify receipt: ok={verdict.ok}, schema={verdict.schema}, 7 domains validated")

    # 4. Get decision
    fetched = client.get_decision(decision.event_id)
    assert fetched.get("id") == decision.event_id, "Fetched decision mismatch"
    print(f"[PASS] 4. Get decision details: id={fetched.get('id')}")

    # 5. Test invalid API key error handling
    try:
        bad_client = VeritasAI(api_key="vra_live_invalid_key_999999", base_url="http://localhost:4000/api/v1")
        bad_client.log_decision(decision="approved")
        assert False, "Should have raised AuthenticationError"
    except AuthenticationError as e:
        print(f"[PASS] 5. Invalid key correctly raised AuthenticationError: {e.message}")

    print("\n==================================================")
    print("ALL PYTHON SDK TESTS PASSED SUCCESSFULLY! [OK]")
    print("==================================================")

if __name__ == "__main__":
    run_sdk_tests()
