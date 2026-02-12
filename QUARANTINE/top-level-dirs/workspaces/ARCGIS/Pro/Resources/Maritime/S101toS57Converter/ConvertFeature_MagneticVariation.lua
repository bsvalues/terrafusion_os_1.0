local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConvertAttribute_information = S101To57AttributeConversionFunctions.information

local function ConvertFeature_MagneticVariation(feature)
    local s57Feature = S57Lib.CreateFeature("MAGVAR")

    s57Feature.RYRMGV = feature.referenceYearForMagneticVariation.GetFirstValue()
    s57Feature.VALACM = feature.valueOfAnnualChangeInMagneticVariation.GetFirstValue()
    s57Feature.VALMAG = feature.valueOfMagneticVariation.GetFirstValue()
    s57Feature.SCAMIN = feature.scaleMinimum.GetFirstValue()

    local info = ConvertAttribute_information(feature.information)
    s57Feature.INFORM = info.INFORM
    s57Feature.NINFOM = info.NINFOM
    s57Feature.TXTDSC = info.TXTDSC
    s57Feature.NTXTDS = info.NTXTDS

    return {s57Feature = s57Feature}
end

return ConvertFeature_MagneticVariation