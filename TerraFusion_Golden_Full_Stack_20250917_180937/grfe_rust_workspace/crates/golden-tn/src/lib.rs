
use ndarray::prelude::*;

/// Quantum dimensions for Fibonacci anyon category: d(I)=1, d(τ)=φ
pub fn quantum_dimensions_phi() -> (f64, f64) {
    let sqrt5 = 5f64.sqrt();
    let phi = (1.0 + sqrt5) / 2.0;
    (1.0, phi)
}

/// A toy F-symbol table: F^{τ τ τ}_{τ τ τ}
pub fn f_symbol_tau_tau_tau() -> Array2<f64> {
    let (_, phi) = quantum_dimensions_phi();
    // Not normalized physically-accurate; demonstrational
    arr2(&[
        [phi.powf(-0.5), phi.powf(-0.5)],
        [phi.powf(-0.5), -phi.powf(0.5)],
    ])
}
