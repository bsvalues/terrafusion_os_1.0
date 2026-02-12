"""---------------------------------------------------------------------------
Name:              Density.py
Purpose:           Density
Author:            Esri Inc.
Created:           2/1/2014
Copyright:   (c)   Esri, Inc. 2014
ArcGIS Version:    10.2
---------------------------------------------------------------------------"""
from __future__ import unicode_literals
import time
import os
import json
import arcpy
import hostedgp as agolgp
import aolutils
# import debugUtils
import classifyUtils
import CalculateDensityCore
import popup


TASK_NAME = u'CalculateDensity'
ERROR_CODES = [100024, 100105, 10246, 100106, 100107, 100108,
               100109, 100008, 100087]

errorMsgs = {100106: "Field {} is not numeric.",
             100109: "The geometry type for the input layer must be points or lines",
             100008: "The geometry type for the boundingPolygonLayer must be polygons",
             100087: "Field {} does not exist in {}"}


def getPopupContent(title, featureClass):
    """Creates appropriate popup content"""
    popupInfo = popup.PopupInfo(title)
    # Add class
    popupInfo.addFieldInfo("class", "Class")
    for field in arcpy.ListFields(featureClass):
        if field.type.lower() == "double":
            if "analysis" in field.name.lower():
                # Add analysisarea
                popupInfo.addFieldInfo(field.name, field.aliasName, True, 6)
            else:
                # Add min/Max field
                popupInfo.addFieldInfo(field.name, field.aliasName, True, 8)

    return popupInfo.getPopupInfo()


def verifyParameters():
    # verify Input geometry
    shapeType = Input.shapeType.lower()
    if not ("point" in shapeType or "line" in shapeType):
        errorMsg = errorMsgs[100109].format(field)
        aolutils.AddErrorCode(100109, errorMsg)
        return False
    # verify input field
    if field:
        fields = arcpy.ListFields(InputLayer, field)
        if not fields or fields[0].name.lower() != field.lower():
            errorMsg = errorMsgs[100087].format(field, InputLayerName)
            params = {"fieldName": field, "inputLayer": InputLayerName}
            aolutils.AddErrorCode(100087, errorMsg, params)
            return False
        elif fields[0].type.lower() not in ["double", "single", "integer", "smallinteger"]:
            errorMsg = errorMsgs[100106].format(field)
            params = {"fieldName": field}
            aolutils.AddErrorCode(100106, errorMsg, params)
            return False
    # verify boundingPolygon
    if boundingPolygonLayer:
        if not ("polygon" in boundingPolygonLyr.shapeType.lower()):
            errorMsg = errorMsgs[100008]
            aolutils.AddErrorCode(100008, errorMsg)
            return False
    return True


if __name__ == '__main__':
    hostedgp = None
    startTime = time.time()
    beginTime = startTime

    try:
        hostedgp = agolgp.HostedGP(11, 10)
        outputName = hostedgp.GetOutputName(10)
        # check for publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        costFactor = 0.001
        return_type = 1
        Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "input layer", 0)
        InputLayer = Input.name
        InputLayerName = Input.layername
        if len(InputLayerName) == 0:
            InputLayerName = "Input Features"
        cost = InputLayerCount * costFactor
        startTime = aolutils.AddTimerMessage(startTime, "Get Input Layer")
        layerPath = arcpy.Describe(InputLayer).catalogPath
        # workaround for search radius calculation
        # kernel density tool ignores selection for search radius calc
        # if ".sde" in layerPath:
        # arcpy.AddMessage("count before copy: {}".format(InputLayerCount))
        if InputLayerCount > 2000:
            wkspc = arcpy.env.scratchGDB
        else:
            wkspc = "in_memory"
        InputLayerPath = os.path.join(wkspc, "inputCopy")
        arcpy.AddMessage(InputLayer)
        startTime = aolutils.AddTimerMessage(startTime, "copyFeatures")
        arcpy.CopyFeatures_management(Input.name, InputLayerPath)
        InputLayer = "inputLayer"
        arcpy.MakeFeatureLayer_management(InputLayerPath, InputLayer)

        # debugUtils.debugFeatureCount(InputLayer, "copied layer")

        # Not setting it to None for this tool
        # arcpy.env.extent = None

        changedFields = Input.changedFieldNames
        field = arcpy.GetParameterAsText(1)
        field = aolutils.updateChangedFieldNames(field, changedFields)

        cellsize = arcpy.GetParameter(2)
        cellsizeunits = arcpy.GetParameterAsText(3)
        radius = arcpy.GetParameter(4)
        radiusunits = arcpy.GetParameterAsText(5)

        boundingPolygonLyr, boundingPolygonCount = aolutils.getHostedLayerX(hostedgp, "bounding layer", 6)
        boundingPolygonLayer = boundingPolygonLyr.name

        startTime = aolutils.AddTimerMessage(startTime, "Get boundingPolygon Layer")

        paramsDict = {"inputLayer": {"count": Input.count, "shapeType": Input.shapeType},
                      "boundingPolygonLayer": {"count": boundingPolygonLyr.count,
                                               "shapeType": boundingPolygonLyr.shapeType}}
        # check credits balance
        aolutils.checkForCredits(TASK_NAME, paramsDict)

        areaunits = arcpy.GetParameterAsText(7)
        # default to organizations units
        if not areaunits:
            areaunits = aolutils.getUnits(hostedgp)
            arcpy.AddMessage("Units from org profile {}".format(areaunits))  
            startTime = aolutils.AddTimerMessage(startTime, "Get areaUnits from UserProfile")
        classificationMethod = arcpy.GetParameterAsText(8)
        numClasses = arcpy.GetParameter(9)

        clsLUDict = {'EqualArea': 'quantile',
                     'EqualInterval': 'equal',
                     'GeometricInterval': 'geometrical',
                     'NaturalBreaks': 'natural',
                     'StandardDeviation': 'standard'}
        classificationType = clsLUDict[classificationMethod]

        # output parameter
        arcpy.SetParameterAsText(12, "")

        if verifyParameters():

            lyrname = "DensityFeatures"
            # outfeatures is always set to in_memory
            # since rasters don't correspond to number of points
            wkspc = "in_memory"
            outFeatures = os.path.join(wkspc, lyrname)
            arcpy.AddMessage(u"Output features: {}".format(outFeatures))

            drawingInfo = CalculateDensityCore.calculateDensity(startTime, InputLayer, outFeatures, field,
                                                                cellsize, cellsizeunits,
                                                                radius, radiusunits, boundingPolygonLayer,
                                                                areaunits, classificationType, numClasses)
            if drawingInfo:

                startTime = aolutils.AddTimerMessage(startTime, "Run Density tool")
                # debugUtils.debugToolMessages(result)

                descOutput = arcpy.Describe(outFeatures)
                res = aolutils.HostedToolResult(outputName)
                title = "{} Density".format(InputLayerName)
                popupInfo = getPopupContent(title, outFeatures)
                startTime = aolutils.AddTimerMessage(startTime, "Get Popup")
                outDesc = aolutils.getOutDescription(lyrname, 0, drawingInfo, popupInfo)
                res.addHostedOutput(descOutput, outDesc, 12)
                startTime = res.generateHostedResult(hostedgp, startTime)

                shapeCode = aolutils.GetShapeTypeCode(Input.shapeType)
                classificationCode = classifyUtils.getClassificationCode(classificationType)
                if field:
                    fieldCode = 1
                else:
                    fieldCode = 0

                values = [
                    shapeCode,
                    InputLayerCount,
                    fieldCode,
                    classificationCode,
                    numClasses,
                    return_type
                ]

                aolutils.LogUsageMetering(TASK_NAME, InputLayerCount, cost, beginTime, values)

                aolutils.reportParamsForCost(hostedgp, TASK_NAME, paramsDict)
                startTime = aolutils.AddTimerMessage(startTime, "Report Cost and LogValues")

    except arcpy.ExecuteError as err:
        aolutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        aolutils.AddExceptionError(TASK_NAME, err)

    finally:
        if hostedgp:
            hostedgp.Cleanup()
            aolutils.AddTimerMessage(startTime, "cleanup")
