namespace TerraFusion.SalesForge.Tests.Mirrors;

/// <summary>
/// Mirror of the OLS regression engine from TerraFusion.API.Services.OlsRegressionService.
/// Implements Normal Equations: β = (XᵀX)⁻¹ Xᵀy
/// </summary>
public static class OlsRegressionEngine
{
    public record OlsObservation(double SalePrice, double Gla, double LotSizeSqft, double YearBuilt);

    public record OlsResult
    {
        public double[] Beta { get; init; } = [];
        public double RSquared { get; init; }
        public double RSquaredAdj { get; init; }
        public double[] Residuals { get; init; } = [];
        public int N { get; init; }
        public int K { get; init; }

        public double? Predict(double gla, double lotSizeSqft, double yearBuilt)
        {
            if (Beta.Length < 4) return null;
            return Beta[0] + Beta[1] * gla + Beta[2] * lotSizeSqft + Beta[3] * yearBuilt;
        }
    }

    public static OlsResult? Fit(IReadOnlyList<OlsObservation> observations)
    {
        const int k = 3; // predictors: GLA, lot, yearBuilt
        int n = observations.Count;
        if (n < k + 2) return null;

        // Build design matrix X (n × k+1) and response vector y (n)
        var X = new double[n, k + 1];
        var y = new double[n];
        for (int i = 0; i < n; i++)
        {
            var obs = observations[i];
            X[i, 0] = 1.0;           // intercept
            X[i, 1] = obs.Gla;
            X[i, 2] = obs.LotSizeSqft;
            X[i, 3] = obs.YearBuilt;
            y[i]    = obs.SalePrice;
        }

        // Normal equations: β = (XᵀX)⁻¹ Xᵀy
        var Xt    = Transpose(X, n, k + 1);
        var XtX   = MatMul(Xt, X, k + 1, n, k + 1);
        var XtXinv = InvertMatrix(XtX, k + 1);
        if (XtXinv == null) return null;
        var Xty  = MatMulVec(Xt, y, k + 1, n);
        var beta = MatMulVec(XtXinv, Xty, k + 1, k + 1);

        // Residuals and R²
        var residuals = new double[n];
        var yMean = y.Average();
        var ssTot = 0.0;
        var ssRes = 0.0;
        for (int i = 0; i < n; i++)
        {
            double yHat = 0;
            for (int j = 0; j <= k; j++) yHat += X[i, j] * beta[j];
            residuals[i] = y[i] - yHat;
            ssTot += (y[i] - yMean) * (y[i] - yMean);
            ssRes += residuals[i] * residuals[i];
        }

        var rSquared = ssTot > 0 ? 1.0 - ssRes / ssTot : 0.0;
        var rSquaredAdj = n > k + 1
            ? 1.0 - (1.0 - rSquared) * (n - 1.0) / (n - k - 1.0)
            : rSquared;

        return new OlsResult
        {
            Beta = beta,
            RSquared = Math.Round(Math.Max(0, rSquared), 4),
            RSquaredAdj = Math.Round(Math.Max(0, rSquaredAdj), 4),
            Residuals = residuals,
            N = n,
            K = k,
        };
    }

    private static double[,] Transpose(double[,] A, int rows, int cols)
    {
        var T = new double[cols, rows];
        for (int i = 0; i < rows; i++)
            for (int j = 0; j < cols; j++)
                T[j, i] = A[i, j];
        return T;
    }

    private static double[,] MatMul(double[,] A, double[,] B, int m, int n, int p)
    {
        var C = new double[m, p];
        for (int i = 0; i < m; i++)
            for (int j = 0; j < p; j++)
                for (int l = 0; l < n; l++)
                    C[i, j] += A[i, l] * B[l, j];
        return C;
    }

    private static double[] MatMulVec(double[,] A, double[] v, int m, int n)
    {
        var result = new double[m];
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                result[i] += A[i, j] * v[j];
        return result;
    }

    private static double[,]? InvertMatrix(double[,] A, int n)
    {
        const double Epsilon = 1e-12;
        var aug = new double[n, 2 * n];
        for (int i = 0; i < n; i++)
        {
            for (int j = 0; j < n; j++) aug[i, j] = A[i, j];
            aug[i, n + i] = 1.0;
        }
        for (int col = 0; col < n; col++)
        {
            int pivot = col;
            for (int row = col + 1; row < n; row++)
                if (Math.Abs(aug[row, col]) > Math.Abs(aug[pivot, col]))
                    pivot = row;
            if (pivot != col)
                for (int j = 0; j < 2 * n; j++)
                    (aug[col, j], aug[pivot, j]) = (aug[pivot, j], aug[col, j]);
            var diag = aug[col, col];
            if (Math.Abs(diag) < Epsilon) return null;
            for (int j = 0; j < 2 * n; j++) aug[col, j] /= diag;
            for (int row = 0; row < n; row++)
            {
                if (row == col) continue;
                var factor = aug[row, col];
                for (int j = 0; j < 2 * n; j++) aug[row, j] -= factor * aug[col, j];
            }
        }
        var inv = new double[n, n];
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                inv[i, j] = aug[i, n + j];
        return inv;
    }
}
