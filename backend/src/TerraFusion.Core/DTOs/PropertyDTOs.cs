using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.DTOs;

/// <summary>
/// Request DTO for creating a new property
/// Includes comprehensive validation attributes for government compliance
/// </summary>
public class PropertyCreateRequest
{
    [Required(ErrorMessage = "Parcel ID is required")]
    [StringLength(20, MinimumLength = 6, ErrorMessage = "Parcel ID must be between 6 and 20 characters")]
    public string ParcelId { get; set; } = string.Empty;

    [Required(ErrorMessage = "County ID is required")]
    public Guid CountyId { get; set; }

    [Required(ErrorMessage = "Address is required")]
    [StringLength(200, MinimumLength = 5, ErrorMessage = "Address must be between 5 and 200 characters")]
    public string Address { get; set; } = string.Empty;

    [StringLength(100)]
    public string? City { get; set; }

    [StringLength(2)]
    public string? State { get; set; }

    [RegularExpression(@"^\d{5}(-\d{4})?$", ErrorMessage = "ZIP code must be in format 12345 or 12345-6789")]
    public string? ZipCode { get; set; }

    [Required(ErrorMessage = "Property type is required")]
    [StringLength(50)]
    public string PropertyType { get; set; } = string.Empty;

    [Range(0.01, 100_000_000, ErrorMessage = "Assessed value must be between $0.01 and $100,000,000")]
    public decimal AssessedValue { get; set; }

    [Range(1800, 2030, ErrorMessage = "Year built must be between 1800 and 2030")]
    public int? YearBuilt { get; set; }

    [Range(0.01, 1_000_000, ErrorMessage = "Lot size must be between 0.01 and 1,000,000 square feet")]
    public decimal? LotSize { get; set; }

    [Range(0.01, 50_000, ErrorMessage = "Square footage must be between 0.01 and 50,000")]
    public decimal? SquareFootage { get; set; }

    [Range(0, 20, ErrorMessage = "Bedrooms must be between 0 and 20")]
    public int? Bedrooms { get; set; }

    [Range(0, 20, ErrorMessage = "Bathrooms must be between 0 and 20")]
    public decimal? Bathrooms { get; set; }

    [StringLength(100)]
    public string? OwnerName { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
}

/// <summary>
/// Request DTO for updating an existing property
/// </summary>
public class PropertyUpdateRequest : PropertyCreateRequest
{
    [Required(ErrorMessage = "Property ID is required")]
    public Guid Id { get; set; }
}

/// <summary>
/// Request DTO for searching properties with comprehensive filtering options
/// </summary>
public class PropertySearchRequest
{
    public Guid? CountyId { get; set; }

    [StringLength(100, MinimumLength = 3)]
    public string? Address { get; set; }

    [StringLength(20, MinimumLength = 3)]
    public string? ParcelId { get; set; }

    [StringLength(50)]
    public string? PropertyType { get; set; }

    [Range(0, 100_000_000)]
    public decimal? MinAssessedValue { get; set; }

    [Range(0, 100_000_000)]
    public decimal? MaxAssessedValue { get; set; }

    [Range(1800, 2030)]
    public int? YearBuiltFrom { get; set; }

    [Range(1800, 2030)]
    public int? YearBuiltTo { get; set; }

    [StringLength(100)]
    public string? OwnerName { get; set; }

    [StringLength(100)]
    public string? City { get; set; }

    [RegularExpression(@"^\d{5}(-\d{4})?$")]
    public string? ZipCode { get; set; }

    // Pagination
    [Range(1, 1000, ErrorMessage = "Page must be between 1 and 1000")]
    public int Page { get; set; } = 1;

    [Range(1, 500, ErrorMessage = "Page size must be between 1 and 500")]
    public int PageSize { get; set; } = 50;

    // Sorting
    public string? SortBy { get; set; }
    public bool SortDescending { get; set; } = false;
}

/// <summary>
/// Response DTO for property information
/// </summary>
public class PropertyResponse
{
    public Guid Id { get; set; }
    public string ParcelId { get; set; } = string.Empty;
    public Guid CountyId { get; set; }
    public string CountyName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
    public string PropertyType { get; set; } = string.Empty;
    public decimal AssessedValue { get; set; }
    public int? YearBuilt { get; set; }
    public decimal? LotSize { get; set; }
    public decimal? SquareFootage { get; set; }
    public int? Bedrooms { get; set; }
    public decimal? Bathrooms { get; set; }
    public string? OwnerName { get; set; }
    public string? Description { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Request DTO for creating property assessments
/// </summary>
public class AssessmentCreateRequest
{
    [Required(ErrorMessage = "Property ID is required")]
    public Guid PropertyId { get; set; }

    [Range(1990, 2030, ErrorMessage = "Assessment year must be between 1990 and 2030")]
    public int AssessmentYear { get; set; }

    [Range(0, 50_000_000, ErrorMessage = "Land value must be between $0 and $50,000,000")]
    public decimal LandValue { get; set; }

    [Range(0, 50_000_000, ErrorMessage = "Improvement value must be between $0 and $50,000,000")]
    public decimal ImprovementValue { get; set; }

    [Range(0.01, 100_000_000, ErrorMessage = "Total assessed value must be between $0.01 and $100,000,000")]
    public decimal TotalAssessedValue { get; set; }

    [StringLength(1000)]
    public string? AssessorNotes { get; set; }

    [Required(ErrorMessage = "Effective date is required")]
    public DateTime EffectiveDate { get; set; }
}

/// <summary>
/// Response DTO for property assessments
/// </summary>
public class AssessmentResponse
{
    public Guid Id { get; set; }
    public Guid PropertyId { get; set; }
    public string PropertyAddress { get; set; } = string.Empty;
    public string PropertyParcelId { get; set; } = string.Empty;
    public int AssessmentYear { get; set; }
    public decimal LandValue { get; set; }
    public decimal ImprovementValue { get; set; }
    public decimal TotalAssessedValue { get; set; }
    public string? AssessorNotes { get; set; }
    public DateTime EffectiveDate { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}

/// <summary>
/// User authentication DTOs
/// </summary>
public class UserLoginRequest
{
    [Required(ErrorMessage = "Username is required")]
    [StringLength(50, MinimumLength = 3)]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [StringLength(128, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;

    public bool RememberMe { get; set; } = false;
}

public class UserRegistrationRequest
{
    [Required(ErrorMessage = "Username is required")]
    [StringLength(50, MinimumLength = 3)]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [StringLength(100, MinimumLength = 5)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [StringLength(128, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password confirmation is required")]
    [Compare("Password", ErrorMessage = "Password and confirmation password must match")]
    public string ConfirmPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "First name is required")]
    [StringLength(50, MinimumLength = 2)]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Last name is required")]
    [StringLength(50, MinimumLength = 2)]
    public string LastName { get; set; } = string.Empty;

    [Phone(ErrorMessage = "Invalid phone number format")]
    public string? PhoneNumber { get; set; }

    [Required(ErrorMessage = "County ID is required")]
    public Guid CountyId { get; set; }
}

public class UserLoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserProfile User { get; set; } = new() 
    {
        Email = string.Empty,
        Roles = Array.Empty<string>()
    };
}

// UserProfile moved to AuthDTOs.cs to avoid duplicate

/// <summary>
/// API Response wrapper for consistent error handling
/// </summary>
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public string[]? Errors { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Paginated response wrapper
/// </summary>
public class PaginatedResponse<T>
{
    public IEnumerable<T> Data { get; set; } = Enumerable.Empty<T>();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}

/// <summary>
/// Validation error response
/// </summary>
public class ValidationErrorResponse
{
    public string Field { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public object? AttemptedValue { get; set; }
}