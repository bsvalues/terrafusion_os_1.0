using System.Threading.Tasks;
using Xunit;
using Testcontainers.PostgreSql;
using Npgsql;

namespace TerraFusion.Integration.Tests;

public class PostgresContainerTests
{
    [Fact]
    public async Task CanStartPostgresContainer_AndConnect()
    {
        var postgresContainer = new PostgreSqlBuilder()
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

        await postgresContainer.StopAsync();
    }
}
