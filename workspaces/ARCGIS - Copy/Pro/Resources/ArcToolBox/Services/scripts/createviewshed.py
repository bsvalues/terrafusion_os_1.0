"""---------------------------------------------------------------------------
Name:              createviewshed.py
Purpose:           Find Viewshed
Author:            Esri Inc.
Created:           10/21/2014
Copyright:   (c)   Esri, Inc. 2014
ArcGIS Version:    10.2
---------------------------------------------------------------------------"""
from __future__ import unicode_literals
# core libraries
import time
import os

# internal libraries
import arcpy
import hostedgp as agolgp
import aolutils
import rendererUtils
import processRemoteTool
import conversionUtils
#import debugUtils
#import bufferUtils

# constants
TASK_NAME = "CreateViewshed"
ERROR_CODES = [100024, 100035, 100048, 100091, 100120, 100131, 100132, 100133, 100142, 100143]

errorMsgs = {100048: "The input layer {} contains multipoint geometry and has been converted to single point geometry.",
             100035: "The number of features in {} can not be greater than 1000.",
             100091: "The input layer must be point geometry.",
             100131: "The maximum viewing distance parameter cannot be more than {max}{units}.",
             100132: "The DEM source data is not available in the input points area.",
             100133: "The input DEM resolution is not supported at the specified maximum distance value. Specify a smaller maximum distance value.",
             100142: "The extent of the input point features exceeds the allowed maximum extent.",
             100143: "Your user role does not include the elevation analysis privilege"}


def GetAreaFromExtent(frameExtent):
    array1 = arcpy.Array([frameExtent.upperLeft,
                          frameExtent.upperRight,
                          frameExtent.lowerRight,
                          frameExtent.lowerLeft,
                          frameExtent.upperLeft])

    rectPoly = arcpy.Polygon(array1, frameExtent.spatialReference)
    rectArea = rectPoly.getArea("PRESERVE_SHAPE", "squaremeters") / 1000000.0
    return rectArea


def _getFeatureLayerSelectedExtent(FLyr):
    '''To return the extent of the selected features of a feature layer
    Current workaround since we there is no getSelectedExtent function yet.'''
    resFeatName = os.path.join('in_memory', 'selectedInputFeatures')
    arcpy.CopyFeatures_management(FLyr, resFeatName)
    extentLyr = arcpy.MakeFeatureLayer_management(resFeatName, 'extentLyr')
    return arcpy.Describe(extentLyr).extent

if __name__ == '__main__':

    hostedgp = None
    # Initiate start time
    startTime = time.time()
    beginTime = startTime
    areaThresholdJump = 40000  # km
    areaThresholdFail = 1000000

    try:
        hostedgp = agolgp.HostedGP(10, 9)  # a description of the input / output data
        outputName = hostedgp.GetOutputName(9)
        # check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        costFactor = 0.001
        return_type = 1

        # aolutils.DebugExtent()

        # Input parameters
        # First parameter
        # decode input feature service and get the path to the input features
        Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "input layer", 0)
        InputLayer = Input.name  # catalog path of input features
        InputLayerExtent = InputLayer  # catalog path of input features

        InputLayerName = Input.layername  # layer name in the feature service
        if len(InputLayerName) == 0:
            InputLayerName = "Input Features"

        # check geometry type
        if "point" not in Input.shapeType.lower():
            msg = errorMsgs[100091]
            aolutils.AddErrorCode(100091, msg, {"paramName": "input layer"})
            raise arcpy.ExecuteError

        # convert multipoint to points
        wkspcPoints = aolutils.getOutputWkspc(InputLayerCount)
        if "multipoint" in Input.shapeType.lower():
            InputLayer, msg = aolutils.convertMutiPointToSingleFeatures(InputLayer, InputLayerName,
                                                                        errorMsgs[100048], wkspcPoints)
            result = arcpy.GetCount_management(InputLayer)
            InputLayerCount = int(result.getOutput(0))
            aolutils.AddErrorCode(*msg)
        # Make a local copy and create the layer from it. This is a workaround to fix:
        # https://devtopia.esri.com/WebGIS/arcgis-portal-app/issues/23098 where under certain situations the elevation
        # or hydrology service is either not honoring extent or fail.
        else:
            tmp_input = arcpy.CreateUniqueName("inputFeatures", wkspcPoints)
            arcpy.management.CopyFeatures(InputLayer, tmp_input)
            tmp_layer = arcpy.management.MakeFeatureLayer(tmp_input, "inputLayerNew").getOutput(0)
            # overwrite InputLayer with the layer created from local copy.
            InputLayer = tmp_layer.name
            arcpy.AddMessage("InputLayer is {} with type as {}".format(InputLayer, type(InputLayer).__name__))

        # check count:
        if InputLayerCount > 1000:  # input feature count can't be more than 1000
            msg = errorMsgs[100035].format(InputLayerName)
            aolutils.AddErrorCode(100035, msg, {"nearLayer": InputLayerName})
            raise arcpy.ExecuteError

        # layer1=arcpy.MakeFeatureLayer_management(Input.name, Input.layername)
        extent1 = _getFeatureLayerSelectedExtent(InputLayer)
        area1 = GetAreaFromExtent(extent1)

        if area1 > areaThresholdFail:
            aolutils.AddErrorCode(100142, errorMsgs[100142])
            raise arcpy.ExecuteError

        startTime = aolutils.AddTimerMessage(startTime, "Get Input Layer")
        arcpy.env.extent = None

        demResolution = arcpy.GetParameterAsText(1) or "#"
        maxDistance = arcpy.GetParameter(2) or "#"
        maxDistanceUnits = arcpy.GetParameterAsText(3) or "#"
        obsHeight = arcpy.GetParameter(4) or "#"
        obsHeightUnits = arcpy.GetParameterAsText(5) or "#"
        targetHeight = arcpy.GetParameter(6) or "#"
        targetHeightUnits = arcpy.GetParameterAsText(7) or "#"
        generalization = arcpy.GetParameter(8)

        distFactor = conversionUtils.conversionUnitsToMeters[maxDistanceUnits.upper()]

        # parameter validation
        if maxDistance == "#":
            maxDistance = 9
            maxDistanceUnits = "miles"
        elif (maxDistance * distFactor) > 50000:
            msg_params = {"max": "50",
                          "units": "kilometers"}
            msg = errorMsgs[100131].format(**msg_params)
            aolutils.AddErrorCode(100131, msg, msg_params)
            raise arcpy.ExecuteError
#        if obsHeight == "#":
#            obsHeight = 1
#            obsHeightUnits = "feet"
#        if targetHeight == "#":
#            targetHeight = 0
#            targetHeightUnits = "feet"

        if area1 > areaThresholdJump:
            if demResolution.upper() == "FINEST":
                demResolution = "90m"

        # Output parameter (will be set later when the tool is successful)
        # arcpy.SetParameterAsText(10, "")
        cost = InputLayerCount * costFactor
        # Execute tool
        startTime = time.time()

        # Call remote service
        tbxFullURL = aolutils.getRemoteToolbox(hostedgp, "elevation")
        taskName = "Viewshed_Elevation"
        parameters = []
        parameters.append(InputLayer)
        parameters.append(maxDistance)
        parameters.append(maxDistanceUnits)
        parameters.append(demResolution)
        parameters.append(obsHeight)
        parameters.append(obsHeightUnits)
        parameters.append(targetHeight)
        parameters.append(targetHeightUnits)
        parameters.append(generalization)

        result, success = processRemoteTool.processRemoteTool(tbxFullURL, taskName, parameters, maxFeatures=InputLayerCount)
        if success:
            ViewshedOutput = processRemoteTool.getResults(result, InputLayerCount)
        else:
            # Fail
            # process error messages
            msgs = result[0].getMessages(2)
            if "One or more input observer points are outside of the area covered by the DEM source" in msgs:
                aolutils.AddErrorCode(100132, errorMsgs[100132])
            elif "Input maximum distance exceeds the maximum value permitted" in msgs:
                aolutils.AddErrorCode(100132, errorMsgs[100132])
            arcpy.AddMessage("The elevation service (viewshed) failed.")
            raise arcpy.ExecuteError

        if ViewshedOutput is None:
            arcpy.AddMessage("Get result failed.")
            raise arcpy.ExecuteError

        startTime = aolutils.AddTimerMessage(startTime, "Run elevation viewshed service")

        # alter metadata field names
        area_units = aolutils.getUnits(hostedgp, True)
        # rename the area and perimeter fields
        if area_units == "SquareMiles":
            arcpy.management.CalculateField(ViewshedOutput, "AreaSqKm", "!AreaSqKm! * 0.386102", "PYTHON")
            arcpy.management.CalculateField(ViewshedOutput, "PerimeterKm", "!PerimeterKm! * 0.621371", "PYTHON")
            arcpy.management.AlterField(ViewshedOutput, "AreaSqKm", "AnalysisArea", "Area Square Miles")
            arcpy.management.AlterField(ViewshedOutput, "PerimeterKm", "Perimeter", "Perimeter Miles")
        else:
            arcpy.management.AlterField(ViewshedOutput, "AreaSqKm", "AnalysisArea", "Area Square Kilometers")
            arcpy.management.AlterField(ViewshedOutput, "PerimeterKm", "Perimeter", "Perimeter Kilometers")

        # If Web Mercator in, makes sure Web Mercator out (not WGS)
        if outputName.createService:
            return_type = 2
            # spatial_ref = arcpy.Describe(InputLayer).spatialReference
            # if (spatial_ref.pcscode == 102100 or spatial_ref.pcscode == 3857) and RingType == "rings":
                # arcpy.env.outputCoordinateSystem = spatial_ref

        descViewshedOutput = arcpy.Describe(ViewshedOutput)

        # 2. Create drawing Info
        drawingInfo = rendererUtils.getSimpleRendererInfo(descViewshedOutput.shapeType, TASK_NAME, 30)
        # 3. Create result
        lyrname = "ViewshedFeatures"
        res = aolutils.HostedToolResult(outputName)
        outDesc = aolutils.getOutDescription(lyrname, 0, drawingInfo)
        res.addHostedOutput(descViewshedOutput, outDesc, 11)  # publish to feature service
        startTime = res.generateHostedResult(hostedgp, startTime)

        shapeCode = aolutils.GetShapeTypeCode(Input.shapeType)

        values = [
            shapeCode,                 # infeat type
            InputLayerCount,           # input count
            maxDistance,                # max distances
            obsHeight,
            obsHeightUnits,
            targetHeight,
            targetHeightUnits,
            generalization,
            return_type
        ]

        aolutils.LogUsageMetering(TASK_NAME, InputLayerCount, cost, beginTime, values)
        # setting to zero credits for analysis server
        costFactor = 0
        paramsDict = {
            "inputLayer": {"count": Input.count * costFactor,
                           "shapeType": Input.shapeType},
            "demResolution": demResolution,
            "maximumDistance": maxDistance,
            "observerHeight": obsHeight,
            "obsHeightUnits": obsHeightUnits,
            "targetHeight": targetHeight,
            "targetHeightUnits": targetHeightUnits,
            "generalization": generalization}

        aolutils.reportParamsForCost(hostedgp, TASK_NAME, paramsDict)

    except arcpy.ExecuteError as err:
        aolutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        import traceback
        import sys
        msgs = traceback.format_exception(*sys.exc_info())[1:]
        for msg in msgs:
            arcpy.AddMessage(msg.strip())
        aolutils.AddExceptionError(TASK_NAME, err)

    finally:
        if hostedgp:
            hostedgp.Cleanup()
            startTime = aolutils.AddTimerMessage(startTime, "Cleanup")
# end Create Viewshed
