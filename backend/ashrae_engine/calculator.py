# -*- coding: utf-8 -*-
"""
ASHRAE Heat Balance Load Calculator

Implements the Heat Balance Method from ASHRAE Fundamentals Chapter 18
for calculating heating and cooling loads at design conditions.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any

from .models import (
    Project, Building, Space, Zone, System, Plant,
    Surface, SurfaceType, Fenestration, Construction, Glazing,
    InternalLoad, Infiltration, Ventilation,
    WeatherData, DesignDay, Schedule,
)
from .results import (
    ProjectLoadResult, SpaceLoadResult, ZoneLoadResult,
    SystemLoadResult, PlantLoadResult,
    LoadComponent, HourlyLoadProfile, PeakLoadSummary,
)


# Physical constants
CP_AIR = 1006.0  # J/(kg·K) - specific heat of air
RHO_AIR = 1.2  # kg/m³ - density of air at standard conditions
CP_WATER = 4186.0  # J/(kg·K) - specific heat of water
RHO_WATER = 1000.0  # kg/m³
STEFAN_BOLTZMANN = 5.67e-8  # W/(m²·K⁴)
GRAVITY = 9.81  # m/s²

# Conversion factors
W_PER_BTU_HR = 0.293071
M2_PER_FT2 = 0.092903
M3_PER_CFM = 0.000471947
TONS_PER_KW = 0.284345


@dataclass
class CalculationSettings:
    """Settings for load calculations."""
    timestep_minutes: int = 60
    include_thermal_mass: bool = True
    include_solar_gains: bool = True
    include_infiltration: bool = True
    include_ventilation: bool = True

    # Safety factors
    cooling_safety_factor: float = 1.1
    heating_safety_factor: float = 1.1

    # Supply air conditions
    cooling_supply_air_temp: float = 13.0  # °C
    heating_supply_air_temp: float = 35.0  # °C

    # Room conditions
    indoor_cooling_temp: float = 24.0  # °C
    indoor_heating_temp: float = 21.0  # °C
    indoor_humidity: float = 50.0  # % RH


class ASHRAELoadCalculator:
    """
    ASHRAE Heat Balance Method load calculator.

    Calculates heating and cooling loads for buildings using the
    heat balance method as described in ASHRAE Fundamentals Chapter 18.
    """

    def __init__(self, settings: Optional[CalculationSettings] = None):
        self.settings = settings or CalculationSettings()
        self._solar_cache: Dict[str, Any] = {}

    def calculate_project(self, project: Project) -> ProjectLoadResult:
        """
        Calculate loads for an entire project.

        Returns comprehensive results at space, zone, system, and plant levels.
        """
        if not project.building:
            raise ValueError("Project has no building defined")

        building = project.building
        result = ProjectLoadResult(
            project_id=project.id,
            project_name=project.name,
            building_name=building.name,
            calculation_method=project.calculation_method or "heat_balance",
        )

        # Set location info
        if building.weather_data:
            wd = building.weather_data
            result.location = f"{wd.city}, {wd.state}, {wd.country}"
            result.latitude = wd.latitude
            result.longitude = wd.longitude
            result.cooling_design_temp = wd.cooling_db_004
            result.heating_design_temp = wd.heating_db_996

        # Calculate space loads
        for space in building.spaces:
            space_result = self._calculate_space_loads(space, building)
            result.space_results.append(space_result)
            result.total_floor_area += space.floor_area * space.multiplier
            result.total_volume += space.volume * space.multiplier

        result.num_spaces = len(building.spaces)

        # Calculate zone loads
        for zone in building.zones:
            zone_spaces = [
                sr for sr in result.space_results
                if sr.space_id in zone.space_ids
            ]
            zone_result = self._calculate_zone_loads(zone, zone_spaces)
            result.zone_results.append(zone_result)

        result.num_zones = len(building.zones)

        # If no zones defined, create a default zone per space
        if not result.zone_results and result.space_results:
            for space_result in result.space_results:
                zone_result = ZoneLoadResult(
                    zone_id=f"zone-{space_result.space_id}",
                    zone_name=space_result.space_name,
                    space_ids=[space_result.space_id],
                    space_results=[space_result],
                    total_floor_area=space_result.floor_area,
                    total_volume=space_result.volume,
                    peak_summary=space_result.peak_summary,
                    sized_cooling_load=space_result.peak_summary.peak_total_cooling * 1.15,
                    sized_heating_load=space_result.peak_summary.peak_sensible_heating * 1.25,
                    zone_supply_airflow=space_result.supply_airflow_cooling,
                    zone_outdoor_airflow=space_result.outdoor_airflow,
                )
                result.zone_results.append(zone_result)

        # Calculate system loads
        for system in building.systems:
            system_zones = [
                zr for zr in result.zone_results
                if zr.zone_id in system.zone_ids
            ]
            system_result = self._calculate_system_loads(system, system_zones)
            result.system_results.append(system_result)

        result.num_systems = len(building.systems)

        # If no systems defined, create a default system
        if not result.system_results and result.zone_results:
            system_result = self._calculate_system_loads(
                System(id="sys-default", name="Default System", zone_ids=[z.zone_id for z in result.zone_results]),
                result.zone_results
            )
            result.system_results.append(system_result)

        # Calculate plant loads
        for plant in building.plants:
            plant_systems = [
                sr for sr in result.system_results
                if sr.system_id in plant.system_ids
            ]
            plant_result = self._calculate_plant_loads(plant, plant_systems)
            result.plant_results.append(plant_result)

        # If no plants defined, create a default plant
        if not result.plant_results and result.system_results:
            plant_result = self._calculate_plant_loads(
                Plant(id="plant-default", name="Central Plant", system_ids=[s.system_id for s in result.system_results]),
                result.system_results
            )
            result.plant_results.append(plant_result)

        # Calculate building totals
        result.total_cooling_load = sum(sr.peak_summary.peak_total_cooling for sr in result.space_results)
        result.total_heating_load = sum(sr.peak_summary.peak_sensible_heating for sr in result.space_results)

        if result.total_floor_area > 0:
            result.cooling_w_per_m2 = result.total_cooling_load / result.total_floor_area
            result.heating_w_per_m2 = result.total_heating_load / result.total_floor_area

        return result

    def _calculate_space_loads(self, space: Space, building: Building) -> SpaceLoadResult:
        """Calculate loads for a single space."""
        result = SpaceLoadResult(
            space_id=space.id,
            space_name=space.name,
            floor_area=space.floor_area,
            volume=space.volume,
        )

        # Get weather data
        weather = building.weather_data or self._default_weather()
        cooling_dd = weather.cooling_design_days[0] if weather.cooling_design_days else self._default_cooling_design_day()
        heating_dd = weather.heating_design_days[0] if weather.heating_design_days else self._default_heating_design_day()

        # Calculate loads for each hour of cooling design day
        cooling_profile = HourlyLoadProfile()
        for hour in range(24):
            outdoor_temp = self._get_design_day_temp(cooling_dd, hour)
            cooling_profile.outdoor_temp[hour] = outdoor_temp

            # Calculate all load components at this hour
            components = self._calculate_hourly_loads(
                space, building, outdoor_temp, hour, cooling_dd, is_cooling=True
            )

            sensible = sum(c.sensible_cooling for c in components.values())
            latent = sum(c.latent_cooling for c in components.values())

            cooling_profile.sensible_cooling[hour] = sensible
            cooling_profile.latent_cooling[hour] = latent
            cooling_profile.total_cooling[hour] = sensible + latent

        result.cooling_design_day_profile = cooling_profile

        # Calculate heating loads (simpler, typically at steady-state)
        heating_profile = HourlyLoadProfile()
        for hour in range(24):
            outdoor_temp = self._get_design_day_temp(heating_dd, hour)
            heating_profile.outdoor_temp[hour] = outdoor_temp

            heating_load = self._calculate_heating_load(space, building, outdoor_temp)
            heating_profile.sensible_heating[hour] = heating_load

        result.heating_design_day_profile = heating_profile

        # Find peak loads
        peak_cooling_hour = cooling_profile.peak_cooling_hour
        peak_heating_hour = heating_profile.peak_heating_hour

        # Get detailed components at peak hour
        outdoor_temp_peak = cooling_profile.outdoor_temp[peak_cooling_hour]
        result.components = self._calculate_hourly_loads(
            space, building, outdoor_temp_peak, peak_cooling_hour, cooling_dd, is_cooling=True
        )

        # Calculate surface areas
        for surface in space.surfaces:
            if surface.surface_type == SurfaceType.EXTERIOR_WALL:
                result.exterior_wall_area += surface.area
            elif surface.surface_type == SurfaceType.ROOF:
                result.roof_area += surface.area

        for fen in space.fenestrations:
            result.window_area += fen.area

        # Peak summary
        result.peak_summary = PeakLoadSummary(
            peak_sensible_cooling=max(cooling_profile.sensible_cooling),
            peak_latent_cooling=cooling_profile.latent_cooling[peak_cooling_hour],
            peak_total_cooling=max(cooling_profile.total_cooling),
            peak_sensible_heating=max(heating_profile.sensible_heating),
            peak_cooling_month=cooling_dd.month,
            peak_cooling_day=cooling_dd.day,
            peak_cooling_hour=peak_cooling_hour,
            peak_heating_month=heating_dd.month,
            peak_heating_day=heating_dd.day,
            peak_heating_hour=peak_heating_hour,
            outdoor_temp_at_cooling_peak=outdoor_temp_peak,
            outdoor_temp_at_heating_peak=heating_profile.outdoor_temp[peak_heating_hour],
        )

        if result.floor_area > 0:
            result.peak_summary.cooling_w_per_m2 = result.peak_summary.peak_total_cooling / result.floor_area
            result.peak_summary.heating_w_per_m2 = result.peak_summary.peak_sensible_heating / result.floor_area

        # Calculate airflow requirements
        result.supply_airflow_cooling = self._calculate_supply_airflow(
            result.peak_summary.peak_sensible_cooling,
            self.settings.cooling_supply_air_temp,
            self.settings.indoor_cooling_temp
        )

        result.supply_airflow_heating = self._calculate_supply_airflow(
            result.peak_summary.peak_sensible_heating,
            self.settings.heating_supply_air_temp,
            self.settings.indoor_heating_temp
        )

        # Outdoor air requirements
        if space.ventilation:
            result.outdoor_airflow = self._calculate_outdoor_air(space, space.ventilation)
        else:
            # Default: ASHRAE 62.1 office
            result.outdoor_airflow = 0.0025 * (space.floor_area / 10) + 0.0003 * space.floor_area

        # Sensible heat ratio
        total_sensible = result.peak_summary.peak_sensible_cooling
        total_load = result.peak_summary.peak_total_cooling
        if total_load > 0:
            result.room_sensible_heat_ratio = total_sensible / total_load

        return result

    def _calculate_hourly_loads(
        self,
        space: Space,
        building: Building,
        outdoor_temp: float,
        hour: int,
        design_day: DesignDay,
        is_cooling: bool = True,
    ) -> Dict[str, LoadComponent]:
        """Calculate all load components for a single hour."""
        components: Dict[str, LoadComponent] = {}
        indoor_temp = self.settings.indoor_cooling_temp if is_cooling else self.settings.indoor_heating_temp

        # 1. Envelope conduction
        envelope_sensible = 0.0
        for surface in space.surfaces:
            if surface.surface_type in [SurfaceType.EXTERIOR_WALL, SurfaceType.ROOF]:
                u_value = surface.construction.u_value if surface.construction else 0.5
                sol_air_temp = self._calculate_sol_air_temp(
                    outdoor_temp, surface, hour, design_day, building
                )
                q = u_value * surface.area * (sol_air_temp - indoor_temp)
                envelope_sensible += max(0, q) if is_cooling else 0

        components["envelope_conduction"] = LoadComponent(
            name="Envelope Conduction",
            sensible_cooling=envelope_sensible,
            description="Heat gain through walls and roof"
        )

        # 2. Window solar and conduction
        window_solar = 0.0
        window_conduction = 0.0
        for fen in space.fenestrations:
            glazing = fen.glazing or Glazing()

            # Solar gain
            shgc = glazing.shgc
            solar_intensity = self._get_solar_intensity(hour, design_day, building)
            # Simplified: assume average window orientation
            window_solar += shgc * fen.area * solar_intensity * 0.5

            # Conduction
            u = glazing.assembly_u_value
            window_conduction += u * fen.area * (outdoor_temp - indoor_temp)

        components["window_solar"] = LoadComponent(
            name="Window Solar",
            sensible_cooling=max(0, window_solar) if is_cooling else 0,
            description="Solar heat gain through windows"
        )
        components["window_conduction"] = LoadComponent(
            name="Window Conduction",
            sensible_cooling=max(0, window_conduction) if is_cooling else 0,
            description="Conduction through windows"
        )

        # 3. Internal loads
        if space.internal_load:
            load = space.internal_load
            schedule_value = self._get_schedule_value(load.people_schedule_id, hour, building)

            # People
            if load.people_count > 0:
                num_people = load.people_count
            else:
                num_people = load.people_per_area * space.floor_area

            people_sensible = num_people * load.activity_level * load.sensible_fraction * schedule_value
            people_latent = num_people * load.activity_level * (1 - load.sensible_fraction) * schedule_value

            components["people"] = LoadComponent(
                name="People",
                sensible_cooling=people_sensible if is_cooling else 0,
                latent_cooling=people_latent if is_cooling else 0,
                description=f"{num_people:.0f} people at {load.activity_level} W/person"
            )

            # Lighting
            light_schedule = self._get_schedule_value(load.lighting_schedule_id, hour, building)
            lighting_power = load.lighting_power_density * space.floor_area * light_schedule

            components["lighting"] = LoadComponent(
                name="Lighting",
                sensible_cooling=lighting_power if is_cooling else 0,
                description=f"{load.lighting_power_density} W/m²"
            )

            # Equipment
            equip_schedule = self._get_schedule_value(load.equipment_schedule_id, hour, building)
            equip_power = load.equipment_power_density * space.floor_area * equip_schedule
            equip_latent = equip_power * load.equipment_latent_fraction

            components["equipment"] = LoadComponent(
                name="Equipment",
                sensible_cooling=(equip_power - equip_latent) if is_cooling else 0,
                latent_cooling=equip_latent if is_cooling else 0,
                description=f"{load.equipment_power_density} W/m²"
            )
        else:
            # Default internal loads based on space type
            default_loads = self._get_default_internal_loads(space.space_type)
            schedule_value = self._get_typical_schedule_value(hour)

            components["people"] = LoadComponent(
                name="People",
                sensible_cooling=default_loads["people_sensible"] * space.floor_area * schedule_value if is_cooling else 0,
                latent_cooling=default_loads["people_latent"] * space.floor_area * schedule_value if is_cooling else 0,
            )
            components["lighting"] = LoadComponent(
                name="Lighting",
                sensible_cooling=default_loads["lighting"] * space.floor_area * schedule_value if is_cooling else 0,
            )
            components["equipment"] = LoadComponent(
                name="Equipment",
                sensible_cooling=default_loads["equipment"] * space.floor_area * schedule_value if is_cooling else 0,
            )

        # 4. Infiltration
        if space.infiltration and self.settings.include_infiltration:
            inf = space.infiltration
            if inf.method == "air_changes":
                infiltration_flow = inf.air_changes_per_hour * space.volume / 3600  # m³/s
            else:
                infiltration_flow = inf.flow_per_zone

            inf_sensible = infiltration_flow * RHO_AIR * CP_AIR * (outdoor_temp - indoor_temp)
            # Simplified latent calculation
            inf_latent = infiltration_flow * RHO_AIR * 2500 * 0.005  # Assume 5 g/kg humidity diff

            components["infiltration"] = LoadComponent(
                name="Infiltration",
                sensible_cooling=max(0, inf_sensible) if is_cooling else 0,
                latent_cooling=max(0, inf_latent) if is_cooling else 0,
                description=f"{inf.air_changes_per_hour} ACH"
            )
        else:
            # Default infiltration
            default_ach = 0.3
            infiltration_flow = default_ach * space.volume / 3600
            inf_sensible = infiltration_flow * RHO_AIR * CP_AIR * (outdoor_temp - indoor_temp)

            components["infiltration"] = LoadComponent(
                name="Infiltration",
                sensible_cooling=max(0, inf_sensible) if is_cooling else 0,
                latent_cooling=max(0, inf_sensible * 0.3) if is_cooling else 0,
            )

        # 5. Ventilation (treated as a load component for space-level reporting)
        if space.ventilation and self.settings.include_ventilation:
            vent = space.ventilation
            vent_flow = self._calculate_outdoor_air(space, vent)

            vent_sensible = vent_flow * RHO_AIR * CP_AIR * (outdoor_temp - indoor_temp)
            vent_latent = vent_flow * RHO_AIR * 2500 * 0.005

            components["ventilation"] = LoadComponent(
                name="Ventilation",
                sensible_cooling=max(0, vent_sensible) if is_cooling else 0,
                latent_cooling=max(0, vent_latent) if is_cooling else 0,
            )

        return components

    def _calculate_heating_load(
        self,
        space: Space,
        building: Building,
        outdoor_temp: float,
    ) -> float:
        """Calculate heating load at steady-state design conditions."""
        indoor_temp = self.settings.indoor_heating_temp
        heating_load = 0.0

        # Envelope conduction (no solar, night conditions)
        for surface in space.surfaces:
            if surface.surface_type in [SurfaceType.EXTERIOR_WALL, SurfaceType.ROOF]:
                u_value = surface.construction.u_value if surface.construction else 0.5
                q = u_value * surface.area * (indoor_temp - outdoor_temp)
                heating_load += max(0, q)
            elif surface.surface_type == SurfaceType.SLAB_ON_GRADE:
                # Ground loss (simplified)
                u_value = surface.construction.u_value if surface.construction else 0.3
                ground_temp = 10.0  # Simplified ground temperature
                q = u_value * surface.area * (indoor_temp - ground_temp)
                heating_load += max(0, q)

        # Window conduction (no solar for heating design)
        for fen in space.fenestrations:
            glazing = fen.glazing or Glazing()
            u = glazing.assembly_u_value
            q = u * fen.area * (indoor_temp - outdoor_temp)
            heating_load += max(0, q)

        # Infiltration
        if space.infiltration:
            inf = space.infiltration
            if inf.method == "air_changes":
                infiltration_flow = inf.air_changes_per_hour * space.volume / 3600
            else:
                infiltration_flow = inf.flow_per_zone
        else:
            infiltration_flow = 0.3 * space.volume / 3600

        inf_load = infiltration_flow * RHO_AIR * CP_AIR * (indoor_temp - outdoor_temp)
        heating_load += max(0, inf_load)

        # Ventilation heating load
        if space.ventilation:
            vent_flow = self._calculate_outdoor_air(space, space.ventilation)
        else:
            vent_flow = 0.0025 * (space.floor_area / 10) + 0.0003 * space.floor_area

        vent_load = vent_flow * RHO_AIR * CP_AIR * (indoor_temp - outdoor_temp)
        heating_load += max(0, vent_load)

        return heating_load

    def _calculate_zone_loads(
        self, zone: Zone, space_results: List[SpaceLoadResult]
    ) -> ZoneLoadResult:
        """Calculate aggregated zone loads from space results."""
        result = ZoneLoadResult(
            zone_id=zone.id,
            zone_name=zone.name,
            space_ids=zone.space_ids,
            space_results=space_results,
            cooling_sizing_factor=zone.cooling_sizing_factor,
            heating_sizing_factor=zone.heating_sizing_factor,
        )

        # Sum space loads
        for sr in space_results:
            result.total_floor_area += sr.floor_area
            result.total_volume += sr.volume
            result.zone_supply_airflow += sr.supply_airflow_cooling
            result.zone_outdoor_airflow += sr.outdoor_airflow

        # Calculate coincident peak (simplified: assume all peak at same hour)
        peak_cooling = sum(sr.peak_summary.peak_total_cooling for sr in space_results)
        peak_heating = sum(sr.peak_summary.peak_sensible_heating for sr in space_results)

        result.peak_summary = PeakLoadSummary(
            peak_total_cooling=peak_cooling,
            peak_sensible_cooling=sum(sr.peak_summary.peak_sensible_cooling for sr in space_results),
            peak_latent_cooling=sum(sr.peak_summary.peak_latent_cooling for sr in space_results),
            peak_sensible_heating=peak_heating,
        )

        if result.total_floor_area > 0:
            result.peak_summary.cooling_w_per_m2 = peak_cooling / result.total_floor_area
            result.peak_summary.heating_w_per_m2 = peak_heating / result.total_floor_area

        # Apply sizing factors
        result.sized_cooling_load = peak_cooling * zone.cooling_sizing_factor
        result.sized_heating_load = peak_heating * zone.heating_sizing_factor

        # Combine hourly profiles
        result.hourly_profile = HourlyLoadProfile()
        for hour in range(24):
            result.hourly_profile.sensible_cooling[hour] = sum(
                sr.cooling_design_day_profile.sensible_cooling[hour] for sr in space_results
            )
            result.hourly_profile.latent_cooling[hour] = sum(
                sr.cooling_design_day_profile.latent_cooling[hour] for sr in space_results
            )
            result.hourly_profile.total_cooling[hour] = sum(
                sr.cooling_design_day_profile.total_cooling[hour] for sr in space_results
            )
            result.hourly_profile.sensible_heating[hour] = sum(
                sr.heating_design_day_profile.sensible_heating[hour] for sr in space_results
            )

        return result

    def _calculate_system_loads(
        self, system: System, zone_results: List[ZoneLoadResult]
    ) -> SystemLoadResult:
        """Calculate system-level loads from zone results."""
        result = SystemLoadResult(
            system_id=system.id,
            system_name=system.name,
            system_type=system.system_type,
            zone_ids=system.zone_ids,
            zone_results=zone_results,
            cooling_sizing_factor=system.cooling_sizing_factor,
            heating_sizing_factor=system.heating_sizing_factor,
        )

        # Sum zone loads
        for zr in zone_results:
            result.total_floor_area += zr.total_floor_area
            result.total_supply_airflow += zr.zone_supply_airflow
            result.total_outdoor_airflow += zr.zone_outdoor_airflow
            result.sum_zone_cooling += zr.sized_cooling_load
            result.sum_zone_heating += zr.sized_heating_load

        # Block load calculation (coincident)
        # Simplified: use hourly profiles to find coincident peak
        hourly_totals_cooling = [0.0] * 24
        hourly_totals_heating = [0.0] * 24

        for zr in zone_results:
            for hour in range(24):
                hourly_totals_cooling[hour] += zr.hourly_profile.total_cooling[hour]
                hourly_totals_heating[hour] += zr.hourly_profile.sensible_heating[hour]

        result.block_cooling_total = max(hourly_totals_cooling)
        result.block_heating = max(hourly_totals_heating)

        # Diversity factor
        if result.sum_zone_cooling > 0:
            result.cooling_diversity_factor = result.block_cooling_total / result.sum_zone_cooling
        if result.sum_zone_heating > 0:
            result.heating_diversity_factor = result.block_heating / result.sum_zone_heating

        # Estimate sensible/latent split
        total_sensible = sum(zr.peak_summary.peak_sensible_cooling for zr in zone_results)
        total_latent = sum(zr.peak_summary.peak_latent_cooling for zr in zone_results)
        if result.block_cooling_total > 0:
            ratio = total_sensible / (total_sensible + total_latent) if (total_sensible + total_latent) > 0 else 0.75
            result.block_cooling_sensible = result.block_cooling_total * ratio
            result.block_cooling_latent = result.block_cooling_total * (1 - ratio)

        # Sized capacity
        result.sized_cooling_capacity = result.block_cooling_total * system.cooling_sizing_factor
        result.sized_heating_capacity = result.block_heating * system.heating_sizing_factor

        # Coil loads (include ventilation processing)
        # Cooling coil sees full load plus ventilation
        outdoor_temp = 35.0  # Design condition
        mixed_air_temp = self._calculate_mixed_air_temp(
            result.total_supply_airflow,
            result.total_outdoor_airflow,
            outdoor_temp,
            self.settings.indoor_cooling_temp
        )
        result.mixed_air_temp = mixed_air_temp

        # Cooling coil load
        supply_temp = system.cooling_supply_air_temp
        result.cooling_coil_sensible = result.total_supply_airflow * RHO_AIR * CP_AIR * (mixed_air_temp - supply_temp)
        result.cooling_coil_latent = result.block_cooling_latent * 1.2  # Account for OA latent
        result.cooling_coil_total = result.cooling_coil_sensible + result.cooling_coil_latent

        # Heating coil load
        result.heating_coil_load = result.block_heating * 1.1  # Include some ventilation

        # Reheat (for VAV systems)
        if system.system_type.lower() == "vav":
            result.reheat_coil_load = result.block_cooling_sensible * 0.2  # Simplified estimate

        # Fan power
        result.supply_fan_power = self._calculate_fan_power(
            result.total_supply_airflow,
            system.fan_pressure_rise,
            system.fan_efficiency,
            system.fan_motor_efficiency
        )

        # Store hourly profile
        result.hourly_profile = HourlyLoadProfile()
        for hour in range(24):
            result.hourly_profile.sensible_cooling[hour] = sum(
                zr.hourly_profile.sensible_cooling[hour] for zr in zone_results
            )
            result.hourly_profile.total_cooling[hour] = hourly_totals_cooling[hour]
            result.hourly_profile.sensible_heating[hour] = hourly_totals_heating[hour]

        return result

    def _calculate_plant_loads(
        self, plant: Plant, system_results: List[SystemLoadResult]
    ) -> PlantLoadResult:
        """Calculate plant-level loads from system results."""
        result = PlantLoadResult(
            plant_id=plant.id,
            plant_name=plant.name,
            plant_type=plant.plant_type,
            system_ids=plant.system_ids,
            system_results=system_results,
            cooling_sizing_factor=plant.cooling_sizing_factor,
            heating_sizing_factor=plant.heating_sizing_factor,
        )

        # Sum system loads
        total_cooling_coil = 0.0
        total_heating_coil = 0.0

        for sr in system_results:
            result.total_floor_area += sr.total_floor_area
            total_cooling_coil += sr.cooling_coil_total
            total_heating_coil += sr.heating_coil_load + sr.reheat_coil_load

        # Plant loads include pump heat, piping losses, etc.
        result.total_chiller_load = total_cooling_coil * 1.05  # 5% for pumps/losses
        result.total_boiler_load = total_heating_coil * 1.05

        # Cooling tower load (reject chiller load + compressor heat)
        chiller_cop = plant.chiller_cop
        compressor_heat = result.total_chiller_load / chiller_cop
        result.total_cooling_tower_load = result.total_chiller_load + compressor_heat

        # Sized capacities
        result.chiller_capacity = result.total_chiller_load * plant.cooling_sizing_factor
        result.boiler_capacity = result.total_boiler_load * plant.heating_sizing_factor
        result.cooling_tower_capacity = result.total_cooling_tower_load * plant.cooling_sizing_factor

        # Equipment sizing recommendations
        # Rule of thumb: don't exceed 500 tons per chiller
        max_chiller_size = 500 * 3517  # 500 tons in watts
        if result.chiller_capacity > max_chiller_size:
            result.num_chillers_recommended = math.ceil(result.chiller_capacity / max_chiller_size)
        else:
            result.num_chillers_recommended = max(1, math.ceil(result.chiller_capacity / (200 * 3517)))  # Min 200 tons

        result.chiller_size_each = result.chiller_capacity / result.num_chillers_recommended

        # Boilers: don't exceed 3000 kW per boiler
        max_boiler_size = 3000 * 1000  # 3000 kW in watts
        if result.boiler_capacity > max_boiler_size:
            result.num_boilers_recommended = math.ceil(result.boiler_capacity / max_boiler_size)
        else:
            result.num_boilers_recommended = max(1, math.ceil(result.boiler_capacity / (500 * 1000)))  # Min 500 kW

        result.boiler_size_each = result.boiler_capacity / result.num_boilers_recommended

        # Flow rates
        chw_delta_t = 5.5  # °C
        hw_delta_t = 11.0  # °C
        cw_delta_t = 5.5  # °C

        result.chw_flow_rate = result.total_chiller_load / (RHO_WATER * CP_WATER * chw_delta_t)  # m³/s to L/s
        result.chw_flow_rate *= 1000  # Convert to L/s

        result.hw_flow_rate = result.total_boiler_load / (RHO_WATER * CP_WATER * hw_delta_t) * 1000

        result.cw_flow_rate = result.total_cooling_tower_load / (RHO_WATER * CP_WATER * cw_delta_t) * 1000

        # Pump power
        result.chw_pump_power = self._calculate_pump_power(
            result.chw_flow_rate / 1000, plant.chw_pump_head, plant.pump_efficiency
        )
        result.hw_pump_power = self._calculate_pump_power(
            result.hw_flow_rate / 1000, plant.hw_pump_head, plant.pump_efficiency
        )
        result.cw_pump_power = self._calculate_pump_power(
            result.cw_flow_rate / 1000, plant.cw_pump_head, plant.pump_efficiency
        )

        # Energy input
        result.chiller_energy_input = result.total_chiller_load / plant.chiller_cop
        result.boiler_energy_input = result.total_boiler_load / plant.boiler_efficiency

        return result

    # Helper methods

    def _get_design_day_temp(self, dd: DesignDay, hour: int) -> float:
        """Get temperature at given hour using ASHRAE profile."""
        # ASHRAE clear day temperature profile multipliers
        profile = [
            0.88, 0.92, 0.95, 0.98, 1.0, 0.98,  # 0-5
            0.91, 0.74, 0.55, 0.38, 0.23, 0.13,  # 6-11
            0.05, 0.00, 0.00, 0.06, 0.14, 0.24,  # 12-17
            0.39, 0.50, 0.59, 0.68, 0.75, 0.82,  # 18-23
        ]

        temp_range = dd.daily_range
        temp = dd.dry_bulb_max - profile[hour] * temp_range
        return temp

    def _calculate_sol_air_temp(
        self,
        outdoor_temp: float,
        surface: Surface,
        hour: int,
        design_day: DesignDay,
        building: Building,
    ) -> float:
        """Calculate sol-air temperature for a surface."""
        # Solar absorptance (typical dark surface)
        alpha = 0.7 if surface.surface_type == SurfaceType.ROOF else 0.6

        # Get solar intensity on surface
        solar = self._get_solar_on_surface(hour, surface, design_day, building)

        # Outside film coefficient
        h_o = 22.7  # W/(m²·K) for 3.4 m/s wind

        # Long-wave radiation correction
        delta_r = 0.0
        if surface.tilt < 45:  # Horizontal (roof)
            delta_r = 4.0  # °C
        elif surface.tilt > 45:  # Vertical (wall)
            delta_r = 0.0

        sol_air_temp = outdoor_temp + (alpha * solar / h_o) - delta_r
        return sol_air_temp

    def _get_solar_on_surface(
        self,
        hour: int,
        surface: Surface,
        design_day: DesignDay,
        building: Building,
    ) -> float:
        """Get solar irradiance on a surface (W/m²)."""
        # Simplified solar calculation
        # Peak solar on horizontal: ~1000 W/m² at solar noon

        # Hour angle from solar noon (assume noon = hour 12)
        hour_angle = abs(hour - 12) * 15  # degrees

        # Approximate direct normal irradiance
        if hour < 6 or hour > 18:
            return 0.0

        # Simple cosine model
        solar_altitude = 90 - hour_angle * 0.7  # Simplified
        if solar_altitude <= 0:
            return 0.0

        dni = 800 * math.cos(math.radians(hour_angle)) * design_day.clearness

        # Convert to surface irradiance based on tilt and azimuth
        # Simplified: just use a factor based on orientation
        if surface.tilt == 0:  # Horizontal roof
            factor = math.sin(math.radians(solar_altitude))
        elif surface.tilt == 90:  # Vertical wall
            # Factor based on wall azimuth vs sun position
            sun_azimuth = 180 + (hour - 12) * 15  # Simplified
            angle_diff = abs(surface.azimuth - sun_azimuth)
            if angle_diff > 180:
                angle_diff = 360 - angle_diff
            if angle_diff > 90:
                factor = 0.1  # Shaded side
            else:
                factor = math.cos(math.radians(angle_diff)) * 0.7
        else:
            factor = 0.5

        return max(0, dni * factor)

    def _get_solar_intensity(self, hour: int, design_day: DesignDay, building: Building) -> float:
        """Get global horizontal solar irradiance."""
        if hour < 6 or hour > 18:
            return 0.0

        hour_angle = abs(hour - 12)
        # Peak around 800 W/m² at noon
        solar = 800 * math.cos(math.radians(hour_angle * 15)) * design_day.clearness
        return max(0, solar)

    def _get_schedule_value(
        self, schedule_id: Optional[str], hour: int, building: Building
    ) -> float:
        """Get schedule value at given hour."""
        if not schedule_id or schedule_id not in building.schedules:
            return self._get_typical_schedule_value(hour)

        schedule = building.schedules[schedule_id]
        return schedule.get_value(hour, "weekday")

    def _get_typical_schedule_value(self, hour: int) -> float:
        """Get typical office occupancy schedule value."""
        # Typical office schedule
        schedule = [
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0,  # 0-5 (night)
            0.1, 0.5, 0.9, 1.0, 1.0, 0.9,  # 6-11 (morning)
            0.5, 0.9, 1.0, 1.0, 1.0, 0.5,  # 12-17 (afternoon)
            0.2, 0.1, 0.0, 0.0, 0.0, 0.0,  # 18-23 (evening)
        ]
        return schedule[hour]

    def _get_default_internal_loads(self, space_type) -> Dict[str, float]:
        """Get default internal loads per m² based on space type."""
        defaults = {
            "office_enclosed": {"people_sensible": 5.0, "people_latent": 3.5, "lighting": 10.0, "equipment": 10.0},
            "office_open_plan": {"people_sensible": 6.0, "people_latent": 4.0, "lighting": 12.0, "equipment": 12.0},
            "conference_room": {"people_sensible": 25.0, "people_latent": 18.0, "lighting": 15.0, "equipment": 5.0},
            "lobby": {"people_sensible": 3.0, "people_latent": 2.0, "lighting": 10.0, "equipment": 2.0},
            "corridor": {"people_sensible": 1.0, "people_latent": 0.7, "lighting": 5.0, "equipment": 0.0},
            "restroom": {"people_sensible": 3.0, "people_latent": 5.0, "lighting": 8.0, "equipment": 2.0},
            "storage": {"people_sensible": 0.5, "people_latent": 0.3, "lighting": 5.0, "equipment": 0.0},
            "classroom": {"people_sensible": 20.0, "people_latent": 14.0, "lighting": 12.0, "equipment": 5.0},
            "retail": {"people_sensible": 8.0, "people_latent": 5.5, "lighting": 15.0, "equipment": 5.0},
            "restaurant": {"people_sensible": 15.0, "people_latent": 10.0, "lighting": 12.0, "equipment": 20.0},
            "data_center": {"people_sensible": 1.0, "people_latent": 0.5, "lighting": 5.0, "equipment": 500.0},
        }

        type_key = space_type.value if hasattr(space_type, 'value') else str(space_type)
        return defaults.get(type_key, defaults["office_enclosed"])

    def _calculate_supply_airflow(
        self, sensible_load: float, supply_temp: float, room_temp: float
    ) -> float:
        """Calculate required supply airflow for a sensible load."""
        delta_t = abs(room_temp - supply_temp)
        if delta_t < 1:
            delta_t = 1.0

        # Q = m_dot * Cp * delta_T
        # m_dot = Q / (Cp * delta_T)
        mass_flow = sensible_load / (CP_AIR * delta_t)  # kg/s
        volume_flow = mass_flow / RHO_AIR  # m³/s

        return volume_flow

    def _calculate_outdoor_air(self, space: Space, ventilation: Ventilation) -> float:
        """Calculate outdoor air requirement for a space."""
        if ventilation.total_outdoor_air > 0:
            return ventilation.total_outdoor_air

        # ASHRAE 62.1 method
        # Rp * Pz + Ra * Az
        people = space.floor_area / 10  # Assume 1 person per 10 m² if not specified
        if space.internal_load:
            if space.internal_load.people_count > 0:
                people = space.internal_load.people_count
            elif space.internal_load.people_per_area > 0:
                people = space.internal_load.people_per_area * space.floor_area

        oa_people = ventilation.outdoor_air_per_person * people
        oa_area = ventilation.outdoor_air_per_area * space.floor_area

        return oa_people + oa_area

    def _calculate_mixed_air_temp(
        self,
        total_flow: float,
        outdoor_flow: float,
        outdoor_temp: float,
        return_temp: float,
    ) -> float:
        """Calculate mixed air temperature."""
        if total_flow <= 0:
            return return_temp

        oa_fraction = outdoor_flow / total_flow
        oa_fraction = min(1.0, max(0.0, oa_fraction))

        mixed_temp = oa_fraction * outdoor_temp + (1 - oa_fraction) * return_temp
        return mixed_temp

    def _calculate_fan_power(
        self,
        flow_rate: float,
        pressure_rise: float,
        fan_efficiency: float,
        motor_efficiency: float,
    ) -> float:
        """Calculate fan power consumption."""
        # P = V_dot * delta_P / (eta_fan * eta_motor)
        if fan_efficiency <= 0 or motor_efficiency <= 0:
            return 0.0

        power = flow_rate * pressure_rise / (fan_efficiency * motor_efficiency)
        return power

    def _calculate_pump_power(
        self, flow_rate: float, head: float, efficiency: float
    ) -> float:
        """Calculate pump power consumption."""
        if efficiency <= 0:
            return 0.0

        # P = rho * g * Q * H / eta
        # head is in kPa, convert to m of water
        head_m = head / 9.81  # kPa to m
        power = RHO_WATER * GRAVITY * flow_rate * head_m / efficiency
        return power

    def _default_weather(self) -> WeatherData:
        """Return default weather data."""
        return WeatherData(
            name="Default",
            city="Default City",
            latitude=40.0,
            longitude=-100.0,
            elevation=200.0,
            cooling_db_004=35.0,
            cooling_wb_004=24.0,
            heating_db_996=-15.0,
        )

    def _default_cooling_design_day(self) -> DesignDay:
        """Return default cooling design day."""
        return DesignDay(
            name="Summer Design Day",
            day_type="cooling",
            month=7,
            day=21,
            dry_bulb_max=35.0,
            daily_range=11.0,
            wet_bulb_coincident=24.0,
        )

    def _default_heating_design_day(self) -> DesignDay:
        """Return default heating design day."""
        return DesignDay(
            name="Winter Design Day",
            day_type="heating",
            month=1,
            day=21,
            dry_bulb_max=-15.0,
            daily_range=0.0,
        )
