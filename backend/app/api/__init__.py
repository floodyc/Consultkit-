# -*- coding: utf-8 -*-
"""
API Router Configuration
"""

from fastapi import APIRouter

from app.api.endpoints import (
    auth,
    projects,
    geometry,
    calculations,
    reports,
    billing,
    weather,
    exports,
)

router = APIRouter()

# Include all endpoint routers
router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
router.include_router(projects.router, prefix="/projects", tags=["Projects"])
router.include_router(geometry.router, prefix="/geometry", tags=["Geometry Extraction"])
router.include_router(calculations.router, prefix="/calculations", tags=["Load Calculations"])
router.include_router(reports.router, prefix="/reports", tags=["Reports"])
router.include_router(billing.router, prefix="/billing", tags=["Billing & Credits"])
router.include_router(weather.router, prefix="/weather", tags=["Weather Data"])
router.include_router(exports.router, prefix="/exports", tags=["Exports"])
