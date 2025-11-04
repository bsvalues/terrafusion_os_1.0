local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConvertAttribute_fixedDateRange = S101To57AttributeConversionFunctions.fixedDateRange
local ConvertAttribute_information = S101To57AttributeConversionFunctions.information
local ConvertAttribute_verticalUncertainty = S101To57AttributeConversionFunctions.verticalUncertainty

local function ConvertFeature_TwoWayRoutePart(feature)
    local s57Feature = S57Lib.CreateFeature("TWRTPT")

    s57Feature.CATTRK = feature.basedOnFixedMarks.GetFirstValue()
    s57Feature.DRVAL1 = feature.depthRangeMinimumValue.GetFirstValue()

    local fdr = ConvertAttribute_fixedDateRange(feature.fixedDateRange)
    s57Feature.DATEND = fdr.DATEND
    s57Feature.DATSTA = fdr.DATSTA

    feature.interoperabilityIdentifier.DidNotConvert = true

    s57Feature.ORIENT = feature.orientationValue.GetFirstValue()
    s57Feature.QUASOU = feature.qualityOfVerticalMeasurement.GetCommaSeparatedValues()
    s57Feature.STATUS = feature.status.GetCommaSeparatedValues()
    s57Feature.TECSOU = feature.techniqueOfVerticalMeasurement.GetCommaSeparatedValues()
    s57Feature.TRAFIC = feature.trafficFlow.GetFirstValue()
    s57Feature.SOUACC = ConvertAttribute_verticalUncertainty(feature.verticalUncertainty)
    s57Feature.SCAMIN = feature.scaleMinimum.GetFirstValue()

    local info = ConvertAttribute_information(feature.information)
    s57Feature.INFORM = info.INFORM
    s57Feature.NINFOM = info.NINFOM
    s57Feature.TXTDSC = info.TXTDSC
    s57Feature.NTXTDS = info.NTXTDS

    return {s57Feature = s57Feature}
end

return ConvertFeature_TwoWayRoutePart