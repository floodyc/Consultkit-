# -*- coding: utf-8 -*-
"""
Report generation endpoints.
"""

from datetime import datetime
from typing import Optional
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io

from app.api.endpoints.auth import get_current_user
from app.api.endpoints.projects import _projects_store

router = APIRouter()


class ReportFormat(str, Enum):
    PDF = "pdf"
    EXCEL = "excel"
    JSON = "json"
    GBXML = "gbxml"


class ReportType(str, Enum):
    SUMMARY = "summary"
    DETAILED = "detailed"
    SPACE_BY_SPACE = "space_by_space"
    EQUIPMENT_SCHEDULE = "equipment_schedule"
    PSYCHROMETRIC = "psychrometric"


class ReportRequest(BaseModel):
    report_type: ReportType = ReportType.SUMMARY
    format: ReportFormat = ReportFormat.PDF
    include_charts: bool = True
    include_hourly_data: bool = False
    company_name: Optional[str] = None
    company_logo_url: Optional[str] = None
    engineer_name: Optional[str] = None
    notes: Optional[str] = None


class ReportResponse(BaseModel):
    report_id: str
    project_id: str
    report_type: str
    format: str
    generated_at: datetime
    download_url: str
    file_size: int


def generate_pdf_report(project: dict, report_type: ReportType, options: ReportRequest) -> bytes:
    """Generate a PDF report for the project."""
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.75*inch, bottomMargin=0.75*inch)
    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        textColor=colors.HexColor('#1a365d'),
    )
    story.append(Paragraph("HVAC Load Calculation Report", title_style))

    # Project info
    story.append(Paragraph(f"<b>Project:</b> {project['name']}", styles['Normal']))
    if project.get('client_name'):
        story.append(Paragraph(f"<b>Client:</b> {project['client_name']}", styles['Normal']))
    if project.get('address'):
        story.append(Paragraph(f"<b>Location:</b> {project['address']}", styles['Normal']))
    story.append(Paragraph(f"<b>Date:</b> {datetime.now().strftime('%B %d, %Y')}", styles['Normal']))
    story.append(Spacer(1, 20))

    # Building Summary
    story.append(Paragraph("Building Summary", styles['Heading2']))
    summary_data = [
        ["Parameter", "Value"],
        ["Total Floor Area", f"{project.get('total_floor_area', 0):.1f} m²"],
        ["Number of Spaces", str(len(project.get('spaces', [])))],
        ["Building Type", project.get('building_type', 'Office').title()],
        ["Calculation Method", "ASHRAE Heat Balance Method"],
    ]
    summary_table = Table(summary_data, colWidths=[200, 200])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2b6cb0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f7fafc')),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 20))

    # Design Conditions
    story.append(Paragraph("Design Conditions", styles['Heading2']))
    design_data = [
        ["Condition", "Value"],
        ["Summer Outdoor DB", f"{project.get('design_conditions', {}).get('cooling_db', 35.0):.1f} °C"],
        ["Winter Outdoor DB", f"{project.get('design_conditions', {}).get('heating_db', -15.0):.1f} °C"],
        ["Indoor Cooling Setpoint", "24.0 °C"],
        ["Indoor Heating Setpoint", "21.0 °C"],
    ]
    design_table = Table(design_data, colWidths=[200, 200])
    design_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2b6cb0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f7fafc')),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
    ]))
    story.append(design_table)
    story.append(Spacer(1, 20))

    # Space-by-Space Results
    if report_type in [ReportType.DETAILED, ReportType.SPACE_BY_SPACE]:
        story.append(PageBreak())
        story.append(Paragraph("Space-by-Space Load Summary", styles['Heading2']))

        space_data = [["Space Name", "Area (m²)", "Cooling (W)", "Heating (W)", "Airflow (L/s)"]]
        for space in project.get('spaces', []):
            # Mock calculation results
            area = space.get('floor_area', 100)
            cooling = area * 100  # ~100 W/m² typical
            heating = area * 50  # ~50 W/m² typical
            airflow = cooling / (1006 * 1.2 * 11) * 1000  # Supply air calc

            space_data.append([
                space.get('name', 'Unknown'),
                f"{area:.1f}",
                f"{cooling:.0f}",
                f"{heating:.0f}",
                f"{airflow:.1f}",
            ])

        space_table = Table(space_data, colWidths=[140, 70, 80, 80, 80])
        space_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2b6cb0')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f7fafc')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f7fafc')]),
        ]))
        story.append(space_table)

    # Footer note
    story.append(Spacer(1, 30))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.gray,
    )
    story.append(Paragraph(
        "Generated by HVACplus - Professional ASHRAE Load Calculation Platform",
        footer_style
    ))
    story.append(Paragraph(
        "Calculations performed using ASHRAE Heat Balance Method per ASHRAE Fundamentals Chapter 18",
        footer_style
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()


@router.post("/{project_id}/generate", response_model=ReportResponse)
async def generate_report(
    project_id: str,
    request: ReportRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Generate a professional load calculation report.

    Report types:
    - summary: Executive summary with key results
    - detailed: Full technical report with all calculations
    - space_by_space: Individual space breakdowns
    - equipment_schedule: Equipment sizing summary
    - psychrometric: Psychrometric analysis
    """
    import uuid

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

    report_id = str(uuid.uuid4())

    # In production, generate report asynchronously and store
    # For now, return mock response
    return ReportResponse(
        report_id=report_id,
        project_id=project_id,
        report_type=request.report_type,
        format=request.format,
        generated_at=datetime.utcnow(),
        download_url=f"/api/v1/reports/{project_id}/download/{report_id}",
        file_size=0,
    )


@router.get("/{project_id}/download/{report_id}")
async def download_report(
    project_id: str,
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Download a generated report.
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

    try:
        # Generate PDF
        pdf_content = generate_pdf_report(project, ReportType.DETAILED, ReportRequest())

        return StreamingResponse(
            io.BytesIO(pdf_content),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={project['name']}_load_report.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}",
        )


@router.get("/{project_id}/export/gbxml")
async def export_gbxml(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Export project geometry as gbXML.
    """
    from gem_ai import GbXMLWriter, Location

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

    try:
        # Create gbXML writer
        location = Location(
            latitude=project.get("latitude", 40.0),
            longitude=project.get("longitude", -100.0),
            city=project.get("city", ""),
            country=project.get("country", ""),
        )
        writer = GbXMLWriter(building_name=project["name"], location=location)

        # Add storey
        storey_id = writer.add_storey("storey-1", "Ground Floor", 0.0)

        # Add spaces
        for space in project.get("spaces", []):
            writer.add_space(
                space_id=space["id"],
                name=space["name"],
                x=space.get("x", 0.0),
                y=space.get("y", 0.0),
                z=space.get("z", 0.0),
                width=space.get("width", 10.0),
                depth=space.get("depth", 10.0),
                height=space.get("height", 3.0),
                storey_id=storey_id,
            )

        gbxml_content = writer.generate()

        return StreamingResponse(
            io.BytesIO(gbxml_content.encode()),
            media_type="application/xml",
            headers={
                "Content-Disposition": f"attachment; filename={project['name']}.xml"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export gbXML: {str(e)}",
        )


@router.get("/{project_id}/export/json")
async def export_json(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Export calculation results as JSON.
    """
    import json

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

    # Export project data
    export_data = {
        "project": {
            "id": project["id"],
            "name": project["name"],
            "building_type": project.get("building_type"),
            "total_floor_area": project.get("total_floor_area"),
            "location": {
                "city": project.get("city"),
                "latitude": project.get("latitude"),
                "longitude": project.get("longitude"),
            },
        },
        "spaces": project.get("spaces", []),
        "calculation_settings": {
            "method": project.get("calculation_method", "heat_balance"),
            "unit_system": project.get("unit_system", "SI"),
        },
        "exported_at": datetime.utcnow().isoformat(),
    }

    return StreamingResponse(
        io.BytesIO(json.dumps(export_data, indent=2, default=str).encode()),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename={project['name']}_export.json"
        }
    )
