# -*- coding: utf-8 -*-
"""
Project management endpoints.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from app.api.endpoints.auth import get_current_user

router = APIRouter()


# Pydantic models
class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    project_number: Optional[str] = None
    client_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    building_type: str = "office"
    num_floors: int = 1
    calculation_method: str = "heat_balance"
    unit_system: str = "SI"


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    project_number: Optional[str] = None
    client_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    building_type: Optional[str] = None
    num_floors: Optional[int] = None
    orientation: Optional[float] = None
    calculation_method: Optional[str] = None
    unit_system: Optional[str] = None
    weather_data: Optional[dict] = None
    design_conditions: Optional[dict] = None
    settings: Optional[dict] = None
    floorplan_url: Optional[str] = None
    obj_url: Optional[str] = None


class SpaceData(BaseModel):
    id: str
    name: str
    space_type: str
    floor_number: int = 1
    area: float  # Square footage or area
    floor_area: float  # Alias for area (for compatibility)
    volume: float
    height: float  # Ceiling height in feet or meters
    ceiling_height: float  # Alias for height (for compatibility)
    occupancy: int = 0
    cooling_setpoint: float = 24.0
    heating_setpoint: float = 21.0
    lighting_power_density: float = 10.0
    lighting_watts: float = 0.0
    equipment_power_density: float = 10.0

    def __init__(self, **data):
        # Handle field aliases
        if 'area' in data and 'floor_area' not in data:
            data['floor_area'] = data['area']
        elif 'floor_area' in data and 'area' not in data:
            data['area'] = data['floor_area']

        if 'height' in data and 'ceiling_height' not in data:
            data['ceiling_height'] = data['height']
        elif 'ceiling_height' in data and 'height' not in data:
            data['height'] = data['ceiling_height']

        super().__init__(**data)


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    project_number: Optional[str] = None
    client_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    building_type: str
    total_floor_area: Optional[float] = None
    num_floors: int
    status: str
    calculation_method: str
    unit_system: str
    created_at: datetime
    updated_at: datetime
    calculated_at: Optional[datetime] = None
    credits_used: int
    num_spaces: int = 0
    settings: Optional[dict] = None
    floorplan_url: Optional[str] = None
    obj_url: Optional[str] = None
    extraction_result: Optional[dict] = None

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    projects: List[ProjectResponse]
    total: int
    page: int
    page_size: int


class ProjectSummary(BaseModel):
    total_projects: int
    completed_projects: int
    total_floor_area: float
    credits_used: int
    credits_remaining: int


# Mock data store (replace with database in production)
_projects_store = {}


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: dict = Depends(get_current_user),
):
    """
    Create a new HVAC load calculation project.
    """
    import uuid

    project_id = str(uuid.uuid4())
    now = datetime.utcnow()

    project = {
        "id": project_id,
        "user_id": current_user["id"],
        "name": project_data.name,
        "description": project_data.description,
        "project_number": project_data.project_number,
        "client_name": project_data.client_name,
        "address": project_data.address,
        "city": project_data.city,
        "state": project_data.state,
        "country": project_data.country,
        "latitude": None,
        "longitude": None,
        "building_type": project_data.building_type,
        "total_floor_area": None,
        "num_floors": project_data.num_floors,
        "status": "draft",
        "calculation_method": project_data.calculation_method,
        "unit_system": project_data.unit_system,
        "settings": None,
        "floorplan_url": None,
        "obj_url": None,
        "extraction_result": None,
        "created_at": now,
        "updated_at": now,
        "calculated_at": None,
        "credits_used": 0,
        "spaces": [],
        "zones": [],
        "systems": [],
    }

    _projects_store[project_id] = project

    return ProjectResponse(**project, num_spaces=0)


@router.get("/", response_model=ProjectListResponse)
async def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """
    List all projects for the current user.
    """
    # Filter projects by user
    user_projects = [
        p for p in _projects_store.values()
        if p.get("user_id") == current_user["id"]
    ]

    # Apply filters
    if status:
        user_projects = [p for p in user_projects if p["status"] == status]

    if search:
        search_lower = search.lower()
        user_projects = [
            p for p in user_projects
            if search_lower in p["name"].lower()
            or (p.get("description") and search_lower in p["description"].lower())
        ]

    # Sort by created_at descending
    user_projects.sort(key=lambda x: x["created_at"], reverse=True)

    # Paginate
    total = len(user_projects)
    start = (page - 1) * page_size
    end = start + page_size
    paginated = user_projects[start:end]

    return ProjectListResponse(
        projects=[ProjectResponse(**p, num_spaces=len(p.get("spaces", []))) for p in paginated],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/summary", response_model=ProjectSummary)
async def get_projects_summary(current_user: dict = Depends(get_current_user)):
    """
    Get summary statistics for user's projects.
    """
    user_projects = [
        p for p in _projects_store.values()
        if p.get("user_id") == current_user["id"]
    ]

    completed = [p for p in user_projects if p["status"] == "completed"]
    total_area = sum(p.get("total_floor_area") or 0 for p in user_projects)
    credits_used = sum(p.get("credits_used") or 0 for p in user_projects)

    return ProjectSummary(
        total_projects=len(user_projects),
        completed_projects=len(completed),
        total_floor_area=total_area,
        credits_used=credits_used,
        credits_remaining=current_user["credits"],
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Get project details by ID.
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
            detail="Not authorized to access this project",
        )

    return ProjectResponse(**project, num_spaces=len(project.get("spaces", [])))


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    current_user: dict = Depends(get_current_user),
):
    """
    Update project details.
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
            detail="Not authorized to modify this project",
        )

    # Update fields
    update_data = project_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        project[key] = value

    project["updated_at"] = datetime.utcnow()
    _projects_store[project_id] = project

    return ProjectResponse(**project, num_spaces=len(project.get("spaces", [])))


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Delete a project.
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
            detail="Not authorized to delete this project",
        )

    del _projects_store[project_id]


@router.post("/{project_id}/duplicate", response_model=ProjectResponse)
async def duplicate_project(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Create a copy of an existing project.
    """
    import uuid
    import copy

    project = _projects_store.get(project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if project.get("user_id") != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to duplicate this project",
        )

    # Create copy
    new_project = copy.deepcopy(project)
    new_project["id"] = str(uuid.uuid4())
    new_project["name"] = f"{project['name']} (Copy)"
    new_project["status"] = "draft"
    new_project["created_at"] = datetime.utcnow()
    new_project["updated_at"] = datetime.utcnow()
    new_project["calculated_at"] = None
    new_project["credits_used"] = 0

    _projects_store[new_project["id"]] = new_project

    return ProjectResponse(**new_project, num_spaces=len(new_project.get("spaces", [])))


@router.get("/{project_id}/spaces", response_model=List[SpaceData])
async def get_project_spaces(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Get all spaces in a project.
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
            detail="Not authorized to access this project",
        )

    return project.get("spaces", [])


@router.post("/{project_id}/spaces", response_model=SpaceData)
async def add_space(
    project_id: str,
    space_data: SpaceData,
    current_user: dict = Depends(get_current_user),
):
    """
    Add a space to a project.
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
            detail="Not authorized to modify this project",
        )

    if "spaces" not in project:
        project["spaces"] = []

    project["spaces"].append(space_data.model_dump())
    project["updated_at"] = datetime.utcnow()

    # Update total floor area
    project["total_floor_area"] = sum(s["floor_area"] for s in project["spaces"])

    return space_data


@router.put("/{project_id}/spaces/{space_id}", response_model=SpaceData)
async def update_space(
    project_id: str,
    space_id: str,
    space_data: SpaceData,
    current_user: dict = Depends(get_current_user),
):
    """
    Update a space in a project.
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
            detail="Not authorized to modify this project",
        )

    if "spaces" not in project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Space not found",
        )

    # Find and update the space
    space_found = False
    for i, space in enumerate(project["spaces"]):
        if space["id"] == space_id:
            project["spaces"][i] = space_data.model_dump()
            space_found = True
            break

    if not space_found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Space not found",
        )

    project["updated_at"] = datetime.utcnow()

    # Update total floor area
    project["total_floor_area"] = sum(s["floor_area"] for s in project["spaces"])

    return space_data
