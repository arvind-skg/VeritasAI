"""
VeritasAI Python SDK — Client Implementation
"""
import os
import json
import time
import urllib.request
import urllib.error
from typing import Optional, Dict, Any

from .exceptions import (
    VeritasAIError,
    AuthenticationError,
    CredentialRevokedError,
    InvalidAgentError,
    ValidationError,
    RateLimitError,
    VerificationError,
    NetworkError,
    ServerError,
)
from .models import DecisionRecord, VerificationVerdict, AgentInfo


class VeritasAI:
    """
    Client for interacting with the VeritasAI Evidence & Audit Platform.

    Usage:
        from veritasai import VeritasAI

        client = VeritasAI(api_key="vra_live_...")
        decision = client.log_decision(
            decision="approved",
            input_data={"credit_score": 750, "income": 90000},
            output={"loan_amount": 350000},
            metadata={"application_id": "APP-102"}
        )
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: float = 15.0,
        max_retries: int = 2,
    ):
        self.api_key = api_key or os.getenv("VERITASAI_API_KEY")
        if not self.api_key:
            raise AuthenticationError(
                "Missing VeritasAI API key. Pass 'api_key' to VeritasAI() or set 'VERITASAI_API_KEY'."
            )

        raw_url = base_url or os.getenv("VERITASAI_BASE_URL", "http://localhost:4000/api/v1")
        self.base_url = raw_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max(0, max_retries)

    def _request(
        self,
        method: str,
        path: str,
        data: Optional[Dict[str, Any]] = None,
        authenticate: bool = True,
    ) -> Dict[str, Any]:
        """Internal HTTP transport helper with retries and structured error handling."""
        url = f"{self.base_url}{path}"
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "VeritasAI-Python-SDK/1.0.0",
        }
        if authenticate:
            headers["Authorization"] = f"Bearer {self.api_key}"

        encoded_data = json.dumps(data).encode("utf-8") if data is not None else None

        last_exception = None
        for attempt in range(self.max_retries + 1):
            req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
            try:
                with urllib.request.urlopen(req, timeout=self.timeout) as response:
                    raw_body = response.read().decode("utf-8")
                    return json.loads(raw_body) if raw_body else {}
            except urllib.error.HTTPError as err:
                raw_body = err.read().decode("utf-8")
                try:
                    error_json = json.loads(raw_body)
                    error_msg = error_json.get("error", str(err))
                    request_id = error_json.get("requestId")
                except Exception:
                    error_msg = raw_body or str(err)
                    request_id = None

                status = err.code
                if status == 401:
                    if "revoked" in error_msg.lower():
                        raise CredentialRevokedError(error_msg, status, request_id)
                    raise AuthenticationError(error_msg, status, request_id)
                elif status == 403:
                    raise InvalidAgentError(error_msg, status, request_id)
                elif status == 400:
                    raise ValidationError(error_msg, status, request_id)
                elif status == 429:
                    raise RateLimitError(error_msg, status, request_id)
                elif status >= 500:
                    if attempt < self.max_retries:
                        time.sleep(0.5 * (attempt + 1))
                        continue
                    raise ServerError(error_msg, status, request_id)
                else:
                    raise VeritasAIError(error_msg, status, request_id)

            except (urllib.error.URLError, TimeoutError) as err:
                last_exception = NetworkError(f"Network error communicating with VeritasAI at {url}: {err}")
                if attempt < self.max_retries:
                    time.sleep(0.5 * (attempt + 1))
                    continue
                raise last_exception

        if last_exception:
            raise last_exception
        raise VeritasAIError("Unknown error occurred during API request")

    def log_decision(
        self,
        decision: str,
        input_data: Optional[Dict[str, Any]] = None,
        output: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        risk_level: str = "LOW",
        event_type: Optional[str] = None,
        model_info: Optional[Dict[str, Any]] = None,
    ) -> DecisionRecord:
        """
        Record an AI decision and generate cryptographic evidence.

        Args:
            decision: Business outcome (e.g. 'approved', 'rejected', 'escalated').
            input_data: Context provided to the model (salted and hashed for privacy).
            output: Decision outputs or recommendations.
            metadata: Non-sensitive indexing identifiers (e.g. application_id, session_id).
            risk_level: 'LOW', 'MEDIUM', 'HIGH', or 'CRITICAL'.
            event_type: Optional categorization (e.g. 'loan_underwriting').
            model_info: Optional details (e.g. {'model': 'gpt-4o', 'version': '1.2'}).

        Returns:
            DecisionRecord with event_id, verification_status, and cryptographic receipt.
        """
        payload = {
            "decision": decision,
            "input_data": input_data or {},
            "output": output or {},
            "metadata": metadata or {},
            "risk_level": risk_level.upper(),
            "event_type": event_type,
            "model_info": model_info,
        }
        res = self._request("POST", "/decisions", data=payload)
        return DecisionRecord.from_dict(res)

    def log_event(
        self,
        event_type: str,
        metadata: Optional[Dict[str, Any]] = None,
        payloads: Optional[Dict[str, Any]] = None,
        decision: Optional[str] = None,
        risk_level: str = "LOW",
    ) -> Dict[str, Any]:
        """
        Record a generic evidence event (compatible with core VeritasAI pipeline).
        """
        payload = {
            "agentId": "self",
            "eventType": event_type,
            "metadata": metadata or {},
            "payloads": payloads or {},
            "decision": decision,
            "riskLevel": risk_level,
        }
        return self._request("POST", "/events", data=payload)

    def verify(self, event_id: str) -> VerificationVerdict:
        """
        Cryptographically re-verify an existing decision receipt offline across all 7 trust domains.

        Args:
            event_id: The ID of the decision or event to verify.

        Returns:
            VerificationVerdict with ok boolean, schema, and 7-domain checks.
        """
        res = self._request("POST", f"/events/{event_id}/verify")
        return VerificationVerdict.from_dict(res)

    def get_decision(self, event_id: str) -> Dict[str, Any]:
        """Retrieve full details and receipt for a previously recorded decision."""
        res = self._request("GET", f"/decisions/{event_id}")
        return res.get("decision", {})

    def health_check(self) -> Dict[str, Any]:
        """Verify connectivity to the VeritasAI platform."""
        return self._request("GET", "/health", authenticate=False)
