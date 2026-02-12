"""---------------------------------------------------------------------------
Name:              CreateBuffers.py
Purpose:           Buffering
Author:            Esri Inc.
Created:           2/19/2013
Copyright:   (c)   Esri, Inc. 2013
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
import bufferUtils


# constants
REQD_TOOLBOXES = "Workflows.tbx"
TASK_NAME = u'CreateBuffers'
ERROR_CODES = [26, 109, 728, 100024, 539]

if __name__ == '__main__':

    hostedgp = None
    # Initiate start time
    startTime = time.time()
    beginTime = startTime


    try:
        hostedgp = agolgp.HostedGP(9, 8)
        startTime = aolutils.AddTimerMessage(startTime, "Init hosted gp")
        outputName = hostedgp.GetOutputName(8)
        startTime = aolutils.AddTimerMessage(startTime, "Get output name")
        
        # check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)
        startTime = aolutils.AddTimerMessage(startTime, "Check privilege")

        costFactor = 0.001
        return_type = 1

        #aolutils.DebugExtent()


        # Input parameters
        Input, InputLayerCount  = aolutils.getHostedLayerX(hostedgp, "input layer", 0)
        InputLayer = Input.name
        #arcpy.AddMessage(arcpy.Describe(InputLayer).OIDFieldName)
        InputLayerName = Input.layername
        if len(InputLayerName) == 0 :
            InputLayerName = "Input Features"
        #desc = arcpy.Describe(InputLayer)
        #arcpy.AddMessage("Input Layer Path: {}".format(desc.catalogPath))

        changedFields =  Input.changedFieldNames

        startTime = aolutils.AddTimerMessage(startTime, "Get Input Layer")
        arcpy.env.extent = None

        Distances = arcpy.GetParameterAsText(1)
        distanceList = Distances.split(';')

        Field = arcpy.GetParameterAsText(2)
        Field = aolutils.updateChangedFieldNames(Field, changedFields)

        Units = arcpy.GetParameterAsText(3)
        DissolveType = arcpy.GetParameterAsText(4).lower()
        RingType = arcpy.GetParameterAsText(5).lower()
        SideType = arcpy.GetParameterAsText(6).lower()
        EndType = arcpy.GetParameterAsText(7).lower()

        paramsDict = {
            "inputLayer": {
                "count": Input.count,
                "shapeType": Input.shapeType},
            "distances": distanceList,
            "field": Field,
            "units": Units,
            "dissolveType": DissolveType,
            "ringType": RingType,
            "sideType": SideType,
            "endType": EndType}

        # check credits balance
        aolutils.checkForCredits(TASK_NAME, paramsDict)

        # Output parameter (will be set later when the tool is successful)
        arcpy.SetParameterAsText(10, "")

        cost = InputLayerCount * costFactor

        # Get cloud output paths
        #wkspc = aolutils.getOutputWkspc(InputLayerCount)
        wkspc = arcpy.env.scratchGDB
        BufferedOutput = os.path.join(wkspc,"BufferedOutput")

        arcpy.AddMessage(u"Output features: {}".format(BufferedOutput))

                # Execute tool
        startTime = time.time()

        bufferUtils.createBuffers(InputLayer, distanceList, Field, Units, DissolveType, RingType,
                                  SideType, EndType, BufferedOutput, True)

        startTime = aolutils.AddTimerMessage(startTime, "Run buffer tool")

        # If Web Mercator in, makes sure Web Mercator out (not WGS)
        if outputName.createService == True:
            return_type = 2


        #1. Describe output
        #create analysisareafield
        #units = aolutils.getUnits(hostedgp)
        if "meters" in Units.lower():
            units = "SquareKilometers"
        else:
            units = "SquareMiles"
        aolutils.createShapeAreaField(BufferedOutput,units)
        descBufferedOutput = arcpy.Describe(BufferedOutput)


        #2. Create drawing Info
        if len(distanceList) > 1:
            drawingInfo = rendererUtils.getUniqueValueRendererInfo(BufferedOutput, ["BUFF_DIST"])
            # Make this fix only for CreateBuffers. Other NA tools are rings and don't want them to be affected.
            if RingType.lower() == "disks":
                rendererUtils.update_unique_value_drawing_transparency(drawingInfo)
        else:
            drawingInfo = rendererUtils.getSimpleRendererInfo(descBufferedOutput.shapeType,
                                                    TASK_NAME)
        #3. Create result
        lyrname = "BufferedFeatures"
        res = aolutils.HostedToolResult(outputName)
        outDesc = aolutils.getOutDescription(lyrname, 0, drawingInfo)
        res.addHostedOutput(descBufferedOutput, outDesc, 10)
        startTime = res.generateHostedResult(hostedgp, startTime)

        shapeCode = aolutils.GetShapeTypeCode(Input.shapeType)
        if DissolveType == 'Dissolve':
            dissolveTypeCost = 2
        elif DissolveType == 'Split':
            dissolveTypeCost = 3
        else:
            dissolveTypeCost = 1

        values = [
            shapeCode,                 # infeat type
            InputLayerCount,           # input count
            len(distanceList),         # number of distances
            dissolveTypeCost,          # dissolve type
            return_type
        ]

        aolutils.LogUsageMetering(TASK_NAME, InputLayerCount, cost, beginTime, values)

        aolutils.reportParamsForCost(hostedgp, TASK_NAME, paramsDict)

    except arcpy.ExecuteError as err:
        aolutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        aolutils.AddExceptionError(TASK_NAME, err)

    finally:
        if hostedgp:
            hostedgp.Cleanup()
            startTime = aolutils.AddTimerMessage(startTime, "Cleanup")
# End CreateBuffers.py
