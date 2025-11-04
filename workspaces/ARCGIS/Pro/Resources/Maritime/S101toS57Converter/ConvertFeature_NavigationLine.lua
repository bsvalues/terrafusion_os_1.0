local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConvertAttribute_fixedDateRange = S101To57AttributeConversionFunctions.fixedDateRange
local ConvertAttribute_information = S101To57AttributeConversionFunctions.information
local ConvertAttribute_orientation = S101To57AttributeConversionFunctions.orientation
local ConvertAttribute_periodicDateRange = S101To57AttributeConversionFunctions.periodicDateRange

local function ConvertFeature_NavigationLine(feature)
    local s57Feature = S57Lib.CreateFeature("NAVLNE")

    s57Feature.CATNAV = feature.categoryOfNavigationLine.GetFirstValue()

    local fdr = ConvertAttribute_fixedDateRange(feature.fixedDateRange)
    s57Feature.DATEND = fdr.DATEND
    s57Feature.DATSTA = fdr.DATSTA

    feature.interoperabilityIdentifier.DidNotConvert = true

    feature.measuredDistance.DidNotConvert = true

    s57Feature.ORIENT = ConvertAttribute_orientation(feature.orientation)

    local pdr = ConvertAttribute_periodicDateRange(feature.periodicDateRange)
    s57Feature.PEREND = pdr.PEREND
    s57Feature.PERSTA = pdr.PERSTA

    s57Feature.STATUS = feature.status.GetCommaSeparatedValues()
    s57Feature.SCAMIN = feature.scaleMinimum.GetFirstValue()

    local info = ConvertAttribute_information(feature.information)
    s57Feature.INFORM = info.INFORM
    s57Feature.NINFOM = info.NINFOM
    s57Feature.TXTDSC = info.TXTDSC
    s57Feature.NTXTDS = info.NTXTDS

    return {s57Feature = s57Feature}
end

return ConvertFeature_NavigationLine