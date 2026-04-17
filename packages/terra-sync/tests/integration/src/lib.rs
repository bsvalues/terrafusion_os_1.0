//! terra-sync-integration-tests
//!
//! In-process smoke tests that cross crate boundaries. Individual
//! crate unit tests live alongside their crates; this package holds
//! tests that exercise policy + audit + control interactions at the
//! integration boundary.
//!
//! No library surface is exported — all test bodies live in
//! `tests/phase2_smoke.rs` and peers.
