# Doughnut Economics Interactive Visualization Platform

## Design Document

---

## 1. Overview

### What This Is

An open-source, interactive web platform for visualizing Doughnut Economics data at
the state, county, or city level. The first deployment uses the California Doughnut
Economics Coalition's 2025 report (42 indicators across 21 categories), but the
platform is designed so that any region can load its own data and get a working
doughnut visualization without changing application code.

### Who It's For

- **Policymakers** evaluating social and ecological performance at a glance.
- **Researchers** exploring indicator data, sources, and methodology.
- **Community organizations** communicating where their region is thriving or falling short.
- **Other doughnut coalitions** who want to publish their own regional portrait without
  building a platform from scratch.

### Design Goals

1. **Data-driven, not hard-coded.** The visualization renders whatever is in the
   database. Adding a new region means inserting rows, not writing code.
2. **Portable.** SQLite ships as a single file. The entire app can run on a laptop,
   a $5/month VPS, or a static export to GitHub Pages.
3. **Faithful to the framework.** The visual language matches the Doughnut Economics
   conventions: shortfall extends inward, overshoot extends outward, the "safe and
   just space" is the ring between them.

---

## 2. Data Model

### 2.1 Conceptual Model

The Doughnut framework has a fixed structure:

```
Region
  -> has many RegionIndicators
       -> each links to an Indicator
            -> each belongs to a Category
                 -> each is either "social" or "ecological"
```

A **Category** is one of the 21 dimensions (e.g., "Climate Change", "Food", "Housing").
Each category has exactly 2 indicators in the California report, though the schema
allows any number. Categories belong to one of two rings:

- **Social Foundation** (12 categories, 24 indicators) -- scored by **shortfall %**
  (how far below the threshold people fall).
- **Ecological Ceiling** (9 categories, 18 indicators) -- scored by **overshoot %**
  (how far beyond the planetary boundary the region extends).

### 2.2 SQLAlchemy Models / SQLite Schema

#### `regions`

| Column        | Type         | Notes                                      |
|---------------|--------------|--------------------------------------------|
| `id`          | Integer, PK  | Auto-increment                             |
| `slug`        | String(100)  | URL-safe identifier, unique. e.g. `california`, `santa-cruz` |
| `name`        | String(200)  | Display name. e.g. "State of California"   |
| `region_type` | String(50)   | One of: `state`, `county`, `city`, `nation`, `custom` |
| `parent_id`   | Integer, FK  | Nullable. Points to parent region (e.g. city -> county -> state) |
| `population`  | Integer      | Nullable. Most recent population estimate  |
| `description` | Text         | Nullable. Brief context paragraph          |
| `created_at`  | DateTime     | Auto-set                                   |
| `updated_at`  | DateTime     | Auto-set on update                         |

The `parent_id` self-reference allows a region hierarchy (California > Santa Cruz County
> City of Santa Cruz) which supports drill-down navigation in the future.

#### `categories`

| Column         | Type         | Notes                                     |
|----------------|--------------|-------------------------------------------|
| `id`           | Integer, PK  | Auto-increment                            |
| `slug`         | String(100)  | URL-safe identifier, unique. e.g. `climate-change` |
| `name`         | String(200)  | Display name. e.g. "Climate Change"       |
| `ring`         | String(20)   | `social` or `ecological`                  |
| `display_order`| Integer      | Position in the doughnut (clockwise from top) |
| `icon`         | String(50)   | Nullable. Icon identifier for the UI      |
| `description`  | Text         | Nullable. What this category measures     |

The 21 categories for California:

**Social Foundation (12):**
Food, Health, Education, Income & Work, Peace & Justice, Political Voice,
Social Cohesion, Equity, Housing, Connectivity & Transport, Energy,
Water & Sanitation

**Ecological Ceiling (9):**
Climate Change, Ocean Acidification, Chemical Pollution, Air Pollution,
Freshwater Use, Land-Use Change, Biodiversity Loss, Nitrogen & Phosphorus,
Ozone Depletion

#### `indicators`

| Column              | Type         | Notes                                  |
|---------------------|--------------|----------------------------------------|
| `id`                | Integer, PK  | Auto-increment                        |
| `category_id`       | Integer, FK  | References `categories.id`            |
| `slug`              | String(100)  | URL-safe identifier, unique within category |
| `name`              | String(200)  | e.g. "Food Insecurity"                |
| `description`       | Text         | Full definition. e.g. "Percent of households who live with food insecurity" |
| `unit`              | String(100)  | e.g. `%`, `Tonnes CO2 eq`, `pH`, `Global Hectares` |
| `is_global`         | Boolean      | True if this is a consumption/global metric vs local/territorial |
| `display_order`     | Integer      | Position within category (1, 2, ...)  |

This table defines _what_ is measured. It is region-independent -- the same indicator
definition applies everywhere, only the values differ.

#### `region_indicators`

| Column            | Type          | Notes                                    |
|-------------------|---------------|------------------------------------------|
| `id`              | Integer, PK   | Auto-increment                          |
| `region_id`       | Integer, FK   | References `regions.id`                 |
| `indicator_id`    | Integer, FK   | References `indicators.id`             |
| `value`           | Float         | The measured value (e.g. 11.4 for 11.4%) |
| `value_display`   | String(100)   | Nullable. Formatted string if the raw number needs context (e.g. "Yes", "6 out of 10") |
| `desirable`       | Float         | The target/threshold value (e.g. 0 for 0% food insecurity) |
| `desirable_display`| String(100)  | Nullable. Formatted threshold           |
| `score_pct`       | Float         | **Shortfall % (social) or Overshoot % (ecological).** This is the key visualization value. |
| `year`            | Integer       | Year the data was measured              |
| `source`          | String(500)   | Source name                             |
| `source_url`      | String(500)   | Nullable. URL to the source             |
| `notes`           | Text          | Nullable. Methodology notes, caveats   |
| `created_at`      | DateTime      | Auto-set                                |
| `updated_at`      | DateTime      | Auto-set on update                      |

**Unique constraint:** `(region_id, indicator_id)` -- one value per indicator per region.
(Time series support is discussed in Future Considerations.)

### 2.3 How Scoring Works

**Social Foundation -- Shortfall %**

Shortfall represents the percentage of the population falling below a social threshold.
A shortfall of 0% means everyone meets the threshold (thriving). Higher values mean
more people are left behind.

Example: Food Insecurity = 11.4% means 11.4% of households are food insecure.
The desirable target is 0%. The shortfall is 11.4%.

**Ecological Ceiling -- Overshoot %**

Overshoot represents how far beyond a planetary boundary the region has gone,
expressed as a percentage of the boundary value.

Example: Greenhouse Gas Footprint. California's consumption-based footprint is
19.6 tonnes CO2eq per capita. The boundary is 0.985 tonnes. Overshoot =
(19.6 - 0.985) / 0.985 * 100 = 1,890%.

An overshoot of 0% means the region is within the boundary. Ozone Depletion is
the only California ecological category at 0% overshoot.

**Category-Level Aggregation**

Each category has 2 indicators. The category's overall score for the visualization
is the average of its indicators' `score_pct` values. The API returns both the
per-indicator scores and the aggregated category score so the frontend can render
either view.

#### `category_deep_dives`

| Column            | Type          | Notes                                    |
|-------------------|---------------|------------------------------------------|
| `id`              | Integer, PK   | Auto-increment                          |
| `region_id`       | Integer, FK   | References `regions.id`                 |
| `category_id`     | Integer, FK   | References `categories.id`             |
| `context`         | Text          | Nullable. Narrative explanation of the category for this region |
| `policy_spotlight`| Text          | Nullable. Markdown/plain text. Key policies affecting this category |
| `justice_spotlight`| Text         | Nullable. Markdown/plain text. Equity and justice considerations |
| `image_url`       | String(500)   | Nullable. Map, chart, or supporting image |

**Unique constraint:** `(region_id, category_id)`

This table stores the rich narrative content from the report's deep-dive pages.
It is optional -- a region can have indicator data without deep-dive content.

### 2.4 Relationships

```
regions 1--N region_indicators N--1 indicators N--1 categories
regions 1--N category_deep_dives N--1 categories
regions.parent_id ---> regions.id  (self-referential hierarchy)
```

---

## 3. API Design

### Base URL

All endpoints are prefixed with `/api/v1`. Versioning in the URL keeps the door
open for breaking changes later without disrupting existing consumers.

### 3.1 Region Endpoints

#### `GET /api/v1/regions`

List all available regions.

**Query parameters:**
- `type` (optional): filter by region_type (`state`, `county`, `city`)
- `parent_id` (optional): filter to children of a region

**Response:** Array of `{ id, slug, name, region_type, parent_id, population }`.

#### `GET /api/v1/regions/{slug}`

Single region object with `description` field included.

#### `GET /api/v1/regions/{slug}/doughnut`

The primary endpoint. Returns the full doughnut dataset for a region, structured
for direct consumption by the D3.js visualization.

**Response** (abbreviated -- one category shown per ring):
```json
{
  "region": { "slug": "california", "name": "State of California", "population": 39000000 },
  "summary": {
    "avg_social_shortfall_pct": 34,
    "avg_ecological_overshoot_pct": 286,
    "total_indicators": 42
  },
  "social": [
    {
      "category_slug": "food",
      "category_name": "Food",
      "display_order": 1,
      "avg_shortfall_pct": 26.1,
      "indicators": [
        { "slug": "food-insecurity", "name": "Food Insecurity", "value": 11.4,
          "desirable": 0, "score_pct": 11.4, "unit": "%", "year": 2023,
          "source": "USDA Economic Research Service", "source_url": "https://..." },
        { "slug": "vegetables-per-day", "name": "Vegetables Per Day", "value": 59.2,
          "desirable": 100, "score_pct": 40.8, "unit": "%", "year": 2022,
          "source": "CDC BRFSS" }
      ]
    }
  ],
  "ecological": [
    {
      "category_slug": "climate-change",
      "category_name": "Climate Change",
      "display_order": 1,
      "avg_overshoot_pct": 976,
      "indicators": [
        { "slug": "greenhouse-gas-footprint", "name": "Greenhouse Gas Emissions",
          "value": 19.6, "desirable": 0.985, "score_pct": 1890, "unit": "Tonnes CO2 eq",
          "year": 2019, "is_global": true, "source": "Global Carbon Project" },
        { "slug": "non-renewable-electricity", "name": "Non-Renewable Electricity",
          "value": 38, "desirable": 100, "score_pct": 62, "unit": "%", "year": 2023 }
      ]
    }
  ]
}
```

### 3.2 Category Endpoints

#### `GET /api/v1/regions/{slug}/categories/{category_slug}`

Deep-dive on a single category for a given region. Returns indicator data plus
narrative content (policy spotlight, justice spotlight).

**Response:** Region metadata, category info, indicator array (same shape as the
doughnut endpoint), plus a `deep_dive` object with `context`, `policy_spotlight`,
`justice_spotlight`, and `image_url` fields (all nullable markdown/plain text).

### 3.3 Admin / Data Management Endpoints

These endpoints are for data ingestion and updates. In v1, they are unprotected
(intended for local use or behind a reverse proxy). Auth is a future addition.

#### `POST /api/v1/regions`

Create a new region. Body: region JSON object.

#### `PUT /api/v1/regions/{slug}`

Update a region's metadata.

#### `POST /api/v1/regions/{slug}/indicators`

Bulk-upsert indicator values for a region. Accepts an array of indicator data.
This is the primary endpoint used by the data ingestion script.

**Request body:** Array of indicator objects, each with `category_slug`,
`indicator_slug`, `value`, `desirable`, `score_pct`, `year`, `source`, and
`source_url`. Matching is by `(category_slug, indicator_slug)`. Missing indicator
definitions are auto-created. Existing `region_indicator` rows are updated.

#### `PUT /api/v1/regions/{slug}/categories/{category_slug}/deep-dive`

Create or update the deep-dive narrative content for a category.

### 3.4 Static Asset Serving

FastAPI serves the built React frontend from `/` and static files (images, etc.)
from `/static/`. In production, a reverse proxy (nginx/caddy) can handle this
instead.

---

## 4. Frontend Architecture

### 4.1 Tech Stack

- **React 18** with functional components and hooks
- **Vite** for build tooling (fast HMR, simple config)
- **D3.js v7** for the doughnut chart (SVG rendering)
- **React Router** for client-side navigation
- **CSS Modules** or a lightweight utility system (no heavy framework)

### 4.2 Component Tree

```
<App>
  <Header />                    -- Region selector dropdown, title, nav
  <Routes>
    <Route path="/" element={<DoughnutPage />} />
    <Route path="/category/:slug" element={<CategoryPage />} />
  </Routes>
  <Footer />

<DoughnutPage>
  <RegionSummary />             -- Name, population, avg shortfall/overshoot stats
  <DoughnutChart />             -- The main D3.js circular visualization
  <RingLegend />                -- Color legend, explains shortfall vs overshoot

<CategoryPage>
  <CategoryHeader />            -- Name, icon, ring type, performance numbers
  <IndicatorBarChart />         -- Bar chart comparing the 2 indicators
  <DeepDivePanel>
    <PolicySpotlight />         -- Rendered markdown
    <JusticeSpotlight />        -- Rendered markdown
    <SourcesList />             -- Links to data sources
  </DeepDivePanel>
```

### 4.3 DoughnutChart Component (D3.js)

This is the centerpiece. It renders an SVG doughnut matching the visual language
from the California report.

**Structure:**
- The chart is a radial layout with 21 wedge positions.
- Social categories (12) occupy the inner ring. Ecological categories (9) occupy
  the outer ring.
- Each wedge's radial extent encodes the score:
  - **Social shortfall** extends _inward_ from the social foundation boundary.
    Larger shortfall = longer bar toward the center.
  - **Ecological overshoot** extends _outward_ from the ecological ceiling boundary.
    Larger overshoot = longer bar away from center.
  - A category with 0% shortfall/overshoot sits flush with its boundary line
    (in the "safe and just space").
- Within each category wedge, sub-bars show individual indicators side by side.

**Interactions:**
- **Hover** on a wedge: tooltip showing category name, score, and indicator summary.
- **Click** on a wedge: navigates to the deep-dive CategoryPage via React Router.
- **Animated entrance**: wedges grow from 0 to their actual values on initial render.

**Color Palette:**
- Social shortfall: orange tones (matching the CalDEC report style)
- Ecological overshoot: red-brown tones
- Safe/thriving: green
- Boundary lines: dark gray dashed circles
- Labels: dark text, positioned outside the chart

**Responsiveness:**
- SVG viewBox-based scaling. The chart renders at a fixed aspect ratio and scales
  to fit its container.
- On narrow screens (<768px), the chart takes full width and the legend moves below.
- Category labels switch from radial text to a numbered legend on small screens.

### 4.4 Data Flow

```
1. App mounts -> fetches GET /api/v1/regions
2. User selects a region (or default is loaded)
3. App fetches GET /api/v1/regions/{slug}/doughnut
4. DoughnutChart receives the social[] and ecological[] arrays as props
5. D3 binds data to SVG arc elements
6. User clicks a wedge -> React Router navigates to /category/{slug}
7. CategoryPage fetches GET /api/v1/regions/{slug}/categories/{slug}
```

Data is fetched with `fetch()` (no axios dependency needed). A simple context or
`useReducer` holds the current region and doughnut data so that navigating back
from a category page does not re-fetch.

### 4.5 Key UX Details

- **Region switcher** in the header. Dropdown populated from `/api/v1/regions`.
  Changing region re-fetches the doughnut and re-animates the chart.
- **Summary bar** above the chart: "34% average social shortfall | 286% average
  ecological overshoot" with large type, matching the report's snapshot page.
- **"Unrolled" view** toggle: a horizontal bar chart showing all indicators sorted
  by score (matching pages 10 and 12 of the California report). Useful for
  seeing the full ranked list.
- **Source attribution**: every indicator display includes the source name and year.
  Clicking opens the source URL in a new tab.

---

## 5. Data Ingestion

### 5.1 Ingestion Script

A standalone Python script (`scripts/seed_db.py`) reads structured data files and
populates the database. It is idempotent -- running it twice with the same input
produces the same database state.

**Input formats supported:**
- **CSV** with standardized column headers (primary format)
- **JSON** matching the API's bulk-upsert schema (alternative)

### 5.2 CSV Format

Two CSV files per region:

**`social_indicators.csv`**

| column            | description                                           |
|-------------------|-------------------------------------------------------|
| `category`        | Category name (must match a known category)           |
| `indicator`       | Indicator abbreviation / short name                   |
| `description`     | Full indicator definition                             |
| `value`           | Numeric measured value                                |
| `value_display`   | Optional formatted string                             |
| `desirable`       | Target/threshold value                                |
| `shortfall_pct`   | Computed shortfall percentage                         |
| `unit`            | Unit of measurement                                   |
| `year`            | Year measured                                         |
| `source`          | Source name                                           |
| `source_url`      | URL to the source                                     |

**`ecological_indicators.csv`**

Same columns, except `shortfall_pct` is replaced by `overshoot_pct`, and adds:
- `is_global`: `true` if this is a consumption/global metric, `false` if local/territorial

### 5.3 Ingestion Steps

```
python scripts/seed_db.py --region california \
    --social data/california/social_indicators.csv \
    --ecological data/california/ecological_indicators.csv \
    --deep-dives data/california/deep_dives.json
```

The script:

1. Creates the region if it does not exist (prompts for metadata or reads from
   a `region.json` sidecar file).
2. Ensures all 21 categories exist in the `categories` table (seeded from a
   built-in default list on first run).
3. For each CSV row:
   - Finds or creates the `indicators` row (matched by category + slug).
   - Upserts the `region_indicators` row with the measured values.
4. Optionally loads `deep_dives.json` containing narrative content per category.
5. Prints a summary: "Loaded 42 indicators for California (24 social, 18 ecological)."

### 5.4 Validation

The script validates on ingest:
- Every indicator must map to a known category.
- `score_pct` values must be non-negative numbers (or null for missing data).
- Warns if a category has fewer than 2 indicators (data may be incomplete).
- Warns if expected categories are missing entirely.

---

## 6. Generalization Strategy

### Adding a New Region

The platform requires zero code changes to support a new region. The steps:

1. **Prepare two CSV files** following the schema in Section 5.2. The category names
   must match the 21 standard categories (or the script will reject unknown ones).
2. **Run the ingestion script** pointing at the new CSVs with a new `--region` slug.
3. **Optionally add deep-dive content** via a `deep_dives.json` file.
4. The new region appears in the frontend's region dropdown immediately.

### Adapting Categories and Indicator Counts

Different doughnut reports use slightly different category names (e.g., Raworth's
"Networks" vs California's "Connectivity & Transport"). The `categories` table is
the source of truth -- provide a `categories.csv` override during ingestion to add
new ones. The frontend reads names from the API, so no UI changes are needed.

The California report uses exactly 2 indicators per category. The schema and API
impose no fixed count. The D3 chart subdivides each wedge proportionally.

### Deployment Models

| Model | Description |
|-------|-------------|
| **Local** | `uvicorn` + SQLite file. For personal use or development. |
| **Single VPS** | Caddy/nginx reverse proxy -> uvicorn. SQLite file on disk. Suitable for small organizations. |
| **Static export** | A build step that pre-renders the API responses as JSON files, bundled with the React build. Deployable to GitHub Pages / Netlify with no backend. |

The static export model is important for coalition partners who want to host a
visualization without running a server. The export script outputs JSON files that
the React app reads via `fetch()` instead of hitting a live API.

---

## 7. Project Structure

```
ca-doughnut/
  docs/design.md                          # This document
  backend/
    app/
      main.py                             # FastAPI app, CORS, static serving
      models.py                           # SQLAlchemy ORM models
      schemas.py                          # Pydantic request/response schemas
      database.py                         # Engine, session, Base
      routers/{regions,categories}.py     # API route handlers
    requirements.txt                      # fastapi, uvicorn, sqlalchemy, pydantic
  frontend/
    src/
      App.jsx                             # Router, layout, region context
      api.js                              # fetch wrappers
      components/{DoughnutChart,Header,RegionSelector,...}.jsx
      pages/{DoughnutPage,CategoryPage}.jsx
    vite.config.js
  scripts/
    seed_db.py                            # CSV/JSON -> SQLite ingestion
    export_static.py                      # Pre-render API as static JSON
  data/california/                        # CSV + JSON per region
  doughnut.db                             # SQLite (generated, gitignored)
```

---

## 8. Future Considerations

### Authentication and Admin UI

v1 has no auth. Future versions could add:
- API key authentication for write endpoints (simple, suitable for small teams).
- An admin web UI for editing indicator values, adding narratives, and managing
  regions without touching CSV files or the command line.

### Comparison Views

Side-by-side doughnut charts for two regions. The API already supports this (fetch
two doughnut endpoints), but the frontend needs a dedicated comparison layout
with synchronized hover states.

### Time Series

The current schema stores one value per indicator per region. To track change over
time:
- Add a `year` dimension to the `region_indicators` unique constraint, changing it
  from `(region_id, indicator_id)` to `(region_id, indicator_id, year)`.
- The API would accept an optional `?year=` parameter; default returns the most
  recent year.
- The frontend could add a year slider or sparkline trend lines within each wedge.

### Embeddable Widget

A standalone `<script>` tag that renders a minimal doughnut chart on any webpage,
pulling data from the API or from a static JSON blob. Useful for embedding in
reports, news articles, or coalition partner websites.

### Internationalization

Category names, indicator descriptions, and narrative content could be stored in
multiple languages. The `categories` and `indicators` tables would gain a `locale`
column, or a separate translations table. Out of scope for v1.

### Data Quality Dashboard

A monitoring view that flags stale data (indicators not updated in >2 years),
missing indicators, and regions with incomplete coverage. Useful as the number
of regions grows.
