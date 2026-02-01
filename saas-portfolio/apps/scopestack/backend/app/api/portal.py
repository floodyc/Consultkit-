from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import datetime

from app.models.database import get_db, Project, ChangeRequest, ChangeRequestStatus

router = APIRouter()

class PortalScopeItem(BaseModel):
    id: str
    title: str
    description: str | None
    estimated_hours: float
    estimated_cost: float
    source: str

class PortalChangeRequest(BaseModel):
    id: str
    title: str
    description: str | None
    hours_delta: float
    cost_delta: float
    status: str
    created_at: datetime

class PortalResponse(BaseModel):
    project_name: str
    client_name: str
    scope_items: List[PortalScopeItem]
    pending_requests: List[PortalChangeRequest]
    total_hours: float
    total_cost: float
    pending_hours: float
    pending_cost: float

@router.get("/{token}", response_model=PortalResponse)
async def get_portal(token: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.client_portal_token == token).first()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portal not found")

    approved_items = [
        item for item in project.scope_items
        if item.status.value in ["included", "approved"]
    ]

    pending_requests = [
        cr for cr in project.change_requests
        if cr.status == ChangeRequestStatus.PENDING
    ]

    total_hours = sum(item.estimated_hours for item in approved_items)
    total_cost = sum(float(item.estimated_cost) for item in approved_items)
    pending_hours = sum(cr.hours_delta for cr in pending_requests)
    pending_cost = sum(float(cr.cost_delta) for cr in pending_requests)

    return PortalResponse(
        project_name=project.name,
        client_name=project.client_name,
        scope_items=[
            PortalScopeItem(
                id=item.id,
                title=item.title,
                description=item.description,
                estimated_hours=item.estimated_hours,
                estimated_cost=float(item.estimated_cost),
                source=item.source.value
            )
            for item in approved_items
        ],
        pending_requests=[
            PortalChangeRequest(
                id=cr.id,
                title=cr.title,
                description=cr.description,
                hours_delta=cr.hours_delta,
                cost_delta=float(cr.cost_delta),
                status=cr.status.value,
                created_at=cr.created_at
            )
            for cr in pending_requests
        ],
        total_hours=total_hours,
        total_cost=total_cost,
        pending_hours=pending_hours,
        pending_cost=pending_cost
    )

@router.post("/{token}/approve/{request_id}")
async def client_approve(
    token: str,
    request_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.client_portal_token == token).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portal not found")

    change_request = db.query(ChangeRequest).filter(
        ChangeRequest.id == request_id,
        ChangeRequest.project_id == project.id,
        ChangeRequest.status == ChangeRequestStatus.PENDING
    ).first()

    if not change_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Change request not found")

    change_request.status = ChangeRequestStatus.APPROVED
    change_request.approved_at = datetime.utcnow()
    change_request.approved_by = f"Client ({project.client_name})"
    change_request.client_ip = request.client.host if request.client else None

    db.commit()

    return {"success": True, "message": "Change request approved"}

@router.post("/{token}/reject/{request_id}")
async def client_reject(
    token: str,
    request_id: str,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.client_portal_token == token).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portal not found")

    change_request = db.query(ChangeRequest).filter(
        ChangeRequest.id == request_id,
        ChangeRequest.project_id == project.id,
        ChangeRequest.status == ChangeRequestStatus.PENDING
    ).first()

    if not change_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Change request not found")

    change_request.status = ChangeRequestStatus.REJECTED
    db.commit()

    return {"success": True, "message": "Change request rejected"}
