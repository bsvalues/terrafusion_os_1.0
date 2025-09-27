// Layer 4: Business Logic - TerraFusion Secure Module
// MIT PhD-Level Architecture: Focus ONLY on domain logic

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Security.Cryptography;

namespace TerraFusion.Core.Secure
{
    /// <summary>
    /// Base class for all TerraFusion modules with built-in Trust Fabric integration
    /// Layer 4: Pure business logic with security built-in
    /// </summary>
    public abstract class SecureModule : IModule
    {
        protected readonly ILogger _logger;
        protected readonly ITrustFabricClient _trustFabric;
        protected readonly IAttestationService _attestation;
        protected readonly IServiceDiscovery _serviceDiscovery;
        
        public string ModuleName { get; }
        public string ServiceIdentity { get; private set; }
        
        protected SecureModule(string moduleName, ILogger logger, 
                             ITrustFabricClient trustFabric,
                             IAttestationService attestation,
                             IServiceDiscovery serviceDiscovery)
        {
            ModuleName = moduleName;
            _logger = logger;
            _trustFabric = trustFabric;
            _attestation = attestation;
            _serviceDiscovery = serviceDiscovery;
        }

        /// <summary>
        /// Initialize module with Trust Fabric registration
        /// </summary>
        public async Task InitializeAsync()
        {
            _logger.LogInformation("🔐 Initializing secure module: {ModuleName}", ModuleName);
            
            // Register with Trust Fabric for attestation
            ServiceIdentity = await _trustFabric.RegisterServiceAsync(
                ModuleName, 
                GetBinaryPath(),
                GetCapabilities()
            );
            
            _logger.LogInformation("✅ Module {ModuleName} registered with identity {ServiceIdentity}", 
                                 ModuleName, ServiceIdentity);
        }

        /// <summary>
        /// Execute module operation with full security validation
        /// </summary>
        public async Task<ModuleResult> ExecuteAsync(ModuleRequest request)
        {
            _logger.LogInformation("🎯 Executing {ModuleName} operation: {OperationType}", 
                                 ModuleName, request.OperationType);

            // Step 1: Verify caller's attestation
            if (!await _trustFabric.VerifyCallerAsync(request.CallerId))
            {
                _logger.LogError("❌ Caller attestation invalid: {CallerId}", request.CallerId);
                throw new SecurityException($"Caller {request.CallerId} attestation verification failed");
            }

            // Step 2: Check authorization policy via OPA (if available)
            if (!await CheckAuthorizationAsync(request))
            {
                _logger.LogError("❌ Authorization denied for {CallerId}: {OperationType}", 
                               request.CallerId, request.OperationType);
                throw new UnauthorizedAccessException($"Operation {request.OperationType} denied");
            }

            // Step 3: Execute domain-specific business logic
            var result = await ProcessBusinessLogicAsync(request);

            // Step 4: Create attestation for the result
            result.Attestation = await _attestation.SignResultAsync(new AttestationData
            {
                Module = ModuleName,
                Operation = request.OperationType,
                Caller = request.CallerId,
                Result = result.Data,
                Timestamp = DateTime.UtcNow,
                ServiceIdentity = ServiceIdentity
            });

            // Step 5: Record operation in audit trail (Merkle tree)
            await _trustFabric.RecordOperationAsync(new OperationRecord
            {
                Module = ModuleName,
                Caller = request.CallerId,
                Operation = request.OperationType,
                Result = result,
                Timestamp = DateTime.UtcNow,
                AttestationId = result.Attestation.Id
            });

            _logger.LogInformation("✅ {ModuleName} operation completed with attestation {AttestationId}", 
                                 ModuleName, result.Attestation.Id);

            return result;
        }

        /// <summary>
        /// Execute secure communication with other services
        /// Uses SPIFFE mTLS for service-to-service communication
        /// </summary>
        protected async Task<T> CallServiceAsync<T>(string serviceName, string endpoint, object data = null)
        {
            _logger.LogInformation("🔗 Calling service {ServiceName} endpoint {Endpoint}", 
                                 serviceName, endpoint);

            // Discover service via Consul
            var serviceInfo = await _serviceDiscovery.DiscoverServiceAsync(serviceName);
            if (serviceInfo == null)
            {
                throw new ServiceNotFoundException($"Service {serviceName} not found in registry");
            }

            // Verify target service attestation
            if (!await _trustFabric.VerifyServiceAsync(serviceName))
            {
                throw new SecurityException($"Service {serviceName} attestation verification failed");
            }

            // Create secure channel (SPIFFE mTLS)
            using var secureChannel = await _trustFabric.CreateSecureChannelAsync(ServiceIdentity, serviceName);
            
            // Make the call with attestation headers
            var request = new ServiceRequest
            {
                Data = data,
                CallerIdentity = ServiceIdentity,
                CallerAttestation = await _attestation.GetCurrentAttestationAsync(ServiceIdentity),
                Timestamp = DateTime.UtcNow
            };

            var response = await secureChannel.PostAsync<T>($"{serviceInfo.BaseUrl}{endpoint}", request);
            
            _logger.LogInformation("✅ Service call completed: {ServiceName} -> {Endpoint}", 
                                 serviceName, endpoint);

            return response;
        }

        // Abstract methods for domain-specific implementation
        protected abstract Task<ModuleResult> ProcessBusinessLogicAsync(ModuleRequest request);
        protected abstract string GetBinaryPath();
        protected abstract List<string> GetCapabilities();
        protected abstract Task<bool> CheckAuthorizationAsync(ModuleRequest request);
    }

    /// <summary>
    /// Example: County Services Module with Trust Fabric integration
    /// </summary>
    [ApiController]
    [Route("api/county")]
    public class CountyServicesModule : SecureModule
    {
        private readonly ICountyDataService _countyData;
        private readonly IPropertyValuationService _propertyValuation;

        public CountyServicesModule(ILogger<CountyServicesModule> logger,
                                  ITrustFabricClient trustFabric,
                                  IAttestationService attestation,
                                  IServiceDiscovery serviceDiscovery,
                                  ICountyDataService countyData,
                                  IPropertyValuationService propertyValuation)
            : base("CountyServices", logger, trustFabric, attestation, serviceDiscovery)
        {
            _countyData = countyData;
            _propertyValuation = propertyValuation;
        }

        [HttpPost("property/valuation")]
        public async Task<ActionResult<PropertyValuation>> GetPropertyValuation(
            [FromBody] PropertyValuationRequest request)
        {
            var moduleRequest = new ModuleRequest
            {
                OperationType = "PropertyValuation",
                CallerId = HttpContext.User.Identity?.Name ?? "anonymous",
                Data = request,
                RequestId = Guid.NewGuid().ToString()
            };

            var result = await ExecuteAsync(moduleRequest);
            return Ok(result);
        }

        [HttpGet("records/{parcelId}")]
        public async Task<ActionResult<CountyRecord>> GetCountyRecord(string parcelId)
        {
            var moduleRequest = new ModuleRequest
            {
                OperationType = "GetCountyRecord",
                CallerId = HttpContext.User.Identity?.Name ?? "anonymous",
                Data = new { ParcelId = parcelId },
                RequestId = Guid.NewGuid().ToString()
            };

            var result = await ExecuteAsync(moduleRequest);
            return Ok(result);
        }

        protected override async Task<ModuleResult> ProcessBusinessLogicAsync(ModuleRequest request)
        {
            return request.OperationType switch
            {
                "PropertyValuation" => await ProcessPropertyValuationAsync(request),
                "GetCountyRecord" => await ProcessCountyRecordAsync(request),
                _ => throw new NotSupportedException($"Operation {request.OperationType} not supported")
            };
        }

        private async Task<ModuleResult> ProcessPropertyValuationAsync(ModuleRequest request)
        {
            var valuationRequest = JsonSerializer.Deserialize<PropertyValuationRequest>(
                JsonSerializer.Serialize(request.Data));

            _logger.LogInformation("🏠 Processing property valuation for parcel {ParcelId}", 
                                 valuationRequest.ParcelId);

            // Call AI Swarm for enhanced valuation (with attestation)
            var aiAnalysis = await CallServiceAsync<AIPropertyAnalysis>(
                "ai-swarm", 
                "/analyze/property", 
                valuationRequest);

            // Get county records with attestation
            var countyRecord = await _countyData.GetRecordAsync(valuationRequest.ParcelId);

            // Perform valuation calculations
            var valuation = await _propertyValuation.CalculateValueAsync(
                countyRecord, 
                aiAnalysis, 
                valuationRequest.ValuationDate);

            return new ModuleResult
            {
                Success = true,
                Data = valuation,
                Metadata = new Dictionary<string, object>
                {
                    ["parcel_id"] = valuationRequest.ParcelId,
                    ["ai_analysis_id"] = aiAnalysis.AnalysisId,
                    ["valuation_method"] = "enhanced_ai_county_hybrid"
                }
            };
        }

        private async Task<ModuleResult> ProcessCountyRecordAsync(ModuleRequest request)
        {
            var requestData = JsonSerializer.Deserialize<Dictionary<string, object>>(
                JsonSerializer.Serialize(request.Data));
            
            var parcelId = requestData["ParcelId"].ToString();

            _logger.LogInformation("📋 Retrieving county record for parcel {ParcelId}", parcelId);

            var record = await _countyData.GetRecordAsync(parcelId);

            return new ModuleResult
            {
                Success = true,
                Data = record,
                Metadata = new Dictionary<string, object>
                {
                    ["parcel_id"] = parcelId,
                    ["data_source"] = "county_database",
                    ["compliance_level"] = "government_grade"
                }
            };
        }

        protected override string GetBinaryPath()
        {
            return System.Reflection.Assembly.GetExecutingAssembly().Location;
        }

        protected override List<string> GetCapabilities()
        {
            return new List<string>
            {
                "county_record_access",
                "property_valuation",
                "ai_swarm_integration",
                "government_compliance"
            };
        }

        protected override async Task<bool> CheckAuthorizationAsync(ModuleRequest request)
        {
            // In real implementation, would call OPA (Open Policy Agent)
            // For now, basic role-based check
            return request.CallerId != "anonymous";
        }
    }
}

// Supporting interfaces and models
namespace TerraFusion.Core.Interfaces
{
    public interface IModule
    {
        Task InitializeAsync();
        Task<ModuleResult> ExecuteAsync(ModuleRequest request);
    }

    public interface ITrustFabricClient
    {
        Task<string> RegisterServiceAsync(string serviceName, string binaryPath, List<string> capabilities);
        Task<bool> VerifyCallerAsync(string callerId);
        Task<bool> VerifyServiceAsync(string serviceName);
        Task<ISecureChannel> CreateSecureChannelAsync(string sourceId, string targetId);
        Task RecordOperationAsync(OperationRecord operation);
    }

    public interface IAttestationService
    {
        Task<Attestation> SignResultAsync(AttestationData data);
        Task<Attestation> GetCurrentAttestationAsync(string serviceIdentity);
    }

    public interface IServiceDiscovery
    {
        Task<ServiceInfo> DiscoverServiceAsync(string serviceName);
    }

    public class ModuleRequest
    {
        public string OperationType { get; set; }
        public string CallerId { get; set; }
        public object Data { get; set; }
        public string RequestId { get; set; }
    }

    public class ModuleResult
    {
        public bool Success { get; set; }
        public object Data { get; set; }
        public Dictionary<string, object> Metadata { get; set; }
        public Attestation Attestation { get; set; }
    }

    public class Attestation
    {
        public string Id { get; set; }
        public string Signature { get; set; }
        public DateTime Timestamp { get; set; }
    }

    public class AttestationData
    {
        public string Module { get; set; }
        public string Operation { get; set; }
        public string Caller { get; set; }
        public object Result { get; set; }
        public DateTime Timestamp { get; set; }
        public string ServiceIdentity { get; set; }
    }

    public class OperationRecord
    {
        public string Module { get; set; }
        public string Caller { get; set; }
        public string Operation { get; set; }
        public ModuleResult Result { get; set; }
        public DateTime Timestamp { get; set; }
        public string AttestationId { get; set; }
    }
}
