# -*- coding: utf-8 -*-
"""
Result models for ASHRAE load calculation outputs.

Provides structured results at space, zone, system, and plant levels
suitable for professional HVAC engineering reports.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any


@dataclass
class LoadComponent:
    """Individual load component breakdown."""
    name: str
    sensible_cooling: float = 0.0  # W
    latent_cooling: float = 0.0  # W
    total_cooling: float = 0.0  # W
    sensible_heating: float = 0.0  # W
    description: str = ""

    def __post_init__(self):
        if self.total_cooling == 0.0:
            self.total_cooling = self.sensible_cooling + self.latent_cooling


@dataclass
class HourlyLoadProfile:
    """Hourly load profile for 24 hours."""
    hours: List[int] = field(default_factory=lambda: list(range(24)))
    sensible_cooling: List[float] = field(default_factory=lambda: [0.0] * 24)
    latent_cooling: List[float] = field(default_factory=lambda: [0.0] * 24)
    total_cooling: List[float] = field(default_factory=lambda: [0.0] * 24)
    sensible_heating: List[float] = field(default_factory=lambda: [0.0] * 24)
    outdoor_temp: List[float] = field(default_factory=lambda: [20.0] * 24)

    @property
    def peak_cooling_hour(self) -> int:
        """Hour of peak cooling load."""
        return self.total_cooling.index(max(self.total_cooling))

    @property
    def peak_heating_hour(self) -> int:
        """Hour of peak heating load."""
        return self.sensible_heating.index(max(self.sensible_heating))


@dataclass
class PeakLoadSummary:
    """Peak load summary."""
    peak_sensible_cooling: float = 0.0  # W
    peak_latent_cooling: float = 0.0  # W
    peak_total_cooling: float = 0.0  # W
    peak_sensible_heating: float = 0.0  # W

    peak_cooling_month: int = 7
    peak_cooling_day: int = 21
    peak_cooling_hour: int = 15

    peak_heating_month: int = 1
    peak_heating_day: int = 21
    peak_heating_hour: int = 7

    outdoor_temp_at_cooling_peak: float = 35.0  # °C
    outdoor_temp_at_heating_peak: float = -15.0  # °C

    # Per unit area
    cooling_w_per_m2: float = 0.0
    heating_w_per_m2: float = 0.0


@dataclass
class SpaceLoadResult:
    """Detailed load calculation results for a single space."""
    space_id: str
    space_name: str

    # Geometry
    floor_area: float = 0.0  # m²
    volume: float = 0.0  # m³
    exterior_wall_area: float = 0.0  # m²
    window_area: float = 0.0  # m²
    roof_area: float = 0.0  # m²

    # Peak loads
    peak_summary: PeakLoadSummary = field(default_factory=PeakLoadSummary)

    # Load components
    components: Dict[str, LoadComponent] = field(default_factory=dict)

    # Hourly profiles
    cooling_design_day_profile: HourlyLoadProfile = field(default_factory=HourlyLoadProfile)
    heating_design_day_profile: HourlyLoadProfile = field(default_factory=HourlyLoadProfile)

    # Airflow requirements
    supply_airflow_cooling: float = 0.0  # m³/s
    supply_airflow_heating: float = 0.0  # m³/s
    outdoor_airflow: float = 0.0  # m³/s
    exhaust_airflow: float = 0.0  # m³/s

    # Psychrometrics
    room_sensible_heat_ratio: float = 0.0
    apparatus_dew_point: float = 0.0  # °C
    bypass_factor: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON/report generation."""
        return {
            "space_id": self.space_id,
            "space_name": self.space_name,
            "geometry": {
                "floor_area_m2": self.floor_area,
                "volume_m3": self.volume,
                "exterior_wall_area_m2": self.exterior_wall_area,
                "window_area_m2": self.window_area,
                "roof_area_m2": self.roof_area,
            },
            "peak_cooling": {
                "sensible_w": self.peak_summary.peak_sensible_cooling,
                "latent_w": self.peak_summary.peak_latent_cooling,
                "total_w": self.peak_summary.peak_total_cooling,
                "w_per_m2": self.peak_summary.cooling_w_per_m2,
                "month": self.peak_summary.peak_cooling_month,
                "hour": self.peak_summary.peak_cooling_hour,
                "outdoor_temp_c": self.peak_summary.outdoor_temp_at_cooling_peak,
            },
            "peak_heating": {
                "sensible_w": self.peak_summary.peak_sensible_heating,
                "w_per_m2": self.peak_summary.heating_w_per_m2,
                "month": self.peak_summary.peak_heating_month,
                "hour": self.peak_summary.peak_heating_hour,
                "outdoor_temp_c": self.peak_summary.outdoor_temp_at_heating_peak,
            },
            "components": {
                name: {
                    "sensible_cooling_w": comp.sensible_cooling,
                    "latent_cooling_w": comp.latent_cooling,
                    "total_cooling_w": comp.total_cooling,
                    "sensible_heating_w": comp.sensible_heating,
                }
                for name, comp in self.components.items()
            },
            "airflow": {
                "supply_cooling_m3s": self.supply_airflow_cooling,
                "supply_heating_m3s": self.supply_airflow_heating,
                "outdoor_air_m3s": self.outdoor_airflow,
            },
        }


@dataclass
class ZoneLoadResult:
    """Aggregated load results for an HVAC zone."""
    zone_id: str
    zone_name: str

    # Constituent spaces
    space_ids: List[str] = field(default_factory=list)
    space_results: List[SpaceLoadResult] = field(default_factory=list)

    # Geometry totals
    total_floor_area: float = 0.0  # m²
    total_volume: float = 0.0  # m³

    # Peak loads (can differ from sum of spaces due to diversity)
    peak_summary: PeakLoadSummary = field(default_factory=PeakLoadSummary)

    # Diversity factors applied
    cooling_diversity_factor: float = 1.0
    heating_diversity_factor: float = 1.0

    # Sizing factors applied
    cooling_sizing_factor: float = 1.15
    heating_sizing_factor: float = 1.25

    # Sized loads (after factors)
    sized_cooling_load: float = 0.0  # W
    sized_heating_load: float = 0.0  # W

    # Airflow
    zone_supply_airflow: float = 0.0  # m³/s
    zone_outdoor_airflow: float = 0.0  # m³/s

    # Hourly profile
    hourly_profile: HourlyLoadProfile = field(default_factory=HourlyLoadProfile)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "zone_id": self.zone_id,
            "zone_name": self.zone_name,
            "space_ids": self.space_ids,
            "geometry": {
                "total_floor_area_m2": self.total_floor_area,
                "total_volume_m3": self.total_volume,
            },
            "peak_cooling": {
                "calculated_w": self.peak_summary.peak_total_cooling,
                "sized_w": self.sized_cooling_load,
                "diversity_factor": self.cooling_diversity_factor,
                "sizing_factor": self.cooling_sizing_factor,
            },
            "peak_heating": {
                "calculated_w": self.peak_summary.peak_sensible_heating,
                "sized_w": self.sized_heating_load,
                "diversity_factor": self.heating_diversity_factor,
                "sizing_factor": self.heating_sizing_factor,
            },
            "airflow": {
                "supply_m3s": self.zone_supply_airflow,
                "outdoor_air_m3s": self.zone_outdoor_airflow,
            },
        }


@dataclass
class SystemLoadResult:
    """Load results for an HVAC system."""
    system_id: str
    system_name: str
    system_type: str

    # Served zones
    zone_ids: List[str] = field(default_factory=list)
    zone_results: List[ZoneLoadResult] = field(default_factory=list)

    # Geometry totals
    total_floor_area: float = 0.0  # m²

    # Block loads (coincident or non-coincident)
    block_cooling_sensible: float = 0.0  # W
    block_cooling_latent: float = 0.0  # W
    block_cooling_total: float = 0.0  # W
    block_heating: float = 0.0  # W

    # Sum of zone peaks (non-coincident)
    sum_zone_cooling: float = 0.0  # W
    sum_zone_heating: float = 0.0  # W

    # Diversity
    cooling_diversity_factor: float = 1.0
    heating_diversity_factor: float = 1.0

    # Sized loads
    cooling_sizing_factor: float = 1.1
    heating_sizing_factor: float = 1.1
    sized_cooling_capacity: float = 0.0  # W
    sized_heating_capacity: float = 0.0  # W

    # Airflow
    total_supply_airflow: float = 0.0  # m³/s
    total_outdoor_airflow: float = 0.0  # m³/s
    total_return_airflow: float = 0.0  # m³/s

    # Coil loads
    cooling_coil_total: float = 0.0  # W
    cooling_coil_sensible: float = 0.0  # W
    cooling_coil_latent: float = 0.0  # W
    heating_coil_load: float = 0.0  # W
    preheat_coil_load: float = 0.0  # W
    reheat_coil_load: float = 0.0  # W

    # Fan power
    supply_fan_power: float = 0.0  # W
    return_fan_power: float = 0.0  # W

    # Psychrometrics
    mixed_air_temp: float = 0.0  # °C
    supply_air_temp: float = 13.0  # °C

    # Hourly profile
    hourly_profile: HourlyLoadProfile = field(default_factory=HourlyLoadProfile)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "system_id": self.system_id,
            "system_name": self.system_name,
            "system_type": self.system_type,
            "zone_ids": self.zone_ids,
            "geometry": {
                "total_floor_area_m2": self.total_floor_area,
            },
            "block_loads": {
                "cooling_sensible_w": self.block_cooling_sensible,
                "cooling_latent_w": self.block_cooling_latent,
                "cooling_total_w": self.block_cooling_total,
                "heating_w": self.block_heating,
            },
            "sized_capacity": {
                "cooling_w": self.sized_cooling_capacity,
                "heating_w": self.sized_heating_capacity,
                "cooling_tons": self.sized_cooling_capacity / 3517.0,
                "heating_kw": self.sized_heating_capacity / 1000.0,
            },
            "airflow": {
                "supply_m3s": self.total_supply_airflow,
                "supply_cfm": self.total_supply_airflow * 2118.88,
                "outdoor_air_m3s": self.total_outdoor_airflow,
                "outdoor_air_cfm": self.total_outdoor_airflow * 2118.88,
            },
            "coil_loads": {
                "cooling_coil_total_w": self.cooling_coil_total,
                "cooling_coil_sensible_w": self.cooling_coil_sensible,
                "cooling_coil_latent_w": self.cooling_coil_latent,
                "heating_coil_w": self.heating_coil_load,
                "reheat_coil_w": self.reheat_coil_load,
            },
            "fan_power": {
                "supply_fan_w": self.supply_fan_power,
                "return_fan_w": self.return_fan_power,
            },
        }


@dataclass
class PlantLoadResult:
    """Load results for central plant equipment."""
    plant_id: str
    plant_name: str
    plant_type: str

    # Served systems
    system_ids: List[str] = field(default_factory=list)
    system_results: List[SystemLoadResult] = field(default_factory=list)

    # Total building
    total_floor_area: float = 0.0  # m²

    # Plant loads
    total_chiller_load: float = 0.0  # W
    total_boiler_load: float = 0.0  # W
    total_cooling_tower_load: float = 0.0  # W

    # Diversity
    cooling_diversity_factor: float = 1.0
    heating_diversity_factor: float = 1.0

    # Sized capacity
    cooling_sizing_factor: float = 1.1
    heating_sizing_factor: float = 1.1
    chiller_capacity: float = 0.0  # W
    boiler_capacity: float = 0.0  # W
    cooling_tower_capacity: float = 0.0  # W

    # Pump loads
    chw_pump_power: float = 0.0  # W
    hw_pump_power: float = 0.0  # W
    cw_pump_power: float = 0.0  # W

    # Flow rates
    chw_flow_rate: float = 0.0  # L/s
    hw_flow_rate: float = 0.0  # L/s
    cw_flow_rate: float = 0.0  # L/s

    # Energy
    chiller_energy_input: float = 0.0  # W (electrical)
    boiler_energy_input: float = 0.0  # W (fuel)
    cooling_tower_fan_power: float = 0.0  # W

    # Equipment sizing
    num_chillers_recommended: int = 1
    num_boilers_recommended: int = 1
    chiller_size_each: float = 0.0  # W
    boiler_size_each: float = 0.0  # W

    # Hourly profile
    hourly_profile: HourlyLoadProfile = field(default_factory=HourlyLoadProfile)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "plant_id": self.plant_id,
            "plant_name": self.plant_name,
            "plant_type": self.plant_type,
            "system_ids": self.system_ids,
            "geometry": {
                "total_floor_area_m2": self.total_floor_area,
            },
            "plant_loads": {
                "chiller_load_w": self.total_chiller_load,
                "chiller_load_tons": self.total_chiller_load / 3517.0,
                "boiler_load_w": self.total_boiler_load,
                "boiler_load_kw": self.total_boiler_load / 1000.0,
                "cooling_tower_load_w": self.total_cooling_tower_load,
            },
            "sized_capacity": {
                "chiller_w": self.chiller_capacity,
                "chiller_tons": self.chiller_capacity / 3517.0,
                "boiler_w": self.boiler_capacity,
                "boiler_kw": self.boiler_capacity / 1000.0,
            },
            "equipment_sizing": {
                "num_chillers": self.num_chillers_recommended,
                "chiller_size_each_tons": self.chiller_size_each / 3517.0,
                "num_boilers": self.num_boilers_recommended,
                "boiler_size_each_kw": self.boiler_size_each / 1000.0,
            },
            "flow_rates": {
                "chw_Ls": self.chw_flow_rate,
                "hw_Ls": self.hw_flow_rate,
                "cw_Ls": self.cw_flow_rate,
            },
            "pump_power": {
                "chw_pump_w": self.chw_pump_power,
                "hw_pump_w": self.hw_pump_power,
                "cw_pump_w": self.cw_pump_power,
            },
        }


@dataclass
class ProjectLoadResult:
    """Complete load calculation results for a project."""
    project_id: str
    project_name: str
    calculated_at: datetime = field(default_factory=datetime.utcnow)
    calculation_method: str = "heat_balance"

    # Building summary
    building_name: str = ""
    total_floor_area: float = 0.0  # m²
    total_volume: float = 0.0  # m³
    num_spaces: int = 0
    num_zones: int = 0
    num_systems: int = 0

    # Location
    location: str = ""
    latitude: float = 0.0
    longitude: float = 0.0
    cooling_design_temp: float = 35.0  # °C
    heating_design_temp: float = -15.0  # °C

    # Building totals
    total_cooling_load: float = 0.0  # W
    total_heating_load: float = 0.0  # W
    cooling_w_per_m2: float = 0.0
    heating_w_per_m2: float = 0.0

    # Hierarchical results
    space_results: List[SpaceLoadResult] = field(default_factory=list)
    zone_results: List[ZoneLoadResult] = field(default_factory=list)
    system_results: List[SystemLoadResult] = field(default_factory=list)
    plant_results: List[PlantLoadResult] = field(default_factory=list)

    # Warnings and notes
    warnings: List[str] = field(default_factory=list)
    notes: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON/report generation."""
        return {
            "project_id": self.project_id,
            "project_name": self.project_name,
            "calculated_at": self.calculated_at.isoformat(),
            "calculation_method": self.calculation_method,
            "summary": {
                "building_name": self.building_name,
                "location": self.location,
                "total_floor_area_m2": self.total_floor_area,
                "total_volume_m3": self.total_volume,
                "num_spaces": self.num_spaces,
                "num_zones": self.num_zones,
                "num_systems": self.num_systems,
            },
            "design_conditions": {
                "cooling_design_temp_c": self.cooling_design_temp,
                "heating_design_temp_c": self.heating_design_temp,
            },
            "building_loads": {
                "total_cooling_w": self.total_cooling_load,
                "total_cooling_tons": self.total_cooling_load / 3517.0,
                "total_heating_w": self.total_heating_load,
                "total_heating_kw": self.total_heating_load / 1000.0,
                "cooling_w_per_m2": self.cooling_w_per_m2,
                "heating_w_per_m2": self.heating_w_per_m2,
            },
            "space_results": [r.to_dict() for r in self.space_results],
            "zone_results": [r.to_dict() for r in self.zone_results],
            "system_results": [r.to_dict() for r in self.system_results],
            "plant_results": [r.to_dict() for r in self.plant_results],
            "warnings": self.warnings,
            "notes": self.notes,
        }
