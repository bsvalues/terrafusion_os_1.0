using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace PACSIntegration.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PropertiesController : ControllerBase
    {
        private readonly DatabaseContext _context;
        private readonly ILogger<PropertiesController> _logger;

        public PropertiesController(
            DatabaseContext context,
            ILogger<PropertiesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetProperties(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string sortBy = "PropertyID",
            [FromQuery] string sortOrder = "asc",
            [FromQuery] string search = null)
        {
            try
            {
                var tenantId = HttpContext.Items["TenantID"] as int?;
                if (!tenantId.HasValue)
                    return Unauthorized("Tenant ID not found");

                // Start with base query
                var query = _context.Properties
                    .Where(p => p.TenantID == tenantId);

                // Apply search if provided
                if (!string.IsNullOrWhiteSpace(search))
                {
                    query = query.Where(p =>
                        p.OwnerName.Contains(search) ||
                        p.Situs.Contains(search) ||
                        p.PropertyID.ToString().Contains(search));
                }

                // Apply sorting
                query = sortOrder.ToLower() == "desc" 
                    ? ApplySortingDescending(query, sortBy)
                    : ApplySortingAscending(query, sortBy);

                // Get total count for pagination
                var totalItems = await query.CountAsync();

                // Apply pagination
                var properties = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(p => new
                    {
                        p.PropertyID,
                        p.OwnerName,
                        p.Situs,
                        p.AppraisedValue,
                        p.GeoID,
                        PermitCount = _context.BuildingPermits
                            .Count(bp => bp.PropertyID == p.PropertyID),
                        LastPermitDate = _context.BuildingPermits
                            .Where(bp => bp.PropertyID == p.PropertyID)
                            .OrderByDescending(bp => bp.IssueDate)
                            .Select(bp => bp.IssueDate)
                            .FirstOrDefault()
                    })
                    .ToListAsync();

                return Ok(new
                {
                    Page = page,
                    PageSize = pageSize,
                    TotalItems = totalItems,
                    TotalPages = (int)Math.Ceiling((double)totalItems / pageSize),
                    SortBy = sortBy,
                    SortOrder = sortOrder,
                    Search = search,
                    Properties = properties
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving properties");
                return StatusCode(500, "An error occurred while retrieving properties");
            }
        }

        private IQueryable<Property> ApplySortingAscending(
            IQueryable<Property> query,
            string sortBy)
        {
            return sortBy.ToLower() switch
            {
                "owername" => query.OrderBy(p => p.OwnerName),
                "situs" => query.OrderBy(p => p.Situs),
                "appraisedvalue" => query.OrderBy(p => p.AppraisedValue),
                "geoid" => query.OrderBy(p => p.GeoID),
                _ => query.OrderBy(p => p.PropertyID)
            };
        }

        private IQueryable<Property> ApplySortingDescending(
            IQueryable<Property> query,
            string sortBy)
        {
            return sortBy.ToLower() switch
            {
                "owername" => query.OrderByDescending(p => p.OwnerName),
                "situs" => query.OrderByDescending(p => p.Situs),
                "appraisedvalue" => query.OrderByDescending(p => p.AppraisedValue),
                "geoid" => query.OrderByDescending(p => p.GeoID),
                _ => query.OrderByDescending(p => p.PropertyID)
            };
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProperty(int id)
        {
            try
            {
                var tenantId = HttpContext.Items["TenantID"] as int?;
                if (!tenantId.HasValue)
                    return Unauthorized("Tenant ID not found");

                var property = await _context.Properties
                    .Where(p => p.TenantID == tenantId && p.PropertyID == id)
                    .Select(p => new
                    {
                        p.PropertyID,
                        p.OwnerName,
                        p.Situs,
                        p.AppraisedValue,
                        p.GeoID,
                        p.LastSyncedAt,
                        Permits = _context.BuildingPermits
                            .Where(bp => bp.PropertyID == p.PropertyID)
                            .OrderByDescending(bp => bp.IssueDate)
                            .Select(bp => new
                            {
                                bp.PermitNumber,
                                bp.IssueDate,
                                bp.ExpirationDate,
                                bp.Status,
                                bp.Description,
                                bp.EstimatedValue
                            })
                            .ToList()
                    })
                    .FirstOrDefaultAsync();

                if (property == null)
                    return NotFound($"Property {id} not found");

                return Ok(property);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving property {PropertyId}", id);
                return StatusCode(500, "An error occurred while retrieving the property");
            }
        }
    }
}
