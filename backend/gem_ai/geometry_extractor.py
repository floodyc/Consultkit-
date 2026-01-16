# -*- coding: utf-8 -*-
"""
GEM-AI Geometry Extractor - Web Service Version

Extracts room geometry from floorplan images for HVAC load calculations.
Adapted from GEM-AI_for_VE.py for use as a web service.
"""

from __future__ import annotations

import io
import json
import uuid
import base64
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any

import cv2
import numpy as np

# Optional PDF support
try:
    from pdf2image import convert_from_bytes
except ImportError:
    convert_from_bytes = None


@dataclass
class ExtractionParams:
    """Parameters for geometry extraction."""
    pixels_per_metre: float = 50.0
    floor_height_m: float = 3.0
    floor_z_m: float = 0.0

    min_rect_area_px: int = 500
    min_rect_width_px: int = 20
    min_rect_height_px: int = 20
    rectangularity: float = 0.55
    max_aspect_ratio: float = 10.0

    binary_threshold: int = 200
    adaptive_block_size: int = 51
    adaptive_c: int = 10
    border_margin_px: int = 30

    gap_threshold_m: float = 0.5
    overlap_threshold_m: float = 0.5

    detect_openings: bool = True


@dataclass
class DetectedOpening:
    """Detected window or door opening."""
    kind: str  # "window" or "door"
    bbox: Tuple[int, int, int, int]  # x, y, w, h in pixels
    bbox_m: Tuple[float, float, float, float]  # x, y, w, h in metres
    confidence: float
    wall_id: Optional[str] = None


@dataclass
class DetectedRoom:
    """Detected room with geometry."""
    id: str
    name: str
    x: float  # metres
    y: float  # metres
    z: float  # metres
    width: float  # metres
    depth: float  # metres
    height: float  # metres
    area_m2: float
    volume_m3: float
    original_bbox_px: Tuple[int, int, int, int]  # original pixel coordinates


@dataclass
class ExtractedGeometry:
    """Complete extracted geometry from a floorplan."""
    rooms: List[DetectedRoom] = field(default_factory=list)
    openings: List[DetectedOpening] = field(default_factory=list)
    adjacencies: List[Tuple[str, str]] = field(default_factory=list)
    total_area_m2: float = 0.0
    total_volume_m3: float = 0.0
    image_width_px: int = 0
    image_height_px: int = 0
    pixels_per_metre: float = 50.0
    floor_height_m: float = 3.0
    debug_images: Dict[str, str] = field(default_factory=dict)  # base64 encoded

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "rooms": [
                {
                    "id": r.id,
                    "name": r.name,
                    "x": r.x,
                    "y": r.y,
                    "z": r.z,
                    "width": r.width,
                    "depth": r.depth,
                    "height": r.height,
                    "area_m2": r.area_m2,
                    "volume_m3": r.volume_m3,
                }
                for r in self.rooms
            ],
            "openings": [
                {
                    "kind": o.kind,
                    "bbox_m": o.bbox_m,
                    "confidence": o.confidence,
                    "wall_id": o.wall_id,
                }
                for o in self.openings
            ],
            "adjacencies": self.adjacencies,
            "total_area_m2": self.total_area_m2,
            "total_volume_m3": self.total_volume_m3,
            "image_width_px": self.image_width_px,
            "image_height_px": self.image_height_px,
            "pixels_per_metre": self.pixels_per_metre,
            "floor_height_m": self.floor_height_m,
        }


class GeometryExtractor:
    """
    Extracts room geometry from floorplan images.

    Workflow:
    1. Load image (PNG, JPG, PDF first page)
    2. Detect room rectangles
    3. Snap shared boundaries
    4. Optionally detect openings
    5. Return structured geometry data
    """

    def __init__(self, params: Optional[ExtractionParams] = None):
        self.params = params or ExtractionParams()

    def extract_from_file(self, file_path: str) -> ExtractedGeometry:
        """Extract geometry from a file path."""
        path = Path(file_path)
        with open(path, "rb") as f:
            data = f.read()

        suffix = path.suffix.lower()
        if suffix == ".pdf":
            return self.extract_from_pdf(data)
        else:
            return self.extract_from_image(data)

    def extract_from_bytes(self, data: bytes, filename: str = "") -> ExtractedGeometry:
        """Extract geometry from raw bytes."""
        suffix = Path(filename).suffix.lower() if filename else ""
        if suffix == ".pdf":
            return self.extract_from_pdf(data)
        else:
            return self.extract_from_image(data)

    def extract_from_pdf(self, pdf_bytes: bytes, dpi: int = 300) -> ExtractedGeometry:
        """Extract geometry from PDF (first page only)."""
        if convert_from_bytes is None:
            raise RuntimeError(
                "PDF support requires pdf2image. Install with: pip install pdf2image"
            )

        images = convert_from_bytes(pdf_bytes, dpi=dpi, first_page=1, last_page=1)
        if not images:
            raise RuntimeError("PDF conversion returned no pages.")

        # Convert PIL image to OpenCV format
        img_array = np.array(images[0])
        img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

        return self._process_image(img_bgr)

    def extract_from_image(self, image_bytes: bytes) -> ExtractedGeometry:
        """Extract geometry from image bytes."""
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise RuntimeError("Failed to decode image data.")

        return self._process_image(img)

    def _process_image(self, img: np.ndarray) -> ExtractedGeometry:
        """Process an OpenCV image and extract geometry."""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        height, width = gray.shape

        result = ExtractedGeometry(
            image_width_px=width,
            image_height_px=height,
            pixels_per_metre=self.params.pixels_per_metre,
            floor_height_m=self.params.floor_height_m,
        )

        # Step 1: Detect rectangles
        spotted, debug_binary, debug_rects = self._detect_rectangles(gray)

        if not spotted:
            # Store debug images even if no rooms found
            result.debug_images["binary"] = self._encode_image(debug_binary)
            result.debug_images["rectangles"] = self._encode_image(debug_rects)
            return result

        # Step 2: Convert to metres
        rects_m = self._rectangles_px_to_m(spotted, height)

        # Step 3: Find adjacencies and eliminate gaps
        adjacent_pairs = self._find_adjacent_pairs(rects_m)
        clean_rects, adjacencies = self._eliminate_gaps(rects_m, adjacent_pairs)

        # Step 4: Create room objects
        for i, rect in enumerate(clean_rects, start=1):
            room_id = f"room-{uuid.uuid4().hex[:8]}"
            area = rect["width"] * rect["height"]
            volume = area * self.params.floor_height_m

            room = DetectedRoom(
                id=room_id,
                name=f"Room_{i:03d}",
                x=rect["x"],
                y=rect["y"],
                z=self.params.floor_z_m,
                width=rect["width"],
                depth=rect["height"],
                height=self.params.floor_height_m,
                area_m2=area,
                volume_m3=volume,
                original_bbox_px=rect.get("original_px", (0, 0, 0, 0)),
            )
            result.rooms.append(room)
            result.total_area_m2 += area
            result.total_volume_m3 += volume

        # Store adjacencies as room ID pairs
        room_ids = [r.id for r in result.rooms]
        for _, i, j, _ in adjacent_pairs:
            if i < len(room_ids) and j < len(room_ids):
                result.adjacencies.append((room_ids[i], room_ids[j]))

        # Step 5: Detect openings (experimental)
        if self.params.detect_openings:
            openings, debug_openings = self._detect_openings(gray, height)
            result.openings = openings
            if debug_openings is not None:
                result.debug_images["openings"] = self._encode_image(debug_openings)

        # Store debug images
        result.debug_images["binary"] = self._encode_image(debug_binary)
        result.debug_images["rectangles"] = self._encode_image(debug_rects)

        return result

    def _detect_rectangles(
        self, gray: np.ndarray
    ) -> Tuple[List[Dict[str, int]], np.ndarray, np.ndarray]:
        """Detect room rectangles in the grayscale image."""
        h, w = gray.shape
        p = self.params

        # Binary thresholding
        _, binary1 = cv2.threshold(gray, p.binary_threshold, 255, cv2.THRESH_BINARY_INV)
        binary2 = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C,
            cv2.THRESH_BINARY_INV, p.adaptive_block_size, p.adaptive_c
        )
        binary = cv2.bitwise_or(binary1, binary2)

        # Remove border artifacts
        border_mask = np.ones_like(binary)
        m = p.border_margin_px
        border_mask[0:m, :] = 0
        border_mask[h - m:h, :] = 0
        border_mask[:, 0:m] = 0
        border_mask[:, w - m:w] = 0
        binary = cv2.bitwise_and(binary, border_mask)

        # Light closing
        kernel = np.ones((2, 2), np.uint8)
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=1)

        debug_binary = binary.copy()

        # Find contours
        contours, hierarchy = cv2.findContours(binary, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)

        interior_contours: List[np.ndarray] = []
        if hierarchy is not None:
            for i, contour in enumerate(contours):
                if hierarchy[0][i][3] != -1:  # Interior contours only
                    interior_contours.append(contour)

        spotted: List[Dict[str, int]] = []
        debug_img = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)

        for contour in interior_contours:
            area = cv2.contourArea(contour)
            if area < p.min_rect_area_px:
                continue

            x, y, rw, rh = cv2.boundingRect(contour)
            if rw < p.min_rect_width_px or rh < p.min_rect_height_px:
                continue

            aspect = max(rw, rh) / max(1.0, min(rw, rh))
            if aspect > p.max_aspect_ratio:
                continue

            rect_area = rw * rh
            rectangularity = float(area) / float(rect_area) if rect_area > 0 else 0.0
            if rectangularity < p.rectangularity:
                cv2.rectangle(debug_img, (x, y), (x + rw, y + rh), (0, 0, 255), 1)
                continue

            epsilon = 0.05 * cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, epsilon, True)
            if len(approx) < 3 or len(approx) > 12:
                continue

            spotted.append({"x": int(x), "y": int(y), "w": int(rw), "h": int(rh)})
            cv2.rectangle(debug_img, (x, y), (x + rw, y + rh), (0, 255, 0), 2)
            cv2.putText(
                debug_img, f"#{len(spotted)}", (x + 5, y + 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 0), 1, cv2.LINE_AA
            )

        return spotted, debug_binary, debug_img

    def _rectangles_px_to_m(
        self, spotted: List[Dict[str, int]], img_height_px: int
    ) -> List[Dict[str, float]]:
        """Convert pixel coordinates to metres."""
        ppm = self.params.pixels_per_metre
        rects_m: List[Dict[str, float]] = []

        for r in spotted:
            x, y, w, h = r["x"], r["y"], r["w"], r["h"]
            y_flipped = (img_height_px - y - h) / ppm
            rects_m.append({
                "x": x / ppm,
                "y": y_flipped,
                "w": w / ppm,
                "h": h / ppm,
                "original_px": (x, y, w, h),
            })

        return rects_m

    def _find_adjacent_pairs(
        self, rectangles: List[Dict[str, float]]
    ) -> List[Tuple[str, int, int, float]]:
        """Find pairs of adjacent rectangles."""
        p = self.params
        adjacent: List[Tuple[str, int, int, float]] = []

        for i, r1 in enumerate(rectangles):
            for j, r2 in enumerate(rectangles):
                if i >= j:
                    continue

                x1, y1, w1, h1 = r1["x"], r1["y"], r1["w"], r1["h"]
                x2, y2, w2, h2 = r2["x"], r2["y"], r2["w"], r2["h"]

                # Horizontal adjacency
                if abs((x1 + w1) - x2) < p.gap_threshold_m:
                    y_overlap = min(y1 + h1, y2 + h2) - max(y1, y2)
                    if y_overlap > p.overlap_threshold_m:
                        adjacent.append(("H", i, j, (x1 + w1 + x2) / 2))

                if abs(x1 - (x2 + w2)) < p.gap_threshold_m:
                    y_overlap = min(y1 + h1, y2 + h2) - max(y1, y2)
                    if y_overlap > p.overlap_threshold_m:
                        adjacent.append(("H", i, j, (x1 + x2 + w2) / 2))

                # Vertical adjacency
                if abs((y1 + h1) - y2) < p.gap_threshold_m:
                    x_overlap = min(x1 + w1, x2 + w2) - max(x1, x2)
                    if x_overlap > p.overlap_threshold_m:
                        adjacent.append(("V", i, j, (y1 + h1 + y2) / 2))

                if abs(y1 - (y2 + h2)) < p.gap_threshold_m:
                    x_overlap = min(x1 + w1, x2 + w2) - max(x1, x2)
                    if x_overlap > p.overlap_threshold_m:
                        adjacent.append(("V", i, j, (y1 + y2 + h2) / 2))

        return adjacent

    def _eliminate_gaps(
        self,
        rectangles_m: List[Dict[str, float]],
        adjacent_pairs: List[Tuple[str, int, int, float]],
    ) -> Tuple[List[Dict[str, float]], Dict[int, Dict[str, float]]]:
        """Snap shared boundaries to eliminate gaps."""
        adjustments: Dict[int, Dict[str, float]] = {}

        for direction, i, j, shared_pos in adjacent_pairs:
            r1, r2 = rectangles_m[i], rectangles_m[j]

            if direction == "H":
                if r1["x"] < r2["x"]:
                    adjustments.setdefault(i, {})["right"] = shared_pos
                    adjustments.setdefault(j, {})["left"] = shared_pos
                else:
                    adjustments.setdefault(i, {})["left"] = shared_pos
                    adjustments.setdefault(j, {})["right"] = shared_pos
            else:
                if r1["y"] < r2["y"]:
                    adjustments.setdefault(i, {})["top"] = shared_pos
                    adjustments.setdefault(j, {})["bottom"] = shared_pos
                else:
                    adjustments.setdefault(i, {})["bottom"] = shared_pos
                    adjustments.setdefault(j, {})["top"] = shared_pos

        clean_rectangles: List[Dict[str, float]] = []
        for i, rect in enumerate(rectangles_m):
            x, y, w, h = rect["x"], rect["y"], rect["w"], rect["h"]

            if i in adjustments:
                adj = adjustments[i]
                if "left" in adj:
                    new_left = adj["left"]
                    w = (x + w) - new_left
                    x = new_left
                if "right" in adj:
                    w = adj["right"] - x
                if "bottom" in adj:
                    new_bottom = adj["bottom"]
                    h = (y + h) - new_bottom
                    y = new_bottom
                if "top" in adj:
                    h = adj["top"] - y

            clean_rectangles.append({
                "x": float(x),
                "y": float(y),
                "width": float(w),
                "height": float(h),
                "original_px": rect.get("original_px", (0, 0, 0, 0)),
            })

        return clean_rectangles, adjustments

    def _detect_openings(
        self, gray: np.ndarray, img_height_px: int
    ) -> Tuple[List[DetectedOpening], Optional[np.ndarray]]:
        """Detect window and door openings (experimental)."""
        h, w = gray.shape
        p = self.params

        try:
            _, ink = cv2.threshold(gray, p.binary_threshold, 255, cv2.THRESH_BINARY_INV)

            # Build exterior mask
            _, bw = cv2.threshold(gray, p.binary_threshold, 255, cv2.THRESH_BINARY_INV)
            bw_thick = cv2.morphologyEx(bw, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8), iterations=2)
            cnts, _ = cv2.findContours(bw_thick, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            if not cnts:
                return [], None

            cnt = max(cnts, key=cv2.contourArea)
            ext = np.zeros_like(bw_thick)
            cv2.drawContours(ext, [cnt], -1, 255, thickness=-1)

            # Create band near exterior
            band_px = 18
            k = max(3, int(band_px) | 1)
            band = cv2.dilate(ext, np.ones((k, k), np.uint8), iterations=1)
            band = cv2.subtract(band, cv2.erode(ext, np.ones((k, k), np.uint8), iterations=1))
            band01 = (band > 0).astype(np.uint8)

            # Local density map
            ink01 = (ink > 0).astype(np.uint8)
            density = cv2.blur(ink01.astype(np.float32), (9, 9))
            density_band = density * band01

            # Threshold for candidates
            cand = (density_band > 0.18).astype(np.uint8) * 255
            cand = cv2.morphologyEx(cand, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8), iterations=1)
            cand = cv2.morphologyEx(cand, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8), iterations=1)

            contours, _ = cv2.findContours(cand, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            openings: List[DetectedOpening] = []
            max_area = 0.02 * float(h * w)
            ppm = p.pixels_per_metre

            for c in contours:
                x, y, cw, ch = cv2.boundingRect(c)
                area = float(cw * ch)

                if area < 80 or area > max_area:
                    continue

                aspect = max(cw, ch) / max(1.0, min(cw, ch))

                # Convert to metres
                y_flipped = (img_height_px - y - ch) / ppm
                bbox_m = (x / ppm, y_flipped, cw / ppm, ch / ppm)

                if aspect >= 2.8:
                    kind = "window"
                    confidence = 0.55
                else:
                    kind = "door"
                    confidence = 0.35

                openings.append(DetectedOpening(
                    kind=kind,
                    bbox=(x, y, cw, ch),
                    bbox_m=bbox_m,
                    confidence=confidence,
                ))

            # Create debug image
            overlay = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
            overlay[band > 0] = (overlay[band > 0] * 0.75).astype(np.uint8)

            for d in openings:
                x, y, cw, ch = d.bbox
                color = (0, 255, 255) if d.kind == "window" else (255, 255, 0)
                cv2.rectangle(overlay, (x, y), (x + cw, y + ch), color, 2)
                cv2.putText(
                    overlay, f"{d.kind}:{d.confidence:.2f}",
                    (x, max(0, y - 6)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1, cv2.LINE_AA
                )

            return openings, overlay

        except Exception:
            return [], None

    def _encode_image(self, img: np.ndarray) -> str:
        """Encode OpenCV image to base64 PNG."""
        _, buffer = cv2.imencode(".png", img)
        return base64.b64encode(buffer).decode("utf-8")
