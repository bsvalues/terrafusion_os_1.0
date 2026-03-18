// TMR-085: Unified property data routes
using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;
using TerraFusion.DataMining.Services;

namespace TerraFusion.DataMining.API
{
    /// <summary>
    /// Minimal API route definitions for unified real estate/property data.
    /// Aggregates data from PACS, GIS, Zillow, NARRPR, and PACMLS into
    /// a single set of endpoints.
    /// </summary>
    public static class RealEstateRoutes
    {
        /// <summary>
        /// Maps unified real estate data routes to the endpoint route builder.
        /// </summary>
        /// <param name="app">The endpoint route builder.</param>
        /// <returns>The route group builder for chaining.</returns>
        public static RouteGroupBuilder MapRealEstateRoutes(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/datamining/properties")
                .WithTags("Property Data");

            group.MapGet("/search", async (
                string? parcel,
                string? owner,
                string? address,
                string? countyId,
                int? maxResults,
                IPropertyService propertyService,
                ILoggerFactory loggerFactory) =>
            {
                var logger = loggerFactory.CreateLogger("RealEstateRoutes");
                logger.LogInformation(
                    "[Properties] Search: parcel={Parcel}, owner={Owner}, address={Address}",
                    parcel, owner, address);

                var criteria = new PropertySearchCriteria
                {
                    ParcelNumber = parcel,
                    OwnerName = owner,
                    Address = address,
                    CountyId = countyId ?? "benton",
                    MaxResults = maxResults ?? 50,
                };

                var result = await propertyService.SearchAsync(criteria);
                return Results.Ok(result);
            })
            .WithName("SearchProperties")
            .WithSummary("Searches property records across all data sources.");

            group.MapGet("/{countyId}/{parcelNumber}", async (
                string countyId,
                string parcelNumber,
                IPropertyService propertyService,
                ILoggerFactory loggerFactory) =>
            {
                var logger = loggerFactory.CreateLogger("RealEstateRoutes");
                logger.LogInformation(
                    "[Properties] Getting parcel {Parcel} in {County}",
                    parcelNumber, countyId);

                var record = await propertyService.GetByParcelAsync(parcelNumber, countyId);
                if (record == null)
                    return Results.NotFound(new { message = $"Parcel '{parcelNumber}' not found in {countyId}" });

                return Results.Ok(record);
            })
            .WithName("GetProperty")
            .WithSummary("Gets a specific property by county and parcel number.");

            group.MapGet("/{countyId}/{parcelNumber}/sales", async (
                string countyId,
                string parcelNumber,
                IPropertyService propertyService,
                ILoggerFactory loggerFactory) =>
            {
                var logger = loggerFactory.CreateLogger("RealEstateRoutes");
                logger.LogInformation(
                    "[Properties] Getting sales history for {Parcel}", parcelNumber);

                var sales = await propertyService.GetSalesHistoryAsync(parcelNumber);
                return Results.Ok(new { parcelNumber, countyId, sales });
            })
            .WithName("GetPropertySales")
            .WithSummary("Gets sales history for a property.");

            group.MapGet("/{countyId}/{parcelNumber}/cma", async (
                string countyId,
                string parcelNumber,
                ICmaService cmaService,
                ILoggerFactory loggerFactory) =>
            {
                var logger = loggerFactory.CreateLogger("RealEstateRoutes");
                logger.LogInformation(
                    "[Properties] Generating CMA for {Parcel} in {County}",
                    parcelNumber, countyId);

                var report = await cmaService.GenerateReportAsync(parcelNumber, countyId);
                return Results.Ok(report);
            })
            .WithName("GetPropertyCma")
            .WithSummary("Generates a Comparative Market Analysis for a property.");

            group.MapGet("/data-sources/health", async (
                Regional.IUnifiedAssessmentApi assessmentApi,
                ILoggerFactory loggerFactory) =>
            {
                var logger = loggerFactory.CreateLogger("RealEstateRoutes");
                logger.LogInformation("[Properties] Checking data source health");

                var health = await assessmentApi.GetDataSourceHealthAsync();
                return Results.Ok(health);
            })
            .WithName("PropertyDataSourceHealth")
            .WithSummary("Returns connectivity status for all property data sources.");

            return group;
        }
    }
}
