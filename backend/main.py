from contextlib import asynccontextmanager

from fastapi import FastAPI

from backend.db import init_db
from backend.routes.auth import router as auth_router
from backend.routes.boards import router as boards_router
from backend.routes.cards import router as cards_router
from backend.routes.columns import router as columns_router
from backend.routes.ai import router as ai_router
from backend.routes.health import router as health_router
from backend.routes.static import mount_frontend


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(boards_router)
app.include_router(columns_router)
app.include_router(cards_router)
app.include_router(ai_router, prefix="/api/ai")

mount_frontend(app)
