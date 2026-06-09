using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities.Workbench;
using TerraFusion.Core.Sync.Doctrine;
using TerraFusion.Core.Sync.Workbench;
using TerraFusion.Data;
using TerraFusion.Data.Services.Workbench;
using Xunit;

namespace TerraFusion.Unit.Tests.Sync.Workbench;

/// <summary>
/// SYNC-WORKBENCH-H unit tests for <see cref="EvidencePacketService"/>.
///
/// <para>Mirrors the Phase 5 in-memory DbContext fixture pattern.
/// Each test seeds a fresh commit + decision-link set, asks the
/// service to build the packet, then asserts on the resulting
/// bytes (manifest schema, HMAC verification, CSV row counts,
/// determinism).</para>
/// </summary>
public sealed class EvidencePacketServiceTests : IDisposable
{
    private const string ValidHmacKey =
        "TEST-WORKBENCH-H-HMAC-KEY-32-BYTES-MIN-PADDING-aaaaaaaaaa";
    private const string AltHmacKey =
        "DIFFERENT-HMAC-KEY-32-BYTES-MIN-PADDING-bbbbbbbbbbbbbbbb";

    private static readonly DateTime PinnedNow = new(
        2026, 5, 8, 12, 0, 0, DateTimeKind.Utc);

    private readonly TerraFusionDbContext _db;

    public EvidencePacketServiceTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"workbench-h-{Guid.NewGuid():N}")
            .Options;
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
            })
            .Build();
        _db = new TerraFusionDbContext(options, configuration);
        _db.Database.EnsureCreated();
    }

    public void Dispose() => _db.Dispose();

    private EvidencePacketService Build(
        string? hmacKey = ValidHmacKey,
        string? keyId = "default")
    {
        var settings = new Dictionary<string, string?>();
        if (hmacKey is not null)
            settings["Workbench:Evidence:HmacKey"] = hmacKey;
        if (keyId is not null)
            settings["Workbench:Evidence:KeyId"] = keyId;

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(settings)
            .Build();

        return new EvidencePacketService(_db, configuration, () => PinnedNow);
    }

    // ── Seeders ──────────────────────────────────────────────────────

    private async Task<WorkbenchCommit> SeedCommitAsync(
        int routedCount = 2,
        int dismissedCount = 1,
        string universeJson =
            "{\"REAL_RESIDENTIAL\":2,\"REAL_COMMERCIAL\":0,\"MOBILE_HOME\":0,\"AG_CURRENT_USE\":1,\"PERSONAL_PROPERTY\":0,\"CONVERSION_LEGACY\":0,\"UNKNOWN\":0}",
        string ratioJson =
            "{\"DorQ_CountyQ\":3,\"DorQ_CountyN\":1,\"DorN_CountyQ\":0,\"DorN_CountyN\":0}")
    {
        var commitId = Guid.NewGuid();
        var committedAt = new DateTime(2026, 5, 7, 18, 30, 45, 123, DateTimeKind.Utc);

        var commit = new WorkbenchCommit
        {
            CommitId = commitId,
            IdempotencyKey = "idem-test-key",
            OperatorId = "tester@benton",
            CommitNote = "Slice H test commit",
            RoutedDecisionsApplied = routedCount,
            DismissedDecisionsApplied = dismissedCount,
            UniverseDistributionJson = universeJson,
            RatioDistributionJson = ratioJson,
            CommittedAt = committedAt,
            CreatedAt = committedAt,
            UpdatedAt = committedAt,
            CreatedBy = "tester@benton",
            UpdatedBy = "tester@benton",
        };
        _db.WorkbenchCommits.Add(commit);

        // Add link rows. Use deterministic LinkIds derived from the
        // commit id so test ordering is predictable.
        for (var i = 0; i < routedCount; i++)
        {
            _db.WorkbenchCommitDecisionLinks.Add(new WorkbenchCommitDecisionLink
            {
                LinkId = MakeDeterministicGuid(commitId, $"route-{i:D2}"),
                CommitId = commitId,
                TriageId = MakeDeterministicGuid(commitId, $"triage-route-{i:D2}"),
                UnprovenRowId = MakeDeterministicGuid(commitId, $"unproven-route-{i:D2}"),
                DecisionType = DecisionTypes.Route,
                RoutedToUniverse = UniverseCodes.RealResidential,
                RoutedToIAttrValCd = $"CODE-{i}",
                CreatedAt = committedAt,
            });
        }
        for (var i = 0; i < dismissedCount; i++)
        {
            _db.WorkbenchCommitDecisionLinks.Add(new WorkbenchCommitDecisionLink
            {
                LinkId = MakeDeterministicGuid(commitId, $"dismiss-{i:D2}"),
                CommitId = commitId,
                TriageId = MakeDeterministicGuid(commitId, $"triage-dismiss-{i:D2}"),
                UnprovenRowId = MakeDeterministicGuid(commitId, $"unproven-dismiss-{i:D2}"),
                DecisionType = DecisionTypes.Dismiss,
                DismissalReason = "INTENTIONAL_NOISE",
                CreatedAt = committedAt,
            });
        }

        await _db.SaveChangesAsync();
        return commit;
    }

    private static Guid MakeDeterministicGuid(Guid seed, string suffix)
    {
        var src = $"{seed:N}-{suffix}";
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(src));
        var guidBytes = new byte[16];
        Array.Copy(hash, guidBytes, 16);
        return new Guid(guidBytes);
    }

    private static IReadOnlyDictionary<string, byte[]> ReadZipEntries(byte[] zip)
    {
        var entries = new Dictionary<string, byte[]>(StringComparer.Ordinal);
        using var ms = new MemoryStream(zip);
        using var archive = new ZipArchive(ms, ZipArchiveMode.Read);
        foreach (var entry in archive.Entries)
        {
            using var stream = entry.Open();
            using var copy = new MemoryStream();
            stream.CopyTo(copy);
            entries[entry.FullName] = copy.ToArray();
        }
        return entries;
    }

    private static string[] ReadZipEntryNamesInOrder(byte[] zip)
    {
        using var ms = new MemoryStream(zip);
        using var archive = new ZipArchive(ms, ZipArchiveMode.Read);
        return archive.Entries.Select(e => e.FullName).ToArray();
    }

    // ── Build: happy path ────────────────────────────────────────────

    [Fact]
    public async Task Build_KnownCommit_ReturnsOkWithNonEmptyZip()
    {
        var commit = await SeedCommitAsync();

        var result = await Build().BuildAsync(commit.CommitId);

        result.Outcome.Should().Be(EvidencePacketOutcome.Ok);
        result.ZipContent.Should().NotBeNull();
        result.ZipContent!.Length.Should().BeGreaterThan(0);
        result.FileName.Should().NotBeNullOrEmpty();
        result.ManifestSignatureHex.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Build_FileName_ContainsCommitIdAndTimestamp()
    {
        var commit = await SeedCommitAsync();

        var result = await Build().BuildAsync(commit.CommitId);

        result.FileName.Should().StartWith("terrafusion-evidence-");
        result.FileName.Should().Contain(commit.CommitId.ToString());
        result.FileName.Should().EndWith(".zip");
        // Stamp 20260507T183045Z lives in the filename.
        result.FileName.Should().Contain("20260507T183045Z");
    }

    [Fact]
    public async Task Build_UnknownCommitId_ReturnsNotFound()
    {
        var result = await Build().BuildAsync(Guid.NewGuid());

        result.Outcome.Should().Be(EvidencePacketOutcome.NotFound);
        result.ZipContent.Should().BeNull();
    }

    [Fact]
    public async Task Build_EmptyGuid_ReturnsNotFound()
    {
        var result = await Build().BuildAsync(Guid.Empty);

        result.Outcome.Should().Be(EvidencePacketOutcome.NotFound);
    }

    // ── Manifest shape + signing ─────────────────────────────────────

    [Fact]
    public async Task Build_ManifestJson_HasAllExpectedFields()
    {
        var commit = await SeedCommitAsync();

        var result = await Build().BuildAsync(commit.CommitId);
        var entries = ReadZipEntries(result.ZipContent!);
        entries.Should().ContainKey(EvidencePacketEntries.Manifest);

        using var doc = JsonDocument.Parse(entries[EvidencePacketEntries.Manifest]);
        var root = doc.RootElement;

        root.GetProperty("schemaVersion").GetString().Should().Be("1.0");
        root.GetProperty("commitId").GetGuid().Should().Be(commit.CommitId);
        root.GetProperty("operatorId").GetString().Should().Be(commit.OperatorId);
        root.GetProperty("idempotencyKey").GetString().Should().Be(commit.IdempotencyKey);
        root.GetProperty("commitNote").GetString().Should().Be(commit.CommitNote);
        root.GetProperty("routedDecisionsApplied").GetInt32().Should().Be(2);
        root.GetProperty("dismissedDecisionsApplied").GetInt32().Should().Be(1);
        root.GetProperty("decisionCount").GetInt32().Should().Be(3);
        root.GetProperty("entries").GetArrayLength().Should().Be(4);

        var sig = root.GetProperty("signature");
        sig.GetProperty("algorithm").GetString().Should().Be("HMAC-SHA256");
        sig.GetProperty("keyId").GetString().Should().Be("default");
        sig.GetProperty("hex").GetString().Should().NotBeNullOrEmpty();

        var gen = root.GetProperty("generator");
        gen.GetProperty("service").GetString().Should().Be("TerraFusion.Workbench.H");
        gen.GetProperty("version").GetString().Should().Be("1.0.0");
        gen.GetProperty("generatedAtUtc").GetString().Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Build_ManifestEntries_Sha256MatchesActualEntryBytes()
    {
        var commit = await SeedCommitAsync();

        var result = await Build().BuildAsync(commit.CommitId);
        var zipEntries = ReadZipEntries(result.ZipContent!);

        using var doc = JsonDocument.Parse(zipEntries[EvidencePacketEntries.Manifest]);
        var manifestEntries = doc.RootElement.GetProperty("entries");

        foreach (var manifestEntry in manifestEntries.EnumerateArray())
        {
            var name = manifestEntry.GetProperty("name").GetString()!;
            var sha256 = manifestEntry.GetProperty("sha256").GetString()!;
            var byteCount = manifestEntry.GetProperty("byteCount").GetInt32();

            zipEntries.Should().ContainKey(name);
            var actualBytes = zipEntries[name];
            actualBytes.Length.Should().Be(byteCount);
            var actualHashHex =
                Convert.ToHexString(SHA256.HashData(actualBytes)).ToLowerInvariant();
            actualHashHex.Should().Be(sha256);
        }
    }

    [Fact]
    public async Task Build_HmacSignature_VerifiesWithReZeroedHexField()
    {
        var commit = await SeedCommitAsync();
        var result = await Build().BuildAsync(commit.CommitId);

        var entries = ReadZipEntries(result.ZipContent!);
        var manifestBytes = entries[EvidencePacketEntries.Manifest];

        using var doc = JsonDocument.Parse(manifestBytes);
        var hex = doc.RootElement.GetProperty("signature").GetProperty("hex").GetString()!;

        // Reproduce: re-zero signature.hex, recompute HMAC over the
        // reserialized manifest, expect equality with the embedded
        // hex value. We rebuild the JSON string by replacing the
        // hex literal with empty.
        var manifestText = Encoding.UTF8.GetString(manifestBytes);
        var zeroed = manifestText.Replace($"\"{hex}\"", "\"\"", StringComparison.Ordinal);
        var zeroedBytes = Encoding.UTF8.GetBytes(zeroed);

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(ValidHmacKey));
        var recomputedHex = Convert.ToHexString(hmac.ComputeHash(zeroedBytes)).ToLowerInvariant();

        recomputedHex.Should().Be(hex);
        result.ManifestSignatureHex.Should().Be(hex);
    }

    [Fact]
    public async Task Build_TamperedManifestBytes_HmacDoesNotVerify()
    {
        var commit = await SeedCommitAsync();
        var result = await Build().BuildAsync(commit.CommitId);

        var entries = ReadZipEntries(result.ZipContent!);
        var manifestBytes = entries[EvidencePacketEntries.Manifest];

        using var doc = JsonDocument.Parse(manifestBytes);
        var hex = doc.RootElement.GetProperty("signature").GetProperty("hex").GetString()!;

        // Mutate one operator-visible field, re-zero signature.hex,
        // recompute HMAC. Result should NOT match the embedded hex.
        var tampered = Encoding.UTF8.GetString(manifestBytes)
            .Replace("tester@benton", "attacker@nope", StringComparison.Ordinal)
            .Replace($"\"{hex}\"", "\"\"", StringComparison.Ordinal);

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(ValidHmacKey));
        var recomputedHex = Convert.ToHexString(
            hmac.ComputeHash(Encoding.UTF8.GetBytes(tampered))).ToLowerInvariant();

        recomputedHex.Should().NotBe(hex);
    }

    [Fact]
    public async Task Build_DifferentHmacKey_ProducesDifferentSignature()
    {
        var commit = await SeedCommitAsync();

        var result1 = await Build(hmacKey: ValidHmacKey).BuildAsync(commit.CommitId);
        var result2 = await Build(hmacKey: AltHmacKey).BuildAsync(commit.CommitId);

        result1.Outcome.Should().Be(EvidencePacketOutcome.Ok);
        result2.Outcome.Should().Be(EvidencePacketOutcome.Ok);
        result1.ManifestSignatureHex.Should().NotBe(result2.ManifestSignatureHex);
    }

    [Fact]
    public async Task Build_SameCommit_TwiceProducesByteIdenticalZip()
    {
        var commit = await SeedCommitAsync();

        var first = await Build().BuildAsync(commit.CommitId);
        var second = await Build().BuildAsync(commit.CommitId);

        first.Outcome.Should().Be(EvidencePacketOutcome.Ok);
        second.Outcome.Should().Be(EvidencePacketOutcome.Ok);
        first.ZipContent.Should().Equal(second.ZipContent);
        first.ManifestSignatureHex.Should().Be(second.ManifestSignatureHex);
    }

    // ── HMAC config-error paths ──────────────────────────────────────

    [Fact]
    public async Task Build_MissingHmacKey_ReturnsConfigurationError()
    {
        var commit = await SeedCommitAsync();

        var result = await Build(hmacKey: null).BuildAsync(commit.CommitId);

        result.Outcome.Should().Be(EvidencePacketOutcome.ConfigurationError);
        result.ZipContent.Should().BeNull();
        result.ErrorMessage.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Build_HmacKeyShorterThan32Bytes_ReturnsConfigurationError()
    {
        var commit = await SeedCommitAsync();

        var result = await Build(hmacKey: "short-key").BuildAsync(commit.CommitId);

        result.Outcome.Should().Be(EvidencePacketOutcome.ConfigurationError);
        result.ZipContent.Should().BeNull();
    }

    // ── ZIP layout + entry order ─────────────────────────────────────

    [Fact]
    public async Task Build_ZipContents_ContainsExactlyFiveEntriesInDeclaredOrder()
    {
        var commit = await SeedCommitAsync();

        var result = await Build().BuildAsync(commit.CommitId);
        var names = ReadZipEntryNamesInOrder(result.ZipContent!);

        names.Should().Equal(
            EvidencePacketEntries.Manifest,
            EvidencePacketEntries.Decisions,
            EvidencePacketEntries.UniverseDistribution,
            EvidencePacketEntries.RatioDistribution,
            EvidencePacketEntries.AuditTrail);
    }

    // ── decisions.csv ────────────────────────────────────────────────

    [Fact]
    public async Task Build_DecisionsCsv_HasOneRowPerDecisionPlusHeader()
    {
        var commit = await SeedCommitAsync(routedCount: 3, dismissedCount: 2);

        var result = await Build().BuildAsync(commit.CommitId);
        var entries = ReadZipEntries(result.ZipContent!);
        var csv = Encoding.UTF8.GetString(entries[EvidencePacketEntries.Decisions]);

        var lines = csv.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        // 1 header + 5 data rows.
        lines.Length.Should().Be(6);
        lines[0].Should().StartWith("LinkId,TriageId,UnprovenRowId,DecisionType");
    }

    [Fact]
    public async Task Build_DecisionsCsv_RowsOrderedByLinkIdAscending()
    {
        var commit = await SeedCommitAsync(routedCount: 3, dismissedCount: 0);

        var result = await Build().BuildAsync(commit.CommitId);
        var entries = ReadZipEntries(result.ZipContent!);
        var csv = Encoding.UTF8.GetString(entries[EvidencePacketEntries.Decisions]);

        var dataLines = csv.Split('\n', StringSplitOptions.RemoveEmptyEntries).Skip(1).ToList();
        var linkIds = dataLines.Select(l => Guid.Parse(l.Split(',')[0])).ToList();

        // The link rows in the DB were inserted in a fixed order;
        // service emits ordered by LinkId ascending.
        linkIds.Should().BeInAscendingOrder();
    }

    [Fact]
    public async Task Build_DecisionsCsv_DismissRowHasEmptyRouteCells()
    {
        var commit = await SeedCommitAsync(routedCount: 0, dismissedCount: 1);

        var result = await Build().BuildAsync(commit.CommitId);
        var entries = ReadZipEntries(result.ZipContent!);
        var csv = Encoding.UTF8.GetString(entries[EvidencePacketEntries.Decisions]);

        var dataLines = csv.Split('\n', StringSplitOptions.RemoveEmptyEntries).Skip(1).ToArray();
        dataLines.Should().HaveCount(1);

        var cells = dataLines[0].Split(',');
        // Columns: LinkId,TriageId,UnprovenRowId,DecisionType,RoutedToUniverse,RoutedToIAttrValCd,DismissalReason,CreatedAt
        cells[3].Should().Be("Dismiss");
        cells[4].Should().BeEmpty();      // RoutedToUniverse
        cells[5].Should().BeEmpty();      // RoutedToIAttrValCd
        cells[6].Should().Be("INTENTIONAL_NOISE"); // DismissalReason
    }

    [Fact]
    public async Task Build_DecisionsCsv_RouteRowHasEmptyDismissalReason()
    {
        var commit = await SeedCommitAsync(routedCount: 1, dismissedCount: 0);

        var result = await Build().BuildAsync(commit.CommitId);
        var entries = ReadZipEntries(result.ZipContent!);
        var csv = Encoding.UTF8.GetString(entries[EvidencePacketEntries.Decisions]);

        var dataLines = csv.Split('\n', StringSplitOptions.RemoveEmptyEntries).Skip(1).ToArray();
        var cells = dataLines[0].Split(',');
        cells[3].Should().Be("Route");
        cells[4].Should().Be(UniverseCodes.RealResidential);
        cells[5].Should().Be("CODE-0");
        cells[6].Should().BeEmpty();      // DismissalReason
    }

    // ── universe-distribution.csv ────────────────────────────────────

    [Fact]
    public async Task Build_UniverseCsv_HasExactly7RowsInCanonicalOrder()
    {
        var commit = await SeedCommitAsync();

        var result = await Build().BuildAsync(commit.CommitId);
        var entries = ReadZipEntries(result.ZipContent!);
        var csv = Encoding.UTF8.GetString(entries[EvidencePacketEntries.UniverseDistribution]);

        var lines = csv.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        lines.Length.Should().Be(8); // header + 7 cells
        lines[0].Should().Be("UniverseCode,Count");
        lines[1].Should().StartWith("REAL_RESIDENTIAL,");
        lines[2].Should().StartWith("REAL_COMMERCIAL,");
        lines[3].Should().StartWith("MOBILE_HOME,");
        lines[4].Should().StartWith("AG_CURRENT_USE,");
        lines[5].Should().StartWith("PERSONAL_PROPERTY,");
        lines[6].Should().StartWith("CONVERSION_LEGACY,");
        lines[7].Should().StartWith("UNKNOWN,");
    }

    [Fact]
    public async Task Build_UniverseCsv_ZeroFillsMissingCells()
    {
        // Universe JSON containing only one cell — others must zero-fill.
        var commit = await SeedCommitAsync(
            universeJson: "{\"REAL_RESIDENTIAL\":5}");

        var result = await Build().BuildAsync(commit.CommitId);
        var entries = ReadZipEntries(result.ZipContent!);
        var csv = Encoding.UTF8.GetString(entries[EvidencePacketEntries.UniverseDistribution]);

        csv.Should().Contain("REAL_RESIDENTIAL,5\n");
        csv.Should().Contain("REAL_COMMERCIAL,0\n");
        csv.Should().Contain("MOBILE_HOME,0\n");
        csv.Should().Contain("AG_CURRENT_USE,0\n");
        csv.Should().Contain("PERSONAL_PROPERTY,0\n");
        csv.Should().Contain("CONVERSION_LEGACY,0\n");
        csv.Should().Contain("UNKNOWN,0\n");
    }

    // ── ratio-distribution.csv ───────────────────────────────────────

    [Fact]
    public async Task Build_RatioCsv_HasExactly4RowsInCanonicalOrder()
    {
        var commit = await SeedCommitAsync();

        var result = await Build().BuildAsync(commit.CommitId);
        var entries = ReadZipEntries(result.ZipContent!);
        var csv = Encoding.UTF8.GetString(entries[EvidencePacketEntries.RatioDistribution]);

        var lines = csv.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        lines.Length.Should().Be(5); // header + 4 cells
        lines[0].Should().Be("DorRatioQualified,CountyRatioQualified,Count");
        lines[1].Should().StartWith("true,true,");
        lines[2].Should().StartWith("true,false,");
        lines[3].Should().StartWith("false,true,");
        lines[4].Should().StartWith("false,false,");
    }

    // ── audit-trail.csv ──────────────────────────────────────────────

    [Fact]
    public async Task Build_AuditTrailCsv_HasExactlyOneDataRow()
    {
        var commit = await SeedCommitAsync();

        var result = await Build().BuildAsync(commit.CommitId);
        var entries = ReadZipEntries(result.ZipContent!);
        var csv = Encoding.UTF8.GetString(entries[EvidencePacketEntries.AuditTrail]);

        var lines = csv.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        lines.Length.Should().Be(2); // header + 1 row
        lines[0].Should().Be("CommitId,CreatedAt,UpdatedAt,CreatedBy,UpdatedBy");

        var cells = lines[1].Split(',');
        Guid.Parse(cells[0]).Should().Be(commit.CommitId);
        cells[3].Should().Be("tester@benton");
        cells[4].Should().Be("tester@benton");
    }

    [Fact]
    public async Task Build_EveryCsv_HasHeaderRow()
    {
        var commit = await SeedCommitAsync();

        var result = await Build().BuildAsync(commit.CommitId);
        var entries = ReadZipEntries(result.ZipContent!);

        // Each CSV's first line is its header — confirmed by string-prefix.
        Encoding.UTF8.GetString(entries[EvidencePacketEntries.Decisions])
            .Should().StartWith("LinkId,TriageId,");
        Encoding.UTF8.GetString(entries[EvidencePacketEntries.UniverseDistribution])
            .Should().StartWith("UniverseCode,Count");
        Encoding.UTF8.GetString(entries[EvidencePacketEntries.RatioDistribution])
            .Should().StartWith("DorRatioQualified,CountyRatioQualified,Count");
        Encoding.UTF8.GetString(entries[EvidencePacketEntries.AuditTrail])
            .Should().StartWith("CommitId,CreatedAt,UpdatedAt,CreatedBy,UpdatedBy");
    }

    // ── BuildManifestAsync (manifest-only endpoint backing) ──────────

    [Fact]
    public async Task BuildManifest_KnownCommit_ReturnsManifestBytesMatchingZipManifestEntry()
    {
        var commit = await SeedCommitAsync();
        var service = Build();

        var zip = await service.BuildAsync(commit.CommitId);
        var manifestOnly = await service.BuildManifestAsync(commit.CommitId);

        manifestOnly.Outcome.Should().Be(EvidencePacketOutcome.Ok);
        manifestOnly.ManifestJson.Should().NotBeNull();

        var entries = ReadZipEntries(zip.ZipContent!);
        manifestOnly.ManifestJson.Should().Equal(entries[EvidencePacketEntries.Manifest]);
    }

    [Fact]
    public async Task BuildManifest_UnknownCommit_ReturnsNotFound()
    {
        var manifestOnly = await Build().BuildManifestAsync(Guid.NewGuid());

        manifestOnly.Outcome.Should().Be(EvidencePacketOutcome.NotFound);
        manifestOnly.ManifestJson.Should().BeNull();
    }
}
