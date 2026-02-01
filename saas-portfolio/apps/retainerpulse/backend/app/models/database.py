from sqlalchemy import create_engine, Column, String, Integer, Float, Text, DateTime, Date, Enum, ForeignKey, Numeric, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, date
import uuid
import enum

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def generate_uuid():
    return str(uuid.uuid4())

class PlanType(str, enum.Enum):
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"

class RetainerStatus(str, enum.Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    ENDED = "ended"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=True)
    name = Column(String, nullable=False)
    plan = Column(Enum(PlanType), default=PlanType.FREE)
    created_at = Column(DateTime, default=datetime.utcnow)

    retainers = relationship("Retainer", back_populates="user")

class Retainer(Base):
    __tablename__ = "retainers"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    client_name = Column(String, nullable=False)
    client_email = Column(String, nullable=False)
    monthly_hours = Column(Float, nullable=False)
    hourly_rate = Column(Numeric(10, 2), default=0)
    rollover_enabled = Column(Boolean, default=False)
    rollover_cap = Column(Float, default=0)
    alert_threshold_80 = Column(Boolean, default=True)
    alert_threshold_100 = Column(Boolean, default=True)
    client_portal_token = Column(String, unique=True, default=generate_uuid)
    status = Column(Enum(RetainerStatus), default=RetainerStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="retainers")
    entries = relationship("HourEntry", back_populates="retainer", cascade="all, delete-orphan")
    snapshots = relationship("MonthlySnapshot", back_populates="retainer", cascade="all, delete-orphan")

class HourEntry(Base):
    __tablename__ = "hour_entries"

    id = Column(String, primary_key=True, default=generate_uuid)
    retainer_id = Column(String, ForeignKey("retainers.id"), nullable=False)
    date = Column(Date, nullable=False, default=date.today)
    hours = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    billable = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    retainer = relationship("Retainer", back_populates="entries")

class MonthlySnapshot(Base):
    __tablename__ = "monthly_snapshots"

    id = Column(String, primary_key=True, default=generate_uuid)
    retainer_id = Column(String, ForeignKey("retainers.id"), nullable=False)
    month = Column(Date, nullable=False)
    hours_used = Column(Float, default=0)
    hours_available = Column(Float, default=0)
    hours_rolled_over = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    retainer = relationship("Retainer", back_populates="snapshots")
