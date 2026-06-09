from services.memory_service import MemoryService
from services.retrieval_service import RetrievalService
from core.logger import logger

class ContextBuilder:
    """
    Context Builder to combine dialog history, ranked context sections,
    and user query parameters into a prompt package structure.
    """

    @staticmethod
    def build_prompt_package(dataset_id: str, session_id: str, question: str) -> dict:
        logger.info(f"Building prompt package for dataset {dataset_id}, session {session_id}")
        
        # 1. Retrieve recent dialogue logs (conversational memory context)
        recent_chats = MemoryService.get_recent_context(session_id, limit=6) # fetch last 6 queries for context
        
        # 2. Retrieve relevant context blocks (pruned dataset context)
        relevant_dataset = RetrievalService.get_relevant_context(dataset_id, question)
        if relevant_dataset is None:
            logger.warning(f"Failed to fetch dataset context for dataset {dataset_id}")
            relevant_dataset = {}

        # 3. Format conversation context
        conversation_context = ""
        if recent_chats:
            dialogue_turns = []
            for chat in recent_chats:
                dialogue_turns.append(f"User: {chat['question']}\nAI: {chat['answer']}")
            conversation_context = "\n\n".join(dialogue_turns)
        else:
            conversation_context = "No previous dialog history in this session."

        system_context = (
            "You are an expert AI Data Scientist assisting the user with their dataset. "
            "Rely strictly on the provided context details and conversation history. "
            "If the context does not contain enough information to answer, explain this limitation clearly."
        )

        return {
            "system_context": system_context,
            "dataset_context": relevant_dataset,
            "conversation_context": conversation_context,
            "user_question": question
        }
