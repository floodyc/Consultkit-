from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from io import BytesIO, StringIO
import csv

from app.models.database import get_db, Project, User
from app.api.auth import get_current_user

router = APIRouter()

@router.get("/{project_id}/export/csv")
async def export_csv(
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

    output = StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow(["Type", "Title", "Description", "Hours", "Cost", "Status", "Source", "Date"])

    # Scope Items
    for item in project.scope_items:
        writer.writerow([
            "Scope Item",
            item.title,
            item.description or "",
            item.estimated_hours,
            float(item.estimated_cost),
            item.status.value,
            item.source.value,
            item.created_at.strftime("%Y-%m-%d")
        ])

    # Change Requests
    for cr in project.change_requests:
        writer.writerow([
            "Change Request",
            cr.title,
            cr.description or "",
            cr.hours_delta,
            float(cr.cost_delta),
            cr.status.value,
            "change_request",
            cr.created_at.strftime("%Y-%m-%d")
        ])

    csv_content = output.getvalue()
    output.close()

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={project.name.replace(' ', '_')}_scope.csv"
        }
    )

@router.get("/{project_id}/export/pdf")
async def export_pdf(
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

    # Generate HTML for PDF
    approved_items = [item for item in project.scope_items if item.status.value in ["included", "approved"]]
    total_hours = sum(item.estimated_hours for item in approved_items)
    total_cost = sum(float(item.estimated_cost) for item in approved_items)

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; padding: 40px; }}
            h1 {{ color: #1a1a1a; }}
            h2 {{ color: #333; margin-top: 30px; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
            th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
            th {{ background-color: #f5f5f5; }}
            .summary {{ background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }}
            .total {{ font-weight: bold; font-size: 1.2em; }}
        </style>
    </head>
    <body>
        <h1>Scope Document: {project.name}</h1>
        <p><strong>Client:</strong> {project.client_name}</p>
        <p><strong>Generated:</strong> {project.updated_at.strftime("%Y-%m-%d")}</p>

        <div class="summary">
            <p class="total">Total Approved Scope: {total_hours} hours / ${total_cost:,.2f}</p>
        </div>

        <h2>Scope Items</h2>
        <table>
            <tr>
                <th>Item</th>
                <th>Description</th>
                <th>Hours</th>
                <th>Cost</th>
                <th>Source</th>
            </tr>
    """

    for item in approved_items:
        html_content += f"""
            <tr>
                <td>{item.title}</td>
                <td>{item.description or '-'}</td>
                <td>{item.estimated_hours}</td>
                <td>${float(item.estimated_cost):,.2f}</td>
                <td>{item.source.value}</td>
            </tr>
        """

    html_content += """
        </table>

        <h2>Change Request History</h2>
        <table>
            <tr>
                <th>Request</th>
                <th>Hours</th>
                <th>Cost</th>
                <th>Status</th>
                <th>Date</th>
            </tr>
    """

    for cr in project.change_requests:
        html_content += f"""
            <tr>
                <td>{cr.title}</td>
                <td>+{cr.hours_delta}</td>
                <td>+${float(cr.cost_delta):,.2f}</td>
                <td>{cr.status.value}</td>
                <td>{cr.created_at.strftime("%Y-%m-%d")}</td>
            </tr>
        """

    html_content += """
        </table>
    </body>
    </html>
    """

    # Note: WeasyPrint would be used here in production
    # For scaffold, return HTML that can be converted
    return Response(
        content=html_content,
        media_type="text/html",
        headers={
            "Content-Disposition": f"attachment; filename={project.name.replace(' ', '_')}_scope.html"
        }
    )
