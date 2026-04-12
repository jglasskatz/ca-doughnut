from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import crud, schemas, models
from .database import engine, get_db, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Doughnut Economics API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/regions", response_model=list[schemas.RegionSummary])
def list_regions(db: Session = Depends(get_db)):
    return crud.get_regions(db)


@app.get("/api/regions/{slug}/doughnut", response_model=schemas.DoughnutOut)
def get_doughnut(slug: str, db: Session = Depends(get_db)):
    result = crud.get_doughnut(db, slug)
    if not result:
        raise HTTPException(status_code=404, detail="Region not found")
    return result


@app.get("/api/categories/{category_id}", response_model=schemas.CategoryOut)
def get_category(category_id: int, db: Session = Depends(get_db)):
    cat = crud.get_category(db, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat


@app.patch("/api/indicators/{indicator_id}", response_model=schemas.IndicatorOut)
def update_indicator(
    indicator_id: int,
    data: schemas.IndicatorUpdate,
    db: Session = Depends(get_db),
):
    indicator = crud.update_indicator(db, indicator_id, data)
    if not indicator:
        raise HTTPException(status_code=404, detail="Indicator not found")
    return indicator


@app.get("/api/regions/{slug}/contacts", response_model=list[schemas.ContactOut])
def list_contacts(slug: str, db: Session = Depends(get_db)):
    region = crud.get_region_by_slug(db, slug)
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")
    return db.query(models.Contact).filter(models.Contact.region_id == region.id).all()


@app.post("/api/regions/{slug}/contacts", response_model=schemas.ContactOut)
def create_contact(slug: str, data: schemas.ContactCreate, db: Session = Depends(get_db)):
    region = crud.get_region_by_slug(db, slug)
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")
    contact = models.Contact(region_id=region.id, **data.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact
