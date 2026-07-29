using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentAssertions;
using TerraFusion.Abstractions.DTOs;
using TerraFusion.API.Adapters;
using TerraFusion.Core.DTOs.GisTf;
using Xunit;

namespace TerraFusion.Unit.Tests.Atlas;

public sealed class LocalAtlasShadowFactAttribute : FactAttribute
{
    public LocalAtlasShadowFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(
                Environment.GetEnvironmentVariable("TERRAFUSION_ATLAS_SHADOW_MODULE_PATH")))
        {
            Skip = "Local Atlas shadow proof requires TERRAFUSION_ATLAS_SHADOW_MODULE_PATH.";
        }
    }
}

public sealed class AtlasLocalSovereignShadowProjectionTests
{
    private const string ExpectedModuleSha256 =
        "3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46";
    private static readonly Guid CountyId = Guid.Parse("11111111-2222-3333-4444-555555555555");
    private static readonly Guid ParcelId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static readonly JsonSerializerOptions ContractJson = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };
    private static readonly Encoding Utf8WithoutBom = new UTF8Encoding(encoderShouldEmitUTF8Identifier: false);

    [LocalAtlasShadowFact]
    public void ExactModule_ProjectsRealAdapterPolygonWithBoundedProperties()
    {
        var exchange = SerializeExchange(
            AtlasSpatialReadAdapter.Adapt(CreateRequest(), CreateSource()));

        var output = InvokeProjection(exchange);
        using var document = JsonDocument.Parse(output);
        var root = document.RootElement;

        root.GetProperty("type").GetString().Should().Be("Feature");
        root.GetProperty("geometry").GetProperty("type").GetString().Should().Be("Polygon");
        root.GetProperty("geometry").GetProperty("coordinates")[0].GetArrayLength().Should().Be(4);
        var properties = root.GetProperty("properties");
        properties.EnumerateObject().Select(property => property.Name).Should().Equal(
            "countyId",
            "parcelId",
            "evidenceState");
        properties.GetProperty("countyId").GetString().Should().Be(CountyId.ToString("D"));
        properties.GetProperty("parcelId").GetString().Should().Be(ParcelId.ToString("D"));
        properties.GetProperty("evidenceState").GetString().Should().Be("canonical");
    }

    [LocalAtlasShadowFact]
    public void ExactModule_ProjectsFrozenSyntheticPoint()
    {
        var exchange = SerializeExchange(new
        {
            schemaVersion = "1.0.0",
            countyId = CountyId.ToString("D"),
            parcelId = ParcelId.ToString("D"),
            evidenceState = "canonical",
            boundary = new
            {
                geometryState = "centroid_only",
                centroid = new { longitude = -119.15m, latitude = 46.22m },
            },
            layers = new { },
        });

        using var document = JsonDocument.Parse(InvokeProjection(exchange));
        var geometry = document.RootElement.GetProperty("geometry");
        geometry.GetProperty("type").GetString().Should().Be("Point");
        geometry.GetProperty("coordinates")[0].GetDecimal().Should().Be(-119.15m);
        geometry.GetProperty("coordinates")[1].GetDecimal().Should().Be(46.22m);
    }

    [LocalAtlasShadowFact]
    public void ExactModule_ProjectsFrozenSyntheticUnavailableAsNull()
    {
        var exchange = SerializeExchange(new
        {
            schemaVersion = "1.0.0",
            countyId = CountyId.ToString("D"),
            parcelId = ParcelId.ToString("D"),
            evidenceState = "unavailable",
            boundary = new { geometryState = "unavailable" },
            layers = new { },
        });

        InvokeProjection(exchange).Should().Be("null");
    }

    [LocalAtlasShadowFact]
    public void IdentityMismatch_FailsBeforeNodeExecution()
    {
        var action = () => AtlasSpatialReadAdapter.Adapt(
            CreateRequest() with { CountyId = Guid.NewGuid().ToString("D") },
            CreateSource());

        action.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData("POLYGON ((-119.2 46.2, -119.1 46.2, -119.1 46.3))")]
    [InlineData("POLYGON ((-119.2 46.2, -119.1 46.2, -119.1 46.3, -119.3 46.4))")]
    [InlineData("POLYGON ((-119.2 46.2, -119.1 46.2, -119.2 46.2))")]
    [InlineData("POLYGON ((-181 46.2, -119.1 46.2, -119.1 46.3, -181 46.2))")]
    [InlineData("POLYGON ((-119.2 91, -119.1 46.2, -119.1 46.3, -119.2 91))")]
    [InlineData("POINT (-119.15 46.22)")]
    public void InvalidGeometry_FailsBeforeNodeExecution(string wkt)
    {
        var action = () => AtlasSpatialReadAdapter.Adapt(
            CreateRequest(),
            CreateSource() with { GeomWkt = wkt });

        action.Should().Throw<InvalidOperationException>();
    }

    [LocalAtlasShadowFact]
    public void Exchange_ExcludesCrossLaneFieldsRatherThanClaimingModuleRejection()
    {
        var exchange = SerializeExchange(
            AtlasSpatialReadAdapter.Adapt(CreateRequest(), CreateSource()));

        foreach (var prohibited in new[]
                 {
                     "owner",
                     "valuation",
                     "document",
                     "workflow",
                     "taxArea",
                     "landClass",
                     "provider",
                     "token",
                 })
        {
            exchange.Contains(prohibited, StringComparison.OrdinalIgnoreCase).Should().BeFalse();
        }
    }

    [LocalAtlasShadowFact]
    public void RepeatedProjection_IsByteNormalizedAndDeterministic()
    {
        var exchange = SerializeExchange(
            AtlasSpatialReadAdapter.Adapt(CreateRequest(), CreateSource()));

        InvokeProjection(exchange).Should().Be(InvokeProjection(exchange));
    }

    [LocalAtlasShadowFact]
    public void TamperedCopy_IsRejectedBeforeNodeExecution()
    {
        var proofRoot = RequireEnvironmentPath("TERRAFUSION_ATLAS_SHADOW_PROOF_ROOT");
        var approvedModule = RequireApprovedModule();
        var tamperedModule = Path.Combine(proofRoot, "tampered-project-atlas-feature.mjs");

        try
        {
            File.Copy(approvedModule, tamperedModule, overwrite: true);
            File.AppendAllText(tamperedModule, "\n// tampered\n", Encoding.UTF8);

            var action = () => ValidateModuleHash(tamperedModule);

            action.Should().Throw<InvalidOperationException>()
                .WithMessage("*hash mismatch*");
        }
        finally
        {
            if (File.Exists(tamperedModule))
            {
                File.Delete(tamperedModule);
            }
        }
    }

    private static string InvokeProjection(string exchange)
    {
        var modulePath = RequireApprovedModule();
        var proofRoot = RequireEnvironmentPath("TERRAFUSION_ATLAS_SHADOW_PROOF_ROOT");
        var invocationId = Guid.NewGuid().ToString("N");
        var inputPath = Path.Combine(proofRoot, $"exchange-{invocationId}.json");
        var outputPath = Path.Combine(proofRoot, $"output-{invocationId}.json");
        var runnerPath = Path.Combine(proofRoot, $"runner-{invocationId}.mjs");
        const string script = """
            import fs from 'node:fs';
            import dgram from 'node:dgram';
            import dns from 'node:dns';
            import http from 'node:http';
            import https from 'node:https';
            import net from 'node:net';
            import tls from 'node:tls';
            import { syncBuiltinESMExports } from 'node:module';
            import { pathToFileURL } from 'node:url';
            const denyNetwork = () => {
              throw new Error('Network access is denied by the Atlas shadow proof.');
            };
            for (const [target, names] of [
              [net, ['connect', 'createConnection', 'createServer']],
              [http, ['get', 'request', 'createServer']],
              [https, ['get', 'request', 'createServer']],
              [tls, ['connect', 'createServer']],
              [dgram, ['createSocket']],
              [dns, ['lookup', 'resolve', 'resolve4', 'resolve6']],
            ]) {
              for (const name of names) {
                target[name] = denyNetwork;
              }
            }
            globalThis.fetch = denyNetwork;
            globalThis.WebSocket = class {
              constructor() {
                denyNetwork();
              }
            };
            syncBuiltinESMExports();
            const exchange = JSON.parse(fs.readFileSync(process.env.TF_ATLAS_INPUT_PATH, 'utf8'));
            const module = await import(pathToFileURL(process.env.TF_ATLAS_MODULE_PATH).href);
            fs.writeFileSync(
              process.env.TF_ATLAS_OUTPUT_PATH,
              `${JSON.stringify(module.projectAtlasFeature(exchange))}\n`,
              'utf8'
            );
            """;
        var startInfo = new ProcessStartInfo("node")
        {
            RedirectStandardError = true,
            UseShellExecute = false,
        };
        startInfo.ArgumentList.Add("--permission");
        startInfo.ArgumentList.Add($"--allow-fs-read={proofRoot}");
        startInfo.ArgumentList.Add($"--allow-fs-write={proofRoot}");
        startInfo.ArgumentList.Add(runnerPath);
        startInfo.Environment["TF_ATLAS_MODULE_PATH"] = modulePath;
        startInfo.Environment["TF_ATLAS_INPUT_PATH"] = inputPath;
        startInfo.Environment["TF_ATLAS_OUTPUT_PATH"] = outputPath;

        try
        {
            File.WriteAllText(inputPath, exchange, Utf8WithoutBom);
            File.WriteAllText(runnerPath, script, Utf8WithoutBom);
            using var process = Process.Start(startInfo)
                ?? throw new InvalidOperationException("Unable to start local Node projection.");
            var errorTask = process.StandardError.ReadToEndAsync();
            if (!process.WaitForExit(milliseconds: 30_000))
            {
                if (!process.HasExited)
                {
                    process.Kill(entireProcessTree: true);
                }
                process.WaitForExit();
                _ = errorTask.GetAwaiter().GetResult();
                throw new InvalidOperationException(
                    "Local Atlas projection exceeded the 30-second execution limit.");
            }
            var error = errorTask.GetAwaiter().GetResult();

            if (process.ExitCode != 0)
            {
                throw new InvalidOperationException(
                    $"Local Atlas projection failed with exit code {process.ExitCode}: {error}");
            }
            if (!File.Exists(outputPath))
            {
                throw new InvalidOperationException("Local Atlas projection did not create output.");
            }

            return File.ReadAllText(outputPath, Encoding.UTF8).Trim();
        }
        finally
        {
            if (File.Exists(inputPath))
            {
                File.Delete(inputPath);
            }
            if (File.Exists(outputPath))
            {
                File.Delete(outputPath);
            }
            if (File.Exists(runnerPath))
            {
                File.Delete(runnerPath);
            }
        }
    }

    private static string RequireApprovedModule()
    {
        var path = RequireEnvironmentPath("TERRAFUSION_ATLAS_SHADOW_MODULE_PATH");
        ValidateModuleHash(path);
        return path;
    }

    private static void ValidateModuleHash(string path)
    {
        using var stream = File.OpenRead(path);
        var actual = Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
        if (!string.Equals(actual, ExpectedModuleSha256, StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                $"Atlas projection module hash mismatch: expected {ExpectedModuleSha256}, found {actual}.");
        }
    }

    private static string RequireEnvironmentPath(string name)
    {
        var path = Environment.GetEnvironmentVariable(name);
        if (string.IsNullOrWhiteSpace(path) || !Path.Exists(path))
        {
            throw new InvalidOperationException($"{name} must identify an existing local proof path.");
        }

        return Path.GetFullPath(path);
    }

    private static string SerializeExchange(object result) =>
        JsonSerializer.Serialize(new { result }, ContractJson);

    private static AtlasParcelSpatialReadRequest CreateRequest() => new()
    {
        CountyId = CountyId.ToString("D"),
        ParcelId = ParcelId.ToString("D"),
    };

    private static ParcelGeometryResponse CreateSource() => new()
    {
        TfParcelId = ParcelId,
        CountyId = CountyId,
        GeomWkt = "POLYGON ((-119.2 46.2, -119.1 46.2, -119.1 46.3, -119.2 46.2))",
        CentroidLat = 46.22,
        CentroidLon = -119.15,
        AreaSqFt = 87_120,
        LastSyncedAt = DateTime.UnixEpoch,
        SourceServiceUrl = "sovereign://synthetic-atlas-shadow-proof",
        IsActive = true,
    };
}
