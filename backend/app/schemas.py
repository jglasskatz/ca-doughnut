from pydantic import BaseModel


class IndicatorOut(BaseModel):
    id: int
    name: str
    description: str | None = None
    value: str | None = None
    unit: str | None = None
    year: int | None = None
    shortfall_pct: float | None = None
    overshoot_pct: float | None = None
    target: str | None = None
    source: str | None = None
    source_url: str | None = None

    model_config = {"from_attributes": True}


class CategoryOut(BaseModel):
    id: int
    slug: str
    name: str
    ring: str
    icon: str | None = None
    description: str | None = None
    context: str | None = None
    policy_spotlight: str | None = None
    justice_spotlight: str | None = None
    actions: list[str] = []
    indicators: list[IndicatorOut] = []

    model_config = {"from_attributes": True}


class RegionSummary(BaseModel):
    id: int
    slug: str
    name: str
    region_type: str
    population: str | None = None
    description: str | None = None

    model_config = {"from_attributes": True}


class DoughnutOut(BaseModel):
    region: RegionSummary
    social: list[CategoryOut]
    ecological: list[CategoryOut]


class IndicatorCreate(BaseModel):
    name: str
    description: str | None = None
    value: str | None = None
    unit: str | None = None
    year: int | None = None
    shortfall_pct: float | None = None
    overshoot_pct: float | None = None
    target: str | None = None
    source: str | None = None
    source_url: str | None = None


class CategoryCreate(BaseModel):
    slug: str
    name: str
    ring: str
    icon: str | None = None
    description: str | None = None
    context: str | None = None
    policy_spotlight: str | None = None
    justice_spotlight: str | None = None
    indicators: list[IndicatorCreate] = []


class IndicatorUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    value: str | None = None
    unit: str | None = None
    year: int | None = None
    shortfall_pct: float | None = None
    overshoot_pct: float | None = None
    target: str | None = None
    source: str | None = None
    source_url: str | None = None


class ContactOut(BaseModel):
    id: int
    org: str
    person: str | None = None
    phone: str | None = None
    email: str | None = None
    website: str | None = None
    address: str | None = None
    tags: list[str] = []
    data_needs: list[str] = []
    why: str | None = None
    draft_message: str | None = None

    model_config = {"from_attributes": True}


class ContactCreate(BaseModel):
    org: str
    person: str | None = None
    phone: str | None = None
    email: str | None = None
    website: str | None = None
    address: str | None = None
    tags: list[str] = []
    data_needs: list[str] = []
    why: str | None = None
    draft_message: str | None = None
