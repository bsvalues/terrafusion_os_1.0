using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PACSIntegration.Models.CostApproach;

namespace PACSIntegration.Services.CostApproach
{
    public class CostApproachService : ICostApproachService
    {
        private readonly DatabaseContext _context;
        private readonly ILogger<CostApproachService> _logger;

        public CostApproachService(
            DatabaseContext context,
            ILogger<CostApproachService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<ValuationResult> CalculateValueAsync(ValuationRequest request)
        {
            try
            {
                // Validate property exists
                var property = await _context.Properties
                    .FirstOrDefaultAsync(p => p.PropertyID == request.PropertyID && 
                                            p.TenantID == request.TenantID);
                
                if (property == null)
                    throw new NotFoundException($"Property {request.PropertyID} not found");

                // Get cost factors
                var costFactor = await _context.Set<CostFactor>()
                    .Where(cf => cf.TenantID == request.TenantID &&
                                cf.BuildingType == request.BuildingType &&
                                cf.EffectiveDate <= DateTime.UtcNow)
                    .OrderByDescending(cf => cf.EffectiveDate)
                    .FirstOrDefaultAsync();

                if (costFactor == null)
                    throw new InvalidOperationException($"No cost factors found for building type {request.BuildingType}");

                // Get regional adjustment
                var regionalAdjustment = await _context.Set<RegionalAdjustment>()
                    .Where(ra => ra.TenantID == request.TenantID &&
                                ra.Region == request.Region &&
                                ra.EffectiveDate <= DateTime.UtcNow)
                    .OrderByDescending(ra => ra.EffectiveDate)
                    .FirstOrDefaultAsync();

                // Calculate RCN
                var rcn = CalculateReplacementCostNew(
                    request.BuildingAreaSqFt,
                    costFactor,
                    regionalAdjustment);

                // Calculate depreciation
                var depreciation = await CalculateDepreciationAsync(
                    request.TenantID,
                    request.BuildingType,
                    request.Age,
                    rcn);

                // Calculate land value
                var landValue = await CalculateLandValueAsync(
                    request.TenantID,
                    request.Location,
                    request.LandAreaAcres);

                // Calculate total value
                var totalValue = rcn - depreciation + landValue;

                // Save valuation history
                await SaveValuationHistoryAsync(new ValuationHistory
                {
                    PropertyID = request.PropertyID,
                    TenantID = request.TenantID,
                    ReplacementCostNew = rcn,
                    Depreciation = depreciation,
                    LandValue = landValue,
                    TotalValue = totalValue,
                    ValuationDate = DateTime.UtcNow
                });

                return new ValuationResult
                {
                    PropertyID = request.PropertyID,
                    ReplacementCostNew = rcn,
                    Depreciation = depreciation,
                    LandValue = landValue,
                    TotalValue = totalValue,
                    Breakdown = new ValuationBreakdown
                    {
                        BaseCost = costFactor.CostPerSqFt * request.BuildingAreaSqFt,
                        MaterialCost = costFactor.MaterialCostFactor * request.BuildingAreaSqFt,
                        LaborCost = costFactor.LaborCostFactor * request.BuildingAreaSqFt,
                        RegionalAdjustment = regionalAdjustment?.CostMultiplier ?? 1.0m,
                        DepreciationRate = depreciation / rcn * 100,
                        LandValuePerAcre = landValue / request.LandAreaAcres
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating value for property {PropertyId}", 
                    request.PropertyID);
                throw;
            }
        }

        private decimal CalculateReplacementCostNew(
            double buildingAreaSqFt,
            CostFactor costFactor,
            RegionalAdjustment regionalAdjustment)
        {
            var baseCost = costFactor.CostPerSqFt +
                          costFactor.MaterialCostFactor +
                          costFactor.LaborCostFactor;

            var adjustedCost = baseCost * (decimal)buildingAreaSqFt;

            if (regionalAdjustment != null)
            {
                adjustedCost *= regionalAdjustment.CostMultiplier;
            }

            return Math.Round(adjustedCost, 2);
        }

        private async Task<decimal> CalculateDepreciationAsync(
            int tenantId,
            string buildingType,
            int age,
            decimal rcn)
        {
            var depreciationRate = await _context.Set<DepreciationRate>()
                .Where(dr => dr.TenantID == tenantId &&
                            dr.BuildingType == buildingType &&
                            dr.Age <= age &&
                            dr.EffectiveDate <= DateTime.UtcNow)
                .OrderByDescending(dr => dr.Age)
                .ThenByDescending(dr => dr.EffectiveDate)
                .FirstOrDefaultAsync();

            if (depreciationRate == null)
                return 0;

            return Math.Round(rcn * (depreciationRate.DepreciationPercentage / 100), 2);
        }

        private async Task<decimal> CalculateLandValueAsync(
            int tenantId,
            string location,
            double acres)
        {
            var landValue = await _context.Set<LandValue>()
                .Where(lv => lv.TenantID == tenantId &&
                            lv.Location == location &&
                            lv.EffectiveDate <= DateTime.UtcNow)
                .OrderByDescending(lv => lv.EffectiveDate)
                .FirstOrDefaultAsync();

            if (landValue == null)
                return 0;

            return Math.Round(landValue.ValuePerAcre * landValue.AdjustmentFactor * (decimal)acres, 2);
        }

        private async Task SaveValuationHistoryAsync(ValuationHistory valuation)
        {
            _context.Set<ValuationHistory>().Add(valuation);
            await _context.SaveChangesAsync();
        }

        public async Task<List<ValuationHistory>> GetValuationHistoryAsync(
            int propertyId,
            int tenantId,
            DateTime? startDate = null,
            DateTime? endDate = null)
        {
            var query = _context.Set<ValuationHistory>()
                .Where(vh => vh.PropertyID == propertyId &&
                            vh.TenantID == tenantId);

            if (startDate.HasValue)
                query = query.Where(vh => vh.ValuationDate >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(vh => vh.ValuationDate <= endDate.Value);

            return await query
                .OrderByDescending(vh => vh.ValuationDate)
                .ToListAsync();
        }
    }

    public class ValuationRequest
    {
        public int PropertyID { get; set; }
        public int TenantID { get; set; }
        public string BuildingType { get; set; }
        public double BuildingAreaSqFt { get; set; }
        public double LandAreaAcres { get; set; }
        public int Age { get; set; }
        public string Location { get; set; }
        public string Region { get; set; }
    }

    public class ValuationResult
    {
        public int PropertyID { get; set; }
        public decimal ReplacementCostNew { get; set; }
        public decimal Depreciation { get; set; }
        public decimal LandValue { get; set; }
        public decimal TotalValue { get; set; }
        public ValuationBreakdown Breakdown { get; set; }
    }

    public class ValuationBreakdown
    {
        public decimal BaseCost { get; set; }
        public decimal MaterialCost { get; set; }
        public decimal LaborCost { get; set; }
        public decimal RegionalAdjustment { get; set; }
        public decimal DepreciationRate { get; set; }
        public decimal LandValuePerAcre { get; set; }
    }
}
