local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConvertAttribute_featureName = S101To57AttributeConversionFunctions.featureName
local ConvertAttribute_information = S101To57AttributeConversionFunctions.information
local ConvertAttribute_radarConspicuous = S101To57AttributeConversionFunctions.radarConspicuous

local function ConvertFeature_Wreck(feature)
    local s57Feature = S57Lib.CreateFeature("WRECKS")

    s57Feature.CATWRK = feature.categoryOfWreck.GetFirstValue()

    feature.displayUncertainties.DidNotConvert = true

    s57Feature.EXPSOU = feature.expositionOfSounding.GetFirstValue()

    local objnam = ConvertAttribute_featureName(feature.featureName)
    s57Feature.OBJNAM = objnam.OBJNAM
    s57Feature.NOBJNM = objnam.NOBJNM

    s57Feature.HEIGHT = feature.height.GetFirstValue()
    s57Feature.QUASOU = feature.qualityOfVerticalMeasurement.GetCommaSeparatedValues()
    s57Feature.CONRAD = ConvertAttribute_radarConspicuous(feature.radarConspicuous)
    s57Feature.SORDAT = feature.reportedDate.GetFirstValue()
    s57Feature.STATUS = feature.status.GetCommaSeparatedValues()
    s57Feature.TECSOU = feature.techniqueOfVerticalMeasurement.GetCommaSeparatedValues()
    s57Feature.VALSOU = feature.valueOfSounding.GetFirstValue()
    s57Feature.CONVIS = feature.visualProminence.GetFirstValue()
    s57Feature.WATLEV = feature.waterLevelEffect.GetFirstValue()
    s57Feature.SCAMIN = feature.scaleMinimum.GetFirstValue()

    local info = ConvertAttribute_information(feature.information)
    s57Feature.INFORM = info.INFORM
    s57Feature.NINFOM = info.NINFOM
    s57Feature.TXTDSC = info.TXTDSC
    s57Feature.NTXTDS = info.NTXTDS

    s57Feature.PICREP = feature.pictorialRepresentation.GetFirstValue()

    feature.defaultClearanceDepth.DidNotConvert = true

    feature.surroundingDepth.DidNotConvert = true

    return {s57Feature = s57Feature}
end

return ConvertFeature_Wreck