local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConvertAttribute_featureName = S101To57AttributeConversionFunctions.featureName
local ConvertAttribute_information = S101To57AttributeConversionFunctions.information

local function ConvertFeature_UnderwaterAwashRock(feature)
    local s57Feature = S57Lib.CreateFeature("UWTROC")

    feature.displayUncertainties.DidNotConvert = true

    s57Feature.EXPSOU = feature.expositionOfSounding.GetFirstValue()

    local objnam = ConvertAttribute_featureName(feature.featureName)
    s57Feature.OBJNAM = objnam.OBJNAM
    s57Feature.NOBJNM = objnam.NOBJNM

    s57Feature.NATSUR = feature.natureOfSurface.GetFirstValue()
    s57Feature.QUASOU = feature.qualityOfVerticalMeasurement.GetCommaSeparatedValues()
    s57Feature.SORDAT = feature.reportedDate.GetFirstValue()
    s57Feature.STATUS = feature.status.GetFirstValue()
    s57Feature.TECSOU = feature.techniqueOfVerticalMeasurement.GetCommaSeparatedValues()
    s57Feature.VALSOU = feature.valueOfSounding.GetFirstValue()
    s57Feature.WATLEV = feature.waterLevelEffect.GetFirstValue()
    s57Feature.SCAMIN = feature.scaleMinimum.GetFirstValue()

    local info = ConvertAttribute_information(feature.information)
    s57Feature.INFORM = info.INFORM
    s57Feature.NINFOM = info.NINFOM
    s57Feature.TXTDSC = info.TXTDSC
    s57Feature.NTXTDS = info.NTXTDS

    feature.defaultClearanceDepth.DidNotConvert = true

    feature.surroundingDepth.DidNotConvert = true

    return {s57Feature = s57Feature}
end

return ConvertFeature_UnderwaterAwashRock