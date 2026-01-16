# -*- coding: utf-8 -*-
"""
gbXML Writer for GEM-AI geometry export.
Generates gbXML files compatible with IESVE and other BEM tools.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any

from .geometry_extractor import ExtractedGeometry, DetectedRoom


@dataclass
class Location:
    """Building location for gbXML."""
    longitude: float = -123.1207
    latitude: float = 49.2827
    elevation: float = 70.0
    timezone: float = -8.0
    city: str = "Vancouver"
    state: str = "BC"
    country: str = "Canada"


@dataclass
class Surface:
    """Building surface for gbXML."""
    id: str
    name: str
    surface_type: str
    adjacent_space_id: str
    adjacent_space_id_2: Optional[str] = None
    tilt: float = 0.0
    azimuth: float = 0.0
    points: List[Tuple[float, float, float]] = None
    area: float = 0.0
    exposed_to_sun: bool = False

    def __post_init__(self):
        if self.points is None:
            self.points = []


class GbXMLWriter:
    """
    Generates gbXML files from extracted geometry.

    The gbXML format is used for building energy modeling and
    can be imported into tools like IESVE, EnergyPlus, etc.
    """

    def __init__(
        self,
        building_name: str = "Building",
        location: Optional[Location] = None,
    ):
        self.building_name = building_name
        self.building_id = f"bldg-{uuid.uuid4().hex[:8]}"
        self.campus_id = f"campus-{uuid.uuid4().hex[:8]}"
        self.location = location or Location()
        self.storeys: List[Dict] = []
        self.spaces: List[Dict] = []
        self.surfaces: List[Surface] = []

    def add_storey(
        self,
        storey_id: str,
        name: str,
        level: float = 0.0,
    ) -> str:
        """Add a building storey/floor."""
        self.storeys.append({
            "id": storey_id,
            "name": name,
            "level": level,
        })
        return storey_id

    def add_space(
        self,
        space_id: str,
        name: str,
        x: float,
        y: float,
        z: float,
        width: float,
        depth: float,
        height: float,
        storey_id: Optional[str] = None,
        space_type: str = "Office",
    ) -> None:
        """Add a space (room) to the building."""
        self.spaces.append({
            "id": space_id,
            "name": name,
            "x": x,
            "y": y,
            "z": z,
            "width": width,
            "depth": depth,
            "height": height,
            "area": width * depth,
            "volume": width * depth * height,
            "storey_id": storey_id or (self.storeys[0]["id"] if self.storeys else None),
            "space_type": space_type,
        })

    def from_extracted_geometry(
        self,
        geometry: ExtractedGeometry,
        storey_name: str = "Ground Floor",
        space_type: str = "Office",
    ) -> None:
        """Populate from ExtractedGeometry object."""
        # Add default storey if needed
        if not self.storeys:
            storey_id = f"storey-{uuid.uuid4().hex[:8]}"
            self.add_storey(storey_id, storey_name, level=0.0)
        else:
            storey_id = self.storeys[0]["id"]

        # Add spaces from rooms
        for room in geometry.rooms:
            self.add_space(
                space_id=room.id,
                name=room.name,
                x=room.x,
                y=room.y,
                z=room.z,
                width=room.width,
                depth=room.depth,
                height=room.height,
                storey_id=storey_id,
                space_type=space_type,
            )

    def _generate_surfaces_for_space(self, space: Dict) -> List[Surface]:
        """Generate floor, ceiling, and wall surfaces for a space."""
        surfaces: List[Surface] = []
        x, y, z = space["x"], space["y"], space["z"]
        w, d, h = space["width"], space["depth"], space["height"]
        sid = space["id"]
        name = space["name"]

        # Floor
        floor_type = "SlabOnGrade" if z == 0 else "InteriorFloor"
        surfaces.append(Surface(
            id=f"{sid}-floor",
            name=f"{name}_Floor",
            surface_type=floor_type,
            adjacent_space_id=sid,
            tilt=180.0,
            azimuth=0.0,
            points=[(x, y, z), (x + w, y, z), (x + w, y + d, z), (x, y + d, z)],
            area=w * d,
            exposed_to_sun=False,
        ))

        # Ceiling/Roof
        surfaces.append(Surface(
            id=f"{sid}-ceiling",
            name=f"{name}_Ceiling",
            surface_type="Roof",
            adjacent_space_id=sid,
            tilt=0.0,
            azimuth=0.0,
            points=[(x, y, z + h), (x, y + d, z + h), (x + w, y + d, z + h), (x + w, y, z + h)],
            area=w * d,
            exposed_to_sun=True,
        ))

        # Walls (South, North, East, West)
        walls = [
            (f"{sid}-wall-south", f"{name}_Wall_South", 180.0,
             [(x, y, z), (x + w, y, z), (x + w, y, z + h), (x, y, z + h)]),
            (f"{sid}-wall-north", f"{name}_Wall_North", 0.0,
             [(x + w, y + d, z), (x, y + d, z), (x, y + d, z + h), (x + w, y + d, z + h)]),
            (f"{sid}-wall-east", f"{name}_Wall_East", 90.0,
             [(x + w, y, z), (x + w, y + d, z), (x + w, y + d, z + h), (x + w, y, z + h)]),
            (f"{sid}-wall-west", f"{name}_Wall_West", 270.0,
             [(x, y + d, z), (x, y, z), (x, y, z + h), (x, y + d, z + h)]),
        ]

        for wall_id, wall_name, azimuth, points in walls:
            # Calculate wall area
            if azimuth in [0.0, 180.0]:
                wall_area = w * h
            else:
                wall_area = d * h

            surfaces.append(Surface(
                id=wall_id,
                name=wall_name,
                surface_type="ExteriorWall",
                adjacent_space_id=sid,
                tilt=90.0,
                azimuth=azimuth,
                points=points,
                area=wall_area,
                exposed_to_sun=True,
            ))

        return surfaces

    def _detect_shared_walls(self) -> List[Surface]:
        """Detect and convert shared exterior walls to interior walls."""
        all_surfaces: List[Surface] = []
        for space in self.spaces:
            all_surfaces.extend(self._generate_surfaces_for_space(space))

        # Check for coincident walls
        for i, s1 in enumerate(all_surfaces):
            if "wall" not in s1.id.lower() or s1.surface_type == "InteriorWall":
                continue

            for j, s2 in enumerate(all_surfaces):
                if i >= j:
                    continue
                if "wall" not in s2.id.lower():
                    continue
                if s1.adjacent_space_id == s2.adjacent_space_id:
                    continue

                # Check if walls are opposing (180° apart)
                az_diff = abs(s1.azimuth - s2.azimuth)
                if az_diff != 180:
                    continue

                # Check if walls are coincident
                p1, p2 = s1.points, s2.points
                if s1.azimuth in [0, 180]:
                    fixed1 = p1[0][1] if p1 else 0
                    fixed2 = p2[0][1] if p2 else 0
                else:
                    fixed1 = p1[0][0] if p1 else 0
                    fixed2 = p2[0][0] if p2 else 0

                if abs(fixed1 - fixed2) < 0.1:
                    s1.surface_type = "InteriorWall"
                    s2.surface_type = "InteriorWall"
                    s1.adjacent_space_id_2 = s2.adjacent_space_id
                    s2.adjacent_space_id_2 = s1.adjacent_space_id
                    s1.exposed_to_sun = False
                    s2.exposed_to_sun = False

        return all_surfaces

    def _format_polyloop(self, points: List[Tuple[float, float, float]], indent: int = 10) -> str:
        """Format a PolyLoop element for gbXML."""
        pad = " " * indent
        lines = [f"{pad}<PolyLoop>"]
        for x, y, z in points:
            lines.append(f"{pad}  <CartesianPoint>")
            lines.append(f"{pad}    <Coordinate>{x:.6f}</Coordinate>")
            lines.append(f"{pad}    <Coordinate>{y:.6f}</Coordinate>")
            lines.append(f"{pad}    <Coordinate>{z:.6f}</Coordinate>")
            lines.append(f"{pad}  </CartesianPoint>")
        lines.append(f"{pad}</PolyLoop>")
        return "\n".join(lines)

    def generate(self) -> str:
        """Generate the complete gbXML document."""
        all_surfaces = self._detect_shared_walls()

        xml: List[str] = []
        xml.append('<?xml version="1.0" encoding="UTF-8"?>')
        xml.append('<gbXML xmlns="http://www.gbxml.org/schema"')
        xml.append('       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"')
        xml.append('       xsi:schemaLocation="http://www.gbxml.org/schema http://www.gbxml.org/schema/6-01/GreenBuildingXML_Ver6.01.xsd"')
        xml.append('       temperatureUnit="C" lengthUnit="Meters" areaUnit="SquareMeters"')
        xml.append('       volumeUnit="CubicMeters" useSIUnitsForResults="true" version="6.01">')

        # Campus and Location
        xml.append(f'  <Campus id="{self.campus_id}">')
        xml.append(f'    <Name>{self.building_name}</Name>')
        xml.append('    <Location>')
        xml.append(f'      <Longitude>{self.location.longitude}</Longitude>')
        xml.append(f'      <Latitude>{self.location.latitude}</Latitude>')
        xml.append(f'      <Elevation>{self.location.elevation}</Elevation>')
        if self.location.city:
            xml.append(f'      <City>{self.location.city}</City>')
        if self.location.state:
            xml.append(f'      <State>{self.location.state}</State>')
        if self.location.country:
            xml.append(f'      <Country>{self.location.country}</Country>')
        xml.append('    </Location>')

        # Building
        xml.append(f'    <Building id="{self.building_id}" buildingType="Office">')
        xml.append(f'      <Name>{self.building_name}</Name>')
        total_area = sum(s["area"] for s in self.spaces)
        xml.append(f'      <Area>{total_area:.2f}</Area>')

        # Building Storeys
        for storey in self.storeys:
            xml.append(f'      <BuildingStorey id="{storey["id"]}">')
            xml.append(f'        <Name>{storey["name"]}</Name>')
            xml.append(f'        <Level>{storey["level"]:.2f}</Level>')
            xml.append('      </BuildingStorey>')

        # Spaces
        for space in self.spaces:
            storey_ref = f' buildingStoreyIdRef="{space["storey_id"]}"' if space["storey_id"] else ""
            xml.append(f'      <Space id="{space["id"]}"{storey_ref}>')
            xml.append(f'        <Name>{space["name"]}</Name>')
            xml.append(f'        <Area>{space["area"]:.2f}</Area>')
            xml.append(f'        <Volume>{space["volume"]:.2f}</Volume>')

            # Shell geometry
            x, y, z = space["x"], space["y"], space["z"]
            w, d, h = space["width"], space["depth"], space["height"]

            xml.append(f'        <ShellGeometry id="{space["id"]}-shell">')
            xml.append('          <ClosedShell>')

            # Floor
            xml.append(self._format_polyloop([
                (x, y, z), (x + w, y, z), (x + w, y + d, z), (x, y + d, z)
            ], 12))
            # Ceiling
            xml.append(self._format_polyloop([
                (x, y, z + h), (x, y + d, z + h), (x + w, y + d, z + h), (x + w, y, z + h)
            ], 12))
            # South wall
            xml.append(self._format_polyloop([
                (x, y, z), (x + w, y, z), (x + w, y, z + h), (x, y, z + h)
            ], 12))
            # North wall
            xml.append(self._format_polyloop([
                (x + w, y + d, z), (x, y + d, z), (x, y + d, z + h), (x + w, y + d, z + h)
            ], 12))
            # East wall
            xml.append(self._format_polyloop([
                (x + w, y, z), (x + w, y + d, z), (x + w, y + d, z + h), (x + w, y, z + h)
            ], 12))
            # West wall
            xml.append(self._format_polyloop([
                (x, y + d, z), (x, y, z), (x, y, z + h), (x, y + d, z + h)
            ], 12))

            xml.append('          </ClosedShell>')
            xml.append('        </ShellGeometry>')
            xml.append('      </Space>')

        xml.append('    </Building>')
        xml.append('  </Campus>')

        # Surfaces
        for surf in all_surfaces:
            expose = "true" if surf.exposed_to_sun else "false"
            xml.append(f'  <Surface id="{surf.id}" surfaceType="{surf.surface_type}" exposedToSun="{expose}">')
            xml.append(f'    <Name>{surf.name}</Name>')
            xml.append(f'    <AdjacentSpaceId spaceIdRef="{surf.adjacent_space_id}"/>')
            if surf.adjacent_space_id_2:
                xml.append(f'    <AdjacentSpaceId spaceIdRef="{surf.adjacent_space_id_2}"/>')
            xml.append('    <PlanarGeometry>')
            xml.append(self._format_polyloop(surf.points, 6))
            xml.append('    </PlanarGeometry>')
            xml.append('  </Surface>')

        xml.append('</gbXML>')
        return "\n".join(xml)

    def save(self, filename: str | Path) -> Path:
        """Save gbXML to file."""
        path = Path(filename)
        path.write_text(self.generate(), encoding="utf-8")
        return path

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "building_name": self.building_name,
            "building_id": self.building_id,
            "location": {
                "longitude": self.location.longitude,
                "latitude": self.location.latitude,
                "elevation": self.location.elevation,
                "city": self.location.city,
                "country": self.location.country,
            },
            "storeys": self.storeys,
            "spaces": self.spaces,
            "total_area_m2": sum(s["area"] for s in self.spaces),
            "total_volume_m3": sum(s["volume"] for s in self.spaces),
        }
