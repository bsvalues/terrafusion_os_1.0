
local Utils = require("Utils")

local readonly = 
{
    __newindex = function(table, key, value)
        error('Table is readonly!', 2)
    end
}

local function CreateAttribute(acronym, value)
    return
    {
        Acronym = acronym,
        Value = value
    }
end

local function CreateFeature(acronym)

    local _acronym = acronym
    local _RCID
    -- RCID of S-100 feature that converted to this S-57 object
    local _s100RCID
    -- numeric agency code
    local _agency
    local _FIDN
    local _FIDS

    -- array of attribute, where each attribute is a map with keys - acronym and value
    local Attributes = {}
    -- array of S-57 RRID of equipment features 
    local Equipments = {}
    -- array of S-57 RRID of peer features
    local Peers = {}

    -- make these tables readonly
    setmetatable(Attributes, readonly)
    setmetatable(Equipments, readonly)
    setmetatable(Peers, readonly)

    local function GetAttributeIndex(attrAcronym)
        for idx,attr in ipairs(Attributes) do
            if(attr.Acronym == attrAcronym) then
                return idx
            end
        end
        return nil
    end

    local function SetAttribute(attrAcronym, value)
        -- Some basic sanity check here. Host reports if the attribute does not have definition in the S-57 catalog.
        if not(type(attrAcronym) == "string" and #attrAcronym == 6) then
            error('"'..attrAcronym..'" does not seem to be a valid attribute for feature "' .._acronym.. '".', 2)
        end
        -- not adding attribute for nil
        if value == nil then
            return
        end
        local idx = GetAttributeIndex(attrAcronym)
        if(idx  == nil) then
            rawset(Attributes, #Attributes + 1, CreateAttribute(attrAcronym, value))
        else
            Attributes[idx].Value = value
        end
    end

    local function GetAttribute(attrAcronym)
        -- Some basic sanity check here. Host reports if the attribute does not have definition in the S-57 catalog.
        if not(type(attrAcronym) == "string" and #attrAcronym == 6) then
            error('"'..attrAcronym..'" does not seem to be a valid attribute for feature "' .._acronym.. '".', 2)
        end
        
        for _,attr in ipairs(Attributes) do
            if(attr.Acronym == attrAcronym) then
                return attr.Value
            end
        end
        return nil
    end

    local function GetAcronym()
        return _acronym
    end

    local function SetRCID(RCID)
        if(type(RCID) ~= "number") then
            error("SetRCID called with an invalid RCID'"..RCID.."'", 2)
        end
        _RCID = RCID
    end

    local function GetRCID()
        return _RCID
    end

    -- keep track of the upstream S-100 feature
    local function SetS100RCID(RCID)
        if(type(RCID) ~= "number") then
            error("SetS100RCID called with an invalid S100 RCID'"..RCID.."'", 2)
        end
        _s100RCID = RCID
    end

    local function GetS100RCID()
        return _s100RCID
    end

    local function AddPeer(RRID)
        if(type(RRID) ~= "number") then
            error("AddPeer called with an invalid RRID'"..RRID.."'", 2)
        end
        rawset(Peers, #Peers + 1, RRID)
    end

    local function AddEquipment(RRID)
        if(type(RRID) ~= "number") then
            error("Invalid RRID '"..RRID.."'", 2)
        end
        rawset(Equipments, #Equipments + 1, RRID)
    end

    local function SetFOID(agency, FIDN, FIDS)
        if agency == nil then
            error("Agency cannot be nil", 2)
        end

        if FIDN == nil then
            error("FIDN cannot be nil", 2)
        elseif(type(FIDN) ~= "number" or FIDN < 1 or FIDN > 2^32 - 2) then
                error("Invalid FIDN '"..FIDN.."'", 2)
        end

        if FIDS == nil then
            error("FIDS cannot be nil", 2)
        elseif (type(FIDS) ~= "number" or FIDS < 1 or FIDS > 2^16 - 2) then
            error("Invalid FIDS '"..FIDS.."'", 2)
        end

        _agency = agency
        _FIDN = FIDN
        _FIDS = FIDS
    end
    
    local function GetFOID()
        return  _agency, _FIDN, _FIDS
    end

    local function GetAttributesPrettyString(whitespace)
        local tbl = {}
        for _,attr in pairs(Attributes) do
            local acro = attr.Acronym
            local val = attr.Value
            if val == "" then
                val = '<Unknown>'
            end
            table.insert(tbl, whitespace..Utils.JoinArgs(": ", acro, val))
        end
        return table.concat(tbl, "\n")
    end

    -- use the index metatable only for setting/getting attributes
    local _mt = {
        __index =
            function(_, index)
                local status, res = pcall(GetAttribute, index)
                if not status then
                    error(res, 2)
                end
                return res
            end,
        __newindex =      
            function (_, index, value)
                local status, res = pcall(SetAttribute, index, value)
                if not status then
                    error(res, 2)
                end
                return res
            end
        }

    return setmetatable(
    {
        GetAcronym = GetAcronym,
        SetRCID = SetRCID,
        GetRCID = GetRCID,
        SetFOID = SetFOID,
        GetFOID = GetFOID,
        SetS100RCID = SetS100RCID,
        GetS100RCID = GetS100RCID,
        SetAttribute = SetAttribute,
        GetAttribute = GetAttribute,
        AddPeer = AddPeer,
        AddEquipment = AddEquipment,
        Attributes = Attributes,
        Peers = Peers,
        Equipments = Equipments,
        GetAttributesPrettyString = GetAttributesPrettyString,
    }, _mt)
end


local function CreateCell()
    -- features is an array of S57Features
    -- since we add features sequentially, the array index is RCID
    local _features = {}
    setmetatable(_features, readonly)

    local function AddFeature(feature, s100RCID)
        local s57RCID = #_features + 1
        feature.SetRCID(s57RCID)
        feature.SetS100RCID(s100RCID)
        rawset(_features, s57RCID, feature)
        return s57RCID
    end

    local function GetFeatures()
        return _features
    end

    return {
        AddFeature = AddFeature,
        GetFeatures = GetFeatures,
    }
end

return {
    CreateCell = CreateCell,
    CreateFeature = CreateFeature,
}