"""
VeritasAI Python SDK — Structured Data Models
"""
from dataclasses import dataclass
from typing import Optional, Dict, Any, List


@dataclass
class DecisionRecord:
    """Represents a cryptographically secured AI decision record."""
    success: bool
    event_id: str
    verification_status: str
    decision: str
    risk_level: str
    request_id: str
    receipt: Optional[Dict[str, Any]] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "DecisionRecord":
        return cls(
            success=data.get("success", False),
            event_id=data.get("event_id", ""),
            verification_status=data.get("verification_status", ""),
            decision=data.get("decision", ""),
            risk_level=data.get("risk_level", "LOW"),
            request_id=data.get("request_id", ""),
            receipt=data.get("receipt"),
        )


@dataclass
class VerificationVerdict:
    """Represents the multi-domain cryptographic verification result."""
    event_id: str
    ok: bool
    schema: str
    checks: Dict[str, Any]
    verified_at: Optional[str] = None
    request_id: Optional[str] = None

    @property
    def is_verified(self) -> bool:
        return self.ok

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "VerificationVerdict":
        verdict = data.get("verdict", {})
        return cls(
            event_id=data.get("eventId", ""),
            ok=verdict.get("ok", False),
            schema=verdict.get("schema", ""),
            checks=verdict.get("checks", {}),
            verified_at=data.get("verifiedAt"),
            request_id=data.get("requestId"),
        )


@dataclass
class AgentInfo:
    """Represents agent metadata and profile."""
    id: str
    name: str
    type: str
    environment: str
    status: str
    created_at: str

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "AgentInfo":
        return cls(
            id=data.get("id", ""),
            name=data.get("name", ""),
            type=data.get("type", "CUSTOM"),
            environment=data.get("environment", "PRODUCTION"),
            status=data.get("status", "ACTIVE"),
            created_at=data.get("createdAt", ""),
        )
