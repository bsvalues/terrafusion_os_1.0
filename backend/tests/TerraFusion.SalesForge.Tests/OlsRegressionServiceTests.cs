using FluentAssertions;
using TerraFusion.SalesForge.Tests.Mirrors;
using static TerraFusion.SalesForge.Tests.Mirrors.OlsRegressionEngine;
using Xunit;

namespace TerraFusion.SalesForge.Tests;

/// <summary>
/// Tests for the OLS multiple regression engine.
/// Verifies IAAO-compliant market-extracted adjustment factors.
/// </summary>
public class OlsRegressionServiceTests
{
    [Fact]
    public void Fit_InsufficientObservations_ReturnsNull()
    {
        var observations = new List<OlsObservation>
        {
            new(250_000, 1500, 7000, 2000),
            new(300_000, 1800, 8000, 2005),
            new(350_000, 2000, 9000, 2010),
        };

        var result = OlsRegressionEngine.Fit(observations);
        result.Should().BeNull();
    }

    [Fact]
    public void Fit_ValidObservations_ReturnsBetaCoefficients()
    {
        var observations = GenerateTestObservations(20);
        var result = OlsRegressionEngine.Fit(observations);

        result.Should().NotBeNull();
        result!.Beta.Should().HaveCount(4);
        result.N.Should().Be(20);
        result.K.Should().Be(3);
    }

    [Fact]
    public void Fit_ValidObservations_RSquaredBetweenZeroAndOne()
    {
        var observations = GenerateTestObservations(30);
        var result = OlsRegressionEngine.Fit(observations);

        result.Should().NotBeNull();
        result!.RSquared.Should().BeInRange(0.0, 1.0);
        result.RSquaredAdj.Should().BeLessThanOrEqualTo(result.RSquared);
    }

    [Fact]
    public void Fit_NearPerfectLinearRelationship_RSquaredNearOne()
    {
        // Use varied, non-collinear predictors with tiny noise to avoid singular matrix
        var rng = new Random(123);
        var observations = new List<OlsObservation>();
        for (int i = 0; i < 30; i++)
        {
            double gla = 1000 + rng.Next(0, 2000);
            double lot = 5000 + rng.Next(0, 8000);
            double year = 1980 + rng.Next(0, 40);
            // Near-perfect linear with tiny noise
            double price = 50000 + 100 * gla + 5 * lot + 1000 * year + rng.NextDouble() * 100;
            observations.Add(new OlsObservation(price, gla, lot, year));
        }

        var result = OlsRegressionEngine.Fit(observations);
        result.Should().NotBeNull();
        result!.RSquared.Should().BeGreaterThan(0.99);
    }

    [Fact]
    public void Fit_ReturnsResiduals_MatchingObservationCount()
    {
        var observations = GenerateTestObservations(15);
        var result = OlsRegressionEngine.Fit(observations);

        result.Should().NotBeNull();
        result!.Residuals.Should().HaveCount(15);
    }

    [Fact]
    public void Fit_Residuals_SumToApproximatelyZero()
    {
        var observations = GenerateTestObservations(25);
        var result = OlsRegressionEngine.Fit(observations);

        result.Should().NotBeNull();
        var residualSum = result!.Residuals.Sum();
        residualSum.Should().BeApproximately(0.0, 0.01);
    }

    [Fact]
    public void Predict_WithFittedModel_ReturnsReasonableValue()
    {
        var observations = GenerateTestObservations(20);
        var result = OlsRegressionEngine.Fit(observations);

        result.Should().NotBeNull();
        var prediction = result!.Predict(1800, 8000, 2010);
        prediction.Should().NotBeNull();
        prediction!.Value.Should().BeInRange(100_000, 1_000_000);
    }

    [Fact]
    public void Predict_LargerGla_HigherPrice()
    {
        var observations = GenerateTestObservations(20);
        var result = OlsRegressionEngine.Fit(observations);

        result.Should().NotBeNull();
        var smallHouse = result!.Predict(1200, 7000, 2005);
        var largeHouse = result.Predict(2400, 7000, 2005);

        smallHouse.Should().NotBeNull();
        largeHouse.Should().NotBeNull();
        largeHouse!.Value.Should().BeGreaterThan(smallHouse!.Value);
    }

    [Fact]
    public void Predict_NewerYear_HigherPrice()
    {
        var observations = GenerateTestObservations(20);
        var result = OlsRegressionEngine.Fit(observations);

        result.Should().NotBeNull();
        var olderHome = result!.Predict(1800, 7000, 1980);
        var newerHome = result.Predict(1800, 7000, 2020);

        olderHome.Should().NotBeNull();
        newerHome.Should().NotBeNull();
        newerHome!.Value.Should().BeGreaterThan(olderHome!.Value);
    }

    [Fact]
    public void Fit_CollinearPredictors_ReturnsNull()
    {
        var observations = Enumerable.Range(0, 10)
            .Select(_ => new OlsObservation(250_000, 1500, 7000, 2000))
            .ToList();

        var result = OlsRegressionEngine.Fit(observations);
        result.Should().BeNull();
    }

    [Fact]
    public void OlsResult_Predict_EmptyBeta_ReturnsNull()
    {
        var result = new OlsResult { Beta = Array.Empty<double>() };
        var prediction = result.Predict(1800, 8000, 2010);
        prediction.Should().BeNull();
    }

    private static List<OlsObservation> GenerateTestObservations(int count)
    {
        var rng = new Random(42);
        var observations = new List<OlsObservation>();
        for (int i = 0; i < count; i++)
        {
            double gla = 1000 + rng.Next(0, 2000);
            double lot = 4000 + rng.Next(0, 10000);
            double year = 1970 + rng.Next(0, 55);
            double price = 50_000 + 120 * gla + 3 * lot + 2000 * (year - 1970) + rng.NextDouble() * 30_000;
            observations.Add(new OlsObservation(price, gla, lot, year));
        }
        return observations;
    }
}
