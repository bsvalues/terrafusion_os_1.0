/*
 * ControllerTestSetup
 *
 * Shared helpers for unit-testing TerraFusion ASP.NET Core controllers that
 * depend on:
 *   - ControllerContext.HttpContext (Request.Headers, User claims)
 *   - ICountyResolver (resolves county string → canonical Guid)
 *
 * Without these helpers, tests that directly instantiate a controller and
 * call an endpoint method NRE on Request.Headers access (HttpContext is
 * null on a freshly-constructed ControllerBase) and fail to compile after
 * controller-DI shape changes.
 *
 * Usage:
 *   _sut = new TerraForgeController(_db, logger, ols, saleQual,
 *       ControllerTestSetup.CountyResolverFor(BentonId))
 *   {
 *       ControllerContext = ControllerTestSetup.WithCountyClaim(BentonId)
 *   };
 *
 * Pattern matches the existing BuildControllerContext helper in
 * Phase14/ControllerSecurityBoundaryTests.cs but is generalized so it can
 * be reused across the TerraForge / CountyStudy / CountyStudio controller
 * test suites.
 */

using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using TerraFusion.API.Auth;
using TerraFusion.Core.Auth;
using TerraFusion.Core.Counties;
using TerraFusion.Core.Services;

namespace TerraFusion.API.Tests.TestHelpers;

/// <summary>
/// Helpers for constructing the minimum viable <see cref="ControllerContext"/>
/// and county-resolution dependencies that controller unit tests require.
/// </summary>
public static class ControllerTestSetup
{
    /// <summary>
    /// Default county scope id for unit tests that don't care about cross-county
    /// scoping logic (vast majority of single-county happy-path tests). Use
    /// alongside <see cref="WithCountyClaim"/> + <see cref="CountyResolverFor"/>
    /// so both the HttpContext claim and the resolver agree on a single county.
    /// </summary>
    public static readonly Guid DefaultCountyClaimId =
        Guid.Parse("11111111-1111-1111-1111-111111111111");

    /// <summary>
    /// Build a <see cref="ControllerContext"/> whose HttpContext.User carries a
    /// "countyId" claim equal to <paramref name="countyId"/>. This satisfies
    /// the typical
    ///   <c>ResolveCountyScopeToken(null)</c> → Request.Headers fallback →
    ///   User.FindFirst("countyId")
    /// path used by TerraForgeController and friends without forcing every
    /// test method to pass an explicit countyId argument.
    /// </summary>
    public static ControllerContext WithCountyClaim(Guid countyId)
    {
        return new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    new[] { new Claim("countyId", countyId.ToString()) },
                    "TestAuth")),
            },
        };
    }

    /// <summary>
    /// Build an <see cref="ICountyResolver"/> mock that returns the given
    /// <paramref name="countyId"/> for any input string. Use this when the
    /// test scope is single-county (typical for unit tests of county-scoped
    /// endpoints — county isolation is exercised by separate tests).
    /// </summary>
    public static ICountyResolver CountyResolverFor(Guid countyId)
    {
        var resolver = new Mock<ICountyResolver>();
        resolver
            .Setup(r => r.ResolveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(countyId);
        resolver
            .Setup(r => r.TryResolveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(countyId);
        return resolver.Object;
    }

    /// <summary>
    /// Build the same authenticated canonical county binding used by protected
    /// TerraForge endpoints. The actor's authority token and resolver converge
    /// on exactly one county.
    /// </summary>
    public static AuthenticatedCanonicalCountyContextProvider CountyContextProviderFor(
        Guid countyId)
    {
        var accessor = new Mock<IRequestUserContextAccessor>();
        accessor.SetupGet(candidate => candidate.Current).Returns(new RequestUserContext(
            true,
            "test-assessor",
            countyId.ToString("D"),
            ["Assessor"]));
        var canonicalResolver = CanonicalCountyResolverFor(countyId, "wa-benton");
        return new AuthenticatedCanonicalCountyContextProvider(
            new AuthenticatedCountyAuthorityBinding(accessor.Object, canonicalResolver),
            new AuthenticatedCanonicalCountyContext(canonicalResolver));
    }

    private static ICountyResolver CanonicalCountyResolverFor(Guid countyId, string canonicalKey)
    {
        var resolver = new Mock<ICountyResolver>();
        resolver
            .Setup(candidate => candidate.TryResolveAsync(
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns<string, CancellationToken>((value, _) =>
            {
                if (Guid.TryParse(value, out var parsed))
                {
                    return Task.FromResult<Guid?>(parsed == countyId ? countyId : null);
                }

                return Task.FromResult<Guid?>(
                    string.Equals(value, canonicalKey, StringComparison.OrdinalIgnoreCase)
                        ? countyId
                        : null);
            });
        return resolver.Object;
    }

    /// <summary>
    /// Build an <see cref="ICountyResolver"/> mock that "echoes" any Guid-shaped
    /// input string back as the resolved Guid. Non-Guid inputs throw
    /// <see cref="CountyNotFoundException"/> on <c>ResolveAsync</c> and resolve
    /// to <c>null</c> on <c>TryResolveAsync</c>. Use this when the controller
    /// is expected to resolve <em>both</em> the claim/header path AND the
    /// request countyId path through the same Guid (common in tests that pin
    /// the service-mock call to a specific local Guid).
    /// </summary>
    public static ICountyResolver EchoCountyResolver()
    {
        var resolver = new Mock<ICountyResolver>();
        resolver
            .Setup(r => r.ResolveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns<string, CancellationToken>((s, _) =>
                Guid.TryParse(s, out var g)
                    ? Task.FromResult(g)
                    : throw new CountyNotFoundException(s));
        resolver
            .Setup(r => r.TryResolveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns<string, CancellationToken>((s, _) =>
                Guid.TryParse(s, out var g)
                    ? Task.FromResult<Guid?>(g)
                    : Task.FromResult<Guid?>(null));
        return resolver.Object;
    }
}
