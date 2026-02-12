"""---------------------------------------------------------------------------
Name:              CreateWatersheds.py
Purpose:           Create Watersheds
Author:            Esri Inc.
Created:           11/03/2014
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

# import debugUtils

# constants
TASK_NAME = "CreateWatersheds"
ERROR_CODES = [100035, 100048, 100091, 100123, 100126, 100127, 100129, 100130, 100143]

errorMsgs = {100035: "The number of features in {} can not be greater than 1000.",
             100048: "The input layer {} contains multipoint geometry and has been converted to single point geometry.",
             100091: "The input layer must be point geometry.",
             100123: "CreateWatershed Service Failed",
             100126: "Input points is empty",
             100127: "All points fall outside the processing unit extent",
             100129: "The point falls outside the catchment extent.",
             100130: "The point falls outside the processing unit extent.",
             100143: "Your user role does not include the elevation analysis privilege"}

if __name__ == '__main__':

    hostedgp = None
    # Initiate start time
    startTime = time.time()
    beginTime = startTime

    try:
        hostedgp = agolgp.HostedGP(6, 5)  # a description of the input / output data
        outputName = hostedgp.GetOutputName(5)

        # check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        costFactor = 0.001
        return_type = 1

        # Get the input parameters
        Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "input layer", 0)

        startTime = aolutils.AddTimerMessage(startTime, "Get Input Layer")
        arcpy.env.extent = None

        searchDistance = arcpy.GetParameterAsText(1) or "#"
        searchUnits = arcpy.GetParameterAsText(2) or "#"
        sourceDatabase = arcpy.GetParameterAsText(3) or "FINEST"
        generalize = arcpy.GetParameterAsText(4) or "True"

        context = arcpy.GetParameterAsText(6)

        # Input parameters
        # First parameter
        # decode input feature service and get the path to the input features

        InputLayer = Input.name  # catalog path of input features
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

        inputLayerDesc = arcpy.Describe(InputLayer)
        inputSpRef = inputLayerDesc.spatialReference
        inputLayerIDField = inputLayerDesc.oidFieldName
        arcpy.AddMessage("catalogPath: {}".format(inputLayerDesc.catalogPath))

        # check count:
        if InputLayerCount > 1000:  # input feature count can't be more than 1000
            msg = errorMsgs[100035].format(InputLayerName)
            aolutils.AddErrorCode(100035, msg, {"nearLayer": InputLayerName})
            raise arcpy.ExecuteError

        # Output parameter (will be set later when the tool is successful)
        cost = InputLayerCount * costFactor

        # Execute tool
        startTime = time.time()

        # Call remote service
        tbxFullURL = aolutils.getRemoteToolbox(hostedgp, "hydrology")
        taskName = "Watershed_Hydrology"
        parameters = []

        parameters.append(InputLayer)
        parameters.append("#")  # PointIDField
        parameters.append(searchDistance)
        parameters.append(searchUnits)
        parameters.append(sourceDatabase)
        parameters.append(generalize)
        parameters.append(True)  # Return snapped points

        maxFeatures = processRemoteTool.getMaxSplit(InputLayerCount, 2)
        result, success = processRemoteTool.processRemoteTool(tbxFullURL, taskName, parameters,
                                                              maxFeatures=maxFeatures)

        if success:
            WatershedOutput = processRemoteTool.getResults(result, maxFeatures=maxFeatures)
            SnapPointsOutput = processRemoteTool.getResults(result, outputPosition=1, maxFeatures=maxFeatures)

        else:
            # Fail
            # process error messages
            msgs = result[0].getMessages(2)

            if "Input points is empty".lower() in msgs.lower():
                aolutils.AddErrorCode(100126, errorMsgs[100126])
            if "All points fall outside the processing unit extent".lower() in msgs.lower():
                aolutils.AddErrorCode(100127, errorMsgs[100127])
            if "The point falls outside the catchment extent".lower() in msgs.lower():
                aolutils.AddErrorCode(100129, errorMsgs[100129], warning=True)
            if "The point falls outside the processing unit extent".lower() in msgs.lower():
                aolutils.AddErrorCode(100130, errorMsgs[100130], warning=True)
            else:
                # aolutils.AddErrorCode(100123, errorMsgs[100123])
                arcpy.AddMessage("Create Watershed hydrology service failed.")
            raise arcpy.ExecuteError

        if WatershedOutput is None:
            arcpy.AddMessage("Get result failed.")
            raise arcpy.ExecuteError

        startTime = aolutils.AddTimerMessage(startTime, "Run create watershed service")

        # Add Analysis_Area field
        # alter metadata field names
        area_units = aolutils.getUnits(hostedgp, True)

        # rename the area field
        if "miles" in area_units.lower():
            arcpy.management.CalculateField(WatershedOutput, "AreaSqKm", "!AreaSqKm! * 0.386102", "PYTHON")
            arcpy.management.AlterField(WatershedOutput, "AreaSqKm", "AnalysisArea", "Area Square Miles")
        else:
            arcpy.management.AlterField(WatershedOutput, "AreaSqKm", "AnalysisArea", "Area Square Kilometers")

        # Join input fields watersheds
        inField = "PourPtID"
        arcpy.management.JoinField(WatershedOutput, inField, InputLayer, inputLayerIDField)
        arcpy.management.JoinField(SnapPointsOutput, inField, InputLayer, inputLayerIDField)

        # If Web Mercator in, makes sure Web Mercator out (not WGS)
        if outputName.createService:
            return_type = 2

        descWatershedOutput = arcpy.Describe(WatershedOutput)
        descSnapPointsOutput = arcpy.Describe(SnapPointsOutput)

        # 2. Create drawing Info
        drawingInfoWS = rendererUtils.getUniqueValueRendererInfo(WatershedOutput, ["PourPtID"], transparency=30)
        drawingInfoPts = rendererUtils.getSimpleRendererInfo(descSnapPointsOutput.shapeType, TASK_NAME)
        arcpy.AddMessage(drawingInfoPts)

        # 3. Create result
        arcpy.env.outputCoordinateSystem = inputSpRef

        lyrname1 = "WatershedFeatures"
        lyrname2 = "Adjusted Points"
        res = aolutils.HostedToolResult(outputName)
        outDescWS = aolutils.getOutDescription(lyrname1, 0, drawingInfoWS)
        outDescPts = aolutils.getOutDescription(lyrname2, 1, drawingInfoPts)
        res.addHostedOutput(descSnapPointsOutput, outDescPts, 7)
        res.addHostedOutput(descWatershedOutput, outDescWS, 8)  # publish to feature service

        startTime = res.generateHostedResult(hostedgp, startTime)

        shapeCode = aolutils.GetShapeTypeCode(Input.shapeType)

        values = [
            shapeCode,                 # infeat type
            InputLayerCount,           # input count
            searchDistance,
            searchUnits,
            sourceDatabase,
            generalize,
            return_type
        ]

        aolutils.LogUsageMetering(TASK_NAME, InputLayerCount, cost, beginTime, values)
        # setting to zero credits for analysis server
        costFactor = 0
        paramsDict = {"inputLayer": {"count": Input.count * costFactor, "shapeType": Input.shapeType},
                      "searchDistance": searchDistance,
                      "searchUnits": searchUnits,
                      "sourceDatabase": sourceDatabase,
                      "generalize": generalize}

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

# End CreateWatershed.py
