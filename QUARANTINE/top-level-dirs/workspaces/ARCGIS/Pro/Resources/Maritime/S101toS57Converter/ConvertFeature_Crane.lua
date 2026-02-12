local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConcatenateS57Attribute = S101To57AttributeConversionFunctions.ConcatenateS57Attribute
local ConvertAttribute_featureName = S101To57AttributeConversionFunctions.featureName
local ConvertAttribute_information = S101To57AttributeConversionFunctions.information
local ConvertAttribute_orientation = S101To57AttributeConversionFunctions.orientation
local ConvertAttribute_radarConspicuous = S101To57AttributeConversionFunctions.radarConspicuous
local ConvertAttribute_verticalClearanceFixed = S101To57AttributeConversionFunctions.verticalClearanceFixed
local ConvertAttribute_verticalDatum = S101To57AttributeConversionFunctions.verticalDatum

local function ConvertFeature_Crane(feature)
    local s57Feature = S57Lib.CreateFeature("CRANES")

    s57Feature.CATCRN = feature.categoryOfCrane.GetFirstValue()
    s57Feature.COLOUR = feature.colour.GetCommaSeparatedValues()
    s57Feature.COLPAT = feature.colourPattern.GetFirstValue()
    s57Feature.CONDTN = feature.condition.GetFirstValue()

    local objnam = ConvertAttribute_featureName(feature.featureName)
    s57Feature.OBJNAM = objnam.OBJNAM
    s57Feature.NOBJNM = objnam.NOBJNM

    s57Feature.HEIGHT = feature.height.GetFirstValue()
    s57Feature.LIFCAP = feature.liftingCapacity.GetFirstValue()
    s57Feature.ORIENT = ConvertAttribute_orientation(feature.orientation)
    s57Feature.CONRAD = ConvertAttribute_radarConspicuous(feature.radarConspicuous)
    s57Feature.RADIUS = feature.radius.GetFirstValue()
    s57Feature.STATUS = feature.status.GetCommaSeparatedValues()

    local vcf = ConvertAttribute_verticalClearanceFixed(feature.verticalClearanceFixed)
    s57Feature.VERCLR = vcf.VERCLR
    s57Feature.VERACC = vcf.VERACC

    local verdat = ConvertAttribute_verticalDatum(feature.verticalDatum)
    s57Feature.VERDAT = verdat.VERDAT
    s57Feature.INFORM = verdat.INFORM

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

return ConvertFeature_Crane