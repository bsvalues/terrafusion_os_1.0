-- TerraFusion OS Redis Lua Script: Check Miss Sentinel
-- PhD-Level Implementation for Atomic Miss Sentinel Detection
-- Provides comprehensive cache status with performance tracking

-- Arguments:
-- KEYS[1]: Cache key to check
-- ARGV[1]: Update statistics flag (1 = yes, 0 = no, default: 1)

local cache_key = KEYS[1]
if not cache_key or cache_key == "" then
    return redis.error_reply("Cache key is required")
end

-- Configuration
local miss_sentinel_prefix = "tf_miss:"
local positive_cache_prefix = "tf_cache:"
local stats_key = "tf_stats:cache_performance"
local update_stats = tonumber(ARGV[1]) or 1

local miss_sentinel_key = miss_sentinel_prefix .. cache_key
local positive_cache_key = positive_cache_prefix .. cache_key

-- Start timing for performance measurement
local start_time = redis.call('TIME')
local start_microseconds = tonumber(start_time[1]) * 1000000 + tonumber(start_time[2])

-- Check for miss sentinel first (most common case for negative caching)
local miss_sentinel_data = redis.call('GET', miss_sentinel_key)

if miss_sentinel_data then
    -- Miss sentinel found - record negative cache hit and return immediately
    if update_stats == 1 then
        redis.call('HINCRBY', stats_key, 'negative_cache_hits', 1)
        redis.call('HINCRBY', stats_key, 'total_requests', 1)
        redis.call('HINCRBY', stats_key, 'database_queries_prevented', 1)
        
        -- Track response time
        local end_time = redis.call('TIME')
        local end_microseconds = tonumber(end_time[1]) * 1000000 + tonumber(end_time[2])
        local response_time_us = end_microseconds - start_microseconds
        
        redis.call('HINCRBY', stats_key, 'total_response_time_us', response_time_us)
        redis.call('HSET', stats_key, 'last_negative_hit_time', end_time[1])
    end
    
    -- Parse miss sentinel metadata
    local miss_data = {}
    if string.find(miss_sentinel_data, "{") then
        -- Parse JSON-like data (simplified parsing)
        miss_data.created_at = string.match(miss_sentinel_data, '"created_at":(%d+)')
        miss_data.ttl = string.match(miss_sentinel_data, '"ttl":(%d+)')
        miss_data.node_id = string.match(miss_sentinel_data, '"node_id":"([^"]*)"')
        miss_data.request_id = string.match(miss_sentinel_data, '"request_id":"([^"]*)"')
    end
    
    local ttl_remaining = redis.call('TTL', miss_sentinel_key)
    
    return {
        status = "MISS_SENTINEL",
        key = cache_key,
        miss_sentinel_data = miss_sentinel_data,
        ttl_remaining = ttl_remaining,
        created_at = miss_data.created_at,
        node_id = miss_data.node_id,
        request_id = miss_data.request_id,
        response_time_us = update_stats == 1 and (redis.call('TIME')[2] - start_time[2]) or nil
    }
end

-- Check for positive cache entry
local positive_cache_data = redis.call('GET', positive_cache_key)

if positive_cache_data then
    -- Positive cache hit
    if update_stats == 1 then
        redis.call('HINCRBY', stats_key, 'cache_hits', 1)
        redis.call('HINCRBY', stats_key, 'total_requests', 1)
        
        local end_time = redis.call('TIME')
        local end_microseconds = tonumber(end_time[1]) * 1000000 + tonumber(end_time[2])
        local response_time_us = end_microseconds - start_microseconds
        
        redis.call('HINCRBY', stats_key, 'total_response_time_us', response_time_us)
        redis.call('HSET', stats_key, 'last_positive_hit_time', end_time[1])
    end
    
    local ttl_remaining = redis.call('TTL', positive_cache_key)
    
    return {
        status = "POSITIVE_HIT",
        key = cache_key,
        data = positive_cache_data,
        ttl_remaining = ttl_remaining,
        response_time_us = update_stats == 1 and (redis.call('TIME')[2] - start_time[2]) or nil
    }
end

-- Neither miss sentinel nor positive cache found - cache miss
if update_stats == 1 then
    redis.call('HINCRBY', stats_key, 'cache_misses', 1)
    redis.call('HINCRBY', stats_key, 'total_requests', 1)
    
    local end_time = redis.call('TIME')
    local end_microseconds = tonumber(end_time[1]) * 1000000 + tonumber(end_time[2])
    local response_time_us = end_microseconds - start_microseconds
    
    redis.call('HINCRBY', stats_key, 'total_response_time_us', response_time_us)
    redis.call('HSET', stats_key, 'last_miss_time', end_time[1])
end

-- Determine cache type for analytics
local cache_type = "unknown"
if string.find(cache_key, "property:") then
    cache_type = "property_lookup"
elseif string.find(cache_key, "harris_pacs:") then
    cache_type = "harris_pacs"
elseif string.find(cache_key, "county:") then
    cache_type = "county_data"
elseif string.find(cache_key, "analytics:") then
    cache_type = "analytics"
end

return {
    status = "CACHE_MISS",
    key = cache_key,
    cache_type = cache_type,
    should_query_database = true,
    response_time_us = update_stats == 1 and (redis.call('TIME')[2] - start_time[2]) or nil
}