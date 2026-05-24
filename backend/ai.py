# Re-exports for backward compatibility — logic lives in backend.services.ai
from backend.services.ai import test_ai_connection, process_chat

__all__ = ["test_ai_connection", "process_chat"]
