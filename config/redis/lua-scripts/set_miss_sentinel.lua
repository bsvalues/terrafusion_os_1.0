-- TerraFusion OS Redis Lua Script: Set Miss Sentinel
-- PhD-Level Implementation for Atomic Miss Sentinel Operations
-- Prevents race conditions and ensures consistent miss sentinel behavior

-- Arguments:
-- KEYS[1]: Cache key to set miss sentinel for
-- ARGV[1]: TTL in seconds (default: 30)
-- ARGV[2]: Context/metadata (optional)
-- ARGV[3]: Node ID (optional)
-- ARGV[4]: Request ID (optional)

local cache_key = KEYS[1]
if not cache_key or cache_key == "" then
    return redis.error_reply("Cache key is required")
end

-- Configuration
local miss_sentinel_prefix = "tf_miss:"
local stats_key = "tf_stats:cache_performance"
local miss_sentinel_key = miss_sentinel_prefix .. cache_key

-- Parse arguments with defaults
local ttl = tonumber(ARGV[1]) or 30
local context = ARGV[2] or ""
local node_id = ARGV[3] or "unknown"
local request_id = ARGV[4] or ""

-- Generate request ID if not provided
if request_id == "" then
    request_id = redis.call('TIME')[1] .. redis.call('TIME')[2]
end

-- Create miss sentinel metadata
local miss_data = {
    key = cache_key,
    context = context,
    created_at = redis.call('TIME')[1],
    node_id = node_id,
    request_id = request_id,
    ttl = ttl
}

-- Serialize miss data as JSON-like string
local serialized_data = string.format([[{"key":"%s","context":"%s","created_at":%s,"node_id":"%s","request_id":"%s","ttl":%d}]], 
    miss_data.key, 
    miss_data.context, 
    miss_data.created_at, 
    miss_data.node_id, 
    miss_data.request_id, 
    miss_data.ttl
)

-- Atomic operation: Set miss sentinel and update statistics
local result = redis.call('MULTI')

-- Set the miss sentinel with TTL
redis.call('SETEX', miss_sentinel_key, ttl, serialized_data)

-- Update statistics atomically
redis.call('HINCRBY', stats_key, 'miss_sentinels_set', 1)
redis.call('HINCRBY', stats_key, 'total_operations', 1)
redis.call('HSET', stats_key, 'last_miss_sentinel_time', redis.call('TIME')[1])

-- Track miss sentinel by cache type for analytics
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

redis.call('HINCRBY', stats_key, 'miss_sentinels_' .. cache_type, 1)

-- Execute atomic transaction
redis.call('EXEC')

-- Log the operation for government compliance (if logging is enabled)
redis.call('PUBLISH', 'terrafusion:cache:events', string.format(
    '{"event":"miss_sentinel_set","key":"%s","ttl":%d,"context":"%s","node_id":"%s","request_id":"%s","timestamp":%s}',
    cache_key, ttl, context, node_id, request_id, redis.call('TIME')[1]
))

-- Return operation result
return {
    status = "OK",
    key = cache_key,
    ttl = ttl,
    expires_at = redis.call('TIME')[1] + ttl,
    request_id = request_id,
    cache_type = cache_type
}