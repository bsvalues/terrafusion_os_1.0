using System;
using System.IO;
using System.Linq;
using FluentAssertions;
using Xunit;

namespace TerraFusion.Unit.Tests.CI;

/// <summary>
/// SYNC-INFRA-1: structural smoke test for the two new / extended compose
/// artifacts. Parses YAML by indentation + key presence — kept dependency-free
/// so the test project does not have to take on a new YAML package.
/// </summary>
public sealed class InfraComposeYamlSmokeTests
{
    private static string RepoRoot()
    {
        // Tests run from bin/{Configuration}/net8.0. Walk up to the repo root
        // by finding TerraFusion.sln.
        var dir = AppContext.BaseDirectory;
        for (var i = 0; i < 10; i++)
        {
            if (dir is null) break;
            if (File.Exists(Path.Combine(dir, "TerraFusion.sln"))
                || File.Exists(Path.Combine(dir, "backend", "TerraFusion.sln")))
            {
                return dir;
            }
            dir = Directory.GetParent(dir)?.FullName;
        }
        throw new InvalidOperationException("Could not locate repo root from " + AppContext.BaseDirectory);
    }

    private static string ReadComposeRelative(string relative)
    {
        var root = RepoRoot();
        var candidate1 = Path.Combine(root, "backend", relative);
        var candidate2 = Path.Combine(root, relative);
        var path = File.Exists(candidate1) ? candidate1 : candidate2;
        File.Exists(path).Should().BeTrue($"compose file {relative} must exist at {path}");
        return File.ReadAllText(path);
    }

    [Fact]
    public void PacsCompose_defines_supervised_tf_mssql_service()
    {
        var yaml = ReadComposeRelative("docker-compose.pacs.yml");

        // Critical contract: PACS clone must be supervised + healthchecked
        // + localhost-bound + use the existing external volumes.
        yaml.Should().Contain("container_name: tf-mssql");
        yaml.Should().Contain("restart: unless-stopped",
            because: "tf-mssql must survive reboots — that's the whole point of Fix #1");
        yaml.Should().Contain("127.0.0.1:1433:1433",
            because: "PACS must bind localhost only, never 0.0.0.0");
        yaml.Should().Contain("healthcheck:",
            because: "Docker needs to know when the SQL server is actually ready");
        yaml.Should().Contain("tf_mssql_data:",
            because: "must mount the existing populated Benton clone volume");
        yaml.Should().Contain("external: true",
            because: "volumes must be marked external so compose never recreates them");
        yaml.Should().Contain("TF_PACS_SA_PASSWORD",
            because: "SA password must come from env, never be hardcoded");
    }

    [Fact]
    public void BackendCompose_registers_nightly_pg_backup_sidecar()
    {
        var yaml = ReadComposeRelative("docker-compose.yml");

        // pg-backup sidecar must be present, dependent on postgres, and
        // writing into ./backups (so the host-mounted dir is the same the
        // README describes).
        yaml.Should().Contain("pg-backup:",
            because: "Fix #4 adds a nightly pg_dump sidecar");
        yaml.Should().Contain("postgres:16-alpine",
            because: "sidecar image must match host postgres major version");
        var lines = yaml.Split('\n').Select(l => l.TrimEnd()).ToArray();
        lines.Should().Contain(l => l.Contains("./backups:/backups"),
            because: "backups must land in backend/backups on the host so the README can document one path");
        yaml.Should().Contain("pg_dump",
            because: "the entrypoint must actually invoke pg_dump");
        yaml.Should().Contain("mtime +7",
            because: "retention rule (7 daily) must be present so backups do not grow unbounded");
    }
}
