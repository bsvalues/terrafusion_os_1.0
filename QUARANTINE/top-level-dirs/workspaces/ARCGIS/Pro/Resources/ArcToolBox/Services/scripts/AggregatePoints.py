"""---------------------------------------------------------------------------
Name:              AggregatePoints.py
Purpose:           Aggregates point and it's attributes for AGOL 
Author:            Esri Inc.
Created:           1/7/2013
Copyright:   (c)   Esri, Inc. 2013
ArcGIS Version:    10.1
---------------------------------------------------------------------------"""
import os
import arcpy
import hostedgp as agolgp
import aolutils
import time
from generatetessellations import TessellationGenerator
import summarytoolutils as sumutils
import rendererUtils as rendUtils
from AggregatePointsCore import aggregatePoints
from SummarizeWithinCore import summarizeWithin


# declare constants/ module variables

REQD_TOOLBOXES = "Workflows.tbx"

ALT_TEXT = {"Min": "Minimum", "Max": "Maximum", "Mean": "Average",
            "Sum": "Sum", "Stddev": "Standard Deviation", "Std": "Standard Deviation"}

TASK_NAME = "AggregatePoints"

ERROR_CODES = [100001, 100002, 100003, 100004, 100005,
               100006, 728, 100024, 100048, 100052, 100125]

errorMsgs = {100002: "The geometry type of Point Layer must be points",
             100003: "The geometry type of Polygon Layer must be polygons",
             100004: "The field {} provided for Summary Fields does not exist",
             100005: "The field {} provided for Summary Fields is not numeric",
             100006: "The Summary type {} provided for field {} is invalid",
             100052: "The field name {} does not exist in the {}",
             100048: "The input layer {} contains multipoint geometry and has been converted to single point geometry",
             100125: "The groupby field {} must be integers, text, or date.",
             100255: "Failed to create bins"}

# End constants


def reportLoggingInfo(begin_time):
    '''compute Log and usage metering'''

    numObjects = pointCount + polygonCount
    cost = numObjects * 0.001

    if keepEmptyBoundaries:
        keepEmptyBoundariesCount = 1
    else:
        keepEmptyBoundariesCount = 2

    if groupFieldName:
        groupFieldCount = 2
    else:
        groupFieldCount = 1

    if updatedSummFields:
        summaryFieldsCount = len(updatedSummFields)
    else:
        summaryFieldsCount = 0

    if outputName.createService:
        returnType = 2
    else:
        returnType = 1

    values = [pointCount, polygonCount, keepEmptyBoundariesCount, summaryFieldsCount, groupFieldCount, returnType]
    aolutils.LogUsageMetering(TASK_NAME, numObjects, cost, begin_time, values)
    return

# End def reportLoggingInfo


def verifyParameters(pt, poly, ptLyrName, summaryFields, groupField):
    '''verifies aggregate points parameters'''
    isValid = []
    # verify input shapetypes
    if "point" not in pt.shapeType.lower():
        aolutils.AddErrorCode(100002, errorMsgs[100002])
        isValid.append(False)

    if poly and "polygon" not in poly.shapeType.lower():
        aolutils.AddErrorCode(100003, errorMsgs[100003])
        isValid.append(False)

    fieldList = arcpy.ListFields(pt.name)
    # verify summary fields exist and stats fields in Min, Max, Mean, Sum, Count
    if summaryFields:
        msgs = sumutils.verifySummaryFields(fieldList, summaryFields, errorMsgs)
        if msgs:
            for msg in msgs:
                aolutils.AddErrorCode(*msg)
            isValid.append(False)

    # verify groupByFieldName
    if groupField:
        res = sumutils.verifyGroupByField(groupField, fieldList, errorMsgs, ptLyrName)        
        isValid.append(res)
    return all(isValid)


def processResults(startTime, fieldInfo, hexGrids):
    # 1. describe output
    # Add analysis area field
    units = aolutils.getUnits(hostedgp)
    aolutils.createShapeAreaField(aggregatedPolygons, units)
    descAggregatedPolygons = arcpy.Describe(aggregatedPolygons)

    # 2. Create a name for the layer
    layerName = "AggregatedLayer"

    # 3.  get drawingInfo
    ptCntFieldName = fieldInfo["shapeField"][0]
    if hexGrids:
        drawingInfo = rendUtils.getGraduatedColorsInfo(aggregatedPolygons, ptCntFieldName)
    else:
        drawingInfo = rendUtils.getGraduatedSymbolsInfo(aggregatedPolygons, ptCntFieldName)
    # arcpy.AddMessage(json.dumps(drawingInfo))
    startTime = aolutils.AddTimerMessage(startTime, "Create drawingInfo")

    # check if groupby returned output
    if groupFieldName:
        groupByTableDoesNotExist = sumutils.checkForEmptyGroupByTable(aggregatedTable)                       
    else:
        groupByTableDoesNotExist = True

    # 5. create output
    if groupByTableDoesNotExist:

        # Create Feature Service tool output
        aggToolOutput = aolutils.HostedToolResult(outputName)
        # 4. get popupInfo
        title = "Aggregation of {}".format(pointLyrName)
        popupInfo = sumutils.getPopupContent(descAggregatedPolygons, pointLyrName,
                                             fieldInfo)
        startTime = aolutils.AddTimerMessage(startTime, "Create popupInfo")
        # create layer description
        layerOutDesc = aolutils.getOutDescription(layerName, 0, drawingInfo, popupInfo)
        # add layer to feature service output
        aggToolOutput.addHostedOutput(descAggregatedPolygons, layerOutDesc, 12)

    else:

        # define table and layer relationship def
        relationshipName = "groupBySummary"
        layerKeyField = fieldInfo["layerJoinIDField"][0]
        descAggregatedTable = arcpy.Describe(aggregatedTable)      
        tblKeyField = fieldInfo["tblJoinIDField"][0]
        # lyrRelationshipDef = aolutils.getRelationshipDef(relationshipName, 1, "OBJECTID")
        lyrRelationshipDef = aolutils.getRelationshipDef(relationshipName, 1, layerKeyField)
        relationshipId = 0
        tblRelDef = aolutils.getRelationshipDef(relationshipName, relationshipId,
                                                tblKeyField, False)
        # arcpy.AddMessage("{};{}".format(layerKeyField, tblKeyField))

        # create popup
        title = "Aggregation of {}".format(pointLyrName)
        fieldList = descAggregatedTable.fields
        popupInfo = sumutils.getPopupContent(descAggregatedPolygons, pointLyrName, fieldInfo,
                                             relationshipId, fieldList)
        startTime = aolutils.AddTimerMessage(startTime, "Create popupInfo")

        # create layer description
        layerOutDesc = aolutils.getOutDescription(layerName, 0, drawingInfo,
                                                  popupInfo, [lyrRelationshipDef])
        # create table description
        tableName = "AggregatedGroupBy"
        tableOutDesc = aolutils.getOutDescription(tableName, 1, relationships=[tblRelDef])

        # Create Feature Service tool output
        aggToolOutput = aolutils.HostedToolResult(outputName)
        # add layer to feature service output
        aggToolOutput.addHostedOutput(descAggregatedPolygons, layerOutDesc, 12)
        # add table to feature service output
        aggToolOutput.addHostedOutput(descAggregatedTable, tableOutDesc, 13)
        # arcpy.AddMessage("created layer and table description")

    # create Feature Service
    startTime = aggToolOutput.generateHostedResult(hostedgp, startTime)
    return startTime

# End def aggregatePoints


if __name__ == '__main__':
    hostedgp = None
    # initialize timer messages
    startTime = time.time()
    beginTime = startTime

    try:

        # init hostedgp
        hostedgp = agolgp.HostedGP(8, 7)
        outputName = hostedgp.GetOutputName(7)

        # Input point features
        points, pointCount = aolutils.getHostedLayerX(hostedgp, "Point Layer", 0)
        pointLayer = points.name
        pointLyrName = points.layername
        pointLyrShapeType = points.shapeType
        ptChangedFieldNames = points.changedFieldNames
        if not pointLyrName:
            pointLyrName = "Point Features"

        startTime = aolutils.AddTimerMessage(startTime, "Get Point Layer")

        # Do we need to remove boundaries that have no intersecting points?
        keepEmptyBoundaries = arcpy.GetParameter(2)

        # Additional attribute statistics other than count.
        summaryFields = arcpy.GetParameter(3) or None
        # update changedFields
        if ptChangedFieldNames:
            summaryFields = aolutils.updateChangedFieldNames(arcpy.GetParameterAsText(3), ptChangedFieldNames,
                                                             True, True)
            summaryFields = summaryFields.split(";")

        # create a simpler data structure for processing later
        updatedSummFields = aolutils.convertSummaryFieldstoArray(summaryFields)

        # Group attributes when calculating statistics.
        groupFieldName = arcpy.GetParameterAsText(4) or None
        groupFieldName = aolutils.updateChangedFieldNames(groupFieldName, ptChangedFieldNames)

        if groupFieldName:
            # minority, majority for groupByField
            minorityMajority = arcpy.GetParameter(5)
            percentPoints = arcpy.GetParameter(6)
        else:
            minorityMajority = False
            percentPoints = False

        # Input polygon boundaries.
        polygon_text = arcpy.GetParameterAsText(1)
        binType = arcpy.GetParameterAsText(9)
        binSize = arcpy.GetParameter(10) or "#"
        binSizeUnits = arcpy.GetParameterAsText(11) or "#"

        # Check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        # paramsDict = {"pointLayer":{"count":pointCount, "shapeType":"esriGeometryPoint"},
        #               "polygonLayer":{"count":polygonCount, "shapeType":"esriGeometryPolygon"},
        #                   "keepBoundariesWithNoPoints":keepEmptyBoundaries,
        #                   "summaryFields":arcpy.GetParameter(3),
        #                   "groupByField":groupFieldName}

        paramsDict = {"pointLayer": {"count": pointCount, "shapeType": "esriGeometryPoint"},
                      "keepBoundariesWithNoPoints": keepEmptyBoundaries,
                      "summaryFields": arcpy.GetParameter(3),
                      "groupByField": groupFieldName}

        if len(polygon_text) > 0:
            polygons, polygonCount = aolutils.getHostedLayerX(hostedgp, "Polygon Layer", 1)
            paramsDict["polygonLayer"] = {"count": polygonCount, "shapeType": "esriGeometryPolygon"}
            # Check the credits (Move credits and publishing privilege check after getting all parameters.)
            # This change is due to a potential issue that will change the parameter value after GenerateTesselation.
            aolutils.checkForCredits(TASK_NAME, paramsDict)

            polygonLayer = polygons.name
            polygonLyrName = polygons.layername
            # Check whether the polygon is hex grids from the local layer
            isHexGrids = aolutils.hexGrids(polygons)
            if not polygonLyrName:
                polygonLyrName = "Polygon Features"
            startTime = aolutils.AddTimerMessage(startTime, "Get Polygon Layer")
        else:
            paramsDict["pointLayer"]["layer"] = pointLayer
            paramsDict["binType"] = binType
            paramsDict["binSize"] = binSize
            paramsDict["binSizeUnit"] = binSizeUnits
            aolutils.checkForCredits(TASK_NAME, paramsDict)

            polygons = None
            polygonLayer = None
            binPolygon = os.path.join(arcpy.env.scratchGDB, "binPolygons")
            try:
                TessellationGenerator(output_layer=binPolygon, shape_type=binType, size=binSize,
                                      size_unit=binSizeUnits, extent_layer=pointLayer).generate()
                # sumutils.createBinPolygons(binPolygon, pointLayer, binType, binSize, binSizeUnits)
                polygonLayer = binPolygon
                result = arcpy.GetCount_management(binPolygon)
                polygonCount = int(result.getOutput(0))
                polygonLyrName = "Polygon Features"
                # clear selection if any on points layer
                # https://devtopia.esri.com/ArcGISPro/geoprocessing/issues/1755
                arcpy.SelectLayerByAttribute_management(pointLayer, "CLEAR_SELECTION", None, None)
                startTime = aolutils.AddTimerMessage(startTime, "Create bins")
                isHexGrids = True
            except arcpy.ExecuteError as e:
                arcpy.AddMessage(e)
                aolutils.AddErrorCode(100255, errorMsgs[100255])
            except Exception as e:
                arcpy.AddMessage("Exception in creating bins")
                aolutils.AddErrorCode(100255, errorMsgs[100255])

        if not polygonLayer or len(polygonLayer) == 0:
            raise Exception

        # output parameters

        # We'll set the output parameters later when the tool is successful.
        arcpy.SetParameterAsText(12, "")
        arcpy.SetParameterAsText(13, "")

        # set env extent to None: workaround
        arcpy.env.extent = None

        # define output data path
        wkspc = aolutils.getOutputWkspc(polygonCount)

        aggregatedPolygons = os.path.join(wkspc, "aggregatedPolygons")
        # arcpy.AddMessage(u"aggregatedPolygons {}".format(aggregatedPolygons))

        if groupFieldName:
            aggregatedTable = os.path.join(wkspc, "summaryTable")
            # arcpy.AddMessage(u"aggregatedTable {}".format(aggregatedTable))
        else:
            aggregatedTable = ""

        # verify parameters
        if not verifyParameters(points, polygons, pointLyrName,
                                updatedSummFields, groupFieldName):
            raise Exception
        else:
            # further processing
            if "multipoint" in pointLyrShapeType.lower():
                wkspcPoints = aolutils.getOutputWkspc(pointCount)
                pointLayer, msg = aolutils.convertMutiPointToSingleFeatures(pointLayer,
                                                                            pointLyrName, errorMsgs[100048],
                                                                            wkspcPoints)
                # append True for warning
                # msg.append(True)
                aolutils.AddErrorCode(*msg)

            # run aggregate points
            if groupFieldName:
                startTime, fieldInfo = summarizeWithin(startTime, polygonLayer, pointLayer,
                                                       "Point", aggregatedPolygons, keepEmptyBoundaries,
                                                       True, "Meters", updatedSummFields,
                                                       groupFieldName, minorityMajority, percentPoints,
                                                       aggregatedTable, wkspc)
            else:
                startTime, fieldInfo = aggregatePoints(startTime, pointLayer, polygonLayer,
                                                       keepEmptyBoundaries, updatedSummFields,
                                                       groupFieldName, minorityMajority, percentPoints,
                                                       aggregatedPolygons, aggregatedTable, wkspc)
            arcpy.AddMessage(fieldInfo)
            processResults(startTime, fieldInfo, isHexGrids)

            # report tool and metering information
            reportLoggingInfo(beginTime)

            # report cost
            # Update the polygonCount using the exact count
            paramsDict["polygonLayer"] = {"count": polygonCount, "shapeType": "esriGeometryPolygon"}
            aolutils.reportParamsForCost(hostedgp, TASK_NAME, paramsDict)

    except arcpy.ExecuteError as err:
        arcpy.AddMessage("Execute Error")
        aolutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        arcpy.AddMessage("exception")
        aolutils.AddExceptionError(TASK_NAME, err)

    finally:
        if hostedgp:
            hostedgp.Cleanup()
            startTime = aolutils.AddTimerMessage(startTime, "Cleanup")

# End Module AggregatePoints.py
