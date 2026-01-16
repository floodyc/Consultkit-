# -*- coding: utf-8 -*-
"""
HVACplus FastAPI Application

Professional ASHRAE heating and cooling load calculation platform.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.api import router as api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    print(f"🏗️  HVACplus v{settings.APP_VERSION} starting...")
    print(f"📁 Upload directory: {settings.UPLOAD_DIR}")

    yield

    # Shutdown
    print("👋 HVACplus shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    description="""
    ## HVACplus - Professional HVAC Load Calculation Platform

    Calculate heating and cooling loads using the ASHRAE Heat Balance Method.

    ### Features
    - **GEM-AI Integration**: Extract building geometry from floorplan images
    - **ASHRAE Calculations**: Industry-standard heat balance method
    - **Multi-level Reports**: Space, Zone, System, and Plant level results
    - **Professional Output**: Engineering-grade reports for HVAC designers

    ### Endpoints
    - `/api/v1/auth/*` - Authentication and user management
    - `/api/v1/projects/*` - Project CRUD operations
    - `/api/v1/geometry/*` - Floorplan upload and geometry extraction
    - `/api/v1/calculations/*` - Load calculations
    - `/api/v1/reports/*` - Report generation
    - `/api/v1/billing/*` - Credit purchase and management
    """,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
async def root():
    """Root endpoint - API information."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": "Professional ASHRAE heating and cooling load calculation platform",
        "docs": "/api/docs",
        "api": settings.API_V1_PREFIX,
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": settings.APP_VERSION}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
