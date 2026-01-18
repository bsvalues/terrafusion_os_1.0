# Benton County 2026 Residential Market Calibration Technical Report

**Report Prepared:** January 08, 2026

## 1.0 Introduction: A Defensible Framework for Market Calibration

This report provides a comprehensive technical overview of Benton County's market-calibrated costing workflow for the 2026 assessment cycle. It details the methodology used to translate market signals, derived from arms-length sales data, into systematic and defensible updates for the county's Residential (RES) cost matrices. The objective of this process is to ensure that assessed values accurately reflect current market conditions through a transparent, evidence-based framework.

A core principle of this framework is the critical distinction between legitimate market calibration and impermissible sales chasing. Market calibration is defined as the process of making system-wide parameter updates based on representative sales evidence, governed by statistical controls and a formal review protocol. In contrast, sales chasing involves assessments reacting to known sale prices on an individual or ad-hoc basis, rather than responding to broader market signals.

The strategic importance of this distinction cannot be overstated. A defensible calibration process improves vertical equity, ensuring that properties of different values are assessed at a consistent percentage of their market price. Furthermore, it establishes a robust and transparent methodology that can withstand internal and external audits. The absence of such a framework can lead to several key audit detection indicators that suggest sales chasing may be occurring:

* Unstable assessment-to-sale (A/S) ratio trends around sale dates.
* Inconsistent application of time-slice adjustments.
* The presence of Price-Related Bias (PRB) artifacts in ratio studies.
* Anomalous assessment patterns within specific neighborhoods that are not supported by market-wide evidence.

This report outlines the end-to-end workflow designed to prevent these issues, beginning with the foundational elements of data and modeling.

## 2.0 Data, Stratification, and Modeling Framework

The integrity of any market calibration system rests upon the quality of its data foundation and the statistical rigor of its modeling approach. This section details the data sources, stratification strategy, and the fixed-effect hedonic model used to isolate the price signals of individual property characteristics from confounding market factors.

### 2.1 Data Sourcing and Preparation

The analysis is based on arms-length residential sales sourced from the "Benton County Dashboard (sheet: Valid Sales)." Prior to modeling, this raw data undergoes a standard preparation process, including the application of plausibility filters to remove outlier transactions based on sale price and property area. This ensures the model is trained on a set of transactions that are representative of typical market activity.

### 2.2 Stratification Strategy

To ensure model accuracy and the targeted application of findings, the sales data is stratified into meaningful analytical groups. The primary stratification variables are class_cd (a proxy for quality), a derived quality tier, and Hood_main neighborhood groupings. This granular approach is essential for cost-table governance, as it allows for the development of tailored adjustments that reflect market nuances across different property types and locations. All strata are subject to minimum sample size requirements and stability checks to ensure the reliability of the statistical evidence.

### 2.3 Hedonic Modeling and Fixed-Effect Identification Strategy

The core of the analytical framework is a hedonic regression model. The model's dependent variable is the natural log of Sale Price, or ln(Sale Price). The core explanatory variables, or regressors, used to explain price variations include:

* ln(area)
* effective age
* condition dummies
* ln(garage)
* ln(basement)
* a finished-share term for basements
* ln(lot)

A critical component of the model is the use of a fixed-effect (or "within") estimator. The purpose of this technique is to isolate characteristic effects from neighborhood and market-time shocks. Specifically, the model incorporates Neighborhood x SaleMonth fixed effects. The intuition behind this approach is that by de-meaning all variables within each unique neighborhood-month combination, the model effectively removes the average price influence of that specific time and place. This allows for a more precise measurement of how a change in a physical characteristic, like square footage or condition, impacts price, holding location and market timing constant.

This modeling strategy yields robust coefficients that serve as direct market evidence on the marginal value of property characteristics, forming the basis for the analysis in the following section.

## 3.0 Market Evidence and Key Findings

The fixed-effect model generates coefficients that represent market-derived evidence on the value contributed by various property characteristics. These statistical outputs are the signals used to inform and guide adjustments to the cost tables. This section analyzes these key value drivers, interprets their meaning for valuation, and presents the most significant findings from the 2026 calibration cycle.

### 3.1 Analysis of Key Drivers by Quality Tier

Across all strata, property size (ln area) is consistently the dominant driver of value, exhibiting diminishing returns as expected (i.e., the value per square foot decreases as size increases). The next most significant factor is property condition, followed by features such as basements and garages. Table 1 summarizes the key signals stratified by the three primary quality tiers.

**Table 1: Key Signals by Quality Tier (within Neighborhood x SaleMonth)**

| Quality tier | Sales n | Size elasticity (ln area) | Age %/yr | Cond4 vs 3 (%) | Cond5 vs 3 (%) | Garage elasticity (ln) | Basement elasticity (ln total) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Tier 1 (Low) | 1375 | 0.3237 | -0.2174 | 8.4479 | 8.4716 | 0.0190 | -0.0148 |
| Tier 2 (Mid) | 19052 | 0.3754 | -0.3065 | 9.2187 | 19.7547 | 0.0144 | 0.0112 |
| Tier 3 (High) | 5252 | 0.3637 | -0.4963 | 10.0310 | 27.9638 | -0.0042 | 0.0120 |

As shown in the "Size Effect by Quality Tier" analysis, the size elasticity—which represents the percentage change in price for a one percent change in area—varies across quality tiers. It is lowest for Tier 1 (Low) properties at approximately 0.324 and peaks for Tier 2 (Mid) properties at approximately 0.375, before declining slightly for Tier 3 (High) properties. This indicates that the market's valuation of additional square footage differs meaningfully by property quality.

### 3.2 Interpretation of Model Coefficients as Cost-Table Levers

The statistical outputs from the model are not merely academic; they are directly translatable into actionable adjustments for the county's cost tables. Each key coefficient corresponds to a specific "lever" within the cost matrices:

*   **Size Elasticity:** This coefficient informs the slope of the size curve in the cost tables and directly relates to the principle of diminishing returns. A higher elasticity suggests a steeper curve.
*   **Condition Premiums:** The percentage premiums for properties in better condition (e.g., Cond4 or Cond5 relative to the Condition 3 baseline) translate directly into condition multipliers or equivalent effective-age shifts within the depreciation schedule.
*   **Basement Coefficients:** The model's estimates for total and finished basement area inform the unit value of unfinished base area plus the additional value uplift for finished area.
*   **Garage Elasticity:** The coefficient for garage area maps directly to the values within the feature matrix for detached garages.

This direct mapping from model coefficients to cost-table levers provides the framework for translating statistical findings into the candidate matrix changes detailed next.

## 4.0 Mapping Market Evidence to RES Cost Matrices

This section outlines the process of translating statistical evidence from the hedonic model into concrete, candidate changes for Benton County's official RES cost tables. This is not an automated process but a governed workflow that uses the MAP_Flags_Top triage system to prioritize review of the areas with the greatest divergence between current cost tables and recent market signals.

### 4.1 Triage and Prioritization of Divergences

To manage the review process efficiently, a triage system, MAP_Flags_Top, is used to identify and prioritize the most significant divergences. This system flags individual cells within the cost matrices where the absolute difference between the current value and the market-suggested value is largest and where the statistical evidence supporting a change is strongest. This ensures that analytical resources are focused on the areas with the greatest potential for improving assessment accuracy.

**Table 2: Top Flagged Divergences for Governance Review**

| matrix | segment | axis | cell | current | suggested | delta |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| RES_depre_matrix | POOR | age | 70 | 80.0 | 39.0 | -41.0 |
| RES_depre_matrix | POOR | age | 999 | 80.0 | 40.0 | -40.0 |
| RES_depre_matrix | POOR | age | 75 | 80.0 | 40.0 | -40.0 |
| RES_depre_matrix | VPO | age | 60 | 90.0 | 53.0 | -37.0 |
| RES_depre_matrix | VPO | age | 999 | 90.0 | 55.0 | -35.0 |
| RES_depre_matrix | VPO | age | 75 | 90.0 | 55.0 | -35.0 |
| RES_depre_matrix | VPO | age | 70 | 90.0 | 55.0 | -35.0 |
| RES_depre_matrix | POOR | age | 60 | 70.0 | 36.0 | -34.0 |
| RES_depre_matrix | VPO | age | 50 | 85.0 | 51.0 | -34.0 |
| RES_depre_matrix | BLN | age | 999 | 65.0 | 32.0 | -33.0 |
| RES_depre_matrix | BLN | age | 75 | 65.0 | 32.0 | -33.0 |
| RES_depre_matrix | POOR | age | 50 | 65.0 | 34.0 | -31.0 |
| RES_depre_matrix | VPO | age | 45 | 80.0 | 50.0 | -30.0 |
| RES_depre_matrix | BLN | age | 70 | 60.0 | 30.0 | -30.0 |
| RES_depre_matrix | BLN | age | 50 | 55.0 | 26.0 | -29.0 |
| RES_depre_matrix | POOR | age | 45 | 60.0 | 33.0 | -27.0 |
| RES_depre_matrix | NML | age | 999 | 50.0 | 23.0 | -27.0 |
| RES_depre_matrix | VPO | age | 0 | 15.0 | 42.0 | 27.0 |
| RES_depre_matrix | BLN | age | 60 | 55.0 | 28.0 | -27.0 |
| RES_depre_matrix | BLN | age | 45 | 50.0 | 24.0 | -26.0 |

### 4.2 Depreciation Matrix (RES_depre_matrix)

The largest systematic divergence identified in the 2026 cycle is within the depreciation schedule. The mapping methodology generates suggested depreciation factors by combining the market-implied annual age slope with the market-derived condition premiums. These condition premiums are translated into an "age shift," which modifies the baseline depreciation curve for different condition ratings. As visualized in the "RES Depreciation Curves" comparison, the suggested curves are generally less aggressive than the current curves. This is particularly evident for properties in lower condition bands, such as 'POOR' (grey line) and 'VPO' (cyan line), where the current depreciation factors are materially higher than the market suggests across nearly all effective ages. This finding suggests that the current factors may be over-depreciating improvements relative to how they are priced in the market.

### 4.3 Basement Matrices (RES - BSMT / RES - U-BSMT)

The mapping approach for basements is designed to preserve the existing matrix structure, including its size binning. Updates are implemented as class-specific scale factors that are applied to the current matrices to align them with market-implied unit values derived from the model. A key constraint in this process is that the value of an unfinished area cannot exceed the value of a finished area for the same class and size. The analysis of scale factors, as shown in the corresponding graph, reveals a dramatic sawtooth pattern for unfinished basements, with required upward adjustments exceeding 3.5x for 'Chp' and 'Low' class bands, indicating a significant undervaluation in the current matrices for these specific segments.

### 4.4 Detached Garage Matrix (Res - Detached Garage)

For detached garages, rates are recomputed by class and size bin to align them with market evidence. The analysis indicates that the largest divergences between current and market-implied rates are concentrated in the smaller size bins. As visualized in the comparison graph, the suggested rate for class 50 (solid grey line) is dramatically higher than the current rate (dashed grey line) in the 200-400 SF bins, correcting a key area of divergence. The mapping process ensures that the logical principle of monotonicity is maintained, meaning the unit rate ($/SF) continues to decline as garage size increases.

All such candidate changes generated through this mapping process are provisional until they pass the rigorous validation and governance protocol.

## 5.0 Validation and Governance Protocol

The validation and governance stage is the essential final control in the calibration workflow. It ensures that any proposed changes are statistically sound, demonstrably improve assessment equity, and are implemented in a controlled manner that prevents sales chasing. This protocol acts as a 'fail-closed' gate, ensuring that only validated, equity-enhancing adjustments are promoted to the production environment.

### 5.1 Validation via Paired Ratio Studies

The primary validation method is a paired before/after ratio study conducted on the same set of valid sales. This study calculates key performance metrics for the assessment population both with the current cost tables ("before") and with the candidate changes applied ("after"). The key metrics, computed by strata, include:

*   **Coefficient of Dispersion (COD):** A measure of assessment uniformity.
*   **Price-Related Differential (PRD):** A measure of vertical equity, with an ideal value near 1.00.
*   **Price-Related Bias (PRB):** A measure of the relationship between appraisal ratios and sale price, with an ideal slope near 0.

The primary goal of any change is to improve vertical equity by reducing PRB and stabilizing PRD around 1.00, while ensuring the COD remains within IAAO-expected ranges. As part of this validation, anti-chasing checks such as time-slice monitoring are also performed to confirm that adjustments reflect broad market trends rather than isolated pockets of recent sales.

### 5.2 Governance Framework and Release Management

A set of core governance "guardrails" controls the implementation of any changes to the production cost tables. These rules are designed to ensure stability, transparency, and logical consistency.

*   **Caps:** Limits are applied to the magnitude of per-cycle movement on sensitive matrices. Exceptions to these caps require explicit signoff and justification.
*   **Monotonicity:** The process preserves the logical order of values. For example, the cost per square foot for a garage must decrease as the garage size increases.
*   **Versioning:** All adopted changes are meticulously documented in versioned matrix releases. This documentation includes clear rationales, detailed change logs, and a pre-defined rollback plan.

### 5.3 Monitoring Cadence

To ensure the system remains calibrated and responsive over time, an ongoing monitoring process is in place. This includes a regular schedule of reviews and updates:

*   Monthly calibration dashboards to track key market drivers.
*   Quarterly deep dives to analyze emerging trends.
*   Annual release ceremony to formally review, validate, and adopt the coming year's cost tables.

This end-to-end governed workflow ensures that every change is evidence-based, validated, and documented.

## 6.0 Conclusion

Benton County's market calibration system represents a defensible, evidence-based process designed to improve assessment quality and equity. By systematically translating market signals into cost-table adjustments within a governed framework, the workflow ensures that valuations remain aligned with the market while explicitly preventing the practice of sales chasing.

The primary findings of the 2026 calibration cycle highlight a significant systematic divergence in the depreciation schedule, with evidence suggesting the current curve is overly aggressive compared to market behavior. Additionally, targeted adjustments have been proposed for basement and detached garage matrices to better reflect pricing variations by class and size.

All proposed changes detailed in this report are considered candidates pending the results of the rigorous validation and governance protocol outlined herein. This final step ensures that only changes proven to enhance the fairness and accuracy of assessments are implemented.

## Appendix: Glossary of Key Terms

**COD (Coefficient of Dispersion):** A measure of assessment uniformity. It indicates the average percentage deviation of individual assessment ratios from the median ratio. Lower values generally signify greater uniformity.

**PRD (Price-Related Differential):** A measure of vertical equity comparing the mean ratio of high-price sales to the mean ratio of low-price sales. An ideal value is near 1.00. Values above 1.03 may suggest high-value properties are under-assessed (regressivity), while values below 0.98 may suggest low-value properties are under-assessed (progressivity).

**PRB (Price-Related Bias):** A more advanced statistical measure of vertical equity that calculates the slope of the relationship between appraisal ratios and sale prices. An ideal slope is near 0, indicating that valuation accuracy is consistent across all price points.

**Fixed Effects (FE):** Statistical controls used in a regression model to capture unobserved influences related to specific groups, such as time periods or geographic locations (e.g., a specific neighborhood in a specific month).

**Within Estimator:** A regression technique that analyzes variation within fixed-effect groups to isolate the impact of property characteristics. For example, it measures how a property's features affect its price relative to the average price of other properties in the same Neighborhood x SaleMonth combination.

**Monotonicity:** The principle that ordered bins or values in a cost table should behave consistently and logically. For instance, the price per square foot ($/SF) for a garage must decrease as its size increases.
