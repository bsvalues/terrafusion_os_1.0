using System;
using System.Threading;
using System.Threading.Tasks;
using Docker.DotNet;
using Npgsql;
using Testcontainers.PostgreSql;
using Xunit;

namespace TerraFusion.Integration.Tests;

public class PostgresContainerTests
{
    [DockerRequiredFact]
    [Trait("Category", "Infra")]
    [Trait("Feature", "Testcontainers")]
    public async Task CanStartPostgresContainer_AndConnect()
    {
        await using var postgresContainer = new PostgreSqlBuilder()
            .WithImage("postgres:15-alpine")
            .WithDatabase("testdb")
            .WithUsername("postgres")
            .WithPassword("testpw")
            .Build();

        await postgresContainer.StartAsync();

        var connString = postgresContainer.GetConnectionString();
        await using var conn = new NpgsqlConnection(connString);
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand("SELECT 1", conn);
        var result = await cmd.ExecuteScalarAsync();
        Assert.Equal(1, result);
    }

    private sealed class DockerRequiredFactAttribute : FactAttribute
    {
        public DockerRequiredFactAttribute()
        {
            if (!DockerEnvironment.IsAvailable)
            {
                Skip = "Docker/Testcontainers unavailable; infra tests require Docker.";
            }
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
                return CanStartAndConnectToPostgresContainer();
            }
            catch
            {
                return false;
            }
        }

        private static bool CanStartAndConnectToPostgresContainer()
        {
            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
                var testContainer = new PostgreSqlBuilder()
                    .WithImage("postgres:15-alpine")
                    .WithDatabase("testdb")
                    .WithUsername("postgres")
                    .WithPassword("testpw")
                    .Build();

                testContainer.StartAsync(cts.Token).GetAwaiter().GetResult();
                try
                {
                    var connString = testContainer.GetConnectionString();
                    using var conn = new NpgsqlConnection(connString);
                    conn.Open();
                    return true;
                }
                finally
                {
                    testContainer.DisposeAsync().AsTask().GetAwaiter().GetResult();
                }
            }
            catch
            {
                return false;
            }
        }
    }
}
