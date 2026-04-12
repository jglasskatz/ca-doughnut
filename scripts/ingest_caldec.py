#!/usr/bin/env python3
"""
Ingest data from CalDEC-formatted spreadsheets (social + ecological CSVs).

This script parses the California Doughnut Economics Coalition spreadsheet format,
which has separate tabs for Social Foundation and Ecological Ceiling.

Usage:
    python scripts/ingest_caldec.py <region_slug> <region_name> <social_csv> <ecological_csv>

Example:
    python scripts/ingest_caldec.py california "State of California" \
        data/raw_social.csv data/raw_ecological.csv

CSV Format (Social):
    Social Foundation, Abreviation, Indicator and Unit, California, Desirable,
    Shortfall, Average, Year (Measured / Published), Reference, Link, Notes

CSV Format (Ecological):
    Ecological Ceiling, Abreviation, Indicator, Unit, California, Desirable,
    Overshoot, Average, Year (Measured / Published), Reference, Link, Notes
"""

import csv
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.database import engine, SessionLocal, Base
from app.models import Region, Category, Indicator, RingType


def parse_pct(val: str) -> float | None:
    """Extract a percentage number from a string like '40.0%', '1890%', etc."""
    if not val:
        return None
    m = re.search(r"([\d.]+)\s*%", val.strip())
    if m:
        return float(m.group(1))
    return None


def parse_year(val: str) -> int | None:
    """Extract the measurement year from 'YYYY / YYYY' format."""
    if not val:
        return None
    m = re.search(r"(\d{4})", val.strip())
    return int(m.group(1)) if m else None


def clean_ref(val: str) -> str:
    """Strip leading '1) ' from reference text."""
    return re.sub(r"^\d+\)\s*", "", val.strip()) if val else ""


def clean_url(val: str) -> str:
    """Strip leading '1) ' from URL."""
    return re.sub(r"^\d+\)\s*", "", val.strip()).split("\n")[0].strip() if val else ""


def slugify(name: str) -> str:
    """Convert a category name to a URL-safe slug."""
    s = name.lower().strip()
    s = re.sub(r"[&]", "and", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def ingest_social(db, region, csv_path: str):
    """Parse CalDEC social foundation CSV."""
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    categories: dict[str, Category] = {}
    ind_count = 0

    for row in rows:
        cat_name = row.get("Social Foundation", "").strip()
        if not cat_name or cat_name.lower() == "summary":
            continue

        slug = slugify(cat_name)
        if slug not in categories:
            cat = Category(
                region_id=region.id,
                slug=slug,
                name=cat_name,
                ring=RingType.social,
            )
            db.add(cat)
            db.flush()
            categories[slug] = cat

        category = categories[slug]

        abbrev = row.get("Abreviation", "").strip()
        indicator_desc = row.get("Indicator and Unit", "").strip()
        # Strip leading number "1. " or "2. "
        indicator_desc = re.sub(r"^\d+\.\s*", "", indicator_desc)

        shortfall_str = row.get("Shortfall", "").strip()
        shortfall = parse_pct(shortfall_str)

        ca_val = row.get("California", "").strip()
        desirable = row.get("Desirable", "").strip()
        year = parse_year(row.get("Year (Measured / Published)", ""))
        ref = clean_ref(row.get("Reference", ""))
        url = clean_url(row.get("Link", ""))

        # Build the display value
        value = shortfall_str if shortfall_str else ca_val or "Data pending"

        target = f"{desirable}" if desirable else None

        indicator = Indicator(
            category_id=category.id,
            name=abbrev or cat_name,
            description=indicator_desc,
            value=value,
            shortfall_pct=shortfall,
            year=year,
            target=target,
            source=ref or None,
            source_url=url or None,
        )
        db.add(indicator)
        ind_count += 1

    return len(categories), ind_count


def ingest_ecological(db, region, csv_path: str):
    """Parse CalDEC ecological ceiling CSV."""
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    categories: dict[str, Category] = {}
    ind_count = 0

    for row in rows:
        cat_name = row.get("Ecological Ceiling", "").strip()
        if not cat_name or cat_name.lower() == "summary":
            continue

        slug = slugify(cat_name)
        if slug not in categories:
            cat = Category(
                region_id=region.id,
                slug=slug,
                name=cat_name,
                ring=RingType.ecological,
            )
            db.add(cat)
            db.flush()
            categories[slug] = cat

        category = categories[slug]

        abbrev = row.get("Abreviation", "").strip()
        indicator_desc = row.get("Indicator", "").strip()
        indicator_desc = re.sub(r"^\d+\.\s*", "", indicator_desc)
        unit = row.get("Unit", "").strip()

        overshoot_str = row.get("Overshoot", "").strip()
        average_str = row.get("Average", "").strip()
        overshoot = parse_pct(overshoot_str) or parse_pct(average_str)

        ca_val = row.get("California", "").strip()
        desirable = row.get("Desirable", "").strip()
        year = parse_year(row.get("Year (Measured / Published)", ""))
        ref = clean_ref(row.get("Reference", ""))
        url = clean_url(row.get("Link", ""))

        value = overshoot_str if overshoot_str else ca_val or "Data pending"
        target = f"{desirable}" if desirable else None

        indicator = Indicator(
            category_id=category.id,
            name=abbrev or cat_name,
            description=indicator_desc,
            value=value,
            unit=unit or None,
            overshoot_pct=overshoot,
            year=year,
            target=target,
            source=ref or None,
            source_url=url or None,
        )
        db.add(indicator)
        ind_count += 1

    return len(categories), ind_count


def main():
    if len(sys.argv) < 5:
        print("Usage: python scripts/ingest_caldec.py <region_slug> <region_name> <social_csv> <ecological_csv>")
        print()
        print("Example:")
        print('  python scripts/ingest_caldec.py california "State of California" \\')
        print("    data/raw_social.csv data/raw_ecological.csv")
        sys.exit(1)

    region_slug = sys.argv[1]
    region_name = sys.argv[2]
    social_csv = sys.argv[3]
    eco_csv = sys.argv[4]

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Create or get region
    region = db.query(Region).filter(Region.slug == region_slug).first()
    if region:
        # Clear existing data for re-import
        db.query(Indicator).filter(
            Indicator.category_id.in_(
                db.query(Category.id).filter(Category.region_id == region.id)
            )
        ).delete(synchronize_session=False)
        db.query(Category).filter(Category.region_id == region.id).delete(synchronize_session=False)
        db.flush()
    else:
        region = Region(
            slug=region_slug,
            name=region_name,
            region_type="state",
            population="~39 million",
            description="California is the US's 3rd largest state by land mass and has its largest population, with over 39 million residents.",
        )
        db.add(region)
        db.flush()

    soc_cats, soc_inds = ingest_social(db, region, social_csv)
    eco_cats, eco_inds = ingest_ecological(db, region, eco_csv)

    db.commit()
    db.close()

    print(f"Ingested {region_name}:")
    print(f"  Social: {soc_cats} categories, {soc_inds} indicators")
    print(f"  Ecological: {eco_cats} categories, {eco_inds} indicators")
    print(f"  Total: {soc_cats + eco_cats} categories, {soc_inds + eco_inds} indicators")


if __name__ == "__main__":
    main()
