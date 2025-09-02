using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMarketplaceAndCountyDeploymentEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CountyDeployments",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    CountyId = table.Column<string>(type: "TEXT", nullable: false),
                    CountyName = table.Column<string>(type: "TEXT", nullable: false),
                    State = table.Column<string>(type: "TEXT", nullable: false),
                    Population = table.Column<int>(type: "INTEGER", nullable: false),
                    DeploymentType = table.Column<int>(type: "INTEGER", nullable: false),
                    RequestedModules = table.Column<string>(type: "TEXT", nullable: false),
                    DeployedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    ErrorMessage = table.Column<string>(type: "TEXT", nullable: true),
                    Configuration = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CountyDeployments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PluginAnalytics",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    PluginId = table.Column<string>(type: "TEXT", nullable: false),
                    CountyId = table.Column<string>(type: "TEXT", nullable: false),
                    UsageCount = table.Column<int>(type: "INTEGER", nullable: false),
                    RecordedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Metrics = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PluginAnalytics", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PluginInstallations",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    PluginId = table.Column<string>(type: "TEXT", nullable: false),
                    CountyId = table.Column<string>(type: "TEXT", nullable: false),
                    InstalledAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UninstalledAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    Configuration = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PluginInstallations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PluginRevenue",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    PluginId = table.Column<string>(type: "TEXT", nullable: false),
                    CountyId = table.Column<string>(type: "TEXT", nullable: false),
                    Revenue = table.Column<decimal>(type: "TEXT", nullable: false),
                    GeneratedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    TransactionId = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PluginRevenue", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PluginSubmissions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    Version = table.Column<string>(type: "TEXT", nullable: false),
                    Author = table.Column<string>(type: "TEXT", nullable: false),
                    Category = table.Column<string>(type: "TEXT", nullable: false),
                    Price = table.Column<decimal>(type: "TEXT", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    ReviewNotes = table.Column<string>(type: "TEXT", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PluginSubmissions", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CountyDeployments");

            migrationBuilder.DropTable(
                name: "PluginAnalytics");

            migrationBuilder.DropTable(
                name: "PluginInstallations");

            migrationBuilder.DropTable(
                name: "PluginRevenue");

            migrationBuilder.DropTable(
                name: "PluginSubmissions");
        }
    }
}
