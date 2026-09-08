using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using CountyResolver = TerraFusion.API.Services.CountyResolver;
using TerraFusion.Core.Counties;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Dossier;

/// <summary>Opt-in fresh synthetic prerequisites and read-only post-browser verification; no application replacement.</summary>
public sealed class DossierPacketWorkflowBrowserFixture
{
    private static readonly Guid CountyId = Guid.Parse("11111111-1111-4111-8111-111111111111");
    private static readonly Guid OtherCountyId = Guid.Parse("99999999-9999-4999-8999-999999999999");
    private static readonly Guid PacketId = Guid.Parse("22222222-2222-4222-8222-222222222222");
    private static readonly Guid IncompleteId = Guid.Parse("33333333-3333-4333-8333-333333333333");
    private static readonly Guid DocumentId = Guid.Parse("44444444-4444-4444-8444-444444444444");
    private const string Parcel = "SYNTHETIC-DOSSIER";
    private static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();

    [DossierBrowserFixtureFact]
    public async Task PrepareOrVerifyOwnedBrowserDatabase()
    {
        var mode = Environment.GetEnvironmentVariable("DOSSIER_BROWSER_FIXTURE_MODE");
        var path = GuardPath();
        if (mode == "seed") await Seed(path);
        else if (mode == "verify") await Verify(path);
        else throw new InvalidOperationException("Explicit seed or verify fixture mode required.");
    }

    private static string GuardPath()
    {
        var path = Environment.GetEnvironmentVariable("DOSSIER_BROWSER_DATABASE_PATH");
        if (string.IsNullOrEmpty(path) || !Path.IsPathFullyQualified(path)) throw new InvalidOperationException("Absolute owned database path required.");
        var current = new DirectoryInfo(AppContext.BaseDirectory);
        while (current != null && !File.Exists(Path.Combine(current.FullName, "backend", "src", "TerraFusion.API", "TerraFusion.API.csproj"))) current = current.Parent;
        var root = current?.FullName ?? throw new InvalidOperationException("Owned checkout not found.");
        var full = Path.GetFullPath(path);
        var directory = new DirectoryInfo(Path.GetDirectoryName(full)!);
        var comparison = OperatingSystem.IsWindows() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;
        if (Path.GetFileName(full) != "packet.db" || !Regex.IsMatch(directory.Name, "^run-[a-f0-9]{32}$") ||
            !string.Equals(directory.Parent?.FullName, Path.Combine(root, ".tmp", "dossier-packet-browser"), comparison))
            throw new InvalidOperationException("Only a fresh owned .tmp/dossier-packet-browser/run-UUID/packet.db is permitted.");
        for (var ancestor = directory; ancestor != null; ancestor = ancestor.Parent)
            if (ancestor.Exists && ancestor.Attributes.HasFlag(FileAttributes.ReparsePoint)) throw new InvalidOperationException("Reparse fixture paths refused.");
        if (File.Exists(full) && File.GetAttributes(full).HasFlag(FileAttributes.ReparsePoint)) throw new InvalidOperationException("Reparse database refused.");
        return full;
    }

    private static TerraFusionDbContext Db(string path, bool readOnly = false) =>
        new(new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseSqlite($"Data Source={path};Mode={(readOnly ? "ReadOnly" : "ReadWrite")};Pooling=False").Options,
            new ConfigurationBuilder().Build());

    private static async Task Seed(string path)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        // CreateNew refuses all prior state. Never EnsureDeleted, overwrite, or reseed an existing DB.
        using (File.Open(path, FileMode.CreateNew, FileAccess.Write, FileShare.None)) { }
        await using var db = Db(path);
        var script = db.Database.GenerateCreateScript();
        var tables = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (Match statement in Regex.Matches(script, "CREATE TABLE \"([^\"]+)\"[\\s\\S]*?;"))
            if (tables.Add(statement.Groups[1].Value)) await db.Database.ExecuteSqlRawAsync(statement.Value);
        // Actual EF-generated constraints, including the county/request-id uniqueness contract.
        foreach (Match statement in Regex.Matches(script, "CREATE (?:UNIQUE )?INDEX [^;]+;"))
            await db.Database.ExecuteSqlRawAsync(statement.Value);

        Assert.True(WashingtonCountyRegistry.TryResolve("Benton", out var primaryCounty));
        Assert.True(WashingtonCountyRegistry.TryResolve("Franklin", out var otherCounty));
        // Public registry identity must be consistent even for GUID lookup. Only these isolated
        // database GUIDs and prerequisite records are synthetic; no production county is accessed.
        db.Counties.AddRange(new County { Id = CountyId, Name = primaryCounty.Name, State = primaryCounty.State, FipsCode = primaryCounty.FipsCode },
            new County { Id = OtherCountyId, Name = otherCounty.Name, State = otherCounty.State, FipsCode = otherCounty.FipsCode });
        db.Properties.Add(new Property { CountyId = CountyId, ParcelId = Parcel, ParcelNumber = Parcel, PropertyId = Parcel,
            Address = "Synthetic Dossier prerequisite", PropertyType = "Residential", TaxYear = 2026 });
        foreach (var year in new[] { 2026, 2025 })
            db.CountyStudySessions.Add(new CountyStudySession { CountyId = CountyId, TaxYear = year, CountyName = primaryCounty.Name,
                BaselineVersion = "synthetic-prerequisite", CreatedBy = "synthetic-fixture" });
        db.DossierDocuments.Add(new DossierDocument { Id = DocumentId, CountyId = CountyId, ParcelId = Parcel,
            Name = "Synthetic appraisal", DocumentType = "appraisal", Status = "active", ContentHash = new string('3', 64) });
        db.DossierEvidenceItems.Add(new DossierEvidence { CountyId = CountyId, ParcelId = Parcel, DocumentId = DocumentId,
            Title = "Synthetic source evidence", EvidenceType = "valuation-record" });
        db.DossierPackets.Add(new DossierPacket { Id = PacketId, CountyId = CountyId, TaxYear = 2026, ParcelId = Parcel,
            Name = "Synthetic ready sources", PacketType = "boe_appeal", Status = "draft",
            Items = [new DossierPacketItem { DocumentId = DocumentId, DocumentType = "appraisal", Required = true, Satisfied = true }] });
        db.DossierPackets.Add(new DossierPacket { Id = IncompleteId, CountyId = CountyId, TaxYear = 2026, ParcelId = Parcel,
            Name = "Synthetic missing deed", PacketType = "boe_appeal", Status = "draft",
            Items = [new DossierPacketItem { DocumentType = "deed", Required = true, Satisfied = false }] });
        await db.SaveChangesAsync();
        await AssertCountyResolution(db);
        Assert.Empty(await db.DossierWorkflowRecords.ToListAsync());
        Assert.Empty(await db.Appeals.ToListAsync());
        Assert.Empty(await db.AuditLogs.ToListAsync());
        Assert.All(await db.DossierPackets.ToListAsync(), packet => Assert.Equal("draft", packet.Status));
    }

    private static async Task AssertCountyResolution(TerraFusionDbContext db)
    {
        using var cache = new MemoryCache(new MemoryCacheOptions { SizeLimit = 10 });
        var resolver = new CountyResolver(db, cache, NullLogger<CountyResolver>.Instance);
        Assert.Equal(CountyId, await resolver.ResolveAsync(CountyId.ToString("D")));
        Assert.Equal(CountyId, await resolver.ResolveAsync("Benton"));
        Assert.Equal(CountyId, await resolver.ResolveAsync("53005"));
        Assert.Equal(OtherCountyId, await resolver.ResolveAsync(OtherCountyId.ToString("D")));
        Assert.Equal(OtherCountyId, await resolver.ResolveAsync("Franklin"));
        Assert.Equal(OtherCountyId, await resolver.ResolveAsync("53021"));
        Assert.Null(await resolver.TryResolveAsync("99001"));
    }

    private static async Task Verify(string path)
    {
        var directory = Path.GetDirectoryName(path)!;
        var expectedPath = Path.Combine(directory, "expected.json");
        if (!File.Exists(path) || !File.Exists(expectedPath) || File.GetAttributes(expectedPath).HasFlag(FileAttributes.ReparsePoint))
            throw new InvalidOperationException("Existing owned browser database and actual observed receipt expectations required.");
        var expected = JsonNode.Parse(await File.ReadAllTextAsync(expectedPath))!.AsObject();
        await using var db = Db(path, readOnly: true);
        await AssertCountyResolution(db);
        var records = await db.DossierWorkflowRecords.AsNoTracking().Where(x => x.CountyId == CountyId).ToListAsync();
        Assert.Equal(4, records.Count); // UI narrative + seal + handoff + explicit revision; negatives/retries add none.
        Assert.Equal(new[] { "packet-finalization", "packet-handoff", "packet-narrative", "packet-revision" }, records.Select(x => x.Kind).Order().ToArray());
        foreach (var row in records)
        {
            Assert.Equal(2026, row.TaxYear);
            Assert.Equal(Hash(row.PayloadJson), row.ContentHash);
            Assert.Equal(PacketId.ToString("D"), JsonNode.Parse(row.PayloadJson)!["packetId"]!.GetValue<string>());
        }
        var seal = records.Single(x => x.Kind == "packet-finalization");
        var handoff = records.Single(x => x.Kind == "packet-handoff");
        Assert.True(JsonNode.DeepEquals(expected["seal"], JsonNode.Parse(seal.PayloadJson)));
        Assert.True(JsonNode.DeepEquals(expected["handoff"], JsonNode.Parse(handoff.PayloadJson)));
        Assert.Equal(expected["packetRevision"]!.GetValue<string>(), seal.Revision);
        Assert.Equal(seal.Revision, handoff.Revision);
        Assert.Equal(seal.RequestId, JsonNode.Parse(seal.PayloadJson)!["provenance"]!["traceId"]!.GetValue<string>());
        Assert.Equal(handoff.RequestId, JsonNode.Parse(handoff.PayloadJson)!["provenance"]!["traceId"]!.GetValue<string>());
        var audits = await db.AuditLogs.AsNoTracking().Where(x => x.Type.StartsWith("DOSSIER_PACKET:")).ToListAsync();
        Assert.Equal(4, audits.Count);
        var serviceAuditEvents = new JsonArray();
        foreach (var row in records)
        {
            var audit = Assert.Single(audits.Where(x => x.Type == "DOSSIER_PACKET:" + row.Kind));
            Assert.Equal(row.RequestId, audit.CorrelationId);
            Assert.NotNull(audit.Data);
            Assert.Equal(row.Id.ToString("D"), JsonNode.Parse(audit.Data)!["recordId"]!.GetValue<string>());
            // Export actual committed service audit fields, not harness-invented runtime spans.
            serviceAuditEvents.Add(new JsonObject { ["source"] = "persisted-service-audit", ["auditId"] = audit.Id.ToString("D"),
                ["cid"] = audit.CorrelationId, ["operation"] = audit.Type, ["actor"] = audit.UserId,
                ["timestamp"] = DateTime.SpecifyKind(audit.Timestamp, DateTimeKind.Utc).ToString("O"),
                ["recordId"] = row.Id.ToString("D"), ["contentHash"] = row.ContentHash, ["result"] = "committed" });
        }
        Assert.Equal("draft", (await db.DossierPackets.AsNoTracking().SingleAsync(x => x.Id == PacketId)).Status);
        Assert.Equal("draft", (await db.DossierPackets.AsNoTracking().SingleAsync(x => x.Id == IncompleteId)).Status);
        Assert.All(await db.DossierPackets.AsNoTracking().ToListAsync(), packet => Assert.Null(packet.AppealId));
        Assert.Empty(await db.Appeals.AsNoTracking().ToListAsync());
        // Evidence from the actual stored bytes, not a browser-reconstructed canonical envelope.
        var evidence = new JsonObject {
            ["finalizationId"] = seal.Id.ToString("D"), ["handoffId"] = handoff.Id.ToString("D"),
            ["packetRevision"] = seal.Revision, ["sealContentHash"] = seal.ContentHash, ["handoffContentHash"] = handoff.ContentHash,
            ["storedHandoff"] = JsonNode.Parse(handoff.PayloadJson), ["storedSeal"] = JsonNode.Parse(seal.PayloadJson),
            ["serviceAuditEvents"] = serviceAuditEvents, ["receiptCount"] = records.Count, ["auditCount"] = audits.Count };
        var output = Path.Combine(directory, "persisted-evidence.json");
        await using var stream = new FileStream(output, FileMode.CreateNew, FileAccess.Write, FileShare.None);
        await System.Text.Json.JsonSerializer.SerializeAsync(stream, evidence);
    }

    private sealed class DossierBrowserFixtureFactAttribute : FactAttribute
    {
        public DossierBrowserFixtureFactAttribute()
        {
            if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("DOSSIER_BROWSER_DATABASE_PATH")))
                Skip = "Requires an explicitly reserved fresh Dossier browser database. The browser harness verifies exactly one executed fixture, never a skip.";
        }
    }
}
