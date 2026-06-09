from services.llm.base_llm import BaseLLM
from services.llm.groq_provider import GroqProvider
from services.llm.mock_provider import MockProvider
from core.config import LLM_PROVIDER
from core.logger import logger

def get_llm() -> BaseLLM:
    """
    LLM Factory method to retrieve the configured LLM provider instance.
    Reads the LLM_PROVIDER value from environment variables / configuration.
    
    Returns:
        BaseLLM: An instance of a concrete LLM provider (GroqProvider or MockProvider).
    """
    provider_name = (LLM_PROVIDER or "mock").strip().lower()
    logger.info(f"Retrieving LLM provider: {provider_name}")
    
    if provider_name == "groq":
        return GroqProvider()
    elif provider_name == "mock":
        return MockProvider()
    else:
        logger.warning(
            f"Configured LLM_PROVIDER '{provider_name}' is not recognized. "
            "Falling back to MockProvider."
        )
        return MockProvider()
