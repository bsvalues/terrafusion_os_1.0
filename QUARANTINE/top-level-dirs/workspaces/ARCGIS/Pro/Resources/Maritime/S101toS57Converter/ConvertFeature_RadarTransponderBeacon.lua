local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConvertAttribute_featureName = S101To57AttributeConversionFunctions.featureName
local ConvertAttribute_fixedDateRange = S101To57AttributeConversionFunctions.fixedDateRange
local ConvertAttribute_information = S101To57AttributeConversionFunctions.information
local ConvertAttribute_periodicDateRange = S101To57AttributeConversionFunctions.periodicDateRange
local ConvertAttribute_radarWaveLength = S101To57AttributeConversionFunctions.radarWaveLength
local ConvertAttribute_sectorLimit = S101To57AttributeConversionFunctions.sectorLimit
local ConvertAttribute_signalSequence = S101To57AttributeConversionFunctions.signalSequence

local function ConvertFeature_RadarTransponderBeacon(feature)
    local s57Feature = S57Lib.CreateFeature("RTPBCN")

    s57Feature.CATRTB = feature.categoryOfRadarTransponderBeacon.GetFirstValue()

    local objnam = ConvertAttribute_featureName(feature.featureName)
    s57Feature.OBJNAM = objnam.OBJNAM
    s57Feature.NOBJNM = objnam.NOBJNM

    local fdr = ConvertAttribute_fixedDateRange(feature.fixedDateRange)
    s57Feature.DATEND = fdr.DATEND
    s57Feature.DATSTA = fdr.DATSTA

    feature.interoperabilityIdentifier.DidNotConvert = true

    local pdr = ConvertAttribute_periodicDateRange(feature.periodicDateRange)
    s57Feature.PEREND = pdr.PEREND
    s57Feature.PERSTA = pdr.PERSTA

    s57Feature.RADWAL = ConvertAttribute_radarWaveLength(feature.radarWaveLength)

    local sl = ConvertAttribute_sectorLimit(feature.sectorLimit)
    s57Feature.SECTR1 = sl.SECTR1
    s57Feature.SECTR2 = sl.SECTR2

    s57Feature.SIGGRP = feature.signalGroup.GetFirstValue()
    s57Feature.SIGSEQ = ConvertAttribute_signalSequence(feature.signalSequence)
    s57Feature.STATUS = feature.status.GetCommaSeparatedValues()
    s57Feature.VALMXR = feature.valueOfMaximumRange.GetFirstValue()
    s57Feature.SCAMIN = feature.scaleMinimum.GetFirstValue()

    local info = ConvertAttribute_information(feature.information)
    s57Feature.INFORM = info.INFORM
    s57Feature.NINFOM = info.NINFOM
    s57Feature.TXTDSC = info.TXTDSC
    s57Feature.NTXTDS = info.NTXTDS

    return {s57Feature = s57Feature}
end

return ConvertFeature_RadarTransponderBeacon