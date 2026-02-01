from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

from app.models.database import get_db, Project, ScopeItem, User, ScopeItemStatus, ScopeItemSource
from app.api.auth import get_current_user

router = APIRouter()

class ScopeItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    estimated_hours: float = 0
    estimated_cost: float = 0

class ScopeItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    estimated_hours: Optional[float] = None
    estimated_cost: Optional[float] = None
    status: Optional[str] = None

class ScopeItemResponse(BaseModel):
    id: str
    project_id: str
    title: str
    description: Optional[str]
    source: str
    estimated_hours: float
    estimated_cost: float
    status: str
    created_at: datetime
    updated_at: datetime

@router.get("/projects/{project_id}/scope-items", response_model=List[ScopeItemResponse])
async def list_scope_items(
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

    return [
        ScopeItemResponse(
            id=item.id,
            project_id=item.project_id,
            title=item.title,
            description=item.description,
            source=item.source.value,
            estimated_hours=item.estimated_hours,
            estimated_cost=float(item.estimated_cost),
            status=item.status.value,
            created_at=item.created_at,
            updated_at=item.updated_at
        )
        for item in project.scope_items
    ]

@router.post("/projects/{project_id}/scope-items", response_model=ScopeItemResponse, status_code=status.HTTP_201_CREATED)
async def create_scope_item(
    project_id: str,
    item_data: ScopeItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # Check scope item limits for free plan
    if current_user.plan.value == "free" and len(project.scope_items) >= 10:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Scope item limit reached for free plan"
        )

    item = ScopeItem(
        project_id=project_id,
        title=item_data.title,
        description=item_data.description,
        estimated_hours=item_data.estimated_hours,
        estimated_cost=Decimal(str(item_data.estimated_cost))
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return ScopeItemResponse(
        id=item.id,
        project_id=item.project_id,
        title=item.title,
        description=item.description,
        source=item.source.value,
        estimated_hours=item.estimated_hours,
        estimated_cost=float(item.estimated_cost),
        status=item.status.value,
        created_at=item.created_at,
        updated_at=item.updated_at
    )

@router.patch("/scope-items/{item_id}", response_model=ScopeItemResponse)
async def update_scope_item(
    item_id: str,
    item_data: ScopeItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(ScopeItem).join(Project).filter(
        ScopeItem.id == item_id,
        Project.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scope item not found")

    if item_data.title is not None:
        item.title = item_data.title
    if item_data.description is not None:
        item.description = item_data.description
    if item_data.estimated_hours is not None:
        item.estimated_hours = item_data.estimated_hours
    if item_data.estimated_cost is not None:
        item.estimated_cost = Decimal(str(item_data.estimated_cost))
    if item_data.status is not None:
        item.status = ScopeItemStatus(item_data.status)

    db.commit()
    db.refresh(item)

    return ScopeItemResponse(
        id=item.id,
        project_id=item.project_id,
        title=item.title,
        description=item.description,
        source=item.source.value,
        estimated_hours=item.estimated_hours,
        estimated_cost=float(item.estimated_cost),
        status=item.status.value,
        created_at=item.created_at,
        updated_at=item.updated_at
    )

@router.delete("/scope-items/{item_id}")
async def delete_scope_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(ScopeItem).join(Project).filter(
        ScopeItem.id == item_id,
        Project.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scope item not found")

    db.delete(item)
    db.commit()

    return {"success": True}
