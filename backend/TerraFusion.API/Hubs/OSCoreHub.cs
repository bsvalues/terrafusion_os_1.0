using System;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Collections.Concurrent;
using TerraFusion.Abstractions.Interfaces;
using System.Linq;
using TerraFusion.API.Services;

namespace TerraFusion.API.Hubs
{
    /// <summary>
    /// Dedicated OS core channel for TerraFusion OS. This hub is the sole authority for
    /// kernel-level operations such as session authentication, heartbeat, and core orchestration.
    /// </summary>
    /// <remarks>
    /// Separation of concerns:
    /// - SystemHub: system monitoring
    /// - OmniscientHub: module orchestration
    /// - OSCoreHub: kernel session/auth, core messaging
    /// </remarks>
    [Authorize(Policy = "OSCoreAccess")]
    public class OSCoreHub : Hub
    {
        private readonly IAuditLogger _audit;
        private readonly IAuthValidator _authValidator;
        private readonly ILogger<OSCoreHub> _logger;
        private static readonly ConcurrentDictionary<string, string[]> _permissionsByConnection = new();

        public OSCoreHub(IAuditLogger audit, IAuthValidator authValidator, ILogger<OSCoreHub> logger)
        {
            _audit = audit;
            _authValidator = authValidator;
            _logger = logger;
        }
        private const string CountyBenton = "benton";
        private const string LegacyPacs9 = "PACS_9.0";

        /// <summary>
        /// OS authentication request payload.
        /// </summary>
        public sealed record AuthRequest(
            [property: Required] string CountyId,
            [property: Required] string LegacySystem,
            object? Credentials
        );

        /// <summary>
        /// OS authentication response payload.
        /// </summary>
        public sealed record AuthResponse(
            string SessionId,
            string[] Modules,
            bool MarketplaceEnabled
        );

        /// <summary>
        /// Heartbeat payload.
        /// </summary>
        public sealed record HeartbeatPayload(string? SessionId, long Ts);

        /// <summary>
        /// Module load request payload for plugin/kernel orchestration.
        /// </summary>
        public sealed record ModuleLoadRequest(
            [property: Required] string ModuleName,
            string? Source
        );

        /// <summary>
        /// Authenticates the Electron/TerraFusion Browser to the OS core channel.
        /// Validates county context and legacy system (Benton + PACS 9.0).
        /// </summary>
        /// <param name="request">Auth request including county, legacy system, and credentials envelope.</param>
        public async Task AuthenticateOS(AuthRequest request)
        {
            if (request is null)
            {
                await Clients.Caller.SendAsync("AuthenticationFailed", "Invalid request");
                return;
            }

            if (!string.Equals(request.CountyId, CountyBenton, StringComparison.OrdinalIgnoreCase)
                || !string.Equals(request.LegacySystem, LegacyPacs9, StringComparison.OrdinalIgnoreCase))
            {
                await Clients.Caller.SendAsync("AuthenticationFailed", "Invalid county configuration");
                return;
            }

            // Validate signed credentials envelope
            if (!AuthEnvelope.TryParse(request.Credentials, out var envelope))
            {
                await Clients.Caller.SendAsync("AuthenticationFailed", "Invalid credentials envelope");
                return;
            }
            if (!_authValidator.Validate(envelope!, out var reason))
            {
                await Clients.Caller.SendAsync("AuthenticationFailed", reason ?? "Credential validation failed");
                return;
            }

            var sessionId = Guid.NewGuid().ToString("N");

            var response = new AuthResponse(
                SessionId: sessionId,
                Modules: new[] { "cama-core", "parcel-management", "assessment-workflow", "gis-integration" },
                MarketplaceEnabled: true
            );

            // Persist permissions for this connection (for module RBAC checks)
            var perms = envelope!.Payload.Permissions ?? Array.Empty<string>();
            _permissionsByConnection.AddOrUpdate(Context.ConnectionId, perms, (_, __) => perms);

            await Clients.Caller.SendAsync("AuthenticationSuccess", response);

            // Emit an audit event (client-side can subscribe to 'AuditLog')
            await Clients.Caller.SendAsync("AuditLog", new
            {
                type = "os.auth",
                county = request.CountyId,
                legacy = request.LegacySystem,
                ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                connectionId = Context.ConnectionId
            });

            await _audit.LogAsync("os.auth", 
                $"County: {request.CountyId}, Legacy: {request.LegacySystem}, Session: {sessionId}, Connection: {Context.ConnectionId}");
        }

        /// <summary>
        /// Minimal heartbeat acknowledgement; extend to include latency, server time, etc.
        /// </summary>
        public async Task Heartbeat(HeartbeatPayload payload)
        {
            await Clients.Caller.SendAsync("AuditLog", new
            {
                type = "os.heartbeat",
                ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                connectionId = Context.ConnectionId,
                payload
            });

            await _audit.LogAsync("os.heartbeat", 
                $"Connection: {Context.ConnectionId}, SessionId: {payload?.SessionId}, Timestamp: {payload?.Ts}");
        }

        /// <summary>
        /// Cleanup connection-scoped state when a client disconnects.
        /// </summary>
        public override Task OnDisconnectedAsync(Exception? exception)
        {
            _permissionsByConnection.TryRemove(Context.ConnectionId, out _);
            return base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Loads a module into the caller's session context. Verifies policy and audits the operation.
        /// </summary>
        public async Task LoadModule(ModuleLoadRequest request)
        {
            if (request is null || string.IsNullOrWhiteSpace(request.ModuleName))
            {
                await Clients.Caller.SendAsync("ModuleLoadFailed", new { reason = "Invalid module request", module = request?.ModuleName ?? string.Empty });
                return;
            }

            // Enforce per-module permission: requires permission load:{module}
            var moduleKey = $"load:{request.ModuleName}";
            var perms = _permissionsByConnection.TryGetValue(Context.ConnectionId, out var p) ? p : Array.Empty<string>();
            if (perms is null || !perms.Contains(moduleKey, StringComparer.OrdinalIgnoreCase))
            {
                await Clients.Caller.SendAsync("ModuleLoadFailed", new { reason = "Not authorized", module = request.ModuleName });
                await _audit.LogAsync("os.module.load", 
                    $"Connection: {Context.ConnectionId}, Module: {request.ModuleName}, Source: {request.Source ?? "electron"}, Authorized: false");
                return;
            }

            await Clients.Caller.SendAsync("ModuleLoaded", new
            {
                module = request.ModuleName,
                ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                connectionId = Context.ConnectionId
            });

            await _audit.LogAsync("os.module.load", 
                $"Connection: {Context.ConnectionId}, Module: {request.ModuleName}, Source: {request.Source ?? "electron"}, Authorized: true");
        }

        /// <summary>
        /// Plugin method invocation with RBAC enforcement per module.
        /// </summary>
        public async Task PluginInvoke(PluginInvokeRequest request)
        {
            if (request is null || string.IsNullOrWhiteSpace(request.ModuleName) || string.IsNullOrWhiteSpace(request.Method))
            {
                await Clients.Caller.SendAsync("PluginInvokeFailed", new { reason = "Invalid request", module = request?.ModuleName ?? "" });
                return;
            }

            // Enforce per-module permission
            var moduleKey = $"load:{request.ModuleName}";
            var perms = _permissionsByConnection.TryGetValue(Context.ConnectionId, out var p) ? p : Array.Empty<string>();
            if (perms is null || !perms.Contains(moduleKey, StringComparer.OrdinalIgnoreCase))
            {
                await Clients.Caller.SendAsync("PluginInvokeFailed", new { reason = "Not authorized", module = request.ModuleName });
                return;
            }

            // Handle specific plugin methods
            object result = request.Method switch
            {
                "ping" => new { pong = true, timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), module = request.ModuleName },
                "levy.calculate" => HandleLevyCalculate(request.Payload),
                "levy.generateRoll" => HandleLevyGenerateRoll(request.Payload),
                "gis.loadParcels" => HandleGisLoadParcels(request.Payload),
                "gis.searchParcel" => HandleGisSearchParcel(request.Payload),
                "valuation.predict" => HandleValuationPredict(request.Payload),
                "valuation.accessMRA" => HandleValuationAccessMRA(request.Payload),
                "harris.importStatus" => await HandleHarrisImportStatus(request.Payload),
                "harris.startImport" => await HandleHarrisStartImport(request.Payload),
                _ => new { error = $"Unknown method: {request.Method}" }
            };

            await Clients.Caller.SendAsync("PluginInvokeResult", new { module = request.ModuleName, method = request.Method, result });
        }

        /// <summary>
        /// Plugin event emission with audit logging.
        /// </summary>
        public async Task PluginEmit(PluginEmitRequest request)
        {
            if (request is null || string.IsNullOrWhiteSpace(request.ModuleName) || string.IsNullOrWhiteSpace(request.Event))
            {
                return;
            }

            await _audit.LogAsync("plugin.emit", 
                $"Connection: {Context.ConnectionId}, Module: {request.ModuleName}, Event: {request.Event}");
        }

        private object HandleLevyCalculate(object? payload)
        {
            // Mock levy calculation for Benton County
            return new
            {
                county = "benton",
                taxYear = 2024,
                baseAssessment = 250000,
                millageRate = 12.5m,
                calculatedLevy = 3125.00m,
                dueDate = "2024-12-31",
                breakdown = new
                {
                    countyTax = 1875.00m,
                    schoolTax = 1000.00m,
                    municipalTax = 250.00m
                }
            };
        }

        private object HandleLevyGenerateRoll(object? payload)
        {
            // Mock roll generation for Benton County
            return new
            {
                county = "benton",
                scenario = "base",
                rollId = Guid.NewGuid().ToString("N")[..8],
                totalParcels = 15420,
                totalAssessedValue = 2_847_500_000m,
                totalLevy = 35_593_750.00m,
                generatedAt = DateTimeOffset.UtcNow,
                status = "completed"
            };
        }

        /// <summary>
        /// Plugin method invocation request.
        /// </summary>
        public sealed record PluginInvokeRequest(
            [property: Required] string ModuleName,
            [property: Required] string Method,
            object? Payload
        );

        private object HandleGisLoadParcels(object? payload)
        {
            // Mock GIS parcel loading for Benton County
            return new
            {
                county = "benton",
                parcels = new[]
                {
                    new { id = "123-456-001", address = "123 Main St", acres = 0.25m, zoning = "R1" },
                    new { id = "123-456-002", address = "125 Main St", acres = 0.30m, zoning = "R1" },
                    new { id = "123-456-003", address = "127 Main St", acres = 0.28m, zoning = "R1" }
                },
                bounds = new { north = 46.3, south = 46.1, east = -119.1, west = -119.5 },
                totalCount = 15420,
                loadedAt = DateTimeOffset.UtcNow
            };
        }

        private object HandleGisSearchParcel(object? payload)
        {
            // Mock parcel search for Benton County
            return new
            {
                county = "benton",
                parcel = new
                {
                    id = "123-456-001",
                    address = "123 Main St, Richland, WA",
                    owner = "John & Jane Doe",
                    acres = 0.25m,
                    zoning = "R1",
                    assessedValue = 285000m,
                    marketValue = 320000m,
                    coordinates = new { lat = 46.2868, lng = -119.2844 },
                    lastSale = "2021-03-15",
                    salePrice = 295000m
                },
                searchedAt = DateTimeOffset.UtcNow
            };
        }

        private object HandleValuationPredict(object? payload)
        {
            // Mock AI valuation for Benton County
            return new
            {
                county = "benton",
                propertyId = "DEMO-PROP-001",
                aiValuation = new
                {
                    predictedValue = 342500m,
                    confidence = 0.87m,
                    model = "TerraFusion-AI-v2.1",
                    factors = new[]
                    {
                        new { name = "Location Score", weight = 0.35m, value = 8.2m },
                        new { name = "Property Condition", weight = 0.25m, value = 7.8m },
                        new { name = "Market Trends", weight = 0.20m, value = 8.5m },
                        new { name = "Comparable Sales", weight = 0.20m, value = 8.0m }
                    }
                },
                comparables = new[]
                {
                    new { address = "125 Oak Ave", soldPrice = 335000m, soldDate = "2024-01-15" },
                    new { address = "789 Pine St", soldPrice = 348000m, soldDate = "2024-02-22" }
                },
                processedAt = DateTimeOffset.UtcNow
            };
        }

        private object HandleValuationAccessMRA(object? payload)
        {
            // Mock MRA data access for Benton County
            return new
            {
                county = "benton",
                mraData = new
                {
                    dataSource = "Washington State Department of Revenue",
                    lastUpdate = "2024-07-15",
                    comparableSales = new[]
                    {
                        new { parcelId = "456-789-001", salePrice = 325000m, saleDate = "2024-06-10", sqft = 1850 },
                        new { parcelId = "456-789-002", salePrice = 340000m, saleDate = "2024-05-22", sqft = 1920 },
                        new { parcelId = "456-789-003", salePrice = 355000m, saleDate = "2024-04-18", sqft = 2100 }
                    },
                    marketTrends = new
                    {
                        avgPricePerSqft = 185.50m,
                        yearOverYearChange = 0.068m,
                        daysOnMarket = 28
                    }
                },
                accessedAt = DateTimeOffset.UtcNow
            };
        }

        private async Task<object> HandleHarrisImportStatus(object? payload)
        {
            // Get Harris PACS import status for Benton County only
            // Mock status for demo - in production, inject service properly
            return new
            {
                county = "benton",
                legacySystem = "PACS_9.0",
                migrationStatus = new
                {
                    totalRecords = 15420,
                    validRecords = 14850,
                    invalidRecords = 125,
                    pendingRecords = 445,
                    completionPercentage = 96.3m,
                    lastImport = DateTimeOffset.UtcNow.AddHours(-2),
                    nextScheduledImport = DateTimeOffset.UtcNow.AddDays(1)
                },
                conversionMappings = new
                {
                    pacsParcelId = "TF_PARCEL_UUID",
                    pacsOwnerRec = "TF_OWNER_ENTITY",
                    totalMapped = 14850,
                    mappingErrors = 125
                }
            };
        }

        private async Task<object> HandleHarrisStartImport(object? payload)
        {
            // Start Harris PACS import for Benton County only
            await Task.Delay(100); // Simulate async operation
            
            return new
            {
                county = "benton",
                importId = Guid.NewGuid().ToString("N")[..8],
                status = "started",
                estimatedDuration = "15-20 minutes",
                startedAt = DateTimeOffset.UtcNow,
                message = "Harris PACS 9.0 import initiated for Benton County"
            };
        }

        /// <summary>
        /// Plugin event emission request.
        /// </summary>
        public sealed record PluginEmitRequest(
            [property: Required] string ModuleName,
            [property: Required] string Event,
            object? Data
        );
    }
}
