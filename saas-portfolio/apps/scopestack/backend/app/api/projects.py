from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

from app.models.database import get_db, Project, User, ProjectStatus
from app.api.auth import get_current_user

router = APIRouter()

class ProjectCreate(BaseModel):
    name: str
    client_name: str
    client_email: EmailStr

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    client_name: Optional[str] = None
    client_email: Optional[EmailStr] = None
    status: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    client_name: str
    client_email: str
    status: str
    client_portal_token: str
    scope_items_count: int
    pending_changes_count: int
    created_at: datetime
    updated_at: datetime

@router.get("", response_model=List[ProjectResponse])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    projects = db.query(Project).filter(Project.user_id == current_user.id).all()

    return [
        ProjectResponse(
            id=p.id,
            name=p.name,
            client_name=p.client_name,
            client_email=p.client_email,
            status=p.status.value,
            client_portal_token=p.client_portal_token,
            scope_items_count=len(p.scope_items),
            pending_changes_count=len([cr for cr in p.change_requests if cr.status.value == "pending"]),
            created_at=p.created_at,
            updated_at=p.updated_at
        )
        for p in projects
    ]

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check project limits based on plan
    existing_count = db.query(Project).filter(
        Project.user_id == current_user.id,
        Project.status == ProjectStatus.ACTIVE
    ).count()

    limits = {"free": 1, "starter": 5, "pro": float('inf')}
    if existing_count >= limits.get(current_user.plan.value, 0):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Project limit reached for {current_user.plan.value} plan"
        )

    project = Project(
        user_id=current_user.id,
        name=project_data.name,
        client_name=project_data.client_name,
        client_email=project_data.client_email
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    return ProjectResponse(
        id=project.id,
        name=project.name,
        client_name=project.client_name,
        client_email=project.client_email,
        status=project.status.value,
        client_portal_token=project.client_portal_token,
        scope_items_count=0,
        pending_changes_count=0,
        created_at=project.created_at,
        updated_at=project.updated_at
    )

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    return ProjectResponse(
        id=project.id,
        name=project.name,
        client_name=project.client_name,
        client_email=project.client_email,
        status=project.status.value,
        client_portal_token=project.client_portal_token,
        scope_items_count=len(project.scope_items),
        pending_changes_count=len([cr for cr in project.change_requests if cr.status.value == "pending"]),
        created_at=project.created_at,
        updated_at=project.updated_at
    )

@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if project_data.name is not None:
        project.name = project_data.name
    if project_data.client_name is not None:
        project.client_name = project_data.client_name
    if project_data.client_email is not None:
        project.client_email = project_data.client_email
    if project_data.status is not None:
        project.status = ProjectStatus(project_data.status)

    db.commit()
    db.refresh(project)

    return ProjectResponse(
        id=project.id,
        name=project.name,
        client_name=project.client_name,
        client_email=project.client_email,
        status=project.status.value,
        client_portal_token=project.client_portal_token,
        scope_items_count=len(project.scope_items),
        pending_changes_count=len([cr for cr in project.change_requests if cr.status.value == "pending"]),
        created_at=project.created_at,
        updated_at=project.updated_at
    )

@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    db.delete(project)
    db.commit()

    return {"success": True}
