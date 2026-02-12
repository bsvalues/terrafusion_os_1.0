
-- Concatenates varargs with a given delimiter
-- Replaces nil with quoted nil string
local function JoinArgs(delimiter, ...)
    local t = table.pack(...)
    for i = 1,t.n do
        if t[i] == nil then
            t[i] = "nil"
        end
    end
    return table.concat(t, delimiter)
end

-- Merges a1 and a2
local function MergeArrays(a1, a2)
    if a1 == nil then
        return a2
    end
    if a2 == nil then
        return a1
    end
    for _,v in ipairs(a2) do
        table.insert(a1, v)
    end
    return a1
end

return {
    JoinArgs = JoinArgs,
    MergeArrays = MergeArrays,
}