
// cargo run --example e2_phi_line_search
use golden_opt::golden_section_search;

fn main() {
    let f = |x: f64| (x - 2.0)*(x - 2.0) + 1.0;
    let res = golden_section_search(f, 0.0, 5.0, 1e-8, 50_000);
    println!("Golden-section: x* ≈ {:.6}, f(x*) ≈ {:.6}, iters={}", res.x, res.fx, res.iterations);
}
