
local S57Lib = require("S57Lib")
local S100Lib = require("S100Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")
local S101To57FeatureConversionFunctions = require("S101To57FeatureConversionFunctions")
local ConcatenateS57Attribute = S101To57AttributeConversionFunctions.ConcatenateS57Attribute
local Log = require("Log")
local Utils = require("Utils")

-- Converts the NauticalInformation associated with the given S100Feature to the 
-- attributes of the given S-57 S57 Feature. Concatenates certain fields while skips
-- others if they are already populuated.

local function ConvertNauticalInformation(s101Cell, s100Feature, s57Feature)

    local ConvertAttribute_information = S101To57AttributeConversionFunctions.information
    local ConvertAttribute_fixedDateRange = S101To57AttributeConversionFunctions.fixedDateRange
    local ConvertAttribute_periodicDateRange = S101To57AttributeConversionFunctions.periodicDateRange

    local informationAssociations = s100Feature.GetInformationAssociationsByInformationCode("NauticalInformation")
    for _,inas in ipairs(informationAssociations) do
        local nauticalInformation = s101Cell.Informations[inas.RRID]

        -- concatenate INFORM/NINFOM/TXTDSC/NTXTDS/PICREP
        -- TODO: handle information.headline
        local info = ConvertAttribute_information(nauticalInformation.information)
        s57Feature.INFORM = ConcatenateS57Attribute(s57Feature.INFORM, info.INFORM)
        s57Feature.NINFOM = ConcatenateS57Attribute(s57Feature.NINFOM, info.NINFOM)
        s57Feature.TXTDSC = ConcatenateS57Attribute(s57Feature.TXTDSC, info.TXTDSC)
        s57Feature.NTXTDS = ConcatenateS57Attribute(s57Feature.NTXTDS, info.NTXTDS)
        local picrep = nauticalInformation.pictorialRepresentation.GetFirstValue()
        s57Feature.PICREP = ConcatenateS57Attribute(s57Feature.PICREP, picrep)

        local fdr = ConvertAttribute_fixedDateRange(nauticalInformation.fixedDateRange)
        if s57Feature.DATEND == nil then
            s57Feature.DATEND = fdr.DATEND
        end
        if s57Feature.DATEND == nil then
            s57Feature.DATSTA = fdr.DATSTA
        end

        local pdr = ConvertAttribute_periodicDateRange(nauticalInformation.periodicDateRange)
        if s57Feature.PEREND == nil then
            s57Feature.PEREND = pdr.PEREND
        end
        if s57Feature.PERSTA == nil then
            s57Feature.PERSTA = pdr.PERSTA
        end

    end
end

local function ConvertSpatialQuality(s101Cell, s100Feature, s57Feature)

    local ConvertAttribute_spatialAccuracy = S101To57AttributeConversionFunctions.spatialAccuracy

    local spataialQualityAssociations = s100Feature.GetInformationAssociationsByInformationCode("SpatialQuality")
    for _,inas in ipairs(spataialQualityAssociations) do
        local spatialQuality = s101Cell.Informations[inas.RRID]
        local spacc = ConvertAttribute_spatialAccuracy(spatialQuality.spatialAccuracy)
        local catzoc = s57Feature.CATZOC
        local hpu_uf = ''
        local vu_uf = ''

        if catzoc == '1' then
            hpu_uf = '5'
            vu_uf = '0.5'
        elseif  catzoc == '2' then
            hpu_uf = '20'
            vu_uf = '1'
        elseif catzoc == '3' then
            hpu_uf = '50'
            vu_uf = '1'
        elseif catzoc == '4' then
            hpu_uf = '500'
            vu_uf = '2'
        end

        if(#hpu_uf > 0) then
            if (spacc.POSACC ~= hpu_uf) then
                s57Feature.POSACC = spacc.POSACC
            end
        end

        if(#vu_uf > 0) then
            if (spacc.SOUACC ~= vu_uf) then
                s57Feature.SOUACC = spacc.SOUACC
            end
        end

        -- ignore the DATEND and DATSTA converted from spatialAccuracy for M_QUAL.
    end
end

-- Find the associated feature equivalent in S-57 cell
-- S-101 product specification Annex B (clause B1) specifies all the referenced records must be
-- encoded before the feature that references it. We assume the features are are ordered by the 
-- their RCID. So, the map s101FeatureToS57FeaturesMap shoud have the s57 feature(s) corresponding
-- to the referenced features unless it was dropped, or no conversion exists.
local function GetAssociatedFeaturesEquivalentInS57Cell(s101FeatureToS57FeaturesMap, s101Feature, s57Feature)
    local equipments = {}
    local peers = {}

    local strEquipments = s101Feature.GetFeatureAssociationsByRoleCode("supports")
    for _,fasc in ipairs(strEquipments) do
        local s101RRID = fasc.RRID
        local s57RRIDs = s101FeatureToS57FeaturesMap[s101RRID]
        
        if s57RRIDs == nil or #s57RRIDs == 0 then
            Log.Warn("Unable to associate equipment feature", fasc.FeatureCode, "(RRID = "..fasc.RRID..")",
                        "supported by the structure feature", s101Feature.GetCode(), "(RCID = "..s101Feature.GetRCID()..")")
        else
            for _,s57rrid in ipairs(s57RRIDs) do
                table.insert(equipments, s57rrid)
            end
        end
    end

    -- consistsOf/componentOf roles covers most of the aggregation types
    -- TODO: add the following aggregations with other role types 
    -- FairwayAuxiliary
    -- TextAssociation
    -- UpdateInformation
    local containedFeatures = s101Feature.GetFeatureAssociationsByRoleCode("consistsOf")

    if #containedFeatures > 0 and (s57Feature.GetAcronym() ~= "C_AGGR" and s57Feature.GetAcronym() ~= "C_ASSO") then
        error("S-57 feature "..s57Feature.GetAcronym().." is not collection feature but has peers in its S-101 equivalent!", 2)
    end

    for _,fasc in ipairs(containedFeatures) do
        local s101RRID = fasc.RRID
        local s57RRIDs = s101FeatureToS57FeaturesMap[s101RRID]
        
        if s57RRIDs == nil or #s57RRIDs == 0 then
            Log.Warn("Unable to associate peer feature", fasc.FeatureCode, "(RRID = "..fasc.RRID..")",
                        "in the aggregattion feature", s101Feature.GetCode(), "(RCID = "..s101Feature.GetRCID()..")")
        else
            for _,s57rrid in ipairs(s57RRIDs) do
                table.insert(peers, s57rrid)
            end
        end
    end

    return equipments, peers

end

local function WriteToMappingFile(mappingFile, s101Feature, firstFeature, additionalFeatures, newEquipments, newPeers)
    mappingFile:write("\n")
    mappingFile:write("RCID: "..s101Feature.GetRCID(), "\n")
    mappingFile:write("FOID: "..Utils.JoinArgs(",", s101Feature.GetFOID()), "\n")
    mappingFile:write(s101Feature.GetCode(), "\n")
    mappingFile:write(s101Feature.GetAttributesPrettyString("\t"), "\n")
    mappingFile:write(".........................................\n\n")

    mappingFile:write("RCID: "..firstFeature.GetRCID(), "\n")
    mappingFile:write(firstFeature.GetAcronym(), "\n")
    mappingFile:write(firstFeature.GetAttributesPrettyString("\t"), "\n")

    if additionalFeatures ~= nil then
        for _,additionalFeature in ipairs(additionalFeatures) do
            mappingFile:write("\n")
            mappingFile:write("RCID: "..additionalFeature.GetRCID(), "\n")
            mappingFile:write("FOID: "..Utils.JoinArgs(",", additionalFeature.GetFOID()), "\n")
            mappingFile:write(additionalFeature.GetAcronym(), "\n")
            mappingFile:write(additionalFeature.GetAttributesPrettyString("\t"), "\n")
        end
    end

    if newEquipments ~= nil then
        for _,equipmentFeature in ipairs(newEquipments) do
            mappingFile:write("\n")
            mappingFile:write("RCID: "..equipmentFeature.GetRCID(), "\n")
            mappingFile:write("FOID: "..Utils.JoinArgs(",", equipmentFeature.GetFOID()), "\n")
            mappingFile:write(equipmentFeature.GetAcronym(), " (Equipment)", "\n")
            mappingFile:write(equipmentFeature.GetAttributesPrettyString("\t"), "\n")
        end
    end

    if newPeers ~= nil then
        for _,peerFeature in ipairs(newPeers) do
            mappingFile:write("\n")
            mappingFile:write("RCID: "..peerFeature.GetRCID(), "\n")
            mappingFile:write("FOID: "..Utils.JoinArgs(",", peerFeature.GetFOID()), "\n")
            mappingFile:write(peerFeature.GetAcronym(), " (Peer)", "\n")
            mappingFile:write(peerFeature.GetAttributesPrettyString("\t"), "\n")
        end
    end

    mappingFile:write("\n---------------------------------------------------------------------\n")

end

local function ConvertS101ToS57Cell(s101Cell)

    local outputPath = HostGetOutputPath()
    -- Logfile is initialized in host to capture all the pre conversion messages.

    local mappingFilePath = outputPath.."\\"..s101Cell.GetName().."_mapping.log"
    local mappingFile = assert(io.open(mappingFilePath, "w"))

    local convertedCount = 0

    local s57Cell = S57Lib.CreateCell()
    -- Keep track of S101 feature RCID -> {array of S-57 RCID}
    local s101FeatureToS57FeaturesMap = {}
    -- TODO: S101 info RCID -> {table of {S-57 RCID->attributes}} ?

    for _, s101Feature in pairs(s101Cell.Features) do

        local conversionFunction = S101To57FeatureConversionFunctions[s101Feature.GetCode()]
        if(conversionFunction == nil) then
            Log.Error("No conversion function exists for feature "..s101Feature.GetCode())
            goto continue_features
        end

        -- TODO: user pcall - handle error, and close log
        local status, result = pcall(conversionFunction, s101Feature)
        if not status then
            Log.Error("Error when converting '"..s101Feature.GetCode().."'", "RCID:", "LNAM:", s101Feature.GetRCID(), Utils.JoinArgs(",", s101Feature.GetFOID()), result)
            goto continue_features
        end

        local firstFeature = result.s57Feature
        if firstFeature == nil then
            Log.Error("Feature did not convert '"..s101Feature.GetCode().."'")
            goto continue_features
        end

        local additionalFeatures = result.additionalFeatures
        local newEquipments = result.equipments
        local newPeers = result.peers

        local s101RCID = s101Feature.GetRCID()
        local s101Agency, s101FIDN, s101FIDS = s101Feature.GetFOID()
        s101FeatureToS57FeaturesMap[s101RCID] = {}

        firstFeature.SetFOID(s101Agency, s101FIDN, s101FIDS)

        local associatedEquipments, associatedPeers = GetAssociatedFeaturesEquivalentInS57Cell(s101FeatureToS57FeaturesMap, s101Feature, firstFeature)

        -- if multiple conversions exists, add the equpement/peers features only to the 1st feature.
        for _,equipmentRCID in ipairs(associatedEquipments) do
            firstFeature.AddEquipment(equipmentRCID)
        end
        for _,peerRCID in ipairs(associatedPeers) do
            firstFeature.AddPeer(peerRCID)
        end

        if additionalFeatures ~= nil then
            for _,additionalFeature in ipairs(additionalFeatures) do
                
                local newFidn, newFids = s101Cell.GetNext_FIDN_And_FIDS(s101FIDS)
                additionalFeature.SetFOID(s101Agency, newFidn, newFids)
                local additionalFeatureRCID = s57Cell.AddFeature(additionalFeature, s101RCID)
                table.insert(s101FeatureToS57FeaturesMap[s101RCID], additionalFeatureRCID)
            end
        end

        if newEquipments ~= nil then
            for _,equipmentFeature in ipairs(newEquipments) do
                local newFidn, newFids = s101Cell.GetNext_FIDN_And_FIDS(s101FIDS)
                equipmentFeature.SetFOID(s101Agency, newFidn, newFids)
                local equipmentRCID = s57Cell.AddFeature(equipmentFeature, s101RCID) 
                firstFeature.AddEquipment(equipmentRCID)
                table.insert(s101FeatureToS57FeaturesMap[s101RCID], equipmentRCID)
            end
        end

        if newPeers ~= nil then
            for _,peerFeature in ipairs(newPeers) do
                local newFidn, newFids = s101Cell.GetNext_FIDN_And_FIDS(s101FIDS)
                peerFeature.SetFOID(s101Agency, newFidn, newFids)
                local peerRCID = s57Cell.AddFeature(peerFeature, s101RCID) 
                firstFeature.AddPeer(peerRCID)
                table.insert(s101FeatureToS57FeaturesMap[s101RCID], peerRCID)
            end
        end

        ConvertNauticalInformation(s101Cell, s101Feature, firstFeature)
        if(s101Feature.GetCode() == 'QualityOfBathymetricData') then
            ConvertSpatialQuality(s101Cell, s101Feature, firstFeature)
        end
        local s57RCID = s57Cell.AddFeature(firstFeature, s101RCID)
        table.insert(s101FeatureToS57FeaturesMap[s101RCID], s57RCID)

        convertedCount = convertedCount + 1

        WriteToMappingFile(mappingFile, s101Feature, firstFeature, additionalFeatures, newEquipments, newPeers)

        ::continue_features::
    end

    Log.NotifyInfo("Converted:", convertedCount.."/"..#s101Cell.Features, "S-101 features.")

    mappingFile:close()
    
    -- Let Host close it to log all the post conversion messages.
    -- Log.Close()

    return {s57Cell = s57Cell, s100FeatureToS57FeaturesMap = s101FeatureToS57FeaturesMap}
end

return ConvertS101ToS57Cell
