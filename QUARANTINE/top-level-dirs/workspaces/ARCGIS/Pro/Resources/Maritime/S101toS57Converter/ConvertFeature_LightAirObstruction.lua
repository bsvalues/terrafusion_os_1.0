local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConcatenateS57Attribute = S101To57AttributeConversionFunctions.ConcatenateS57Attribute
local ConvertAttribute_featureName = S101To57AttributeConversionFunctions.featureName
local ConvertAttribute_fixedDateRange = S101To57AttributeConversionFunctions.fixedDateRange
local ConvertAttribute_information = S101To57AttributeConversionFunctions.information
local ConvertAttribute_multiplicityOfFeatures = S101To57AttributeConversionFunctions.multiplicityOfFeatures
local ConvertAttribute_periodicDateRange = S101To57AttributeConversionFunctions.periodicDateRange
local ConvertAttribute_rhythmOfLight = S101To57AttributeConversionFunctions.rhythmOfLight
local ConvertAttribute_verticalDatum = S101To57AttributeConversionFunctions.verticalDatum

local function ConvertFeature_LightAirObstruction(feature)
    local s57Feature = S57Lib.CreateFeature("LIGHTS")

    s57Feature.COLOUR = feature.colour.GetCommaSeparatedValues()
    s57Feature.EXCLIT = feature.exhibitionConditionOfLight.GetFirstValue()

    local objnam = ConvertAttribute_featureName(feature.featureName)
    s57Feature.OBJNAM = objnam.OBJNAM
    s57Feature.NOBJNM = objnam.NOBJNM

    local fdr = ConvertAttribute_fixedDateRange(feature.fixedDateRange)
    s57Feature.DATEND = fdr.DATEND
    s57Feature.DATSTA = fdr.DATSTA

    feature.interoperabilityIdentifier.DidNotConvert = true

    s57Feature.HEIGHT = feature.height.GetFirstValue()
    s57Feature.LITVIS = feature.lightVisibility.GetCommaSeparatedValues()

    local mltylt = ConvertAttribute_multiplicityOfFeatures(feature.multiplicityOfFeatures)
    s57Feature.MLTYLT = mltylt.MLTYLT
    s57Feature.INFORM = mltylt.INFORM

    local pdr = ConvertAttribute_periodicDateRange(feature.periodicDateRange)
    s57Feature.PEREND = pdr.PEREND
    s57Feature.PERSTA = pdr.PERSTA

    local rol = ConvertAttribute_rhythmOfLight(feature.rhythmOfLight)
    s57Feature.LITCHR = rol.LITCHR
    s57Feature.SIGGRP = rol.SIGGRP
    s57Feature.SIGPER = rol.SIGPER
    s57Feature.SIGSEQ = rol.SIGSEQ

    s57Feature.STATUS = feature.status.GetCommaSeparatedValues()
    s57Feature.VALNMR = feature.valueOfNominalRange.GetFirstValue()

    local verdat = ConvertAttribute_verticalDatum(feature.verticalDatum)
    s57Feature.VERDAT = verdat.VERDAT
    s57Feature.INFORM = ConcatenateS57Attribute(s57Feature.INFORM, verdat.INFORM)

    s57Feature.SCAMIN = feature.scaleMinimum.GetFirstValue()

    local info = ConvertAttribute_information(feature.information)
    s57Feature.INFORM = ConcatenateS57Attribute(s57Feature.INFORM, info.INFORM)
    s57Feature.NINFOM = info.NINFOM
    s57Feature.TXTDSC = info.TXTDSC
    s57Feature.NTXTDS = info.NTXTDS

    feature.flareBearing.DidNotConvert = true

    return {s57Feature = s57Feature}
end

return ConvertFeature_LightAirObstruction