"""---------------------------------------------------------------------------
Name:              OptimizedHSA.py
Purpose:           Optimized Hot Spot Analysis for AGOL
Author:            Esri Inc.
Created:           1/31/2013
Copyright:   (c)   Esri, Inc. 2013
ArcGIS Version:    10.3
---------------------------------------------------------------------------"""

#from __future__ import unicode_literals
import os
import json
import arcpy
import hostedgp as agolgp
import aolutils
import popup
import time
from arcpy import ExecuteError
import rendererUtils
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ****Constant variables****

REQD_TOOLBOXES = "Workflows.tbx"
TASK_NAME = u"FindHotSpots"
GE_PRIVILEGE = u"premium:user:geoenrichment"
PORTAL_HELPER_SERVICES_KEY = "geoenrichment"
GEOENRICH_URL = "GeoEnrichment/enrich"

err_msg = ""

costFactor = 0.002

error_ID = [192, 366, 401, 906, 929, 1533, 1534, 1572, 1573, 1575, 100007, 84426, 110243]

ERROR_CODES = {
    641: u"Too few records for analysis. This tool requires at least {} feature(s) to compute results.",
    897: u"The provided distance band {} is too small for the study area.",
    1535: u"The analysis option you selected requires a minimum of {} aggregation areas.",
    1536: u"The analysis options you selected require a minimum of {} points to compute hot and cold spots.",
    1570: u"The analysis option you selected requires a minimum of {} points to be inside the bounding polygon area(s).",
    1571: u"The analysis options you selected require a minimum of {} features with valid data in the analysis field in order to compute hot and cold spots.",
    1574: u"The analysis option you selected requires a minimum of {} points to be inside the aggregation polygons.",
    100024: u"There are no features provided for analysis in {}.",
    100008: u"The geometry type for the boundingPolygonLayer must be polygon.",
    100009: u"The geometry type of Analysis Layer must be points or polygons.",
    100010: u"The geometry type for the aggregationPolygonLayer must be polygon.",
    100011: u"Must provide an Analysis Field for polygon input.",
    100052: u"The field name {} does not exist in the {}.",
    100110: u"Your user role does not include the geoEnrichment privilege."
}

def getPopupContent():
    '''Creates appropriate popup content'''

    # create popup content for count always
    ohsa_popupInfo = popup.PopupInfo("Find Hot Spots Summary")
    uid = arcpy.Describe(scratchFeatures).oidFieldName
    ohsa_popupInfo.addFieldInfo(uid, "ID")
    if hasAnalysisField:
        ohsa_popupInfo.addFieldInfo(analysisField, analysisField, True)
        dividedAlias = u"{} per {} ".format(analysisField, dividedByField)
    else:
        ohsa_popupInfo.addFieldInfo("JOIN_COUNT", "Number of Points")
        dividedAlias = u"Number of Points per {} ".format(dividedByField)
    
    if hasDividedByField:
        if dividedByField.upper() == "ESRIPOPULATION":
            fieldList = arcpy.ListFields(scratchFeatures)
            tpField = aolutils.getAccurateFieldName(fieldList, "TOTPOP")
            ohsa_popupInfo.addFieldInfo(tpField, "Esri Population", True)
        else:
            ohsa_popupInfo.addFieldInfo(dividedByField, dividedByField, hasAnalysisField)
        ohsa_popupInfo.addFieldInfo("SS_RATE", dividedAlias)
        
    ohsa_popupInfo.addFieldInfo("Gi_Text", "Statistical Significance")
    return ohsa_popupInfo.getPopupInfo()

#def densifyFeatures(feature_class):

    #out_densify = arcpy.CreateScratchName('densify_', workspace=arcpy.env.workspace)
    #arcpy.CopyFeatures_management(feature_class, out_densify)
    #arcpy.Densify_edit(out_densify, "DISTANCE", "10 Kilometers")
    #return out_densify

def checkPrivileges(hostedgp):

    if aolutils.checkPrivilege(GE_PRIVILEGE, hostedgp):
        arcpy.AddMessage("geoenrich privilege check : OK")
    else:
        aolutils.AddErrorCode(100110, ERROR_CODES[100110])
        raise Exception

if __name__ == '__main__':

    hostedgp = None
    # timer messages
    startTime = time.time()
    beginTime = startTime

    try:
        # Initialize context
        hostedgp = agolgp.HostedGP(11, 10)
        outputName = hostedgp.GetOutputName(10)
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        aolutils.addRemoveToolboxes(True, REQD_TOOLBOXES)

        # The point or polygon feature class for which hot spot analysis will be performed.
        inputServices, inputFeatures, inputLayersName, inShape, inputCount, inputChangedFields = aolutils.getHostedLayer(hostedgp, "Input Layer", 0)

        if inShape == "esriGeometryPolyline":
            aolutils.AddErrorCode(100009, ERROR_CODES[100009])
            raise arcpy.ExecuteError

        # If Mercator, assign spatial reference environment to WGS (wkid 4326)
        # for using chordal distance
        useChordal = 0
        spatialRef = arcpy.Describe(inputFeatures).SpatialReference
        gcscode = spatialRef.GCSCode
        # arcpy.AddMessage(spatialRef.name + " " + str(spatialRef.PCSCode) + " " + str(spatialRef.GCSCode))
        if spatialRef.PCSCode == 102100 or spatialRef.PCSCode == 3857:
            gcscode = 4326
            useChordal = 1
            arcpy.env.outputCoordinateSystem = gcscode

        startTime = aolutils.AddTimerMessage(startTime, "Get Analysis Layer")
        # The numeric field to be evaluated (optional).
        analysisField = arcpy.GetParameterAsText(1)
        analysisField = aolutils.updateChangedFieldNames(analysisField, inputChangedFields)
        if len(analysisField) == 0 or analysisField == "NO ANALYSIS FIELD":
            hasAnalysisField = 0
            if inShape == "esriGeometryPolygon":
                aolutils.AddErrorCode(100011, ERROR_CODES[100011])
                raise ExecuteError
        else:
            hasAnalysisField = 1

        # The numeric field to weight analysisField (optional).
        dividedByField = arcpy.GetParameterAsText(2)
        if len(dividedByField) != 0:
            hasDividedByField = 1
        else:
            hasDividedByField = 0

        service_url = ""
        entoken = ""
        referer = ""

        if dividedByField.upper() == "ESRIPOPULATION":
            startTime = aolutils.AddTimerMessage(startTime, "Check privileges")
            checkPrivileges(hostedgp)
            service_url, entoken, referer = aolutils.gentoken(hostedgp, PORTAL_HELPER_SERVICES_KEY, GEOENRICH_URL)

        # Bounding Polygons Defining Where Incidents Are Possible (optional).
        """ Bounding Polygons don't affect by extent nor related to fields,
            therefore not using aolutils.getHostedLayer
        """
        boundingServices, boundingPolygons, boundingPolyName, boundingPolyType, boundingPolyCount, boundingPolyFields = aolutils.getHostedLayer(hostedgp, "bounding polygon", 3)
        arcpy.env.workspace = aolutils.getOutputWkspc(boundingPolyCount)

        if boundingPolygons:
            if boundingPolyCount == 0:
                aolutils.AddErrorCode(100024, ERROR_CODES[100024].format(boundingPolyName),
                                      {'inputLayers': boundingPolyName})
                raise ExecuteError
            elif boundingPolyType != "esriGeometryPolygon":
                aolutils.AddErrorCode(100008, ERROR_CODES[100008])
                raise ExecuteError
            else:
                boundingPolygons = aolutils.densifyFeatures(boundingPolygons)
                startTime = aolutils.AddTimerMessage(startTime, "Get bounding polygon Layer")

        # Polygons For Aggregating Incidents Into Counts (optional).
        aggregatedServices, aggregatedPolygons, aggregatedName, aggregatedPolyType, aggregatedPolyCount, aggregatedFields = aolutils.getHostedLayer(hostedgp, "aggregating polygon", 4)
        if aggregatedPolygons:
            if aggregatedPolyCount == 0:
                aolutils.AddErrorCode(100024, ERROR_CODES[100024].format(aggregatedName), {'inputLayers': aggregatedName})
                raise ExecuteError
            elif aggregatedPolyType != "esriGeometryPolygon":
                aolutils.AddErrorCode(100010, ERROR_CODES[100010])
                raise ExecuteError
            startTime = aolutils.AddTimerMessage(startTime, "Get Aggregated polygon Layer")
        arcpy.env.extent = None

        shapeType = arcpy.GetParameterAsText(5)
        cellSizeValue = arcpy.GetParameterAsText(6)
        cellSizeUnit = arcpy.GetParameterAsText(7)
        if cellSizeValue:
            cellSize = "{} {}".format(cellSizeValue, cellSizeUnit)
        else:
            cellSize = ""
        distanceBandValue = arcpy.GetParameterAsText(8)
        distanceBandUnit = arcpy.GetParameterAsText(9)
        if distanceBandValue:
            distanceBand = "{} {}".format(distanceBandValue, distanceBandUnit)
        else:
            distanceBand = ""

        if hasAnalysisField:
            aggregateMethod = None
            numObjects = inputCount
        elif aggregatedPolygons:
            aggregateMethod = "COUNT_INCIDENTS_WITHIN_AGGREGATION_POLYGONS"
            numObjects = inputCount + aggregatedPolyCount
        else:
            aggregateMethod = "COUNT_INCIDENTS_WITHIN_FISHNET_POLYGONS"
            if shapeType.lower() == "hexagon":
                aggregateMethod = "COUNT_INCIDENTS_WITHIN_HEXAGON_POLYGONS"
            numObjects = inputCount + boundingPolyCount
        # Cloud parameters
        paramsDict = {"analysisLayer": {"count": inputCount, "shapeType": inShape},
                      "analysisField": hasAnalysisField,
                      "boundingPolygonLayer": {"count": boundingPolyCount, "shapeType": boundingPolyType},
                      "aggregationPolygonLayer": {"count": aggregatedPolyCount, "shapeType": aggregatedPolyType}}
        # check publishing privilege
        aolutils.checkForCredits(TASK_NAME, paramsDict)
        arcpy.SetParameterAsText(13, "")

        # Get cloud output paths
        wkspc = aolutils.getOutputWkspc(inputCount)
        scratchFeatures = os.path.join(wkspc,"HotSpotsOutput")
        arcpy.AddMessage(u"output path {0}".format(scratchFeatures))

        #Execute tool
        try:
            if inShape == "esriGeometryPolygon":
                inputFeatureType = 3
                if not hasAnalysisField:
                    aolutils.AddErrorCode(100011, ERROR_CODES[100011])
                    raise ExecuteError
                result = arcpy.gp.OptimizedHotSpotAnalysisAGOL_workflows(inputFeatures, scratchFeatures, analysisField,
                                                                         '', '', '', '', cellSize, distanceBand,
                                                                         dividedByField, service_url, entoken, referer)
            else:
                inputFeatureType = 1
                result = arcpy.gp.OptimizedHotSpotAnalysisAGOL_workflows(inputFeatures, scratchFeatures, analysisField,
                                                                         aggregateMethod, boundingPolygons,
                                                                         aggregatedPolygons,'', cellSize,
                                                                         distanceBand, dividedByField,
                                                                         service_url, entoken, referer)
        except:
                info = arcpy.gp.GetAllMessages()
                for i in info:
                    # arcpy.AddMessage(i)
                    if i[1] == 728:
                        fieldName = i[2].split(":")[1].split(" ")[2]
                        paramName = inputLayersName
                        errormsg = ERROR_CODES[100052].format(fieldName, paramName)
                        aolutils.AddErrorCode(100052, errormsg,{"fieldName":fieldName,"paramName":paramName})
                    elif i[1] == 897:
                        smallDistance = i[2].split(":")[1].split(" ")[5]
                        errormsg = ERROR_CODES[897].format(smallDistance)
                        aolutils.AddErrorCode(897, errormsg, {"smallDistance": smallDistance})
                    elif i[1] == 1535:
                        minNumFeatures = i[2].split(":")[1].split(" ")[-3]
                        errormsg = ERROR_CODES[1535].format(minNumFeatures)
                        aolutils.AddErrorCode(1535, errormsg, {"minNumFeatures":minNumFeatures})
                    elif i[1] == 1536:
                        minNumFeatures = i[2].split(":")[1].split(" ")[-8]
                        dataType = i[2].split(":")[1].split(" ")[-7]
                        errormsg = ERROR_CODES[1536].format(minNumFeatures)
                        aolutils.AddErrorCode(1536, errormsg, {"minNumIncidents":minNumFeatures})
                    elif i[1] == 1570:
                        minNumFeatures = i[2].split(":")[1].split(" ")[10]
                        shapeType = i[2].split(":")[1].split(" ")[11]
                        errormsg = ERROR_CODES[1570].format(minNumFeatures)
                        aolutils.AddErrorCode(1570, errormsg, {"minNumIncidents":minNumFeatures})
                    elif i[1] == 1571:
                        minNumFeatures = i[2].split(":")[1].split(" ")[10]
                        dataType = i[2].split(":")[1].split(" ")[11]
                        errormsg = ERROR_CODES[1571].format(minNumFeatures)
                        aolutils.AddErrorCode(1571, errormsg, {"minNumFeatures":minNumFeatures})
                    elif i[1] == 1574:
                        minNumIncidents = i[2].split(":")[1].split(" ")[-8]
                        errormsg = ERROR_CODES[1574].format(minNumIncidents)
                        aolutils.AddErrorCode(1574, errormsg, {"minNumIncidents":minNumIncidents})
                    elif i[1] == 641:
                        minFeatures = i[2].split(":")[1].split(" ")[-4]
                        errormsg = ERROR_CODES[641].format(minFeatures)
                        aolutils.AddErrorCode(641, errormsg, {"minFeatures":minFeatures})
                    elif i[1] in error_ID:
                        aolutils.AddErrorCode(i[1],i[2].split(":")[1])
                raise Exception

        startTime = aolutils.AddTimerMessage(startTime, "Run Find Hot Spots tool")

        # Get processing messages
        info = arcpy.gp.GetAllMessages()
        processInfo = []
        for i in info:
            if "messageCode" in i[2]:
                if not processInfo:
                    intro = '{"messageCode": "SS_00002", "message": "The following report outlines the workflow used to optimize your Find Hot Spots result:", "params": {}, "style": "<b></b><br/>"}'
                    processInfo.append(intro)
                processInfo.append(str(i[2]))

        returnType = 1
        if outputName.createService == True:
            returnType = 2
        # When useChordal, outenv is set to GCS, so project the output back to PCS
        if useChordal:
            projectedOutput = os.path.join("in_memory", "projectedOutput")
            arcpy.env.outputCoordinateSystem = spatialRef.PCSCode
            arcpy.gp._arc_object.SimpleCopy(scratchFeatures, projectedOutput)
            scratchFeatures = projectedOutput
        descOutput = arcpy.Describe(scratchFeatures)
        outshape = descOutput.shapeType
        pt_count = int(arcpy.GetCount_management(scratchFeatures).getOutput(0))
        drawingInfo = rendererUtils.getHotSpotRenderingInfo(outshape, pt_count)

        # Create feature service layer for output parameter
        popupInfo = getPopupContent()
        startTime = aolutils.AddTimerMessage(startTime, "Create popup")

        res = aolutils.HostedToolResult(outputName)
        outDesc = aolutils.getOutDescription("HotSpotsLayer", 0, drawingInfo, popupInfo)
        res.addHostedOutput(descOutput, outDesc, 12)
        startTime = res.generateHostedResult(hostedgp, startTime)

        startTime = aolutils.AddTimerMessage(startTime, "Create Output Layer")

        arcpy.SetParameterAsText(13, json.dumps(processInfo))

        values = [inputFeatureType,
                  inputCount,
                  hasAnalysisField,
                  aggregatedPolyCount,
                  boundingPolyCount,
                  returnType]
        cost = numObjects * costFactor

        aolutils.LogUsageMetering(TASK_NAME, numObjects, cost, beginTime, values)

        aolutils.reportParamsForCost(hostedgp, TASK_NAME, paramsDict)

    except arcpy.ExecuteError as err:
        aolutils.AddExecuteErrors(TASK_NAME, error_ID)

    except Exception as err:
        aolutils.AddExceptionError(TASK_NAME, err)

    finally:
        if hostedgp:
            hostedgp.Cleanup()

# End Module OptimizedHSA.py
