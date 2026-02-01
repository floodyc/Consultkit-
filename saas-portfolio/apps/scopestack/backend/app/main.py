from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api import auth, projects, scope_items, change_requests, portal, exports
from app.models.database import engine, Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="ScopeStack API",
    description="Document scope changes before they kill your margin",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(scope_items.router, prefix="/api", tags=["Scope Items"])
app.include_router(change_requests.router, prefix="/api", tags=["Change Requests"])
app.include_router(portal.router, prefix="/api/portal", tags=["Client Portal"])
app.include_router(exports.router, prefix="/api/projects", tags=["Exports"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "app": "scopestack"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
