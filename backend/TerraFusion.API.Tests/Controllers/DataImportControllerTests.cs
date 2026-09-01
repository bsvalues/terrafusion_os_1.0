using System.Reflection;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
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
using TerraFusion.Core.Services;
using Xunit;

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
            "wal.county-upload.authenticated-csv-api-admission.v1",
            DataImportController.UploadContractId);
        Assert.All(
            typeof(DataImportController)
                .GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
                .Where(method => method.Name != nameof(DataImportController.UploadFile)),
            method => Assert.NotNull(method.GetCustomAttribute<AllowAnonymousAttribute>()));

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
        Assert.Equal(CountyIds["wa-benton"], receipt.CountyId);
        Assert.Equal("wa-benton", receipt.CountyKey);
        Assert.Equal("Benton", receipt.CountyName);
        Assert.Equal(dataset, receipt.Dataset);
        Assert.Equal(Hash(ValidCsv), receipt.ContentSha256);
        Assert.Equal(Encoding.UTF8.GetByteCount(ValidCsv), receipt.ContentLength);
        Assert.Equal(2, receipt.AcceptedRowCount);
        Assert.Equal("FirstSeen", receipt.DuplicateDisposition);
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
        Assert.Equal(first.ContentSha256, second.ContentSha256);
        Assert.Equal(first.CountyId, second.CountyId);
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
    public void Controller_has_only_local_in_memory_admission_dependencies()
    {
        var constructor = Assert.Single(typeof(DataImportController).GetConstructors());
        Assert.Equal(
            new[]
            {
                typeof(ILogger<DataImportController>),
                typeof(AuthenticatedCanonicalCountyContextProvider),
                typeof(IMemoryCache),
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
            cache)
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
}
