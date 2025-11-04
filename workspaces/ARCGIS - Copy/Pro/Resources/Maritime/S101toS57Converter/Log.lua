-- Log module simply wraps the io.output(), and writes all the logs to the 
-- configured output using io.write. The varargs passed to various log functions
-- are formatted and separated using a single space ' '. nil can be passed in 
-- the varargs and is formatted as 'nil'. Initialize, and Close sets and restore
-- the current io.output. The Notify* functions also calls the configured callback
-- in addition to logging.

-- TODO DO NOT USER IO.OUTPUT FOR LOGGING AS WE MIGHT SEE THE MESSAGE FROM ALL 
-- IO.WRITE FROM OUTSIDE OF OUR PROGRAM
-- USE A FILE INSTEAD....

local Utils  =require('Utils')
local callback

local levels = {Error = 'Error', Warn = 'Warning', Info = 'Info', Debug = 'Debug'}

local currentOutput
local function Initialize(output)
    currentOutput = io.output()
    io.output(output)
end

local function SetCallback(callbackFx)
    callback = callbackFx
end

local function Error(...)
    local msg = Utils.JoinArgs(' ', ...)
    io.write(levels.Error, ': ', msg, '\n')
end

local function Warn(...)
    local msg = Utils.JoinArgs(' ', ...)
    io.write(levels.Warn, ': ', msg, '\n')
end

local function Info(...)
    local msg = Utils.JoinArgs(' ', ...)
    io.write(levels.Info, ': ', msg, '\n')
end

local function Debug(...)
    local msg = Utils.JoinArgs(' ', ...)
    io.write(levels.Debug, ': ', msg, '\n')
end

-- Log and Notify to the configured callback 
local function NotifyError(...)
    Error(...)
    if callback ~= nil then
        callback(levels.Error, Utils.JoinArgs(' ', ...))
    end
end

local function NotifyWarn(...)
    Warn(...)
    if callback ~= nil then
        callback(levels.Warn, Utils.JoinArgs(' ', ...))
    end
end

local function NotifyInfo(...)
    Info(...)
    if callback ~= nil then
        callback(levels.Info, Utils.JoinArgs(' ', ...))
    end
end

local function NotifyDebug(...)
    Debug(...)
    if callback ~= nil then
        callback(levels.Debug, Utils.JoinArgs(' ', ...))
    end
end

local function Flush()
    io.flush()
end

local function Close()
    io.output(currentOutput)
end

return {
    Initialize = Initialize,
    SetCallback = SetCallback,
    Error = Error,
    Warn = Warn,
    Info = Info,
    Debug = Debug,
    NotifyError = NotifyError,
    NotifyWarn = NotifyWarn,
    NotifyInfo = NotifyInfo,
    NotifyDebug = NotifyDebug,
    Flush = Flush,
    Close = Close,
}
