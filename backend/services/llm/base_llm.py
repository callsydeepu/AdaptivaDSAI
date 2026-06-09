from abc import ABC, abstractmethod

class BaseLLM(ABC):
    """
    Abstract Base Class representing a Language Model.
    All concrete LLM providers (e.g. Groq, Mock) must implement this interface.
    """

    @abstractmethod
    def generate(self, prompt: str) -> str:
        """
        Generates a textual completion for the given prompt.
        
        Args:
            prompt (str): The input text prompt.
            
        Returns:
            str: The generated text response.
            
        Raises:
            Exception: If generation fails due to provider errors or network issues.
        """
        pass
