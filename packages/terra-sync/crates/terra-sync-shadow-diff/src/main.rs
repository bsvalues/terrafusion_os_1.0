//! terra-sync-shadow-diff — Phase 2 parity comparator.
//!
//! For a given `CountyId`, compares row counts and missing/extra rows
//! between `shadow."<table>"` and `public."<table>"` across the three
//! Phase 2 canonical tables. Emits a JSON report to stdout.
//!
//! Phase 2 exit gate (Task 16): every report's `delta_percent` must
//! stay below 0.1 for 7 consecutive days.

use sqlx::postgres::PgPoolOptions;
use terra_sync_shadow_diff::delta_percent;

/// Parity diff report for one shadow table.
///
/// `coverage_level` explicitly discriminates what was compared:
/// - `"row-existence-only"` — Phase 2 baseline (this file); compares
///   primary-key presence but not column values
/// - `"row-and-values"` — Phase 2.1 enhancement (not yet implemented);
///   will include sum/min/max/median over numeric columns per
///   neighborhood
#[derive(Debug)]
struct DiffReport {
    table: String,
    truth_row_count: i64,
    shadow_row_count: i64,
    missing_in_shadow: i64,
    extra_in_shadow: i64,
    coverage_level: &'static str,
    delta_percent: f64,
}

impl DiffReport {
    fn emit_json(&self) -> serde_json::Value {
        serde_json::json!({
            "table": self.table,
            "truth_row_count": self.truth_row_count,
            "shadow_row_count": self.shadow_row_count,
            "missing_in_shadow": self.missing_in_shadow,
            "extra_in_shadow": self.extra_in_shadow,
            "coverage_level": self.coverage_level,
            "delta_percent": self.delta_percent,
            "threshold_ok": self.delta_percent < 0.1,
        })
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();

    let db_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:devpassword123@localhost:5432/terrafusion".into());
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;

    let county_id: uuid::Uuid = uuid::Uuid::parse_str("19190019-1919-1919-1919-191919191919")?;
    let tax_year = 2026i32;

    // (Table name, primary natural-key column on both sides.)
    let tables = [
        ("Properties", "ParcelId"),
        ("CamaCharacteristics", "ParcelId"),
        ("PropertyAssessments", "PropertyParcelId"),
    ];

    let mut reports = Vec::new();

    for (tbl, key) in tables {
        let truth_count: (i64,) = sqlx::query_as(&format!(
            r#"SELECT COUNT(*) FROM public."{tbl}" WHERE "CountyId" = $1"#
        ))
        .bind(county_id)
        .fetch_one(&pool)
        .await?;

        let shadow_count: (i64,) = sqlx::query_as(&format!(
            r#"SELECT COUNT(*) FROM shadow."{tbl}" WHERE "CountyId" = $1"#
        ))
        .bind(county_id)
        .fetch_one(&pool)
        .await?;

        let missing: (i64,) = sqlx::query_as(&format!(
            r#"SELECT COUNT(*) FROM public."{tbl}" t
                 WHERE t."CountyId" = $1
                   AND NOT EXISTS (
                     SELECT 1 FROM shadow."{tbl}" s
                      WHERE s."CountyId" = t."CountyId" AND s."{key}" = t."{key}")"#
        ))
        .bind(county_id)
        .fetch_one(&pool)
        .await?;

        let extra: (i64,) = sqlx::query_as(&format!(
            r#"SELECT COUNT(*) FROM shadow."{tbl}" s
                 WHERE s."CountyId" = $1
                   AND NOT EXISTS (
                     SELECT 1 FROM public."{tbl}" t
                      WHERE t."CountyId" = s."CountyId" AND t."{key}" = s."{key}")"#
        ))
        .bind(county_id)
        .fetch_one(&pool)
        .await?;

        let mismatches = missing.0 + extra.0;
        let rep = DiffReport {
            table: tbl.to_string(),
            truth_row_count: truth_count.0,
            shadow_row_count: shadow_count.0,
            missing_in_shadow: missing.0,
            extra_in_shadow: extra.0,
            coverage_level: "row-existence-only",
            delta_percent: delta_percent(truth_count.0, mismatches),
        };
        tracing::info!(
            table = %rep.table,
            truth = rep.truth_row_count,
            shadow = rep.shadow_row_count,
            missing = rep.missing_in_shadow,
            extra = rep.extra_in_shadow,
            delta_pct = rep.delta_percent,
            "shadow diff"
        );
        reports.push(rep.emit_json());
    }

    let out = serde_json::json!({
        "generated_at_utc": chrono::Utc::now(),
        "county_id": county_id.to_string(),
        "tax_year": tax_year,
        "reports": reports,
    });
    println!("{}", serde_json::to_string_pretty(&out)?);

    Ok(())
}
