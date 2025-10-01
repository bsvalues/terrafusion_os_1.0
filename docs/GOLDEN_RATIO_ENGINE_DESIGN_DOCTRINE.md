# TerraFusion Golden Ratio Engine — Design Doctrine v1.0

> **Purpose**: Codify the 4D/12D Yin–Yang × Fibonacci concept into TerraFusion OS as a governing **engineering doctrine**: philosophy → math → architecture → implementation → validation.

---

## 0) Doctrine Summary

* **Thesis**: Chaos (multi‑department, multi‑system government complexity) collapses into **order** when projected through TerraFusion's φ‑governed kernels and staged reductions.
* **Pillars**: (1) **Harmony** (Yin–Yang), (2) **Self‑similar Scaling** (Fibonacci/φ), (3) **Safe Projection** (bounded transforms), (4) **Auditability** (explanations + proofs).
* **Deliverable**: A **production module** (GRE) + **platform rules** that constrain how data flows, how plugins earn weight, and how UI explains decisions.

---

## 1) Math → Kernel → Contract

### 1.1 Core constants

* φ = 1.61803398875, φ⁻¹ = 0.61803398875, φ² ≈ 2.618, φ³ ≈ 4.236
* Golden angle θ = 2π/φ² (default), **advanced**: θₕ = 2π/φ³ (Labs)

### 1.2 Canonical kernels (closed‑form)

* **Space**: $w_s(d) = e^{-(d/\lambda)^{\alpha}} \cdot \frac{1}{1 + \beta\,\sin(2\pi\,\log_{\varphi}(\max(d,\varepsilon)))}$
* **Time**: $w_t(\Delta t) = (1 + \Delta t/\tau)^{-\gamma}$
* **Feature (continuous)**: $w_f(\delta) = e^{-(|\delta|/s)^{\alpha}}$
* **Feature (categorical)**: $w_c(\Delta) = \varphi^{-\lvert\Delta\rvert}$
* **Composite**: $W = ( w_s^p \cdot w_t^q \cdot \prod_i w_{f_i}^{r_i} )^{1/(p+q+\sum r_i)}$

### 1.3 Safety & bounds (projection doctrine)

* Clamp inputs; **no singularities**: $d \ge \varepsilon$, scales in **\[min,max]**.
* Parameter guards: α,γ ∈ \[0.3,0.8]; β ∈ \[0,0.2]; λ,τ via county priors.
* Deterministic rounding of inputs used in audit trails.

---

## 2) 12D → OS Layer Mapping (the Projection Cascade)

Map the 12 conceptual dimensions to OS layers; the "projection cascade" is the doctrine for **reducing** complexity into a stable 2D/3D user surface.

| Dim | Meaning         | TerraFusion Layer                              | Projection Output             |
| --: | --------------- | ---------------------------------------------- | ----------------------------- |
|  12 | Policy Universe | **Policy & Legal Constraints**                 | Constraint set (RCWs, CFRs) ↘ |
|  11 | Security Fabric | **Trust Fabric** (authN/Z, RBAC, attestations) | Signed claims ↘               |
|  10 | Data Provenance | **Lineage/SBOM/ETL proofs**                    | Provenance graph ↘            |
|   9 | Market Signals  | **Marketplace economics**                      | Price/usage priors ↘          |
|   8 | Spatial Field   | **GIS/PostGIS**                                | Indexed geometries ↘          |
|   7 | Temporal Field  | **Time series**                                | Rollups, SLAs ↘               |
|   6 | Feature Space   | **Entity schema** (parcel, comps, income)      | Feature vectors ↘             |
|   5 | Model State     | **Valuation models** (MRA/ML/GRE)              | Score tensors ↘               |
|   4 | Workflow        | **Pipelines/queues**                           | DAG state ↘                   |
|   3 | Service Plane   | **APIs/Gateways**                              | REST/GraphQL ↘                |
|   2 | Application     | **Apps/Plugins**                               | Screens + actions ↘           |
|   1 | Human Surface   | **UI** (Assessor/Citizen)                      | Explainable decisions ✅       |

**Rule**: Higher dims **must project** with bounded transforms; if any layer fails guardrails, **gracefully degrade** (fallback kernel), never crash the surface.

---

## 3) System Contracts (what every component MUST do)

1. **GRE Contract**: Given subject + comps, return {W per comp, factors, φ‑rings, diagnostics}. Must log: inputs, params, outputs, latency, guardrail hits.
2. **Data Contract**: Distances, timestamps, features emitted with units + precisions; GIS must provide KNN and CRS metadata.
3. **Explainability Contract**: UI receives per‑comp factor breakdown and φ‑ring index; renders badges + tooltips; exports CSV/GeoJSON with W.
4. **Audit Contract**: Every decision reproducible from **docs + data**. Include config JSON, hash of code version, and seed.

---

## 4) Reference Configuration (env + JSON)

```json
{
  "gre": {
    "enabled": true,
    "space": { "lambda_miles": 0.75, "alpha": 0.4812, "beta": 0.12 },
    "time": { "tau_days": 90, "gamma": 0.4812 },
    "features": {
      "price_per_sf": { "scale": 25, "alpha": 0.4812, "weight": 1.0 },
      "beds": { "scale": 1, "alpha": 0.4812, "weight": 0.6 },
      "baths": { "scale": 1, "alpha": 0.4812, "weight": 0.6 },
      "living_sf": { "scale": 300, "alpha": 0.4812, "weight": 1.0 },
      "quality": { "categorical_penalty_phi": true, "weight": 0.5 }
    },
    "explain": true,
    "caps": { "min_weight": 0.02, "max_comps": 50 },
    "labs": { "golden_angle_mode": "phi2", "advanced_ratio": "phi3" }
  }
}
```

**.env keys**

```
GRE_ENABLED=true
GRE_SPACE_LAMBDA_MILES=0.75
GRE_SPACE_ALPHA=0.4812
GRE_SPACE_BETA=0.12
GRE_TIME_TAU_DAYS=90
GRE_TIME_GAMMA=0.4812
```

---

## 5) Interfaces

### 5.1 API (Axum/.NET adapter)

* `POST /api/v1/gre/score` → `{scores:[{id,W,explain}], stats}`
* `POST /api/v1/gre/tune` → grid search K‑fold; returns best (λ,τ,β,α)
* `GET /api/v1/gre/health` → liveness/latency histograms

### 5.2 DB (PostGIS + telemetry)

* Tables: `gre_runs`, `gre_comp_scores` (+ indices on `(subject_pid, ts)` and `W DESC`)
* KNN prefilter: `ORDER BY s.geom <-> c.geom LIMIT 500`
* φ‑ring view: `SELECT FLOOR(LN(GREATEST(miles,1e-6))/LN(1.6180339)) AS ring_k`

### 5.3 UI (Next.js)

* **GRE Toggle** + sliders (λ, τ, β, p/q/rᵢ) and **Trust View** (comps with W≥0.2)
* **Visualizer/Tuner** dual mode; rings, weights, tooltips; export CSV/GeoJSON.

---

## 6) Guardrails & Fallbacks (operational safety)

* **Shadow Mode**: compute W but don't influence price; compare against baseline.
* **Coverage Gate**: if `< N` comps with W≥0.1 → fallback to baseline kernel.
* **Stability Gate**: if guardrails breached (NaN, extreme skew) → auto‑reduce β and widen λ.
* **Time Gate**: if Δt distribution heavy‑tail → increase τ or cap q.

---

## 7) Validation & Proof

* **Unit**: kernel monotonicity, boundary behavior, φ‑ring placement.
* **Property‑based**: invariants (d→0 ⇒ w→≈1; d→∞ ⇒ w→0; symmetry).
* **Integration**: 3× neighborhoods × 2 asset classes; compare MAE/RMSE vs baseline, target ≥3–7% improvement.
* **Backtest**: K‑fold with frozen seeds; archive results in `gre_runs`.
* **Observability**: metrics `gre.kernel_params`, `gre.latency_ms`, `gre.weight_histogram` + 1% full explain sample to logs.

---

## 8) Marketplace & Economics (φ in revenue)

* Tiering mirrors kernel:

  * **Tier 1**: Weights only (W) → base value.
  * **Tier 2**: W + explanations + φ‑rings.
  * **Tier 3**: Tuner + exports + analyst overlays.
* Usage pricing aligned to **ring occupancy** (pay for informative comps).
* Developer SDK: expose `w_*` helpers so plugins align with platform physics.

---

## 9) Narrative & Compliance

* **Narrative**: "Golden Ratio Engine brings **harmony** to county data. Self‑similar patterns guide valuations, neighborhoods, and workloads. No black boxes — just provable math."
* **Compliance**: Audit packs export: config, code hash, seed, inputs, outputs; ADA/508‑friendly explanations; defensible adjustments with per‑factor deltas.

---

## 10) Rollout Plan

1. **Feature flag** → enable GRE in dev; run **shadow** in staging.
2. **Gate** by county (Benton pilot) with weekly backtest report.
3. **A/B** (20/80) in production; watch MAE, assessor overrides, appeal rates.
4. **Promote** to 100% when ≥ baseline for 30 days and audit packs clean.
5. **Train**: short Assessor handbook + 5‑min explainer.

---

## 11) TerraFusion OS Integration

### 11.1 Rust Performance Engine Integration
The Golden Ratio Engine is implemented as the **7th core component** of the Elite Rust Performance Engine:

```rust
// rust-performance-engine/crates/golden-core/
// Core φ constants and fast Fibonacci implementation

// rust-performance-engine/crates/golden-graph/ 
// Golden Laplacian Lφ and spectral filtering

// rust-performance-engine/crates/golden-opt/
// Golden section and Fibonacci search algorithms

// rust-performance-engine/crates/golden-service/
// Axum HTTP service for GRE API endpoints

// rust-performance-engine/crates/golden-tn/
// Fibonacci anyon tensors for advanced analytics
```

### 11.2 .NET API Gateway Integration
GRE endpoints integrated via FFI bridge:
```csharp
// backend/TerraFusion.API/Controllers/GoldenRatioController.cs
[Route("api/v1/gre")]
public class GoldenRatioController : ControllerBase
{
    [HttpPost("score")]
    public async Task<IActionResult> Score([FromBody] GREScoreRequest request)
    
    [HttpPost("tune")] 
    public async Task<IActionResult> Tune([FromBody] GRETuneRequest request)
    
    [HttpGet("health")]
    public async Task<IActionResult> Health()
}
```

### 11.3 Government Module Integration
The GRE is available as a hot-swappable module in `/modules/golden-ratio-engine/` with:
- RBAC configuration for government users
- Billing integration for marketplace pricing  
- Next.js UI for φ-ring visualization and tuning
- Export capabilities for audit compliance

---

## 12) Appendices

* **A. Parameter heuristics** by asset class (SFH vs Condo vs Rural land).
* **B. φ‑Ring cheatsheet** (distance → ring\_k ladder).
* **C. Tuning cookbook** (λ/τ/β adjustments by market regime).
* **D. Failure modes** and automatic mitigations.

---

### Final Word

This doctrine makes φ not just a motif but a **governing law** inside TerraFusion: from kernel math to marketplace pricing, from API contracts to UI explanations. Implement once, apply everywhere — and keep it **bounded, explainable, and auditable**.

**TerraFusion OS now embodies mathematical harmony through the Golden Ratio Engine - bringing order to government complexity through φ-governed kernels and provable mathematical foundations.**