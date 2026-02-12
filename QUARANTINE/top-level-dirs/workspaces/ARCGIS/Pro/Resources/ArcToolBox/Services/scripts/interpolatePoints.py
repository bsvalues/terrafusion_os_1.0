"""---------------------------------------------------------------------------
Name:              Interpolate.py
Purpose:           Interpolate
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
import debugUtils
import rendererUtils
import classifyUtils
import copy
import interpolateCore


# REQD_TOOLBOXES = "Workflows.tbx"
TASK_NAME = u'InterpolatePoints'
ERROR_CODES = [100091, 40039, 40040, 40069, 100092, 100093, 100104, 100024]

errorMsgs = {100091: "The geometry type of {} must be points",
             100008: "The geometry type for the boundingPolygonLayer must be polygons",
             100093: "The classification type Manual requires classbreaks value."}


def verifyParameters():
    '''verifies parameters for interpolatePoints tool'''
    shapeType = inputFeat.shapeType
    if ("point" not in shapeType.lower()):
        paramName = "inputLayer"
        msg = errorMsgs[100091].format(paramName)
        aolutils.AddErrorCode(100091, msg, {"paramName": paramName})
        return False
    if boundingPolygonLayer:
        shapeType = boundingPolygon.shapeType
        if ("polygon" not in shapeType.lower()):
            msg = errorMsgs[100008]
            aolutils.AddErrorCode(100008, msg)
            return False
    if predictionPointLayer:
        shapeType = predictionPoint.shapeType
        if ("point" not in shapeType.lower()):
            paramName = "predictAtPointLayer"
            msg = errorMsgs[100091].format(paramName)
            aolutils.AddErrorCode(100091, msg, {"paramName": paramName})
            return False

    if classificationType == "Manual" and not classBreaks:
        msg = errorMsgs[100093]
        aolutils.AddErrorCode(100093, msg)
        return False
    # arcpy.AddMessage("verify parameters")
    return True

# End def verifyParameters


if __name__ == '__main__':
    hostedgp = None
    startTime = time.time()
    beginTime = startTime

    try:
        hostedgp = agolgp.HostedGP(10, 9)
        outputName = hostedgp.GetOutputName(9)
        # check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)
        # input Features
        inputFeat, inputLayerCount = aolutils.getHostedLayerX(hostedgp, "input layer", 0)
        inputLayer = inputFeat.name
        inputLayerName = inputFeat.layername
        if len(inputLayerName) == 0:
            inputLayerName = "features"
        startTime = aolutils.AddTimerMessage(startTime, u"Get input Layer {}".format(inputLayer))

        if inputLayerCount <= 10:
            errorMsg = "Not enough data to compute method. At least 10 points are required."
            aolutils.AddErrorCode(40039, errorMsg)
            raise arcpy.ExecuteError

        # arcpy.env.extent = None

        # Fields
        changedFields = inputFeat.changedFieldNames

        field = arcpy.GetParameterAsText(1)
        field = aolutils.updateChangedFieldNames(field, changedFields)

        # interpolateOptions
        interpolateOption = arcpy.GetParameterAsText(2)

        # outputPredictionError (Boolean)
        outputPredictionError = arcpy.GetParameter(3)

        # output classification
        classificationType = arcpy.GetParameterAsText(4)
        numClasses = arcpy.GetParameter(5)
        classBreaks = arcpy.GetParameter(6)

        # boundingPolygon (polygon Features)
        boundingPolygon, boundingCount = aolutils.getHostedLayerX(hostedgp, "bounding polygon layer", 7)
        boundingPolygonLayer = boundingPolygon.name
        startTime = aolutils.AddTimerMessage(startTime, u"Get bounding polygon Layer")

        # predictionPointLayer (point features)
        predictionPoint, predictionPointCount = aolutils.getHostedLayerX(hostedgp, "prediction point layer", 8)
        predictionPointLayer = predictionPoint.name
        predictionPointLayerName = predictionPoint.layername
        if len(predictionPointLayerName) == 0:
            predictionPointLayerName = "features"
        startTime = aolutils.AddTimerMessage(startTime, u"Get Prediction Layer {}".format(predictionPointLayerName))

        paramsDict = {"inputLayer": {"count": inputLayerCount, "shapeType": inputFeat.shapeType},
                      "field": field,
                      "interpolateOption": interpolateOption,
                      "classificationType": classificationType,
                      "numClasses": numClasses,
                      "classBreaks": classBreaks,
                      "boundingPolygonLayer": {"count": boundingCount, "shapeType": boundingPolygon.shapeType},
                      "predictAtPointLayer": {"count": predictionPointCount, "shapeType": predictionPoint.shapeType}}
        # check credits balance
        aolutils.checkForCredits(TASK_NAME, paramsDict)

        # output parameters
        arcpy.SetParameterAsText(11, "")
        arcpy.SetParameterAsText(12, "")
        arcpy.SetParameterAsText(13, "")

        if verifyParameters():

            # Add desktop toolbox
            # aolutils.addRemoveToolboxes(True, REQD_TOOLBOXES)

            # setup resultLayer output
            lyrname = "Interpolated {}".format(inputLayerName)
            wkspc = aolutils.getOutputWkspc(inputLayerCount)
            # wkspc = arcpy.env.scratchGDB
            outFeatures = os.path.join(wkspc, "interpolatedContours")
            arcpy.AddMessage(u"interpolated Output features: {}".format(outFeatures))

            # setup predictionError output
            if outputPredictionError:
                lyrnamePredictionError = "Errors"
                predictionErrorOutput = os.path.join(wkspc, lyrnamePredictionError)
                arcpy.AddMessage(u"Prediction Error output: {}".format(predictionErrorOutput))
            else:
                predictionErrorOutput = ""

            # setup predictedPointValue output
            if len(predictionPointLayer) > 0:
                # lyrnamePredictedPoints = "Predicted {}".format(predictionPointLayerName)
                lyrnamePredictedPoints = "Points"
                wkspc = aolutils.getOutputWkspc(predictionPointCount)
                predictedPoints = os.path.join(wkspc, "PredictedPoints")
                arcpy.AddMessage(u"Predict at points output: {}".format(predictedPoints))
            else:
                predictedPoints = ""

            startTime = aolutils.AddTimerMessage(startTime, "Analyzing parameters")

            interpolateCore.interpolatePoints(startTime, inputLayer, field, outFeatures,
                                              interpolateOption, classificationType,
                                              numClasses, classBreaks, boundingPolygonLayer,
                                              predictionPointLayer, outputPredictionError,
                                              predictionErrorOutput, predictedPoints)

            startTime = aolutils.AddTimerMessage(startTime, "Interpolate tool")
            # debugUtils.debugToolMessages(result)

            # create output
            res = aolutils.HostedToolResult(outputName)

            # create drawingInfo
            drawingInfo = classifyUtils.getGAContourDrawingInfo(outFeatures)

            # add predictedPointLayer
            if predictionPointLayer:
                descOutput = arcpy.Describe(predictedPoints)
                # drawingInfoPoints = classifyUtils.convertUniqueValueToClassBreaks(drawingInfo, "Predicted")
                drawingInfoPoints = classifyUtils.getGAPointsDrawingInfo(predictedPoints, drawingInfo)
                # arcpy.AddMessage(str(drawingInfoPoints["renderer"]))
                outDesc = aolutils.getOutDescription(lyrnamePredictedPoints, 2, drawingInfoPoints)
                res.addHostedOutput(descOutput, outDesc, 13)
                arcpy.AddMessage("Added predictedPointValues")

            # add ebk interpolated contours
            units = aolutils.getUnits(hostedgp)
            arcpy.AddMessage("units from user profile: {}".format(units))
            aolutils.createShapeAreaField(outFeatures, units)
            descOutput = arcpy.Describe(outFeatures)
            # arcpy.AddMessage(str(drawingInfo["renderer"]))
            outDesc = aolutils.getOutDescription(lyrname, 0, drawingInfo)
            res.addHostedOutput(descOutput, outDesc, 11)
            arcpy.AddMessage("Added resultLayer")

            # add error prediction
            if predictionErrorOutput:
                descOutput = arcpy.Describe(predictionErrorOutput)
                # drawingInfoError = copy.deepcopy(drawingInfo)
                # drawingInfoError = classifyUtils.updateColors(drawingInfoError, "whiteToRed")
                # arcpy.AddMessage(str(drawingInfo["renderer"]))
                errorDrawingInfo = classifyUtils.getGAContourDrawingInfo(predictionErrorOutput, True)
                # errorDrawingInfo["transparency"] = 40
                outDesc = aolutils.getOutDescription(lyrnamePredictionError, 1, errorDrawingInfo)
                res.addHostedOutput(descOutput, outDesc, 12)
                arcpy.AddMessage("Added predictionError")

            arcpy.AddMessage("predictionPointLayer : {}".format(predictionPointLayer))

            startTime = res.generateHostedResult(hostedgp, startTime)
            startTime = aolutils.AddTimerMessage(startTime, "ProcessFeatureOutput")

            # logging and Metering
            shapeCode = aolutils.GetShapeTypeCode(inputFeat.shapeType)
            classificationCode = classifyUtils.getClassificationCode(classificationType)

            return_type = 1
            values = [
                shapeCode,
                inputLayerCount,
                classificationCode,
                numClasses,
                return_type
            ]
            costFactor = 0.001
            cost = inputLayerCount * costFactor
            aolutils.LogUsageMetering(TASK_NAME, inputLayerCount, cost, beginTime, values)
            startTime = aolutils.AddTimerMessage(startTime, "Usage log")

            aolutils.reportParamsForCost(hostedgp, TASK_NAME, paramsDict)
            startTime = aolutils.AddTimerMessage(startTime, "report cost")

    except arcpy.ExecuteError as err:
        aolutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        aolutils.AddExceptionError(TASK_NAME, err)

    finally:
        if hostedgp:
            hostedgp.Cleanup()
            aolutils.AddTimerMessage(startTime, "cleanup")
