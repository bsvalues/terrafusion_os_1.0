local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConcatenateS57Attribute = S101To57AttributeConversionFunctions.ConcatenateS57Attribute
local ConvertAttribute_featureName = S101To57AttributeConversionFunctions.featureName
local ConvertAttribute_information = S101To57AttributeConversionFunctions.information
local ConvertAttribute_multiplicityOfFeatures = S101To57AttributeConversionFunctions.multiplicityOfFeatures
local ConvertAttribute_radarConspicuous = S101To57AttributeConversionFunctions.radarConspicuous

local function ConvertFeature_Landmark(feature)
    local s57Feature = S57Lib.CreateFeature("LNDMRK")

    s57Feature.CATLMK = feature.categoryOfLandmark.GetCommaSeparatedValues()
    s57Feature.CATSPM = feature.categoryOfSpecialPurposeMark.GetCommaSeparatedValues()
    s57Feature.COLOUR = feature.colour.GetCommaSeparatedValues()
    s57Feature.COLPAT = feature.colourPattern.GetFirstValue()
    s57Feature.CONDTN = feature.condition.GetFirstValue()
    s57Feature.ELEVAT = feature.elevation.GetFirstValue()

    local objnam = ConvertAttribute_featureName(feature.featureName)
    s57Feature.OBJNAM = objnam.OBJNAM
    s57Feature.NOBJNM = objnam.NOBJNM

    s57Feature.FUNCTN = feature.GetAttribute("function").GetCommaSeparatedValues()
    s57Feature.HEIGHT = feature.height.GetFirstValue()

    local mltylt = ConvertAttribute_multiplicityOfFeatures(feature.multiplicityOfFeatures)
    s57Feature.MLTYLT = mltylt.MLTYLT
    s57Feature.INFORM = mltylt.INFORM

    s57Feature.NATCON = feature.natureOfConstruction.GetCommaSeparatedValues()
    s57Feature.CONRAD = ConvertAttribute_radarConspicuous(feature.radarConspicuous)
    s57Feature.SORDAT = feature.reportedDate.GetFirstValue()
    s57Feature.STATUS = feature.status.GetCommaSeparatedValues()
    s57Feature.VERLEN = feature.verticalLength.GetFirstValue()
    s57Feature.CONVIS = feature.visualProminence.GetFirstValue()
    s57Feature.SCAMIN = feature.scaleMinimum.GetFirstValue()

    local info = ConvertAttribute_information(feature.information)
    s57Feature.INFORM = ConcatenateS57Attribute(s57Feature.INFORM, info.INFORM)
    s57Feature.NINFOM = info.NINFOM
    s57Feature.TXTDSC = info.TXTDSC
    s57Feature.NTXTDS = info.NTXTDS

    s57Feature.PICREP = feature.pictorialRepresentation.GetFirstValue()

    feature.inTheWater.DidNotConvert = true

    return {s57Feature = s57Feature}
end

return ConvertFeature_Landmark