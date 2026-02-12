local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConcatenateS57Attribute = S101To57AttributeConversionFunctions.ConcatenateS57Attribute
local ConvertAttribute_featureName = S101To57AttributeConversionFunctions.featureName
local ConvertAttribute_fixedDateRange = S101To57AttributeConversionFunctions.fixedDateRange
local ConvertAttribute_information = S101To57AttributeConversionFunctions.information
local ConvertAttribute_periodicDateRange = S101To57AttributeConversionFunctions.periodicDateRange
local ConvertAttribute_verticalDatum = S101To57AttributeConversionFunctions.verticalDatum
local ConvertAttribute_sectorCharacteristics = S101To57AttributeConversionFunctions.sectorCharacteristics

local function CreateAdditionalLight(firstS57Feature, sectorCharAttr)
    local s57Feature = S57Lib.CreateFeature("LIGHTS")

    s57Feature.CATLIT = firstS57Feature.CATLIT
    s57Feature.EXCLIT = firstS57Feature.EXCLIT

    s57Feature.OBJNAM = firstS57Feature.OBJNAM
    s57Feature.NOBJNM = firstS57Feature.NOBJNM

    s57Feature.DATEND = firstS57Feature.DATEND
    s57Feature.DATSTA = firstS57Feature.DATSTA

    s57Feature.HEIGHT = firstS57Feature.HEIGHT
    s57Feature.MARSYS = firstS57Feature.MARSYS

    s57Feature.PEREND = firstS57Feature.PEREND
    s57Feature.PERSTA = firstS57Feature.PERSTA

    s57Feature.LITCHR = sectorCharAttr.LITCHR
    s57Feature.SIGGRP = sectorCharAttr.SIGGRP
    s57Feature.SIGPER = sectorCharAttr.SIGPER
    s57Feature.SIGSEQ = sectorCharAttr.SIGSEQ
    s57Feature.COLOUR = sectorCharAttr.COLOUR
    s57Feature.CATLIT = sectorCharAttr.CATLIT
    s57Feature.ORIENT = sectorCharAttr.ORIENT
    s57Feature.LITVIS = sectorCharAttr.LITVIS
    s57Feature.SECTR1 = sectorCharAttr.SECTR1
    s57Feature.SECTR2 = sectorCharAttr.SECTR2
    s57Feature.VALNMR = sectorCharAttr.VALNMR
    s57Feature.INFORM = sectorCharAttr.INFORM
    s57Feature.NINFOM = sectorCharAttr.NINFOM

    s57Feature.MLTYLT = firstS57Feature.MLTYLT

    s57Feature.SIGGEN = firstS57Feature.SIGGEN
    s57Feature.STATUS = firstS57Feature.STATUS

    s57Feature.VERDAT = firstS57Feature.VERDAT

    s57Feature.SCAMIN = firstS57Feature.SCAMIN

    s57Feature.TXTDSC = firstS57Feature.TXTDSC
    s57Feature.NTXTDS = firstS57Feature.NTXTDS

    return s57Feature
end

local function ConvertFeature_LightSectored(feature)
    local s57Feature = S57Lib.CreateFeature("LIGHTS")

    s57Feature.CATLIT = feature.categoryOfLight.GetCommaSeparatedValues()
    s57Feature.EXCLIT = feature.exhibitionConditionOfLight.GetFirstValue()

    local objnam = ConvertAttribute_featureName(feature.featureName)
    s57Feature.OBJNAM = objnam.OBJNAM
    s57Feature.NOBJNM = objnam.NOBJNM

    local fdr = ConvertAttribute_fixedDateRange(feature.fixedDateRange)
    s57Feature.DATEND = fdr.DATEND
    s57Feature.DATSTA = fdr.DATSTA

    s57Feature.HEIGHT = feature.height.GetFirstValue()
    s57Feature.MARSYS = feature.marksNavigationalSystemOf.GetFirstValue()

    local pdr = ConvertAttribute_periodicDateRange(feature.periodicDateRange)
    s57Feature.PEREND = pdr.PEREND
    s57Feature.PERSTA = pdr.PERSTA

    local sectorCharAttributesArray = ConvertAttribute_sectorCharacteristics(feature.sectorCharacteristics)
    local sectorCharAttr = sectorCharAttributesArray[1]
    s57Feature.LITCHR = sectorCharAttr.LITCHR
    s57Feature.SIGGRP = sectorCharAttr.SIGGRP
    s57Feature.SIGPER = sectorCharAttr.SIGPER
    s57Feature.SIGSEQ = sectorCharAttr.SIGSEQ
    s57Feature.COLOUR = sectorCharAttr.COLOUR
    s57Feature.CATLIT = sectorCharAttr.CATLIT
    s57Feature.ORIENT = sectorCharAttr.ORIENT
    s57Feature.LITVIS = sectorCharAttr.LITVIS
    s57Feature.SECTR1 = sectorCharAttr.SECTR1
    s57Feature.SECTR2 = sectorCharAttr.SECTR2
    s57Feature.VALNMR = sectorCharAttr.VALNMR
    s57Feature.INFORM = sectorCharAttr.INFORM
    s57Feature.NINFOM = sectorCharAttr.NINFOM

    if #sectorCharAttributesArray > 1 then
        s57Feature.MLTYLT = #sectorCharAttributesArray
    end

    s57Feature.SIGGEN = feature.signalGeneration.GetFirstValue()
    s57Feature.STATUS = feature.status.GetCommaSeparatedValues()

    local verdat = ConvertAttribute_verticalDatum(feature.verticalDatum)
    s57Feature.VERDAT = verdat.VERDAT
    s57Feature.INFORM = ConcatenateS57Attribute(s57Feature.INFORM, verdat.INFORM)

    s57Feature.SCAMIN = feature.scaleMinimum.GetFirstValue()

    local info = ConvertAttribute_information(feature.information)
    s57Feature.INFORM = ConcatenateS57Attribute(s57Feature.INFORM, info.INFORM)
    s57Feature.NINFOM = info.NINFOM
    s57Feature.TXTDSC = info.TXTDSC
    s57Feature.NTXTDS = info.NTXTDS

    local additionalFeatures = {}
    for i = 2, #sectorCharAttributesArray do
        table.insert(additionalFeatures, CreateAdditionalLight(s57Feature, sectorCharAttributesArray[i]))
    end

    return {s57Feature = s57Feature, additionalFeatures = additionalFeatures}
end

return ConvertFeature_LightSectored