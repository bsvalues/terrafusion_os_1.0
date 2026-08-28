using System.Reflection;
using TerraFusion.Core.Auth;
using TerraFusion.Core.Counties;
using TerraFusion.Core.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.Counties;

public sealed class AuthenticatedCanonicalCountyContextTests
{
    [Fact]
    public async Task EstablishAsync_establishes_each_exact_canonical_county_from_one_unique_guid()
    {
        var canonicalCounties = WashingtonCountyRegistry.Counties;
        Assert.Equal(39, canonicalCounties.Count);

        for (var index = 0; index < canonicalCounties.Count; index++)
        {
            var expectedCounty = canonicalCounties[index];
            var expectedCountyId = CountyId(index + 1);
            var binding = await CreateBoundAsync(
                expectedCounty,
                expectedCountyId,
                $"actor-{index + 1}");
            var resolver = Resolver((key, _) => Task.FromResult<Guid?>(
                key == expectedCounty.Key ? expectedCountyId : null));

            var result = await new AuthenticatedCanonicalCountyContext(resolver)
                .EstablishAsync(binding);

            Assert.Equal(AuthenticatedCanonicalCountyContextDecision.Established, result.Decision);
            Assert.Equal($"actor-{index + 1}", result.ActorId);
            Assert.Equal(expectedCountyId, result.CountyId);
            Assert.Same(expectedCounty, result.County);
            Assert.Equal(canonicalCounties.Select(county => county.Key), resolver.Inputs);
        }
    }

    [Fact]
    public async Task EstablishAsync_resolves_each_exact_key_once_in_order_with_the_caller_token()
    {
        var expectedCounty = WashingtonCountyRegistry.Counties[2];
        var expectedCountyId = CountyId(3);
        var binding = await CreateBoundAsync(expectedCounty, expectedCountyId, "bounded-actor");
        using var cts = new CancellationTokenSource();
        var resolver = Resolver((key, _) => Task.FromResult<Guid?>(
            key == expectedCounty.Key ? expectedCountyId : null));

        var result = await new AuthenticatedCanonicalCountyContext(resolver)
            .EstablishAsync(binding, cts.Token);

        Assert.Equal(AuthenticatedCanonicalCountyContextDecision.Established, result.Decision);
        Assert.Same(expectedCounty, result.County);
        Assert.Equal(
            WashingtonCountyRegistry.Counties.Select(county => county.Key),
            resolver.Inputs);
        Assert.Equal(39, resolver.Inputs.Count);
        Assert.All(resolver.Tokens, token => Assert.Equal(cts.Token, token));
    }

    [Fact]
    public async Task EstablishAsync_denies_null_denied_and_malformed_bindings_without_resolution()
    {
        var plausibleCountyId = CountyId(1);
        var deniedBinding = await CreateDeniedAsync();
        var malformedBindings = new AuthenticatedCountyAuthorityBindingResult?[]
        {
            null,
            deniedBinding,
            ConstructBinding((AuthenticatedCountyAuthorityBindingDecision)int.MaxValue, "actor", plausibleCountyId),
            ConstructBinding(AuthenticatedCountyAuthorityBindingDecision.Denied, "actor", plausibleCountyId),
            ConstructBinding(AuthenticatedCountyAuthorityBindingDecision.Bound, null, plausibleCountyId),
            ConstructBinding(AuthenticatedCountyAuthorityBindingDecision.Bound, " ", plausibleCountyId),
            ConstructBinding(AuthenticatedCountyAuthorityBindingDecision.Bound, "actor", null),
            ConstructBinding(AuthenticatedCountyAuthorityBindingDecision.Bound, "actor", Guid.Empty),
        };
        var results = new List<AuthenticatedCanonicalCountyContextResult>();

        foreach (var malformedBinding in malformedBindings)
        {
            var resolver = Resolver((_, _) =>
                throw new InvalidOperationException("resolver must not run"));

            var result = await new AuthenticatedCanonicalCountyContext(resolver)
                .EstablishAsync(malformedBinding);

            AssertDataFreeDenial(result);
            Assert.Empty(resolver.Inputs);
            results.Add(result);
        }

        Assert.All(results, result => Assert.Same(results[0], result));
    }

    [Fact]
    public async Task EstablishAsync_denies_zero_and_multiple_guid_matches_after_the_full_scan()
    {
        var expectedCounty = WashingtonCountyRegistry.Counties[0];
        var expectedCountyId = CountyId(1);
        var binding = await CreateBoundAsync(expectedCounty, expectedCountyId, "actor");
        var zeroResolver = Resolver((_, _) => Task.FromResult<Guid?>(null));
        var duplicateKeys = WashingtonCountyRegistry.Counties
            .Take(2)
            .Select(county => county.Key)
            .ToHashSet(StringComparer.Ordinal);
        var twoResolver = Resolver((key, _) => Task.FromResult<Guid?>(
            duplicateKeys.Contains(key) ? expectedCountyId : null));

        var zero = await new AuthenticatedCanonicalCountyContext(zeroResolver)
            .EstablishAsync(binding);
        var two = await new AuthenticatedCanonicalCountyContext(twoResolver)
            .EstablishAsync(binding);

        AssertDataFreeDenial(zero);
        AssertDataFreeDenial(two);
        Assert.Same(zero, two);
        var exactKeys = WashingtonCountyRegistry.Counties.Select(county => county.Key);
        Assert.Equal(exactKeys, zeroResolver.Inputs);
        Assert.Equal(exactKeys, twoResolver.Inputs);
    }

    [Fact]
    public async Task EstablishAsync_observes_pre_cancellation_before_reading_binding_or_resolver()
    {
        var expectedCounty = WashingtonCountyRegistry.Counties[0];
        var binding = await CreateBoundAsync(expectedCounty, CountyId(1), "actor");
        var resolver = Resolver((_, _) => Task.FromResult<Guid?>(null));
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => new AuthenticatedCanonicalCountyContext(resolver)
                .EstablishAsync(binding, cts.Token));

        Assert.Empty(resolver.Inputs);
    }

    [Fact]
    public async Task EstablishAsync_observes_cancellation_between_sequential_resolutions()
    {
        var expectedCounty = WashingtonCountyRegistry.Counties[0];
        var binding = await CreateBoundAsync(expectedCounty, CountyId(1), "actor");
        using var cts = new CancellationTokenSource();
        ScriptedCountyResolver? resolver = null;
        resolver = Resolver((_, _) =>
        {
            if (resolver!.Inputs.Count == 5)
            {
                cts.Cancel();
            }

            return Task.FromResult<Guid?>(null);
        });

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => new AuthenticatedCanonicalCountyContext(resolver)
                .EstablishAsync(binding, cts.Token));

        Assert.Equal(
            WashingtonCountyRegistry.Counties.Take(5).Select(county => county.Key),
            resolver.Inputs);
        Assert.All(resolver.Tokens, token => Assert.Equal(cts.Token, token));
    }

    [Fact]
    public async Task EstablishAsync_propagates_resolver_exception_without_retry_or_fallback()
    {
        var expectedCounty = WashingtonCountyRegistry.Counties[0];
        var binding = await CreateBoundAsync(expectedCounty, CountyId(1), "actor");
        var expected = new InvalidOperationException("persisted county resolver unavailable");
        var resolver = Resolver((_, _) => Task.FromException<Guid?>(expected));

        var actual = await Assert.ThrowsAsync<InvalidOperationException>(
            () => new AuthenticatedCanonicalCountyContext(resolver)
                .EstablishAsync(binding));

        Assert.Same(expected, actual);
        Assert.Equal(new[] { WashingtonCountyRegistry.Counties[0].Key }, resolver.Inputs);
    }

    [Fact]
    public async Task EstablishAsync_propagates_resolver_cancellation_without_retry_or_fallback()
    {
        var expectedCounty = WashingtonCountyRegistry.Counties[0];
        var binding = await CreateBoundAsync(expectedCounty, CountyId(1), "actor");
        using var resolverCts = new CancellationTokenSource();
        resolverCts.Cancel();
        var resolver = Resolver((_, _) => Task.FromCanceled<Guid?>(resolverCts.Token));

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => new AuthenticatedCanonicalCountyContext(resolver)
                .EstablishAsync(binding));

        Assert.Equal(new[] { WashingtonCountyRegistry.Counties[0].Key }, resolver.Inputs);
    }

    [Fact]
    public async Task Denials_are_one_immutable_data_free_singleton()
    {
        var expectedCounty = WashingtonCountyRegistry.Counties[0];
        var binding = await CreateBoundAsync(expectedCounty, CountyId(1), "secret-actor");
        var zeroResolver = Resolver((_, _) => Task.FromResult<Guid?>(null));
        var nullResolver = Resolver((_, _) =>
            throw new InvalidOperationException("resolver must not run"));

        var zero = await new AuthenticatedCanonicalCountyContext(zeroResolver)
            .EstablishAsync(binding);
        var malformed = await new AuthenticatedCanonicalCountyContext(nullResolver)
            .EstablishAsync(null);

        AssertDataFreeDenial(zero);
        AssertDataFreeDenial(malformed);
        Assert.Same(zero, malformed);
        Assert.DoesNotContain("secret-actor", zero.ToString(), StringComparison.Ordinal);
        Assert.DoesNotContain(CountyId(1).ToString("D"), zero.ToString(), StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain(expectedCounty.Name, zero.ToString(), StringComparison.Ordinal);

        Assert.All(
            typeof(AuthenticatedCanonicalCountyContextResult).GetProperties(),
            property => Assert.Null(property.SetMethod));
        Assert.Empty(typeof(AuthenticatedCanonicalCountyContextResult).GetConstructors());
    }

    [Fact]
    public void Contract_surface_is_sealed_core_only_and_accepts_only_protected_binding_evidence()
    {
        Assert.Equal(
            "wal.authenticated-canonical-county-context.v1",
            AuthenticatedCanonicalCountyContext.ContractId);
        Assert.True(typeof(AuthenticatedCanonicalCountyContext).IsSealed);
        Assert.True(typeof(AuthenticatedCanonicalCountyContextResult).IsSealed);

        var publicDeclaredMethods = typeof(AuthenticatedCanonicalCountyContext)
            .GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly);
        var method = Assert.Single(publicDeclaredMethods);
        Assert.Equal(nameof(AuthenticatedCanonicalCountyContext.EstablishAsync), method.Name);
        Assert.Equal(typeof(Task<AuthenticatedCanonicalCountyContextResult>), method.ReturnType);
        Assert.Equal(
            new[]
            {
                typeof(AuthenticatedCountyAuthorityBindingResult),
                typeof(CancellationToken),
            },
            method.GetParameters().Select(parameter => parameter.ParameterType));

        var fieldTypes = typeof(AuthenticatedCanonicalCountyContext)
            .GetFields(BindingFlags.NonPublic | BindingFlags.Instance)
            .Select(field => field.FieldType)
            .ToArray();
        Assert.Equal(new[] { typeof(ICountyResolver) }, fieldTypes);
        Assert.DoesNotContain(fieldTypes, type => type == typeof(IRequestUserContextAccessor));
        Assert.DoesNotContain(fieldTypes, type => type == typeof(string));
        Assert.DoesNotContain(fieldTypes, type =>
            type.Namespace?.StartsWith("TerraFusion.API", StringComparison.Ordinal) == true);
    }

    [Fact]
    public void Constructor_rejects_a_missing_resolver()
    {
        Assert.Throws<ArgumentNullException>(
            () => new AuthenticatedCanonicalCountyContext(null!));
    }

    private static async Task<AuthenticatedCountyAuthorityBindingResult> CreateBoundAsync(
        WashingtonCountyIdentity county,
        Guid countyId,
        string actorId)
    {
        var context = new RequestUserContext(
            IsAuthenticated: true,
            UserId: actorId,
            CountyId: county.Key,
            Roles: Array.Empty<string>());
        var accessor = new StaticContextAccessor(context);
        var resolver = Resolver((key, _) => Task.FromResult<Guid?>(
            key == county.Key ? countyId : null));

        var result = await new AuthenticatedCountyAuthorityBinding(accessor, resolver)
            .BindAsync(county.Key);

        Assert.Equal(AuthenticatedCountyAuthorityBindingDecision.Bound, result.Decision);
        return result;
    }

    private static async Task<AuthenticatedCountyAuthorityBindingResult> CreateDeniedAsync()
    {
        var accessor = new StaticContextAccessor(RequestUserContext.Anonymous);
        var resolver = Resolver((_, _) =>
            throw new InvalidOperationException("resolver must not run"));
        return await new AuthenticatedCountyAuthorityBinding(accessor, resolver)
            .BindAsync("wa-benton");
    }

    private static AuthenticatedCountyAuthorityBindingResult ConstructBinding(
        AuthenticatedCountyAuthorityBindingDecision decision,
        string? actorId,
        Guid? countyId)
    {
        var constructor = typeof(AuthenticatedCountyAuthorityBindingResult).GetConstructor(
            BindingFlags.Instance | BindingFlags.NonPublic,
            binder: null,
            new[] { typeof(AuthenticatedCountyAuthorityBindingDecision), typeof(string), typeof(Guid?) },
            modifiers: null);
        Assert.NotNull(constructor);
        return (AuthenticatedCountyAuthorityBindingResult)constructor.Invoke(
            new object?[] { decision, actorId, countyId });
    }

    private static Guid CountyId(int index) =>
        Guid.Parse($"00000000-0000-0000-0000-{index:D12}");

    private static ScriptedCountyResolver Resolver(
        Func<string, CancellationToken, Task<Guid?>> callback) =>
        new(callback);

    private static void AssertDataFreeDenial(
        AuthenticatedCanonicalCountyContextResult result)
    {
        Assert.Equal(AuthenticatedCanonicalCountyContextDecision.Denied, result.Decision);
        Assert.Null(result.ActorId);
        Assert.Null(result.CountyId);
        Assert.Null(result.County);
    }

    private sealed class StaticContextAccessor : IRequestUserContextAccessor
    {
        public StaticContextAccessor(RequestUserContext current)
        {
            Current = current;
        }

        public RequestUserContext Current { get; }
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
