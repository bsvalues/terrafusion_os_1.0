local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConcatenateS57Attribute = S101To57AttributeConversionFunctions.ConcatenateS57Attribute
local ConvertAttribute_featureName = S101To57AttributeConversionFunctions.featureName
local ConvertAttribute_fixedDateRange = S101To57AttributeConversionFunctions.fixedDateRange
local ConvertAttribute_information = S101To57AttributeConversionFunctions.information
local ConvertAttribute_maximumPermittedDraught = S101To57AttributeConversionFunctions.maximumPermittedDraught
local ConvertAttribute_periodicDateRange = S101To57AttributeConversionFunctions.periodicDateRange

local function ConvertFeature_MooringArea(feature)
    local s57Feature = S57Lib.CreateFeature("ACHARE")

    feature.categoryOfMooringArea.DidNotConvert = true

    local objnam = ConvertAttribute_featureName(feature.featureName)
    s57Feature.OBJNAM = objnam.OBJNAM
    s57Feature.NOBJNM = objnam.NOBJNM

    local fdr = ConvertAttribute_fixedDateRange(feature.fixedDateRange)
    s57Feature.DATEND = fdr.DATEND
    s57Feature.DATSTA = fdr.DATSTA

    s57Feature.INFORM = ConvertAttribute_maximumPermittedDraught(feature.maximumPermittedDraught)

    feature.maximumPermittedVesselLength.DidNotConvert = true

    local pdr = ConvertAttribute_periodicDateRange(feature.periodicDateRange)
    s57Feature.PEREND = pdr.PEREND
    s57Feature.PERSTA = pdr.PERSTA

    s57Feature.RESTRN = feature.restriction.GetCommaSeparatedValues()
    s57Feature.STATUS = feature.status.GetCommaSeparatedValues()
    s57Feature.SCAMIN = feature.scaleMinimum.GetFirstValue()

    local info = ConvertAttribute_information(feature.information)
    s57Feature.INFORM = ConcatenateS57Attribute(s57Feature.INFORM, info.INFORM)
    s57Feature.NINFOM = info.NINFOM
    s57Feature.TXTDSC = info.TXTDSC
    s57Feature.NTXTDS = info.NTXTDS

    feature.vesselSpeedLimit.DidNotConvert = true

    return {s57Feature = s57Feature}
end

return ConvertFeature_MooringArea