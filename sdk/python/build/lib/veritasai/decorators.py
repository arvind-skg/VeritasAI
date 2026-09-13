"""
VeritasAI Python SDK — Function Decorators
"""
import functools
from typing import Callable, Any, Optional

def track(client, event_type: Optional[str] = None, risk_level: str = "LOW"):
    """
    Decorator to automatically capture and cryptographically record an AI agent function's execution.

    Example:
        @track(client, event_type="fraud_evaluation")
        def evaluate_transaction(account_id, amount):
            if amount > 10000:
                return "flagged"
            return "approved"
    """
    def decorator(fn: Callable[..., Any]):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            # Run the agent function — non-blocking execution guarantee
            result = fn(*args, **kwargs)

            # Record decision in VeritasAI
            try:
                decision_str = str(result)
                input_context = {"args": [str(a) for a in args], "kwargs": kwargs}
                client.log_decision(
                    decision=decision_str,
                    input_data=input_context,
                    output={"result": result},
                    risk_level=risk_level,
                    event_type=event_type or fn.__name__,
                )
            except Exception as e:
                # Fail-safe: recording failure never crashes the host agent
                pass

            return result
        return wrapper
    return decorator
