#!/usr/bin/env python3
"""
TFT-193: Spatial Feature Extraction for Parcel Data

Computes geometry-based spatial features for parcels from coordinate data.
This is purely spatial/geometric computation — NOT valuation.

Available features:
    distance_to_cbd, road_frontage, lake_proximity, park_proximity,
    school_proximity, flood_zone, slope, aspect, network_centrality

Usage:
    python run_spatial_features.py \
        --input parcels.csv \
        --output-dir ./output \
        --features distance_to_cbd,lake_proximity,slope
"""

import argparse
import csv
import math
import os
import sys

import numpy as np

AVAILABLE_FEATURES = [
    "distance_to_cbd",
    "road_frontage",
    "lake_proximity",
    "park_proximity",
    "school_proximity",
    "flood_zone",
    "slope",
    "aspect",
    "network_centrality",
]

# Reference points (Benton County, WA defaults — lon/lat)
CBD_COORD = np.array([-119.2838, 46.2826])  # Downtown Kennewick
LAKE_COORD = np.array([-119.1700, 46.2500])
PARK_COORD = np.array([-119.2750, 46.2900])
SCHOOL_COORD = np.array([-119.2900, 46.2750])
ROAD_AXIS = np.array([-119.2800, 46.2800])  # Reference road centerline point

# Approximate meters-per-degree at ~46°N
M_PER_DEG_LAT = 111_320.0
M_PER_DEG_LON = 111_320.0 * math.cos(math.radians(46.28))


def _haversine_m(coord1: np.ndarray, coord2: np.ndarray) -> float:
    """Return distance in metres between two (lon, lat) points."""
    lon1, lat1 = np.radians(coord1)
    lon2, lat2 = np.radians(coord2)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2) ** 2
    return 6_371_000 * 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))


def distance_to_cbd(lon: float, lat: float, **_) -> float:
    """Euclidean distance (metres) from parcel centroid to CBD."""
    return float(_haversine_m(np.array([lon, lat]), CBD_COORD))


def road_frontage(lon: float, lat: float, **_) -> float:
    """Estimated road-frontage distance (metres) using proximity to road axis."""
    dx = (lon - ROAD_AXIS[0]) * M_PER_DEG_LON
    dy = (lat - ROAD_AXIS[1]) * M_PER_DEG_LAT
    return float(abs(dy))  # perpendicular offset as proxy


def lake_proximity(lon: float, lat: float, **_) -> float:
    """Distance (metres) to nearest lake reference point."""
    return float(_haversine_m(np.array([lon, lat]), LAKE_COORD))


def park_proximity(lon: float, lat: float, **_) -> float:
    """Distance (metres) to nearest park reference point."""
    return float(_haversine_m(np.array([lon, lat]), PARK_COORD))


def school_proximity(lon: float, lat: float, **_) -> float:
    """Distance (metres) to nearest school reference point."""
    return float(_haversine_m(np.array([lon, lat]), SCHOOL_COORD))


def flood_zone(lon: float, lat: float, **_) -> int:
    """Binary flood-zone indicator derived from elevation proxy.

    Returns 1 if the parcel sits below a simple elevation threshold
    (low-latitude band near the river), 0 otherwise.
    """
    river_lat = 46.265
    return 1 if abs(lat - river_lat) < 0.012 else 0


def slope(lon: float, lat: float, **_) -> float:
    """Synthetic slope (degrees) estimated from a smooth terrain model.

    Uses a simple gradient surface anchored on regional topography.
    """
    dx = (lon - CBD_COORD[0]) * M_PER_DEG_LON
    dy = (lat - CBD_COORD[1]) * M_PER_DEG_LAT
    gradient = np.sqrt(dx**2 + dy**2) * 0.002  # gentle regional tilt
    return float(np.clip(np.degrees(np.arctan(gradient / 1000)), 0, 45))


def aspect(lon: float, lat: float, **_) -> float:
    """Terrain aspect (degrees, 0-360 clockwise from north)."""
    dx = (lon - CBD_COORD[0]) * M_PER_DEG_LON
    dy = (lat - CBD_COORD[1]) * M_PER_DEG_LAT
    angle = np.degrees(np.arctan2(dx, dy)) % 360
    return float(angle)


def network_centrality(lon: float, lat: float, **_) -> float:
    """Simplified network-centrality score (0-1).

    Approximated as inverse normalised distance to CBD — parcels closer
    to the urban core receive higher centrality scores.
    """
    dist = _haversine_m(np.array([lon, lat]), CBD_COORD)
    # Sigmoid-style normalisation, half-score at ~2 km
    score = 1.0 / (1.0 + dist / 2000.0)
    return float(np.clip(score, 0, 1))


FEATURE_FUNCTIONS = {
    "distance_to_cbd": distance_to_cbd,
    "road_frontage": road_frontage,
    "lake_proximity": lake_proximity,
    "park_proximity": park_proximity,
    "school_proximity": school_proximity,
    "flood_zone": flood_zone,
    "slope": slope,
    "aspect": aspect,
    "network_centrality": network_centrality,
}


def parse_args(argv=None):
    parser = argparse.ArgumentParser(
        description="Compute spatial features for parcels from coordinate data."
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Path to input parcel CSV (must contain parcel_id, longitude, latitude).",
    )
    parser.add_argument(
        "--output-dir",
        required=True,
        help="Directory to write the output CSV.",
    )
    parser.add_argument(
        "--features",
        required=True,
        help=(
            "Comma-separated list of spatial features to compute. "
            f"Available: {', '.join(AVAILABLE_FEATURES)}"
        ),
    )
    return parser.parse_args(argv)


def validate_features(feature_str: str) -> list[str]:
    """Parse and validate the comma-separated feature list."""
    requested = [f.strip() for f in feature_str.split(",") if f.strip()]
    unknown = [f for f in requested if f not in FEATURE_FUNCTIONS]
    if unknown:
        print(f"ERROR: Unknown features: {', '.join(unknown)}", file=sys.stderr)
        print(f"Available: {', '.join(AVAILABLE_FEATURES)}", file=sys.stderr)
        sys.exit(1)
    if not requested:
        print("ERROR: No features specified.", file=sys.stderr)
        sys.exit(1)
    return requested


def run(args):
    features = validate_features(args.features)

    if not os.path.isfile(args.input):
        print(f"ERROR: Input file not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    os.makedirs(args.output_dir, exist_ok=True)
    output_path = os.path.join(args.output_dir, "spatial_features.csv")

    rows_written = 0
    with open(args.input, newline="", encoding="utf-8") as fin:
        reader = csv.DictReader(fin)

        # Verify required columns
        required_cols = {"parcel_id", "longitude", "latitude"}
        if not required_cols.issubset(set(reader.fieldnames or [])):
            missing = required_cols - set(reader.fieldnames or [])
            print(
                f"ERROR: Input CSV missing columns: {', '.join(missing)}",
                file=sys.stderr,
            )
            sys.exit(1)

        fieldnames = ["parcel_id"] + features
        with open(output_path, "w", newline="", encoding="utf-8") as fout:
            writer = csv.DictWriter(fout, fieldnames=fieldnames)
            writer.writeheader()

            for row in reader:
                parcel_id = row["parcel_id"]
                try:
                    lon = float(row["longitude"])
                    lat = float(row["latitude"])
                except (ValueError, TypeError):
                    print(
                        f"WARNING: Skipping parcel {parcel_id} — invalid coordinates.",
                        file=sys.stderr,
                    )
                    continue

                out_row = {"parcel_id": parcel_id}
                for feat in features:
                    out_row[feat] = round(FEATURE_FUNCTIONS[feat](lon=lon, lat=lat), 6)

                writer.writerow(out_row)
                rows_written += 1

    print(f"Wrote {rows_written} parcels with {len(features)} features to {output_path}")


if __name__ == "__main__":
    args = parse_args()
    run(args)
