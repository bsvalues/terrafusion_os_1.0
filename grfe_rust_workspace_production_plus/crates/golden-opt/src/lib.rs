
use golden_core::PhiConstants;

#[derive(Debug, Clone, Copy)]
pub struct OptResult {
    pub x: f64,
    pub fx: f64,
    pub iterations: usize,
    pub method: &'static str,
}

/// Golden section search for minimizing f on [a,b].
pub fn golden_section_search<F>(f: F, mut a: f64, mut b: f64, tol: f64, max_iter: usize) -> OptResult
where
    F: Fn(f64) -> f64,
{
    assert!(a < b, "invalid interval");
    let phi = PhiConstants::default().phi;
    let resphi = 2.0 - phi; // 1/phi^2

    let mut c = a + resphi * (b - a);
    let mut d = b - resphi * (b - a);
    let mut fc = f(c);
    let mut fd = f(d);

    let mut it = 0;
    while (b - a) > tol && it < max_iter {
        if fc < fd {
            b = d;
            d = c;
            fd = fc;
            c = a + resphi * (b - a);
            fc = f(c);
        } else {
            a = c;
            c = d;
            fc = fd;
            d = b - resphi * (b - a);
            fd = f(d);
        }
        it += 1;
    }
    let x = 0.5 * (a + b);
    OptResult { x, fx: f(x), iterations: it, method: "golden_section" }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn minimize_quadratic() {
        let f = |x: f64| (x - 2.0)*(x - 2.0) + 1.0;
        let res = golden_section_search(f, 0.0, 5.0, 1e-8, 10_000);
        assert!((res.x - 2.0).abs() < 1e-5);
        assert!(res.fx <= 1.00001);
    }
}
