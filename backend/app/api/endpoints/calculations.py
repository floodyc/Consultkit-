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
    total_floor_area: float = 0.0
    total_volume: float = 0.0
    peak_cooling_sensible: float
    peak_cooling_latent: float
    peak_cooling_total: float
    peak_heating: float
    cooling_w_per_m2: float
    heating_w_per_m2: float


class LoadComponentData(BaseModel):
    name: str
    sensible_cooling: float = 0.0
    latent_cooling: float = 0.0
    total_cooling: float = 0.0
    sensible_heating: float = 0.0
    description: str = ""


class SpaceResult(BaseModel):
    space_id: str
    space_name: str
    floor_area: float
    volume: float

    # Peak loads
    peak_cooling_sensible: float
    peak_cooling_latent: float
    peak_cooling_total: float
    peak_heating: float

    # Intensities
    cooling_w_per_m2: float
    heating_w_per_m2: float

    # Building envelope
    exterior_wall_area: float = 0.0
    window_area: float = 0.0
    roof_area: float = 0.0

    # Airflows
    supply_airflow_cooling: float
    outdoor_airflow: float

    # Load components breakdown
    components: dict[str, LoadComponentData] = {}

    # Peak conditions
    peak_cooling_hour: int = 15
    outdoor_temp_at_cooling_peak: float = 35.0


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


def build_space_for_calculation(space_data: dict) -> 'Space':
    """
    Build a complete Space object with surfaces and loads for ASHRAE calculation.

    Estimates building envelope and internal loads based on simplified space data.
    """
    from ashrae_engine import (
        Space, SpaceType, InternalLoad, Infiltration, Ventilation,
        Surface, SurfaceType, Construction, Material,
    )
    import math

    # Extract space data
    floor_area_m2 = space_data.get("floor_area", space_data.get("area", 100) * 0.092903)  # Convert sq ft to m²
    height_m = space_data.get("height", space_data.get("ceiling_height", 9) * 0.3048)  # Convert ft to m
    volume_m3 = space_data.get("volume", floor_area_m2 * height_m)

    # Estimate room dimensions (assume square or rectangular)
    aspect_ratio = 1.5  # Typical room aspect ratio
    width_m = math.sqrt(floor_area_m2 / aspect_ratio)
    length_m = floor_area_m2 / width_m

    # Create default construction (typical office building)
    # Wall construction: exterior finish + insulation + interior finish
    # Target U-value = 0.35 W/(m²·K) → R-value ≈ 2.86 m²·K/W
    wall_insulation = Material(
        id="wall-insulation",
        name="Wall Insulation",
        thickness=0.10,  # 100mm
        conductivity=0.04,  # W/(m·K) - typical insulation
        density=30.0,  # kg/m³
        specific_heat=1000.0,  # J/(kg·K)
    )
    wall_construction = Construction(
        id="wall-typical",
        name="Typical Wall",
        layers=[wall_insulation],
    )

    # Roof construction
    roof_insulation = Material(
        id="roof-insulation",
        name="Roof Insulation",
        thickness=0.15,  # 150mm
        conductivity=0.04,
        density=30.0,
        specific_heat=1000.0,
    )
    roof_construction = Construction(
        id="roof-typical",
        name="Typical Roof",
        layers=[roof_insulation],
    )

    # Floor construction
    floor_material = Material(
        id="floor-concrete",
        name="Concrete Slab",
        thickness=0.10,
        conductivity=1.4,  # W/(m·K) - concrete
        density=2300.0,  # kg/m³
        specific_heat=880.0,
    )
    floor_construction = Construction(
        id="floor-typical",
        name="Typical Floor",
        layers=[floor_material],
    )

    # Calculate perimeter and create exterior walls (assume 40% exterior walls)
    perimeter_m = 2 * (length_m + width_m)
    exterior_wall_fraction = 0.4  # 40% of perimeter is exterior
    exterior_wall_area = perimeter_m * exterior_wall_fraction * height_m

    # Create surfaces
    surfaces = []

    # Exterior walls (40% of perimeter - simplified without windows for now)
    if exterior_wall_area > 0:
        # South wall
        wall_area_south = (length_m * exterior_wall_fraction / 2) * height_m
        surfaces.append(Surface(
            id=f"{space_data['id']}-wall-south",
            name="South Exterior Wall",
            surface_type=SurfaceType.EXTERIOR_WALL,
            area=wall_area_south,
            azimuth=180.0,  # South-facing
            tilt=90.0,  # Vertical
            construction=wall_construction,
        ))

        # North wall
        wall_area_north = (length_m * exterior_wall_fraction / 2) * height_m
        surfaces.append(Surface(
            id=f"{space_data['id']}-wall-north",
            name="North Exterior Wall",
            surface_type=SurfaceType.EXTERIOR_WALL,
            area=wall_area_north,
            azimuth=0.0,  # North
            tilt=90.0,
            construction=wall_construction,
        ))

    # Roof (assume top floor has roof exposure, others have ceiling)
    is_top_floor = space_data.get("floor_number", 1) >= 3  # Assume 3+ floors means top
    if is_top_floor:
        surfaces.append(Surface(
            id=f"{space_data['id']}-roof",
            name="Roof",
            surface_type=SurfaceType.ROOF,
            area=floor_area_m2,
            azimuth=0.0,
            tilt=0.0,  # Flat roof
            construction=roof_construction,
        ))
    else:
        # Interior ceiling
        surfaces.append(Surface(
            id=f"{space_data['id']}-ceiling",
            name="Ceiling",
            surface_type=SurfaceType.CEILING,
            area=floor_area_m2,
            azimuth=0.0,
            tilt=0.0,
            construction=Construction(
                id="ceiling-typical",
                name="Ceiling",
                layers=[Material(id="ceiling-tile", name="Ceiling Tile", thickness=0.02, conductivity=0.06, density=400.0, specific_heat=1000.0)],
            ),
        ))

    # Floor
    is_ground_floor = space_data.get("floor_number", 1) == 1
    if is_ground_floor:
        surfaces.append(Surface(
            id=f"{space_data['id']}-floor-slab",
            name="Slab on Grade",
            surface_type=SurfaceType.SLAB_ON_GRADE,
            area=floor_area_m2,
            azimuth=0.0,
            tilt=180.0,  # Horizontal down
            construction=floor_construction,
        ))
    else:
        surfaces.append(Surface(
            id=f"{space_data['id']}-floor",
            name="Interior Floor",
            surface_type=SurfaceType.FLOOR,
            area=floor_area_m2,
            azimuth=0.0,
            tilt=180.0,
            construction=Construction(
                id="floor-interior",
                name="Floor",
                layers=[Material(id="floor-finish", name="Floor Finish", thickness=0.01, conductivity=0.15, density=1200.0, specific_heat=1200.0)],
            ),
        ))

    # Create internal loads from space data
    occupancy = space_data.get("occupancy", 0)
    lighting_watts = space_data.get("lighting_watts", 0.0)
    lighting_w_per_m2 = lighting_watts / floor_area_m2 if floor_area_m2 > 0 else 10.0

    # Equipment loads (W/m²)
    equipment_w_per_m2 = space_data.get("equipment_power_density", 10.0)

    internal_load = InternalLoad(
        people_count=float(occupancy),
        activity_level=120.0,  # W/person total (ASHRAE 62.1 office work)
        sensible_fraction=0.67,  # 80W sensible, 40W latent per person
        lighting_power_density=lighting_w_per_m2,
        equipment_power_density=equipment_w_per_m2,
    )

    # Infiltration (air changes per hour)
    infiltration_ach = 0.15  # Typical office building
    infiltration = Infiltration(
        method="air_changes",
        air_changes_per_hour=infiltration_ach,
    )

    # Ventilation (outdoor air based on ASHRAE 62.1)
    oa_per_person = 0.0025  # 2.5 L/s per person (ASHRAE 62.1 office)
    oa_per_area = 0.0003  # 0.3 L/s/m²
    ventilation = Ventilation(
        outdoor_air_per_person=oa_per_person,
        outdoor_air_per_area=oa_per_area,
    )

    # Create Space object
    space = Space(
        id=space_data["id"],
        name=space_data["name"],
        space_type=SpaceType.OFFICE_ENCLOSED,  # Default, can enhance later
        floor_area=floor_area_m2,
        volume=volume_m3,
        height=height_m,
        surfaces=surfaces,
        internal_load=internal_load,
        infiltration=infiltration,
        ventilation=ventilation,
        cooling_setpoint=space_data.get("cooling_setpoint", 24.0),
        heating_setpoint=space_data.get("heating_setpoint", 21.0),
    )

    return space


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
        print(f"\n{'='*80}")
        print(f"🔥 STARTING CALCULATION for project: {project.get('name')}")
        print(f"Number of spaces: {len(project.get('spaces', []))}")
        print(f"{'='*80}\n")

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

        # Convert project spaces to calculation model with complete building envelope
        calc_spaces = []
        for s in project.get("spaces", []):
            print(f"📐 Building space: {s.get('name')}")
            print(f"   - Area: {s.get('area', s.get('floor_area', 0))} sq ft")
            print(f"   - Occupancy: {s.get('occupancy', 0)}")
            print(f"   - Lighting: {s.get('lighting_watts', 0)} W")
            space = build_space_for_calculation(s)
            print(f"   - Created {len(space.surfaces)} surfaces")
            print(f"   - Floor area: {space.floor_area:.1f} m²")
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
        print(f"\n🧮 Running ASHRAE Heat Balance Calculator...")
        calculator = ASHRAELoadCalculator()
        results = calculator.calculate_project(calc_project)

        print(f"\n✅ CALCULATION COMPLETE!")
        print(f"Total cooling load: {results.total_cooling_load:.1f} W")
        print(f"Total heating load: {results.total_heating_load:.1f} W")
        print(f"Number of space results: {len(results.space_results)}")
        for sr in results.space_results:
            print(f"\n  Space: {sr.space_name}")
            print(f"    - Peak cooling: {sr.peak_summary.peak_total_cooling:.1f} W")
            print(f"    - Peak heating: {sr.peak_summary.peak_sensible_heating:.1f} W")
            print(f"    - Cooling W/m²: {sr.peak_summary.cooling_w_per_m2:.1f}")
            print(f"    - Supply airflow: {sr.supply_airflow_cooling:.3f} m³/s")
        print(f"{'='*80}\n")

        # Update project status
        project["status"] = "completed"
        project["calculated_at"] = datetime.utcnow()
        project["credits_used"] = credits_needed

        # Deduct credits (in production, update database)
        # current_user["credits"] -= credits_needed

        print(f"💾 Storing results in project data...")

        # Convert results to response format
        space_results = []
        for sr in results.space_results:
            # Convert load components
            components_data = {
                comp_name: LoadComponentData(
                    name=comp.name,
                    sensible_cooling=comp.sensible_cooling,
                    latent_cooling=comp.latent_cooling,
                    total_cooling=comp.total_cooling,
                    sensible_heating=comp.sensible_heating,
                    description=comp.description,
                )
                for comp_name, comp in sr.components.items()
            }

            space_results.append(SpaceResult(
                space_id=sr.space_id,
                space_name=sr.space_name,
                floor_area=sr.floor_area,
                volume=sr.volume,
                peak_cooling_sensible=sr.peak_summary.peak_sensible_cooling,
                peak_cooling_latent=sr.peak_summary.peak_latent_cooling,
                peak_cooling_total=sr.peak_summary.peak_total_cooling,
                peak_heating=sr.peak_summary.peak_sensible_heating,
                cooling_w_per_m2=sr.peak_summary.cooling_w_per_m2,
                heating_w_per_m2=sr.peak_summary.heating_w_per_m2,
                exterior_wall_area=sr.exterior_wall_area,
                window_area=sr.window_area,
                roof_area=sr.roof_area,
                supply_airflow_cooling=sr.supply_airflow_cooling,
                outdoor_airflow=sr.outdoor_airflow,
                components=components_data,
                peak_cooling_hour=sr.peak_summary.peak_cooling_hour,
                outdoor_temp_at_cooling_peak=sr.peak_summary.outdoor_temp_at_cooling_peak,
            ))

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

        # Create response object
        response = CalculationResponse(
            project_id=project_id,
            project_name=project["name"],
            status="completed",
            calculated_at=datetime.utcnow(),
            total_floor_area=results.total_floor_area,
            building_summary=LoadSummary(
                total_floor_area=results.total_floor_area,
                total_volume=results.total_volume,
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

        # Store results in project for retrieval later
        project["calculation_results"] = response.model_dump()
        print(f"✅ Results stored in project!")

        return response

    except Exception as e:
        print(f"\n❌ CALCULATION ERROR!")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        import traceback
        print(f"Traceback:\n{traceback.format_exc()}")
        print(f"{'='*80}\n")
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

    # Return stored calculation results
    if "calculation_results" not in project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No calculation results found. Please run a calculation first.",
        )

    return project["calculation_results"]


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
