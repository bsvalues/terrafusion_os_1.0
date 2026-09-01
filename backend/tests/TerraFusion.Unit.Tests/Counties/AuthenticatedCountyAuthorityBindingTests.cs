using System.Reflection;
using TerraFusion.Core.Auth;
using TerraFusion.Core.Counties;
using TerraFusion.Core.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.Counties;

public sealed class AuthenticatedCountyAuthorityBindingTests
{
    private static readonly Guid BentonId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid FranklinId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    [Fact]
    public async Task BindCurrentAsync_binds_each_canonical_county_from_only_its_authenticated_claim()
    {
        var canonicalCounties = WashingtonCountyRegistry.Counties;
        Assert.Equal(39, canonicalCounties.Count);

        for (var index = 0; index < canonicalCounties.Count; index++)
        {
            var county = canonicalCounties[index];
            var countyId = CountyId(index + 1);
            var accessor = new CountingContextAccessor(
                () => Authenticated($"actor-{index + 1}", county.Key));
            var resolver = Resolver((value, _) => Task.FromResult<Guid?>(
                value == county.Key ? countyId : null));

            var result = await new AuthenticatedCountyAuthorityBinding(accessor, resolver)
                .BindCurrentAsync();

            Assert.Equal(AuthenticatedCountyAuthorityBindingDecision.Bound, result.Decision);
            Assert.Equal($"actor-{index + 1}", result.ActorId);
            Assert.Equal(countyId, result.CountyId);
            Assert.Equal(1, accessor.ReadCount);
            Assert.Equal(new[] { county.Key }, resolver.Inputs);
        }
    }

    [Theory]
    [MemberData(nameof(InvalidCurrentContextCases))]
    public async Task BindCurrentAsync_denies_invalid_current_evidence_without_resolution(
        RequestUserContext? context)
    {
        var accessor = new CountingContextAccessor(() => context);
        var resolver = Resolver((_, _) =>
            throw new InvalidOperationException("resolver must not run"));

        var result = await new AuthenticatedCountyAuthorityBinding(accessor, resolver)
            .BindCurrentAsync();

        AssertDataFreeDenial(result);
        Assert.Equal(1, accessor.ReadCount);
        Assert.Empty(resolver.Inputs);
    }

    public static IEnumerable<object?[]> InvalidCurrentContextCases()
    {
        yield return new object?[] { null };
        yield return new object?[] { RequestUserContext.Anonymous };
        yield return new object?[] { Authenticated(null, "Benton") };
        yield return new object?[] { Authenticated(" ", "Benton") };
        yield return new object?[] { Authenticated("actor", null) };
        yield return new object?[] { Authenticated("actor", " ") };
    }

    [Fact]
    public async Task BindCurrentAsync_uses_one_context_snapshot_and_one_resolution()
    {
        var reads = 0;
        var accessor = new CountingContextAccessor(() =>
            ++reads == 1
                ? Authenticated("first-actor", "Benton")
                : Authenticated("second-actor", "Franklin"));
        var resolver = Resolver((value, _) => Task.FromResult<Guid?>(
            value == "Benton" ? BentonId : FranklinId));

        var result = await new AuthenticatedCountyAuthorityBinding(accessor, resolver)
            .BindCurrentAsync();

        Assert.Equal(AuthenticatedCountyAuthorityBindingDecision.Bound, result.Decision);
        Assert.Equal("first-actor", result.ActorId);
        Assert.Equal(BentonId, result.CountyId);
        Assert.Equal(1, accessor.ReadCount);
        Assert.Equal(new[] { "Benton" }, resolver.Inputs);
    }

    [Fact]
    public async Task BindCurrentAsync_observes_pre_cancellation_before_reading_context()
    {
        var accessor = new CountingContextAccessor(() => Authenticated("actor", "Benton"));
        var resolver = Resolver((_, _) => Task.FromResult<Guid?>(BentonId));
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => new AuthenticatedCountyAuthorityBinding(accessor, resolver)
                .BindCurrentAsync(cts.Token));

        Assert.Equal(0, accessor.ReadCount);
        Assert.Empty(resolver.Inputs);
    }

    [Fact]
    public async Task BindCurrentAsync_propagates_cancellation_without_retry_or_fallback()
    {
        using var cts = new CancellationTokenSource();
        var accessor = new CountingContextAccessor(() => Authenticated("actor", "Benton"));
        var resolver = Resolver((_, _) =>
        {
            cts.Cancel();
            return Task.FromResult<Guid?>(BentonId);
        });

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => new AuthenticatedCountyAuthorityBinding(accessor, resolver)
                .BindCurrentAsync(cts.Token));

        Assert.Equal(1, accessor.ReadCount);
        Assert.Equal(new[] { "Benton" }, resolver.Inputs);
    }

    [Fact]
    public async Task BindCurrentAsync_propagates_resolver_exception_without_retry_or_fallback()
    {
        var expected = new InvalidOperationException("resolver unavailable");
        var accessor = new CountingContextAccessor(() => Authenticated("actor", "Benton"));
        var resolver = Resolver((_, _) => Task.FromException<Guid?>(expected));

        var actual = await Assert.ThrowsAsync<InvalidOperationException>(
            () => new AuthenticatedCountyAuthorityBinding(accessor, resolver)
                .BindCurrentAsync());

        Assert.Same(expected, actual);
        Assert.Equal(1, accessor.ReadCount);
        Assert.Equal(new[] { "Benton" }, resolver.Inputs);
    }

    [Fact]
    public async Task BindAsync_snapshots_one_authenticated_context_and_binds_equal_persisted_ids()
    {
        var context = Authenticated("actor-7", "53005", roles: new[] { "viewer", "fabricated-admin" });
        var accessor = new CountingContextAccessor(() => context);
        var resolver = Resolver((value, _) => Task.FromResult<Guid?>(
            value is "53005" or "Benton" ? BentonId : null));
        var binding = new AuthenticatedCountyAuthorityBinding(accessor, resolver);
        using var cts = new CancellationTokenSource();

        var result = await binding.BindAsync("Benton", cts.Token);

        Assert.Equal(AuthenticatedCountyAuthorityBindingDecision.Bound, result.Decision);
        Assert.Equal("actor-7", result.ActorId);
        Assert.Equal(BentonId, result.CountyId);
        Assert.Equal(1, accessor.ReadCount);
        Assert.Equal(new[] { "53005", "Benton" }, resolver.Inputs);
        Assert.All(resolver.Tokens, token => Assert.Equal(cts.Token, token));
    }

    [Fact]
    public async Task BindAsync_accepts_distinct_aliases_only_when_the_resolver_returns_the_same_guid()
    {
        var accessor = new CountingContextAccessor(
            () => Authenticated("actor", BentonId.ToString("D")));
        var resolver = Resolver((value, _) => Task.FromResult<Guid?>(
            value == BentonId.ToString("D") || value == "benton-wa" ? BentonId : null));

        var result = await new AuthenticatedCountyAuthorityBinding(accessor, resolver)
            .BindAsync("benton-wa");

        Assert.Equal(AuthenticatedCountyAuthorityBindingDecision.Bound, result.Decision);
        Assert.Equal(BentonId, result.CountyId);
    }

    [Fact]
    public async Task BindAsync_denies_cross_county_unknown_and_malformed_values_uniformly()
    {
        var denied = new List<AuthenticatedCountyAuthorityBindingResult>();

        denied.Add(await Bind(
            Authenticated("actor", "Benton"),
            "Franklin",
            new Dictionary<string, Guid?> { ["Benton"] = BentonId, ["Franklin"] = FranklinId }));
        denied.Add(await Bind(
            Authenticated("actor", "unknown"),
            "Benton",
            new Dictionary<string, Guid?> { ["Benton"] = BentonId }));
        denied.Add(await Bind(
            Authenticated("actor", "Benton"),
            "not-a-county",
            new Dictionary<string, Guid?> { ["Benton"] = BentonId }));

        Assert.All(denied, AssertDataFreeDenial);
        Assert.Same(denied[0], denied[1]);
        Assert.Same(denied[1], denied[2]);
    }

    [Theory]
    [MemberData(nameof(InvalidContextCases))]
    public async Task BindAsync_denies_invalid_context_or_target_without_resolver_access(
        RequestUserContext? context,
        string? target)
    {
        var accessor = new CountingContextAccessor(() => context);
        var resolver = Resolver((_, _) => throw new InvalidOperationException("resolver must not run"));

        var result = await new AuthenticatedCountyAuthorityBinding(accessor, resolver)
            .BindAsync(target);

        AssertDataFreeDenial(result);
        Assert.Equal(1, accessor.ReadCount);
        Assert.Empty(resolver.Inputs);
    }

    public static IEnumerable<object?[]> InvalidContextCases()
    {
        yield return new object?[] { null, "Benton" };
        yield return new object?[] { RequestUserContext.Anonymous, "Benton" };
        yield return new object?[] { Authenticated(null, "Benton"), "Benton" };
        yield return new object?[] { Authenticated(" ", "Benton"), "Benton" };
        yield return new object?[] { Authenticated("actor", null), "Benton" };
        yield return new object?[] { Authenticated("actor", " "), "Benton" };
        yield return new object?[] { Authenticated("actor", "Benton"), null };
        yield return new object?[] { Authenticated("actor", "Benton"), " " };
    }

    [Fact]
    public async Task BindAsync_stops_after_an_unknown_authority_claim()
    {
        var accessor = new CountingContextAccessor(() => Authenticated("actor", "unknown"));
        var resolver = Resolver((_, _) => Task.FromResult<Guid?>(null));

        var result = await new AuthenticatedCountyAuthorityBinding(accessor, resolver)
            .BindAsync("Benton");

        AssertDataFreeDenial(result);
        Assert.Equal(new[] { "unknown" }, resolver.Inputs);
    }

    [Fact]
    public async Task BindAsync_uses_only_the_first_context_snapshot()
    {
        var calls = 0;
        var accessor = new CountingContextAccessor(() =>
            ++calls == 1
                ? Authenticated("first-actor", "Benton")
                : Authenticated("second-actor", "Franklin"));
        var resolver = Resolver((value, _) => Task.FromResult<Guid?>(
            value == "Benton" ? BentonId : FranklinId));

        var result = await new AuthenticatedCountyAuthorityBinding(accessor, resolver)
            .BindAsync("Benton");

        Assert.Equal(AuthenticatedCountyAuthorityBindingDecision.Bound, result.Decision);
        Assert.Equal("first-actor", result.ActorId);
        Assert.Equal(BentonId, result.CountyId);
        Assert.Equal(1, accessor.ReadCount);
    }

    [Fact]
    public async Task BindAsync_observes_pre_cancellation_before_reading_context()
    {
        var accessor = new CountingContextAccessor(() => Authenticated("actor", "Benton"));
        var resolver = Resolver((_, _) => Task.FromResult<Guid?>(BentonId));
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => new AuthenticatedCountyAuthorityBinding(accessor, resolver)
                .BindAsync("Benton", cts.Token));

        Assert.Equal(0, accessor.ReadCount);
        Assert.Empty(resolver.Inputs);
    }

    [Fact]
    public async Task BindAsync_observes_cancellation_between_resolutions()
    {
        using var cts = new CancellationTokenSource();
        var accessor = new CountingContextAccessor(() => Authenticated("actor", "Benton"));
        var resolver = Resolver((_, _) =>
        {
            cts.Cancel();
            return Task.FromResult<Guid?>(BentonId);
        });

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => new AuthenticatedCountyAuthorityBinding(accessor, resolver)
                .BindAsync("Benton", cts.Token));

        Assert.Equal(new[] { "Benton" }, resolver.Inputs);
    }

    [Fact]
    public async Task BindAsync_propagates_resolver_exceptions_without_retry_or_success()
    {
        var expected = new InvalidOperationException("resolver unavailable");
        var accessor = new CountingContextAccessor(() => Authenticated("actor", "Benton"));
        var resolver = Resolver((_, _) => Task.FromException<Guid?>(expected));
        var binding = new AuthenticatedCountyAuthorityBinding(accessor, resolver);

        var actual = await Assert.ThrowsAsync<InvalidOperationException>(
            () => binding.BindAsync("Benton"));

        Assert.Same(expected, actual);
        Assert.Single(resolver.Inputs);
    }

    [Fact]
    public async Task BindAsync_propagates_resolver_cancellation()
    {
        using var cts = new CancellationTokenSource();
        var accessor = new CountingContextAccessor(() => Authenticated("actor", "Benton"));
        var resolver = Resolver((_, token) => Task.FromCanceled<Guid?>(
            token.IsCancellationRequested ? token : new CancellationToken(canceled: true)));

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => new AuthenticatedCountyAuthorityBinding(accessor, resolver)
                .BindAsync("Benton", cts.Token));

        Assert.Single(resolver.Inputs);
    }

    [Fact]
    public void Contract_surface_is_sealed_core_only_and_has_no_grant_operation()
    {
        Assert.Equal(
            "wal.authenticated-county-authority-binding.v1",
            AuthenticatedCountyAuthorityBinding.ContractId);
        Assert.True(typeof(AuthenticatedCountyAuthorityBinding).IsSealed);

        var publicDeclaredMethods = typeof(AuthenticatedCountyAuthorityBinding)
            .GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly);
        Assert.Equal(
            new[]
            {
                nameof(AuthenticatedCountyAuthorityBinding.BindCurrentAsync),
                nameof(AuthenticatedCountyAuthorityBinding.BindAsync),
            },
            publicDeclaredMethods.Select(method => method.Name));

        var currentMethod = publicDeclaredMethods.Single(
            method => method.Name == nameof(AuthenticatedCountyAuthorityBinding.BindCurrentAsync));
        Assert.Equal(
            new[] { typeof(CancellationToken) },
            currentMethod.GetParameters().Select(parameter => parameter.ParameterType));
        Assert.DoesNotContain(
            currentMethod.GetParameters(),
            parameter => parameter.ParameterType == typeof(string));

        var fieldTypes = typeof(AuthenticatedCountyAuthorityBinding)
            .GetFields(BindingFlags.NonPublic | BindingFlags.Instance)
            .Select(field => field.FieldType)
            .ToArray();
        Assert.Equal(
            new[] { typeof(IRequestUserContextAccessor), typeof(ICountyResolver) },
            fieldTypes);
        Assert.DoesNotContain(fieldTypes, type =>
            type.Namespace?.StartsWith("TerraFusion.API", StringComparison.Ordinal) == true);
    }

    [Fact]
    public void Constructor_rejects_missing_dependencies()
    {
        var accessor = new CountingContextAccessor(() => Authenticated("actor", "Benton"));
        var resolver = Resolver((_, _) => Task.FromResult<Guid?>(BentonId));

        Assert.Throws<ArgumentNullException>(
            () => new AuthenticatedCountyAuthorityBinding(null!, resolver));
        Assert.Throws<ArgumentNullException>(
            () => new AuthenticatedCountyAuthorityBinding(accessor, null!));
    }

    private static async Task<AuthenticatedCountyAuthorityBindingResult> Bind(
        RequestUserContext context,
        string target,
        IReadOnlyDictionary<string, Guid?> values)
    {
        var accessor = new CountingContextAccessor(() => context);
        var resolver = Resolver((value, _) => Task.FromResult(
            values.TryGetValue(value, out var countyId) ? countyId : null));
        return await new AuthenticatedCountyAuthorityBinding(accessor, resolver)
            .BindAsync(target);
    }

    private static RequestUserContext Authenticated(
        string? actorId,
        string? countyId,
        IReadOnlyCollection<string>? roles = null) =>
        new(true, actorId, countyId, roles ?? Array.Empty<string>());

    private static ScriptedCountyResolver Resolver(
        Func<string, CancellationToken, Task<Guid?>> callback) =>
        new(callback);

    private static Guid CountyId(int index) =>
        Guid.Parse($"00000000-0000-0000-0000-{index:D12}");

    private static void AssertDataFreeDenial(
        AuthenticatedCountyAuthorityBindingResult result)
    {
        Assert.Equal(AuthenticatedCountyAuthorityBindingDecision.Denied, result.Decision);
        Assert.Null(result.ActorId);
        Assert.Null(result.CountyId);
        Assert.DoesNotContain("Benton", result.ToString());
        Assert.DoesNotContain("Franklin", result.ToString());
    }

    private sealed class CountingContextAccessor : IRequestUserContextAccessor
    {
        private readonly Func<RequestUserContext?> _current;

        public CountingContextAccessor(Func<RequestUserContext?> current)
        {
            _current = current;
        }

        public int ReadCount { get; private set; }

        public RequestUserContext Current
        {
            get
            {
                ReadCount++;
                return _current()!;
            }
        }
    }

    private sealed class ScriptedCountyResolver : ICountyResolver
    {
        private readonly Func<string, CancellationToken, Task<Guid?>> _callback;

        public ScriptedCountyResolver(Func<string, CancellationToken, Task<Guid?>> callback)
        {
            _callback = callback;
        }

        public List<string> Inputs { get; } = new();

        public List<CancellationToken> Tokens { get; } = new();

        public async Task<Guid> ResolveAsync(
            string countyIdOrCode,
            CancellationToken ct = default)
        {
            var result = await TryResolveAsync(countyIdOrCode, ct);
            return result ?? throw new CountyNotFoundException(countyIdOrCode);
        }

        public Task<Guid?> TryResolveAsync(
            string countyIdOrCode,
            CancellationToken ct = default)
        {
            Inputs.Add(countyIdOrCode);
            Tokens.Add(ct);
            return _callback(countyIdOrCode, ct);
        }
    }
}
