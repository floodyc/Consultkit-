# -*- coding: utf-8 -*-
"""
Data models for ASHRAE heat balance calculations.

These models represent the building components needed for
heating and cooling load calculations per ASHRAE Fundamentals.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Tuple, Any


class SurfaceType(Enum):
    """Types of building surfaces."""
    EXTERIOR_WALL = "exterior_wall"
    INTERIOR_WALL = "interior_wall"
    ROOF = "roof"
    CEILING = "ceiling"
    FLOOR = "floor"
    SLAB_ON_GRADE = "slab_on_grade"
    UNDERGROUND_WALL = "underground_wall"
    UNDERGROUND_FLOOR = "underground_floor"


class GlazingType(Enum):
    """Types of glazing/fenestration."""
    WINDOW = "window"
    SKYLIGHT = "skylight"
    DOOR = "door"
    CURTAIN_WALL = "curtain_wall"


class SpaceType(Enum):
    """Space use types with default load values."""
    OFFICE_ENCLOSED = "office_enclosed"
    OFFICE_OPEN_PLAN = "office_open_plan"
    CONFERENCE_ROOM = "conference_room"
    LOBBY = "lobby"
    CORRIDOR = "corridor"
    RESTROOM = "restroom"
    STORAGE = "storage"
    MECHANICAL = "mechanical"
    CLASSROOM = "classroom"
    AUDITORIUM = "auditorium"
    RETAIL = "retail"
    RESTAURANT = "restaurant"
    KITCHEN = "kitchen"
    LABORATORY = "laboratory"
    HOSPITAL_PATIENT = "hospital_patient"
    HOSPITAL_EXAM = "hospital_exam"
    RESIDENTIAL = "residential"
    WAREHOUSE = "warehouse"
    MANUFACTURING = "manufacturing"
    DATA_CENTER = "data_center"
    CUSTOM = "custom"


@dataclass
class Material:
    """Building material thermal properties."""
    id: str = field(default_factory=lambda: f"mat-{uuid.uuid4().hex[:8]}")
    name: str = ""
    conductivity: float = 1.0  # W/(m·K)
    density: float = 2000.0  # kg/m³
    specific_heat: float = 1000.0  # J/(kg·K)
    thickness: float = 0.1  # m
    roughness: str = "medium_rough"  # for convection coefficient

    @property
    def resistance(self) -> float:
        """Thermal resistance R-value (m²·K/W)."""
        if self.conductivity > 0:
            return self.thickness / self.conductivity
        return 0.0

    @property
    def thermal_mass(self) -> float:
        """Thermal mass per unit area (J/(m²·K))."""
        return self.density * self.specific_heat * self.thickness


@dataclass
class Construction:
    """Multi-layer construction assembly."""
    id: str = field(default_factory=lambda: f"con-{uuid.uuid4().hex[:8]}")
    name: str = ""
    layers: List[Material] = field(default_factory=list)
    inside_film_resistance: float = 0.12  # m²·K/W (vertical surface)
    outside_film_resistance: float = 0.03  # m²·K/W

    @property
    def total_resistance(self) -> float:
        """Total R-value including air films (m²·K/W)."""
        r_total = self.inside_film_resistance + self.outside_film_resistance
        for layer in self.layers:
            r_total += layer.resistance
        return r_total

    @property
    def u_value(self) -> float:
        """Overall U-value (W/(m²·K))."""
        r_total = self.total_resistance
        if r_total > 0:
            return 1.0 / r_total
        return 0.0

    @property
    def total_thickness(self) -> float:
        """Total construction thickness (m)."""
        return sum(layer.thickness for layer in self.layers)


@dataclass
class Glazing:
    """Glazing/fenestration properties."""
    id: str = field(default_factory=lambda: f"glz-{uuid.uuid4().hex[:8]}")
    name: str = "Double Clear"
    glazing_type: GlazingType = GlazingType.WINDOW
    u_value: float = 2.8  # W/(m²·K)
    shgc: float = 0.7  # Solar Heat Gain Coefficient
    vt: float = 0.75  # Visible Transmittance
    frame_u_value: float = 3.5  # W/(m²·K)
    frame_fraction: float = 0.15  # Frame area / total window area
    interior_shade_multiplier: float = 1.0
    exterior_shade_multiplier: float = 1.0

    @property
    def assembly_u_value(self) -> float:
        """Combined glazing + frame U-value."""
        return (
            self.u_value * (1 - self.frame_fraction) +
            self.frame_u_value * self.frame_fraction
        )


@dataclass
class Surface:
    """Building surface (wall, floor, roof, etc.)."""
    id: str = field(default_factory=lambda: f"srf-{uuid.uuid4().hex[:8]}")
    name: str = ""
    surface_type: SurfaceType = SurfaceType.EXTERIOR_WALL
    area: float = 0.0  # m²
    azimuth: float = 0.0  # degrees (0=North, 90=East, 180=South, 270=West)
    tilt: float = 90.0  # degrees (0=horizontal ceiling, 90=vertical, 180=floor)
    construction: Optional[Construction] = None
    adjacent_space_id: Optional[str] = None  # For interior surfaces
    adjacent_condition: str = "outdoor"  # outdoor, ground, adiabatic, space

    # Vertices for geometry (optional)
    vertices: List[Tuple[float, float, float]] = field(default_factory=list)


@dataclass
class Fenestration:
    """Window, door, or skylight in a surface."""
    id: str = field(default_factory=lambda: f"fen-{uuid.uuid4().hex[:8]}")
    name: str = ""
    parent_surface_id: str = ""
    glazing: Optional[Glazing] = None
    area: float = 0.0  # m²
    height: float = 1.5  # m
    width: float = 1.2  # m
    sill_height: float = 0.9  # m (from floor)

    # Shading
    overhang_depth: float = 0.0  # m
    overhang_offset: float = 0.0  # m above window
    left_fin_depth: float = 0.0  # m
    right_fin_depth: float = 0.0  # m


@dataclass
class InternalLoad:
    """Internal heat gains."""
    id: str = field(default_factory=lambda: f"int-{uuid.uuid4().hex[:8]}")
    name: str = ""

    # People
    people_count: float = 0.0
    people_per_area: float = 0.0  # people/m²
    activity_level: float = 120.0  # W/person (sensible + latent)
    sensible_fraction: float = 0.6
    radiant_fraction: float = 0.3  # of sensible
    people_schedule_id: Optional[str] = None

    # Lighting
    lighting_power_density: float = 10.0  # W/m²
    lighting_radiant_fraction: float = 0.37
    lighting_visible_fraction: float = 0.18
    lighting_schedule_id: Optional[str] = None

    # Equipment
    equipment_power_density: float = 10.0  # W/m²
    equipment_radiant_fraction: float = 0.3
    equipment_latent_fraction: float = 0.0
    equipment_schedule_id: Optional[str] = None


@dataclass
class Infiltration:
    """Air infiltration parameters."""
    id: str = field(default_factory=lambda: f"inf-{uuid.uuid4().hex[:8]}")
    name: str = ""

    # Calculation method
    method: str = "air_changes"  # air_changes, flow_per_area, flow_per_zone

    # Values
    air_changes_per_hour: float = 0.3  # ACH
    flow_per_exterior_area: float = 0.0003  # m³/(s·m²)
    flow_per_zone: float = 0.0  # m³/s

    schedule_id: Optional[str] = None


@dataclass
class Ventilation:
    """Mechanical ventilation requirements."""
    id: str = field(default_factory=lambda: f"ven-{uuid.uuid4().hex[:8]}")
    name: str = ""

    # ASHRAE 62.1 values
    outdoor_air_per_person: float = 0.0025  # m³/(s·person) = 2.5 L/s
    outdoor_air_per_area: float = 0.0003  # m³/(s·m²) = 0.3 L/(s·m²)

    # Alternative: total flow
    total_outdoor_air: float = 0.0  # m³/s (if specified, overrides per-person/area)

    schedule_id: Optional[str] = None

    # Heat recovery
    heat_recovery_effectiveness: float = 0.0
    sensible_effectiveness: float = 0.0
    latent_effectiveness: float = 0.0


@dataclass
class Schedule:
    """Time-based schedule for loads and operations."""
    id: str = field(default_factory=lambda: f"sch-{uuid.uuid4().hex[:8]}")
    name: str = ""
    schedule_type: str = "fraction"  # fraction, temperature, on_off

    # 24-hour profile (hourly values 0-23)
    weekday_values: List[float] = field(default_factory=lambda: [1.0] * 24)
    weekend_values: List[float] = field(default_factory=lambda: [0.5] * 24)
    holiday_values: List[float] = field(default_factory=lambda: [0.0] * 24)

    def get_value(self, hour: int, day_type: str = "weekday") -> float:
        """Get schedule value for given hour and day type."""
        hour = hour % 24
        if day_type == "weekend":
            return self.weekend_values[hour]
        elif day_type == "holiday":
            return self.holiday_values[hour]
        return self.weekday_values[hour]


@dataclass
class Space:
    """A room/space in the building."""
    id: str = field(default_factory=lambda: f"space-{uuid.uuid4().hex[:8]}")
    name: str = ""
    space_type: SpaceType = SpaceType.OFFICE_ENCLOSED

    # Geometry
    floor_area: float = 0.0  # m²
    volume: float = 0.0  # m³
    height: float = 3.0  # m
    x: float = 0.0  # m (origin)
    y: float = 0.0  # m
    z: float = 0.0  # m

    # Components
    surfaces: List[Surface] = field(default_factory=list)
    fenestrations: List[Fenestration] = field(default_factory=list)

    # Loads
    internal_load: Optional[InternalLoad] = None
    infiltration: Optional[Infiltration] = None
    ventilation: Optional[Ventilation] = None

    # Design conditions
    cooling_setpoint: float = 24.0  # °C
    heating_setpoint: float = 21.0  # °C
    humidity_setpoint: float = 50.0  # % RH

    # Multiplier for repeated spaces
    multiplier: int = 1

    zone_id: Optional[str] = None  # Assigned zone


@dataclass
class Zone:
    """HVAC zone grouping multiple spaces."""
    id: str = field(default_factory=lambda: f"zone-{uuid.uuid4().hex[:8]}")
    name: str = ""
    space_ids: List[str] = field(default_factory=list)

    # Design conditions (can override space values)
    cooling_setpoint: float = 24.0  # °C
    heating_setpoint: float = 21.0  # °C
    humidity_setpoint: float = 50.0  # % RH

    # Sizing factors
    cooling_sizing_factor: float = 1.15
    heating_sizing_factor: float = 1.25

    system_id: Optional[str] = None  # Assigned system


@dataclass
class System:
    """HVAC system serving zones."""
    id: str = field(default_factory=lambda: f"sys-{uuid.uuid4().hex[:8]}")
    name: str = ""
    system_type: str = "vav"  # vav, cav, fan_coil, ptac, split, vrf, etc.

    zone_ids: List[str] = field(default_factory=list)

    # Supply air conditions
    cooling_supply_air_temp: float = 13.0  # °C
    heating_supply_air_temp: float = 35.0  # °C
    supply_air_humidity: float = 90.0  # % RH (at cooling coil)

    # Fan parameters
    fan_efficiency: float = 0.7
    fan_pressure_rise: float = 1000.0  # Pa
    fan_motor_efficiency: float = 0.9
    fan_motor_in_airstream: bool = True

    # Sizing
    sizing_method: str = "coincident"  # coincident, non_coincident
    cooling_sizing_factor: float = 1.1
    heating_sizing_factor: float = 1.1

    plant_loop_id: Optional[str] = None


@dataclass
class Plant:
    """Central plant equipment."""
    id: str = field(default_factory=lambda: f"plant-{uuid.uuid4().hex[:8]}")
    name: str = ""
    plant_type: str = "chiller_boiler"  # chiller_boiler, heat_pump, district, etc.

    system_ids: List[str] = field(default_factory=list)

    # Chiller
    chiller_type: str = "water_cooled_centrifugal"
    chiller_cop: float = 6.0
    chilled_water_temp: float = 7.0  # °C

    # Boiler
    boiler_type: str = "hot_water"
    boiler_efficiency: float = 0.85
    hot_water_temp: float = 82.0  # °C

    # Cooling tower
    tower_type: str = "open"
    tower_approach: float = 4.0  # °C

    # Pumps
    chw_pump_head: float = 150.0  # kPa
    hw_pump_head: float = 100.0  # kPa
    cw_pump_head: float = 200.0  # kPa
    pump_efficiency: float = 0.7

    # Sizing factors
    cooling_sizing_factor: float = 1.1
    heating_sizing_factor: float = 1.1


@dataclass
class DesignDay:
    """Design day weather conditions."""
    id: str = field(default_factory=lambda: f"dd-{uuid.uuid4().hex[:8]}")
    name: str = ""
    day_type: str = "cooling"  # cooling, heating

    # ASHRAE design conditions
    month: int = 7  # 1-12
    day: int = 21  # 1-31

    # Temperature
    dry_bulb_max: float = 35.0  # °C
    dry_bulb_min: float = 24.0  # °C (for cooling) or same as max for heating
    daily_range: float = 11.0  # °C
    dry_bulb_range_modifier: str = "default"  # ASHRAE profile

    # Humidity
    wet_bulb_coincident: float = 24.0  # °C
    humidity_type: str = "wet_bulb"  # wet_bulb, dew_point, humidity_ratio
    humidity_value: float = 24.0  # Value depends on humidity_type

    # Solar
    clearness: float = 1.0
    solar_model: str = "ashrae_clear_sky"  # ashrae_clear_sky, ashrae_tau

    # Wind
    wind_speed: float = 4.0  # m/s
    wind_direction: float = 270.0  # degrees from North

    # Pressure
    barometric_pressure: float = 101325.0  # Pa


@dataclass
class WeatherData:
    """Weather data for load calculations."""
    id: str = field(default_factory=lambda: f"wthr-{uuid.uuid4().hex[:8]}")
    name: str = ""

    # Location
    city: str = ""
    state: str = ""
    country: str = ""
    latitude: float = 0.0
    longitude: float = 0.0
    elevation: float = 0.0  # m
    timezone: float = 0.0  # hours from UTC

    # Design days
    cooling_design_days: List[DesignDay] = field(default_factory=list)
    heating_design_days: List[DesignDay] = field(default_factory=list)

    # Monthly design data (optional, for intermediate calculations)
    monthly_dry_bulb_mean: List[float] = field(default_factory=lambda: [20.0] * 12)
    monthly_ground_temp: List[float] = field(default_factory=lambda: [15.0] * 12)

    # ASHRAE climatic design conditions
    cooling_db_004: float = 35.0  # 0.4% annual cooling design DB
    cooling_wb_004: float = 24.0  # 0.4% annual cooling design WB
    cooling_dp_004: float = 22.0  # 0.4% annual cooling design DP
    heating_db_996: float = -15.0  # 99.6% annual heating design DB
    heating_wind_996: float = 5.0  # 99.6% annual heating wind speed


@dataclass
class Building:
    """Complete building model."""
    id: str = field(default_factory=lambda: f"bldg-{uuid.uuid4().hex[:8]}")
    name: str = ""
    building_type: str = "office"

    # Location
    address: str = ""
    weather_data: Optional[WeatherData] = None
    orientation: float = 0.0  # degrees (rotation from true North)

    # Components
    spaces: List[Space] = field(default_factory=list)
    zones: List[Zone] = field(default_factory=list)
    systems: List[System] = field(default_factory=list)
    plants: List[Plant] = field(default_factory=list)

    # Libraries
    constructions: Dict[str, Construction] = field(default_factory=dict)
    glazings: Dict[str, Glazing] = field(default_factory=dict)
    schedules: Dict[str, Schedule] = field(default_factory=dict)

    # Metadata
    created_at: datetime = field(default_factory=datetime.utcnow)
    modified_at: datetime = field(default_factory=datetime.utcnow)

    @property
    def total_floor_area(self) -> float:
        """Total conditioned floor area."""
        return sum(s.floor_area * s.multiplier for s in self.spaces)

    @property
    def total_volume(self) -> float:
        """Total conditioned volume."""
        return sum(s.volume * s.multiplier for s in self.spaces)


@dataclass
class Project:
    """Top-level project containing building and settings."""
    id: str = field(default_factory=lambda: f"proj-{uuid.uuid4().hex[:8]}")
    name: str = ""
    description: str = ""
    client: str = ""
    engineer: str = ""
    project_number: str = ""

    building: Optional[Building] = None

    # Calculation settings
    calculation_method: str = "heat_balance"  # heat_balance, rts
    timestep_minutes: int = 60  # 60, 30, 15, etc.

    # Units
    unit_system: str = "SI"  # SI, IP

    # Safety factors
    cooling_safety_factor: float = 1.1
    heating_safety_factor: float = 1.1

    # Metadata
    created_at: datetime = field(default_factory=datetime.utcnow)
    modified_at: datetime = field(default_factory=datetime.utcnow)
    calculated_at: Optional[datetime] = None

    # User
    user_id: Optional[str] = None
    organization_id: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "client": self.client,
            "engineer": self.engineer,
            "project_number": self.project_number,
            "calculation_method": self.calculation_method,
            "unit_system": self.unit_system,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "modified_at": self.modified_at.isoformat() if self.modified_at else None,
            "calculated_at": self.calculated_at.isoformat() if self.calculated_at else None,
        }
