from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

from app.models.database import (
    get_db, Project, ChangeRequest, ScopeItem, User,
    ChangeRequestStatus, ScopeItemSource, ScopeItemStatus
)
from app.api.auth import get_current_user

router = APIRouter()

class ChangeRequestCreate(BaseModel):
    title: str
    description: Optional[str] = None
    requested_by: str
    hours_delta: float = 0
    cost_delta: float = 0

class ChangeRequestResponse(BaseModel):
    id: str
    project_id: str
    title: str
    description: Optional[str]
    requested_by: str
    hours_delta: float
    cost_delta: float
    status: str
    approved_at: Optional[datetime]
    approved_by: Optional[str]
    created_at: datetime
    updated_at: datetime

@router.get("/projects/{project_id}/change-requests", response_model=List[ChangeRequestResponse])
async def list_change_requests(
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
        ChangeRequestResponse(
            id=cr.id,
            project_id=cr.project_id,
            title=cr.title,
            description=cr.description,
            requested_by=cr.requested_by,
            hours_delta=cr.hours_delta,
            cost_delta=float(cr.cost_delta),
            status=cr.status.value,
            approved_at=cr.approved_at,
            approved_by=cr.approved_by,
            created_at=cr.created_at,
            updated_at=cr.updated_at
        )
        for cr in project.change_requests
    ]

@router.post("/projects/{project_id}/change-requests", response_model=ChangeRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_change_request(
    project_id: str,
    cr_data: ChangeRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    change_request = ChangeRequest(
        project_id=project_id,
        title=cr_data.title,
        description=cr_data.description,
        requested_by=cr_data.requested_by,
        hours_delta=cr_data.hours_delta,
        cost_delta=Decimal(str(cr_data.cost_delta))
    )
    db.add(change_request)
    db.commit()
    db.refresh(change_request)

    return ChangeRequestResponse(
        id=change_request.id,
        project_id=change_request.project_id,
        title=change_request.title,
        description=change_request.description,
        requested_by=change_request.requested_by,
        hours_delta=change_request.hours_delta,
        cost_delta=float(change_request.cost_delta),
        status=change_request.status.value,
        approved_at=change_request.approved_at,
        approved_by=change_request.approved_by,
        created_at=change_request.created_at,
        updated_at=change_request.updated_at
    )

@router.patch("/change-requests/{cr_id}/approve", response_model=ChangeRequestResponse)
async def approve_change_request(
    cr_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    change_request = db.query(ChangeRequest).join(Project).filter(
        ChangeRequest.id == cr_id,
        Project.user_id == current_user.id
    ).first()

    if not change_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Change request not found")

    if change_request.status != ChangeRequestStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Change request is not pending")

    # Update change request
    change_request.status = ChangeRequestStatus.APPROVED
    change_request.approved_at = datetime.utcnow()
    change_request.approved_by = current_user.name

    # Create corresponding scope item
    scope_item = ScopeItem(
        project_id=change_request.project_id,
        title=change_request.title,
        description=change_request.description,
        source=ScopeItemSource.CHANGE_REQUEST,
        estimated_hours=change_request.hours_delta,
        estimated_cost=change_request.cost_delta,
        status=ScopeItemStatus.APPROVED
    )
    db.add(scope_item)

    change_request.scope_item_id = scope_item.id

    db.commit()
    db.refresh(change_request)

    return ChangeRequestResponse(
        id=change_request.id,
        project_id=change_request.project_id,
        title=change_request.title,
        description=change_request.description,
        requested_by=change_request.requested_by,
        hours_delta=change_request.hours_delta,
        cost_delta=float(change_request.cost_delta),
        status=change_request.status.value,
        approved_at=change_request.approved_at,
        approved_by=change_request.approved_by,
        created_at=change_request.created_at,
        updated_at=change_request.updated_at
    )

@router.patch("/change-requests/{cr_id}/reject", response_model=ChangeRequestResponse)
async def reject_change_request(
    cr_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    change_request = db.query(ChangeRequest).join(Project).filter(
        ChangeRequest.id == cr_id,
        Project.user_id == current_user.id
    ).first()

    if not change_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Change request not found")

    if change_request.status != ChangeRequestStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Change request is not pending")

    change_request.status = ChangeRequestStatus.REJECTED
    db.commit()
    db.refresh(change_request)

    return ChangeRequestResponse(
        id=change_request.id,
        project_id=change_request.project_id,
        title=change_request.title,
        description=change_request.description,
        requested_by=change_request.requested_by,
        hours_delta=change_request.hours_delta,
        cost_delta=float(change_request.cost_delta),
        status=change_request.status.value,
        approved_at=change_request.approved_at,
        approved_by=change_request.approved_by,
        created_at=change_request.created_at,
        updated_at=change_request.updated_at
    )
