using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationPreferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "NotificationPreferences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: false),
                    EmailEnabled = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    EmailAddress = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    EmailCriticalAlerts = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    EmailWarningAlerts = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    EmailInfoAlerts = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    EmailDailySummary = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    EmailAchievements = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    SlackEnabled = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    SlackWebhook = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    SlackCriticalAlerts = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    SlackWarningAlerts = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    SlackInfoAlerts = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    SlackStatusUpdates = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    SlackDailySummary = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    SlackAchievements = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    TeamsEnabled = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    TeamsWebhook = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    TeamsCriticalAlerts = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    TeamsWarningAlerts = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    TeamsInfoAlerts = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    TeamsStatusUpdates = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    TeamsDailySummary = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    TeamsAchievements = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    UltimatePowerScoreThreshold = table.Column<double>(type: "REAL", nullable: false, defaultValue: 7.2),
                    DomainScoreThreshold = table.Column<double>(type: "REAL", nullable: false, defaultValue: 0.6),
                    CriticalAlertThreshold = table.Column<double>(type: "REAL", nullable: false, defaultValue: 7.2),
                    WarningAlertThreshold = table.Column<double>(type: "REAL", nullable: false, defaultValue: 9.6),
                    DailySummaryEnabled = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    DailySummaryTime = table.Column<string>(type: "TEXT", maxLength: 10, nullable: true, defaultValue: "08:00"),
                    DailySummaryTimezone = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true, defaultValue: "America/Los_Angeles"),
                    DailySummaryIncludeAlerts = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    DailySummaryIncludePerformance = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    DailySummaryIncludeTrends = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationPreferences", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_NotificationPreferences_UserId",
                table: "NotificationPreferences",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NotificationPreferences");
        }
    }
}
