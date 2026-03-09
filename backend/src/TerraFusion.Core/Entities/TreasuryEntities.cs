using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities;

/// <summary>
/// Property tax statement for a given parcel and tax year.
/// Write-lane: treasury.
/// </summary>
public class TaxStatement
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required] [StringLength(50)]
    public string ParcelId { get; set; } = string.Empty;

    public int TaxYear { get; set; }
    public decimal TotalDue { get; set; }
    public decimal Paid { get; set; }
    public decimal Balance { get; set; }

    public DateTime? DueDate { get; set; }

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TaxPayment> Payments { get; set; } = new List<TaxPayment>();
}

/// <summary>
/// Individual tax payment against a parcel.
/// Write-lane: treasury.
/// </summary>
public class TaxPayment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required] [StringLength(50)]
    public string ReceiptId { get; set; } = string.Empty;

    [Required] [StringLength(50)]
    public string ParcelId { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    [StringLength(30)]
    public string PaymentMethod { get; set; } = "check";

    public Guid? StatementId { get; set; }
    public TaxStatement? Statement { get; set; }

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Delinquency record for a parcel with outstanding taxes.
/// Write-lane: treasury.
/// </summary>
public class DelinquencyRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required] [StringLength(50)]
    public string ParcelId { get; set; } = string.Empty;

    public decimal AmountOverdue { get; set; }
    public int OldestDelinquentYear { get; set; }
    public bool IsDelinquent { get; set; }

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Installment payment plan for delinquent taxes per RCW 84.64.
/// Write-lane: treasury.
/// </summary>
public class InstallmentPlan
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required] [StringLength(50)]
    public string ParcelId { get; set; } = string.Empty;

    public int NumberOfPayments { get; set; }
    public decimal MonthlyAmount { get; set; }
    public decimal TotalAmount { get; set; }

    [StringLength(20)]
    public string Status { get; set; } = "active";

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Tax sale proceeding per RCW 84.64.
/// Write-lane: treasury.
/// </summary>
public class TaxSale
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required] [StringLength(50)]
    public string ParcelId { get; set; } = string.Empty;

    [StringLength(20)]
    public string Status { get; set; } = "initiated";

    public DateTime? ScheduledDate { get; set; }
    public decimal TotalOwed { get; set; }

    [StringLength(500)]
    public string? DelinquentYears { get; set; }

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
