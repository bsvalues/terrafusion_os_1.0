
// cargo run --example e1_spectral_golden
use golden_graph::{golden_laplacian, golden_lowpass, toy_symmetric_eigs};
use ndarray::Array2;

fn main() {
    // simple chain graph 5 nodes
    let adj = array2(&[
        [0.,1.,0.,0.,0.],
        [1.,0.,1.,0.,0.],
        [0.,1.,0.,1.,0.],
        [0.,0.,1.,0.,1.],
        [0.,0.,0.,1.,0.],
    ]);
    let lphi = golden_laplacian(&adj);
    let spec = toy_symmetric_eigs(&lphi, 3, 60).unwrap();
    println!("Eigenvalues(Lφ) ≈ {:?}", spec.eigenvalues);
    println!("H(λ0) = {}", golden_lowpass(spec.eigenvalues[0]));
}

#[macro_use] extern crate ndarray;
