//! Shadow parity diff library.
//!
//! `delta_percent` is the single piece of logic shared with the binary
//! so it can be unit-tested without a live Postgres.

/// Percentage of diff rows relative to the truth side. Returns:
/// - `0.0` when both sides are empty.
/// - `100.0` when truth is empty but the shadow side has rows
///   (nothing to compare against; the shadow is 100% drift from nothing).
/// - `(mismatches / truth) * 100` otherwise.
pub fn delta_percent(truth: i64, mismatches: i64) -> f64 {
    if truth == 0 {
        if mismatches == 0 {
            0.0
        } else {
            100.0
        }
    } else {
        (mismatches as f64 / truth as f64) * 100.0
    }
}
