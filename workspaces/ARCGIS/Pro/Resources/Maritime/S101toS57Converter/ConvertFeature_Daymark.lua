local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConcatenateS57Attribute = S101To57AttributeConversionFunctions.ConcatenateS57Attribute
local ConvertAttribute_featureName = S101To57AttributeConversionFunctions.featureName
local ConvertAttribute_fixedDateRange = S101To57AttributeConversionFunctions.fixedDateRange
local ConvertAttribute_information = S101To57AttributeConversionFunctions.information
local ConvertAttribute_periodicDateRange = S101To57AttributeConversionFunctions.periodicDateRange
local ConvertAttribute_radarConspicuous = S101To57AttributeConversionFunctions.radarConspicuous
local ConvertAttribute_shapeInformation = S101To57AttributeConversionFunctions.shapeInformation

local function ConvertFeature_Daymark(feature)
    local s57Feature = S57Lib.CreateFeature("DAYMAR")

    s57Feature.CATSPM = feature.categoryOfSpecialPurposeMark.GetCommaSeparatedValues()
    s57Feature.COLOUR = feature.colour.GetCommaSeparatedValues()
    s57Feature.COLPAT = feature.colourPattern.GetFirstValue()
    s57Feature.ELEVAT = feature.elevation.GetFirstValue()

    local objnam = ConvertAttribute_featureName(feature.featureName)
    s57Feature.OBJNAM = objnam.OBJNAM
    s57Feature.NOBJNM = objnam.NOBJNM

    local fdr = ConvertAttribute_fixedDateRange(feature.fixedDateRange)
    s57Feature.DATEND = fdr.DATEND
    s57Feature.DATSTA = fdr.DATSTA

    s57Feature.HEIGHT = feature.height.GetFirstValue()

    feature.interoperabilityIdentifier.DidNotConvert = true

    s57Feature.NATCON = feature.natureOfConstruction.GetCommaSeparatedValues()

    local pdr = ConvertAttribute_periodicDateRange(feature.periodicDateRange)
    s57Feature.PEREND = pdr.PEREND
    s57Feature.PERSTA = pdr.PERSTA

    s57Feature.CONRAD = ConvertAttribute_radarConspicuous(feature.radarConspicuous)
    s57Feature.STATUS = feature.status.GetCommaSeparatedValues()
    s57Feature.TOPSHP = feature.topmarkDaymarkShape.GetFirstValue()
    s57Feature.VERLEN = feature.verticalLength.GetFirstValue()

    local shapeInfo = ConvertAttribute_shapeInformation(feature.shapeInformation)
    s57Feature.INFORM = shapeInfo.INFORM
    s57Feature.NINFOM = shapeInfo.NINFOM

    s57Feature.SCAMIN = feature.scaleMinimum.GetFirstValue()

    local info = ConvertAttribute_information(feature.information)
    s57Feature.INFORM = ConcatenateS57Attribute(s57Feature.INFORM, info.INFORM)
    s57Feature.NINFOM = info.NINFOM
    s57Feature.TXTDSC = info.TXTDSC
    s57Feature.NTXTDS = info.NTXTDS

    s57Feature.PICREP = feature.pictorialRepresentation.GetFirstValue()

    return {s57Feature = s57Feature}
end

return ConvertFeature_Daymark