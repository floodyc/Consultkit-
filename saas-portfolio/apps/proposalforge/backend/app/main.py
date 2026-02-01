from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api import auth, blocks, proposals, viewer
from app.models.database import engine, Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="ProposalForge API",
    description="Send proposals in minutes, not hours",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3003", "https://proposalforge.consultkit.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(blocks.router, prefix="/api/blocks", tags=["Blocks"])
app.include_router(proposals.router, prefix="/api/proposals", tags=["Proposals"])
app.include_router(viewer.router, prefix="/api/view", tags=["Client Viewer"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "app": "proposalforge"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
