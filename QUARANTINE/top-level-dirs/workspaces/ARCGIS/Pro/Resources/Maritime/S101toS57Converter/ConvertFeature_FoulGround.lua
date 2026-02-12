local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConvertAttribute_featureName = S101To57AttributeConversionFunctions.featureName
local ConvertAttribute_information = S101To57AttributeConversionFunctions.information
local ConvertAttribute_verticalUncertainty = S101To57AttributeConversionFunctions.verticalUncertainty

local function ConvertFeature_FoulGround(feature)
    local s57Feature = S57Lib.CreateFeature("OBSTRN")

    s57Feature.CATOBS = 7

    local objnam = ConvertAttribute_featureName(feature.featureName)
    s57Feature.OBJNAM = objnam.OBJNAM
    s57Feature.NOBJNM = objnam.NOBJNM

    s57Feature.QUASOU = feature.qualityOfVerticalMeasurement.GetCommaSeparatedValues()
    s57Feature.SORDAT = feature.reportedDate.GetFirstValue()
    s57Feature.STATUS = feature.status.GetCommaSeparatedValues()
    s57Feature.TECSOU = feature.techniqueOfVerticalMeasurement.GetCommaSeparatedValues()
    s57Feature.VALSOU = feature.valueOfSounding.GetFirstValue()
    s57Feature.SOUACC = ConvertAttribute_verticalUncertainty(feature.verticalUncertainty)
    s57Feature.SCAMIN = feature.scaleMinimum.GetFirstValue()

    local info = ConvertAttribute_information(feature.information)
    s57Feature.INFORM = info.INFORM
    s57Feature.NINFOM = info.NINFOM
    s57Feature.TXTDSC = info.TXTDSC
    s57Feature.NTXTDS = info.NTXTDS

    return {s57Feature = s57Feature}
end

return ConvertFeature_FoulGround