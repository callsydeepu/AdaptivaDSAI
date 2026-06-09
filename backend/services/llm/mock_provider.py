from services.llm.base_llm import BaseLLM
from core.logger import logger

class MockProvider(BaseLLM):
    """
    Mock LLM provider implementation for local development, CI pipelines,
    and testing without consuming API credits or requiring network access.
    """

    def generate(self, prompt: str) -> str:
        logger.info(f"MockProvider.generate called with prompt of length: {len(prompt)}")
        if not prompt:
            return ""
            
        lower_prompt = prompt.lower()
        
        # Smart checks for standard validation prompts
        if "explain machine learning" in lower_prompt:
            return (
                "Machine learning is a field of artificial intelligence where computers use statistical techniques "
                "to learn from data and improve their performance on tasks without being explicitly programmed."
            )
        elif "what is the best model?" in lower_prompt:
            return "This is a mock AI response. For general tabular data, RandomForestClassifier is highly recommended."

        return f"This is a mock AI response to your prompt: '{prompt[:40]}...'"
