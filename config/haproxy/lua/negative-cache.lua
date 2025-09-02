-- TerraFusion OS 1.0 - Negative Caching Lua Integration for HAProxy
-- PhD-Level Implementation of Miss Sentinel Coordination
-- Optimized for Government Property Assessment Systems

-- Global configuration
local config = {
    miss_sentinel_identifier = "__TERRAFUSION_MISS__",
    cache_key_prefix = "tf_cache:",
    performance_log_threshold_ms = 100,
    debug_mode = false
}

-- Utility functions for cache key generation
local function generate_cache_key(path, query_string)
    -- Extract jurisdiction and parcel from Harris PACS API paths
    local jurisdiction, parcel = string.match(path, "/api/pacs/jurisdictions/([^/]+)/properties/([^/]+)")
    if jurisdiction and parcel then
        -- Government property lookup cache key
        return string.format("%spacs:property:%s:%s", config.cache_key_prefix, jurisdiction, parcel)
    end
    
    -- Extract property assessment cache key
    local property_id = string.match(path, "/api/properties/([^/]+)")
    if property_id then
        return string.format("%sproperty:assessment:%s", config.cache_key_prefix, property_id)
    end
    
    -- Generic cache key for other endpoints
    local clean_path = string.gsub(path, "[^%w/%-_]", "_")
    return string.format("%sgeneric:%s", config.cache_key_prefix, clean_path)
end

-- Log performance and cache metrics
local function log_cache_metrics(cache_key, operation, duration_ms, cache_status)
    if config.debug_mode or duration_ms > config.performance_log_threshold_ms then
        core.log(core.info, string.format(
            "[NEGATIVE_CACHE] Key: %s, Operation: %s, Duration: %dms, Status: %s, Timestamp: %d",
            cache_key, operation, duration_ms, cache_status, os.time()
        ))
    end
end

-- Check for negative cache candidate and set request variables
function check_negative_cache(txn)
    local start_time = os.clock()
    local path = txn.f:path()
    local method = txn.f:method()
    local query_string = txn.f:query() or ""
    
    -- Only process GET requests for cacheable endpoints
    if method ~= "GET" then
        return
    end
    
    -- Identify negative cache candidates
    local is_candidate = false
    local operation_type = "unknown"
    
    if string.match(path, "/api/pacs/jurisdictions/.+/properties/.+") then
        is_candidate = true
        operation_type = "harris_pacs_property_lookup"
    elseif string.match(path, "/api/properties/.+") then
        is_candidate = true
        operation_type = "property_assessment_lookup"
    elseif string.match(path, "/api/harris%-pacs/.+") then
        is_candidate = true
        operation_type = "harris_pacs_generic"
    end
    
    if is_candidate then
        local cache_key = generate_cache_key(path, query_string)
        
        -- Set request variables for downstream processing
        txn:set_var("req.negative_cache_candidate", "true")
        txn:set_var("req.cache_key", cache_key)
        txn:set_var("req.operation_type", operation_type)
        txn:set_var("req.cache_check_start_time", tostring(start_time))
        
        -- Add debug headers in development
        if config.debug_mode then
            txn:set_var("req.debug_cache_key", cache_key)
            txn:set_var("req.debug_operation_type", operation_type)
        end
        
        local duration_ms = (os.clock() - start_time) * 1000
        log_cache_metrics(cache_key, "candidate_identification", duration_ms, "identified")
    end
end

-- Set appropriate cache headers based on response from backend
function set_cache_headers(txn)
    local start_time = os.clock()
    local cache_status = txn.sf:res_fhdr("X-Cache-Status")
    local cache_key = txn:get_var("req.cache_key")
    local operation_type = txn:get_var("req.operation_type") or "unknown"
    
    if not cache_status or not cache_key then
        return
    end
    
    -- Enhanced cache header configuration based on cache status
    if string.match(cache_status, "MISS_SENTINEL") or string.match(cache_status, "NEGATIVE") then
        -- Miss sentinel response - short TTL with stale-while-revalidate
        txn.http:res_set_header("Cache-Control", "public, max-age=30, stale-while-revalidate=60, must-revalidate")
        txn.http:res_set_header("X-Negative-Cache", "true")
        txn.http:res_set_header("X-Cache-TTL", "30")
        txn.http:res_set_header("X-Cache-Type", "miss_sentinel")
        
        -- Performance optimization headers
        txn.http:res_set_header("X-Database-Query-Prevented", "true")
        txn.http:res_set_header("X-Performance-Optimized", "negative_cache")
        
    elseif string.match(cache_status, "HIT") or string.match(cache_status, "POSITIVE") then
        -- Positive cache hit - longer TTL with graceful degradation
        txn.http:res_set_header("Cache-Control", "public, max-age=300, stale-while-revalidate=600, must-revalidate")
        txn.http:res_set_header("X-Positive-Cache", "true")
        txn.http:res_set_header("X-Cache-TTL", "300")
        txn.http:res_set_header("X-Cache-Type", "positive_hit")
        
    elseif string.match(cache_status, "FETCH") then
        -- Fresh fetch from database - set caching for future requests
        if string.match(cache_status, "FETCH_NEGATIVE") then
            txn.http:res_set_header("Cache-Control", "public, max-age=30, stale-while-revalidate=60")
            txn.http:res_set_header("X-Cache-Type", "fresh_negative")
        else
            txn.http:res_set_header("Cache-Control", "public, max-age=300, stale-while-revalidate=600")
            txn.http:res_set_header("X-Cache-Type", "fresh_positive")
        end
        
        txn.http:res_set_header("X-Database-Fetch", "true")
    end
    
    -- Universal cache headers
    txn.http:res_set_header("X-Cache-Key-Hash", string.format("%08x", tonumber(string.sub(cache_key, -8), 16) or 0))
    txn.http:res_set_header("X-Cache-Operation-Type", operation_type)
    txn.http:res_set_header("X-Cache-Timestamp", tostring(os.time()))
    txn.http:res_set_header("Vary", "Accept-Encoding, Authorization")
    
    -- Debug headers for development environment
    if config.debug_mode then
        txn.http:res_set_header("X-Debug-Cache-Key", cache_key)
        txn.http:res_set_header("X-Debug-Cache-Status", cache_status)
    end
    
    local duration_ms = (os.clock() - start_time) * 1000
    log_cache_metrics(cache_key, "header_processing", duration_ms, cache_status)
end

-- Performance monitoring for cache operations
function monitor_cache_performance(txn)
    local cache_check_start = txn:get_var("req.cache_check_start_time")
    if cache_check_start then
        local total_duration_ms = (os.clock() - tonumber(cache_check_start)) * 1000
        local cache_key = txn:get_var("req.cache_key")
        local operation_type = txn:get_var("req.operation_type") or "unknown"
        
        -- Set performance monitoring headers
        txn.http:res_set_header("X-Cache-Processing-Time-Ms", string.format("%.2f", total_duration_ms))
        
        -- Log performance metrics for monitoring
        if total_duration_ms > config.performance_log_threshold_ms then
            core.log(core.warning, string.format(
                "[NEGATIVE_CACHE_PERFORMANCE] Slow cache processing: %s, Duration: %.2fms, Type: %s",
                cache_key or "unknown", total_duration_ms, operation_type
            ))
        end
        
        log_cache_metrics(cache_key or "unknown", "total_processing", total_duration_ms, "completed")
    end
end

-- Advanced cache invalidation support (for future webhook integration)
function handle_cache_invalidation(txn)
    local method = txn.f:method()
    local path = txn.f:path()
    
    -- Handle cache invalidation for write operations
    if method == "POST" or method == "PUT" or method == "DELETE" then
        if string.match(path, "/api/pacs/") or string.match(path, "/api/properties/") then
            txn:set_var("req.cache_invalidation_needed", "true")
            txn.http:res_set_header("X-Cache-Invalidation-Triggered", "true")
            
            core.log(core.info, string.format(
                "[CACHE_INVALIDATION] Triggered for path: %s, method: %s", 
                path, method
            ))
        end
    end
end

-- Circuit breaker for cache system protection
local circuit_breaker = {
    failure_count = 0,
    failure_threshold = 10,
    timeout_seconds = 60,
    last_failure_time = 0,
    state = "closed" -- closed, open, half-open
}

function check_circuit_breaker()
    local current_time = os.time()
    
    if circuit_breaker.state == "open" then
        if current_time - circuit_breaker.last_failure_time > circuit_breaker.timeout_seconds then
            circuit_breaker.state = "half-open"
            core.log(core.info, "[CIRCUIT_BREAKER] State changed to half-open")
        end
    end
    
    return circuit_breaker.state ~= "open"
end

function record_cache_failure()
    circuit_breaker.failure_count = circuit_breaker.failure_count + 1
    circuit_breaker.last_failure_time = os.time()
    
    if circuit_breaker.failure_count >= circuit_breaker.failure_threshold then
        circuit_breaker.state = "open"
        core.log(core.alert, "[CIRCUIT_BREAKER] State changed to open due to failures")
    end
end

function record_cache_success()
    if circuit_breaker.state == "half-open" then
        circuit_breaker.state = "closed"
        circuit_breaker.failure_count = 0
        core.log(core.info, "[CIRCUIT_BREAKER] State changed to closed after successful operation")
    end
end

-- Register all actions with HAProxy
core.register_action("check_negative_cache", {"http-req"}, check_negative_cache)
core.register_action("set_cache_headers", {"http-res"}, set_cache_headers)
core.register_action("monitor_cache_performance", {"http-res"}, monitor_cache_performance)
core.register_action("handle_cache_invalidation", {"http-req"}, handle_cache_invalidation)

-- Log initialization
core.log(core.info, "[NEGATIVE_CACHE] TerraFusion negative caching Lua module loaded successfully")
core.log(core.info, string.format("[NEGATIVE_CACHE] Configuration: miss_sentinel=%s, debug_mode=%s", 
    config.miss_sentinel_identifier, tostring(config.debug_mode)))