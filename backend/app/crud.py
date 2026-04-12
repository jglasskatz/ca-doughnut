from sqlalchemy.orm import Session, joinedload

from . import models, schemas


def get_regions(db: Session) -> list[models.Region]:
    return db.query(models.Region).all()


def get_region_by_slug(db: Session, slug: str) -> models.Region | None:
    return db.query(models.Region).filter(models.Region.slug == slug).first()


def get_doughnut(db: Session, slug: str) -> dict | None:
    region = (
        db.query(models.Region)
        .filter(models.Region.slug == slug)
        .first()
    )
    if not region:
        return None

    categories = (
        db.query(models.Category)
        .filter(models.Category.region_id == region.id)
        .options(joinedload(models.Category.indicators))
        .all()
    )

    social = [c for c in categories if c.ring == models.RingType.social]
    ecological = [c for c in categories if c.ring == models.RingType.ecological]

    return {"region": region, "social": social, "ecological": ecological}


def get_category(db: Session, category_id: int) -> models.Category | None:
    return (
        db.query(models.Category)
        .options(joinedload(models.Category.indicators))
        .filter(models.Category.id == category_id)
        .first()
    )


def update_indicator(
    db: Session, indicator_id: int, data: schemas.IndicatorUpdate
) -> models.Indicator | None:
    indicator = db.query(models.Indicator).filter(models.Indicator.id == indicator_id).first()
    if not indicator:
        return None
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(indicator, key, val)
    db.commit()
    db.refresh(indicator)
    return indicator
