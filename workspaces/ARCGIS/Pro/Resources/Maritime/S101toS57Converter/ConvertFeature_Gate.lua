local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConcatenateS57Attribute = S101To57AttributeConversionFunctions.ConcatenateS57Attribute
local ConvertAttribute_featureName = S101To57AttributeConversionFunctions.featureName
local ConvertAttribute_horizontalClearanceOpen = S101To57AttributeConversionFunctions.horizontalClearanceOpen
local ConvertAttribute_information = S101To57AttributeConversionFunctions.information
local ConvertAttribute_verticalDatum = S101To57AttributeConversionFunctions.verticalDatum
local ConvertAttribute_verticalUncertainty = S101To57AttributeConversionFunctions.verticalUncertainty

local function ConvertFeature_Gate(feature)
    local s57Feature = S57Lib.CreateFeature("GATCON")

    s57Feature.CATGAT = feature.categoryOfGate.GetFirstValue()
    s57Feature.CONDTN = feature.condition.GetFirstValue()
    s57Feature.DRVAL1 = feature.depthRangeMinimumValue.GetFirstValue()

    local objnam = ConvertAttribute_featureName(feature.featureName)
    s57Feature.OBJNAM = objnam.OBJNAM
    s57Feature.NOBJNM = objnam.NOBJNM

    local hco = ConvertAttribute_horizontalClearanceOpen(feature.horizontalClearanceOpen)
    s57Feature.HORCLR = hco.HORCLR
    s57Feature.HORACC = hco.HORACC

    s57Feature.NATCON = feature.natureOfConstruction.GetCommaSeparatedValues()
    s57Feature.QUASOU = feature.qualityOfVerticalMeasurement.GetCommaSeparatedValues()
    s57Feature.STATUS = feature.status.GetCommaSeparatedValues()

    feature.verticalClearanceOpen.DidNotConvert = true

    local verdat = ConvertAttribute_verticalDatum(feature.verticalDatum)
    s57Feature.VERDAT = verdat.VERDAT
    s57Feature.INFORM = verdat.INFORM

    s57Feature.SOUACC = ConvertAttribute_verticalUncertainty(feature.verticalUncertainty)
    s57Feature.SCAMIN = feature.scaleMinimum.GetFirstValue()

    local info = ConvertAttribute_information(feature.information)
    s57Feature.INFORM = ConcatenateS57Attribute(s57Feature.INFORM, info.INFORM)
    s57Feature.NINFOM = info.NINFOM
    s57Feature.TXTDSC = info.TXTDSC
    s57Feature.NTXTDS = info.NTXTDS

    return {s57Feature = s57Feature}
end

return ConvertFeature_Gate