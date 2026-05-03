from contextlib import asynccontextmanager
import os

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.db import init_db
from backend.routes.auth import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

app.include_router(auth_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "out")
if os.path.isdir(frontend_dir):
    login_html = os.path.join(frontend_dir, "login.html")

    # Next export puts HTML at login.html; out/login/ is RSC payloads only, so StaticFiles returns 404 for GET /login.
    @app.get("/login")
    @app.get("/login/")
    async def serve_login_page():
        if not os.path.isfile(login_html):
            raise HTTPException(status_code=404)
        return FileResponse(login_html)

    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
