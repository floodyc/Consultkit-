# -*- coding: utf-8 -*-
"""
Weather and design conditions endpoints.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.api.endpoints.auth import get_current_user

router = APIRouter()


# Pydantic models
class DesignConditions(BaseModel):
    cooling_db_04: float  # 0.4% cooling dry-bulb
    cooling_wb_04: float  # 0.4% cooling wet-bulb
    cooling_db_1: float  # 1% cooling dry-bulb
    cooling_db_2: float  # 2% cooling dry-bulb
    heating_db_996: float  # 99.6% heating dry-bulb
    heating_db_99: float  # 99% heating dry-bulb
    heating_wind_996: float  # 99.6% heating wind speed
    daily_range: float  # Daily temperature range


class WeatherLocation(BaseModel):
    id: str
    city: str
    state: Optional[str]
    country: str
    wmo_station: Optional[str]
    latitude: float
    longitude: float
    elevation: float
    timezone: float
    design_conditions: DesignConditions


class LocationSearchResult(BaseModel):
    locations: List[WeatherLocation]
    total: int


# Sample weather data (in production, load from ASHRAE database)
SAMPLE_LOCATIONS = [
    WeatherLocation(
        id="us-new-york",
        city="New York",
        state="NY",
        country="USA",
        wmo_station="725033",
        latitude=40.78,
        longitude=-73.97,
        elevation=40.0,
        timezone=-5.0,
        design_conditions=DesignConditions(
            cooling_db_04=33.3,
            cooling_wb_04=23.8,
            cooling_db_1=31.7,
            cooling_db_2=30.0,
            heating_db_996=-12.2,
            heating_db_99=-9.4,
            heating_wind_996=11.2,
            daily_range=8.3,
        ),
    ),
    WeatherLocation(
        id="us-los-angeles",
        city="Los Angeles",
        state="CA",
        country="USA",
        wmo_station="722950",
        latitude=33.94,
        longitude=-118.41,
        elevation=30.0,
        timezone=-8.0,
        design_conditions=DesignConditions(
            cooling_db_04=32.2,
            cooling_wb_04=20.6,
            cooling_db_1=30.6,
            cooling_db_2=28.9,
            heating_db_996=6.1,
            heating_db_99=7.2,
            heating_wind_996=7.7,
            daily_range=10.0,
        ),
    ),
    WeatherLocation(
        id="us-chicago",
        city="Chicago",
        state="IL",
        country="USA",
        wmo_station="725300",
        latitude=41.99,
        longitude=-87.91,
        elevation=190.0,
        timezone=-6.0,
        design_conditions=DesignConditions(
            cooling_db_04=33.3,
            cooling_wb_04=23.9,
            cooling_db_1=31.7,
            cooling_db_2=30.0,
            heating_db_996=-20.6,
            heating_db_99=-17.2,
            heating_wind_996=11.7,
            daily_range=10.0,
        ),
    ),
    WeatherLocation(
        id="us-miami",
        city="Miami",
        state="FL",
        country="USA",
        wmo_station="722020",
        latitude=25.79,
        longitude=-80.32,
        elevation=4.0,
        timezone=-5.0,
        design_conditions=DesignConditions(
            cooling_db_04=33.3,
            cooling_wb_04=25.6,
            cooling_db_1=32.8,
            cooling_db_2=32.2,
            heating_db_996=8.3,
            heating_db_99=10.0,
            heating_wind_996=9.3,
            daily_range=8.3,
        ),
    ),
    WeatherLocation(
        id="ca-vancouver",
        city="Vancouver",
        state="BC",
        country="Canada",
        wmo_station="718920",
        latitude=49.19,
        longitude=-123.18,
        elevation=4.0,
        timezone=-8.0,
        design_conditions=DesignConditions(
            cooling_db_04=26.1,
            cooling_wb_04=18.3,
            cooling_db_1=24.4,
            cooling_db_2=22.8,
            heating_db_996=-7.8,
            heating_db_99=-5.6,
            heating_wind_996=8.8,
            daily_range=8.3,
        ),
    ),
    WeatherLocation(
        id="ca-toronto",
        city="Toronto",
        state="ON",
        country="Canada",
        wmo_station="716240",
        latitude=43.68,
        longitude=-79.63,
        elevation=173.0,
        timezone=-5.0,
        design_conditions=DesignConditions(
            cooling_db_04=31.1,
            cooling_wb_04=22.8,
            cooling_db_1=29.4,
            cooling_db_2=27.8,
            heating_db_996=-18.9,
            heating_db_99=-16.1,
            heating_wind_996=12.0,
            daily_range=9.4,
        ),
    ),
    WeatherLocation(
        id="uk-london",
        city="London",
        state=None,
        country="United Kingdom",
        wmo_station="037720",
        latitude=51.48,
        longitude=-0.45,
        elevation=24.0,
        timezone=0.0,
        design_conditions=DesignConditions(
            cooling_db_04=28.3,
            cooling_wb_04=19.4,
            cooling_db_1=26.7,
            cooling_db_2=25.0,
            heating_db_996=-3.9,
            heating_db_99=-2.2,
            heating_wind_996=10.3,
            daily_range=8.9,
        ),
    ),
    WeatherLocation(
        id="au-sydney",
        city="Sydney",
        state="NSW",
        country="Australia",
        wmo_station="947670",
        latitude=-33.95,
        longitude=151.18,
        elevation=6.0,
        timezone=10.0,
        design_conditions=DesignConditions(
            cooling_db_04=33.9,
            cooling_wb_04=22.2,
            cooling_db_1=31.7,
            cooling_db_2=29.4,
            heating_db_996=6.1,
            heating_db_99=7.2,
            heating_wind_996=10.3,
            daily_range=10.0,
        ),
    ),
    WeatherLocation(
        id="ae-dubai",
        city="Dubai",
        state=None,
        country="UAE",
        wmo_station="411940",
        latitude=25.25,
        longitude=55.33,
        elevation=5.0,
        timezone=4.0,
        design_conditions=DesignConditions(
            cooling_db_04=44.4,
            cooling_wb_04=30.0,
            cooling_db_1=43.3,
            cooling_db_2=42.2,
            heating_db_996=10.6,
            heating_db_99=12.2,
            heating_wind_996=8.2,
            daily_range=11.1,
        ),
    ),
    WeatherLocation(
        id="sg-singapore",
        city="Singapore",
        state=None,
        country="Singapore",
        wmo_station="486980",
        latitude=1.37,
        longitude=103.98,
        elevation=16.0,
        timezone=8.0,
        design_conditions=DesignConditions(
            cooling_db_04=33.3,
            cooling_wb_04=27.2,
            cooling_db_1=32.8,
            cooling_db_2=32.2,
            heating_db_996=23.3,
            heating_db_99=23.9,
            heating_wind_996=5.1,
            daily_range=6.7,
        ),
    ),
]


@router.get("/locations/search", response_model=LocationSearchResult)
async def search_locations(
    query: str = Query(..., min_length=2),
    country: Optional[str] = None,
    limit: int = Query(10, ge=1, le=50),
):
    """
    Search for weather locations by city name.
    """
    query_lower = query.lower()

    results = [
        loc for loc in SAMPLE_LOCATIONS
        if query_lower in loc.city.lower()
        or (loc.state and query_lower in loc.state.lower())
    ]

    if country:
        results = [loc for loc in results if loc.country.lower() == country.lower()]

    return LocationSearchResult(
        locations=results[:limit],
        total=len(results),
    )


@router.get("/locations/{location_id}", response_model=WeatherLocation)
async def get_location(location_id: str):
    """
    Get weather data for a specific location.
    """
    location = next((loc for loc in SAMPLE_LOCATIONS if loc.id == location_id), None)

    if not location:
        raise HTTPException(
            status_code=404,
            detail="Location not found",
        )

    return location


@router.get("/locations/nearby", response_model=LocationSearchResult)
async def find_nearby_locations(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(100, ge=1, le=500),
    limit: int = Query(5, ge=1, le=20),
):
    """
    Find weather locations near a coordinate.
    """
    import math

    def haversine_distance(lat1, lon1, lat2, lon2):
        R = 6371  # Earth's radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        return R * c

    # Calculate distances
    locations_with_dist = []
    for loc in SAMPLE_LOCATIONS:
        dist = haversine_distance(latitude, longitude, loc.latitude, loc.longitude)
        if dist <= radius_km:
            locations_with_dist.append((loc, dist))

    # Sort by distance
    locations_with_dist.sort(key=lambda x: x[1])

    results = [loc for loc, _ in locations_with_dist[:limit]]

    return LocationSearchResult(
        locations=results,
        total=len(results),
    )


@router.get("/design-conditions/custom")
async def get_custom_design_conditions(
    cooling_db: float = Query(..., description="Summer design dry-bulb temperature (°C)"),
    cooling_wb: float = Query(..., description="Summer design wet-bulb temperature (°C)"),
    heating_db: float = Query(..., description="Winter design dry-bulb temperature (°C)"),
    daily_range: float = Query(10.0, description="Daily temperature range (°C)"),
):
    """
    Create custom design conditions for locations not in the database.
    """
    return {
        "design_conditions": {
            "cooling_db_04": cooling_db,
            "cooling_wb_04": cooling_wb,
            "cooling_db_1": cooling_db - 1.5,
            "cooling_db_2": cooling_db - 3.0,
            "heating_db_996": heating_db,
            "heating_db_99": heating_db + 2.0,
            "heating_wind_996": 5.0,
            "daily_range": daily_range,
        },
        "source": "custom",
        "note": "Custom design conditions - verify with local weather data",
    }
