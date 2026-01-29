# -*- coding: utf-8 -*-
"""
SQLAlchemy database models for HVACplus.
"""

from datetime import datetime
from typing import Optional
import uuid

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, ForeignKey,
    Integer, String, Text, JSON, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    """User account."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    company = Column(String(255))

    # Account status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)

    # Credits
    credits = Column(Integer, default=5)  # Free credits on signup

    # Stripe
    stripe_customer_id = Column(String(255), unique=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)

    # Relationships
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    credit_transactions = relationship("CreditTransaction", back_populates="user")


class Project(Base):
    """HVAC load calculation project."""
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Project info
    name = Column(String(255), nullable=False)
    description = Column(Text)
    project_number = Column(String(100))
    client_name = Column(String(255))

    # Location
    address = Column(String(500))
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100))
    latitude = Column(Float)
    longitude = Column(Float)

    # Building info
    building_type = Column(String(50), default="office")
    total_floor_area = Column(Float)  # m²
    num_floors = Column(Integer, default=1)
    orientation = Column(Float, default=0.0)  # degrees from North

    # Status
    status = Column(String(50), default="draft")  # draft, processing, completed, error

    # Calculation settings
    calculation_method = Column(String(50), default="heat_balance")
    unit_system = Column(String(10), default="SI")  # SI, IP

    # Weather data
    weather_data = Column(JSON)
    design_conditions = Column(JSON)

    # Project settings (envelope, HVAC, calculation params)
    settings = Column(JSON)

    # Floorplan/geometry data
    floorplan_url = Column(String(500))  # URL to floorplan image
    obj_url = Column(String(500))  # URL to 3D OBJ file

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    calculated_at = Column(DateTime)

    # Credits used
    credits_used = Column(Integer, default=0)

    # Relationships
    user = relationship("User", back_populates="projects")
    spaces = relationship("Space", back_populates="project", cascade="all, delete-orphan")
    zones = relationship("Zone", back_populates="project", cascade="all, delete-orphan")
    systems = relationship("System", back_populates="project", cascade="all, delete-orphan")
    calculation_results = relationship("CalculationResult", back_populates="project", cascade="all, delete-orphan")
    uploaded_files = relationship("UploadedFile", back_populates="project", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_projects_user_id_created", "user_id", "created_at"),
    )


class Space(Base):
    """Building space/room."""
    __tablename__ = "spaces"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    zone_id = Column(UUID(as_uuid=True), ForeignKey("zones.id"))

    # Space info
    name = Column(String(255), nullable=False)
    space_type = Column(String(50), default="office_enclosed")
    floor_number = Column(Integer, default=1)

    # Geometry
    floor_area = Column(Float)  # m²
    volume = Column(Float)  # m³
    height = Column(Float, default=3.0)  # m
    x = Column(Float, default=0.0)
    y = Column(Float, default=0.0)
    z = Column(Float, default=0.0)
    width = Column(Float)
    depth = Column(Float)

    # Design conditions
    cooling_setpoint = Column(Float, default=24.0)  # °C
    heating_setpoint = Column(Float, default=21.0)  # °C

    # Internal loads
    people_count = Column(Float, default=0)
    people_per_area = Column(Float, default=0.1)  # people/m²
    lighting_power_density = Column(Float, default=10.0)  # W/m²
    equipment_power_density = Column(Float, default=10.0)  # W/m²

    # Infiltration
    infiltration_ach = Column(Float, default=0.3)  # ACH

    # Ventilation
    outdoor_air_per_person = Column(Float, default=0.0025)  # m³/s/person
    outdoor_air_per_area = Column(Float, default=0.0003)  # m³/s/m²

    # Surfaces and constructions (JSON for flexibility)
    surfaces = Column(JSON)  # List of surfaces with properties
    fenestrations = Column(JSON)  # List of windows/doors

    # Multiplier
    multiplier = Column(Integer, default=1)

    # Relationships
    project = relationship("Project", back_populates="spaces")
    zone = relationship("Zone", back_populates="spaces")


class Zone(Base):
    """HVAC zone grouping spaces."""
    __tablename__ = "zones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    system_id = Column(UUID(as_uuid=True), ForeignKey("systems.id"))

    name = Column(String(255), nullable=False)

    # Design conditions
    cooling_setpoint = Column(Float, default=24.0)
    heating_setpoint = Column(Float, default=21.0)

    # Sizing factors
    cooling_sizing_factor = Column(Float, default=1.15)
    heating_sizing_factor = Column(Float, default=1.25)

    # Relationships
    project = relationship("Project", back_populates="zones")
    system = relationship("System", back_populates="zones")
    spaces = relationship("Space", back_populates="zone")


class System(Base):
    """HVAC system."""
    __tablename__ = "systems"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)

    name = Column(String(255), nullable=False)
    system_type = Column(String(50), default="vav")

    # Supply air conditions
    cooling_supply_temp = Column(Float, default=13.0)
    heating_supply_temp = Column(Float, default=35.0)

    # Fan parameters
    fan_efficiency = Column(Float, default=0.7)
    fan_pressure_rise = Column(Float, default=1000.0)  # Pa

    # Sizing factors
    cooling_sizing_factor = Column(Float, default=1.1)
    heating_sizing_factor = Column(Float, default=1.1)

    # Relationships
    project = relationship("Project", back_populates="systems")
    zones = relationship("Zone", back_populates="system")


class CalculationResult(Base):
    """Stored calculation results."""
    __tablename__ = "calculation_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)

    # Result type
    result_type = Column(String(50))  # space, zone, system, plant, project
    entity_id = Column(UUID(as_uuid=True))  # ID of space/zone/system/plant
    entity_name = Column(String(255))

    # Peak loads
    peak_cooling_sensible = Column(Float)
    peak_cooling_latent = Column(Float)
    peak_cooling_total = Column(Float)
    peak_heating = Column(Float)

    # Per unit area
    cooling_w_per_m2 = Column(Float)
    heating_w_per_m2 = Column(Float)

    # Airflow
    supply_airflow = Column(Float)  # m³/s
    outdoor_airflow = Column(Float)  # m³/s

    # Full results JSON
    full_results = Column(JSON)

    # Hourly profiles
    cooling_hourly_profile = Column(JSON)
    heating_hourly_profile = Column(JSON)

    # Timestamps
    calculated_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="calculation_results")


class UploadedFile(Base):
    """Uploaded files (floorplans, etc.)."""
    __tablename__ = "uploaded_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)

    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255))
    file_type = Column(String(50))  # floorplan, report, export
    mime_type = Column(String(100))
    file_size = Column(Integer)  # bytes

    # Storage
    storage_path = Column(String(500))

    # Processing status
    status = Column(String(50), default="uploaded")  # uploaded, processing, processed, error
    processing_result = Column(JSON)  # GEM-AI extraction results

    # Timestamps
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime)

    # Relationships
    project = relationship("Project", back_populates="uploaded_files")


class CreditTransaction(Base):
    """Credit purchase and usage transactions."""
    __tablename__ = "credit_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"))

    # Transaction type
    transaction_type = Column(String(50))  # purchase, usage, refund, bonus

    # Amount
    credits = Column(Integer, nullable=False)  # Positive for add, negative for use
    balance_after = Column(Integer)

    # Purchase details
    amount_cents = Column(Integer)  # For purchases
    stripe_payment_id = Column(String(255))
    stripe_invoice_id = Column(String(255))

    # Description
    description = Column(Text)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="credit_transactions")


class WeatherLocation(Base):
    """Pre-loaded weather/design condition data."""
    __tablename__ = "weather_locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Location
    city = Column(String(100), nullable=False)
    state = Column(String(100))
    country = Column(String(100), nullable=False)
    wmo_station = Column(String(20))

    # Coordinates
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation = Column(Float)  # m
    timezone = Column(Float)  # hours from UTC

    # ASHRAE design conditions
    cooling_db_04 = Column(Float)  # 0.4% cooling DB
    cooling_wb_04 = Column(Float)  # 0.4% cooling WB
    cooling_db_1 = Column(Float)  # 1% cooling DB
    cooling_wb_1 = Column(Float)  # 1% cooling WB
    cooling_db_2 = Column(Float)  # 2% cooling DB

    heating_db_996 = Column(Float)  # 99.6% heating DB
    heating_db_99 = Column(Float)  # 99% heating DB
    heating_wind_996 = Column(Float)  # 99.6% heating wind speed

    # Monthly data (JSON arrays)
    monthly_db_mean = Column(JSON)
    monthly_ground_temp = Column(JSON)

    # Full data
    full_data = Column(JSON)

    __table_args__ = (
        Index("ix_weather_city_country", "city", "country"),
        Index("ix_weather_coords", "latitude", "longitude"),
    )
