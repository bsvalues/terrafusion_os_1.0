'''---------------------------------------------------------------------------
Name:              overlaylayers.py
Purpose:           Performs an Intersect, Union or Erase overlay operation.
Author:            Esri, Inc.
Created:           02/14/2013
Copyright:   (c)   Esri, Inc. 2013
ArcGIS Version:    10.1
Python Version:    2.7.2 (default, Jun 12 2011, 15:08:59)
---------------------------------------------------------------------------'''
import os
import time
import arcpy
import hostedgp as agolgp
import aolutils
import rendererUtils
import debugUtils


TASK_NAME = "OverlayLayers"
ERROR_CODES = [366, 385, 426, 438, 100024]


if __name__ == '__main__':
    
    hostedgp = None
    startTime = time.time()
    beginTime = startTime
    
    try:
        hostedgp = agolgp.HostedGP(7, 6)
        outputName = hostedgp.GetOutputName(6)

        # check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        costFactor = 0.001
        returnTypeCost = 1

        inputLayer, inputCount = aolutils.getHostedLayerX(hostedgp, "input layer", 0)
        startTime = aolutils.AddTimerMessage(startTime, "Get Input Layer")

        overlayLayer, overlayCount = aolutils.getHostedLayerX(hostedgp, "overlay layer", 1)
        startTime = aolutils.AddTimerMessage(startTime, "Get Overlay Layer")

        # workaround
        arcpy.env.extent = None

        overlayType = arcpy.GetParameterAsText(2) or "INTERSECT"
        overlayType = overlayType.upper()
        snap = arcpy.GetParameter(3)
        outputType = arcpy.GetParameterAsText(4)
        snapTolerance = arcpy.GetParameterAsText(5)

        arcpy.SetParameterAsText(8, "")

        numObjects = inputCount + overlayCount
        cost = numObjects * costFactor

        inputShapeType = inputLayer.shapeType
        overlayShapeType = overlayLayer.shapeType

        paramsDict = {"inputLayer": {"count": inputCount, "shapeType": inputShapeType},
                      "overlayLayer": {"count": overlayCount, "shapeType": overlayShapeType},
                      "overlayType": overlayType}
        # check credits balance
        aolutils.checkForCredits(TASK_NAME, paramsDict)

        wkspc = aolutils.getOutputWkspc(inputCount)
        outputlayer = os.path.join(wkspc, "OverlayOutput")

        arcpy.AddMessage(u"Output features: {}".format(outputlayer))

        aolutils.addRemoveToolboxes(True, "Workflows.tbx")

        result = arcpy.gp.OverlayLayers_workflows(inputLayer.name, overlayLayer.name,
                                                  outputlayer, overlayType,
                                                  snap, outputType, snapTolerance)

        debugUtils.debugToolMessages(result)
        startTime = aolutils.AddTimerMessage(startTime, "Run overlay")
        # create shapeArea field
        descOutput = arcpy.Describe(outputlayer)
        outputShapeType = descOutput.shapeType
        arcpy.AddMessage(outputShapeType)
        if "polygon" in descOutput.shapeType.lower():
            units = aolutils.getUnits(hostedgp)
            aolutils.createShapeAreaField(outputlayer, units, descOutput)
        elif "polyline" in descOutput.shapeType.lower():
            units = aolutils.getUnits(hostedgp, shapeUnitsPolygon=False)
            aolutils.createShapeLengthField(outputlayer, units, descOutput)

        # need to do another describe to pickup AnalysisArea fields
        descOutput = arcpy.Describe(outputlayer)

        if outputShapeType == 'Multipoint':
            outputlayer_single = os.path.join(wkspc, "OverlayOutput_Single")
            arcpy.MultipartToSinglepart_management(outputlayer, outputlayer_single)
            outputlayer = outputlayer_single
            descOutput = arcpy.Describe(outputlayer)
            outputShapeType = "Point"
            startTime = aolutils.AddTimerMessage(startTime, "Convert to single point")

        lyrname = "OverlayedFeatures"

        drawingInfo = rendererUtils.getSimpleRendererInfo(outputShapeType)
        res = aolutils.HostedToolResult(outputName)

        outDesc = aolutils.getOutDescription(lyrname, 0, drawingInfo)
        res.addHostedOutput(descOutput, outDesc, 8)
        startTime = res.generateHostedResult(hostedgp, startTime)

        inputShapeCode = aolutils.GetShapeTypeCode(inputShapeType)
        overlayShapeCode = aolutils.GetShapeTypeCode(overlayShapeType)
        if overlayType == 'UNION':
            overlayTypeCost = 2
        elif overlayType == 'ERASE':
            overlayTypeCost = 3
        else:
            overlayTypeCost = 1
        if outputName.createService:
            returnTypeCost = 2

        # Report tool usage
        values = [inputShapeCode, inputCount, overlayShapeCode, overlayCount, overlayTypeCost, returnTypeCost]
        aolutils.LogUsageMetering(TASK_NAME, numObjects, cost, beginTime, values)

        # Report cost
        aolutils.reportParamsForCost(hostedgp, TASK_NAME, paramsDict)

    except arcpy.ExecuteError as err:
        aolutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        aolutils.AddExceptionError(TASK_NAME, err)

    finally:
        if hostedgp:
            hostedgp.Cleanup()
            startTime = aolutils.AddTimerMessage(startTime, "Cleanup")
