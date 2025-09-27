
use anyhow::Result;
use golden_core::PhiConstants;
use ndarray::{Array1, Array2};

#[derive(Debug, Clone)]
pub struct Spectrum {
    pub eigenvalues: Vec<f64>,
    pub eigenvectors: Array2<f64>, // columns are eigenvectors
}

/// Build degree matrix D, adjacency A, Laplacian L from adjacency matrix (square, symmetric expected).
fn build_mats(adjacency: &Array2<f64>) -> (Array2<f64>, Array2<f64>, Array2<f64>) {
    let n = adjacency.nrows();
    let mut d = Array2::<f64>::zeros((n, n));
    for i in 0..n {
        let s: f64 = adjacency.row(i).sum();
        d[(i, i)] = s;
    }
    let l = &d - adjacency;
    (d, adjacency.clone(), l)
}

/// Golden Laplacian Lφ = φ² L + (1/φ) A - (φ-1) D
pub fn golden_laplacian(adjacency: &Array2<f64>) -> Array2<f64> {
    let (d, a, l) = build_mats(adjacency);
    let phi = PhiConstants::default().phi;
    l * (phi * phi) + a * (1.0 / phi) - d * (phi - 1.0)
}

/// Very simple power-iteration to get k smallest eigenpairs (toy; not robust).
pub fn toy_symmetric_eigs(m: &Array2<f64>, k: usize, iters: usize) -> Result<Spectrum> {
    let n = m.nrows();
    let mut vecs: Vec<Array1<f64>> = Vec::new();
    let mut vals: Vec<f64> = Vec::new();
    // Shift-and-invert would be better; we do repeated orthogonalized power iterations.
    // For "smallest", we power-iterate on inverse of (I + M), approximated by Jacobi steps (toy!).

    let id = Array2::<f64>::eye(n);
    let mut a = id.clone();
    a = &a + m; // A = I + M

    // Jacobi preconditioner
    let mut inv_diag = vec![1.0; n];
    for i in 0..n {
        let v = a[(i,i)];
        inv_diag[i] = if v.abs() > 1e-12 { 1.0 / v } else { 1.0 };
    }

    for _ in 0..k {
        // random init
        let mut v = Array1::<f64>::from(vec![1.0; n]);
        // orthogonalize against previous vecs
        for _ in 0..iters {
            // y = (I + M)^{-1} v  ~ Jacobi step
            let mut y = v.clone();
            // Jacobi iteration: y_i = (v_i - sum_{j!=i} A_ij y_j) / A_ii
            // here we do one sweep
            for i in 0..n {
                let mut s = v[i];
                for j in 0..n {
                    if j != i {
                        s -= a[(i,j)] * y[j];
                    }
                }
                y[i] = s * inv_diag[i];
            }
            // Gram-Schmidt
            for prev in &vecs {
                let dot = y.dot(prev) / prev.dot(prev);
                y = &y - &(prev * dot);
            }
            // normalize
            let norm = y.dot(&y).sqrt().max(1e-12);
            v = y.mapv(|x| x / norm);
        }
        // Rayleigh quotient on M
        let mv = m.dot(&v);
        let lambda = v.dot(&mv);
        vecs.push(v);
        vals.push(lambda);
    }

    // assemble eigenvectors into columns
    let mut evecs = Array2::<f64>::zeros((n, k));
    for (j, v) in vecs.iter().enumerate() {
        for i in 0..n {
            evecs[(i, j)] = v[i];
        }
    }
    Ok(Spectrum { eigenvalues: vals, eigenvectors: evecs })
}

/// Golden low-pass filter H(λ) = 1 / (1 + (λ/φ)^2)
pub fn golden_lowpass(lambda: f64) -> f64 {
    let phi = PhiConstants::default().phi;
    1.0 / (1.0 + (lambda / phi).powi(2))
}
