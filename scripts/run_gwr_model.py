#!/usr/bin/env python3
"""
TFT-192 -- Geographically Weighted Regression (GWR) for County Mass Appraisal

Standalone offline script.  Reads parcel data (CSV or database), fits an
adaptive bisquare GWR, and writes:

  1. Per-parcel local coefficients CSV
  2. Summary statistics JSON
  3. Diagnostic map data CSV (local R-squared, residuals, Cook's D)

Required columns in input data:
    parcel_id, x_coord, y_coord, sale_price,
    building_area, land_area, age, quality

Usage:
    python run_gwr_model.py --input parcels.csv --output-dir ./gwr_output
    python run_gwr_model.py --input parcels.csv --output-dir ./gwr_output --bandwidth 2500
    python run_gwr_model.py --input "postgresql://user:pw@host/db?table=parcels" --output-dir ./gwr_output
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Optional

import numpy as np

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

REQUIRED_COLS = [
    "parcel_id",
    "x_coord",
    "y_coord",
    "sale_price",
    "building_area",
    "land_area",
    "age",
    "quality",
]

EXPLANATORY = ["building_area", "land_area", "age", "quality"]


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------


def _load_csv(path: str) -> dict[str, np.ndarray]:
    """Load a CSV into column-oriented numpy arrays."""
    import csv

    with open(path, newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        rows = list(reader)

    if not rows:
        sys.exit("ERROR: input CSV is empty.")

    missing = [c for c in REQUIRED_COLS if c not in rows[0]]
    if missing:
        sys.exit(f"ERROR: input CSV missing columns: {', '.join(missing)}")

    data: dict[str, list] = {c: [] for c in REQUIRED_COLS}
    for r in rows:
        for c in REQUIRED_COLS:
            val = r[c]
            if c == "parcel_id":
                data[c].append(val)
            else:
                try:
                    data[c].append(float(val))
                except (ValueError, TypeError):
                    data[c].append(np.nan)

    arrays: dict[str, np.ndarray] = {}
    for c in REQUIRED_COLS:
        if c == "parcel_id":
            arrays[c] = np.array(data[c], dtype=object)
        else:
            arrays[c] = np.array(data[c], dtype=np.float64)

    return arrays


def _load_database(connstr: str) -> dict[str, np.ndarray]:
    """Load parcel data from a SQL database via SQLAlchemy."""
    try:
        import sqlalchemy  # noqa: F401
    except ImportError:
        sys.exit("ERROR: sqlalchemy is required for database connections. pip install sqlalchemy")

    from urllib.parse import parse_qs, urlparse

    parsed = urlparse(connstr)
    qs = parse_qs(parsed.query)
    table = qs.get("table", ["parcels"])[0]

    # Rebuild connection string without the custom ?table= param
    clean = connstr.split("?")[0]

    from sqlalchemy import create_engine, text

    engine = create_engine(clean)
    cols = ", ".join(REQUIRED_COLS)
    with engine.connect() as conn:
        result = conn.execute(text(f"SELECT {cols} FROM {table}"))  # noqa: S608
        rows = result.fetchall()

    if not rows:
        sys.exit("ERROR: query returned no rows.")

    data: dict[str, list] = {c: [] for c in REQUIRED_COLS}
    for row in rows:
        for i, c in enumerate(REQUIRED_COLS):
            data[c].append(row[i])

    arrays: dict[str, np.ndarray] = {}
    for c in REQUIRED_COLS:
        if c == "parcel_id":
            arrays[c] = np.array(data[c], dtype=object)
        else:
            arrays[c] = np.array(data[c], dtype=np.float64)

    return arrays


def load_data(source: str) -> dict[str, np.ndarray]:
    if source.startswith("postgresql://") or source.startswith("sqlite://"):
        return _load_database(source)
    return _load_csv(source)


# ---------------------------------------------------------------------------
# Kernel functions
# ---------------------------------------------------------------------------


def _bisquare_kernel(distances: np.ndarray, bandwidth: float) -> np.ndarray:
    """Adaptive bisquare kernel weights."""
    w = np.zeros_like(distances)
    mask = distances < bandwidth
    u = distances[mask] / bandwidth
    w[mask] = (1.0 - u**2) ** 2
    return w


def _distance_matrix(coords: np.ndarray) -> np.ndarray:
    """Euclidean distance matrix (n x n)."""
    diff = coords[:, np.newaxis, :] - coords[np.newaxis, :, :]
    return np.sqrt((diff**2).sum(axis=2))


# ---------------------------------------------------------------------------
# Bandwidth selection -- golden section search with leave-one-out CV
# ---------------------------------------------------------------------------


def _gwr_cv_score(
    X: np.ndarray,
    y: np.ndarray,
    dist_mat: np.ndarray,
    bandwidth: float,
) -> float:
    """Leave-one-out cross-validation score (sum of squared CV residuals)."""
    n = X.shape[0]
    cv_residuals = np.zeros(n)
    for i in range(n):
        w = _bisquare_kernel(dist_mat[i], bandwidth)
        w[i] = 0.0  # leave-one-out
        W = np.diag(w)
        XtW = X.T @ W
        try:
            beta = np.linalg.solve(XtW @ X, XtW @ y)
        except np.linalg.LinAlgError:
            return np.inf
        cv_residuals[i] = y[i] - X[i] @ beta
    return float(np.sum(cv_residuals**2))


def _select_bandwidth(
    X: np.ndarray,
    y: np.ndarray,
    dist_mat: np.ndarray,
    tol: float = 1.0,
) -> float:
    """Golden-section search for optimal adaptive bisquare bandwidth."""
    sorted_dists = np.sort(dist_mat, axis=1)
    # Search range: enough neighbours for stable regression to max distance
    k_min = X.shape[1] + 2
    bw_min = float(np.median(sorted_dists[:, min(k_min, sorted_dists.shape[1] - 1)]))
    bw_max = float(np.max(dist_mat))

    ratio = 0.6180339887  # golden ratio conjugate
    a, b = bw_min, bw_max
    c = b - ratio * (b - a)
    d = a + ratio * (b - a)

    print(f"  Bandwidth search range: [{a:.1f}, {b:.1f}]")

    while abs(b - a) > tol:
        fc = _gwr_cv_score(X, y, dist_mat, c)
        fd = _gwr_cv_score(X, y, dist_mat, d)
        if fc < fd:
            b = d
        else:
            a = c
        c = b - ratio * (b - a)
        d = a + ratio * (b - a)

    optimal = (a + b) / 2.0
    print(f"  Selected bandwidth: {optimal:.2f}")
    return optimal


# ---------------------------------------------------------------------------
# GWR fitting
# ---------------------------------------------------------------------------


def fit_gwr(
    coords: np.ndarray,
    X: np.ndarray,
    y: np.ndarray,
    bandwidth: Optional[float] = None,
) -> dict:
    """
    Fit a GWR model and return local coefficients + diagnostics.

    Parameters
    ----------
    coords : (n, 2) array of x/y coordinates
    X      : (n, p) design matrix (with intercept column)
    y      : (n,) dependent variable
    bandwidth : fixed bandwidth; if None, selected via CV

    Returns
    -------
    dict with keys: local_betas, y_hat, residuals, local_r2,
                    bandwidth, hat_matrix_trace
    """
    n, p = X.shape
    dist_mat = _distance_matrix(coords)

    if bandwidth is None:
        print("Selecting bandwidth via leave-one-out CV (golden section)...")
        bandwidth = _select_bandwidth(X, y, dist_mat)
    else:
        print(f"Using fixed bandwidth: {bandwidth:.2f}")

    local_betas = np.zeros((n, p))
    y_hat = np.zeros(n)
    hat_diag = np.zeros(n)  # diagonal of the hat matrix

    for i in range(n):
        w = _bisquare_kernel(dist_mat[i], bandwidth)
        W = np.diag(w)
        XtW = X.T @ W
        try:
            beta = np.linalg.solve(XtW @ X, XtW @ y)
        except np.linalg.LinAlgError:
            # Fallback: ridge-style regularisation
            lam = 1e-6 * np.eye(p)
            beta = np.linalg.solve(XtW @ X + lam, XtW @ y)

        local_betas[i] = beta
        y_hat[i] = X[i] @ beta

        # Hat matrix row for effective parameters
        try:
            ri = X[i] @ np.linalg.solve(XtW @ X, X.T @ W)
            hat_diag[i] = ri[i]
        except np.linalg.LinAlgError:
            hat_diag[i] = 0.0

    residuals = y - y_hat

    # Local R-squared (geographically weighted)
    local_r2 = np.zeros(n)
    for i in range(n):
        w = _bisquare_kernel(dist_mat[i], bandwidth)
        w_sum = w.sum()
        if w_sum == 0:
            continue
        y_mean_w = np.dot(w, y) / w_sum
        ss_tot = np.dot(w, (y - y_mean_w) ** 2)
        ss_res = np.dot(w, residuals**2)
        local_r2[i] = 1.0 - ss_res / ss_tot if ss_tot > 0 else 0.0

    return {
        "local_betas": local_betas,
        "y_hat": y_hat,
        "residuals": residuals,
        "local_r2": local_r2,
        "bandwidth": bandwidth,
        "hat_matrix_trace": float(hat_diag.sum()),
    }


# ---------------------------------------------------------------------------
# Summary statistics
# ---------------------------------------------------------------------------


def compute_summary(
    y: np.ndarray,
    result: dict,
    var_names: list[str],
) -> dict:
    n = len(y)
    residuals = result["residuals"]
    eff_params = result["hat_matrix_trace"]
    rss = float(np.sum(residuals**2))
    tss = float(np.sum((y - y.mean()) ** 2))
    r2 = 1.0 - rss / tss if tss > 0 else 0.0
    adj_r2 = 1.0 - (1.0 - r2) * (n - 1) / (n - eff_params - 1) if n > eff_params + 1 else r2
    sigma2 = rss / (n - eff_params) if n > eff_params else rss / n
    aic = n * np.log(rss / n) + 2.0 * eff_params
    aicc = aic + (2.0 * eff_params * (eff_params + 1)) / max(n - eff_params - 1, 1)

    betas = result["local_betas"]
    coef_summary = {}
    for j, name in enumerate(var_names):
        col = betas[:, j]
        coef_summary[name] = {
            "mean": float(np.mean(col)),
            "std": float(np.std(col)),
            "min": float(np.min(col)),
            "q25": float(np.percentile(col, 25)),
            "median": float(np.median(col)),
            "q75": float(np.percentile(col, 75)),
            "max": float(np.max(col)),
        }

    return {
        "n_observations": n,
        "effective_parameters": round(eff_params, 2),
        "bandwidth": result["bandwidth"],
        "kernel": "adaptive_bisquare",
        "residual_sum_of_squares": round(rss, 4),
        "r_squared": round(r2, 6),
        "adj_r_squared": round(adj_r2, 6),
        "sigma_squared": round(sigma2, 4),
        "aic": round(aic, 4),
        "aicc": round(aicc, 4),
        "coefficient_summary": coef_summary,
    }


# ---------------------------------------------------------------------------
# Output writers
# ---------------------------------------------------------------------------


def write_outputs(
    output_dir: str,
    parcel_ids: np.ndarray,
    coords: np.ndarray,
    result: dict,
    summary: dict,
    var_names: list[str],
) -> None:
    os.makedirs(output_dir, exist_ok=True)

    # 1. Local coefficients CSV
    coef_path = os.path.join(output_dir, "local_coefficients.csv")
    betas = result["local_betas"]
    header = ["parcel_id", "x_coord", "y_coord"] + [f"beta_{v}" for v in var_names]
    with open(coef_path, "w", encoding="utf-8") as f:
        f.write(",".join(header) + "\n")
        for i in range(len(parcel_ids)):
            row = [
                str(parcel_ids[i]),
                f"{coords[i, 0]:.6f}",
                f"{coords[i, 1]:.6f}",
            ] + [f"{betas[i, j]:.6f}" for j in range(len(var_names))]
            f.write(",".join(row) + "\n")
    print(f"  Wrote {coef_path}")

    # 2. Summary statistics JSON
    summary_path = os.path.join(output_dir, "summary_statistics.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"  Wrote {summary_path}")

    # 3. Diagnostic map data CSV
    diag_path = os.path.join(output_dir, "diagnostic_map_data.csv")
    residuals = result["residuals"]
    local_r2 = result["local_r2"]
    y_hat = result["y_hat"]

    # Cook's D approximation
    sigma2 = summary["sigma_squared"]
    p = len(var_names)
    hat_trace = result["hat_matrix_trace"]
    n = len(parcel_ids)
    avg_leverage = hat_trace / n if n > 0 else 0.01
    cooks_d = (residuals**2 / (p * sigma2)) * (avg_leverage / (1.0 - avg_leverage) ** 2) if sigma2 > 0 else np.zeros(n)

    with open(diag_path, "w", encoding="utf-8") as f:
        f.write("parcel_id,x_coord,y_coord,y_hat,residual,local_r2,cooks_d\n")
        for i in range(n):
            f.write(
                f"{parcel_ids[i]},{coords[i,0]:.6f},{coords[i,1]:.6f},"
                f"{y_hat[i]:.2f},{residuals[i]:.2f},{local_r2[i]:.6f},"
                f"{cooks_d[i]:.6f}\n"
            )
    print(f"  Wrote {diag_path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run Geographically Weighted Regression (GWR) for county mass appraisal.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python run_gwr_model.py --input parcels.csv --output-dir ./gwr_output\n"
            "  python run_gwr_model.py --input parcels.csv --output-dir ./out --bandwidth 2500\n"
            '  python run_gwr_model.py --input "postgresql://u:p@host/db?table=sales" --output-dir ./out\n'
        ),
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Path to parcel CSV or database connection string (postgresql:// or sqlite://).",
    )
    parser.add_argument(
        "--output-dir",
        required=True,
        help="Directory for output files (created if absent).",
    )
    parser.add_argument(
        "--bandwidth",
        type=float,
        default=None,
        help="Fixed bandwidth distance. If omitted, selected automatically via cross-validation.",
    )
    parser.add_argument(
        "--kernel",
        choices=["bisquare"],
        default="bisquare",
        help="Kernel function (default: bisquare). Only bisquare is currently supported.",
    )

    args = parser.parse_args()

    print("=" * 60)
    print("GWR Model -- County Mass Appraisal")
    print("=" * 60)

    # Load data
    print(f"\nLoading data from: {args.input}")
    data = load_data(args.input)
    n = len(data["parcel_id"])
    print(f"  Loaded {n} parcels.")

    # Drop rows with NaN in any required numeric column
    numeric_cols = [c for c in REQUIRED_COLS if c != "parcel_id"]
    valid_mask = np.ones(n, dtype=bool)
    for c in numeric_cols:
        valid_mask &= ~np.isnan(data[c])
    n_dropped = n - valid_mask.sum()
    if n_dropped > 0:
        print(f"  Dropped {n_dropped} rows with missing values.")
        for c in REQUIRED_COLS:
            data[c] = data[c][valid_mask]
    n = len(data["parcel_id"])
    print(f"  {n} parcels available for modelling.")

    if n < len(EXPLANATORY) + 3:
        sys.exit("ERROR: not enough observations for GWR.")

    # Build matrices
    coords = np.column_stack([data["x_coord"], data["y_coord"]])
    y = np.log(data["sale_price"])  # log-transform sale price

    # Design matrix: intercept + explanatory variables
    X_cols = [np.ones(n)]
    for v in EXPLANATORY:
        X_cols.append(data[v])
    X = np.column_stack(X_cols)
    var_names = ["intercept"] + EXPLANATORY

    # Fit
    print("\nFitting GWR model...")
    result = fit_gwr(coords, X, y, bandwidth=args.bandwidth)
    print(f"  Model fit complete.  Effective parameters: {result['hat_matrix_trace']:.2f}")

    # Summary
    summary = compute_summary(y, result, var_names)
    print(f"  R-squared: {summary['r_squared']:.4f}  |  AICc: {summary['aicc']:.2f}")

    # Write outputs
    print(f"\nWriting outputs to: {args.output_dir}")
    write_outputs(args.output_dir, data["parcel_id"], coords, result, summary, var_names)

    print("\nDone.")


if __name__ == "__main__":
    main()
