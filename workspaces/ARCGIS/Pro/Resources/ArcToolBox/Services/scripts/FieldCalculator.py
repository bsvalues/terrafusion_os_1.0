"""---------------------------------------------------------------------------
Name:              FieldCalculator.py
Purpose:           Field calculation
Author:            Esri Inc.
Created:           5/8/2013
Copyright:   (c)   Esri, Inc. 2013
ArcGIS Version:    10.2
---------------------------------------------------------------------------"""

# core libraries
import json
import time
import os

# internal libraries
import arcpy
import hostedgp as agolgp
import aolutils
import rendererUtils


# constants
REQD_TOOLBOXES = "Workflows.tbx"
TASK_NAME = "FieldCalculator"
ERROR_CODES = [100055, 100082, 100083, 100084, 100085,
               100086, 100087, 100088]


if __name__ == '__main__':

    hostedgp = None
    startTime = time.time()
    beginTime = startTime

    try:
        hostedgp = agolgp.HostedGP(3, 2)
        # Cloud parameters
        outputName = hostedgp.GetOutputName(2)
        # check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        costFactor = 0.001
        return_type = 1

        # Input parameters
        inputLayer, inputCount = aolutils.getHostedLayerX(hostedgp, "input layer", 0)
        InputLayerName = inputLayer.layername
        if len(InputLayerName) == 0:
            InputLayerName = "Input Features"
        inputShapeType = inputLayer.shapeType
        startTime = aolutils.AddTimerMessage(startTime, "Get Input Layer")

        arcpy.env.extent = None

        expressions = arcpy.GetParameterAsText(1)

        paramsDict = {"inputLayer": {"count": inputCount, "shapeType": inputShapeType},
                      "expressions": expressions}
        # check credits balance
        aolutils.checkForCredits(TASK_NAME, paramsDict)

        # Output parameter (will be set later when the tool is successful)
        arcpy.SetParameterAsText(4, "")

        cost = inputCount * costFactor

        # Add toolboxes
        aolutils.addRemoveToolboxes(True, REQD_TOOLBOXES)

        # Get cloud output paths
        wkspc = aolutils.getOutputWkspc(inputCount)
        lyrname = "CalculateFeatures"
        CalculateOutput = os.path.join(wkspc, lyrname)

        arcpy.AddMessage(u"Output features: {}".format(CalculateOutput))

        # Execute tool
        startTime = time.time()
        result = arcpy.gp.FieldCalculator_workflows(inputLayer.name,
                                                    expressions,
                                                    CalculateOutput)

        startTime = aolutils.AddTimerMessage(startTime, "Run calculate tool")

        # Describe output
        descCalculateOutput = arcpy.Describe(CalculateOutput)

        # Create drawing Info
        drawingInfo = rendererUtils.getSimpleRendererInfo(descCalculateOutput.shapeType,
                                                          TASK_NAME)

        # Create result
        res = aolutils.HostedToolResult(outputName)
        outDesc = aolutils.getOutDescription(lyrname, 0, drawingInfo)
        res.addHostedOutput(descCalculateOutput, outDesc, 4)
        startTime = res.generateHostedResult(hostedgp, startTime)
        if outputName.createService:
            return_type = 2

        inputShapeCode = aolutils.GetShapeTypeCode(inputShapeType)

        # Report tool usage
        values = [inputShapeCode, inputCount, return_type]
        aolutils.LogUsageMetering(TASK_NAME, inputCount, cost, beginTime, values)

        # Report cost
        aolutils.reportParamsForCost(hostedgp, TASK_NAME, paramsDict)
        aolutils.addRemoveToolboxes(False, REQD_TOOLBOXES)

    except arcpy.ExecuteError as err:
        aolutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        aolutils.AddExceptionError(TASK_NAME, err)

    finally:
        if hostedgp:
            hostedgp.Cleanup()
            startTime = aolutils.AddTimerMessage(startTime, "Cleanup")

# End FieldCalculator.py
