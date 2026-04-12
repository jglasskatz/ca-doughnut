#!/usr/bin/env python3
"""
Export database to static JSON files for GitHub Pages deployment.

Generates:
  frontend/public/api/regions.json
  frontend/public/api/regions/{slug}/doughnut.json
  frontend/public/api/regions/{slug}/contacts.json

The frontend API client detects these and uses them when no backend is available.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.database import SessionLocal, Base, engine
from app.models import Region, Category, Indicator, Contact, RingType
from sqlalchemy.orm import joinedload

Base.metadata.create_all(bind=engine)


def export():
    db = SessionLocal()
    out_dir = Path(__file__).resolve().parent.parent / "frontend" / "public" / "api"

    # Regions list
    regions = db.query(Region).all()
    regions_json = [
        {"id": r.id, "slug": r.slug, "name": r.name, "region_type": r.region_type,
         "population": r.population, "description": r.description}
        for r in regions
    ]
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "regions.json").write_text(json.dumps(regions_json, indent=2))

    # Per-region doughnut + contacts
    for region in regions:
        region_dir = out_dir / "regions" / region.slug
        region_dir.mkdir(parents=True, exist_ok=True)

        categories = (
            db.query(Category)
            .filter(Category.region_id == region.id)
            .options(joinedload(Category.indicators))
            .all()
        )

        def cat_to_dict(c):
            return {
                "id": c.id, "slug": c.slug, "name": c.name, "ring": c.ring.value,
                "icon": c.icon, "description": c.description, "context": c.context,
                "policy_spotlight": c.policy_spotlight, "justice_spotlight": c.justice_spotlight,
                "actions": c.actions or [],
                "indicators": [
                    {"id": i.id, "name": i.name, "description": i.description,
                     "value": i.value, "unit": i.unit, "year": i.year,
                     "shortfall_pct": i.shortfall_pct, "overshoot_pct": i.overshoot_pct,
                     "target": i.target, "source": i.source, "source_url": i.source_url}
                    for i in c.indicators
                ],
            }

        social = [cat_to_dict(c) for c in categories if c.ring == RingType.social]
        ecological = [cat_to_dict(c) for c in categories if c.ring == RingType.ecological]

        doughnut = {
            "region": regions_json[[r.slug for r in regions].index(region.slug)],
            "social": social,
            "ecological": ecological,
        }
        (region_dir / "doughnut.json").write_text(json.dumps(doughnut, indent=2))

        # Contacts
        contacts = db.query(Contact).filter(Contact.region_id == region.id).all()
        contacts_json = [
            {"id": c.id, "org": c.org, "person": c.person, "phone": c.phone,
             "email": c.email, "website": c.website, "address": c.address,
             "tags": c.tags or [], "data_needs": c.data_needs or [],
             "why": c.why, "draft_message": c.draft_message}
            for c in contacts
        ]
        (region_dir / "contacts.json").write_text(json.dumps(contacts_json, indent=2))

    db.close()

    total_cats = sum(len(d) for d in [social, ecological])
    print(f"Exported {len(regions)} region(s) to {out_dir}")
    print(f"Files: regions.json + {len(regions)} doughnut.json + {len(regions)} contacts.json")


if __name__ == "__main__":
    export()
