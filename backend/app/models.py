from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, Enum as SAEnum, JSON
from sqlalchemy.orm import relationship
import enum

from .database import Base


class RingType(str, enum.Enum):
    social = "social"
    ecological = "ecological"


class Region(Base):
    __tablename__ = "regions"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    region_type = Column(String, nullable=False)  # "state", "county", "city"
    parent_slug = Column(String, ForeignKey("regions.slug"), nullable=True)
    population = Column(String)
    description = Column(Text)

    categories = relationship("Category", back_populates="region", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)
    slug = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    ring = Column(SAEnum(RingType), nullable=False)
    icon = Column(String)
    description = Column(Text)
    context = Column(Text)
    policy_spotlight = Column(Text)
    justice_spotlight = Column(Text)
    actions = Column(JSON, default=list)  # ["action1", "action2", ...]

    region = relationship("Region", back_populates="categories")
    indicators = relationship("Indicator", back_populates="category", cascade="all, delete-orphan")


class Indicator(Base):
    __tablename__ = "indicators"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    value = Column(String)
    unit = Column(String)
    year = Column(Integer)
    shortfall_pct = Column(Float)  # social: % shortfall from foundation
    overshoot_pct = Column(Float)  # ecological: % overshoot beyond ceiling
    target = Column(String)
    source = Column(String)
    source_url = Column(String)

    category = relationship("Category", back_populates="indicators")


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)
    org = Column(String, nullable=False)
    person = Column(String)
    phone = Column(String)
    email = Column(String)
    website = Column(String)
    address = Column(String)
    tags = Column(JSON, default=list)         # ["social", "priority", ...]
    data_needs = Column(JSON, default=list)   # ["Need X data", ...]
    why = Column(Text)
    draft_message = Column(Text)

    region = relationship("Region")
