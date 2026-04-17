use terra_sync_shadow_diff::delta_percent;

#[test]
fn delta_zero_when_no_truth_no_mismatch() {
    assert_eq!(delta_percent(0, 0), 0.0);
}

#[test]
fn delta_100_when_no_truth_but_mismatches() {
    assert_eq!(delta_percent(0, 5), 100.0);
}

#[test]
fn delta_ratio_matches() {
    let d = delta_percent(1000, 3);
    assert!((d - 0.3).abs() < 1e-9, "got {d}");
}

#[test]
fn under_threshold_when_less_than_zero_point_one() {
    assert!(delta_percent(100_000, 99) < 0.1);
    assert!(delta_percent(100_000, 100) >= 0.1);
}
