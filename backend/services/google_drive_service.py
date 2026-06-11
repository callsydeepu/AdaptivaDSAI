import json
import requests
from core.logger import logger


class GoogleDriveService:
    """Upload ADSA-generated notebooks to the user's Google Drive."""

    FOLDER_NAME = "AdaptiveDSAI"
    DRIVE_API_BASE = "https://www.googleapis.com/drive/v3"
    UPLOAD_API_BASE = "https://www.googleapis.com/upload/drive/v3"
    FOLDER_MIME = "application/vnd.google-apps.folder"
    NOTEBOOK_MIME = "application/vnd.google.colab"
    NOTEBOOK_CONTENT_MIME = "application/x-ipynb+json"

    @staticmethod
    def _headers(access_token: str) -> dict:
        return {"Authorization": f"Bearer {access_token}"}

    @classmethod
    def find_or_create_folder(cls, access_token: str) -> str:
        query = (
            f"name='{cls.FOLDER_NAME}' and "
            f"mimeType='{cls.FOLDER_MIME}' and "
            "trashed=false"
        )
        search_url = f"{cls.DRIVE_API_BASE}/files"
        response = requests.get(
            search_url,
            headers=cls._headers(access_token),
            params={
                "q": query,
                "spaces": "drive",
                "fields": "files(id,name)",
                "pageSize": 1,
            },
            timeout=30,
        )
        if response.status_code == 401:
            raise PermissionError("Google authentication expired. Please reconnect Google Drive.")
        if response.status_code == 403:
            raise PermissionError("Google Drive permission denied. Please grant Drive access.")
        if response.status_code != 200:
            raise RuntimeError(f"Drive folder lookup failed: {response.text}")

        files = response.json().get("files", [])
        if files:
            return files[0]["id"]

        create_response = requests.post(
            search_url,
            headers={**cls._headers(access_token), "Content-Type": "application/json"},
            json={"name": cls.FOLDER_NAME, "mimeType": cls.FOLDER_MIME},
            timeout=30,
        )
        if create_response.status_code not in (200, 201):
            raise RuntimeError(f"Failed to create Drive folder: {create_response.text}")

        return create_response.json()["id"]

    @classmethod
    def upload_notebook(
        cls,
        access_token: str,
        folder_id: str,
        filename: str,
        notebook_content: str,
    ) -> dict:
        if not filename.endswith(".ipynb"):
            filename = f"{filename}.ipynb"

        metadata = {
            "name": filename,
            "parents": [folder_id],
            "mimeType": cls.NOTEBOOK_MIME,
        }

        boundary = "adsa_drive_upload_boundary"
        body = (
            f"--{boundary}\r\n"
            "Content-Type: application/json; charset=UTF-8\r\n\r\n"
            f"{json.dumps(metadata)}\r\n"
            f"--{boundary}\r\n"
            f"Content-Type: {cls.NOTEBOOK_CONTENT_MIME}\r\n\r\n"
            f"{notebook_content}\r\n"
            f"--{boundary}--"
        )

        upload_url = (
            f"{cls.UPLOAD_API_BASE}/files"
            "?uploadType=multipart"
            "&fields=id,name,mimeType,webViewLink,webContentLink"
        )
        response = requests.post(
            upload_url,
            headers={
                **cls._headers(access_token),
                "Content-Type": f"multipart/related; boundary={boundary}",
            },
            data=body.encode("utf-8"),
            timeout=60,
        )

        if response.status_code == 401:
            raise PermissionError("Google authentication expired during upload.")
        if response.status_code == 403:
            raise PermissionError("Google Drive upload permission denied.")
        if response.status_code not in (200, 201):
            raise RuntimeError(f"Drive upload failed: {response.text}")

        payload = response.json()
        result = {
            "file_id": payload.get("id"),
            "mime_type": payload.get("mimeType"),
            "web_view_link": payload.get("webViewLink"),
            "web_content_link": payload.get("webContentLink"),
            "filename": payload.get("name", filename),
        }
        logger.info(
            "[ColabExport] drive_upload_response file_id=%s mime_type=%s filename=%s web_view_link=%s",
            result["file_id"],
            result["mime_type"],
            result["filename"],
            result["web_view_link"],
        )
        return result

    @classmethod
    def upload_notebook_from_dict(
        cls,
        access_token: str,
        folder_id: str,
        filename: str,
        notebook_dict: dict,
    ) -> dict:
        notebook_content = json.dumps(notebook_dict, indent=2)
        return cls.upload_notebook(access_token, folder_id, filename, notebook_content)
