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
        // Provision only this journey's actual EF prerequisites. Unrelated schema-qualified
        // PACS tables collide when globally flattened into SQLite; never silently deduplicate.
        var requiredTables = new HashSet<string>(StringComparer.Ordinal)
        {
            "Counties", "Properties", "Valuations", "CamaCharacteristics", "Appeals", "CountyStudySessions", "CertificationSteps",
            "DossierPackets", "DossierPacketItems", "DossierDocuments", "DossierEvidenceItems",
            "DossierCustodyEvents", "DossierWorkflowRecords", "AuditLogs"
        };
        var tableStatements = Regex.Matches(script, "CREATE TABLE \"([^\"]+)\"[\\s\\S]*?;")
            .Cast<Match>().Where(statement => requiredTables.Contains(statement.Groups[1].Value)).ToArray();
        var foundTables = new HashSet<string>(StringComparer.Ordinal);
        foreach (var statement in tableStatements)
            if (!foundTables.Add(statement.Groups[1].Value))
                throw new InvalidOperationException("Duplicate required EF prerequisite table: " + statement.Groups[1].Value);
        if (!foundTables.SetEquals(requiredTables))
            throw new InvalidOperationException("Missing required EF prerequisite tables: " + string.Join(", ", requiredTables.Except(foundTables).Order()));
        foreach (var statement in tableStatements)
            await db.Database.ExecuteSqlRawAsync(statement.Value);
        // Retain ALL actual EF-generated indexes on these tables, including county/request-id
        // uniqueness. An unrecognized generated index statement is a fixture failure, not a skip.
        foreach (Match statement in Regex.Matches(script, "CREATE (?:UNIQUE )?INDEX [^;]+;"))
        {
            var target = Regex.Match(statement.Value, "\\bON \"([^\"]+)\"");
            if (!target.Success) throw new InvalidOperationException("Unrecognized EF prerequisite index target.");
            if (requiredTables.Contains(target.Groups[1].Value))
                await db.Database.ExecuteSqlRawAsync(statement.Value);
        }

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
        Assert.Empty(await db.Valuations.ToListAsync());
        Assert.Empty(await db.CamaCharacteristics.ToListAsync());
        // Normal SaveChanges emits real prerequisite entity audits. Preserve them and prove
        // that none represents a packet action, appeal, or pre-seeded successful receipt.
        var prerequisiteAudits = await db.AuditLogs.AsNoTracking().ToListAsync();
        var expectedAuditTypes = new[]
        {
            "County_Added", "County_Added", "CountyStudySession_Added", "CountyStudySession_Added",
            "Property_Added", "DossierDocument_Added", "DossierEvidence_Added",
            "DossierPacket_Added", "DossierPacket_Added", "DossierPacketItem_Added", "DossierPacketItem_Added"
        };
        Assert.Equal(expectedAuditTypes.Order(StringComparer.Ordinal), prerequisiteAudits.Select(x => x.Type).Order(StringComparer.Ordinal));
        Assert.Equal(11, prerequisiteAudits.Select(x => x.Id).Distinct().Count());
        Assert.All(prerequisiteAudits, audit =>
        {
            Assert.NotEqual(Guid.Empty, audit.Id);
            Assert.Equal("EntityFramework", audit.Source);
            Assert.Equal("System", audit.UserId);
            Assert.Equal("{}", audit.Data); // Existing EF Added entries have no modified-property delta.
            Assert.Null(audit.CorrelationId);
        });
        Assert.Empty(prerequisiteAudits.Where(x => x.Type.StartsWith("DOSSIER_PACKET:", StringComparison.Ordinal)));
        // Retain actual baseline row identities in the fixture TRX stdout, not a success receipt.
        Console.WriteLine("Prerequisite EntityFramework audit baseline: " + System.Text.Json.JsonSerializer.Serialize(
            prerequisiteAudits.OrderBy(x => x.Id).Select(x => new { x.Id, x.Type, x.Source, x.UserId, x.Data, x.CorrelationId, x.Timestamp })));
        Assert.All(await db.DossierPackets.ToListAsync(), packet => Assert.Equal("draft", packet.Status));
        await AssertPropertyFeed(db);
    }

    private static async Task AssertPropertyFeed(TerraFusionDbContext db)
    {
        // Exercise the actual workbench prerequisite query and controller, not a replacement
        // property response. Full HTTP permission/issuer checks remain in the browser harness.
        var mapper = new AutoMapper.MapperConfiguration(_ => { }, NullLoggerFactory.Instance).CreateMapper();
        var service = new TerraFusion.Core.Services.PropertyService(db, mapper,
            NullLogger<TerraFusion.Core.Services.PropertyService>.Instance);
        var property = await service.GetPropertyByParcelAsync(Parcel, CountyId);
        Assert.NotNull(property);
        Assert.Equal(CountyId, property.CountyId);
        Assert.Equal(Parcel, property.ParcelNumber);
        var controller = new TerraFusion.API.Controllers.PropertiesController(service, db,
            NullLogger<TerraFusion.API.Controllers.PropertiesController>.Instance)
        {
            ControllerContext = new Microsoft.AspNetCore.Mvc.ControllerContext
            {
                HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext
                {
                    User = new System.Security.Claims.ClaimsPrincipal(new System.Security.Claims.ClaimsIdentity(
                        [new System.Security.Claims.Claim("countyId", CountyId.ToString("D"))], "fixture-prerequisite"))
                }
            }
        };
        var response = await controller.GetPropertyByParcel(Parcel);
        var value = Assert.IsType<TerraFusion.Core.DTOs.PropertyDto>(Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(response.Result).Value);
        Assert.Equal(CountyId, value.CountyId);
        Assert.Equal(Parcel, value.ParcelNumber);
        Assert.Equal(2026, value.TaxYear);
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
