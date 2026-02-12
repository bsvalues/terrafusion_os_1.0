require("FeatureCatalog")
local Utils = require("Utils")

local readonly = 
{
    __newindex = function(table, key, value)
        error("Table is readonly!", 2)
    end
}

local function GetAttributesPrettyStringImpl(attributes, whitespace)
    local tbl = {}
    for attrCode, attribute in pairs(attributes) do
        local didNotConvertMarker = ""
        if attribute.DidNotConvert then
            didNotConvertMarker = "*"
        end
        for i, instance in ipairs(attribute) do
            if attribute.IsSimple then
                local attrval = instance.Value
                if attrval == "" then
                    attrval = "<Unknown>"
                end
                table.insert(tbl, whitespace..Utils.JoinArgs(": ", didNotConvertMarker..attrCode.."["..i.."]", attrval))
            else
                table.insert(tbl, Utils.JoinArgs("", whitespace, didNotConvertMarker..attrCode, "[", i, "]"))
                table.insert(tbl, GetAttributesPrettyStringImpl(instance.Attributes, "\t"..whitespace))
            end
        end
    end
    return table.concat(tbl, "\n")
end

local CreateAttribute

local function CreateComplexInstance(attributeDefinition)
    local DidNotConvert = false
    local Attributes = {}

    for subAttrCode, subAttrBinding in pairs(attributeDefinition.AttributeBindings) do
        rawset(Attributes, subAttrCode, CreateAttribute(subAttrCode))
    end

    local function GetAttribute(attributeCode)
        return Attributes[attributeCode]
    end

    local _mt = {
        -- redirect any index access to Attributes
        __index = function(table, key)
            local attr = Attributes[key]
            if attr == nil then
                error("Attribute '"..attributeDefinition.Code.."' does not have a definition for sub-attribute '"..key.."'", 2)
                end
            return attr
        end
    }

    return
    setmetatable({
        GetAttribute = GetAttribute,
        DidNotConvert = DidNotConvert,
        Attributes = Attributes,
    }, _mt)

end

local function CreateSimpleInstance(attributeDefinition)
    local Value

    local _mt = {
        __index = function(table, key)
                error("Attribute '"..attributeDefinition.code.."' is a Simple Attribute. Cannot have sub-attribute '"..key.."'", 2)
        end
    }

    return
    setmetatable({
        Value = Value,
    }, _mt)
end

CreateAttribute = function(attributeCode)
    local _attributeCode = attributeCode

    local IsSimple = true
    local DidNotConvert = false

    local Instances = {}
    setmetatable(Instances, readonly)

    local attrDefn = FeatureCatalog.ComplexAttributes[attributeCode]
    if attrDefn ~= nil then
        IsSimple = false
    else
        attrDefn = FeatureCatalog.SimpleAttributes[attributeCode]
        if attrDefn == nil then
            error("Feature catalog does not have definition for attribute code '".. _attributeCode ",", 2)
        end
    end

    local function GetLastInstance()
        return Instances[#Instances]
    end

    local function GetNewInstance()
        if(IsSimple) then
            rawset(Instances, #Instances + 1, CreateSimpleInstance(attrDefn))
        else
            rawset(Instances, #Instances + 1, CreateComplexInstance(attrDefn))
        end
        return GetLastInstance()
    end

    local function GetFirstInstance()
        return Instances[1]
    end

    local function HasInstance()
        return #Instances > 0
    end

    local function GetLastOrNewInstance()
        return GetLastInstance() or GetNewInstance()
    end

    local function MaxInstanceReached()
        --TODO: mock only, replace with actual multiplicity for the attribute binding.
        if _attributeCode == "lightChar" then
            if #Instances >= 1 then
                return true
            end
        end
        if #Instances >= 2 then
            return true
        end
        return false
    end

    local function GetFirstValue()
        if not IsSimple then
            error("GetFirstValue is only defined for simple attributes, but was called for complex attribute '".._attributeCode.."'", 2)
        end
        local firstInst = GetFirstInstance()
        return firstInst and firstInst.Value
    end

    local function GetValueArray()
        if not IsSimple then
            error("ValueArray is only defined for simple attributes, but was called for complex attribute ".._attributeCode.."'", 2)
        end
        local values = {}
        for _, inst in ipairs(Instances) do 
            table.insert(values, inst.Value)
        end
        return values
    end

    local function GetCommaSeparatedValues()
        if not IsSimple then
            error("GetCommaSeparatedValues is only defined for simple attributes, but was called for complex attribute ".._attributeCode.."'", 2)
        end

        local values = GetValueArray()
        if #values == 0 then
            return nil
        end
    
        return table.concat(values, ",")
    end

    local _mt =  {
        -- redirect numeric index to instances
        __index = function(table, index)
            if(type(index) ~= "number") then
                error("Error when trying to access '"..index.."' for attribute '".._attributeCode.."'"
                .." Only numeric index is allowed for getting an attribute instance. ", 2)
            end
            -- Define -1 as the last index
            if(index == -1) then
                index = #Instances
            end
            return Instances[index]
        end,
        __newindex = function(table, index)
            error("Error when trying to set '"..index.."' for attribute '".._attributeCode.."'"
            .." Attribute does not have the property", 2)
        end
    }

    return
    setmetatable({
        IsSimple = IsSimple,
        DidNotConvert = DidNotConvert,
        GetNewInstance = GetNewInstance,
        GetLastInstance = GetLastInstance,
        GetFirstInstance = GetFirstInstance,
        HasInstance = HasInstance,
        GetLastOrNewInstance = GetLastOrNewInstance, 
        GetFirstValue = GetFirstValue,
        GetValueArray = GetValueArray,
        GetCommaSeparatedValues = GetCommaSeparatedValues,
        Instances = Instances,
    }, _mt)
end

local function CreateFeatureAssociation(featureCode, RRID, associationCode, roleCode)
    return
    {
        FeatureCode = featureCode, 
        RRID = RRID,
        AssociationCode = associationCode,
        RoleCode = roleCode
    }
end

local function CreateInformationAssociation(informationCode, RRID, associationCode, roleCode)
    return 
    {
        InformationCode = informationCode, 
        RRID = RRID,
        AssociationCode = associationCode,
        RoleCode = roleCode
    }
end

local function CreateFeature(featureCode, RCID, agency, FIDS, FIDN)

    local _featureCode = featureCode
    local _RCID = RCID
    local _agency = agency
    local _FIDS = FIDS
    local _FIDN = FIDN

    -- Array of Attribute
    local Attributes = {}
    -- Array of FeaturAssociation - {FeatureCode, RRID, AssociationCode, RoleCode} 
    local FeatureAssociations = {}
    -- Array of InformationAssociation - {InformationCode, RRID, AssociationCode, RoleCode}
    local InformationAssociations = {}

    setmetatable(FeatureAssociations, readonly)
    setmetatable(InformationAssociations, readonly)
    setmetatable(Attributes, readonly)

    local _featureType = FeatureCatalog.FeatureTypes[_featureCode]
    if _featureType == nil then
        error("Feature catalog does not have a definition for feature type '".. _featureCode.."'", 2)
    end

    -- initialize attributes according to the feature catalog binding definitions
    for attrCode, attrBinding in pairs(_featureType.AttributeBindings) do
        local attribute = CreateAttribute(attrCode)
        rawset(Attributes, attrCode, attribute)
    end

    local function GetCode() 
        return _featureCode
    end

    local function  GetRCID ()
        return _RCID
    end

    local function GetFOID()
        return _agency, _FIDN, _FIDS
    end

    local  function GetAttribute(attributeCode)
        return Attributes[attributeCode]
    end

    local function AddFeatureAssociation(refFeatureCode, RRID, associationCode, roleCode)
        rawset(FeatureAssociations, #FeatureAssociations + 1,
            CreateFeatureAssociation(refFeatureCode, RRID, associationCode, roleCode))
    end

    local function AddInformationAssociation (refInformationCode, RRID, associationCode, roleCode)
        rawset(InformationAssociations, #InformationAssociations + 1,
            CreateInformationAssociation(refInformationCode, RRID, associationCode, roleCode))
    end

    -- Returns all feature associations matching the featureCode.
    -- e.g. feature.GetFeatureAssociations("SpanFixed")
    local function GetFeatureAssociationsByFeatureCode(featureCode)
        local retval = {}
        for _,fasc in ipairs(FeatureAssociations) do
            if featureCode == fasc.FeatureCode  then
                table.insert(retval, fasc)
            end
        end 
        return retval
    end

    -- Returns all feature associations matching the roleCode.
    -- e.g. feature.GetFeatureAssociationsByRole("supports")
    local function GetFeatureAssociationsByRoleCode(roleCode)
        local retval = {}
            for _,fasc in ipairs(FeatureAssociations) do
                if roleCode == fasc.RoleCode then
                    table.insert(retval, fasc)
                end
            end
        return retval
    end

    -- Returns all information associations matching the informationCode.
    local function GetInformationAssociationsByInformationCode(informationCode)
        local retval = {}
        for _,inas in ipairs(InformationAssociations) do
            if informationCode == inas.InformationCode  then
                retval[#retval+1] = inas
            end
        end 
        return retval
    end

    local function GetAttributesPrettyString(whitespace)
        return GetAttributesPrettyStringImpl(Attributes, whitespace)
    end

    local function GetFeatureAssociationsPrettyString()
        local tbl = {}
        for i,featureAssociation in ipairs(FeatureAssociations) do
            local fasc = Utils.JoinArgs(" ", featureAssociation.FeatureCode, featureAssociation.RRID, featureAssociation.AssociationCode, featureAssociation.RoleCode)
            table.insert(tbl, fasc)
        end
        return table.concat(tbl, "\n")
    end
    
    local function GetInformationAssociationsPrettyString()
        local tbl = {}
        for i,informationAssociation in ipairs(InformationAssociations) do
            local inas = Utils.JoinArgs(" ", informationAssociation.InformationCode, informationAssociation.RRID, informationAssociation.AssociationCode, informationAssociation.RoleCode)
            table.insert(tbl, inas)
        end
        return table.concat(tbl, "\n")
    end

    local _mt = {
        -- redirect any index access to attributes
        __index = function(table, key)
            if Attributes[key] == nil then
               error("Feature '"..featureCode.."' does not have a definition for attribute '"..key.."'", 2)
            end
            return GetAttribute(key)
        end
    }

    return
    setmetatable({
        GetCode = GetCode,
        GetRCID = GetRCID,
        GetFOID = GetFOID,
        GetAttribute = GetAttribute,
        AddFeatureAssociation = AddFeatureAssociation,
        AddInformationAssociation = AddInformationAssociation,
        GetFeatureAssociationsByFeatureCode = GetFeatureAssociationsByFeatureCode,
        GetFeatureAssociationsByRoleCode = GetFeatureAssociationsByRoleCode,
        GetInformationAssociationsByInformationCode = GetInformationAssociationsByInformationCode,
        Attributes = Attributes,
        FeatureAssociations = FeatureAssociations,
        InformationAssociations = InformationAssociations,
        GetAttributesPrettyString = GetAttributesPrettyString,
        GetFeatureAssociationsPrettyString = GetFeatureAssociationsPrettyString,
        GetInformationAssociationsPrettyString = GetInformationAssociationsPrettyString,
    }, _mt)
end

local  function CreateInformation(informationCode, RCID)

    local _informationCode = informationCode
    local _RCID = RCID

    -- Array of Attribute
    local Attributes = {}
    setmetatable(Attributes, readonly)

    -- initialize attributes according to the feature catalog binding definitions
    local _informationType = FeatureCatalog.InformationTypes[_informationCode]
    if _informationType == nil then
        error("Feature catalog does not have a definition for information type '".. _informationCode.."'", 2)
    end
    for attrCode, attrBinding in pairs(_informationType.AttributeBindings) do
        rawset(Attributes, attrCode, CreateAttribute(attrCode))
    end

    local function GetCode() 
        return _informationCode
    end

    local function  GetRCID ()
        return _RCID
    end

    local  function GetAttribute(attributeCode)
        return Attributes[attributeCode]
    end
    
    local function GetAttributesPrettyString(whitespace)
        return GetAttributesPrettyStringImpl(Attributes, whitespace)
    end

    local _mt = {
        -- redirect any index access to attributes
        __index = function(table, key)
            if Attributes[key] == nil then
               error("Information '".._informationCode.."' does not have a definition for attribute '"..key.."'", 2)
            end
            return Attributes[key]
        end
    }

    return
    setmetatable({
        GetCode = GetCode,
        GetRCID = GetRCID,
        GetAttribute = GetAttribute,
        Attributes = Attributes,
        GetAttributesPrettyString = GetAttributesPrettyString,
    },_mt)

end

local function CreateCell(cellName)
    local _FIDS_MAX = 2^16 - 2
    local _FIDN_MAX = 2^32 - 2

    -- [map of FIDS -> [map FIDN -> bool]]
    local _usedFIDS2FIDNMap = {}
    -- [map of FIDS -> {array of FIDN}] for easy counting
    local _usedFIDS2FIDNArray = {}

    -- [map of RCID -> Feature]
    local _mapRCIDToFeatures = {}
    -- [map of RCID -> Feature]
     local _mapRCIDToInformationTypes = {}

     local function TrackUsedFIDN(feature)
        local _, fidn, fids = feature.GetFOID()
        if _usedFIDS2FIDNMap[fids] == nil then
            _usedFIDS2FIDNMap[fids] = {}
            _usedFIDS2FIDNArray[fids] = {}
        end
        _usedFIDS2FIDNMap[fids][fidn] = true
        table.insert(_usedFIDS2FIDNArray[fids], fidn)
    end

    local _cellName = cellName
    local function GetName()
        return _cellName
    end

    local Features = {}
    local Informations = {}
    setmetatable(Features, readonly)
    setmetatable(Informations, readonly)

    local function AddFeature(feature)
        rawset(Features, #Features + 1, feature)
        TrackUsedFIDN(feature)
        _mapRCIDToFeatures[feature.GetRCID()] = feature
    end

    local function AddInformation(information)
        rawset(Informations, #Informations + 1, information)
        _mapRCIDToInformationTypes[information.GetRCID()] = information
    end

    local function GetNext_FIDN_And_FIDS(fids)
        if _usedFIDS2FIDNMap[fids] == nil then
            _usedFIDS2FIDNMap[fids] = {}
        end

        local fidnArray = _usedFIDS2FIDNArray[fids]
        local fidnMap = _usedFIDS2FIDNMap[fids]

        -- all the FIDN for the given FIDS were used, find another FIDS with empty slots - starting at FIDS = 1.
        if #fidnArray == _FIDN_MAX then
            local foundEmptySlot = false
            for i = 1, _FIDS_MAX do
                local fidn_i = _usedFIDS2FIDNArray[i]
                if(#fidn_i < _FIDN_MAX) then
                    fids = i
                    foundEmptySlot = true
                end
            end
            if foundEmptySlot == false then
                error("Ran out of FIDS and FIDN", 2)
            end
            fidnArray = _usedFIDS2FIDNArray[fids]
            fidnMap = _usedFIDS2FIDNMap[fids]
        end

        -- start with the next higher FIDN number and wrap around
        local nextFIDN = fidnArray[#fidnArray] + 1

        if nextFIDN > _FIDN_MAX then
            nextFIDN = 1
        end
        while fidnMap[nextFIDN] ~= nil do
            nextFIDN = nextFIDN + 1
            if nextFIDN > _FIDN_MAX then
                nextFIDN = 1
            end
        end
        return nextFIDN, fids
    end

    return
    {
        GetName = GetName, 
        Features = Features, 
        Informations = Informations,
        AddFeature = AddFeature,
        AddInformation = AddInformation,
        GetNext_FIDN_And_FIDS = GetNext_FIDN_And_FIDS
    }
end

local function TestCreateFeatureUsingPath()

    local function CreateFromPath(feature, strpath, val)
        local paths = {}
        for path in string.gmatch(strpath, "[^/]+") do
            table.insert(paths, path)
        end

        local lastInst = feature
        for i = 1,#paths do
            local attr = lastInst[paths[i]]
            lastInst = attr.GetLastOrNewInstance()
        end

        if(val ~= nil) then
            lastInst.Value = val
        end
    end

    local rcid = 1
    local fidn = 1
    local fids = 12345
    local agency = 20046 -- esri
    local bcn = CreateFeature("BeaconSpecialPurposeGeneral", rcid, agency, fids, fidn)

    -- bcn.featureName.NewInstance()
    -- bcn.featureName[-1].name.NewInstance()
    CreateFromPath(bcn, "featureName/name", "test1")
    CreateFromPath(bcn, "featureName/displayName", "True")
    CreateFromPath(bcn, "featureName/language", "adafdfadadfad")

    bcn.featureName[-1].name.NewInstance()
    CreateFromPath(bcn, "featureName/name", "test2")
    CreateFromPath(bcn, "featureName/displayName", "False")
    CreateFromPath(bcn, "featureName/language", "sssss")

    bcn.featureName.NewInstance()
    CreateFromPath(bcn, "featureName/name", "test3")
    CreateFromPath(bcn, "featureName/displayName", "False")
    CreateFromPath(bcn, "featureName/language", "mnopq")

    bcn.featureName.NewInstance()
    CreateFromPath(bcn, "featureName/name", "test3")
    CreateFromPath(bcn, "featureName/displayName", "False")
    CreateFromPath(bcn, "featureName/language", "mnopq")

    bcn.featureName.NewInstance()
    CreateFromPath(bcn, "featureName/name", "test3")
    CreateFromPath(bcn, "featureName/displayName", "False")
    CreateFromPath(bcn, "featureName/language", "mnopq")

    return bcn.GetAttributesPrettyString("")
end

local function TestCreateFeature()
    print(TestCreateFeatureUsingPath())
end

return {
    CreateFeature = CreateFeature,
    CreateInformation = CreateInformation,
    CreateCell = CreateCell,
    TestCreateFeature = TestCreateFeature
}