local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConvertAttribute_featureName = S101To57AttributeConversionFunctions.featureName
local ConvertAttribute_information = S101To57AttributeConversionFunctions.information
local ConvertAttribute_radarConspicuous = S101To57AttributeConversionFunctions.radarConspicuous

local function ConvertFeature_FenceWall(feature)
    local s57Feature = S57Lib.CreateFeature("FNCLNE")

    s57Feature.CATFNC = feature.categoryOfFence.GetFirstValue()
    s57Feature.COLOUR = feature.colour.GetCommaSeparatedValues()
    s57Feature.COLPAT = feature.colourPattern.GetFirstValue()
    s57Feature.CONDTN = feature.condition.GetFirstValue()
    s57Feature.ELEVAT = feature.elevation.GetFirstValue()

    local objnam = ConvertAttribute_featureName(feature.featureName)
    s57Feature.OBJNAM = objnam.OBJNAM
    s57Feature.NOBJNM = objnam.NOBJNM

    s57Feature.HEIGHT = feature.height.GetFirstValue()
    s57Feature.NATCON = feature.natureOfConstruction.GetCommaSeparatedValues()
    s57Feature.CONRAD = ConvertAttribute_radarConspicuous(feature.radarConspicuous)
    s57Feature.SORDAT = feature.reportedDate.GetFirstValue()
    s57Feature.STATUS = feature.status.GetCommaSeparatedValues()
    s57Feature.VERLEN = feature.verticalLength.GetFirstValue()
    s57Feature.CONVIS = feature.visualProminence.GetFirstValue()
    s57Feature.SCAMIN = feature.scaleMinimum.GetFirstValue()

    local info = ConvertAttribute_information(feature.information)
    s57Feature.INFORM = info.INFORM
    s57Feature.NINFOM = info.NINFOM
    s57Feature.TXTDSC = info.TXTDSC
    s57Feature.NTXTDS = info.NTXTDS

    return {s57Feature = s57Feature}
end

return ConvertFeature_FenceWall