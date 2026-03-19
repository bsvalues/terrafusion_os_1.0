// Phase 6 — Native pgvector(1536) integration tests.
// Three Docker-gated tests that prove:
//   1. A 1536-dim embedding can be persisted as vector(1536).
//   2. The <=> cosine distance operator finds the true nearest neighbour.
//   3. A WHERE CountyId filter prevents cross-county leakage.
//
// Tests use an isolated Testcontainers pgvector/pgvector:pg16 container
// (NOT the shared dev database) for full hermetic isolation.
// Schema is created in-memory — no EF migrations required.

using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Docker.DotNet;
using FluentAssertions;
using Npgsql;
using Testcontainers.PostgreSql;
using Xunit;

namespace TerraFusion.Integration.Tests;

/// <summary>
/// Phase 6 vector search integration tests.
/// Each test class gets its own container lifetime via IAsyncLifetime.
/// </summary>
public sealed class VectorQueryIntegrationTests : IAsyncLifetime
{
    private PostgreSqlContainer _container = null!;
    private string _connectionString = null!;

    // -----------------------------------------------------------------------
    // Lifetime
    // -----------------------------------------------------------------------

    public async Task InitializeAsync()
    {
        _container = new PostgreSqlBuilder()
            .WithImage("pgvector/pgvector:pg16")
            .WithDatabase("vector_test")
            .WithUsername("postgres")
            .WithPassword("testpw")
            .Build();

        await _container.StartAsync();
        _connectionString = _container.GetConnectionString();

        // Install extension and create an isolated test schema.
        // No EF migrations — raw SQL for speed and simplicity.
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync();

        await using var setup = new NpgsqlCommand(@"
            CREATE EXTENSION IF NOT EXISTS vector;

            CREATE TABLE IF NOT EXISTS ""RAGEmbeddings"" (
                ""Id""        SERIAL PRIMARY KEY,
                ""CountyId""  UUID NOT NULL,
                ""ChunkText"" TEXT NOT NULL,
                ""Embedding"" vector(1536) NOT NULL
            );", conn);

        await setup.ExecuteNonQueryAsync();
    }

    public async Task DisposeAsync()
    {
        await _container.DisposeAsync();
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /// <summary>Serialises a float array to the pgvector literal format.</summary>
    private static string VectorLiteral(float[] floats) =>
        "[" + string.Join(",", floats) + "]";

    /// <summary>Returns a 1536-element zero array with one element set to 1.</summary>
    private static float[] BasisVector(int hotIndex)
    {
        var v = new float[1536];
        v[hotIndex] = 1.0f;
        return v;
    }

    // -----------------------------------------------------------------------
    // Tests
    // -----------------------------------------------------------------------

    /// <summary>
    /// Proves that a 1536-dimensional float vector can round-trip through
    /// the vector(1536) column without losing dimensionality.
    /// </summary>
    [DockerRequiredFact]
    [Trait("Category", "Vector")]
    [Trait("Feature", "pgvector")]
    [Trait("Phase", "6")]
    public async Task Embedding_Can_Be_Persisted_As_Vector1536()
    {
        var literal = VectorLiteral(BasisVector(0));

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync();

        // Insert
        await using var insert = new NpgsqlCommand(@$"
            INSERT INTO ""RAGEmbeddings"" (""CountyId"", ""ChunkText"", ""Embedding"")
            VALUES (gen_random_uuid(), 'persistence-test', '{literal}'::vector)
            RETURNING ""Id""", conn);

        var id = (int)(await insert.ExecuteScalarAsync())!;

        // Read back the dimension count using pgvector's built-in function
        await using var select = new NpgsqlCommand(
            $"SELECT vector_dims(\"Embedding\") FROM \"RAGEmbeddings\" WHERE \"Id\" = {id}", conn);

        var dims = (int)(await select.ExecuteScalarAsync())!;

        dims.Should().Be(1536,
            "the persisted embedding must retain all 1536 dimensions");
    }

    /// <summary>
    /// Proves that the &lt;=&gt; cosine distance operator ranks an identical
    /// vector (distance ≈ 0) above an orthogonal vector (distance = 1).
    /// </summary>
    [DockerRequiredFact]
    [Trait("Category", "Vector")]
    [Trait("Feature", "pgvector")]
    [Trait("Phase", "6")]
    public async Task Cosine_Distance_Query_Returns_Expected_Nearest_Neighbor()
    {
        // e0 and e0-copy are identical  → cosine distance = 0
        // e1 is orthogonal to e0        → cosine distance = 1
        var e0 = BasisVector(0);
        var e1 = BasisVector(1);
        var e0Copy = BasisVector(0);

        var countyId = Guid.NewGuid();

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync();

        await using var ins = new NpgsqlCommand(@$"
            INSERT INTO ""RAGEmbeddings"" (""CountyId"", ""ChunkText"", ""Embedding"") VALUES
                ('{countyId}', 'e0-origin', '{VectorLiteral(e0)}'::vector),
                ('{countyId}', 'e1-orthogonal', '{VectorLiteral(e1)}'::vector),
                ('{countyId}', 'e0-clone', '{VectorLiteral(e0Copy)}'::vector);", conn);

        await ins.ExecuteNonQueryAsync();

        // Nearest-neighbor query against e0
        await using var q = new NpgsqlCommand(@$"
            SELECT ""ChunkText"", (""Embedding"" <=> '{VectorLiteral(e0)}'::vector) AS dist
            FROM ""RAGEmbeddings""
            WHERE ""CountyId"" = '{countyId}'
            ORDER BY dist ASC
            LIMIT 1", conn);

        await using var reader = await q.ExecuteReaderAsync();
        await reader.ReadAsync();
        var nearestChunk = reader.GetString(0);
        var nearestDist  = reader.GetDouble(1);

        nearestDist.Should().BeLessThan(0.001,
            "an identical vector must have near-zero cosine distance");

        nearestChunk.Should().BeOneOf("e0-origin", "e0-clone",
            "the nearest neighbour must be one of the identical e0 vectors, not the orthogonal e1");
    }

    /// <summary>
    /// Proves that a WHERE CountyId filter in a vector similarity query
    /// prevents cross-county data from appearing in results.
    /// </summary>
    [DockerRequiredFact]
    [Trait("Category", "Vector")]
    [Trait("Feature", "pgvector")]
    [Trait("Phase", "6")]
    public async Task CountyIsolation_Holds_For_Vector_Search()
    {
        var countyA = Guid.NewGuid();
        var countyB = Guid.NewGuid();

        var query = BasisVector(5); // arbitrary basis vector

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync();

        // Insert one embedding per county — both are the same vector
        // so without the county filter countyB would rank equally.
        await using var ins = new NpgsqlCommand(@$"
            INSERT INTO ""RAGEmbeddings"" (""CountyId"", ""ChunkText"", ""Embedding"") VALUES
                ('{countyA}', 'county-a-chunk', '{VectorLiteral(query)}'::vector),
                ('{countyB}', 'county-b-chunk', '{VectorLiteral(query)}'::vector);", conn);

        await ins.ExecuteNonQueryAsync();

        // Act: search scoped strictly to countyA
        await using var q = new NpgsqlCommand(@$"
            SELECT ""ChunkText""
            FROM ""RAGEmbeddings""
            WHERE ""CountyId"" = '{countyA}'
            ORDER BY ""Embedding"" <=> '{VectorLiteral(query)}'::vector
            LIMIT 10", conn);

        var results = new List<string>();
        await using var reader = await q.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            results.Add(reader.GetString(0));

        // Assert
        results.Should().Contain("county-a-chunk",
            "county A's embedding must be retrievable within county A's scope");

        results.Should().NotContain("county-b-chunk",
            "county B's data must not appear when the query is scoped to county A — sovereign isolation required");
    }

    // -----------------------------------------------------------------------
    // Infrastructure
    // -----------------------------------------------------------------------

    private sealed class DockerRequiredFactAttribute : FactAttribute
    {
        public DockerRequiredFactAttribute()
        {
            if (!DockerEnvironment.IsAvailable)
                Skip = "Docker/Testcontainers unavailable; vector tests require Docker.";
        }
    }

    private static class DockerEnvironment
    {
        private static readonly Lazy<bool> Availability = new(CheckAvailability);

        public static bool IsAvailable => Availability.Value;

        private static bool CheckAvailability()
        {
            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(2));
                var dockerHost = Environment.GetEnvironmentVariable("DOCKER_HOST");
                var config = string.IsNullOrWhiteSpace(dockerHost)
                    ? new DockerClientConfiguration()
                    : new DockerClientConfiguration(new Uri(dockerHost));

                using var client = config.CreateClient();
                client.System.PingAsync(cts.Token).GetAwaiter().GetResult();
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}
