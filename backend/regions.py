"""
OmniCart AI - Region registry.
Each market defines currency, locale and sales-tax rules. Add a new country by adding an entry here,
a catalog in catalog_data.py, and verified retailer policies in policy_engine.py.

NOTE: tax rates are simplified demo estimates (state/local US tax varies; Canadian rates are
combined GST/HST/PST by province). Verify before launch.
"""

REGIONS = {
    "US": {
        "name": "United States",
        "currency": "USD",
        "locale": "en-US",
        "default_subdivision": "CA",
        "flat_tax_rate": 0.0825,
        "subdivisions": {
            "AL": {"name": "Alabama", "tax_rate": 0.0929},
            "AK": {"name": "Alaska", "tax_rate": 0.0176},
            "AZ": {"name": "Arizona", "tax_rate": 0.0837},
            "AR": {"name": "Arkansas", "tax_rate": 0.0947},
            "CA": {"name": "California", "tax_rate": 0.0885},
            "CO": {"name": "Colorado", "tax_rate": 0.0777},
            "CT": {"name": "Connecticut", "tax_rate": 0.0635},
            "DE": {"name": "Delaware", "tax_rate": 0.0000},
            "FL": {"name": "Florida", "tax_rate": 0.0702},
            "GA": {"name": "Georgia", "tax_rate": 0.0737},
            "HI": {"name": "Hawaii", "tax_rate": 0.0444},
            "ID": {"name": "Idaho", "tax_rate": 0.0602},
            "IL": {"name": "Illinois", "tax_rate": 0.0882},
            "IN": {"name": "Indiana", "tax_rate": 0.0700},
            "IA": {"name": "Iowa", "tax_rate": 0.0694},
            "KS": {"name": "Kansas", "tax_rate": 0.0865},
            "KY": {"name": "Kentucky", "tax_rate": 0.0600},
            "LA": {"name": "Louisiana", "tax_rate": 0.0955},
            "ME": {"name": "Maine", "tax_rate": 0.0550},
            "MD": {"name": "Maryland", "tax_rate": 0.0600},
            "MA": {"name": "Massachusetts", "tax_rate": 0.0625},
            "MI": {"name": "Michigan", "tax_rate": 0.0600},
            "MN": {"name": "Minnesota", "tax_rate": 0.0749},
            "MS": {"name": "Mississippi", "tax_rate": 0.0707},
            "MO": {"name": "Missouri", "tax_rate": 0.0830},
            "MT": {"name": "Montana", "tax_rate": 0.0000},
            "NE": {"name": "Nebraska", "tax_rate": 0.0694},
            "NV": {"name": "Nevada", "tax_rate": 0.0823},
            "NH": {"name": "New Hampshire", "tax_rate": 0.0000},
            "NJ": {"name": "New Jersey", "tax_rate": 0.0660},
            "NM": {"name": "New Mexico", "tax_rate": 0.0772},
            "NY": {"name": "New York", "tax_rate": 0.0852},
            "NC": {"name": "North Carolina", "tax_rate": 0.0699},
            "ND": {"name": "North Dakota", "tax_rate": 0.0696},
            "OH": {"name": "Ohio", "tax_rate": 0.0724},
            "OK": {"name": "Oklahoma", "tax_rate": 0.0898},
            "OR": {"name": "Oregon", "tax_rate": 0.0000},
            "PA": {"name": "Pennsylvania", "tax_rate": 0.0634},
            "RI": {"name": "Rhode Island", "tax_rate": 0.0700},
            "SC": {"name": "South Carolina", "tax_rate": 0.0744},
            "SD": {"name": "South Dakota", "tax_rate": 0.0640},
            "TN": {"name": "Tennessee", "tax_rate": 0.0955},
            "TX": {"name": "Texas", "tax_rate": 0.0820},
            "UT": {"name": "Utah", "tax_rate": 0.0719},
            "VT": {"name": "Vermont", "tax_rate": 0.0624},
            "VA": {"name": "Virginia", "tax_rate": 0.0575},
            "WA": {"name": "Washington", "tax_rate": 0.0929},
            "WV": {"name": "West Virginia", "tax_rate": 0.0655},
            "WI": {"name": "Wisconsin", "tax_rate": 0.0543},
            "WY": {"name": "Wyoming", "tax_rate": 0.0536},
        },
    },
    "CA": {
        "name": "Canada",
        "currency": "CAD",
        "locale": "en-CA",
        "default_subdivision": "ON",
        "flat_tax_rate": None,
        "subdivisions": {
            "AB": {"name": "Alberta", "tax_rate": 0.05},
            "BC": {"name": "British Columbia", "tax_rate": 0.12},
            "MB": {"name": "Manitoba", "tax_rate": 0.12},
            "NB": {"name": "New Brunswick", "tax_rate": 0.15},
            "NL": {"name": "Newfoundland and Labrador", "tax_rate": 0.15},
            "NS": {"name": "Nova Scotia", "tax_rate": 0.15},
            "ON": {"name": "Ontario", "tax_rate": 0.13},
            "PE": {"name": "Prince Edward Island", "tax_rate": 0.15},
            "QC": {"name": "Quebec", "tax_rate": 0.14975},
            "SK": {"name": "Saskatchewan", "tax_rate": 0.11},
            "NT": {"name": "Northwest Territories", "tax_rate": 0.05},
            "NU": {"name": "Nunavut", "tax_rate": 0.05},
            "YT": {"name": "Yukon", "tax_rate": 0.05},
        },
    },
}


def get_region(code: str) -> dict:
    return REGIONS.get((code or "").upper())


def tax_rate(region_code: str, subdivision: str | None = None) -> float:
    region = get_region(region_code)
    if not region:
        raise KeyError(region_code)
    if subdivision:
        sub = subdivision.upper()
        subs = region.get("subdivisions", {})
        if sub in subs:
            return subs[sub]["tax_rate"]
    if region.get("flat_tax_rate") is not None:
        return region["flat_tax_rate"]
    sub = (region.get("default_subdivision") or "").upper()
    subs = region.get("subdivisions", {})
    if sub in subs:
        return subs[sub]["tax_rate"]
    return 0.0825
