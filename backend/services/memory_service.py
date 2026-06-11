from repositories.copilot_repository import CopilotRepository
from core.logger import logger

class MemoryService:
    """
    Memory Service to manage session-based conversational logs,
    providing recent context queries to fuel multi-turn AI chat capabilities.
    """

    @staticmethod
    def create_session(dataset_id: str, user_id=None) -> dict:
        logger.info(f"Creating a new conversation session for dataset {dataset_id}")
        return CopilotRepository.create_session(dataset_id, user_id=user_id)

    @staticmethod
    def get_sessions(dataset_id: str, user_id=None) -> list:
        logger.info(f"Fetching chat sessions for dataset {dataset_id}")
        return CopilotRepository.get_sessions(dataset_id, user_id=user_id)

    @staticmethod
    def get_session_history(session_id: str, user_id=None) -> list:
        logger.info(f"Fetching conversation history for session: {session_id}")
        return CopilotRepository.get_session_history(session_id, user_id=user_id)

    @staticmethod
    def get_recent_context(session_id: str, limit: int = 10, user_id=None) -> list:
        """
        Retrieves the last N question-answer dialogues for the specified session
        formatted as a list of dictionaries.
        """
        logger.info(f"Retrieving recent memory context for session: {session_id} (Limit: {limit})")
        history = CopilotRepository.get_session_history(session_id, user_id=user_id)
        
        # Take the last limit conversations
        recent_chats = history[-limit:]
        
        context_list = []
        for chat in recent_chats:
            context_list.append({
                "question": chat.get("question", ""),
                "answer": chat.get("answer", "")
            })
            
        return context_list
