from sqlalchemy import create_engine, Column, String, Integer, Float, Text, DateTime, Enum, ForeignKey, Numeric
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
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

class ProjectStatus(str, enum.Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"

class ScopeItemStatus(str, enum.Enum):
    INCLUDED = "included"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class ScopeItemSource(str, enum.Enum):
    ORIGINAL = "original"
    CHANGE_REQUEST = "change_request"

class ChangeRequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=True)
    name = Column(String, nullable=False)
    company = Column(String, nullable=True)
    plan = Column(Enum(PlanType), default=PlanType.FREE)
    stripe_customer_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    projects = relationship("Project", back_populates="user")

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    client_name = Column(String, nullable=False)
    client_email = Column(String, nullable=False)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.ACTIVE)
    client_portal_token = Column(String, unique=True, default=generate_uuid)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="projects")
    scope_items = relationship("ScopeItem", back_populates="project", cascade="all, delete-orphan")
    change_requests = relationship("ChangeRequest", back_populates="project", cascade="all, delete-orphan")

class ScopeItem(Base):
    __tablename__ = "scope_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    source = Column(Enum(ScopeItemSource), default=ScopeItemSource.ORIGINAL)
    estimated_hours = Column(Float, default=0)
    estimated_cost = Column(Numeric(10, 2), default=0)
    status = Column(Enum(ScopeItemStatus), default=ScopeItemStatus.INCLUDED)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="scope_items")

class ChangeRequest(Base):
    __tablename__ = "change_requests"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    scope_item_id = Column(String, ForeignKey("scope_items.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    requested_by = Column(String, nullable=False)
    hours_delta = Column(Float, default=0)
    cost_delta = Column(Numeric(10, 2), default=0)
    status = Column(Enum(ChangeRequestStatus), default=ChangeRequestStatus.PENDING)
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(String, nullable=True)
    client_ip = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="change_requests")
