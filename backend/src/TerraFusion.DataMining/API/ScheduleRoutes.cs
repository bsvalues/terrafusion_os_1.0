// TMR-083: Schedule management routes
using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.API
{
    /// <summary>
    /// Represents an ETL schedule definition.
    /// </summary>
    public class ScheduleDefinition
    {
        /// <summary>Unique schedule identifier.</summary>
        public string ScheduleId { get; set; } = string.Empty;

        /// <summary>Associated ETL job name.</summary>
        public string JobName { get; set; } = string.Empty;

        /// <summary>Cron expression for the schedule.</summary>
        public string CronExpression { get; set; } = string.Empty;

        /// <summary>Whether the schedule is currently active.</summary>
        public bool IsActive { get; set; }

        /// <summary>Last execution time (UTC).</summary>
        public DateTime? LastRunUtc { get; set; }

        /// <summary>Next scheduled execution time (UTC).</summary>
        public DateTime? NextRunUtc { get; set; }

        /// <summary>Description of what this schedule does.</summary>
        public string Description { get; set; } = string.Empty;
    }

    /// <summary>
    /// Minimal API route definitions for ETL schedule management.
    /// </summary>
    public static class ScheduleRoutes
    {
        /// <summary>
        /// Maps schedule management routes to the endpoint route builder.
        /// </summary>
        /// <param name="app">The endpoint route builder.</param>
        /// <returns>The route group builder for chaining.</returns>
        public static RouteGroupBuilder MapScheduleRoutes(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/datamining/schedules")
                .WithTags("Schedule Management");

            group.MapGet("/", (ILoggerFactory loggerFactory) =>
            {
                var logger = loggerFactory.CreateLogger("ScheduleRoutes");
                logger.LogInformation("[Schedules] Listing all schedules");

                return Results.Ok(new
                {
                    schedules = Array.Empty<ScheduleDefinition>(),
                    totalCount = 0,
                });
            })
            .WithName("ListSchedules")
            .WithSummary("Lists all ETL schedules.");

            group.MapGet("/{scheduleId}", (string scheduleId, ILoggerFactory loggerFactory) =>
            {
                var logger = loggerFactory.CreateLogger("ScheduleRoutes");
                logger.LogInformation("[Schedules] Getting schedule {Id}", scheduleId);

                return Results.NotFound(new { message = $"Schedule '{scheduleId}' not found (stub)" });
            })
            .WithName("GetSchedule")
            .WithSummary("Gets a specific schedule by ID.");

            group.MapPost("/", (ScheduleDefinition schedule, ILoggerFactory loggerFactory) =>
            {
                var logger = loggerFactory.CreateLogger("ScheduleRoutes");
                logger.LogInformation("[Schedules] Creating schedule for job {Job}", schedule.JobName);

                schedule.ScheduleId = $"sched_{Guid.NewGuid():N}"[..16];
                return Results.Created($"/api/datamining/schedules/{schedule.ScheduleId}", schedule);
            })
            .WithName("CreateSchedule")
            .WithSummary("Creates a new ETL schedule.");

            group.MapPut("/{scheduleId}", (string scheduleId, ScheduleDefinition schedule, ILoggerFactory loggerFactory) =>
            {
                var logger = loggerFactory.CreateLogger("ScheduleRoutes");
                logger.LogInformation("[Schedules] Updating schedule {Id}", scheduleId);

                schedule.ScheduleId = scheduleId;
                return Results.Ok(schedule);
            })
            .WithName("UpdateSchedule")
            .WithSummary("Updates an existing ETL schedule.");

            group.MapDelete("/{scheduleId}", (string scheduleId, ILoggerFactory loggerFactory) =>
            {
                var logger = loggerFactory.CreateLogger("ScheduleRoutes");
                logger.LogInformation("[Schedules] Deleting schedule {Id}", scheduleId);

                return Results.NoContent();
            })
            .WithName("DeleteSchedule")
            .WithSummary("Deletes an ETL schedule.");

            group.MapPost("/{scheduleId}/toggle", (string scheduleId, ILoggerFactory loggerFactory) =>
            {
                var logger = loggerFactory.CreateLogger("ScheduleRoutes");
                logger.LogInformation("[Schedules] Toggling schedule {Id}", scheduleId);

                return Results.Ok(new
                {
                    scheduleId,
                    message = "Schedule toggle requested (stub)"
                });
            })
            .WithName("ToggleSchedule")
            .WithSummary("Enables or disables a schedule.");

            return group;
        }
    }
}
