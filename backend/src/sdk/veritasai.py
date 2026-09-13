"""
VeritasAI Python SDK — 5-Minute Developer Integration
======================================================
Cryptographically seals AI decisions, tool calls, and action lifecycles.

Usage:
    from veritasai import VeritasClient, audit

    client = VeritasClient(api_key="vra_live_...", base_url="http://localhost:3000")

    @audit(action="loan_underwriting", risk="critical", policy="credit-policy-v3.4")
    def evaluate_loan(applicant):
        return model.predict(applicant)
"""

import functools
import json
import time
from typing import Any, Callable, Dict, Optional
import requests


class VeritasClient:
    def __init__(self, api_key: str, base_url: str = "http://localhost:3000"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "VeritasAI-Python-SDK/2.0",
        })

    def record(
        self,
        agent_id: str,
        action: str,
        decision: str,
        input_data: Dict[str, Any],
        output_data: Optional[Dict[str, Any]] = None,
        risk: str = "LOW",
        policy: Optional[Dict[str, Any]] = None,
        model: Optional[Dict[str, Any]] = None,
        human_approval: Optional[Dict[str, Any]] = None,
        tool_calls: Optional[list] = None,
        parent_event_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Record an immutable consequential AI action with cryptographic receipts."""
        payload = {
            "agentId": agent_id,
            "eventType": action,
            "decision": decision,
            "riskLevel": risk,
            "payloads": input_data,
            "metadata": output_data or {},
            "policyProof": policy,
            "modelProvenance": model,
            "humanApproval": human_approval,
            "toolCalls": tool_calls or [],
            "parentEventId": parent_event_id,
        }
        res = self.session.post(f"{self.base_url}/api/v1/events", json=payload)
        res.raise_for_status()
        return res.json()


# Global client instance for decorator convenience
_default_client: Optional[VeritasClient] = None

def init(api_key: str, base_url: str = "http://localhost:3000"):
    global _default_client
    _default_client = VeritasClient(api_key=api_key, base_url=base_url)


def audit(
    action: str,
    risk: str = "LOW",
    agent_id: Optional[str] = None,
    policy_name: Optional[str] = None,
    model_version: Optional[str] = None,
):
    """
    Decorator for zero-friction AI function auditing.
    Captures input arguments, execution result, latency, and anchors the action.
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            input_context = {"args": [str(a) for a in args], "kwargs": kwargs}
            
            result = func(*args, **kwargs)
            duration_ms = (time.time() - start_time) * 1000

            if _default_client and agent_id:
                try:
                    decision_str = str(result.get("decision") if isinstance(result, dict) else result)
                    _default_client.record(
                        agent_id=agent_id,
                        action=action,
                        decision=decision_str,
                        input_data=input_context,
                        output_data={"result": result, "durationMs": duration_ms},
                        risk=risk,
                        policy={"name": policy_name or "Standard-Audit-Policy"},
                        model={"version": model_version or "default-model"},
                    )
                except Exception as e:
                    # Non-blocking fail-safe: never disrupt business application logic
                    print(f"[VeritasAI SDK Warning] Non-blocking audit recording failed: {e}")

            return result
        return wrapper
    return decorator
