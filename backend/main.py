from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

app = FastAPI()

@app.get("/api/health")
async def health():
    return {"status": "ok"}

# Mount static frontend files
frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "out")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
