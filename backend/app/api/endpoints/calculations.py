# -*- coding: utf-8 -*-
"""
Load calculation endpoints.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel

from app.core.config import settings
from app.api.endpoints.auth import get_current_user
from app.api.endpoints.projects import _projects_store

router = APIRouter()


# Pydantic models
class CalculationRequest(BaseModel):
    design_temp_summer: Optional[float] = 95.0
    design_temp_winter: Optional[float] = 5.0
    include_hourly_profiles: bool = True
    apply_safety_factors: bool = True
    cooling_safety_factor: float = 1.1
    heating_safety_factor: float = 1.1


class LoadSummary(BaseModel):
    peak_cooling_sensible: float
    peak_cooling_latent: float
    peak_cooling_total: float
    peak_heating: float
    cooling_w_per_m2: float
    heating_w_per_m2: float


class SpaceResult(BaseModel):
    space_id: str
    space_name: str
    floor_area: float
    volume: float
    peak_cooling_total: float
    peak_heating: float
    supply_airflow_cooling: float
    outdoor_airflow: float


class ZoneResult(BaseModel):
    zone_id: str
    zone_name: str
    total_floor_area: float
    peak_cooling_total: float
    peak_heating: float
    sized_cooling_load: float
    sized_heating_load: float


class SystemResult(BaseModel):
    system_id: str
    system_name: str
    system_type: str
    block_cooling_total: float
    block_heating: float
    sized_cooling_capacity: float
    sized_heating_capacity: float
    total_supply_airflow: float
    cooling_coil_total: float
    heating_coil_load: float


class PlantResult(BaseModel):
    plant_id: str
    plant_name: str
    chiller_capacity: float
    chiller_capacity_tons: float
    boiler_capacity: float
    boiler_capacity_kw: float
    num_chillers: int
    num_boilers: int


class CalculationResponse(BaseModel):
    project_id: str
    project_name: str
    status: str
    calculated_at: datetime
    total_floor_area: float
    building_summary: LoadSummary
    space_results: list[SpaceResult]
    zone_results: list[ZoneResult]
    system_results: list[SystemResult]
    plant_results: list[PlantResult]
    credits_used: int
    warnings: list[str]


class CalculationStatus(BaseModel):
    project_id: str
    status: str
    progress: float
    message: str


def estimate_credits(project: dict) -> int:
    """Estimate credits needed for calculation."""
    num_spaces = len(project.get("spaces", []))
    base_cost = settings.COST_PER_PROJECT_MIN
    space_cost = num_spaces * settings.COST_PER_SPACE

    total = max(base_cost, min(base_cost + space_cost, settings.COST_PER_PROJECT_MAX))
    return total


@router.post("/{project_id}/estimate")
async def estimate_calculation_cost(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Estimate credits required for load calculation.
    """
    project = _projects_store.get(project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if project.get("user_id") != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        )

    credits_needed = estimate_credits(project)
    user_credits = current_user["credits"]

    return {
        "credits_needed": credits_needed,
        "credits_available": user_credits,
        "can_calculate": user_credits >= credits_needed,
        "num_spaces": len(project.get("spaces", [])),
    }


@router.post("/{project_id}/run", response_model=CalculationResponse)
async def run_calculation(
    project_id: str,
    request: Optional[CalculationRequest] = None,
    current_user: dict = Depends(get_current_user),
):
    """
    Run ASHRAE heat balance load calculation for a project.

    This calculates heating and cooling loads at:
    - Space level (individual rooms)
    - Zone level (HVAC zones)
    - System level (air handling systems)
    - Plant level (chillers, boilers)

    Credits are deducted based on project complexity.
    """
    from ashrae_engine import (
        ASHRAELoadCalculator,
        Project, Building, Space, Zone, System, Plant,
        WeatherData, DesignDay, SpaceType,
    )

    request = request or CalculationRequest()

    project = _projects_store.get(project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if project.get("user_id") != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        )

    # Check credits
    credits_needed = estimate_credits(project)
    if current_user["credits"] < credits_needed:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient credits. Need {credits_needed}, have {current_user['credits']}",
        )

    # Check if project has spaces
    if not project.get("spaces"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project has no spaces. Upload a floorplan or add spaces manually.",
        )

    warnings = []

    try:
        # Build calculation model
        weather = WeatherData(
            name="Design Conditions",
            city=project.get("city", "Default"),
            latitude=project.get("latitude", 40.0),
            longitude=project.get("longitude", -100.0),
            cooling_db_004=project.get("design_conditions", {}).get("cooling_db", 35.0),
            heating_db_996=project.get("design_conditions", {}).get("heating_db", -15.0),
            cooling_design_days=[DesignDay(
                name="Summer Design",
                day_type="cooling",
                month=7,
                day=21,
                dry_bulb_max=project.get("design_conditions", {}).get("cooling_db", 35.0),
                daily_range=11.0,
            )],
            heating_design_days=[DesignDay(
                name="Winter Design",
                day_type="heating",
                month=1,
                day=21,
                dry_bulb_max=project.get("design_conditions", {}).get("heating_db", -15.0),
                daily_range=0.0,
            )],
        )

        # Convert project spaces to calculation model
        calc_spaces = []
        for s in project.get("spaces", []):
            space = Space(
                id=s["id"],
                name=s["name"],
                space_type=SpaceType.OFFICE_ENCLOSED,
                floor_area=s.get("floor_area", 100),
                volume=s.get("volume", s.get("floor_area", 100) * s.get("height", 3.0)),
                height=s.get("height", 3.0),
                cooling_setpoint=s.get("cooling_setpoint", 24.0),
                heating_setpoint=s.get("heating_setpoint", 21.0),
            )
            calc_spaces.append(space)

        building = Building(
            id=project_id,
            name=project["name"],
            building_type=project.get("building_type", "office"),
            weather_data=weather,
            spaces=calc_spaces,
        )

        calc_project = Project(
            id=project_id,
            name=project["name"],
            building=building,
            calculation_method=project.get("calculation_method", "heat_balance"),
        )

        # Run calculation
        calculator = ASHRAELoadCalculator()
        results = calculator.calculate_project(calc_project)

        # Update project status
        project["status"] = "completed"
        project["calculated_at"] = datetime.utcnow()
        project["credits_used"] = credits_needed

        # Deduct credits (in production, update database)
        # current_user["credits"] -= credits_needed

        # Convert results to response format
        space_results = [
            SpaceResult(
                space_id=sr.space_id,
                space_name=sr.space_name,
                floor_area=sr.floor_area,
                volume=sr.volume,
                peak_cooling_total=sr.peak_summary.peak_total_cooling,
                peak_heating=sr.peak_summary.peak_sensible_heating,
                supply_airflow_cooling=sr.supply_airflow_cooling,
                outdoor_airflow=sr.outdoor_airflow,
            )
            for sr in results.space_results
        ]

        zone_results = [
            ZoneResult(
                zone_id=zr.zone_id,
                zone_name=zr.zone_name,
                total_floor_area=zr.total_floor_area,
                peak_cooling_total=zr.peak_summary.peak_total_cooling,
                peak_heating=zr.peak_summary.peak_sensible_heating,
                sized_cooling_load=zr.sized_cooling_load,
                sized_heating_load=zr.sized_heating_load,
            )
            for zr in results.zone_results
        ]

        system_results = [
            SystemResult(
                system_id=sr.system_id,
                system_name=sr.system_name,
                system_type=sr.system_type,
                block_cooling_total=sr.block_cooling_total,
                block_heating=sr.block_heating,
                sized_cooling_capacity=sr.sized_cooling_capacity,
                sized_heating_capacity=sr.sized_heating_capacity,
                total_supply_airflow=sr.total_supply_airflow,
                cooling_coil_total=sr.cooling_coil_total,
                heating_coil_load=sr.heating_coil_load,
            )
            for sr in results.system_results
        ]

        plant_results = [
            PlantResult(
                plant_id=pr.plant_id,
                plant_name=pr.plant_name,
                chiller_capacity=pr.chiller_capacity,
                chiller_capacity_tons=pr.chiller_capacity / 3517.0,
                boiler_capacity=pr.boiler_capacity,
                boiler_capacity_kw=pr.boiler_capacity / 1000.0,
                num_chillers=pr.num_chillers_recommended,
                num_boilers=pr.num_boilers_recommended,
            )
            for pr in results.plant_results
        ]

        return CalculationResponse(
            project_id=project_id,
            project_name=project["name"],
            status="completed",
            calculated_at=datetime.utcnow(),
            total_floor_area=results.total_floor_area,
            building_summary=LoadSummary(
                peak_cooling_sensible=sum(sr.peak_summary.peak_sensible_cooling for sr in results.space_results),
                peak_cooling_latent=sum(sr.peak_summary.peak_latent_cooling for sr in results.space_results),
                peak_cooling_total=results.total_cooling_load,
                peak_heating=results.total_heating_load,
                cooling_w_per_m2=results.cooling_w_per_m2,
                heating_w_per_m2=results.heating_w_per_m2,
            ),
            space_results=space_results,
            zone_results=zone_results,
            system_results=system_results,
            plant_results=plant_results,
            credits_used=credits_needed,
            warnings=warnings,
        )

    except Exception as e:
        project["status"] = "error"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Calculation failed: {str(e)}",
        )


@router.get("/{project_id}/results")
async def get_calculation_results(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Get stored calculation results for a project.
    """
    project = _projects_store.get(project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if project.get("user_id") != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        )

    if project.get("status") != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Calculation not yet completed",
        )

    # In production, fetch from database
    return {"message": "Results stored in database", "project_id": project_id}


@router.get("/{project_id}/hourly-profile/{space_id}")
async def get_hourly_profile(
    project_id: str,
    space_id: str,
    profile_type: str = "cooling",
    current_user: dict = Depends(get_current_user),
):
    """
    Get hourly load profile for a specific space.
    """
    # In production, fetch from stored results
    return {
        "space_id": space_id,
        "profile_type": profile_type,
        "hours": list(range(24)),
        "loads": [0.0] * 24,  # Placeholder
    }
