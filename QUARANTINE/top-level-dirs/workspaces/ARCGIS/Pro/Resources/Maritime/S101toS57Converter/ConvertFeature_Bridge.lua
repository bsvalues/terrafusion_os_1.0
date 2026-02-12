local S57Lib = require("S57Lib")
local S101To57AttributeConversionFunctions = require("S101To57AttributeConversionFunctions")

local ConvertAttribute_featureName = S101To57AttributeConversionFunctions.featureName
local ConvertAttribute_fixedDateRange = S101To57AttributeConversionFunctions.fixedDateRange
local ConvertAttribute_information = S101To57AttributeConversionFunctions.information
local ConvertAttribute_radarConspicuous = S101To57AttributeConversionFunctions.radarConspicuous

local function ConvertFeature_Bridge(feature)

    local associatedPylons  = feature.GetFeatureAssociationsByFeatureCode("PylonBridgeSupport")
    local associatedSpanFixed = feature.GetFeatureAssociationsByFeatureCode("SpanFixed")
    local associatedSpanOpening = feature.GetFeatureAssociationsByFeatureCode("SpanOpening")

	-- Bridge can be curve/surface/noGeometry. Per DCEG, navigable bridges must have spans and pylons associated
	-- and non-navigable should not have any component features. So we can use associated components as a test 
	-- of navigable/non-navigable Bridge (do not need geometry intersection test). 
    -- The associated SpanFixed/SpanOpening and PylonBridgeSupport will be handled in their own functions
	-- The bridge will not convert directly to S-57 but some of the attributes may tranfer over to associated features.
    if #associatedPylons > 0 or #associatedSpanFixed > 0 or #associatedSpanOpening > 0 then
        return {}
    end
	
	-- TODO: Additionally also need to check Landmark in the Landmark conversion  function for Bridge of type point.

    local s57Feature = S57Lib.CreateFeature("BRIDGE")

    s57Feature.CATBRG = feature.bridgeConstruction.GetFirstValue()
    s57Feature.CATBRG = feature.bridgeFunction.GetCommaSeparatedValues()
    s57Feature.CATBRG = feature.categoryOfOpeningBridge.GetFirstValue()
    s57Feature.COLOUR = feature.colour.GetCommaSeparatedValues()
    s57Feature.COLPAT = feature.colourPattern.GetFirstValue()
    s57Feature.CONDTN = feature.condition.GetFirstValue()

    local objnam = ConvertAttribute_featureName(feature.featureName)
    s57Feature.OBJNAM = objnam.OBJNAM
    s57Feature.NOBJNM = objnam.NOBJNM

    local fdr = ConvertAttribute_fixedDateRange(feature.fixedDateRange)
    s57Feature.DATEND = fdr.DATEND
    s57Feature.DATSTA = fdr.DATSTA

    s57Feature.HEIGHT = feature.height.GetFirstValue()
    s57Feature.NATCON = feature.natureOfConstruction.GetCommaSeparatedValues()

    feature.openingBridge.DidNotConvert = true

    s57Feature.CONRAD = ConvertAttribute_radarConspicuous(feature.radarConspicuous)
    s57Feature.SORDAT = feature.reportedDate.GetFirstValue()
    s57Feature.STATUS = feature.status.GetCommaSeparatedValues()
    s57Feature.CONVIS = feature.visualProminence.GetFirstValue()
    s57Feature.SCAMIN = feature.scaleMinimum.GetFirstValue()

    local info = ConvertAttribute_information(feature.information)
    s57Feature.INFORM = info.INFORM
    s57Feature.NINFOM = info.NINFOM
    s57Feature.TXTDSC = info.TXTDSC
    s57Feature.NTXTDS = info.NTXTDS

    s57Feature.PICREP = feature.pictorialRepresentation.GetFirstValue()

    return {s57Feature = s57Feature}
end

return ConvertFeature_Bridge