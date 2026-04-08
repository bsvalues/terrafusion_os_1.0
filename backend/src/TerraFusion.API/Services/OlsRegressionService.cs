namespace TerraFusion.API.Services;

/// <summary>
/// OLS multiple regression implementation.
///
/// Uses the normal equations: β = (XᵀX)⁻¹ Xᵀy
///
/// Matrix operations are implemented directly (no external library dependency)
/// matching the structure of the original TypeScript implementation in
/// TerraFusion-Valuator-Pro-Studio/CompVault/regression-engine.ts:
///   matMul, transpose, invertMatrix (Gauss-Jordan), then normal equations.
///
/// Minimum viable sample: n ≥ k + 2  (predictors + intercept + 1 degree of freedom)
/// Default residential model: 3 predictors (GLA, lot, yearBuilt) → n ≥ 5.
/// </summary>
public sealed class OlsRegressionService : IOlsRegressionService
{
    private const int Predictors = 3; // GLA, LotSizeSqft, YearBuilt (intercept added internally)

    /// <inheritdoc/>
    public OlsResult? Fit(IReadOnlyList<OlsObservation> observations)
    {
        var n = observations.Count;
        var k = Predictors;

        // Need at least k+2 observations for a meaningful fit
        if (n < k + 2) return null;

        // ── Build design matrix X (n × (k+1)) and response vector y (n × 1) ──
        var X = new double[n, k + 1];
        var y = new double[n];

        for (var i = 0; i < n; i++)
        {
            var obs = observations[i];
            X[i, 0] = 1.0;                 // intercept
            X[i, 1] = obs.Gla;
            X[i, 2] = obs.LotSizeSqft;
            X[i, 3] = obs.YearBuilt;
            y[i]    = obs.SalePrice;
        }

        // ── Normal equations: β = (XᵀX)⁻¹ Xᵀy ──
        var Xt    = Transpose(X, n, k + 1);
        var XtX   = MatMul(Xt, X, k + 1, n, k + 1);
        var XtXinv = InvertMatrix(XtX, k + 1);

        if (XtXinv == null) return null;   // singular matrix — collinear predictors

        var Xty  = MatMulVec(Xt, y, k + 1, n);
        var beta = MatMulVec(XtXinv, Xty, k + 1, k + 1);

        // ── Residuals and R² ──
        var yHat     = new double[n];
        var residuals = new double[n];
        var yMean    = y.Average();
        var ssTot    = 0.0;
        var ssRes    = 0.0;

        for (var i = 0; i < n; i++)
        {
            yHat[i]      = DotRow(X, i, beta, k + 1);
            residuals[i] = y[i] - yHat[i];
            ssTot       += (y[i] - yMean) * (y[i] - yMean);
            ssRes       += residuals[i] * residuals[i];
        }

        var rSquared    = ssTot > 0 ? 1.0 - ssRes / ssTot : 0.0;
        var rSquaredAdj = n > k + 1
            ? 1.0 - (1.0 - rSquared) * (n - 1.0) / (n - k - 1.0)
            : rSquared;

        return new OlsResult
        {
            Beta        = beta,
            RSquared    = Math.Round(Math.Max(0, rSquared), 4),
            RSquaredAdj = Math.Round(Math.Max(0, rSquaredAdj), 4),
            Residuals   = residuals,
            N           = n,
            K           = k,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Matrix helpers (mirroring the TypeScript originals)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>Transpose: (rows × cols) → (cols × rows)</summary>
    private static double[,] Transpose(double[,] A, int rows, int cols)
    {
        var T = new double[cols, rows];
        for (var i = 0; i < rows; i++)
            for (var j = 0; j < cols; j++)
                T[j, i] = A[i, j];
        return T;
    }

    /// <summary>Matrix multiply: A(m×n) × B(n×p) → C(m×p)</summary>
    private static double[,] MatMul(double[,] A, double[,] B, int m, int n, int p)
    {
        var C = new double[m, p];
        for (var i = 0; i < m; i++)
            for (var j = 0; j < p; j++)
                for (var l = 0; l < n; l++)
                    C[i, j] += A[i, l] * B[l, j];
        return C;
    }

    /// <summary>Matrix-vector multiply: A(m×n) × v(n) → result(m)</summary>
    private static double[] MatMulVec(double[,] A, double[] v, int m, int n)
    {
        var result = new double[m];
        for (var i = 0; i < m; i++)
            for (var j = 0; j < n; j++)
                result[i] += A[i, j] * v[j];
        return result;
    }

    /// <summary>Dot product of row i of A with vector v.</summary>
    private static double DotRow(double[,] A, int row, double[] v, int len)
    {
        var sum = 0.0;
        for (var j = 0; j < len; j++)
            sum += A[row, j] * v[j];
        return sum;
    }

    /// <summary>
    /// Invert a square matrix using Gauss-Jordan elimination.
    /// Returns null if the matrix is singular (within a small epsilon).
    /// </summary>
    private static double[,]? InvertMatrix(double[,] A, int n)
    {
        const double Epsilon = 1e-12;

        // Augment A with identity: [A | I]
        var aug = new double[n, 2 * n];
        for (var i = 0; i < n; i++)
        {
            for (var j = 0; j < n; j++)
                aug[i, j] = A[i, j];
            aug[i, n + i] = 1.0;
        }

        for (var col = 0; col < n; col++)
        {
            // Partial pivot
            var pivot = col;
            for (var row = col + 1; row < n; row++)
                if (Math.Abs(aug[row, col]) > Math.Abs(aug[pivot, col]))
                    pivot = row;

            // Swap rows
            if (pivot != col)
                for (var j = 0; j < 2 * n; j++)
                    (aug[col, j], aug[pivot, j]) = (aug[pivot, j], aug[col, j]);

            var diag = aug[col, col];
            if (Math.Abs(diag) < Epsilon) return null;  // singular

            // Normalise pivot row
            for (var j = 0; j < 2 * n; j++)
                aug[col, j] /= diag;

            // Eliminate column
            for (var row = 0; row < n; row++)
            {
                if (row == col) continue;
                var factor = aug[row, col];
                for (var j = 0; j < 2 * n; j++)
                    aug[row, j] -= factor * aug[col, j];
            }
        }

        // Extract right half
        var inv = new double[n, n];
        for (var i = 0; i < n; i++)
            for (var j = 0; j < n; j++)
                inv[i, j] = aug[i, n + j];
        return inv;
    }
}
