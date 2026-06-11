from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Optional


@dataclass
class ExportResult:
    """Normalized result from any export destination."""

    destination: str
    colab_url: Optional[str] = None
    file_id: Optional[str] = None
    web_view_link: Optional[str] = None
    download_url: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None


class BaseExporter(ABC):
    """
    Common export interface for ADSA destinations.

    Future implementations: KaggleExporter, GitHubGistExporter,
    StreamlitExporter, FastAPIExporter, etc.
    """

    destination: str = "base"

    @abstractmethod
    def export(
        self,
        dataset_id: str,
        user_id: str,
        mode: str = "clean",
        **kwargs: Any,
    ) -> ExportResult:
        raise NotImplementedError
