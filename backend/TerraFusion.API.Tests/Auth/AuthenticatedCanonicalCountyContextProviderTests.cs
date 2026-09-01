using System.Reflection;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using TerraFusion.API.Auth;
using TerraFusion.Core.Auth;
using TerraFusion.Core.Counties;
using TerraFusion.Core.Services;
using Xunit;

namespace TerraFusion.API.Tests.Auth;

public sealed class AuthenticatedCanonicalCountyContextProviderTests
{
    [Fact]
    public async Task GetCurrentAsync_establishes_each_canonical_county_from_persisted_guid_agreement()
    {
        var canonicalCounties = WashingtonCountyRegistry.Counties;
        Assert.Equal(39, canonicalCounties.Count);
        var persistedIds = canonicalCounties
            .Select((county, index) => new { county.Key, Id = CountyId(index + 1) })
            .ToDictionary(item => item.Key, item => item.Id, StringComparer.Ordinal);

        for (var index = 0; index < canonicalCounties.Count; index++)
        {
            var county = canonicalCounties[index];
            var accessor = new CountingContextAccessor(
                new RequestUserContext(true, $"actor-{index + 1}", county.Key, Array.Empty<string>()));
            var resolver = Resolver((value, _) => Task.FromResult<Guid?>(
                persistedIds.TryGetValue(value, out var countyId) ? countyId : null));
            var provider = CreateProvider(accessor, resolver);

            var result = await provider.GetCurrentAsync();

            Assert.Equal(AuthenticatedCanonicalCountyContextDecision.Established, result.Decision);
            Assert.Equal($"actor-{index + 1}", result.ActorId);
            Assert.Equal(persistedIds[county.Key], result.CountyId);
            Assert.Same(county, result.County);
            Assert.Equal(1, accessor.ReadCount);
            Assert.Equal(county.Key, resolver.Inputs[0]);
            Assert.Equal(
                canonicalCounties.Select(item => item.Key),
                resolver.Inputs.Skip(1));
            Assert.Equal(40, resolver.Inputs.Count);
        }
    }

    [Fact]
    public async Task GetCurrentAsync_returns_one_uniform_data_free_denial_for_all_invalid_evidence()
    {
        var canonicalIds = WashingtonCountyRegistry.Counties
            .Select((county, index) => new { county.Key, Id = CountyId(index + 1) })
            .ToDictionary(item => item.Key, item => item.Id, StringComparer.Ordinal);
        var nonCanonicalId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        var cases = new (IRequestUserContextAccessor Accessor, ScriptedCountyResolver Resolver)[]
        {
            (new StaticContextAccessor(RequestUserContext.Anonymous), Resolver((_, _) =>
                throw new InvalidOperationException("resolver must not run"))),
            (new StaticContextAccessor(new RequestUserContext(true, "secret-actor", null, Array.Empty<string>())),
                Resolver((_, _) => throw new InvalidOperationException("resolver must not run"))),
            (new StaticContextAccessor(new RequestUserContext(true, " ", "wa-benton", Array.Empty<string>())),
                Resolver((_, _) => throw new InvalidOperationException("resolver must not run"))),
            (CreateAmbiguousHttpContextAccessor(), Resolver((_, _) =>
                throw new InvalidOperationException("resolver must not run"))),
            (new StaticContextAccessor(new RequestUserContext(true, "secret-actor", "unknown", Array.Empty<string>())),
                Resolver((_, _) => Task.FromResult<Guid?>(null))),
            (new StaticContextAccessor(new RequestUserContext(true, "secret-actor", "persisted-noncanonical", Array.Empty<string>())),
                Resolver((value, _) => Task.FromResult<Guid?>(
                    value == "persisted-noncanonical"
                        ? nonCanonicalId
                        : canonicalIds.TryGetValue(value, out var countyId) ? countyId : null))),
        };
        var denials = new List<AuthenticatedCanonicalCountyContextResult>();

        foreach (var (accessor, resolver) in cases)
        {
            denials.Add(await CreateProvider(accessor, resolver).GetCurrentAsync());
        }

        Assert.All(denials, AssertDataFreeDenial);
        Assert.All(denials.Skip(1), denial => Assert.Same(denials[0], denial));
    }

    [Fact]
    public async Task GetCurrentAsync_propagates_cancellation_without_retry_or_fallback()
    {
        using var cts = new CancellationTokenSource();
        var accessor = new CountingContextAccessor(
            new RequestUserContext(true, "actor", "wa-benton", Array.Empty<string>()));
        var resolver = Resolver((_, _) =>
        {
            cts.Cancel();
            return Task.FromResult<Guid?>(CountyId(3));
        });

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => CreateProvider(accessor, resolver).GetCurrentAsync(cts.Token));

        Assert.Equal(1, accessor.ReadCount);
        Assert.Equal(new[] { "wa-benton" }, resolver.Inputs);
    }

    [Fact]
    public async Task GetCurrentAsync_propagates_resolver_exception_without_retry_or_fallback()
    {
        var expected = new InvalidOperationException("persisted resolver unavailable");
        var accessor = new CountingContextAccessor(
            new RequestUserContext(true, "actor", "wa-benton", Array.Empty<string>()));
        var resolver = Resolver((_, _) => Task.FromException<Guid?>(expected));

        var actual = await Assert.ThrowsAsync<InvalidOperationException>(
            () => CreateProvider(accessor, resolver).GetCurrentAsync());

        Assert.Same(expected, actual);
        Assert.Equal(1, accessor.ReadCount);
        Assert.Equal(new[] { "wa-benton" }, resolver.Inputs);
    }

    [Fact]
    public void Registration_is_scoped_and_resolves_one_chain_per_scope()
    {
        var services = new ServiceCollection();
        services.AddScoped<IRequestUserContextAccessor, AnonymousContextAccessor>();
        services.AddScoped<ICountyResolver, NullCountyResolver>();

        var returned = services.AddAuthenticatedCanonicalCountyContext();

        Assert.Same(services, returned);
        AssertScoped<AuthenticatedCountyAuthorityBinding>(services);
        AssertScoped<AuthenticatedCanonicalCountyContext>(services);
        AssertScoped<AuthenticatedCanonicalCountyContextProvider>(services);

        using var root = services.BuildServiceProvider(
            new ServiceProviderOptions { ValidateOnBuild = true, ValidateScopes = true });
        using var firstScope = root.CreateScope();
        using var secondScope = root.CreateScope();
        var first = firstScope.ServiceProvider
            .GetRequiredService<AuthenticatedCanonicalCountyContextProvider>();
        var firstAgain = firstScope.ServiceProvider
            .GetRequiredService<AuthenticatedCanonicalCountyContextProvider>();
        var second = secondScope.ServiceProvider
            .GetRequiredService<AuthenticatedCanonicalCountyContextProvider>();

        Assert.Same(first, firstAgain);
        Assert.NotSame(first, second);
        Assert.Same(
            firstScope.ServiceProvider.GetRequiredService<AuthenticatedCountyAuthorityBinding>(),
            firstScope.ServiceProvider.GetRequiredService<AuthenticatedCountyAuthorityBinding>());
        Assert.Same(
            firstScope.ServiceProvider.GetRequiredService<AuthenticatedCanonicalCountyContext>(),
            firstScope.ServiceProvider.GetRequiredService<AuthenticatedCanonicalCountyContext>());
    }

    [Fact]
    public void Contract_surface_is_zero_selector_and_constructor_is_fail_closed()
    {
        Assert.Equal(
            "wal.authenticated-canonical-county-runtime-context.v1",
            AuthenticatedCanonicalCountyContextProvider.ContractId);
        Assert.True(typeof(AuthenticatedCanonicalCountyContextProvider).IsSealed);

        var method = Assert.Single(
            typeof(AuthenticatedCanonicalCountyContextProvider)
                .GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly));
        Assert.Equal(nameof(AuthenticatedCanonicalCountyContextProvider.GetCurrentAsync), method.Name);
        Assert.Equal(
            new[] { typeof(CancellationToken) },
            method.GetParameters().Select(parameter => parameter.ParameterType));
        Assert.DoesNotContain(
            method.GetParameters(),
            parameter => parameter.ParameterType == typeof(string));

        var accessor = new StaticContextAccessor(RequestUserContext.Anonymous);
        var resolver = Resolver((_, _) => Task.FromResult<Guid?>(null));
        var binding = new AuthenticatedCountyAuthorityBinding(accessor, resolver);
        var canonicalContext = new AuthenticatedCanonicalCountyContext(resolver);

        Assert.Throws<ArgumentNullException>(
            () => new AuthenticatedCanonicalCountyContextProvider(null!, canonicalContext));
        Assert.Throws<ArgumentNullException>(
            () => new AuthenticatedCanonicalCountyContextProvider(binding, null!));
        Assert.Throws<ArgumentNullException>(
            () => AuthenticatedCanonicalCountyContextServiceCollectionExtensions
                .AddAuthenticatedCanonicalCountyContext(null!));
    }

    private static AuthenticatedCanonicalCountyContextProvider CreateProvider(
        IRequestUserContextAccessor accessor,
        ICountyResolver resolver) =>
        new(
            new AuthenticatedCountyAuthorityBinding(accessor, resolver),
            new AuthenticatedCanonicalCountyContext(resolver));

    private static IRequestUserContextAccessor CreateAmbiguousHttpContextAccessor()
    {
        var identity = new ClaimsIdentity(
            new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "secret-actor"),
                new Claim("countyId", "wa-benton"),
                new Claim("county_id", "wa-king"),
            },
            authenticationType: "test");
        var context = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(identity),
        };

        return new HttpContextRequestUserContextAccessor(
            new HttpContextAccessor { HttpContext = context });
    }

    private static void AssertScoped<TService>(IServiceCollection services)
    {
        var descriptor = Assert.Single(
            services.Where(item => item.ServiceType == typeof(TService)));
        Assert.Equal(ServiceLifetime.Scoped, descriptor.Lifetime);
    }

    private static void AssertDataFreeDenial(AuthenticatedCanonicalCountyContextResult result)
    {
        Assert.Equal(AuthenticatedCanonicalCountyContextDecision.Denied, result.Decision);
        Assert.Null(result.ActorId);
        Assert.Null(result.CountyId);
        Assert.Null(result.County);
        Assert.DoesNotContain("secret-actor", result.ToString(), StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("benton", result.ToString(), StringComparison.OrdinalIgnoreCase);
    }

    private static Guid CountyId(int index) =>
        Guid.Parse($"00000000-0000-0000-0000-{index:D12}");

    private static ScriptedCountyResolver Resolver(
        Func<string, CancellationToken, Task<Guid?>> callback) =>
        new(callback);

    private sealed class StaticContextAccessor : IRequestUserContextAccessor
    {
        public StaticContextAccessor(RequestUserContext current)
        {
            Current = current;
        }

        public RequestUserContext Current { get; }
    }

    private sealed class CountingContextAccessor : IRequestUserContextAccessor
    {
        private readonly RequestUserContext _current;

        public CountingContextAccessor(RequestUserContext current)
        {
            _current = current;
        }

        public int ReadCount { get; private set; }

        public RequestUserContext Current
        {
            get
            {
                ReadCount++;
                return _current;
            }
        }
    }

    private sealed class AnonymousContextAccessor : IRequestUserContextAccessor
    {
        public RequestUserContext Current => RequestUserContext.Anonymous;
    }

    private sealed class NullCountyResolver : ICountyResolver
    {
        public Task<Guid> ResolveAsync(string countyIdOrCode, CancellationToken ct = default) =>
            throw new CountyNotFoundException(countyIdOrCode);

        public Task<Guid?> TryResolveAsync(string countyIdOrCode, CancellationToken ct = default) =>
            Task.FromResult<Guid?>(null);
    }

    private sealed class ScriptedCountyResolver : ICountyResolver
    {
        private readonly Func<string, CancellationToken, Task<Guid?>> _callback;

        public ScriptedCountyResolver(Func<string, CancellationToken, Task<Guid?>> callback)
        {
            _callback = callback;
        }

        public List<string> Inputs { get; } = new();

        public async Task<Guid> ResolveAsync(string countyIdOrCode, CancellationToken ct = default)
        {
            var result = await TryResolveAsync(countyIdOrCode, ct);
            return result ?? throw new CountyNotFoundException(countyIdOrCode);
        }

        public Task<Guid?> TryResolveAsync(string countyIdOrCode, CancellationToken ct = default)
        {
            Inputs.Add(countyIdOrCode);
            return _callback(countyIdOrCode, ct);
        }
    }
}
