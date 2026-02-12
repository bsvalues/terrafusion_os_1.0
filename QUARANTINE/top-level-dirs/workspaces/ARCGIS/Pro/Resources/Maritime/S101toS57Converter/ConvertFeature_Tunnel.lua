local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConcatenateS57Attribute = S101To57AttributeConversionFunctions.ConcatenateS57Attribute
local ConvertAttribute_featureName = S101To57AttributeConversionFunctions.featureName
local ConvertAttribute_horizontalClearanceFixed = S101To57AttributeConversionFunctions.horizontalClearanceFixed
local ConvertAttribute_information = S101To57AttributeConversionFunctions.information
local ConvertAttribute_verticalClearanceFixed = S101To57AttributeConversionFunctions.verticalClearanceFixed
local ConvertAttribute_verticalDatum = S101To57AttributeConversionFunctions.verticalDatum

local function ConvertFeature_Tunnel(feature)
    local s57Feature = S57Lib.CreateFeature("TUNNEL")

    s57Feature.CONDTN = feature.condition.GetFirstValue()

    local objnam = ConvertAttribute_featureName(feature.featureName)
    s57Feature.OBJNAM = objnam.OBJNAM
    s57Feature.NOBJNM = objnam.NOBJNM

    local hcf = ConvertAttribute_horizontalClearanceFixed(feature.horizontalClearanceFixed)
    s57Feature.HORCLR = hcf.HORCLR
    s57Feature.HORACC = hcf.HORACC

    s57Feature.SORDAT = feature.reportedDate.GetFirstValue()
    s57Feature.STATUS = feature.status.GetCommaSeparatedValues()

    local vcf = ConvertAttribute_verticalClearanceFixed(feature.verticalClearanceFixed)
    s57Feature.VERCLR = vcf.VERCLR
    s57Feature.VERACC = vcf.VERACC

    local verdat = ConvertAttribute_verticalDatum(feature.verticalDatum)
    s57Feature.VERDAT = verdat.VERDAT
    s57Feature.INFORM = verdat.INFORM

    s57Feature.SCAMIN = feature.scaleMinimum.GetFirstValue()

    local info = ConvertAttribute_information(feature.information)
    s57Feature.INFORM = ConcatenateS57Attribute(s57Feature.INFORM, info.INFORM)
    s57Feature.NINFOM = info.NINFOM
    s57Feature.TXTDSC = info.TXTDSC
    s57Feature.NTXTDS = info.NTXTDS

    s57Feature.PICREP = feature.pictorialRepresentation.GetFirstValue()

    return {s57Feature = s57Feature}
end

return ConvertFeature_Tunnel