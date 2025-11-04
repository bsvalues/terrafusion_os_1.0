local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConvertAttribute_information = S101To57AttributeConversionFunctions.information
local ConvertAttribute_surveyDateRange = S101To57AttributeConversionFunctions.surveyDateRange

local function ConvertFeature_QualityOfSurvey(feature)
    local s57Feature = S57Lib.CreateFeature("M_SREL")

    s57Feature.DRVAL2 = feature.depthRangeMaximumValue.GetFirstValue()
    s57Feature.DRVAL1 = feature.depthRangeMinimumValue.GetFirstValue()

    feature.featuresDetected.DidNotConvert = true

    feature.fullSeafloorCoverageAchieved.DidNotConvert = true

    feature.lineSpacingMaximum.DidNotConvert = true

    feature.lineSpacingMinimum.DidNotConvert = true

    s57Feature.SDISMX = feature.measurementDistanceMaximum.GetFirstValue()
    s57Feature.SDISMN = feature.measurementDistanceMinimum.GetFirstValue()
    s57Feature.QUAPOS = feature.qualityOfHorizontalMeasurement.GetFirstValue()
    s57Feature.QUASOU = feature.qualityOfVerticalMeasurement.GetCommaSeparatedValues()
    s57Feature.SCVAL1 = feature.scaleValueMaximum.GetFirstValue()
    s57Feature.SCVAL2 = feature.scaleValueMinimum.GetFirstValue()
    s57Feature.SURATH = feature.surveyAuthority.GetFirstValue()

    local sdr = ConvertAttribute_surveyDateRange(feature.surveyDateRange)
    s57Feature.SURSTA = sdr.SURSTA
    s57Feature.SUREND = sdr.SUREND

    s57Feature.SURTYP = feature.surveyType.GetCommaSeparatedValues()
    s57Feature.TECSOU = feature.techniqueOfVerticalMeasurement.GetCommaSeparatedValues()

    local info = ConvertAttribute_information(feature.information)
    s57Feature.INFORM = info.INFORM
    s57Feature.NINFOM = info.NINFOM
    s57Feature.TXTDSC = info.TXTDSC
    s57Feature.NTXTDS = info.NTXTDS

    return {s57Feature = s57Feature}
end

return ConvertFeature_QualityOfSurvey