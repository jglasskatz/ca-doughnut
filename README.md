# Doughnut Economics Interactive Platform

An interactive visualization platform for Doughnut Economics data — social foundations and ecological ceilings — for any region.

## Architecture

```
ca-doughnut/
├── backend/           # FastAPI + SQLite
│   ├── app/
│   │   ├── main.py    # API endpoints
│   │   ├── models.py  # SQLAlchemy models (Region, Category, Indicator)
│   │   ├── schemas.py # Pydantic request/response schemas
│   │   ├── crud.py    # Database queries
│   │   ├── database.py # DB connection
│   │   └── seed.py    # Seed script (California data)
│   └── requirements.txt
├── frontend/          # React + Vite + D3.js
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── DoughnutChart.tsx  # D3.js interactive doughnut
│   │   │   └── DetailPanel.tsx    # Click-to-expand details
│   │   ├── api/client.ts          # API client
│   │   └── types/index.ts         # TypeScript types
│   └── package.json
├── scripts/
│   └── ingest.py      # CSV → database ingestion
├── data/
│   └── california.csv # Example data (CA Doughnut 2025 report)
└── docs/
    └── design.md      # Architecture design document
```

## Quick Start

### 1. Backend

```bash
cd ca-doughnut
poetry install

# Ingest California data from CSV
poetry run python scripts/ingest.py data/california.csv

# Start the API
cd backend && poetry run uvicorn app.main:app --reload
```

API runs at http://localhost:8000. Docs at http://localhost:8000/docs.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at http://localhost:5173. Proxies `/api` to the backend.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/regions` | List all regions |
| GET | `/api/regions/{slug}/doughnut` | Full doughnut data for a region |
| GET | `/api/categories/{id}` | Deep dive on a category |
| PATCH | `/api/indicators/{id}` | Update an indicator |

## Adding a New Region

### Option A: CSV Ingestion (recommended)

1. Create a CSV file following the format in `data/california.csv`
2. Run: `poetry run python scripts/ingest.py data/your-region.csv`

### Option B: API

PATCH data via the API endpoints.

## CSV Format for Data Ingestion

Required columns:

| Column | Description | Example |
|--------|-------------|---------|
| `region_slug` | URL-safe ID | `california` |
| `region_name` | Display name | `State of California` |
| `region_type` | state, county, or city | `state` |
| `ring` | social or ecological | `social` |
| `category_slug` | URL-safe category | `climate-change` |
| `category_name` | Display name | `Climate Change` |
| `indicator_name` | Indicator name | `Greenhouse Gas Emissions` |
| `value` | Measured value | `1,890%` |
| `shortfall_pct` | Social shortfall % | `11` |
| `overshoot_pct` | Ecological overshoot % | `1890` |
| `source` | Data source | `Global Footprint Network` |

Optional: `population`, `region_description`, `category_description`, `indicator_description`, `year`, `target`, `source_url`, `policy_spotlight`, `justice_spotlight`, `context`.

## Instructions for AI Agents

To populate data for a new region:

1. Research the region's doughnut economics indicators using the framework:
   - **12 social foundation categories**: food, health, education, income & work, peace & justice, political voice, social cohesion, equity, housing, connectivity & transport, energy, water & sanitation
   - **9 ecological ceiling categories**: climate change, ocean acidification, chemical pollution, air pollution, freshwater use, land-use change, biodiversity loss, ozone depletion, nitrogen & phosphorus
2. For each category, find 2 representative indicators with:
   - A measurable value
   - A shortfall % (social) or overshoot % (ecological) — how far from the target
   - A credible source
3. Format as CSV matching `data/california.csv`
4. Run `python scripts/ingest.py data/<region>.csv`

## Data Model

- **Region**: A geographic area (state, county, city)
- **Category**: One of the 21 doughnut dimensions (12 social + 9 ecological)
- **Indicator**: A specific measurable metric within a category, with shortfall/overshoot percentages

All data is stored in SQLite (`doughnut.db`) — no external database needed.
