local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConcatenateS57Attribute = S101To57AttributeConversionFunctions.ConcatenateS57Attribute
local ConvertAttribute_featureName = S101To57AttributeConversionFunctions.featureName
local ConvertAttribute_fixedDateRange = S101To57AttributeConversionFunctions.fixedDateRange
local ConvertAttribute_information = S101To57AttributeConversionFunctions.information
local ConvertAttribute_multiplicityOfFeatures = S101To57AttributeConversionFunctions.multiplicityOfFeatures

local function ConvertFeature_PipelineSubmarineOnLand(feature)
    local s57Feature = S57Lib.CreateFeature("PIPSOL")

    s57Feature.BURDEP = feature.buriedDepth.GetFirstValue()
    s57Feature.CATPIP = feature.categoryOfPipelinePipe.GetCommaSeparatedValues()
    s57Feature.CONDTN = feature.condition.GetFirstValue()
    s57Feature.DRVAL1 = feature.depthRangeMinimumValue.GetFirstValue()
    s57Feature.DRVAL2 = feature.depthRangeMaximumValue.GetFirstValue()

    local objnam = ConvertAttribute_featureName(feature.featureName)
    s57Feature.OBJNAM = objnam.OBJNAM
    s57Feature.NOBJNM = objnam.NOBJNM

    local fdr = ConvertAttribute_fixedDateRange(feature.fixedDateRange)
    s57Feature.DATEND = fdr.DATEND
    s57Feature.DATSTA = fdr.DATSTA

    local mltylt = ConvertAttribute_multiplicityOfFeatures(feature.multiplicityOfFeatures)
    s57Feature.MLTYLT = mltylt.MLTYLT
    s57Feature.INFORM = mltylt.INFORM

    s57Feature.PRODCT = feature.product.GetCommaSeparatedValues()
    s57Feature.SORDAT = feature.reportedDate.GetFirstValue()
    s57Feature.RESTRN = feature.restriction.GetCommaSeparatedValues()
    s57Feature.STATUS = feature.status.GetCommaSeparatedValues()
    s57Feature.VERLEN = feature.verticalLength.GetFirstValue()
    s57Feature.SCAMIN = feature.scaleMinimum.GetFirstValue()

    local info = ConvertAttribute_information(feature.information)
    s57Feature.INFORM = ConcatenateS57Attribute(s57Feature.INFORM, info.INFORM)
    s57Feature.NINFOM = info.NINFOM
    s57Feature.TXTDSC = info.TXTDSC
    s57Feature.NTXTDS = info.NTXTDS

    s57Feature.PICREP = feature.pictorialRepresentation.GetFirstValue()

    return {s57Feature = s57Feature}
end

return ConvertFeature_PipelineSubmarineOnLand