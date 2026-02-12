local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConcatenateS57Attribute = S101To57AttributeConversionFunctions.ConcatenateS57Attribute
local ConvertAttribute_featureName = S101To57AttributeConversionFunctions.featureName
local ConvertAttribute_information = S101To57AttributeConversionFunctions.information
local ConvertAttribute_maximumPermittedDraught = S101To57AttributeConversionFunctions.maximumPermittedDraught

local function ConvertFeature_TrafficSeparationScheme(feature)
    local s57Feature = S57Lib.CreateFeature("C_AGGR")

    local objnam = ConvertAttribute_featureName(feature.featureName)
    s57Feature.OBJNAM = objnam.OBJNAM
    s57Feature.NOBJNM = objnam.NOBJNM

    s57Feature.CATTSS = feature.iMOAdopted.GetFirstValue()

    feature.interoperabilityIdentifier.DidNotConvert = true

    s57Feature.INFORM = ConvertAttribute_maximumPermittedDraught(feature.maximumPermittedDraught)
    s57Feature.SCAMIN = feature.scaleMinimum.GetFirstValue()

    local info = ConvertAttribute_information(feature.information)
    s57Feature.INFORM = ConcatenateS57Attribute(s57Feature.INFORM, info.INFORM)
    s57Feature.NINFOM = info.NINFOM
    s57Feature.TXTDSC = info.TXTDSC
    s57Feature.NTXTDS = info.NTXTDS

    return {s57Feature = s57Feature}
end

return ConvertFeature_TrafficSeparationScheme