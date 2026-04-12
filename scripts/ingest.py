#!/usr/bin/env python3
"""
Doughnut Economics Data Ingestion Script

Reads a CSV file with indicator data and populates the SQLite database.
This script is designed to be run by any AI agent or human operator.

Usage:
    python scripts/ingest.py data/california.csv

CSV Format:
    The CSV must have these columns (order doesn't matter):
    - region_slug:       URL-safe identifier (e.g., "california", "santa-cruz")
    - region_name:       Display name (e.g., "State of California")
    - region_type:       One of: state, county, city
    - population:        Population string (e.g., "~39 million")
    - region_description: Brief description of the region
    - ring:              One of: social, ecological
    - category_slug:     URL-safe category name (e.g., "climate-change", "food")
    - category_name:     Display name (e.g., "Climate Change", "Food")
    - category_description: Brief description of the category
    - indicator_name:    Name of the indicator (e.g., "Greenhouse Gas Emissions")
    - indicator_description: What this indicator measures
    - value:             The measured value as a string (e.g., "1,890%", "11%")
    - shortfall_pct:     For social indicators: % shortfall from foundation (number or empty)
    - overshoot_pct:     For ecological indicators: % overshoot beyond ceiling (number or empty)
    - year:              Data year (integer or empty)
    - target:            Target/threshold description
    - source:            Source name
    - source_url:        URL to source

Optional columns (added to category if present):
    - policy_spotlight:  Policy context for the category
    - justice_spotlight: Justice/equity context for the category
    - context:           Additional context for the category
"""

import csv
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.database import engine, SessionLocal, Base
from app.models import Region, Category, Indicator, RingType


def ingest(csv_path: str):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    if not rows:
        print("CSV is empty. Nothing to ingest.")
        return

    # Track what we've created to avoid duplicates
    regions: dict[str, Region] = {}
    categories: dict[str, Category] = {}  # key = f"{region_slug}:{category_slug}"

    region_count = 0
    cat_count = 0
    ind_count = 0

    for row in rows:
        # --- Region ---
        r_slug = row["region_slug"].strip()
        if r_slug not in regions:
            existing = db.query(Region).filter(Region.slug == r_slug).first()
            if existing:
                regions[r_slug] = existing
            else:
                region = Region(
                    slug=r_slug,
                    name=row.get("region_name", r_slug).strip(),
                    region_type=row.get("region_type", "state").strip(),
                    population=row.get("population", "").strip() or None,
                    description=row.get("region_description", "").strip() or None,
                )
                db.add(region)
                db.flush()
                regions[r_slug] = region
                region_count += 1

        region = regions[r_slug]

        # --- Category ---
        c_slug = row["category_slug"].strip()
        cat_key = f"{r_slug}:{c_slug}"
        if cat_key not in categories:
            existing = (
                db.query(Category)
                .filter(Category.region_id == region.id, Category.slug == c_slug)
                .first()
            )
            if existing:
                categories[cat_key] = existing
            else:
                ring = RingType.social if row["ring"].strip() == "social" else RingType.ecological
                actions_raw = row.get("actions", "").strip()
                actions = [a.strip() for a in actions_raw.split("|") if a.strip()] if actions_raw else []
                cat = Category(
                    region_id=region.id,
                    slug=c_slug,
                    name=row.get("category_name", c_slug).strip(),
                    ring=ring,
                    description=row.get("category_description", "").strip() or None,
                    policy_spotlight=row.get("policy_spotlight", "").strip() or None,
                    justice_spotlight=row.get("justice_spotlight", "").strip() or None,
                    context=row.get("context", "").strip() or None,
                    actions=actions,
                )
                db.add(cat)
                db.flush()
                categories[cat_key] = cat
                cat_count += 1

        category = categories[cat_key]

        # --- Indicator ---
        shortfall = row.get("shortfall_pct", "").strip()
        overshoot = row.get("overshoot_pct", "").strip()
        year_str = row.get("year", "").strip()

        indicator = Indicator(
            category_id=category.id,
            name=row["indicator_name"].strip(),
            description=row.get("indicator_description", "").strip() or None,
            value=row.get("value", "").strip() or None,
            shortfall_pct=float(shortfall) if shortfall else None,
            overshoot_pct=float(overshoot) if overshoot else None,
            year=int(year_str) if year_str else None,
            target=row.get("target", "").strip() or None,
            source=row.get("source", "").strip() or None,
            source_url=row.get("source_url", "").strip() or None,
        )
        db.add(indicator)
        ind_count += 1

    db.commit()
    db.close()
    print(f"Ingested: {region_count} regions, {cat_count} categories, {ind_count} indicators.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/ingest.py <path-to-csv>")
        print("See docstring for CSV format requirements.")
        sys.exit(1)
    ingest(sys.argv[1])
