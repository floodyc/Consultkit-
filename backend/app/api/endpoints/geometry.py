# -*- coding: utf-8 -*-
"""
Geometry extraction endpoints using GEM-AI.
"""

import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Body, Depends, File, Form, HTTPException, Query, UploadFile, status
from pydantic import BaseModel

from app.core.config import settings
from app.api.endpoints.auth import get_current_user

router = APIRouter()


# Pydantic models
class ExtractionParams(BaseModel):
    pixels_per_metre: float = 50.0
    floor_height_m: float = 3.0
    floor_z_m: float = 0.0
    detect_openings: bool = True


class ExtractedRoom(BaseModel):
    id: str
    name: str
    x: float
    y: float
    z: float
    width: float
    depth: float
    height: float
    area_m2: float
    volume_m3: float


class ExtractionResult(BaseModel):
    file_id: str
    filename: str
    rooms: list[ExtractedRoom]
    openings: list[dict]
    total_area_m2: float
    total_volume_m3: float
    image_width_px: int
    image_height_px: int
    pixels_per_metre: float
    debug_images: dict[str, str]  # Base64 encoded
    gbxml_content: str  # gbXML file content
    obj_content: str  # Wavefront OBJ file content for 3D preview


class UploadResponse(BaseModel):
    file_id: str
    filename: str
    file_size: int
    status: str
    message: str


@router.post("/upload", response_model=UploadResponse)
async def upload_floorplan(
    file: UploadFile = File(...),
    project_id: str = Form(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Upload a floorplan image for geometry extraction.

    Supported formats: PNG, JPG, JPEG, TIF, TIFF, BMP, PDF
    """
    # Validate file type
    allowed_types = {
        "image/png", "image/jpeg", "image/tiff", "image/bmp",
        "application/pdf"
    }
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file.content_type}. Allowed: PNG, JPG, TIF, BMP, PDF",
        )

    # Check file size
    content = await file.read()
    file_size = len(content)
    max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE_MB}MB",
        )

    # Generate file ID and save
    file_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1].lower()
    stored_filename = f"{file_id}{file_ext}"

    # Create upload directory if needed
    upload_dir = os.path.join(settings.UPLOAD_DIR, project_id)
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, stored_filename)
    with open(file_path, "wb") as f:
        f.write(content)

    return UploadResponse(
        file_id=file_id,
        filename=file.filename,
        file_size=file_size,
        status="uploaded",
        message="File uploaded successfully. Ready for extraction.",
    )


@router.post("/extract/{file_id}", response_model=ExtractionResult)
async def extract_geometry(
    file_id: str,
    project_id: str = Query(..., description="Project ID for uploaded floorplan"),
    params: Optional[ExtractionParams] = Body(None, description="Extraction parameters"),
    current_user: dict = Depends(get_current_user),
):
    """
    Extract room geometry from uploaded floorplan using GEM-AI.

    This endpoint processes the uploaded image and detects:
    - Room boundaries (axis-aligned rectangles)
    - Window and door openings (experimental)
    - Room adjacencies

    Returns structured geometry data that can be used for load calculations.
    """
    import logging
    logger = logging.getLogger(__name__)

    logger.info(f"Extract geometry called: file_id={file_id}, project_id={project_id}")
    logger.info(f"Params: {params}")

    try:
        from gem_ai import GeometryExtractor, ExtractionParams as GemParams
    except ImportError as e:
        logger.error(f"Failed to import gem_ai: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"GEM-AI module not available: {str(e)}",
        )

    params = params or ExtractionParams()
    logger.info(f"Using extraction params: {params}")

    # Find uploaded file
    upload_dir = os.path.join(settings.UPLOAD_DIR, project_id)
    logger.info(f"Looking for file in: {upload_dir}")
    file_path = None

    for ext in [".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".pdf"]:
        potential_path = os.path.join(upload_dir, f"{file_id}{ext}")
        if os.path.exists(potential_path):
            file_path = potential_path
            break

    if not file_path:
        logger.error(f"File not found: {file_id} in {upload_dir}")
        logger.error(f"Upload dir exists: {os.path.exists(upload_dir)}")
        if os.path.exists(upload_dir):
            logger.error(f"Files in dir: {os.listdir(upload_dir)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Uploaded file not found. Please upload again.",
        )

    logger.info(f"Found file: {file_path}")

    try:
        # Initialize GEM-AI extractor
        logger.info("Initializing GEM-AI extractor...")
        gem_params = GemParams(
            pixels_per_metre=params.pixels_per_metre,
            floor_height_m=params.floor_height_m,
            floor_z_m=params.floor_z_m,
            detect_openings=params.detect_openings,
        )
        logger.info(f"GEM params: {gem_params}")

        extractor = GeometryExtractor(params=gem_params)
        logger.info("Extractor initialized successfully")

        # Extract geometry
        logger.info(f"Starting extraction from: {file_path}")
        geometry = extractor.extract_from_file(file_path)
        logger.info(f"Extraction complete. Found {len(geometry.rooms)} rooms")

        # Convert to response format
        rooms = [
            ExtractedRoom(
                id=room.id,
                name=room.name,
                x=room.x,
                y=room.y,
                z=room.z,
                width=room.width,
                depth=room.depth,
                height=room.height,
                area_m2=room.area_m2,
                volume_m3=room.volume_m3,
            )
            for room in geometry.rooms
        ]

        openings = [
            {
                "kind": o.kind,
                "bbox_m": o.bbox_m,
                "confidence": o.confidence,
            }
            for o in geometry.openings
        ]

        logger.info(f"Building response with {len(rooms)} rooms")

        # Generate gbXML for data export
        logger.info("Generating gbXML...")
        from gem_ai import GbXMLWriter
        gbxml_writer = GbXMLWriter(building_name=project_id)
        gbxml_writer.from_extracted_geometry(geometry)
        gbxml_content = gbxml_writer.generate()
        logger.info(f"Generated gbXML: {len(gbxml_content)} characters")

        # Generate OBJ for 3D visualization
        logger.info("Generating OBJ...")
        from gem_ai import OBJWriter
        obj_writer = OBJWriter()
        obj_writer.from_extracted_geometry(geometry)
        obj_content = obj_writer.generate()
        logger.info(f"Generated OBJ: {len(obj_content)} characters, {len(obj_writer.vertices)} vertices")

        return ExtractionResult(
            file_id=file_id,
            filename=os.path.basename(file_path),
            rooms=rooms,
            openings=openings,
            total_area_m2=geometry.total_area_m2,
            total_volume_m3=geometry.total_volume_m3,
            image_width_px=geometry.image_width_px,
            image_height_px=geometry.image_height_px,
            pixels_per_metre=geometry.pixels_per_metre,
            debug_images=geometry.debug_images,
            gbxml_content=gbxml_content,
            obj_content=obj_content,
        )

    except Exception as e:
        logger.error(f"Extraction failed with exception: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(f"Traceback:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Geometry extraction failed: {type(e).__name__}: {str(e)}",
        )


@router.post("/extract-direct", response_model=ExtractionResult)
async def extract_geometry_direct(
    file: UploadFile = File(...),
    pixels_per_metre: float = Form(50.0),
    floor_height_m: float = Form(3.0),
    detect_openings: bool = Form(True),
    current_user: dict = Depends(get_current_user),
):
    """
    Upload and extract geometry in a single request.

    Useful for quick testing without creating a project first.
    """
    from gem_ai import GeometryExtractor, ExtractionParams as GemParams

    # Validate file type
    allowed_types = {
        "image/png", "image/jpeg", "image/tiff", "image/bmp",
        "application/pdf"
    }
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file.content_type}",
        )

    content = await file.read()

    try:
        # Initialize extractor
        params = GemParams(
            pixels_per_metre=pixels_per_metre,
            floor_height_m=floor_height_m,
            detect_openings=detect_openings,
        )
        extractor = GeometryExtractor(params=params)

        # Extract geometry from bytes
        geometry = extractor.extract_from_bytes(content, file.filename)

        # Convert to response
        rooms = [
            ExtractedRoom(
                id=room.id,
                name=room.name,
                x=room.x,
                y=room.y,
                z=room.z,
                width=room.width,
                depth=room.depth,
                height=room.height,
                area_m2=room.area_m2,
                volume_m3=room.volume_m3,
            )
            for room in geometry.rooms
        ]

        openings = [
            {
                "kind": o.kind,
                "bbox_m": o.bbox_m,
                "confidence": o.confidence,
            }
            for o in geometry.openings
        ]

        return ExtractionResult(
            file_id=str(uuid.uuid4()),
            filename=file.filename,
            rooms=rooms,
            openings=openings,
            total_area_m2=geometry.total_area_m2,
            total_volume_m3=geometry.total_volume_m3,
            image_width_px=geometry.image_width_px,
            image_height_px=geometry.image_height_px,
            pixels_per_metre=geometry.pixels_per_metre,
            debug_images=geometry.debug_images,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Geometry extraction failed: {str(e)}",
        )


@router.post("/apply-to-project/{project_id}")
async def apply_extraction_to_project(
    project_id: str,
    extraction_result: ExtractionResult,
    current_user: dict = Depends(get_current_user),
):
    """
    Apply extracted geometry to a project, creating spaces.
    """
    from app.api.endpoints.projects import _projects_store

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

    # Create spaces from extracted rooms
    spaces = []
    for room in extraction_result.rooms:
        # Convert metric to imperial for frontend display
        area_sqft = room.area_m2 * 10.764  # m² to sq ft
        height_ft = room.height * 3.28084  # m to ft

        space = {
            "id": room.id,
            "name": room.name,
            "space_type": "office_enclosed",
            "floor_number": 1,  # Default floor number
            "area": area_sqft,  # Frontend expects 'area' in sq ft
            "floor_area": room.area_m2,  # Keep metric for calculations
            "volume": room.volume_m3,
            "height": room.height,  # Keep metric for calculations
            "ceiling_height": height_ft,  # Frontend expects 'ceiling_height' in ft
            "occupancy": 0,  # Default occupancy
            "x": room.x,
            "y": room.y,
            "z": room.z,
            "width": room.width,
            "depth": room.depth,
            "cooling_setpoint": 24.0,
            "heating_setpoint": 21.0,
            "lighting_power_density": 10.0,
            "lighting_watts": 0.0,
            "equipment_power_density": 10.0,
        }
        spaces.append(space)

    project["spaces"] = spaces
    project["total_floor_area"] = extraction_result.total_area_m2
    project["updated_at"] = datetime.utcnow()

    return {
        "message": f"Applied {len(spaces)} spaces to project",
        "total_area_m2": extraction_result.total_area_m2,
        "spaces_created": len(spaces),
    }
