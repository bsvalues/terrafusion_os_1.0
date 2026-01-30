using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

/// <summary>
/// Entity Framework Configuration for NotificationPreferences
///
/// Database Configuration:
/// - Primary key on Id
/// - Unique constraint on UserId (one preferences record per user)
/// - Index on UserId for fast lookups
/// - Webhook URLs max length 500 characters
/// - Email addresses max length 256 characters (standard email max)
/// - Time/timezone strings max length 50 characters
///
/// THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
/// </summary>
public class NotificationPreferencesConfiguration : IEntityTypeConfiguration<NotificationPreferences>
{
    public void Configure(EntityTypeBuilder<NotificationPreferences> builder)
    {
        builder.ToTable("NotificationPreferences");

        // Primary key
        builder.HasKey(np => np.Id);

        // UserId configuration
        builder.Property(np => np.UserId)
            .IsRequired()
            .HasMaxLength(450); // Standard ASP.NET Identity UserId length

        builder.HasIndex(np => np.UserId)
            .IsUnique()
            .HasDatabaseName("IX_NotificationPreferences_UserId");

        // Email properties
        builder.Property(np => np.EmailAddress)
            .HasMaxLength(256);

        // Slack properties
        builder.Property(np => np.SlackWebhook)
            .HasMaxLength(500);

        // Teams properties
        builder.Property(np => np.TeamsWebhook)
            .HasMaxLength(500);

        // Daily summary properties
        builder.Property(np => np.DailySummaryTime)
            .HasMaxLength(10); // "HH:MM" format

        builder.Property(np => np.DailySummaryTimezone)
            .HasMaxLength(50); // Timezone identifier

        // Audit fields
        builder.Property(np => np.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Property(np => np.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");
    }
}
