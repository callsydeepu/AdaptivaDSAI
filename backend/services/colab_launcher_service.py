from typing import Optional


class ColabLauncherService:
    """Build Google Colab URLs from Google Drive file identifiers."""

    COLAB_BASE_URL = "https://colab.research.google.com/drive"

    @staticmethod
    def build_url(file_id: str) -> str:
        if not file_id:
            raise ValueError("Drive file_id is required to launch Colab")
        return f"{ColabLauncherService.COLAB_BASE_URL}/{file_id}"

    @staticmethod
    def build_launch_payload(file_id: str, web_view_link: Optional[str] = None) -> dict:
        return {
            "file_id": file_id,
            "colab_url": ColabLauncherService.build_url(file_id),
            "web_view_link": web_view_link,
        }
