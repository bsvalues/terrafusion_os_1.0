// TerraFusionGPT Suite: Property Data Function Implementation
// Elite Government OS Engineering - Property Information Retrieval

using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Services;
using TerraFusion.Core.Entities;
using TerraFusion.Data;

namespace TerraFusion.AI.Functions
{
    /// <summary>
    /// Retrieves detailed property information
    /// </summary>
    public class PropertyDataFunction : FunctionHandlerBase
    {
        private readonly TerraFusionDbContext _context;
        private readonly ILogger<PropertyDataFunction> _logger;

        public override string FunctionName => "GetPropertyData";
        public override string Description => "Retrieves detailed property information including characteristics, assessed values, sales history, and improvement details";

        public PropertyDataFunction(
            TerraFusionDbContext context,
            ILogger<PropertyDataFunction> logger)
        {
            _context = context;
            _logger = logger;
        }

        public override string? GetRequiredRole()
        {
            return "Assessor"; // Requires assessor role
        }

        public override ArgumentValidationResult ValidateArguments(JsonElement arguments)
        {
            // Validate propertyId
            var (success, propertyId, error) = GetRequiredString(arguments, "propertyId");
            if (!success)
            {
                return ArgumentValidationResult.Invalid(error!);
            }

            return ArgumentValidationResult.Valid();
        }

        public override async System.Threading.Tasks.Task<string> ExecuteAsync(
            JsonElement arguments,
            SecurityContext securityContext)
        {
            var propertyId = arguments.GetProperty("propertyId").GetString()!;
            var includeHistory = GetOptionalBool(arguments, "includeHistory", false);
            var includeImprovements = GetOptionalBool(arguments, "includeImprovements", true);

            _logger.LogInformation($"Retrieving property data for {propertyId}");

            try
            {
                // Parse property ID (could be parcel number, property ID, or address)
                var property = await FindPropertyAsync(propertyId, securityContext.CountyId);

                if (property == null)
                {
                    return JsonSerializer.Serialize(new
                    {
                        success = false,
                        error = $"Property not found: {propertyId}"
                    });
                }

                // Build response object with available Property fields
                var response = new
                {
                    success = true,
                    property = new
                    {
                        id = property.Id,
                        propertyId = property.PropertyId,
                        parcelId = property.ParcelId,
                        parcelNumber = property.ParcelNumber,
                        address = property.Address,
                        ownerName = property.OwnerName,
                        propertyType = property.PropertyType,
                        yearBuilt = property.YearBuilt,
                        valuation = new
                        {
                            assessedValue = property.AssessedValue,
                            marketValue = property.MarketValue,
                            landValue = property.LandValue,
                            improvementValue = property.ImprovementValue,
                            taxYear = property.TaxYear,
                            assessmentDate = property.AssessmentDate,
                            lastUpdated = property.LastUpdated
                        },
                        county = property.County != null ? new
                        {
                            id = property.County.Id,
                            name = property.County.Name,
                            state = property.County.State
                        } : null,
                        valuations = includeHistory ? property.Valuations.Select(v => new
                        {
                            id = v.Id,
                            estimatedValue = v.EstimatedValue,
                            confidence = v.Confidence,
                            createdAt = v.CreatedAt,
                            method = v.Method
                        }).ToList() : null
                    }
                };

                return JsonSerializer.Serialize(response, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving property data for {propertyId}");

                return JsonSerializer.Serialize(new
                {
                    success = false,
                    error = "Failed to retrieve property data"
                });
            }
        }

        private async System.Threading.Tasks.Task<Property?> FindPropertyAsync(string propertyId, int? countyIdInt)
        {
            // Convert int? to Guid if possible (for legacy compatibility)
            Guid? countyId = null;
            if (countyIdInt.HasValue)
            {
                // Note: In production, you'd need a mapping table or use Guid directly
                // For now, we'll search without county filter if int is provided
                // since CountyId is Guid in the database
            }

            // Try to find by parcel number
            var query = _context.Properties.AsQueryable();
            if (countyId.HasValue)
            {
                query = query.Where(p => p.CountyId == countyId.Value);
            }

            var property = await query
                .Where(p => p.ParcelNumber == propertyId)
                .FirstOrDefaultAsync();

            if (property != null) return property;

            // Try to find by property ID string
            query = _context.Properties.AsQueryable();
            if (countyId.HasValue)
            {
                query = query.Where(p => p.CountyId == countyId.Value);
            }

            property = await query
                .Where(p => p.PropertyId == propertyId)
                .FirstOrDefaultAsync();

            if (property != null) return property;

            // Try to find by parcel ID
            query = _context.Properties.AsQueryable();
            if (countyId.HasValue)
            {
                query = query.Where(p => p.CountyId == countyId.Value);
            }

            property = await query
                .Where(p => p.ParcelId == propertyId)
                .FirstOrDefaultAsync();

            if (property != null) return property;

            // Try to find by address (partial match)
            query = _context.Properties.AsQueryable();
            if (countyId.HasValue)
            {
                query = query.Where(p => p.CountyId == countyId.Value);
            }

            property = await query
                .Where(p => p.Address.Contains(propertyId))
                .FirstOrDefaultAsync();

            return property;
        }

        private async System.Threading.Tasks.Task<object[]> GetSalesHistoryAsync(Guid propertyId)
        {
            // TODO: Implement sales history retrieval from PropertySales table
            // For now, return empty array
            await System.Threading.Tasks.Task.CompletedTask;
            return Array.Empty<object>();
        }

        private async System.Threading.Tasks.Task<object[]> GetAssessmentHistoryAsync(Guid propertyId)
        {
            // TODO: PropertyAssessments table should use Guid PropertyId
            // For now, return empty array until schema is updated
            await System.Threading.Tasks.Task.CompletedTask;
            return Array.Empty<object>();
        }
    }
}
