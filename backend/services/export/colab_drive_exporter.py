from typing import Optional

from core.logger import logger
from services.colab_launcher_service import ColabLauncherService
from services.dataset_service import DatasetService
from services.export.base_exporter import BaseExporter, ExportResult
from services.google_drive_service import GoogleDriveService
from services.notebook_generator_service import NotebookGeneratorService


class ColabDriveExporter(BaseExporter):
    """Export ADSA notebooks to Google Drive and launch in Colab."""

    destination = "colab_drive"

    def export(
        self,
        dataset_id: str,
        user_id: str,
        mode: str = "clean",
        access_token: Optional[str] = None,
        **kwargs,
    ) -> ExportResult:
        if not access_token:
            raise ValueError("Google Drive access token is required for Colab export")

        dataset = DatasetService.get_dataset_by_id(dataset_id, user_id=user_id)
        if not dataset:
            raise ValueError("Dataset not found")

        notebook = NotebookGeneratorService.generate_notebook_dict(
            dataset_id, mode=mode, user_id=user_id
        )
        clean_name = dataset.get("filename", "dataset.csv").rsplit(".", 1)[0]
        notebook_filename = (
            f"{clean_name}_Workflow_{mode.capitalize()}.ipynb"
            if mode != "clean"
            else f"{clean_name}_Workflow.ipynb"
        )

        folder_id = GoogleDriveService.find_or_create_folder(access_token)
        upload_result = GoogleDriveService.upload_notebook_from_dict(
            access_token,
            folder_id,
            notebook_filename,
            notebook,
        )

        if not upload_result.get("file_id"):
            raise RuntimeError("Drive upload succeeded but no file_id was returned")

        launch = ColabLauncherService.build_launch_payload(
            upload_result["file_id"],
            upload_result.get("web_view_link"),
        )

        logger.info(
            "[ColabExport] colab_url=%s file_id=%s folder_id=%s notebook_nbformat=%s/%s cells=%s",
            launch["colab_url"],
            launch["file_id"],
            folder_id,
            notebook.get("nbformat"),
            notebook.get("nbformat_minor"),
            len(notebook.get("cells", [])),
        )

        return ExportResult(
            destination=self.destination,
            colab_url=launch["colab_url"],
            file_id=launch["file_id"],
            web_view_link=launch.get("web_view_link"),
            metadata={
                "folder_id": folder_id,
                "filename": upload_result.get("filename", notebook_filename),
                "mode": mode,
            },
        )

    @staticmethod
    def validate_dataset_access(dataset_id: str, user_id: str) -> dict:
        """Pre-flight check used before starting OAuth."""
        dataset = DatasetService.get_dataset_by_id(dataset_id, user_id=user_id)
        if not dataset:
            raise ValueError("Dataset not found")
        return dataset
