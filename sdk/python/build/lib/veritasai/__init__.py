"""
VeritasAI Python SDK
Cryptographic Evidence, Audit & Observability for Enterprise AI Agents
"""

from .client import VeritasAI
from .models import DecisionRecord, VerificationVerdict, AgentInfo
from .decorators import track
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

__version__ = "1.0.0"

__all__ = [
    "VeritasAI",
    "DecisionRecord",
    "VerificationVerdict",
    "AgentInfo",
    "track",
    "VeritasAIError",
    "AuthenticationError",
    "CredentialRevokedError",
    "InvalidAgentError",
    "ValidationError",
    "RateLimitError",
    "VerificationError",
    "NetworkError",
    "ServerError",
]
