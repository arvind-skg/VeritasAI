"""
VeritasAI Python SDK — Typed Exceptions
"""

class VeritasAIError(Exception):
    """Base exception for all VeritasAI errors."""
    def __init__(self, message: str, status_code: int = None, request_id: str = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.request_id = request_id

    def __str__(self):
        req_suffix = f" (request_id: {self.request_id})" if self.request_id else ""
        return f"{self.message}{req_suffix}"


class AuthenticationError(VeritasAIError):
    """Raised when an invalid or missing API key is provided."""
    pass


class CredentialRevokedError(AuthenticationError):
    """Raised when the provided API key has been revoked by the organization."""
    pass


class InvalidAgentError(VeritasAIError):
    """Raised when the agent is disabled, revoked, or cannot be found."""
    pass


class ValidationError(VeritasAIError):
    """Raised when required telemetry parameters (e.g. decision) are missing."""
    pass


class RateLimitError(VeritasAIError):
    """Raised when API rate limits are exceeded."""
    pass


class VerificationError(VeritasAIError):
    """Raised when cryptographic verification cannot be completed."""
    pass


class NetworkError(VeritasAIError):
    """Raised when network connectivity or connection timeout occurs."""
    pass


class ServerError(VeritasAIError):
    """Raised when VeritasAI server returns an internal 5xx error."""
    pass
