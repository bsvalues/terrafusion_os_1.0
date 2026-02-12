local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConvertAttribute_fixedDateRange = S101To57AttributeConversionFunctions.fixedDateRange
local ConvertAttribute_information = S101To57AttributeConversionFunctions.information
local ConvertAttribute_periodicDateRange = S101To57AttributeConversionFunctions.periodicDateRange

local function ConvertFeature_CautionArea(feature)
    local s57Feature = S57Lib.CreateFeature("CTNARE")

    s57Feature.CONDTN = feature.condition.GetFirstValue()

    local fdr = ConvertAttribute_fixedDateRange(feature.fixedDateRange)
    s57Feature.DATEND = fdr.DATEND
    s57Feature.DATSTA = fdr.DATSTA

    local pdr = ConvertAttribute_periodicDateRange(feature.periodicDateRange)
    s57Feature.PEREND = pdr.PEREND
    s57Feature.PERSTA = pdr.PERSTA

    s57Feature.SORDAT = feature.reportedDate.GetFirstValue()
    s57Feature.STATUS = feature.status.GetFirstValue()
    s57Feature.SCAMIN = feature.scaleMinimum.GetFirstValue()

    local info = ConvertAttribute_information(feature.information)
    s57Feature.INFORM = info.INFORM
    s57Feature.NINFOM = info.NINFOM
    s57Feature.TXTDSC = info.TXTDSC
    s57Feature.NTXTDS = info.NTXTDS

    s57Feature.PICREP = feature.pictorialRepresentation.GetFirstValue()

    return {s57Feature = s57Feature}
end

return ConvertFeature_CautionArea