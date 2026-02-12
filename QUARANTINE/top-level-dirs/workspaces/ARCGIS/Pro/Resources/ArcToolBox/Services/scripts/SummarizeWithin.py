"""---------------------------------------------------------------------------
Name:              SummarizeWithin.py
Purpose:           Summarized attributes that intersects another layer for AGOL 
Author:            Esri Inc.
Created:           5/6/2013
Copyright:   (c)   Esri, Inc. 2013
ArcGIS Version:    10.1
---------------------------------------------------------------------------"""
from __future__ import unicode_literals
import os
import json
import arcpy
import hostedgp as agolgp
import aolutils
import popup
import copy
import re
import time
import summarytoolutils as sumutils
import debugUtils
import rendererUtils
import SummarizeWithinCore as sumwithincore
from generatetessellations import TessellationGenerator

# import importlib
# importlib.reload(sumutils)
# importlib.reload(rendererUtils)
# importlib.reload(sumwithincore)


# declare constants/ module variables

TASK_NAME = "SummarizeWithin"

ERROR_CODES = [100004, 100005, 100006, 100024, 100018, 100019, 100048, 100052, 100119, 100125, 100255, 100256]

errorMsgs = {100119: "The geometry type of WithinLayer input must be polygons.",
             100018: "Sum Units {} is not applicable for {} shape type",
             100019: "At least one of the parameters Summarize Shape or Summary Fields is required.",
             100004: "The field {} provided for Summary Fields does not exist.",
             100005: "The field {} provided for Summary Fields is not numeric.",
             100006: "The Summary type {} provided for field {} is invalid.",
             100052: "The field name {} does not exist in the {}",
             100048: "The input layer {} contains multipoint geometry and has been converted to single point geometry",
             100125: "The groupby field {} must be integers, text, or date.",
             100255: "Failed to create bins",
             100256: "Parameter {} requires a valid value."}

# End constants and module variables


def verifyInputs():
    '''verifies parameter inputs'''
    global withinLayerShapeType
    global summarizeLayerShapeType
    global summarizeLayerName
    global sumShape
    global sumUnits
    global updatedSummFields
    global summarizeLayer
    global groupFieldName

    isValid = []
    # verify input shapetypes
    if "polygon" not in withinLayerShapeType:     
        aolutils.AddErrorCode(100119, errorMsgs[100119])
        isValid.append(False)
    # verify other params
    resp = sumutils.verifySummaryToolParams(sumShape, sumUnits, updatedSummFields, summarizeLayer,
                                            summarizeLayerShapeType, summarizeLayerName,
                                            groupFieldName, errorMsgs)
    isValid.extend(resp)

    return all(isValid)


def reportLogAndMeteringInfo(begin_time):
    '''compute Log and usage metering'''

    numObjects = WithinLayerCount + summarizeLayerCount
    cost = numObjects * 0.001

    if sumShape:
        sumShapeCount = 1
    else:
        sumShapeCount = 2

    if len(groupFieldName) > 0:
        groupFieldCount = 2
    else:
        groupFieldCount = 1

    if updatedSummFields:
        summaryFieldsCount = len(updatedSummFields)
    else:
        summaryFieldsCount = 0

    if shapePercent:
        shapePercentCount = 1
    else:
        shapePercentCount = 0

    if outputName.createService:
        returnType = 2
    else:
        returnType = 1
    values = [WithinLayerCount, summarizeLayerCount, sumShapeCount,
              summaryFieldsCount, groupFieldCount, shapePercentCount,
              returnType]
    aolutils.LogUsageMetering(TASK_NAME, numObjects, cost, begin_time, values)
    return

# End def reportLogAndMeteringInfo    

if __name__ == '__main__':

    # Initialize context
    hostedgp = None
    # timer messages
    startTime = time.time()
    beginTime = startTime

    try:
        # initialize
        hostedgp = agolgp.HostedGP(9, 8)  
        outputName = hostedgp.GetOutputName(8)
        # check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        # Input polygon boundaries.
        if len(arcpy.GetParameterAsText(1)) > 0:
            summarizeLyr, summarizeLayerCount = aolutils.getHostedLayerX(hostedgp, "summary layer", 1)
            summarizeLayer = summarizeLyr.name
            summarizeLayerShapeType = summarizeLyr.shapeType.lstrip("esriGeometry")
            summarizeLayerName = summarizeLyr.layername
            summarizeLyrChangedFieldNames = summarizeLyr.changedFieldNames
            if len(summarizeLayerName) == 0:
                summarizeLayerName = "features"
            startTime = aolutils.AddTimerMessage(startTime, "Get Summarize Layer")
        else:
            paramName = "summaryLayer"
            errorMsg = errorMsgs[100256].format(paramName)
            errorDict = {"paramName": paramName}
            aolutils.AddErrorCode(100256, errorMsg, errorDict)

        # Total Area of polygons, length of lines or count of points
        sumShape = arcpy.GetParameter(2)

        # units for sumShape
        sumUnits = arcpy.GetParameterAsText(3) or None

        # Additional field statistics .
        summaryFields = arcpy.GetParameter(4) or ""
        # update changed Fields
        if summarizeLyrChangedFieldNames:
            summaryFields = aolutils.updateChangedFieldNames(arcpy.GetParameterAsText(4),
                                                             summarizeLyrChangedFieldNames,
                                                             True, True)
            summaryFields = summaryFields.split(";")
        # create a simpler data structure for processing later
        updatedSummFields = aolutils.convertSummaryFieldstoArray(summaryFields)

        # Group attributes when calculating statistics.
        groupFieldName = arcpy.GetParameterAsText(5)
        groupFieldName = aolutils.updateChangedFieldNames(groupFieldName, summarizeLyrChangedFieldNames)

        if groupFieldName:
            # minority, majority for groupByField
            minorityMajority = arcpy.GetParameter(6)
            shapePercent = arcpy.GetParameter(7)
        else:
            minorityMajority = False
            shapePercent = False

        if minorityMajority or shapePercent:
            sumShape = True

        poly_text = arcpy.GetParameterAsText(0)
        binType = arcpy.GetParameterAsText(10)
        binSize = arcpy.GetParameter(11) or "#"
        binSizeUnits = arcpy.GetParameterAsText(12) or "#"

        # Check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        paramsDict = {"summaryLayer": {"count": summarizeLayerCount, "shapeType": summarizeLyr.shapeType},
                      "sumShape": sumShape,
                      "shapeUnits": sumUnits,
                      "summaryFields": summaryFields,
                      "groupByField": groupFieldName,
                      "percentShape": shapePercent}

        # Input point features to count (summarize).
        if len(poly_text) > 0:
            withinLyr, WithinLayerCount = aolutils.getHostedLayerX(hostedgp, "within layer", 0)
            paramsDict["sumWithinLayer"] = {"count": WithinLayerCount, "shapeType": "esriGeometryPolygon"}
            aolutils.checkForCredits(TASK_NAME, paramsDict)

            withinLayer = withinLyr.name
            withinLayerName = withinLyr.layername
            withinLayerShapeType = withinLyr.shapeType.lstrip("esriGeometry").lower()
            if len(withinLayerName) == 0:
                withinLayerName = "WithinLayer"
            # identifies hexgrid living atals analysis layer for withinLyr
            hexGrids = aolutils.hexGrids(withinLyr)
        else:
            paramsDict["summaryLayer"]["layer"] = summarizeLayer
            paramsDict["binType"] = binType
            paramsDict["binSize"] = binSize
            paramsDict["binSizeUnit"] = binSizeUnits
            aolutils.checkForCredits(TASK_NAME, paramsDict)

            withinLyr = None
            withinLayer = None
            binPolygon = os.path.join(arcpy.env.scratchGDB, "binPolygons")
            try:
                # sumutils.createBinPolygons(binPolygon, summarizeLayer, binType, binSize, binSizeUnits)
                TessellationGenerator(output_layer=binPolygon, shape_type=binType, size=binSize,
                                      size_unit=binSizeUnits, extent_layer=summarizeLayer).generate()
                withinLayer = binPolygon
                withinLayerShapeType = "polygon"
                result = arcpy.GetCount_management(binPolygon)
                WithinLayerCount = int(result.getOutput(0))
                withinLayerName = "Polygon Features"

                paramsDict["sumWithinLayer"] = {"count": WithinLayerCount, "shapeType": "esriGeometryPolygon"}
                # clear selection if any on points layer
                # https://devtopia.esri.com/ArcGISPro/geoprocessing/issues/1755
                arcpy.SelectLayerByAttribute_management(summarizeLayer, "CLEAR_SELECTION", None, None)
                hexGrids = True
            except arcpy.ExecuteError as e:
                arcpy.AddMessage(e)
                aolutils.AddErrorCode(100255, errorMsgs[100255])
            except Exception as e:
                arcpy.AddMessage("Exception in creating bins")
                aolutils.AddErrorCode(100255, errorMsgs[100255])

        # if there is no withinLayer at this point raise exception
        if not withinLayer:
            raise Exception
        startTime = aolutils.AddTimerMessage(startTime, "Get Within Layer")

        # set env extent to None: workaround
        arcpy.env.extent = None

        # get default values for sumUnits from profile
        if sumShape and not sumUnits and "Point" not in summarizeLayerShapeType:

            if "Polyline" in summarizeLayerShapeType:
                sumUnits = aolutils.getUnits(hostedgp, shapeUnitsPolygon=False)
            else:
                sumUnits = aolutils.getUnits(hostedgp)
            # arcpy.AddMessage("sumunits set to user profile: {}".format(sumUnits))

        # output parameters

        # We'll set the output parameters later when the tool is successful.
        arcpy.SetParameterAsText(13, "")
        arcpy.SetParameterAsText(14, "")

        # Set environment
        wkspc = aolutils.getOutputWkspc(WithinLayerCount)

        # Define in_memory output locations
        summarizedOutput = os.path.join(wkspc, "summarizedOutput")            
        # arcpy.AddMessage(u"summarizedOutput {}".format(summarizedOutput))                                                    

        if len(groupFieldName) > 0:
            groupByTable = os.path.join(wkspc, "summaryTable")     
            # arcpy.AddMessage(u"groupByTable {}".format(groupByTable))                                                           
        else:
            groupByTable = ""

        if not verifyInputs():
            raise Exception
        else:
            if summarizeLayerShapeType.lower() == "multipoint":
                wkspcPoints = aolutils.getOutputWkspc(summarizeLayerCount)
                summarizeLayer, msg = aolutils.convertMutiPointToSingleFeatures(summarizeLayer,
                                                                                summarizeLayerName,
                                                                                errorMsgs[100048], wkspcPoints)
                # append True for warning
                # msg.append(True)
                aolutils.AddErrorCode(*msg)

            # run summarize within

            startime, fieldInfo = sumwithincore.summarizeWithin(startTime, withinLayer, summarizeLayer,
                                                                summarizeLayerShapeType, summarizedOutput,
                                                                True, sumShape, sumUnits, updatedSummFields,
                                                                groupFieldName, minorityMajority, shapePercent,
                                                                groupByTable, wkspc)

            # arcpy.AddMessage("fieldInfo : {}".format(fieldInfo))
            startTime = aolutils.AddTimerMessage(startTime, "Summarize Within Core")
            aolutils.createShapeAreaField(summarizedOutput, sumUnits)
            startTime = sumutils.processResults(startTime, fieldInfo, 13, 14,
                                                hostedgp, outputName, summarizedOutput,
                                                summarizeLayerName, summarizeLayerShapeType,
                                                sumShape, groupFieldName, groupByTable,
                                                hexGrids=hexGrids)

            # report tool and metering information
            reportLogAndMeteringInfo(beginTime)

            # report cost
            aolutils.reportParamsForCost(hostedgp, TASK_NAME, paramsDict)

    except arcpy.ExecuteError as err:
        aolutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        arcpy.AddMessage("exception")
        #import traceback
        #import sys
        #msgs = traceback.format_exception(*sys.exc_info())[1:]
        #for msg in msgs:
            #arcpy.AddMessage(msg.strip()) 
        aolutils.AddExceptionError(TASK_NAME, err)

    finally:
        if hostedgp:
            hostedgp.Cleanup()
            startTime = aolutils.AddTimerMessage(startTime, "Cleanup")

# End Module AggregatePoints.py
