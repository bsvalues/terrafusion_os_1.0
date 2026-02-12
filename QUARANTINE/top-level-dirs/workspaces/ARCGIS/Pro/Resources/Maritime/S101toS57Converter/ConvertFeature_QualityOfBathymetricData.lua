local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConvertAttribute_information = S101To57AttributeConversionFunctions.information
local ConvertAttribute_surveyDateRange = S101To57AttributeConversionFunctions.surveyDateRange
local ConvertAttribute_zoneOfConfidence = S101To57AttributeConversionFunctions.zoneOfConfidence

local function ConvertFeature_QualityOfBathymetricData(feature)
    local s57Feature = S57Lib.CreateFeature("M_QUAL")

    feature.categoryOfTemporalVariation.DidNotConvert = true

    feature.dataAssessment.DidNotConvert = true

    s57Feature.DRVAL2 = feature.depthRangeMaximumValue.GetFirstValue()
    s57Feature.DRVAL1 = feature.depthRangeMinimumValue.GetFirstValue()

    feature.featuresDetected.DidNotConvert = true

    feature.fullSeafloorCoverageAchieved.DidNotConvert = true

    local sdr = ConvertAttribute_surveyDateRange(feature.surveyDateRange)
    s57Feature.SURSTA = sdr.SURSTA
    s57Feature.SUREND = sdr.SUREND

    local zoc = ConvertAttribute_zoneOfConfidence(feature.zoneOfConfidence)
    s57Feature.CATZOC = zoc.CATZOC
    s57Feature.DATEND = zoc.DATEND
    s57Feature.DATSTA = zoc.DATSTA

    local info = ConvertAttribute_information(feature.information)
    s57Feature.INFORM = info.INFORM
    s57Feature.NINFOM = info.NINFOM
    s57Feature.TXTDSC = info.TXTDSC
    s57Feature.NTXTDS = info.NTXTDS

    return {s57Feature = s57Feature}
end

return ConvertFeature_QualityOfBathymetricData