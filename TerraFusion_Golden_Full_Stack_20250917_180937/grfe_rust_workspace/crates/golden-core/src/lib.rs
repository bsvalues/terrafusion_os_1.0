
use serde::{Deserialize, Serialize};

/// Mathematical constants related to the golden ratio.
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct PhiConstants {
    pub phi: f64,
    pub psi: f64,
    pub sqrt5: f64,
    pub golden_angle_deg: f64,
}

impl Default for PhiConstants {
    fn default() -> Self {
        let sqrt5 = 5f64.sqrt();
        let phi = (1.0 + sqrt5) / 2.0;
        let psi = (1.0 - sqrt5) / 2.0;
        let golden_angle_deg = 360.0 * (2.0 - phi); // ~137.5 deg
        Self { phi, psi, sqrt5, golden_angle_deg }
    }
}

/// Fast-doubling Fibonacci (O(log n)) returning u128.
/// Returns F(n) for n <= 186 safely (fits in u128).
pub fn fib_u128(n: u64) -> u128 {
    fn fd(k: u64) -> (u128, u128) {
        if k == 0 { return (0, 1); }
        let (a, b) = fd(k >> 1);
        // a=F(k), b=F(k+1)
        let c = a * (2*b - a);
        let d = a*a + b*b;
        if k & 1 == 0 { (c, d) } else { (d, c + d) }
    }
    fd(n).0
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn fib_small() {
        assert_eq!(fib_u128(0), 0);
        assert_eq!(fib_u128(1), 1);
        assert_eq!(fib_u128(10), 55);
        assert_eq!(fib_u128(50), 12586269025u128);
    }
}
