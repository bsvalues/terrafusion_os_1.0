// TMR-087: Zillow data routes
using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;
using TerraFusion.DataMining.Services;

namespace TerraFusion.DataMining.API
{
    /// <summary>
    /// Minimal API route definitions for Zillow property data access.
    /// </summary>
    public static class ZillowRoutes
    {
        /// <summary>
        /// Maps Zillow data routes to the endpoint route builder.
        /// </summary>
        /// <param name="app">The endpoint route builder.</param>
        /// <returns>The route group builder for chaining.</returns>
        public static RouteGroupBuilder MapZillowRoutes(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/datamining/zillow")
                .WithTags("Zillow Data");

            group.MapGet("/estimate", async (
                string address,
                string city,
                string state,
                IZillowService zillowService,
                ILoggerFactory loggerFactory) =>
            {
                var logger = loggerFactory.CreateLogger("ZillowRoutes");
                logger.LogInformation(
                    "[Zillow] Getting estimate for {Address}, {City}, {State}",
                    address, city, state);

                var estimate = await zillowService.GetEstimateByAddressAsync(
                    address, city, state);

                if (estimate == null)
                    return Results.NotFound(new
                    {
                        message = $"No Zillow estimate found for '{address}, {city}, {state}'"
                    });

                return Results.Ok(estimate);
            })
            .WithName("GetZillowEstimate")
            .WithSummary("Gets a Zillow Zestimate for a property by address.");

            group.MapGet("/comparables", async (
                string address,
                string city,
                string state,
                int? count,
                IZillowService zillowService,
                ILoggerFactory loggerFactory) =>
            {
                var logger = loggerFactory.CreateLogger("ZillowRoutes");
                logger.LogInformation(
                    "[Zillow] Getting comparables for {Address}, {City}, {State}",
                    address, city, state);

                var comps = await zillowService.GetComparablesAsync(
                    address, city, state, count ?? 10);

                return Results.Ok(new
                {
                    address,
                    city,
                    state,
                    comparables = comps,
                    count = comps.Count,
                });
            })
            .WithName("GetZillowComparables")
            .WithSummary("Gets comparable properties from Zillow for a given address.");

            group.MapGet("/health", async (
                IZillowService zillowService,
                ILoggerFactory loggerFactory) =>
            {
                var logger = loggerFactory.CreateLogger("ZillowRoutes");
                logger.LogDebug("[Zillow] Health check");

                var connected = await zillowService.TestConnectivityAsync();
                return Results.Ok(new
                {
                    status = connected ? "connected" : "disconnected",
                    connected,
                });
            })
            .WithName("ZillowHealth")
            .WithSummary("Checks Zillow API connectivity.");

            return group;
        }
    }
}
