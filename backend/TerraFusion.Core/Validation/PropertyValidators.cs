using FluentValidation;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using System.Text.RegularExpressions;

namespace TerraFusion.Core.Validation;

/// <summary>
/// Comprehensive input validation for Property-related operations
/// Implements FluentValidation for robust, government-compliant data validation
/// </summary>
public class PropertyCreateRequestValidator : AbstractValidator<PropertyCreateRequest>
{
    public PropertyCreateRequestValidator()
    {
        RuleFor(x => x.ParcelId)
            .NotEmpty().WithMessage("Parcel ID is required")
            .Length(6, 20).WithMessage("Parcel ID must be between 6 and 20 characters")
            .Matches(@"^[A-Za-z0-9\-]+$").WithMessage("Parcel ID can only contain letters, numbers, and hyphens");

        RuleFor(x => x.CountyId)
            .NotEmpty().WithMessage("County ID is required")
            .Must(BeValidGuid).WithMessage("County ID must be a valid GUID");

        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("Address is required")
            .Length(5, 200).WithMessage("Address must be between 5 and 200 characters")
            .Must(BeValidAddress).WithMessage("Address contains invalid characters");

        RuleFor(x => x.PropertyType)
            .NotEmpty().WithMessage("Property type is required")
            .Must(BeValidPropertyType).WithMessage("Property type must be Residential, Commercial, Agricultural, or Industrial");

        RuleFor(x => x.AssessedValue)
            .GreaterThan(0).WithMessage("Assessed value must be greater than 0")
            .LessThan(100_000_000).WithMessage("Assessed value cannot exceed $100,000,000");

        RuleFor(x => x.YearBuilt)
            .GreaterThan(1800).WithMessage("Year built must be after 1800")
            .LessThanOrEqualTo(DateTime.Now.Year + 1).WithMessage("Year built cannot be in the future");

        RuleFor(x => x.LotSize)
            .GreaterThan(0).WithMessage("Lot size must be greater than 0")
            .LessThan(1_000_000).WithMessage("Lot size cannot exceed 1,000,000 square feet");

        RuleFor(x => x.SquareFootage)
            .GreaterThan(0).WithMessage("Square footage must be greater than 0")
            .LessThan(50_000).WithMessage("Square footage cannot exceed 50,000");

        RuleFor(x => x.Bedrooms)
            .GreaterThanOrEqualTo(0).WithMessage("Bedrooms cannot be negative")
            .LessThan(20).WithMessage("Bedrooms cannot exceed 20");

        RuleFor(x => x.Bathrooms)
            .GreaterThanOrEqualTo(0).WithMessage("Bathrooms cannot be negative")
            .LessThan(20).WithMessage("Bathrooms cannot exceed 20");

        When(x => !string.IsNullOrEmpty(x.ZipCode), () =>
        {
            RuleFor(x => x.ZipCode)
                .Matches(@"^\d{5}(-\d{4})?$").WithMessage("ZIP code must be in format 12345 or 12345-6789");
        });

        When(x => !string.IsNullOrEmpty(x.OwnerName), () =>
        {
            RuleFor(x => x.OwnerName)
                .Length(2, 100).WithMessage("Owner name must be between 2 and 100 characters")
                .Must(BeValidName).WithMessage("Owner name contains invalid characters");
        });
    }

    private bool BeValidGuid(Guid guid)
    {
        return guid != Guid.Empty;
    }

    private bool BeValidGuid(Guid? guid)
    {
        return guid.HasValue && guid.Value != Guid.Empty;
    }

    private bool BeValidAddress(string address)
    {
        if (string.IsNullOrWhiteSpace(address)) return false;
        
        // Allow letters, numbers, spaces, commas, periods, hyphens, apostrophes, and hash symbols
        return Regex.IsMatch(address, @"^[A-Za-z0-9\s,\.\-'#]+$");
    }

    private bool BeValidPropertyType(string? propertyType)
    {
        var validTypes = new[] { "Residential", "Commercial", "Agricultural", "Industrial" };
        return validTypes.Contains(propertyType, StringComparer.OrdinalIgnoreCase);
    }

    private bool BeValidName(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return false;
        
        // Allow letters, spaces, hyphens, apostrophes, and periods
        return Regex.IsMatch(name, @"^[A-Za-z\s\-'.]+$");
    }
}

public class PropertyUpdateRequestValidator : AbstractValidator<PropertyUpdateRequest>
{
    public PropertyUpdateRequestValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Property ID is required")
            .Must(BeValidGuid).WithMessage("Property ID must be a valid GUID");

        RuleFor(x => x.ParcelId)
            .NotEmpty().WithMessage("Parcel ID is required")
            .Length(6, 20).WithMessage("Parcel ID must be between 6 and 20 characters")
            .Matches(@"^[A-Za-z0-9\-]+$").WithMessage("Parcel ID can only contain letters, numbers, and hyphens");

        RuleFor(x => x.CountyId)
            .NotEmpty().WithMessage("County ID is required")
            .Must(BeValidGuid).WithMessage("County ID must be a valid GUID");

        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("Address is required")
            .Length(5, 200).WithMessage("Address must be between 5 and 200 characters")
            .Must(BeValidAddress).WithMessage("Address contains invalid characters");

        RuleFor(x => x.PropertyType)
            .NotEmpty().WithMessage("Property type is required")
            .Must(BeValidPropertyType).WithMessage("Property type must be Residential, Commercial, Agricultural, or Industrial");

        RuleFor(x => x.AssessedValue)
            .GreaterThan(0).WithMessage("Assessed value must be greater than 0")
            .LessThan(100_000_000).WithMessage("Assessed value cannot exceed $100,000,000");

        RuleFor(x => x.YearBuilt)
            .GreaterThan(1800).WithMessage("Year built must be after 1800")
            .LessThanOrEqualTo(DateTime.Now.Year + 1).WithMessage("Year built cannot be in the future");

        RuleFor(x => x.LotSize)
            .GreaterThan(0).WithMessage("Lot size must be greater than 0")
            .LessThan(1_000_000).WithMessage("Lot size cannot exceed 1,000,000 square feet");

        RuleFor(x => x.SquareFootage)
            .GreaterThan(0).WithMessage("Square footage must be greater than 0")
            .LessThan(50_000).WithMessage("Square footage cannot exceed 50,000");

        RuleFor(x => x.Bedrooms)
            .GreaterThanOrEqualTo(0).WithMessage("Bedrooms cannot be negative")
            .LessThan(20).WithMessage("Bedrooms cannot exceed 20");

        RuleFor(x => x.Bathrooms)
            .GreaterThanOrEqualTo(0).WithMessage("Bathrooms cannot be negative")
            .LessThan(20).WithMessage("Bathrooms cannot exceed 20");

        When(x => !string.IsNullOrEmpty(x.ZipCode), () =>
        {
            RuleFor(x => x.ZipCode)
                .Matches(@"^\d{5}(-\d{4})?$").WithMessage("ZIP code must be in format 12345 or 12345-6789");
        });

        When(x => !string.IsNullOrEmpty(x.OwnerName), () =>
        {
            RuleFor(x => x.OwnerName)
                .Length(2, 100).WithMessage("Owner name must be between 2 and 100 characters")
                .Must(BeValidName).WithMessage("Owner name contains invalid characters");
        });
    }

    private bool BeValidGuid(Guid guid)
    {
        return guid != Guid.Empty;
    }

    private bool BeValidGuid(Guid? guid)
    {
        return guid.HasValue && guid.Value != Guid.Empty;
    }

    private bool BeValidAddress(string address)
    {
        if (string.IsNullOrWhiteSpace(address)) return false;
        
        return Regex.IsMatch(address, @"^[A-Za-z0-9\s,\.\-'#]+$");
    }

    private bool BeValidPropertyType(string? propertyType)
    {
        var validTypes = new[] { "Residential", "Commercial", "Agricultural", "Industrial" };
        return validTypes.Contains(propertyType, StringComparer.OrdinalIgnoreCase);
    }

    private bool BeValidName(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return false;
        
        return Regex.IsMatch(name, @"^[A-Za-z\s\-'.]+$");
    }
}

public class PropertySearchRequestValidator : AbstractValidator<PropertySearchRequest>
{
    public PropertySearchRequestValidator()
    {
        When(x => x.CountyId.HasValue, () =>
        {
            RuleFor(x => x.CountyId)
                .Must(BeValidGuid).WithMessage("County ID must be a valid GUID");
        });

        When(x => !string.IsNullOrEmpty(x.Address), () =>
        {
            RuleFor(x => x.Address)
                .Length(3, 100).WithMessage("Address search must be between 3 and 100 characters")
                .Must(BeValidSearchText).WithMessage("Address search contains invalid characters");
        });

        When(x => !string.IsNullOrEmpty(x.ParcelId), () =>
        {
            RuleFor(x => x.ParcelId)
                .Length(3, 20).WithMessage("Parcel ID search must be between 3 and 20 characters")
                .Matches(@"^[A-Za-z0-9\-\*\?]+$").WithMessage("Parcel ID search can only contain letters, numbers, hyphens, and wildcards");
        });

        When(x => !string.IsNullOrEmpty(x.PropertyType), () =>
        {
            RuleFor(x => x.PropertyType)
                .Must(BeValidPropertyType).WithMessage("Property type must be Residential, Commercial, Agricultural, or Industrial");
        });

        When(x => x.MinAssessedValue.HasValue, () =>
        {
            RuleFor(x => x.MinAssessedValue)
                .GreaterThanOrEqualTo(0).WithMessage("Minimum assessed value cannot be negative")
                .LessThan(100_000_000).WithMessage("Minimum assessed value cannot exceed $100,000,000");
        });

        When(x => x.MaxAssessedValue.HasValue, () =>
        {
            RuleFor(x => x.MaxAssessedValue)
                .GreaterThan(0).WithMessage("Maximum assessed value must be greater than 0")
                .LessThan(100_000_000).WithMessage("Maximum assessed value cannot exceed $100,000,000");
        });

        When(x => x.MinAssessedValue.HasValue && x.MaxAssessedValue.HasValue, () =>
        {
            RuleFor(x => x.MaxAssessedValue)
                .GreaterThan(x => x.MinAssessedValue)
                .WithMessage("Maximum assessed value must be greater than minimum assessed value");
        });

        When(x => x.YearBuiltFrom.HasValue, () =>
        {
            RuleFor(x => x.YearBuiltFrom)
                .GreaterThan(1800).WithMessage("Year built from must be after 1800")
                .LessThanOrEqualTo(DateTime.Now.Year).WithMessage("Year built from cannot be in the future");
        });

        When(x => x.YearBuiltTo.HasValue, () =>
        {
            RuleFor(x => x.YearBuiltTo)
                .GreaterThan(1800).WithMessage("Year built to must be after 1800")
                .LessThanOrEqualTo(DateTime.Now.Year + 1).WithMessage("Year built to cannot be in the future");
        });

        When(x => x.YearBuiltFrom.HasValue && x.YearBuiltTo.HasValue, () =>
        {
            RuleFor(x => x.YearBuiltTo)
                .GreaterThanOrEqualTo(x => x.YearBuiltFrom)
                .WithMessage("Year built to must be greater than or equal to year built from");
        });

        RuleFor(x => x.Page)
            .GreaterThan(0).WithMessage("Page must be greater than 0")
            .LessThan(1000).WithMessage("Page cannot exceed 1000");

        RuleFor(x => x.PageSize)
            .GreaterThan(0).WithMessage("Page size must be greater than 0")
            .LessThanOrEqualTo(500).WithMessage("Page size cannot exceed 500");

        When(x => !string.IsNullOrEmpty(x.SortBy), () =>
        {
            RuleFor(x => x.SortBy)
                .Must(BeValidSortField).WithMessage("Invalid sort field. Valid options: ParcelId, Address, AssessedValue, YearBuilt, PropertyType");
        });
    }

    private bool BeValidGuid(Guid guid)
    {
        return guid != Guid.Empty;
    }

    private bool BeValidGuid(Guid? guid)
    {
        return guid.HasValue && guid.Value != Guid.Empty;
    }

    private bool BeValidSearchText(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return false;
        
        // Allow letters, numbers, spaces, common punctuation, and wildcards
        return Regex.IsMatch(text, @"^[A-Za-z0-9\s,\.\-'#\*\?]+$");
    }

    private bool BeValidPropertyType(string? propertyType)
    {
        var validTypes = new[] { "Residential", "Commercial", "Agricultural", "Industrial" };
        return validTypes.Contains(propertyType, StringComparer.OrdinalIgnoreCase);
    }

    private bool BeValidSortField(string? sortField)
    {
        var validFields = new[] { "ParcelId", "Address", "AssessedValue", "YearBuilt", "PropertyType" };
        return validFields.Contains(sortField, StringComparer.OrdinalIgnoreCase);
    }
}

public class AssessmentCreateRequestValidator : AbstractValidator<AssessmentCreateRequest>
{
    public AssessmentCreateRequestValidator()
    {
        RuleFor(x => x.PropertyId)
            .NotEmpty().WithMessage("Property ID is required")
            .Must(BeValidGuid).WithMessage("Property ID must be a valid GUID");

        RuleFor(x => x.AssessmentYear)
            .GreaterThan(1990).WithMessage("Assessment year must be after 1990")
            .LessThanOrEqualTo(DateTime.Now.Year + 1).WithMessage("Assessment year cannot be more than 1 year in the future");

        RuleFor(x => x.LandValue)
            .GreaterThanOrEqualTo(0).WithMessage("Land value cannot be negative")
            .LessThan(50_000_000).WithMessage("Land value cannot exceed $50,000,000");

        RuleFor(x => x.ImprovementValue)
            .GreaterThanOrEqualTo(0).WithMessage("Improvement value cannot be negative")
            .LessThan(50_000_000).WithMessage("Improvement value cannot exceed $50,000,000");

        RuleFor(x => x.TotalAssessedValue)
            .GreaterThan(0).WithMessage("Total assessed value must be greater than 0")
            .LessThan(100_000_000).WithMessage("Total assessed value cannot exceed $100,000,000")
            .Must((model, totalValue) => totalValue >= model.LandValue + model.ImprovementValue)
            .WithMessage("Total assessed value must be at least the sum of land and improvement values");

        When(x => !string.IsNullOrEmpty(x.AssessorNotes), () =>
        {
            RuleFor(x => x.AssessorNotes)
                .Length(1, 1000).WithMessage("Assessor notes must be between 1 and 1000 characters")
                .Must(BeValidNotes).WithMessage("Assessor notes contain invalid characters");
        });

        RuleFor(x => x.EffectiveDate)
            .NotEmpty().WithMessage("Effective date is required")
            .LessThanOrEqualTo(DateTime.Now.AddDays(1)).WithMessage("Effective date cannot be more than 1 day in the future");
    }

    private bool BeValidGuid(Guid guid)
    {
        return guid != Guid.Empty;
    }

    private bool BeValidGuid(Guid? guid)
    {
        return guid.HasValue && guid.Value != Guid.Empty;
    }

    private bool BeValidNotes(string notes)
    {
        if (string.IsNullOrWhiteSpace(notes)) return true; // Optional field
        
        // Allow letters, numbers, spaces, common punctuation
        return Regex.IsMatch(notes, @"^[A-Za-z0-9\s,\.\-'#\(\)\[\]:;!\?""]+$");
    }
}

// User authentication and authorization validators
public class UserLoginRequestValidator : AbstractValidator<UserLoginRequest>
{
    public UserLoginRequestValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Username is required")
            .Length(3, 50).WithMessage("Username must be between 3 and 50 characters")
            .Matches(@"^[A-Za-z0-9._@-]+$").WithMessage("Username can only contain letters, numbers, periods, underscores, @ symbols, and hyphens");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .Length(8, 128).WithMessage("Password must be between 8 and 128 characters");
    }
}

public class UserRegistrationRequestValidator : AbstractValidator<UserRegistrationRequest>
{
    public UserRegistrationRequestValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Username is required")
            .Length(3, 50).WithMessage("Username must be between 3 and 50 characters")
            .Matches(@"^[A-Za-z0-9._@-]+$").WithMessage("Username can only contain letters, numbers, periods, underscores, @ symbols, and hyphens");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format")
            .Length(5, 100).WithMessage("Email must be between 5 and 100 characters");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .Length(8, 128).WithMessage("Password must be between 8 and 128 characters")
            .Matches(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$")
            .WithMessage("Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character");

        RuleFor(x => x.ConfirmPassword)
            .NotEmpty().WithMessage("Password confirmation is required")
            .Equal(x => x.Password).WithMessage("Password and confirmation password must match");

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required")
            .Length(2, 50).WithMessage("First name must be between 2 and 50 characters")
            .Must(BeValidName).WithMessage("First name contains invalid characters");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required")
            .Length(2, 50).WithMessage("Last name must be between 2 and 50 characters")
            .Must(BeValidName).WithMessage("Last name contains invalid characters");

        When(x => !string.IsNullOrEmpty(x.PhoneNumber), () =>
        {
            RuleFor(x => x.PhoneNumber)
                .Matches(@"^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$")
                .WithMessage("Phone number must be a valid US phone number");
        });

        RuleFor(x => x.CountyId)
            .NotEmpty().WithMessage("County ID is required")
            .Must(BeValidGuid).WithMessage("County ID must be a valid GUID");
    }

    private bool BeValidName(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return false;
        
        return Regex.IsMatch(name, @"^[A-Za-z\s\-'.]+$");
    }

    private bool BeValidGuid(Guid? guid)
    {
        return guid.HasValue && guid.Value != Guid.Empty;
    }

    private bool BeValidGuid(Guid guid)
    {
        return guid != Guid.Empty;
    }
}