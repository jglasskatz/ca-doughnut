"""Seed the database with California Doughnut Economics data from the 2025 report."""

from .database import engine, SessionLocal, Base
from .models import Region, Category, Indicator, RingType


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(Region).first():
        print("Database already seeded. Skipping.")
        db.close()
        return

    # --- Region ---
    ca = Region(
        slug="california",
        name="State of California",
        region_type="state",
        population="~39 million",
        description=(
            "California is the US's 3rd largest state by land mass and has its "
            "largest population. If considered as an independent nation, it would "
            "be the world's 4th largest economy. It is a biodiversity hotspot. "
            "100% of social indicators fall short; 89% of ecological indicators overshoot."
        ),
    )
    db.add(ca)
    db.flush()

    # =========================================================================
    # SOCIAL FOUNDATION — 12 categories, 24 indicators
    # Shortfall % = how far below the social foundation threshold
    # =========================================================================
    social_data = [
        {
            "slug": "food",
            "name": "Food",
            "icon": "utensils",
            "description": "Access to adequate, nutritious food for all Californians.",
            "indicators": [
                {
                    "name": "Food Insecurity",
                    "description": "% of households who live with food insecurity",
                    "value": "11%",
                    "shortfall_pct": 11,
                    "source": "USDA Economic Research Service",
                },
                {
                    "name": "Vegetables Per Day",
                    "description": "% of adults who eat < 1 serving of vegetables per day",
                    "value": "32%",
                    "shortfall_pct": 32,
                    "source": "CDC Behavioral Risk Factor Surveillance System",
                },
            ],
        },
        {
            "slug": "health",
            "name": "Health",
            "icon": "heart-pulse",
            "description": "Healthy lives and access to quality healthcare.",
            "indicators": [
                {
                    "name": "Life Expectancy",
                    "description": "% of population living in counties with life expectancy below OECD average (80.3 years)",
                    "value": "28%",
                    "shortfall_pct": 28,
                    "source": "County Health Rankings",
                },
                {
                    "name": "Healthcare Affordability",
                    "description": "% of adults who delayed, skipped, or reduced health care due to costs",
                    "value": "41%",
                    "shortfall_pct": 41,
                    "source": "California Health Interview Survey",
                },
            ],
        },
        {
            "slug": "education",
            "name": "Education",
            "icon": "graduation-cap",
            "description": "Quality education and lifelong learning opportunities.",
            "indicators": [
                {
                    "name": "Literacy Rate",
                    "description": "% of people aged 16-74 with literacy proficiency at or below Level 1",
                    "value": "53%",
                    "shortfall_pct": 53,
                    "source": "National Center for Education Statistics",
                },
                {
                    "name": "Student Loan Debt",
                    "description": "% of college graduates with student debt",
                    "value": "46%",
                    "shortfall_pct": 46,
                    "source": "Institute for College Access & Success",
                },
            ],
        },
        {
            "slug": "income-work",
            "name": "Income & Work",
            "icon": "briefcase",
            "description": "Decent livelihoods and meaningful work for all.",
            "indicators": [
                {
                    "name": "Poverty",
                    "description": "% of people experiencing poverty (Supplemental Poverty Measure)",
                    "value": "15%",
                    "shortfall_pct": 15,
                    "source": "US Census Bureau",
                },
                {
                    "name": "Unemployment",
                    "description": "% of people unemployed for economic reasons including part-time, underemployed, and those marginally attached to the labor force (State U-6)",
                    "value": "9%",
                    "shortfall_pct": 9,
                    "source": "Bureau of Labor Statistics",
                },
            ],
        },
        {
            "slug": "peace-justice",
            "name": "Peace & Justice",
            "icon": "scale",
            "description": "Safe communities with accountable justice systems.",
            "indicators": [
                {
                    "name": "Violent Crime",
                    "description": "% of people exposed to violent crime per 100,000; includes murder, rape, robbery, and aggravated assault",
                    "value": "100%",
                    "shortfall_pct": 100,
                    "source": "FBI Uniform Crime Report",
                },
                {
                    "name": "Police Scorecard",
                    "description": "% of people living in counties with inadequate approach to law enforcement, based on police use of force, accountability, and outcomes",
                    "value": "65%",
                    "shortfall_pct": 65,
                    "source": "Police Scorecard Project",
                },
            ],
        },
        {
            "slug": "political-voice",
            "name": "Political Voice",
            "icon": "megaphone",
            "description": "Democratic participation and civic engagement.",
            "indicators": [
                {
                    "name": "Voter Turnout",
                    "description": "% of eligible voters who did not vote in the 2020 presidential election",
                    "value": "40%",
                    "shortfall_pct": 40,
                    "source": "California Secretary of State",
                },
                {
                    "name": "Registered Voters",
                    "description": "% of eligible voters not registered to vote",
                    "value": "16%",
                    "shortfall_pct": 16,
                    "source": "California Secretary of State",
                },
            ],
        },
        {
            "slug": "social-cohesion",
            "name": "Social Cohesion",
            "icon": "users",
            "description": "Community bonds, trust, and sense of belonging.",
            "indicators": [
                {
                    "name": "Income Inequality",
                    "description": "% of people living in counties with a Gini Index > 0.30",
                    "value": "26%",
                    "shortfall_pct": 26,
                    "source": "US Census Bureau ACS",
                },
                {
                    "name": "Report Not Happy",
                    "description": "% of people who report they are 'not too happy'",
                    "value": "13%",
                    "shortfall_pct": 13,
                    "source": "General Social Survey",
                },
            ],
        },
        {
            "slug": "equity",
            "name": "Equity",
            "icon": "equal",
            "description": "Gender, racial, and economic equity across communities.",
            "indicators": [
                {
                    "name": "Gender Pay Gap",
                    "description": "% difference of men's median wage earned by women for full-time, year-round work",
                    "value": "40%",
                    "shortfall_pct": 40,
                    "source": "National Women's Law Center",
                },
                {
                    "name": "Racial Equity Index",
                    "description": "Inclusion score based on racial gaps in economic vitality, readiness, and connectedness",
                    "value": "36%",
                    "shortfall_pct": 36,
                    "source": "National Equity Atlas",
                },
            ],
        },
        {
            "slug": "housing",
            "name": "Housing",
            "icon": "home",
            "description": "Adequate, affordable housing for all.",
            "indicators": [
                {
                    "name": "Homelessness",
                    "description": "Point-in-time count of unhoused people",
                    "value": "55%",
                    "shortfall_pct": 55,
                    "source": "HUD Point-in-Time Count",
                },
                {
                    "name": "Housing Burden",
                    "description": "% of renters with housing costs >30% of household income",
                    "value": "40%",
                    "shortfall_pct": 40,
                    "source": "US Census Bureau ACS",
                },
            ],
        },
        {
            "slug": "connectivity-transport",
            "name": "Connectivity & Transport",
            "icon": "wifi",
            "description": "Digital access and sustainable transportation for all.",
            "indicators": [
                {
                    "name": "Internet Access",
                    "description": "% of households without any internet subscription or with cellular data plan only",
                    "value": "17%",
                    "shortfall_pct": 17,
                    "source": "US Census Bureau ACS",
                },
                {
                    "name": "Transit Report Card",
                    "description": "Report card scores for vehicle miles traveled and transit access (combined 6 out of 10)",
                    "value": "40%",
                    "shortfall_pct": 40,
                    "source": "Transportation for America",
                },
            ],
        },
        {
            "slug": "energy",
            "name": "Energy",
            "icon": "zap",
            "description": "Clean, affordable, reliable energy access.",
            "indicators": [
                {
                    "name": "Energy Burden",
                    "description": "% of households whose energy bill is >10% of household income",
                    "value": "7%",
                    "shortfall_pct": 7,
                    "source": "US Dept of Energy LEAD Tool",
                },
                {
                    "name": "Energy Reliability",
                    "description": "% of population living in counties with average total outage >6 hours per year",
                    "value": "2.2%",
                    "shortfall_pct": 2.2,
                    "source": "EIA Electric Disturbance Events",
                },
            ],
        },
        {
            "slug": "water-sanitation",
            "name": "Water & Sanitation",
            "icon": "droplets",
            "description": "Clean water and sanitation services for all.",
            "indicators": [
                {
                    "name": "Water Quality",
                    "description": "# of people who receive water from systems that do not meet quality standards",
                    "value": "0.6%",
                    "shortfall_pct": 0.6,
                    "source": "CA State Water Resources Control Board",
                },
                {
                    "name": "Sanitation Access",
                    "description": "% of people who receive water from systems that do not meet sanitation standards",
                    "value": "Data pending",
                    "shortfall_pct": None,
                    "source": "CA State Water Resources Control Board",
                },
            ],
        },
    ]

    # =========================================================================
    # ECOLOGICAL CEILING — 9 categories, 18 indicators
    # Overshoot % = how far beyond the planetary boundary
    # =========================================================================
    ecological_data = [
        {
            "slug": "climate-change",
            "name": "Climate Change",
            "icon": "thermometer",
            "description": "Human activity releases greenhouse gases, mainly by burning fossil fuels and degrading the environment.",
            "indicators": [
                {
                    "name": "Greenhouse Gas Emissions",
                    "description": "Carbon footprint per capita (consumption-based)",
                    "value": "1,890%",
                    "overshoot_pct": 1890,
                    "source": "Global Footprint Network",
                },
                {
                    "name": "Non-Renewable Electricity",
                    "description": "% of electricity not from renewables (solar, wind, and geothermal)",
                    "value": "62%",
                    "overshoot_pct": 62,
                    "source": "California Energy Commission",
                },
            ],
        },
        {
            "slug": "ocean-acidification",
            "name": "Ocean Acidification",
            "icon": "waves",
            "description": "CO2 absorption lowers ocean pH, threatening marine life and ecosystems.",
            "indicators": [
                {
                    "name": "Ocean pH",
                    "description": "Change in pH compared to preindustrial levels",
                    "value": "91%",
                    "overshoot_pct": 91,
                    "source": "NOAA Pacific Marine Environmental Laboratory",
                },
                {
                    "name": "SO2-Eq Footprint",
                    "description": "Acidification potential: SO2-Eq footprint per capita",
                    "value": "520%",
                    "overshoot_pct": 520,
                    "source": "Global Footprint Network",
                },
            ],
        },
        {
            "slug": "chemical-pollution",
            "name": "Chemical Pollution",
            "icon": "flask-round",
            "description": "Toxic chemicals contaminate air, water, and soil, threatening health and ecosystems.",
            "indicators": [
                {
                    "name": "Toxic Pesticides Applied",
                    "description": "% of high-risk toxics out of total pesticides applied per year",
                    "value": "65%",
                    "overshoot_pct": 65,
                    "source": "CA Dept of Pesticide Regulation",
                },
                {
                    "name": "Toxic Releases",
                    "description": "% of high-risk chemicals released out of total toxic chemicals produced per year",
                    "value": "13%",
                    "overshoot_pct": 13,
                    "source": "EPA Toxics Release Inventory",
                },
            ],
        },
        {
            "slug": "air-pollution",
            "name": "Air Pollution",
            "icon": "cloud",
            "description": "Poor air quality from transportation, industry, and wildfires affects health statewide.",
            "indicators": [
                {
                    "name": "O3 Pollution",
                    "description": "% of air basins in violation of the national ozone standard of 0.070 ppm",
                    "value": "60%",
                    "overshoot_pct": 60,
                    "source": "CA Air Resources Board",
                },
                {
                    "name": "Particulate Matter",
                    "description": "% of air basins with PM2.5 levels classified as critically overloaded",
                    "value": "63%",
                    "overshoot_pct": 63,
                    "source": "CA Air Resources Board",
                },
            ],
        },
        {
            "slug": "freshwater-use",
            "name": "Freshwater Use",
            "icon": "droplet",
            "description": "Excessive water extraction threatens ecosystems and long-term water security.",
            "indicators": [
                {
                    "name": "Groundwater",
                    "description": "% of groundwater basins pumped from aquifers rated as critically overdrafted",
                    "value": "76%",
                    "overshoot_pct": 76,
                    "source": "CA Dept of Water Resources",
                },
                {
                    "name": "Water Footprint",
                    "description": "Blue water footprint per capita (consumption-based)",
                    "value": "28%",
                    "overshoot_pct": 28,
                    "source": "Water Footprint Network",
                },
            ],
        },
        {
            "slug": "land-use-change",
            "name": "Land-Use Change",
            "icon": "trees",
            "description": "Conversion of natural land for development and agriculture reduces ecological resilience.",
            "indicators": [
                {
                    "name": "Forest Cover",
                    "description": "% of land without forest cover compared to 75% of preindustrial level",
                    "value": "351%",
                    "overshoot_pct": 351,
                    "source": "USDA Forest Service",
                },
                {
                    "name": "Ecological Footprint",
                    "description": "Ecological footprint per capita (consumption-based)",
                    "value": "Overshoot",
                    "overshoot_pct": None,
                    "source": "Global Footprint Network",
                },
            ],
        },
        {
            "slug": "biodiversity-loss",
            "name": "Biodiversity Loss",
            "icon": "bug",
            "description": "Species decline and habitat destruction threaten ecosystem stability.",
            "indicators": [
                {
                    "name": "At-Risk Species",
                    "description": "% of native species at risk of extinction",
                    "value": "947%",
                    "overshoot_pct": 947,
                    "source": "NatureServe",
                },
                {
                    "name": "Unprotected Area",
                    "description": "% of unprotected land/sea area",
                    "value": "59%",
                    "overshoot_pct": 59,
                    "source": "USGS Protected Areas Database",
                },
            ],
        },
        {
            "slug": "ozone-depletion",
            "name": "Ozone Depletion",
            "icon": "shield",
            "description": "Depletion of the stratospheric ozone layer increases UV radiation exposure.",
            "indicators": [
                {
                    "name": "Ozone-Depleting Substances",
                    "description": "Compliant with Montreal Protocol",
                    "value": "0%",
                    "overshoot_pct": 0,
                    "source": "NOAA / Montreal Protocol",
                },
                {
                    "name": "Ozone Layer",
                    "description": "Beyond global average minimum thickness threshold",
                    "value": "0%",
                    "overshoot_pct": 0,
                    "source": "NOAA / Montreal Protocol",
                },
            ],
        },
        {
            "slug": "nitrogen-phosphorus",
            "name": "Nitrogen & Phosphorus",
            "icon": "leaf",
            "description": "Excess nitrogen and phosphorus from agriculture and industry pollute waterways.",
            "indicators": [
                {
                    "name": "Eutrophication Potential",
                    "description": "Footprint per capita for eutrophication",
                    "value": "657%",
                    "overshoot_pct": 657,
                    "source": "Global Footprint Network",
                },
                {
                    "name": "Nitrogen Leached",
                    "description": "Nitrogen leached to groundwater per year",
                    "value": "209%",
                    "overshoot_pct": 209,
                    "source": "UC Davis Groundwater Nitrate Assessment",
                },
            ],
        },
    ]

    # --- Insert social categories + indicators ---
    for cat_data in social_data:
        indicators = cat_data.pop("indicators")
        cat = Category(region_id=ca.id, ring=RingType.social, **cat_data)
        db.add(cat)
        db.flush()
        for ind_data in indicators:
            db.add(Indicator(category_id=cat.id, **ind_data))

    # --- Insert ecological categories + indicators ---
    for cat_data in ecological_data:
        indicators = cat_data.pop("indicators")
        cat = Category(region_id=ca.id, ring=RingType.ecological, **cat_data)
        db.add(cat)
        db.flush()
        for ind_data in indicators:
            db.add(Indicator(category_id=cat.id, **ind_data))

    db.commit()
    db.close()
    print(f"Seeded California: {len(social_data)} social + {len(ecological_data)} ecological categories, 42 indicators total.")


if __name__ == "__main__":
    seed()
