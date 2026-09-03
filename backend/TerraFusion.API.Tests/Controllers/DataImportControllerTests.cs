using System.Reflection;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;
using TerraFusion.API.Auth;
using TerraFusion.API.Controllers;
using TerraFusion.API.Security;
using TerraFusion.Core.Auth;
using TerraFusion.Core.Counties;
using TerraFusion.Core.Entities.Import;
using TerraFusion.Core.Import;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Services;
using TerraFusion.Data;
using TerraFusion.Data.Extensions;
using Xunit;
using CountyEntity = TerraFusion.Core.Entities.County;

namespace TerraFusion.API.Tests.Controllers;

public sealed class DataImportControllerTests
{
    private const string ValidCsv = "parcel_id,owner\n1,Ada\n2,Grace\n";

    private static readonly IReadOnlyDictionary<string, Guid> CountyIds =
        WashingtonCountyRegistry.Counties
            .Select((county, index) => new { county.Key, Id = CountyId(index + 1) })
            .ToDictionary(item => item.Key, item => item.Id, StringComparer.Ordinal);

    [Fact]
    public async Task Upload_contract_requires_assessor_and_exposes_no_county_selector()
    {
        Assert.Null(typeof(DataImportController).GetCustomAttribute<AllowAnonymousAttribute>());

        var action = typeof(DataImportController).GetMethod(
            nameof(DataImportController.UploadFile));
        Assert.NotNull(action);
        var authorize = Assert.Single(action.GetCustomAttributes<AuthorizeAttribute>());
        Assert.Equal("RequireAssessor", authorize.Policy);
        Assert.Null(action.GetCustomAttribute<AllowAnonymousAttribute>());
        Assert.Equal(
            "multipart/form-data",
            Assert.Single(action.GetCustomAttribute<ConsumesAttribute>()!.ContentTypes));
        Assert.Equal(
            DataImportController.MaximumMultipartBodyBytes,
            ((Microsoft.AspNetCore.Http.Metadata.IRequestSizeLimitMetadata)
                action.GetCustomAttribute<RequestSizeLimitAttribute>()!).MaxRequestBodySize);
        Assert.Equal(
            DataImportController.MaximumMultipartBodyBytes,
            action.GetCustomAttribute<RequestFormLimitsAttribute>()!.MultipartBodyLengthLimit);
        Assert.Equal(
            new[] { typeof(IFormFile), typeof(string), typeof(CancellationToken) },
            action.GetParameters().Select(parameter => parameter.ParameterType));
        Assert.DoesNotContain(
            action.GetParameters(),
            parameter => parameter.Name!.Contains("county", StringComparison.OrdinalIgnoreCase));
        Assert.All(
            action.GetParameters().Take(2),
            parameter => Assert.NotNull(parameter.GetCustomAttribute<FromFormAttribute>()));
        Assert.Equal(
            "wal.county-upload.authenticated-row-staging-api.v1",
            DataImportController.UploadContractId);
        var historyAction = typeof(DataImportController).GetMethod(
            nameof(DataImportController.GetCountyUploadHistory));
        Assert.NotNull(historyAction);
        Assert.Equal(
            "RequireAssessor",
            Assert.Single(historyAction.GetCustomAttributes<AuthorizeAttribute>()).Policy);
        Assert.Null(historyAction.GetCustomAttribute<AllowAnonymousAttribute>());
        Assert.Equal(
            new[] { typeof(CancellationToken) },
            historyAction.GetParameters().Select(parameter => parameter.ParameterType));

        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["JwtSettings:SecretKey"] = new string('x', 64),
                })
            .Build();
        services.AddLogging();
        services.AddTerraFusionAuthentication(configuration);
        using var serviceProvider = services.BuildServiceProvider();
        var options = serviceProvider
            .GetRequiredService<IOptions<AuthorizationOptions>>()
            .Value;
        var policy = options.GetPolicy("RequireAssessor");

        Assert.NotNull(policy);
        var roleRequirement = Assert.Single(
            policy.Requirements.OfType<RolesAuthorizationRequirement>());
        Assert.Equal(
            new[] { "Admin", "Assessor", "SystemAdmin" },
            roleRequirement.AllowedRoles.OrderBy(role => role, StringComparer.Ordinal));
        Assert.False(await IsAuthorizedAsync(policy, Principal()));
        Assert.False(await IsAuthorizedAsync(policy, Principal("User")));
        Assert.True(await IsAuthorizedAsync(policy, Principal("Assessor")));
    }

    [Theory]
    [InlineData("Parcels")]
    [InlineData("Sales")]
    public async Task Upload_admits_authenticated_same_county_csv_with_real_receipt(
        string dataset)
    {
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var controller = BuildController(cache);
        controller.HttpContext.Request.Headers["X-County-Id"] = "wa-king";
        controller.RouteData.Values["countyId"] = "wa-king";
        var file = CsvFile(ValidCsv);
        SetMultipartForm(controller, file, dataset, includeCountyTampering: true);

        var result = await controller.UploadFile(file, dataset, default);

        var ok = Assert.IsType<OkObjectResult>(result);
        var receipt = Assert.IsType<CountyCsvApiAdmissionReceipt>(ok.Value);
        Assert.Equal(DataImportController.UploadContractId, receipt.ContractId);
        Assert.Equal(ICountyCsvUploadAdmissionLedger.ContractId, receipt.LedgerContractId);
        Assert.NotEqual(Guid.Empty, receipt.BatchId);
        Assert.Equal(CountyIds["wa-benton"], receipt.CountyId);
        Assert.Equal("wa-benton", receipt.CountyKey);
        Assert.Equal("Benton", receipt.CountyName);
        Assert.Equal(dataset, receipt.Dataset);
        Assert.Equal(Hash(ValidCsv), receipt.ContentSha256);
        Assert.Equal(Encoding.UTF8.GetByteCount(ValidCsv), receipt.ContentLength);
        Assert.Equal(2, receipt.AcceptedRowCount);
        Assert.Equal("FirstSeen", receipt.DuplicateDisposition);
        Assert.Equal(ICountyCsvUploadRowStager.ContractId, receipt.RowStagingContractId);
        Assert.Equal(CountyCsvUploadRowValidator.SchemaVersion, receipt.ValidationSchemaVersion);
        Assert.Equal(2, receipt.StagedRowCount);
        Assert.Equal(0, receipt.QuarantinedRowCount);
        Assert.Empty(receipt.QuarantineReasonCounts);
    }

    [Theory]
    [InlineData(
        "Sales",
        "parcel_id,sale_date,sale_price\n100,2026-01-15,350000\n101,bad-date,250000\n",
        "INVALID_SALE_DATE")]
    [InlineData(
        "Parcels",
        "parcel_id,situs_address,assessed_value\n100,123 Main St,450000\n101,,250000\n",
        "INVALID_SITUS_ADDRESS")]
    public async Task Upload_uses_production_store_to_persist_staged_and_quarantined_rows(
        string dataset,
        string csv,
        string expectedReason)
    {
        var databasePath = Path.Combine(
            Path.GetTempPath(),
            $"terrafusion-api-row-staging-{Guid.NewGuid():N}.db");
        try
        {
            var services = new ServiceCollection();
            services.AddSingleton<IConfiguration>(new ConfigurationBuilder().Build());
            services.AddDbContext<TerraFusionDbContext>(options =>
                options.UseSqlite($"Data Source={databasePath};Pooling=False"));
            services.AddCountyCsvUploadAdmission();
            await using var serviceProvider = services.BuildServiceProvider(
                new ServiceProviderOptions { ValidateOnBuild = true, ValidateScopes = true });

            await using (var initializationScope = serviceProvider.CreateAsyncScope())
            {
                var dbContext = initializationScope.ServiceProvider
                    .GetRequiredService<TerraFusionDbContext>();
                await dbContext.Database.EnsureCreatedAsync();
                dbContext.Counties.Add(new CountyEntity
                {
                    Id = CountyIds["wa-benton"],
                    Name = "Benton",
                    State = "WA",
                    FipsCode = "005",
                });
                await dbContext.SaveChangesAsync();
            }

            await using var requestScope = serviceProvider.CreateAsyncScope();
            var ledger = requestScope.ServiceProvider
                .GetRequiredService<ICountyCsvUploadAdmissionLedger>();
            var historyReader = requestScope.ServiceProvider
                .GetRequiredService<ICountyCsvUploadHistoryReader>();
            var rowStager = requestScope.ServiceProvider
                .GetRequiredService<ICountyCsvUploadRowStager>();
            var controller = BuildController(
                ledger,
                historyReader: historyReader,
                rowStager: rowStager);
            var file = CsvFile(csv, $"{dataset.ToLowerInvariant()}.csv");
            SetMultipartForm(controller, file, dataset);

            var receipt = Receipt(await controller.UploadFile(file, dataset, default));

            Assert.Equal(2, receipt.AcceptedRowCount);
            Assert.Equal(1, receipt.StagedRowCount);
            Assert.Equal(1, receipt.QuarantinedRowCount);
            var reason = Assert.Single(receipt.QuarantineReasonCounts);
            Assert.Equal(expectedReason, reason.ReasonCode);
            Assert.Equal(1, reason.Count);

            var factory = requestScope.ServiceProvider
                .GetRequiredService<IDbContextFactory<TerraFusionDbContext>>();
            await using var verificationContext = await factory.CreateDbContextAsync();
            var persisted = await verificationContext.CountyCsvUploadRowStages
                .AsNoTracking()
                .SingleAsync(stage => stage.BatchId == receipt.BatchId);
            Assert.Equal(receipt.CountyId, persisted.CountyId);
            Assert.Equal(1, persisted.StagedRowCount);
            Assert.Equal(1, persisted.QuarantinedRowCount);
            Assert.Contains(expectedReason, persisted.QuarantinedRowsJson, StringComparison.Ordinal);

            var historyResult = await controller.GetCountyUploadHistory(default);
            var history = Assert.IsType<CountyCsvUploadHistoryReceipt>(
                Assert.IsType<OkObjectResult>(historyResult).Value);
            var batch = Assert.Single(history.Batches);
            Assert.Equal(receipt.BatchId, batch.BatchId);
            Assert.Equal(1, batch.RowStaging!.StagedRowCount);
            Assert.Equal(1, batch.RowStaging.QuarantinedRowCount);
            Assert.Equal(expectedReason, Assert.Single(batch.RowStaging.ReasonCounts).ReasonCode);
        }
        finally
        {
            File.Delete(databasePath);
        }
    }

    [Fact]
    public async Task Upload_classifies_duplicate_across_controller_request_instances()
    {
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var firstController = BuildController(cache);
        var secondController = BuildController(cache);
        var firstFile = CsvFile(ValidCsv);
        var secondFile = CsvFile(ValidCsv);
        SetMultipartForm(firstController, firstFile, "Parcels");
        SetMultipartForm(secondController, secondFile, "Parcels");

        var first = Receipt(
            await firstController.UploadFile(firstFile, "Parcels", default));
        var second = Receipt(
            await secondController.UploadFile(secondFile, "Parcels", default));

        Assert.Equal("FirstSeen", first.DuplicateDisposition);
        Assert.Equal("Duplicate", second.DuplicateDisposition);
        Assert.Equal(first.BatchId, second.BatchId);
        Assert.Equal(first.ContentSha256, second.ContentSha256);
        Assert.Equal(first.CountyId, second.CountyId);
    }

    [Fact]
    public async Task History_returns_only_authenticated_county_admission_metadata()
    {
        var reader = new TrackingHistoryReader();
        var controller = BuildController(
            new TestAdmissionLedger(),
            authorityCounty: "wa-benton",
            historyReader: reader);

        var result = await controller.GetCountyUploadHistory(default);

        var ok = Assert.IsType<OkObjectResult>(result);
        var receipt = Assert.IsType<CountyCsvUploadHistoryReceipt>(ok.Value);
        Assert.Equal(CountyIds["wa-benton"], reader.RequestedCountyId);
        Assert.Equal(25, reader.RequestedLimit);
        Assert.Equal(CountyIds["wa-benton"], receipt.CountyId);
        Assert.Equal("wa-benton", receipt.CountyKey);
        Assert.Equal("Benton", receipt.CountyName);
        Assert.Equal("row-validation-staging-not-promoted", receipt.Availability);
        var batch = Assert.Single(receipt.Batches);
        Assert.Equal(CountyIds["wa-benton"], batch.CountyId);
        Assert.Equal("Sales", batch.Dataset);
        Assert.Equal("county-sales.csv", batch.SourceFileName);
        Assert.Equal(2, batch.AcceptedRowCount);
    }

    [Fact]
    public async Task History_fails_closed_before_query_when_authenticated_county_is_unresolved()
    {
        var reader = new TrackingHistoryReader();
        var controller = BuildController(
            new TestAdmissionLedger(),
            authorityCounty: "unknown-county",
            historyReader: reader);

        var result = await controller.GetCountyUploadHistory(default);

        Assert.IsType<ForbidResult>(result);
        Assert.Null(reader.RequestedCountyId);
    }

    [Fact]
    public async Task Upload_fails_closed_when_durable_ledger_denies()
    {
        var controller = BuildController(new DenyingAdmissionLedger());
        var file = CsvFile(ValidCsv);
        SetMultipartForm(controller, file, "Parcels");

        var result = await controller.UploadFile(file, "Parcels", default);

        AssertProblem(
            result,
            StatusCodes.Status409Conflict,
            "CSV_DURABLE_ADMISSION_DENIED");
    }

    [Fact]
    public async Task Upload_propagates_durable_ledger_cancellation()
    {
        var controller = BuildController(new CancelingAdmissionLedger());
        var file = CsvFile(ValidCsv);
        SetMultipartForm(controller, file, "Parcels");

        await Assert.ThrowsAsync<OperationCanceledException>(
            () => controller.UploadFile(file, "Parcels", default));
    }

    [Fact]
    public async Task Controller_uses_one_injected_durable_ledger_during_concurrent_activation()
    {
        var ledger = new TestAdmissionLedger();
        using var start = new ManualResetEventSlim();
        var activations = Enumerable.Range(0, 8)
            .Select(_ => Task.Run(
                () =>
                {
                    start.Wait();
                    return BuildController(ledger);
                }))
            .ToArray();

        start.Set();
        var controllers = await Task.WhenAll(activations);
        var field = typeof(DataImportController).GetField(
            "_admissionLedger",
            BindingFlags.Instance | BindingFlags.NonPublic);
        Assert.NotNull(field);
        var decisions = controllers
            .Select(controller => field.GetValue(controller))
            .ToArray();

        Assert.NotNull(decisions[0]);
        Assert.All(decisions.Skip(1), decision => Assert.Same(decisions[0], decision));
    }

    [Theory]
    [InlineData(true, false)]
    [InlineData(false, true)]
    public async Task Upload_requires_exactly_one_file_and_one_dataset_form_value(
        bool includeExtraFile,
        bool includeExtraDataset)
    {
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var controller = BuildController(cache);
        var file = CsvFile(ValidCsv);
        SetMultipartForm(
            controller,
            file,
            "Parcels",
            includeExtraFile: includeExtraFile,
            includeExtraDataset: includeExtraDataset);

        var result = await controller.UploadFile(file, "Parcels", default);

        AssertProblem(
            result,
            StatusCodes.Status400BadRequest,
            "CSV_MULTIPART_SHAPE_INVALID");
    }

    [Fact]
    public async Task Upload_refuses_malformed_multipart_body_without_success_receipt()
    {
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var controller = BuildController(cache);
        controller.HttpContext.Request.ContentType = "multipart/form-data; boundary=";
        controller.HttpContext.Request.Body = new MemoryStream(
            Encoding.UTF8.GetBytes("not-a-valid-multipart-body"),
            writable: false);

        var result = await controller.UploadFile(
            CsvFile(ValidCsv),
            "Parcels",
            default);

        AssertProblem(
            result,
            StatusCodes.Status400BadRequest,
            "CSV_MULTIPART_SHAPE_INVALID");
    }

    [Fact]
    public async Task Upload_refuses_missing_and_empty_files_without_success_receipt()
    {
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var controller = BuildController(cache);

        AssertProblem(
            await controller.UploadFile(null, "Parcels", default),
            StatusCodes.Status400BadRequest,
            "CSV_FILE_REQUIRED");
        AssertProblem(
            await controller.UploadFile(CsvFile(string.Empty), "Parcels", default),
            StatusCodes.Status400BadRequest,
            "CSV_FILE_REQUIRED");
    }

    [Theory]
    [InlineData("payload.txt", "text/csv", ValidCsv, "Parcels", "CSV_ADMISSION_DENIED")]
    [InlineData("payload.csv", "application/octet-stream", ValidCsv, "Parcels", "CSV_ADMISSION_DENIED")]
    [InlineData("payload.csv", "text/csv", "parcel_id,owner\n1,\"unterminated", "Parcels", "CSV_ADMISSION_DENIED")]
    [InlineData("payload.csv", "text/csv", ValidCsv, "parcels", "CSV_DATASET_UNSUPPORTED")]
    [InlineData("payload.csv", "text/csv", ValidCsv, null, "CSV_DATASET_UNSUPPORTED")]
    public async Task Upload_refuses_non_csv_malformed_and_unsupported_dataset_requests(
        string fileName,
        string contentType,
        string content,
        string? dataset,
        string expectedCode)
    {
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var controller = BuildController(cache);

        var result = await controller.UploadFile(
            CsvFile(content, fileName, contentType),
            dataset,
            default);

        AssertProblem(result, StatusCodes.Status400BadRequest, expectedCode);
    }

    [Fact]
    public async Task Upload_refuses_oversized_multipart_declaration_before_reading_content()
    {
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var controller = BuildController(cache);
        var stream = new TrackingReadStream(Array.Empty<byte>());
        var file = FormFile(
            stream,
            DataImportController.MaximumUploadBytes + 1,
            "oversized.csv",
            "text/csv");

        var result = await controller.UploadFile(file, "Parcels", default);

        AssertProblem(
            result,
            StatusCodes.Status413PayloadTooLarge,
            "CSV_UPLOAD_TOO_LARGE");
        Assert.Equal(0, stream.ReadCount);
    }

    [Fact]
    public async Task Upload_refuses_unresolved_request_county_before_reading_file()
    {
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var controller = BuildController(cache, authorityCounty: "unknown-county");
        var stream = new TrackingReadStream(Encoding.UTF8.GetBytes(ValidCsv));
        var file = FormFile(stream, stream.Length, "payload.csv", "text/csv");

        var result = await controller.UploadFile(file, "Parcels", default);

        Assert.IsType<ForbidResult>(result);
        Assert.Equal(0, stream.ReadCount);
    }

    [Fact]
    public async Task Upload_propagates_cancellation_before_reading_file()
    {
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var controller = BuildController(cache);
        var stream = new TrackingReadStream(Encoding.UTF8.GetBytes(ValidCsv));
        var file = FormFile(stream, stream.Length, "payload.csv", "text/csv");
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => controller.UploadFile(file, "Parcels", cancellation.Token));

        Assert.Equal(0, stream.ReadCount);
    }

    [Fact]
    public async Task Upload_refuses_stream_length_disagreement()
    {
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var controller = BuildController(cache);
        var bytes = Encoding.UTF8.GetBytes(ValidCsv);
        var file = FormFile(
            new MemoryStream(bytes, writable: false),
            bytes.Length + 1,
            "payload.csv",
            "text/csv");

        var result = await controller.UploadFile(file, "Parcels", default);

        AssertProblem(
            result,
            StatusCodes.Status400BadRequest,
            "CSV_ADMISSION_DENIED");
    }

    [Fact]
    public void Controller_has_only_county_context_and_durable_admission_dependencies()
    {
        var constructor = Assert.Single(typeof(DataImportController).GetConstructors());
        Assert.Equal(
            new[]
            {
                typeof(ILogger<DataImportController>),
                typeof(AuthenticatedCanonicalCountyContextProvider),
                typeof(ICountyCsvUploadAdmissionLedger),
                typeof(ICountyCsvUploadHistoryReader),
                typeof(ICountyCsvUploadRowStager),
            },
            constructor.GetParameters().Select(parameter => parameter.ParameterType));
        Assert.DoesNotContain(
            typeof(DataImportController).GetFields(
                BindingFlags.Instance | BindingFlags.NonPublic),
            field =>
                field.FieldType.FullName?.Contains("DbContext", StringComparison.Ordinal) == true
                || field.FieldType == typeof(HttpClient));
    }

    private static DataImportController BuildController(
        IMemoryCache cache,
        string authorityCounty = "wa-benton")
    {
        var admissionLedger = cache.GetOrCreate(
            "test-county-csv-admission-ledger",
            _ => new TestAdmissionLedger())!;
        return BuildController(admissionLedger, authorityCounty);
    }

    private static DataImportController BuildController(
        ICountyCsvUploadAdmissionLedger admissionLedger,
        string authorityCounty = "wa-benton",
        ICountyCsvUploadHistoryReader? historyReader = null,
        ICountyCsvUploadRowStager? rowStager = null)
    {
        var accessor = new StaticContextAccessor(
            new RequestUserContext(
                true,
                "assessor-operator",
                authorityCounty,
                new[] { "Assessor" }));
        var resolver = new RegistryResolver();
        var provider = new AuthenticatedCanonicalCountyContextProvider(
            new AuthenticatedCountyAuthorityBinding(accessor, resolver),
            new AuthenticatedCanonicalCountyContext(resolver));
        var controller = new DataImportController(
            NullLogger<DataImportController>.Instance,
            provider,
            admissionLedger,
            historyReader ?? admissionLedger as ICountyCsvUploadHistoryReader
                ?? new EmptyHistoryReader(),
            rowStager ?? new TestRowStager())
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext(),
                RouteData = new RouteData(),
            },
        };
        return controller;
    }

    private static IFormFile CsvFile(
        string content,
        string fileName = "payload.csv",
        string contentType = "text/csv")
    {
        var bytes = Encoding.UTF8.GetBytes(content);
        return FormFile(
            new MemoryStream(bytes, writable: false),
            bytes.Length,
            fileName,
            contentType);
    }

    private static IFormFile FormFile(
        Stream stream,
        long length,
        string fileName,
        string contentType) =>
        new Microsoft.AspNetCore.Http.FormFile(stream, 0, length, "file", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType,
        };

    private static void SetMultipartForm(
        DataImportController controller,
        IFormFile file,
        string dataset,
        bool includeCountyTampering = false,
        bool includeExtraFile = false,
        bool includeExtraDataset = false)
    {
        var datasets = includeExtraDataset
            ? new StringValues(new[] { dataset, "Sales" })
            : new StringValues(dataset);
        var values = new Dictionary<string, StringValues>
        {
            ["dataset"] = datasets,
        };
        if (includeCountyTampering)
        {
            values["countyId"] = new StringValues("wa-king");
        }

        var files = new FormFileCollection { file };
        if (includeExtraFile)
        {
            files.Add(CsvFile("parcel_id,owner\n3,Katherine\n", "extra.csv"));
        }

        controller.HttpContext.Request.ContentType =
            "multipart/form-data; boundary=wal-test-boundary";
        controller.HttpContext.Request.Form = new FormCollection(values, files);
    }

    private static CountyCsvApiAdmissionReceipt Receipt(IActionResult result) =>
        Assert.IsType<CountyCsvApiAdmissionReceipt>(
            Assert.IsType<OkObjectResult>(result).Value);

    private static void AssertProblem(
        IActionResult result,
        int statusCode,
        string code)
    {
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(statusCode, objectResult.StatusCode);
        var problem = Assert.IsType<ProblemDetails>(objectResult.Value);
        Assert.Equal(statusCode, problem.Status);
        Assert.Equal(code, problem.Extensions["code"]);
        Assert.IsNotType<CountyCsvApiAdmissionReceipt>(objectResult.Value);
    }

    private static string Hash(string content) =>
        Convert
            .ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(content)))
            .ToLowerInvariant();

    private static ClaimsPrincipal Principal(params string[] roles)
    {
        if (roles.Length == 0)
        {
            return new ClaimsPrincipal(new ClaimsIdentity());
        }

        var identity = new ClaimsIdentity(
            roles.Select(role => new Claim(ClaimTypes.Role, role)),
            authenticationType: "test",
            nameType: ClaimTypes.Name,
            roleType: ClaimTypes.Role);
        return new ClaimsPrincipal(identity);
    }

    private static async Task<bool> IsAuthorizedAsync(
        AuthorizationPolicy policy,
        ClaimsPrincipal principal)
    {
        var context = new AuthorizationHandlerContext(
            policy.Requirements,
            principal,
            resource: null);
        foreach (var handler in policy.Requirements.OfType<IAuthorizationHandler>())
        {
            await handler.HandleAsync(context);
        }
        return context.HasSucceeded;
    }

    private static Guid CountyId(int index) =>
        Guid.Parse($"00000000-0000-0000-0000-{index:D12}");

    private sealed class StaticContextAccessor(RequestUserContext current)
        : IRequestUserContextAccessor
    {
        public RequestUserContext Current { get; } = current;
    }

    private sealed class RegistryResolver : ICountyResolver
    {
        public Task<Guid> ResolveAsync(
            string countyIdOrCode,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(
                CountyIds.TryGetValue(countyIdOrCode, out var countyId)
                    ? countyId
                    : throw new CountyNotFoundException(countyIdOrCode));

        public Task<Guid?> TryResolveAsync(
            string countyIdOrCode,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<Guid?>(
                CountyIds.TryGetValue(countyIdOrCode, out var countyId)
                    ? countyId
                    : null);
    }

    private sealed class TrackingReadStream(byte[] bytes)
        : MemoryStream(bytes, writable: false)
    {
        public int ReadCount { get; private set; }

        public override ValueTask<int> ReadAsync(
            Memory<byte> buffer,
            CancellationToken cancellationToken = default)
        {
            ReadCount++;
            return base.ReadAsync(buffer, cancellationToken);
        }
    }

    private sealed class TestAdmissionLedger :
        ICountyCsvUploadAdmissionLedger,
        ICountyCsvUploadHistoryReader
    {
        private readonly object _gate = new();
        private readonly Dictionary<string, CountyCsvUploadBatch> _batches =
            new(StringComparer.Ordinal);

        public Task<CountyCsvUploadAdmissionResult> AdmitAsync(
            CountyCsvUploadAdmissionRequest? request,
            CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            Assert.NotNull(request);
            Assert.NotNull(request.CountyContext);
            Assert.NotNull(request.IntakeReceipt);
            Assert.NotNull(request.Identity);

            var context = request.CountyContext;
            var receipt = request.IntakeReceipt.IntakeReceipt;
            var identity = request.Identity;
            lock (_gate)
            {
                var disposition = CountyCsvUploadAdmissionDisposition.Duplicate;
                if (!_batches.TryGetValue(identity.IdempotencyKey, out var batch))
                {
                    batch = new CountyCsvUploadBatch(
                        Guid.NewGuid(),
                        context.CountyId!.Value,
                        context.ActorId!,
                        request.IntakeReceipt.Binding.Dataset,
                        receipt.FileName,
                        receipt.Format,
                        receipt.MediaType,
                        receipt.Content.Sha256,
                        receipt.Content.ByteLength,
                        receipt.Document.Rows.Count,
                        identity.IdempotencyKey,
                        request.ApiAdmissionContractId,
                        AuthenticatedCanonicalCountyContext.ContractId,
                        request.IntakeReceipt.ContractId,
                        receipt.ContractId,
                        CountyCsvStreamParser.ContractId,
                        identity.ContractId,
                        ICountyCsvUploadAdmissionLedger.ContractId,
                        DateTimeOffset.UtcNow);
                    _batches.Add(identity.IdempotencyKey, batch);
                    disposition = CountyCsvUploadAdmissionDisposition.FirstSeen;
                }

                return Task.FromResult(
                    new CountyCsvUploadAdmissionResult(
                        ICountyCsvUploadAdmissionLedger.ContractId,
                        disposition,
                        CountyCsvUploadAdmissionDenialCode.None,
                        batch));
            }
        }

        public Task<IReadOnlyList<CountyCsvUploadBatchSummary>> ListRecentAsync(
            Guid countyId,
            int limit,
            CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            lock (_gate)
            {
                IReadOnlyList<CountyCsvUploadBatchSummary> batches = _batches.Values
                    .Where(batch => batch.CountyId == countyId)
                    .OrderByDescending(batch => batch.ReceivedAtUtc)
                    .Take(limit)
                    .Select(batch => new CountyCsvUploadBatchSummary(
                        batch.BatchId,
                        batch.CountyId,
                        batch.Dataset,
                        batch.SourceFileName,
                        batch.ContentSha256,
                        batch.ContentByteLength,
                        batch.AcceptedRowCount,
                        batch.Status,
                        batch.ReceivedAtUtc))
                    .ToArray();
                return Task.FromResult(batches);
            }
        }
    }

    private sealed class EmptyHistoryReader : ICountyCsvUploadHistoryReader
    {
        public Task<IReadOnlyList<CountyCsvUploadBatchSummary>> ListRecentAsync(
            Guid countyId,
            int limit,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<CountyCsvUploadBatchSummary>>([]);
    }

    private sealed class TestRowStager : ICountyCsvUploadRowStager
    {
        public Task<CountyCsvUploadRowStagingSummary> StageAsync(
            CountyCsvUploadRowStagingRequest request,
            CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            Assert.NotNull(request.CountyContext);
            Assert.NotNull(request.Batch);
            Assert.NotNull(request.Document);
            var batch = request.Batch;
            var document = request.Document;
            return Task.FromResult(new CountyCsvUploadRowStagingSummary(
                batch.BatchId,
                batch.CountyId,
                ICountyCsvUploadRowStager.ContractId,
                CountyCsvUploadRowValidator.SchemaVersion,
                document.Rows.Count,
                document.Rows.Count,
                0,
                [],
                DateTimeOffset.UtcNow));
        }
    }

    private sealed class TrackingHistoryReader : ICountyCsvUploadHistoryReader
    {
        public Guid? RequestedCountyId { get; private set; }

        public int RequestedLimit { get; private set; }

        public Task<IReadOnlyList<CountyCsvUploadBatchSummary>> ListRecentAsync(
            Guid countyId,
            int limit,
            CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            RequestedCountyId = countyId;
            RequestedLimit = limit;
            IReadOnlyList<CountyCsvUploadBatchSummary> batches =
            [
                new(
                    Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    countyId,
                    "Sales",
                    "county-sales.csv",
                    new string('a', 64),
                    128,
                    2,
                    CountyCsvUploadBatch.AdmittedStatus,
                    DateTimeOffset.Parse("2026-09-03T00:00:00Z")),
            ];
            return Task.FromResult(batches);
        }
    }

    private sealed class DenyingAdmissionLedger : ICountyCsvUploadAdmissionLedger
    {
        public Task<CountyCsvUploadAdmissionResult> AdmitAsync(
            CountyCsvUploadAdmissionRequest? request,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(
                new CountyCsvUploadAdmissionResult(
                    ICountyCsvUploadAdmissionLedger.ContractId,
                    CountyCsvUploadAdmissionDisposition.Denied,
                    CountyCsvUploadAdmissionDenialCode.InvalidApiContract,
                    Batch: null));
    }

    private sealed class CancelingAdmissionLedger : ICountyCsvUploadAdmissionLedger
    {
        public Task<CountyCsvUploadAdmissionResult> AdmitAsync(
            CountyCsvUploadAdmissionRequest? request,
            CancellationToken cancellationToken = default) =>
            Task.FromException<CountyCsvUploadAdmissionResult>(
                new OperationCanceledException("synthetic durable ledger cancellation"));
    }
}
