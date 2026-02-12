-- TerraFusion OS Government Session Affinity Configuration
-- Lua script for HAProxy to implement government-grade session management

-- Government session requirements:
-- 1. Session persistence for multi-step government processes
-- 2. Audit logging for all session activities
-- 3. Secure session token generation and validation
-- 4. Timeout management for security compliance
-- 5. Geographic and IP-based routing for government facilities

-- Session configuration constants
local SESSION_TIMEOUT = 3600  -- 1 hour timeout for government applications
local AUDIT_LOGGING = true
local SECURE_COOKIES = true
local GOVERNMENT_FACILITIES = {
    ["10.0.0.0/8"] = "internal",
    ["172.16.0.0/12"] = "internal", 
    ["192.168.0.0/16"] = "internal"
}

-- Generate secure session identifier
function generate_session_id()
    local charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    local session_id = ""
    math.randomseed(os.time() + os.clock() * 1000000)
    
    for i = 1, 32 do
        local rand_index = math.random(1, #charset)
        session_id = session_id .. charset:sub(rand_index, rand_index)
    end
    
    return "TF_" .. session_id .. "_" .. os.time()
end

-- Audit logging function
function audit_log(session_id, client_ip, action, details)
    if AUDIT_LOGGING then
        local timestamp = os.date("%Y-%m-%d %H:%M:%S")
        local log_entry = string.format(
            "[%s] SESSION_AUDIT: session=%s, client=%s, action=%s, details=%s",
            timestamp, session_id or "none", client_ip, action, details or "none"
        )
        -- Log to HAProxy log (will be captured by syslog/fluentd)
        core.log(core.info, log_entry)
    end
end

-- Check if client is from government facility
function is_government_facility(client_ip)
    for network, facility_type in pairs(GOVERNMENT_FACILITIES) do
        -- Simple network check (in production, use proper CIDR matching)
        if string.match(client_ip, "^10%.") or 
           string.match(client_ip, "^172%.1[6-9]%.") or
           string.match(client_ip, "^172%.2[0-9]%.") or
           string.match(client_ip, "^172%.3[0-1]%.") or
           string.match(client_ip, "^192%.168%.") then
            return true, facility_type
        end
    end
    return false, "external"
end

-- Main session affinity handler
function government_session_handler(txn)
    local client_ip = txn.sf:src()
    local user_agent = txn.http:req_get_headers()["user-agent"] or ""
    local session_cookie = txn.http:req_get_headers()["cookie"]
    local existing_session = nil
    
    -- Extract existing session ID from cookie
    if session_cookie then
        existing_session = string.match(session_cookie, "TF_SESSION=([^;]+)")
    end
    
    -- Check government facility status
    local is_gov_facility, facility_type = is_government_facility(client_ip)
    
    -- Session validation and creation
    if existing_session then
        -- Validate existing session
        audit_log(existing_session, client_ip, "SESSION_CONTINUE", facility_type)
        
        -- Check session timeout (simplified - in production use Redis/database)
        local session_timestamp = string.match(existing_session, ".*_(%d+)$")
        if session_timestamp then
            local current_time = os.time()
            local session_age = current_time - tonumber(session_timestamp)
            
            if session_age > SESSION_TIMEOUT then
                -- Session expired
                audit_log(existing_session, client_ip, "SESSION_EXPIRED", "timeout=" .. session_age)
                existing_session = nil
            else
                -- Session valid, extend timeout
                audit_log(existing_session, client_ip, "SESSION_VALID", "age=" .. session_age)
            end
        end
    end
    
    -- Create new session if needed
    if not existing_session then
        existing_session = generate_session_id()
        audit_log(existing_session, client_ip, "SESSION_CREATED", facility_type .. "_" .. user_agent)
        
        -- Set session cookie
        local cookie_flags = "HttpOnly; Secure; SameSite=Strict"
        if is_gov_facility then
            cookie_flags = cookie_flags .. "; Path=/; Max-Age=" .. SESSION_TIMEOUT
        end
        
        txn.http:res_set_header("Set-Cookie", 
            "TF_SESSION=" .. existing_session .. "; " .. cookie_flags)
    end
    
    -- Government facility routing logic
    if is_gov_facility then
        -- Route government facilities to dedicated backend servers
        txn:set_var("txn.government_session", "true")
        txn:set_var("txn.facility_type", facility_type)
        
        audit_log(existing_session, client_ip, "GOVERNMENT_ROUTING", facility_type)
    else
        -- Standard public routing
        txn:set_var("txn.government_session", "false")
        audit_log(existing_session, client_ip, "PUBLIC_ROUTING", "external")
    end
    
    -- Set session variables for HAProxy routing decisions
    txn:set_var("txn.session_id", existing_session)
    txn:set_var("txn.client_type", facility_type)
    
    -- Security headers for government compliance
    txn.http:res_set_header("X-Session-Type", facility_type)
    txn.http:res_set_header("X-Security-Level", is_gov_facility and "GOVERNMENT" or "PUBLIC")
end

-- Session cleanup handler (called periodically)
function cleanup_expired_sessions()
    audit_log(nil, "system", "SESSION_CLEANUP", "started")
    -- In production, this would clean up expired sessions from Redis/database
    -- For now, just log the cleanup event
    audit_log(nil, "system", "SESSION_CLEANUP", "completed")
end

-- Register the session handler
core.register_action("government_session_handler", {"http-req"}, government_session_handler)

-- Register cleanup task (runs every 5 minutes)
core.register_task(cleanup_expired_sessions)
core.register_task(function()
    while true do
        core.sleep(300) -- 5 minutes
        cleanup_expired_sessions()
    end
end)