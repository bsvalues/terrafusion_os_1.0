using System.Buffers;
using System.Data.Common;
using System.Reflection;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Auth;
using TerraFusion.Core.Counties;
using TerraFusion.Core.Entities.Import;
using TerraFusion.Core.Import;
using TerraFusion.Data;
using TerraFusion.Data.Migrations;
using TerraFusion.Data.Services.Import;
using Xunit;
using CountyNotFoundException = TerraFusion.Core.Services.CountyNotFoundException;
using ICountyResolver = TerraFusion.Core.Services.ICountyResolver;

namespace TerraFusion.Unit.Tests.Import;

public sealed class CountyCsvUploadAdmissionLedgerTests
{
    private const string MigrationId =
        "20260902000000_WAL002GCountyCsvUploadAdmissionLedger";

    private static readonly WashingtonCountyIdentity Benton = ResolveCounty("Benton");
    private static readonly WashingtonCountyIdentity Franklin = ResolveCounty("Franklin");
    private static readonly Guid BentonId =
        Guid.Parse("00000000-0000-0000-0000-000000000005");
    private static readonly Guid FranklinId =
        Guid.Parse("00000000-0000-0000-0000-000000000021");
    private static readonly DateTimeOffset ReceivedAt =
        new(2026, 9, 2, 1, 2, 3, TimeSpan.Zero);

    [Fact]
    public async Task AdmitAsync_PersistsOneImmutableFirstSeenBatchWithExactProvenance()
    {
        await using var database = await TestDatabase.CreateAsync((Benton, BentonId));
        var request = await CreateRequestAsync(Benton, BentonId, "assessor-1");
        await using var context = database.CreateContext();
        var ledger = new CountyCsvUploadAdmissionLedger(
            database.CreateFactory(),
            new FixedTimeProvider(ReceivedAt));

        var result = await ledger.AdmitAsync(request);

        Assert.Equal(ICountyCsvUploadAdmissionLedger.ContractId, result.ContractId);
        Assert.Equal(CountyCsvUploadAdmissionDisposition.FirstSeen, result.Disposition);
        Assert.Equal(CountyCsvUploadAdmissionDenialCode.None, result.DenialCode);
        var batch = Assert.IsType<CountyCsvUploadBatch>(result.Batch);
        Assert.NotEqual(Guid.Empty, batch.BatchId);
        Assert.Equal(BentonId, batch.CountyId);
        Assert.Equal("assessor-1", batch.ActorId);
        Assert.Equal(nameof(CountyCsvDataset.Parcels), batch.Dataset);
        Assert.Equal("parcels.csv", batch.SourceFileName);
        Assert.Equal("csv", batch.Format);
        Assert.Equal("text/csv", batch.MediaType);
        Assert.Equal(request.Identity!.Content.Sha256, batch.ContentSha256);
        Assert.Equal(request.Identity.Content.ByteLength, batch.ContentByteLength);
        Assert.Equal(2, batch.AcceptedRowCount);
        Assert.Equal(request.Identity.IdempotencyKey, batch.IdempotencyKey);
        Assert.Equal(
            ICountyCsvUploadAdmissionLedger.AuthenticatedCsvApiAdmissionContractId,
            batch.ApiAdmissionContractId);
        Assert.Equal(AuthenticatedCanonicalCountyContext.ContractId, batch.CountyContextContractId);
        Assert.Equal(CountyCsvCountyBoundIntake.ContractId, batch.CountyBoundIntakeContractId);
        Assert.Equal(CountyCsvIntakeEnvelope.ContractId, batch.EnvelopeContractId);
        Assert.Equal(CountyCsvStreamParser.ContractId, batch.ParserContractId);
        Assert.Equal(CountyCsvIntakeIdempotency.ContractId, batch.IdempotencyContractId);
        Assert.Equal(ICountyCsvUploadAdmissionLedger.ContractId, batch.LedgerContractId);
        Assert.Equal(CountyCsvUploadBatch.AdmittedStatus, batch.Status);
        Assert.Equal(ReceivedAt, batch.ReceivedAtUtc);
        Assert.Equal(2, result.RowStaging!.StagedRowCount);
        Assert.Equal(0, result.RowStaging.QuarantinedRowCount);
        Assert.Equal(1, await context.CountyCsvUploadBatches.CountAsync());
        Assert.Equal(1, await context.CountyCsvUploadRowStages.CountAsync());
        Assert.Equal(1, await context.AuditLogs.CountAsync());
        Assert.All(
            typeof(CountyCsvUploadBatch).GetProperties(),
            property => Assert.False(property.SetMethod?.IsPublic == true));
    }

    [Fact]
    public async Task AdmitAsync_RejectsHeaderOnlyInvalidSchemaWithoutPersistingABatch()
    {
        await using var database = await TestDatabase.CreateAsync((Benton, BentonId));
        var request = await CreateRequestAsync(
            Benton,
            BentonId,
            "assessor-1",
            CountyCsvDataset.Sales,
            "parcel_id,amount\n");
        await using var context = database.CreateContext();

        var result = await new CountyCsvUploadAdmissionLedger(database.CreateFactory())
            .AdmitAsync(request);

        Assert.Equal(CountyCsvUploadAdmissionDisposition.Denied, result.Disposition);
        Assert.Equal(CountyCsvUploadAdmissionDenialCode.InvalidRowSchema, result.DenialCode);
        Assert.Null(result.Batch);
        Assert.Equal(0, await context.CountyCsvUploadBatches.CountAsync());
        Assert.Equal(0, await context.CountyCsvUploadRowStages.CountAsync());
    }

    [Fact]
    public async Task AdmitAsync_AfterContextRestartReturnsTheSameDurableBatchWithoutAnotherWrite()
    {
        await using var database = await TestDatabase.CreateAsync((Benton, BentonId));
        var request = await CreateRequestAsync(Benton, BentonId, "assessor-1");
        Guid firstBatchId;

        await using (var firstContext = database.CreateContext())
        {
            var first = await new CountyCsvUploadAdmissionLedger(database.CreateFactory())
                .AdmitAsync(request);
            firstBatchId = Assert.IsType<CountyCsvUploadBatch>(first.Batch).BatchId;
        }

        await using (var restartedContext = database.CreateContext())
        {
            var duplicate = await new CountyCsvUploadAdmissionLedger(database.CreateFactory())
                .AdmitAsync(request);

            Assert.Equal(CountyCsvUploadAdmissionDisposition.Duplicate, duplicate.Disposition);
            Assert.Equal(firstBatchId, Assert.IsType<CountyCsvUploadBatch>(duplicate.Batch).BatchId);
            Assert.Equal(1, await restartedContext.CountyCsvUploadBatches.CountAsync());
            Assert.Equal(1, await restartedContext.AuditLogs.CountAsync());
        }
    }

    [Fact]
    public async Task AdmitAsync_ParallelSameKeyConvergesOnOneBatch()
    {
        await using var database = await TestDatabase.CreateAsync((Benton, BentonId));
        var request = await CreateRequestAsync(Benton, BentonId, "parallel-assessor");
        var firstLedger = new CountyCsvUploadAdmissionLedger(database.CreateFactory());
        var secondLedger = new CountyCsvUploadAdmissionLedger(database.CreateFactory());

        var results = await Task.WhenAll(
            firstLedger.AdmitAsync(request),
            secondLedger.AdmitAsync(request));

        Assert.Equal(
            new[]
            {
                CountyCsvUploadAdmissionDisposition.FirstSeen,
                CountyCsvUploadAdmissionDisposition.Duplicate,
            },
            results.Select(result => result.Disposition).OrderBy(value => value));
        Assert.Single(results.Select(result => result.Batch!.BatchId).Distinct());

        await using var verificationContext = database.CreateContext();
        Assert.Equal(1, await verificationContext.CountyCsvUploadBatches.CountAsync());
        Assert.Equal(1, await verificationContext.AuditLogs.CountAsync());
    }

    [Fact]
    public async Task AdmitAsync_ContradictorySameKeyProvenanceIsDeniedAsCollision()
    {
        await using var database = await TestDatabase.CreateAsync((Benton, BentonId));
        var firstRequest = await CreateRequestAsync(Benton, BentonId, "assessor-1");
        var contradictory = await CreateRequestAsync(Benton, BentonId, "assessor-2");
        await using var context = database.CreateContext();
        var ledger = new CountyCsvUploadAdmissionLedger(database.CreateFactory());

        var first = await ledger.AdmitAsync(firstRequest);
        var collision = await ledger.AdmitAsync(contradictory);

        Assert.Equal(CountyCsvUploadAdmissionDisposition.FirstSeen, first.Disposition);
        Assert.Equal(CountyCsvUploadAdmissionDisposition.Denied, collision.Disposition);
        Assert.Equal(CountyCsvUploadAdmissionDenialCode.KeyCollision, collision.DenialCode);
        Assert.Null(collision.Batch);
        Assert.Equal(1, await context.CountyCsvUploadBatches.CountAsync());
    }

    [Fact]
    public async Task AdmitAsync_SameBytesAcrossCountiesRemainSeparateFirstSeenBatches()
    {
        await using var database = await TestDatabase.CreateAsync(
            (Benton, BentonId),
            (Franklin, FranklinId));
        var benton = await CreateRequestAsync(Benton, BentonId, "benton-assessor");
        var franklin = await CreateRequestAsync(Franklin, FranklinId, "franklin-assessor");
        await using var context = database.CreateContext();
        var ledger = new CountyCsvUploadAdmissionLedger(database.CreateFactory());

        var first = await ledger.AdmitAsync(benton);
        var second = await ledger.AdmitAsync(franklin);

        Assert.Equal(CountyCsvUploadAdmissionDisposition.FirstSeen, first.Disposition);
        Assert.Equal(CountyCsvUploadAdmissionDisposition.FirstSeen, second.Disposition);
        Assert.NotEqual(benton.Identity!.IdempotencyKey, franklin.Identity!.IdempotencyKey);
        Assert.NotEqual(first.Batch!.BatchId, second.Batch!.BatchId);
        Assert.Equal(2, await context.CountyCsvUploadBatches.CountAsync());
    }

    [Fact]
    public async Task AdmitAsync_RejectsMutatedAuthorityDatasetContentAndContractEvidenceBeforeWrite()
    {
        await using var database = await TestDatabase.CreateAsync(
            (Benton, BentonId),
            (Franklin, FranklinId));
        var valid = await CreateRequestAsync(Benton, BentonId, "assessor-1");
        var invalidActorContext = await CreateCountyContextAsync(
            Benton,
            BentonId,
            new string('a', 201));
        var franklinContext = await CreateCountyContextAsync(
            Franklin,
            FranklinId,
            "franklin-assessor");
        var misboundBentonContext = await CreateCountyContextAsync(
            Benton,
            FranklinId,
            "benton-assessor");
        var receipt = valid.IntakeReceipt!;
        var intakeReceipt = receipt.IntakeReceipt;
        var oversizedIntakeReceipt = intakeReceipt with
        {
            Content = intakeReceipt.Content with
            {
                ByteLength = ICountyCsvUploadAdmissionLedger.MaximumAuthenticatedCsvUploadBytes + 1,
            },
            Document = intakeReceipt.Document with
            {
                InputBytes = ICountyCsvUploadAdmissionLedger.MaximumAuthenticatedCsvUploadBytes + 1,
            },
        };
        var oversizedReceipt = receipt with { IntakeReceipt = oversizedIntakeReceipt };
        var oversizedRequest = valid with
        {
            IntakeReceipt = oversizedReceipt,
            Identity = CountyCsvIntakeIdempotency.Create(oversizedReceipt),
        };
        var cases = new[]
        {
            (
                valid with { ApiAdmissionContractId = "wrong-api-contract" },
                CountyCsvUploadAdmissionDenialCode.InvalidApiContract),
            (
                valid with { CountyContext = invalidActorContext },
                CountyCsvUploadAdmissionDenialCode.InvalidActor),
            (
                valid with { CountyContext = franklinContext },
                CountyCsvUploadAdmissionDenialCode.CountyMismatch),
            (
                valid with { CountyContext = misboundBentonContext },
                CountyCsvUploadAdmissionDenialCode.CountyMismatch),
            (
                valid with
                {
                    IntakeReceipt = receipt with
                    {
                        Binding = receipt.Binding with
                        {
                            Dataset = CountyCsvDataset.Unspecified,
                        },
                    },
                },
                CountyCsvUploadAdmissionDenialCode.UnsupportedDataset),
            (
                valid with
                {
                    IntakeReceipt = receipt with
                    {
                        IntakeReceipt = intakeReceipt with
                        {
                            Content = intakeReceipt.Content with
                            {
                                Sha256 = intakeReceipt.Content.Sha256.ToUpperInvariant(),
                            },
                        },
                    },
                },
                CountyCsvUploadAdmissionDenialCode.InvalidContentEvidence),
            (
                oversizedRequest,
                CountyCsvUploadAdmissionDenialCode.InvalidContentEvidence),
            (
                valid with
                {
                    AdmittedContent = Encoding.UTF8.GetBytes(
                        "parcel_id,owner\n1,Eve\n2,Grace\n"),
                },
                CountyCsvUploadAdmissionDenialCode.InvalidContentEvidence),
            (
                valid with
                {
                    IntakeReceipt = receipt with { ContractId = "wrong-intake-contract" },
                },
                CountyCsvUploadAdmissionDenialCode.InvalidReceipt),
            (
                valid with
                {
                    IntakeReceipt = receipt with
                    {
                        IntakeReceipt = intakeReceipt with
                        {
                            Document = new CountyCsvDocument(
                                Array.AsReadOnly(new[] { "Id", " id " }),
                                Array.AsReadOnly<IReadOnlyList<string>>(
                                    new[]
                                    {
                                        Array.AsReadOnly(new[] { "1", "Ada" }),
                                    }),
                                intakeReceipt.Document.InputBytes,
                                intakeReceipt.Document.ContentSha256),
                        },
                    },
                },
                CountyCsvUploadAdmissionDenialCode.InvalidDocumentEvidence),
            (
                valid with
                {
                    IntakeReceipt = receipt with
                    {
                        IntakeReceipt = intakeReceipt with
                        {
                            Document = intakeReceipt.Document with
                            {
                                Rows = Array.AsReadOnly<IReadOnlyList<string>>(
                                    new[]
                                    {
                                        Array.AsReadOnly(new[] { "1", "Ada" }),
                                        Array.AsReadOnly(new[] { "2", "Grace" }),
                                        Array.AsReadOnly(new[] { "3", "Katherine" }),
                                    }),
                            },
                        },
                    },
                },
                CountyCsvUploadAdmissionDenialCode.InvalidDocumentEvidence),
            (
                valid with
                {
                    IntakeReceipt = receipt with
                    {
                        IntakeReceipt = intakeReceipt with
                        {
                            Document = intakeReceipt.Document with
                            {
                                Headers = Array.AsReadOnly(new[] { "parcel_id\uFEFF", "owner" }),
                            },
                        },
                    },
                },
                CountyCsvUploadAdmissionDenialCode.InvalidDocumentEvidence),
            (
                valid with
                {
                    Identity = valid.Identity! with
                    {
                        IdempotencyKey = new string('0', 64),
                    },
                },
                CountyCsvUploadAdmissionDenialCode.IdempotencyKeyMismatch),
        };

        await using var context = database.CreateContext();
        var ledger = new CountyCsvUploadAdmissionLedger(database.CreateFactory());
        foreach (var (request, expectedDenial) in cases)
        {
            var result = await ledger.AdmitAsync(request);
            Assert.Equal(CountyCsvUploadAdmissionDisposition.Denied, result.Disposition);
            Assert.Equal(expectedDenial, result.DenialCode);
            Assert.Null(result.Batch);
        }

        Assert.Equal(0, await context.CountyCsvUploadBatches.CountAsync());
        Assert.Equal(0, await context.AuditLogs.CountAsync());
    }

    [Fact]
    public async Task AdmitAsync_PreCancellationLeavesNoBatchOrAuditRow()
    {
        await using var database = await TestDatabase.CreateAsync((Benton, BentonId));
        var request = await CreateRequestAsync(Benton, BentonId, "assessor-1");
        await using var context = database.CreateContext();
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => new CountyCsvUploadAdmissionLedger(database.CreateFactory())
                .AdmitAsync(request, cancellation.Token));

        Assert.Equal(0, await context.CountyCsvUploadBatches.CountAsync());
        Assert.Equal(0, await context.AuditLogs.CountAsync());
    }

    [Fact]
    public async Task AdmitAsync_AuditSaveFailureRollsBackTheDedicatedBatchTransaction()
    {
        await using var database = await TestDatabase.CreateAsync((Benton, BentonId));
        var request = await CreateRequestAsync(Benton, BentonId, "assessor-1");
        var factory = database.CreateFactory(new FailSecondSaveInterceptor());

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => new CountyCsvUploadAdmissionLedger(factory).AdmitAsync(request));

        Assert.Equal("synthetic audit persistence failure", exception.Message);

        await using var verificationContext = database.CreateContext();
        Assert.Equal(0, await verificationContext.CountyCsvUploadBatches.CountAsync());
        Assert.Equal(0, await verificationContext.AuditLogs.CountAsync());
    }

    [Fact]
    public async Task AdmitAsync_SuccessDoesNotCommitUnrelatedCallerTrackedState()
    {
        await using var database = await TestDatabase.CreateAsync((Benton, BentonId));
        var request = await CreateRequestAsync(Benton, BentonId, "assessor-1");
        await using var callerContext = database.CreateContext();
        var modifiedCounty = await callerContext.Counties.SingleAsync(county => county.Id == BentonId);
        var originalCountyName = modifiedCounty.Name;
        modifiedCounty.Name = "Pending Benton name";
        var unrelatedCountyId = Guid.Parse("00000000-0000-0000-0000-000000000099");
        var unrelatedCounty = new TerraFusion.Core.Entities.County
        {
            Id = unrelatedCountyId,
            Name = "Unrelated pending county",
            State = "WA",
            FipsCode = "99999",
        };
        callerContext.Counties.Add(unrelatedCounty);

        var result = await new CountyCsvUploadAdmissionLedger(database.CreateFactory())
            .AdmitAsync(request);

        Assert.Equal(CountyCsvUploadAdmissionDisposition.FirstSeen, result.Disposition);
        Assert.Equal(EntityState.Added, callerContext.Entry(unrelatedCounty).State);
        Assert.Equal(EntityState.Modified, callerContext.Entry(modifiedCounty).State);
        Assert.Equal("Pending Benton name", modifiedCounty.Name);
        Assert.Equal(
            originalCountyName,
            callerContext.Entry(modifiedCounty).Property(county => county.Name).OriginalValue);
        Assert.True(callerContext.Entry(modifiedCounty).Property(county => county.Name).IsModified);

        await using var verificationContext = database.CreateContext();
        Assert.Equal(1, await verificationContext.CountyCsvUploadBatches.CountAsync());
        Assert.Equal(1, await verificationContext.AuditLogs.CountAsync());
        Assert.Equal(originalCountyName, await verificationContext.Counties
            .Where(county => county.Id == BentonId)
            .Select(county => county.Name)
            .SingleAsync());
        Assert.Equal(
            0,
            await verificationContext.Counties.CountAsync(
                county => county.Id == unrelatedCountyId));
    }

    [Fact]
    public async Task AdmitAsync_SnapshotsAliasableContentOnceBeforeHashAndReparse()
    {
        await using var database = await TestDatabase.CreateAsync((Benton, BentonId));
        var request = await CreateRequestAsync(Benton, BentonId, "assessor-1");
        var carriageReturnEquivalent = Encoding.UTF8.GetBytes(
            "parcel_id,owner\r1,Ada\r2,Grace\r");
        using var content = new AlternatingMemoryManager(
            request.AdmittedContent.ToArray(),
            carriageReturnEquivalent);
        var aliasableRequest = request with { AdmittedContent = content.Memory };

        var result = await new CountyCsvUploadAdmissionLedger(database.CreateFactory())
            .AdmitAsync(aliasableRequest);

        Assert.Equal(CountyCsvUploadAdmissionDisposition.FirstSeen, result.Disposition);
        Assert.Equal(2, content.GetSpanCalls);
    }

    [Fact]
    public async Task AdmitAsync_DeniesDocumentRowsMutatedWhileAdmittedContentIsSnapshotted()
    {
        await using var database = await TestDatabase.CreateAsync((Benton, BentonId));
        var request = await CreateRequestAsync(Benton, BentonId, "assessor-1");
        var originalDocument = request.IntakeReceipt!.IntakeReceipt.Document;
        var mutableRows = new List<IReadOnlyList<string>>
        {
            originalDocument.Rows[0],
        };
        var claimedDocument = originalDocument with { Rows = mutableRows };
        var claimedReceipt = request.IntakeReceipt with
        {
            IntakeReceipt = request.IntakeReceipt.IntakeReceipt with
            {
                Document = claimedDocument,
            },
        };
        using var content = new CallbackMemoryManager(
            request.AdmittedContent.ToArray(),
            () => mutableRows.Add(originalDocument.Rows[1]));
        var mutableRequest = request with
        {
            IntakeReceipt = claimedReceipt,
            AdmittedContent = content.Memory,
        };

        var result = await new CountyCsvUploadAdmissionLedger(database.CreateFactory())
            .AdmitAsync(mutableRequest);

        Assert.Equal(CountyCsvUploadAdmissionDisposition.Denied, result.Disposition);
        Assert.Equal(
            CountyCsvUploadAdmissionDenialCode.InvalidDocumentEvidence,
            result.DenialCode);
        Assert.Null(result.Batch);
        Assert.Equal(2, content.GetSpanCalls);

        await using var verificationContext = database.CreateContext();
        Assert.Equal(0, await verificationContext.CountyCsvUploadBatches.CountAsync());
        Assert.Equal(0, await verificationContext.AuditLogs.CountAsync());
    }

    [Fact]
    public async Task AdmitAsync_DeniesOversizedDocumentCollectionCountsBeforeCopying()
    {
        await using var database = await TestDatabase.CreateAsync((Benton, BentonId));
        var request = await CreateRequestAsync(Benton, BentonId, "assessor-1");
        var originalDocument = request.IntakeReceipt!.IntakeReceipt.Document;
        var hostileDocuments = new[]
        {
            originalDocument with
            {
                Headers = new OversizedCountReadOnlyList<string>(),
            },
            originalDocument with
            {
                Rows = new OversizedCountReadOnlyList<IReadOnlyList<string>>(),
            },
            originalDocument with
            {
                Rows = Array.AsReadOnly<IReadOnlyList<string>>(
                    new IReadOnlyList<string>[]
                    {
                        new OversizedCountReadOnlyList<string>(),
                        originalDocument.Rows[1],
                    }),
            },
        };
        var ledger = new CountyCsvUploadAdmissionLedger(database.CreateFactory());

        foreach (var hostileDocument in hostileDocuments)
        {
            var hostileRequest = request with
            {
                IntakeReceipt = request.IntakeReceipt with
                {
                    IntakeReceipt = request.IntakeReceipt.IntakeReceipt with
                    {
                        Document = hostileDocument,
                    },
                },
            };

            var result = await ledger.AdmitAsync(hostileRequest);

            Assert.Equal(CountyCsvUploadAdmissionDisposition.Denied, result.Disposition);
            Assert.Equal(
                CountyCsvUploadAdmissionDenialCode.InvalidDocumentEvidence,
                result.DenialCode);
            Assert.Null(result.Batch);
        }

        await using var verificationContext = database.CreateContext();
        Assert.Equal(0, await verificationContext.CountyCsvUploadBatches.CountAsync());
        Assert.Equal(0, await verificationContext.AuditLogs.CountAsync());
    }

    [Fact]
    public async Task AdmitAsync_DeniesAggregateHostileDocumentShapeWithoutMaterializingRows()
    {
        await using var database = await TestDatabase.CreateAsync((Benton, BentonId));
        var request = await CreateRequestAsync(Benton, BentonId, "assessor-1");
        var originalDocument = request.IntakeReceipt!.IntakeReceipt.Document;
        var repeatedFieldRow = new RepeatedReadOnlyList<string>(512, "field");
        var aggregateRows = new RepeatedReadOnlyList<IReadOnlyList<string>>(
            100_000,
            repeatedFieldRow);
        var hostileDocument = originalDocument with { Rows = aggregateRows };
        var hostileRequest = request with
        {
            IntakeReceipt = request.IntakeReceipt with
            {
                IntakeReceipt = request.IntakeReceipt.IntakeReceipt with
                {
                    Document = hostileDocument,
                },
            },
        };

        var result = await new CountyCsvUploadAdmissionLedger(database.CreateFactory())
            .AdmitAsync(hostileRequest);

        Assert.Equal(CountyCsvUploadAdmissionDisposition.Denied, result.Disposition);
        Assert.Equal(
            CountyCsvUploadAdmissionDenialCode.InvalidDocumentEvidence,
            result.DenialCode);
        Assert.Null(result.Batch);
        Assert.Equal(0, aggregateRows.IndexAccesses);
        Assert.Equal(0, repeatedFieldRow.IndexAccesses);

        await using var verificationContext = database.CreateContext();
        Assert.Equal(0, await verificationContext.CountyCsvUploadBatches.CountAsync());
        Assert.Equal(0, await verificationContext.AuditLogs.CountAsync());
    }

    [Fact]
    public async Task AdmitAsync_DeniesArbitraryClaimedCollectionAccessFailures()
    {
        await using var database = await TestDatabase.CreateAsync((Benton, BentonId));
        var request = await CreateRequestAsync(Benton, BentonId, "assessor-1");
        var originalDocument = request.IntakeReceipt!.IntakeReceipt.Document;
        var hostileDocuments = new[]
        {
            originalDocument with
            {
                Headers = new ThrowingReadOnlyList<string>(
                    originalDocument.Headers.Count,
                    throwOnCount: true),
            },
            originalDocument with
            {
                Headers = new ThrowingReadOnlyList<string>(
                    originalDocument.Headers.Count,
                    throwOnCount: false),
            },
        };
        var ledger = new CountyCsvUploadAdmissionLedger(database.CreateFactory());

        foreach (var hostileDocument in hostileDocuments)
        {
            var hostileRequest = request with
            {
                IntakeReceipt = request.IntakeReceipt with
                {
                    IntakeReceipt = request.IntakeReceipt.IntakeReceipt with
                    {
                        Document = hostileDocument,
                    },
                },
            };

            var result = await ledger.AdmitAsync(hostileRequest);

            Assert.Equal(CountyCsvUploadAdmissionDisposition.Denied, result.Disposition);
            Assert.Equal(
                CountyCsvUploadAdmissionDenialCode.InvalidDocumentEvidence,
                result.DenialCode);
            Assert.Null(result.Batch);
        }

        await using var verificationContext = database.CreateContext();
        Assert.Equal(0, await verificationContext.CountyCsvUploadBatches.CountAsync());
        Assert.Equal(0, await verificationContext.AuditLogs.CountAsync());
    }

    [Fact]
    public async Task AdmissionHasNoSyncOrPacsWriteSeam()
    {
        await using var database = await TestDatabase.CreateAsync((Benton, BentonId));
        var request = await CreateRequestAsync(Benton, BentonId, "assessor-1");
        await using var context = database.CreateContext();

        var result = await new CountyCsvUploadAdmissionLedger(database.CreateFactory())
            .AdmitAsync(request);

        Assert.Equal(CountyCsvUploadAdmissionDisposition.FirstSeen, result.Disposition);
        Assert.DoesNotContain(
            context.ChangeTracker.Entries(),
            entry => entry.Entity.GetType().Namespace is { } entityNamespace
                && (entityNamespace.Contains(".Sync", StringComparison.Ordinal)
                    || entityNamespace.Contains(".Pacs", StringComparison.Ordinal)));
        Assert.Equal(
            new[] { typeof(IDbContextFactory<TerraFusionDbContext>), typeof(TimeProvider) },
            typeof(CountyCsvUploadAdmissionLedger)
                .GetFields(BindingFlags.Instance | BindingFlags.NonPublic)
                .Select(field => field.FieldType)
                .OrderBy(type => type.FullName));
    }

    [Fact]
    public async Task ExactMigrationCreatesIndexesAndCompletelyRollsBackOnDisposableSqlite()
    {
        await using var temporary = new TemporaryDatabaseFile();
        await using var context = temporary.CreateContext();
        await context.Database.OpenConnectionAsync();
        var previousMigration = await PrepareMigrationBaselineAsync(context);

        var migrator = context.GetService<IMigrator>();
        await migrator.MigrateAsync(MigrationId);

        Assert.True(await ObjectExistsAsync(context, "table", "CountyCsvUploadBatches"));
        Assert.True(await ObjectExistsAsync(
            context,
            "index",
            "IX_CountyCsvUploadBatches_IdempotencyKey"));
        Assert.True(await ObjectExistsAsync(
            context,
            "index",
            "IX_CountyCsvUploadBatches_CountyId_Dataset_ReceivedAtUtc"));

        await migrator.MigrateAsync(previousMigration);

        Assert.False(await ObjectExistsAsync(context, "table", "CountyCsvUploadBatches"));
        Assert.False(await ObjectExistsAsync(
            context,
            "index",
            "IX_CountyCsvUploadBatches_IdempotencyKey"));
    }

    [Fact]
    public async Task ModelSnapshotMatchesTheRuntimeBoundedLedgerShape()
    {
        await using var temporary = new TemporaryDatabaseFile();
        await using var context = temporary.CreateContext();
        var snapshot = new TerraFusionDbContextModelSnapshot();
        var entity = snapshot.Model.FindEntityType(typeof(CountyCsvUploadBatch));
        var runtimeEntity = context.Model.FindEntityType(typeof(CountyCsvUploadBatch));

        Assert.NotNull(entity);
        Assert.NotNull(runtimeEntity);
        Assert.Equal("CountyCsvUploadBatches", entity.GetTableName());
        Assert.Equal(
            runtimeEntity.GetProperties().Select(PropertyShape),
            entity.GetProperties().Select(PropertyShape));
        Assert.Equal(nameof(CountyCsvUploadBatch.BatchId), entity.FindPrimaryKey()!.Properties.Single().Name);
        Assert.Contains(
            entity.GetIndexes(),
            index => index.IsUnique
                && index.Properties.Select(property => property.Name)
                    .SequenceEqual(new[] { nameof(CountyCsvUploadBatch.IdempotencyKey) }));
        var foreignKey = Assert.Single(entity.GetForeignKeys());
        Assert.Equal(nameof(CountyCsvUploadBatch.CountyId), foreignKey.Properties.Single().Name);
        Assert.Equal(DeleteBehavior.Restrict, foreignKey.DeleteBehavior);
    }

    private static string PropertyShape(Microsoft.EntityFrameworkCore.Metadata.IProperty property) =>
        string.Join(
            '|',
            property.Name,
            property.ClrType.FullName,
            property.IsNullable,
            property.GetMaxLength(),
            property.IsFixedLength());

    private static async Task<CountyCsvUploadAdmissionRequest> CreateRequestAsync(
        WashingtonCountyIdentity county,
        Guid countyId,
        string actorId,
        CountyCsvDataset dataset = CountyCsvDataset.Parcels,
        string? csv = null)
    {
        var context = await CreateCountyContextAsync(county, countyId, actorId);
        var bytes = Encoding.UTF8.GetBytes(
            csv
            ?? ("parcel_id,situs_address,assessed_value,sale_date,sale_price,owner\n"
                + "1,100 Main St,250000,2026-01-15,240000,Ada\n"
                + "2,200 Main St,300000,2026-02-16,310000,Grace\n"));
        var intake = new CountyCsvCountyBoundIntake(
            new CountyCsvParserOptions
            {
                Delimiter = ',',
                MaxInputBytes = 4096,
                MaxDataRows = 100,
                MaxFieldsPerRow = 20,
                MaxCharactersPerField = 256,
            });
        var receipt = await intake.AdmitAsync(
            new CountyCsvCountyBoundIntakeRequest(
                county,
                county,
                dataset,
                new CountyCsvIntakeDeclaration
                {
                    FileName = "parcels.csv",
                    Format = "csv",
                    MediaType = "text/csv",
                },
                bytes));

        return new CountyCsvUploadAdmissionRequest(
            ICountyCsvUploadAdmissionLedger.AuthenticatedCsvApiAdmissionContractId,
            context,
            receipt,
            bytes,
            CountyCsvIntakeIdempotency.Create(receipt));
    }

    private static async Task<AuthenticatedCanonicalCountyContextResult> CreateCountyContextAsync(
        WashingtonCountyIdentity county,
        Guid countyId,
        string actorId)
    {
        var resolver = new StaticCountyResolver(county, countyId);
        var binding = await new AuthenticatedCountyAuthorityBinding(
                new StaticContextAccessor(
                    new RequestUserContext(
                        IsAuthenticated: true,
                        UserId: actorId,
                        CountyId: county.Key,
                        Roles: Array.Empty<string>())),
                resolver)
            .BindCurrentAsync();

        var context = await new AuthenticatedCanonicalCountyContext(resolver)
            .EstablishAsync(binding);
        Assert.Equal(AuthenticatedCanonicalCountyContextDecision.Established, context.Decision);
        return context;
    }

    private static async Task<bool> ObjectExistsAsync(
        DbContext context,
        string type,
        string name)
    {
        var connection = context.Database.GetDbConnection();
        await using var command = connection.CreateCommand();
        command.CommandText =
            "SELECT COUNT(*) FROM sqlite_master WHERE type = $type AND name = $name";
        var typeParameter = command.CreateParameter();
        typeParameter.ParameterName = "$type";
        typeParameter.Value = type;
        command.Parameters.Add(typeParameter);
        var nameParameter = command.CreateParameter();
        nameParameter.ParameterName = "$name";
        nameParameter.Value = name;
        command.Parameters.Add(nameParameter);
        return Convert.ToInt32(await command.ExecuteScalarAsync()) == 1;
    }

    private static async Task<string> PrepareMigrationBaselineAsync(
        TerraFusionDbContext context)
    {
        await context.Database.ExecuteSqlRawAsync(
            "CREATE TABLE \"Counties\" (\"Id\" TEXT NOT NULL CONSTRAINT \"PK_Counties\" PRIMARY KEY, \"Name\" TEXT NOT NULL, \"State\" TEXT NOT NULL, \"FipsCode\" TEXT NOT NULL, \"Population\" INTEGER NOT NULL, \"Area\" REAL NOT NULL, \"CreatedAt\" TEXT NOT NULL, \"UpdatedAt\" TEXT NOT NULL)");
        await context.Database.ExecuteSqlRawAsync(
            "CREATE TABLE \"AuditLogs\" (\"Id\" TEXT NOT NULL CONSTRAINT \"PK_AuditLogs\" PRIMARY KEY, \"Type\" TEXT NOT NULL, \"Data\" TEXT NULL, \"Timestamp\" TEXT NOT NULL, \"UserId\" TEXT NULL, \"UserEmail\" TEXT NULL, \"IpAddress\" TEXT NULL, \"UserAgent\" TEXT NULL, \"RequestPath\" TEXT NULL, \"RequestMethod\" TEXT NULL, \"CorrelationId\" TEXT NULL, \"ResponseStatusCode\" INTEGER NULL, \"DurationMs\" INTEGER NULL, \"MachineName\" TEXT NULL, \"ProcessId\" INTEGER NULL, \"Severity\" TEXT NULL, \"Source\" TEXT NULL)");
        await context.Database.ExecuteSqlRawAsync(
            "CREATE TABLE \"__EFMigrationsHistory\" (\"MigrationId\" TEXT NOT NULL CONSTRAINT \"PK___EFMigrationsHistory\" PRIMARY KEY, \"ProductVersion\" TEXT NOT NULL)");

        var migrations = context.Database.GetMigrations().ToArray();
        Assert.Equal(MigrationId, migrations[^1]);
        foreach (var migration in migrations[..^1])
        {
            await context.Database.ExecuteSqlInterpolatedAsync(
                $"INSERT INTO \"__EFMigrationsHistory\" (\"MigrationId\", \"ProductVersion\") VALUES ({migration}, {"8.0.0"})");
        }

        return migrations[^2];
    }

    private static WashingtonCountyIdentity ResolveCounty(string value)
    {
        Assert.True(WashingtonCountyRegistry.TryResolve(value, out var county));
        return county;
    }

    private sealed class TestDatabase : IAsyncDisposable
    {
        private readonly TemporaryDatabaseFile _temporary;

        private TestDatabase(TemporaryDatabaseFile temporary)
        {
            _temporary = temporary;
        }

        public static async Task<TestDatabase> CreateAsync(
            params (WashingtonCountyIdentity County, Guid CountyId)[] counties)
        {
            var temporary = new TemporaryDatabaseFile();
            var database = new TestDatabase(temporary);
            await using var context = database.CreateContext();
            await context.Database.OpenConnectionAsync();
            await PrepareMigrationBaselineAsync(context);
            await context.GetService<IMigrator>().MigrateAsync(MigrationId);
            foreach (var (county, countyId) in counties)
            {
                await context.Database.ExecuteSqlInterpolatedAsync(
                    $"INSERT INTO \"Counties\" (\"Id\", \"Name\", \"State\", \"FipsCode\", \"Population\", \"Area\", \"CreatedAt\", \"UpdatedAt\") VALUES ({countyId}, {county.Name}, {county.State}, {county.FipsCode}, {0}, {0d}, {DateTime.UtcNow}, {DateTime.UtcNow})");
            }

            return database;
        }

        public TerraFusionDbContext CreateContext(IInterceptor? interceptor = null) =>
            _temporary.CreateContext(interceptor);

        public IDbContextFactory<TerraFusionDbContext> CreateFactory(
            IInterceptor? interceptor = null) =>
            new TestContextFactory(this, interceptor);

        public ValueTask DisposeAsync() => _temporary.DisposeAsync();
    }

    private sealed class TestContextFactory(
        TestDatabase database,
        IInterceptor? interceptor = null) : IDbContextFactory<TerraFusionDbContext>
    {
        public TerraFusionDbContext CreateDbContext() =>
            database.CreateContext(interceptor);

        public Task<TerraFusionDbContext> CreateDbContextAsync(
            CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            return Task.FromResult(CreateDbContext());
        }
    }

    private sealed class TemporaryDatabaseFile : IAsyncDisposable
    {
        private static readonly IConfiguration Configuration =
            new ConfigurationBuilder().Build();
        private readonly string _path = Path.Combine(
            Path.GetTempPath(),
            $"wal-002g-{Guid.NewGuid():N}.db");

        public TerraFusionDbContext CreateContext(IInterceptor? interceptor = null)
        {
            var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
                .UseSqlite(
                    $"Data Source={_path};Cache=Shared;Default Timeout=30;Pooling=False;Foreign Keys=True")
                .Options;
            if (interceptor is not null)
            {
                options = new DbContextOptionsBuilder<TerraFusionDbContext>(options)
                    .AddInterceptors(interceptor)
                    .Options;
            }

            return new TerraFusionDbContext(options, Configuration);
        }

        public ValueTask DisposeAsync()
        {
            foreach (var suffix in new[] { string.Empty, "-shm", "-wal" })
            {
                var candidate = _path + suffix;
                if (File.Exists(candidate))
                {
                    File.Delete(candidate);
                }
            }

            return ValueTask.CompletedTask;
        }
    }

    private sealed class FailSecondSaveInterceptor : SaveChangesInterceptor
    {
        private int _savingCalls;

        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
            DbContextEventData eventData,
            InterceptionResult<int> result,
            CancellationToken cancellationToken = default)
        {
            if (Interlocked.Increment(ref _savingCalls) == 2)
            {
                throw new InvalidOperationException("synthetic audit persistence failure");
            }

            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }
    }

    private sealed class AlternatingMemoryManager(
        byte[] original,
        byte[] parserEquivalentAlternative) : MemoryManager<byte>
    {
        private int _getSpanCalls;

        public int GetSpanCalls => Volatile.Read(ref _getSpanCalls);

        public override Span<byte> GetSpan() =>
            Interlocked.Increment(ref _getSpanCalls) <= 2
                ? original
                : parserEquivalentAlternative;

        public override MemoryHandle Pin(int elementIndex = 0) =>
            throw new NotSupportedException();

        public override void Unpin()
        {
        }

        protected override void Dispose(bool disposing)
        {
        }
    }

    private sealed class CallbackMemoryManager(
        byte[] content,
        Action onSecondGetSpan) : MemoryManager<byte>
    {
        private int _getSpanCalls;

        public int GetSpanCalls => Volatile.Read(ref _getSpanCalls);

        public override Span<byte> GetSpan()
        {
            if (Interlocked.Increment(ref _getSpanCalls) == 2)
            {
                onSecondGetSpan();
            }

            return content;
        }

        public override MemoryHandle Pin(int elementIndex = 0) =>
            throw new NotSupportedException();

        public override void Unpin()
        {
        }

        protected override void Dispose(bool disposing)
        {
        }
    }

    private sealed class OversizedCountReadOnlyList<T> : IReadOnlyList<T>
    {
        public int Count => int.MaxValue;

        public T this[int index] =>
            throw new InvalidOperationException("Oversized evidence must not be indexed.");

        public IEnumerator<T> GetEnumerator() =>
            throw new InvalidOperationException("Oversized evidence must not be enumerated.");

        System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator() =>
            GetEnumerator();
    }

    private sealed class RepeatedReadOnlyList<T>(int count, T value) : IReadOnlyList<T>
    {
        private int _indexAccesses;

        public int Count { get; } = count;

        public int IndexAccesses => Volatile.Read(ref _indexAccesses);

        public T this[int index]
        {
            get
            {
                Interlocked.Increment(ref _indexAccesses);
                return index >= 0 && index < Count
                    ? value
                    : throw new ArgumentOutOfRangeException(nameof(index));
            }
        }

        public IEnumerator<T> GetEnumerator() =>
            throw new InvalidOperationException("Aggregate evidence must not be enumerated.");

        System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator() =>
            GetEnumerator();
    }

    private sealed class ThrowingReadOnlyList<T>(int count, bool throwOnCount) : IReadOnlyList<T>
    {
        public int Count =>
            throwOnCount
                ? throw new TimeoutException("synthetic untrusted Count failure")
                : count;

        public T this[int index] =>
            throw new TimeoutException("synthetic untrusted indexer failure");

        public IEnumerator<T> GetEnumerator() =>
            throw new TimeoutException("synthetic untrusted enumeration failure");

        System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator() =>
            GetEnumerator();
    }

    private sealed class FixedTimeProvider(DateTimeOffset value) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => value;
    }

    private sealed class StaticContextAccessor(RequestUserContext current)
        : IRequestUserContextAccessor
    {
        public RequestUserContext Current { get; } = current;
    }

    private sealed class StaticCountyResolver(
        WashingtonCountyIdentity county,
        Guid countyId) : ICountyResolver
    {
        public Task<Guid> ResolveAsync(
            string countyIdOrCode,
            CancellationToken ct = default) =>
            Task.FromResult(
                string.Equals(countyIdOrCode, county.Key, StringComparison.Ordinal)
                    ? countyId
                    : throw new CountyNotFoundException(countyIdOrCode));

        public Task<Guid?> TryResolveAsync(
            string countyIdOrCode,
            CancellationToken ct = default) =>
            Task.FromResult<Guid?>(
                string.Equals(countyIdOrCode, county.Key, StringComparison.Ordinal)
                    ? countyId
                    : null);
    }
}
