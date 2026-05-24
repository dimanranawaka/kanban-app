import os

from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

router = APIRouter(tags=["static"])

_frontend_dir = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "out")


def _html(filename: str) -> str:
    return os.path.join(_frontend_dir, filename)


@router.get("/login")
@router.get("/login/")
async def serve_login_page():
    path = _html("login.html")
    if not os.path.isfile(path):
        raise HTTPException(status_code=404)
    return FileResponse(path)


@router.get("/ai-test")
@router.get("/ai-test/")
async def serve_ai_test_page():
    path = _html("ai-test.html")
    if not os.path.isfile(path):
        raise HTTPException(status_code=404)
    return FileResponse(path)


def mount_frontend(app: FastAPI) -> None:
    """Mount the Next.js static export if it has been built."""
    if os.path.isdir(_frontend_dir):
        app.include_router(router)
        app.mount("/", StaticFiles(directory=_frontend_dir, html=True), name="frontend")
