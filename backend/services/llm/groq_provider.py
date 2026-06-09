from services.llm.base_llm import BaseLLM
from groq import Groq
from core.config import GROQ_API_KEY, GROQ_MODEL
from core.logger import logger

class GroqProvider(BaseLLM):
    """
    Groq Cloud LLM provider implementation.
    Utilizes the official Groq Python SDK.
    """

    def __init__(self, api_key: str = None, model: str = None, timeout: float = 30.0):
        self.api_key = api_key or GROQ_API_KEY
        self.model = model or GROQ_MODEL
        self.timeout = timeout
        
        if not self.api_key:
            logger.error("GroqProvider failed to initialize: GROQ_API_KEY is empty or missing.")
            raise ValueError("Groq API Key is not configured. Please add GROQ_API_KEY in your env settings.")
            
        try:
            # Initialize client with timeout protection
            self.client = Groq(api_key=self.api_key, timeout=self.timeout)
            logger.info(f"GroqProvider successfully initialized. Model: {self.model}, Timeout: {self.timeout}s")
        except Exception as e:
            logger.error(f"Failed to instantiate Groq client: {str(e)}", exc_info=True)
            raise RuntimeError(f"Failed to initialize Groq provider client: {str(e)}") from e

    def generate(self, prompt: str) -> str:
        """
        Submits prompt to Groq Chat Completions API and returns the generated content.
        """
        if not prompt:
            logger.warning("GroqProvider received an empty prompt. Returning empty string.")
            return ""
            
        logger.info(f"Submitting completion request to Groq (Model: {self.model}, Prompt Length: {len(prompt)})")
        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model=self.model,
            )
            
            if not chat_completion.choices:
                logger.error("Groq completions response returned with no choices.")
                raise RuntimeError("Groq API returned an empty completion response.")
                
            response_text = chat_completion.choices[0].message.content
            if response_text is None:
                response_text = ""
                
            logger.info(f"Groq completions query succeeded. Output Length: {len(response_text)}")
            return response_text
        except Exception as e:
            logger.error(f"Error occurred during Groq completions request: {str(e)}", exc_info=True)
            raise RuntimeError(f"Groq API call execution failed: {str(e)}") from e
