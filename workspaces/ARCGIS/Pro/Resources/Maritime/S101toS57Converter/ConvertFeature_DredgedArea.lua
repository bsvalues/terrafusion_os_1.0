local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConcatenateS57Attribute = S101To57AttributeConversionFunctions.ConcatenateS57Attribute
local ConvertAttribute_featureName = S101To57AttributeConversionFunctions.featureName
local ConvertAttribute_information = S101To57AttributeConversionFunctions.information
local ConvertAttribute_maximumPermittedDraught = S101To57AttributeConversionFunctions.maximumPermittedDraught
local ConvertAttribute_verticalUncertainty = S101To57AttributeConversionFunctions.verticalUncertainty

local function ConvertFeature_DredgedArea(feature)
    local s57Feature = S57Lib.CreateFeature("DRGARE")

    s57Feature.DRVAL1 = feature.depthRangeMinimumValue.GetFirstValue()
    s57Feature.DRVAL2 = feature.depthRangeMaximumValue.GetFirstValue()
    s57Feature.SORDAT = feature.dredgedDate.GetFirstValue()

    local objnam = ConvertAttribute_featureName(feature.featureName)
    s57Feature.OBJNAM = objnam.OBJNAM
    s57Feature.NOBJNM = objnam.NOBJNM

    s57Feature.INFORM = ConvertAttribute_maximumPermittedDraught(feature.maximumPermittedDraught)
    s57Feature.QUASOU = feature.qualityOfVerticalMeasurement.GetFirstValue()
    s57Feature.RESTRN = feature.restriction.GetCommaSeparatedValues()
    s57Feature.TECSOU = feature.techniqueOfVerticalMeasurement.GetCommaSeparatedValues()
    s57Feature.SOUACC = ConvertAttribute_verticalUncertainty(feature.verticalUncertainty)

    local info = ConvertAttribute_information(feature.information)
    s57Feature.INFORM = ConcatenateS57Attribute(s57Feature.INFORM, info.INFORM)
    s57Feature.NINFOM = info.NINFOM
    s57Feature.TXTDSC = info.TXTDSC
    s57Feature.NTXTDS = info.NTXTDS

    return {s57Feature = s57Feature}
end

return ConvertFeature_DredgedArea