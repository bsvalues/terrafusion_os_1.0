"""---------------------------------------------------------------------------
Name:              TraceDownstream.py
Purpose:           Trace Downstream
Author:            Esri Inc.
Created:           11/05/2014
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
import splitlinesegments
import popup
import locale
# import debugUtils

# constants
TASK_NAME = "TraceDownstream"
ERROR_CODES = [100008, 100035, 100048, 100091, 100122, 100126, 100127, 100128, 100134, 100143]

errorMsgs = {100008: "The geometry type for the boundingPolygonLayer must be polygon.",
             100035: "The number of features in {} can not be greater than 1000.",
             100048: "The input layer {} contains multipoint geometry and has been converted to single point geometry.",
             100091: "The input layer must be point geometry.",
             100122: "TraceDownstream Failed",
             100126: "Input points is empty",
             100127: "All input points fall outside of the data coverage area",
             100128: "The point field provided must be string or integer.",
             100134: "Trace Downstream hydrology service failed.",
             100143: "Your user role does not include the elevation analysis privilege"}


if __name__ == '__main__':

    hostedgp = None
    # Initiate start time
    startTime = time.time()
    beginTime = startTime

    try:
        hostedgp = agolgp.HostedGP(9, 8)  # a description of the input / output data
        outputName = hostedgp.GetOutputName(8)

        # check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        costFactor = 0.001
        return_type = 1

        # Get the input parameters
        Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "input layer", 0)

        splitDistance = arcpy.GetParameterAsText(1) or "#"
        splitUnits = arcpy.GetParameterAsText(2) or "#"
        maxDistance = arcpy.GetParameterAsText(3) or "#"
        maxDistanceUnits = arcpy.GetParameterAsText(4) or "#"
        startTime = aolutils.AddTimerMessage(startTime, "Get Input Layer")

        # boundingPolygon (polygon Features)
        boundingPolygon, boundingCount = aolutils.getHostedLayerX(hostedgp, "bounding polygon layer", 5)
        boundingPolygonLayer = boundingPolygon.name
        startTime = aolutils.AddTimerMessage(startTime, u"Get bounding polygon Layer")

        arcpy.env.extent = None

        sourceDatabase = arcpy.GetParameterAsText(6) or "FINEST"
        generalize = arcpy.GetParameterAsText(7) or "True"

        context = arcpy.GetParameterAsText(9)

        # Input parameters
        # First parameter
        # decode input feature service and get the path to the input features

        InputLayer = Input.name  # catalog path of input features
        InputLayerName = Input.layername  # layer name in the feature service

        if len(InputLayerName) == 0:
            InputLayerName = "Input Features"

        # check geometry type
        if not ("point" in Input.shapeType.lower()):
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
        inputLayerIDField = inputLayerDesc.oidFieldName
        inputSpRef = inputLayerDesc.spatialReference

        # check count:
        if InputLayerCount > 1000:  # input feature count can't be more than 1000
            msg = errorMsgs[100035].format(InputLayerName)
            aolutils.AddErrorCode(100035, msg, {"nearLayer": InputLayerName})
            raise arcpy.ExecuteError

        if boundingPolygonLayer:
            shapeType = boundingPolygon.shapeType
            arcpy.AddMessage("Shape type: {}".format(shapeType))
            if "polygon" not in shapeType.lower():
                msg = errorMsgs[100008]
                aolutils.AddErrorCode(100008, msg)
                raise Exception

        # Output parameter (will be set later when the tool is successful)
        cost = InputLayerCount * costFactor

        # Execute tool
        startTime = time.time()

        # Call remote service
        tbxFullURL = aolutils.getRemoteToolbox(hostedgp, "hydrology")
        taskName = "TraceDownstream_Hydrology"
        parameters = []
        parameters.append(InputLayer)
        parameters.append("#")  # PointIDField
        parameters.append(sourceDatabase)
        parameters.append(generalize)

        maxFeatures = processRemoteTool.getMaxSplit(InputLayerCount, 2)
        result, success = processRemoteTool.processRemoteTool(tbxFullURL, taskName, parameters,
                                                              maxFeatures=maxFeatures)
        if success:
            TraceDownstreamOutput = processRemoteTool.getResults(result, maxFeatures)
        else:
            # Fail
            # process error messages
            msgs = result[0].getMessages(2)

            if "Input points is empty".lower() in msgs.lower():
                aolutils.AddErrorCode(100126, errorMsgs[100126])
            if "All points fall outside the processing unit extent".lower() in msgs.lower():
                aolutils.AddErrorCode(100127, errorMsgs[100127])
            if "The point falls outside the processing unit extent".lower() in msgs.lower():
                aolutils.AddErrorCode(100128, errorMsgs[100128], warning=True)
            raise arcpy.ExecuteError

        startTime = aolutils.AddTimerMessage(startTime, "Run create Trace Downstream service")

        if TraceDownstreamOutput is None:
            arcpy.AddMessage("Get result failed.")
            raise arcpy.ExecuteError

        # Set defaut units incase they are needed them

##############
        scratchworkspace = "in_memory"
        arcpy.env.outputCoordinateSystem = inputSpRef

        # Boundry -- > Clip
        if boundingCount > 0:
            TraceDownstreamOutputClip = os.path.join(scratchworkspace, "TraceDownstreamOutputClip")
            arcpy.analysis.Clip(TraceDownstreamOutput, boundingPolygonLayer, TraceDownstreamOutputClip)
            startTime = aolutils.AddTimerMessage(startTime, "Clipped to bounding polygon")
        else:
            TraceDownstreamOutputClip = TraceDownstreamOutput


# 3 cases

#1. Split distance is empty but Max Distance is specified

        area_units = aolutils.getUnits(hostedgp, True)
        # rename the area field

        if "miles" in area_units.lower():
            userProfileUnits = "Miles"
            lengthAlias = "Length Miles"
        else:
            userProfileUnits = "Kilometers"
            lengthAlias = "Length Kilometers"

        if splitDistance in [" ", '#', None]:
            splitDistance = 0
        else:
            splitDistance = locale.atof(str(splitDistance))

        if maxDistance in [" ", '#', None]:
            maxDistance = 0
        else:
            maxDistance = locale.atof(str(maxDistance))

        arcpy.AddMessage("Max Distance: {} {}".format(maxDistance, maxDistanceUnits))
        arcpy.AddMessage("split Distance: {} {}".format(splitDistance, splitUnits))
        scratchworkspace = "in_memory"
        outfeatures = os.path.join(scratchworkspace, "outFinal")
        lableFlag = 0
        if splitDistance > 0:
            lableFlag = 0
            infeatures = TraceDownstreamOutputClip
            splitlinesegments.splitLines(infeatures, splitDistance, splitUnits, outfeatures, maxDistance, maxDistanceUnits, False)

            startTime = aolutils.AddTimerMessage(startTime, "Run split line tool")
        else:
            lableFlag = 1
            if maxDistance > 0:
                infeatures = TraceDownstreamOutputClip
                splitDistance = maxDistance + 1
                splitlinesegments.splitLines(infeatures, splitDistance, maxDistanceUnits, outfeatures, maxDistance, maxDistanceUnits, True)

                startTime = aolutils.AddTimerMessage(startTime, "Run max distance")
            else:
                outfeatures = TraceDownstreamOutputClip
                # Add Analysis_Area field
                tdout_desc = arcpy.Describe(TraceDownstreamOutput)
                arcpy.management.AlterField(TraceDownstreamOutput, "LengthKm", "AnalysisLength", lengthAlias)
                arcpy.management.CalculateField(TraceDownstreamOutput, "AnalysisLength",
                                                "!{}.geodesiclength@{}!".format(tdout_desc.shapeFieldName, userProfileUnits),
                                                "PYTHON")


        # Join input field
        inField = "PourPtID"
        arcpy.management.JoinField(outfeatures, inField, InputLayer, inputLayerIDField)

        if outputName.createService:
            return_type = 2

        descTraceDownstreamOutput = arcpy.Describe(outfeatures)

        # 2. Create drawing Info
        shapeType = descTraceDownstreamOutput.shapeType
        toDistanceFieldName = aolutils.getFieldName(descTraceDownstreamOutput.fields, "ToDistance")
        if lableFlag == 0:
            drawingInfoTDs = rendererUtils.getGraduatedColorsInfo(outfeatures, toDistanceFieldName,
                                                                  shapeType=shapeType, taskName=TASK_NAME)
            labelExpr = "[{}]".format(toDistanceFieldName)
            drawingInfoTDs["labelingInfo"] = [rendererUtils.getLabelingInfo(labelExpr, shapeType)]
        else:
            drawingInfoTDs = rendererUtils.getSimpleRendererInfo(shapeType, TASK_NAME)

        # 3. Create result
        # arcpy.env.outputCoordinateSystem = inputSpRef

        lyrname1 = "TraceFeatures"
        res = aolutils.HostedToolResult(outputName)
        popupTitle = "Trace downstream of {}".format(InputLayerName)
        popupInfo = popup.feature_layer_popup(descTraceDownstreamOutput, popupTitle)
        outDescTDs = aolutils.getOutDescription(lyrname1, 0, drawingInfoTDs, popupInfo)
        res.addHostedOutput(descTraceDownstreamOutput, outDescTDs, 10)  # publish to feature service

        startTime = res.generateHostedResult(hostedgp, startTime)

        shapeCode = aolutils.GetShapeTypeCode(Input.shapeType)

        values = [
            shapeCode,                 # infeat type
            InputLayerCount,           # input count
            splitDistance,
            splitUnits,
            maxDistance,
            maxDistanceUnits,
            boundingPolygonLayer,
            sourceDatabase,
            generalize,
            return_type
        ]

        aolutils.LogUsageMetering(TASK_NAME, InputLayerCount, cost, beginTime, values)
        # setting to zero credits for analysis server
        costFactor = 0
        paramsDict = {
            "inputLayer": {               
                "count": Input.count * costFactor,
                "shapeType": Input.shapeType},
            "splitDistance": splitDistance,
            "splitUnits": splitUnits,
            "maxDistance": maxDistance,
            "maxDistanceUnits": maxDistanceUnits,
            "boundingPolygonLayer": {"count": boundingCount * costFactor,
                                     "shapeType": boundingPolygon.shapeType},
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
# End TraceDownstream.py
