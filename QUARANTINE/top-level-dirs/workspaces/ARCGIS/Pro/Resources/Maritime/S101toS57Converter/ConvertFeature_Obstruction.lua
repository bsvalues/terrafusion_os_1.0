local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConcatenateS57Attribute = S101To57AttributeConversionFunctions.ConcatenateS57Attribute
local ConvertAttribute_featureName = S101To57AttributeConversionFunctions.featureName
local ConvertAttribute_information = S101To57AttributeConversionFunctions.information
local ConvertAttribute_maximumPermittedDraught = S101To57AttributeConversionFunctions.maximumPermittedDraught

local function ConvertFeature_Obstruction(feature)
    local s57Feature = S57Lib.CreateFeature("OBSTRN")

    s57Feature.CATOBS = feature.categoryOfObstruction.GetFirstValue()
    s57Feature.CONDTN = feature.condition.GetFirstValue()

    feature.displayUncertainties.DidNotConvert = true

    s57Feature.EXPSOU = feature.expositionOfSounding.GetFirstValue()

    local objnam = ConvertAttribute_featureName(feature.featureName)
    s57Feature.OBJNAM = objnam.OBJNAM
    s57Feature.NOBJNM = objnam.NOBJNM

    s57Feature.HEIGHT = feature.height.GetFirstValue()
    s57Feature.INFORM = ConvertAttribute_maximumPermittedDraught(feature.maximumPermittedDraught)
    s57Feature.NATSUR = feature.natureOfSurface.GetCommaSeparatedValues()
    s57Feature.PRODCT = feature.product.GetCommaSeparatedValues()
    s57Feature.QUASOU = feature.qualityOfVerticalMeasurement.GetCommaSeparatedValues()
    s57Feature.SORDAT = feature.reportedDate.GetFirstValue()
    s57Feature.STATUS = feature.status.GetCommaSeparatedValues()
    s57Feature.TECSOU = feature.techniqueOfVerticalMeasurement.GetCommaSeparatedValues()
    s57Feature.VALSOU = feature.valueOfSounding.GetFirstValue()
    s57Feature.VERLEN = feature.verticalLength.GetFirstValue()
    s57Feature.WATLEV = feature.waterLevelEffect.GetFirstValue()
    s57Feature.SCAMIN = feature.scaleMinimum.GetFirstValue()

    local info = ConvertAttribute_information(feature.information)
    s57Feature.INFORM = ConcatenateS57Attribute(s57Feature.INFORM, info.INFORM)
    s57Feature.NINFOM = info.NINFOM
    s57Feature.TXTDSC = info.TXTDSC
    s57Feature.NTXTDS = info.NTXTDS

    feature.defaultClearanceDepth.DidNotConvert = true

    feature.surroundingDepth.DidNotConvert = true

    return {s57Feature = s57Feature}
end

return ConvertFeature_Obstruction