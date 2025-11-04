local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConvertAttribute_featureName = S101To57AttributeConversionFunctions.featureName
local ConvertAttribute_fixedDateRange = S101To57AttributeConversionFunctions.fixedDateRange
local ConvertAttribute_information = S101To57AttributeConversionFunctions.information
local ConvertAttribute_periodicDateRange = S101To57AttributeConversionFunctions.periodicDateRange
local ConvertAttribute_signalSequence = S101To57AttributeConversionFunctions.signalSequence

local function ConvertFeature_FogSignal(feature)
    local s57Feature = S57Lib.CreateFeature("FOGSIG")

    s57Feature.CATFOG = feature.categoryOfFogSignal.GetFirstValue()

    local objnam = ConvertAttribute_featureName(feature.featureName)
    s57Feature.OBJNAM = objnam.OBJNAM
    s57Feature.NOBJNM = objnam.NOBJNM

    local fdr = ConvertAttribute_fixedDateRange(feature.fixedDateRange)
    s57Feature.DATEND = fdr.DATEND
    s57Feature.DATSTA = fdr.DATSTA

    feature.interoperabilityIdentifier.DidNotConvert = true

    local pdr = ConvertAttribute_periodicDateRange(feature.periodicDateRange)
    s57Feature.PEREND = pdr.PEREND
    s57Feature.PERSTA = pdr.PERSTA

    s57Feature.SIGFRQ = feature.signalFrequency.GetFirstValue()
    s57Feature.SIGGEN = feature.signalGeneration.GetFirstValue()
    s57Feature.SIGGRP = feature.signalGroup.GetFirstValue()
    s57Feature.SIGPER = feature.signalPeriod.GetFirstValue()
    s57Feature.SIGSEQ = ConvertAttribute_signalSequence(feature.signalSequence)
    s57Feature.STATUS = feature.status.GetCommaSeparatedValues()
    s57Feature.VALMXR = feature.valueOfMaximumRange.GetFirstValue()
    s57Feature.SCAMIN = feature.scaleMinimum.GetFirstValue()

    local info = ConvertAttribute_information(feature.information)
    s57Feature.INFORM = info.INFORM
    s57Feature.NINFOM = info.NINFOM
    s57Feature.TXTDSC = info.TXTDSC
    s57Feature.NTXTDS = info.NTXTDS

    return {s57Feature = s57Feature}
end

return ConvertFeature_FogSignal