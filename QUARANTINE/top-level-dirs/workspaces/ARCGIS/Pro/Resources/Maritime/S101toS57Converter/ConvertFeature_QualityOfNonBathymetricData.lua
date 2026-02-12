local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConvertAttribute_horizontalPositionUncertainty = S101To57AttributeConversionFunctions.horizontalPositionUncertainty
local ConvertAttribute_information = S101To57AttributeConversionFunctions.information
local ConvertAttribute_surveyDateRange = S101To57AttributeConversionFunctions.surveyDateRange
local ConvertAttribute_verticalUncertainty = S101To57AttributeConversionFunctions.verticalUncertainty

local function ConvertFeature_QualityOfNonBathymetricData(feature)
    local s57Feature = S57Lib.CreateFeature("M_ACCY")

    feature.categoryOfTemporalVariation.DidNotConvert = true

    s57Feature.HORACC = feature.horizontalDistanceUncertainty.GetFirstValue()
    s57Feature.POSACC = ConvertAttribute_horizontalPositionUncertainty(feature.horizontalPositionUncertainty)

    feature.orientationUncertainty.DidNotConvert = true

    local sdr = ConvertAttribute_surveyDateRange(feature.surveyDateRange)
    s57Feature.SURSTA = sdr.SURSTA
    s57Feature.SUREND = sdr.SUREND

    s57Feature.SOUACC = ConvertAttribute_verticalUncertainty(feature.verticalUncertainty)

    local info = ConvertAttribute_information(feature.information)
    s57Feature.INFORM = info.INFORM
    s57Feature.NINFOM = info.NINFOM
    s57Feature.TXTDSC = info.TXTDSC
    s57Feature.NTXTDS = info.NTXTDS

    return {s57Feature = s57Feature}
end

return ConvertFeature_QualityOfNonBathymetricData