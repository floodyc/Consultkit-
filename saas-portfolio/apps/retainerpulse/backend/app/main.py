from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api import auth, retainers, entries, portal
from app.models.database import engine, Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="RetainerPulse API",
    description="Track retainer hours with client visibility",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3002", "https://retainerpulse.consultkit.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(retainers.router, prefix="/api/retainers", tags=["Retainers"])
app.include_router(entries.router, prefix="/api", tags=["Hour Entries"])
app.include_router(portal.router, prefix="/api/portal", tags=["Client Portal"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "app": "retainerpulse"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
