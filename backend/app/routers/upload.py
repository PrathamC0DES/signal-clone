import os
import uuid
import aiofiles
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter(prefix="/api/upload", tags=["upload"])

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("")
async def upload_file(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1]
    safe_filename = f"{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(UPLOAD_DIR, safe_filename)

    file_size = 0
    async with aiofiles.open(dest_path, "wb") as out_file:
        while content := await file.read(1024 * 1024):  # 1MB chunks
            file_size += len(content)
            await out_file.write(content)

    return {
        "url": f"/uploads/{safe_filename}",
        "filename": file.filename or safe_filename,
        "size": file_size,
        "mime_type": file.content_type or "application/octet-stream"
    }

