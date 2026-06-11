from typing import Optional

from services.export.base_exporter import BaseExporter, ExportResult
from services.notebook_generator_service import NotebookGeneratorService


class GitHubGistExporter(BaseExporter):
    """Legacy Colab export via public GitHub Gist."""

    destination = "github_gist"

    def export(
        self,
        dataset_id: str,
        user_id: str,
        mode: str = "clean",
        github_token: Optional[str] = None,
        **kwargs,
    ) -> ExportResult:
        if not github_token:
            raise ValueError("GitHub token is required for Gist export")

        colab_url = NotebookGeneratorService.upload_to_gist(
            dataset_id, github_token, mode=mode, user_id=user_id
        )
        return ExportResult(
            destination=self.destination,
            colab_url=colab_url,
            metadata={"mode": mode},
        )
