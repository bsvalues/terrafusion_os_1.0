"""---------------------------------------------------------------------------
Name:              DissolveBoundaries.py
Purpose:           Dissolve boundaries
Author:            Esri Inc.
Created:           5/8/2013
Copyright:   (c)   Esri, Inc. 2013
ArcGIS Version:    10.2
---------------------------------------------------------------------------"""

# core libraries
import time
import os

# internal libraries
import arcpy
import debugUtils
import hostedgp as agolgp
import aolutils
import rendererUtils


TASK_NAME = u'DissolveBoundaries'
ERROR_CODES = [100024, 728]


# constants
REQD_TOOLBOXES = "Workflows.tbx"


if __name__ == '__main__':

    hostedgp = None
    # Initiate start time
    startTime = time.time()
    beginTime = startTime

    try:
        hostedgp = agolgp.HostedGP(5, 4)
        outputName = hostedgp.GetOutputName(4)
        # check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        costFactor = 0.001
        return_type = 1

        # Input parameters
        Input, InputLayer, InputLayerName, InputShapeType, InputLayerCount, InputChangedFields = \
                                                        aolutils.getHostedLayer(hostedgp, "input layer", 0)
#        Input, InputLayerCount = aolutils.getHostedLayer(hostedgp, "input layer", 0)
#        Input = Inputs[0]
#        InputLayer = Input.name
#        InputLayerName = Input.layername
#        InputLayerCount = Inputs[4]
#        changedFields =  eval(Input.changedFieldNames)
        startTime = aolutils.AddTimerMessage(startTime, "Get Input Layer")
        arcpy.env.extent = None

        DissolveFields = arcpy.GetParameterAsText(1)
        DissolveFields = aolutils.updateChangedFieldNames(DissolveFields, InputChangedFields, True, False)

        SummaryFields = arcpy.GetParameterAsText(2)

        SummaryFields = aolutils.updateChangedFieldNames(SummaryFields, InputChangedFields, True, True)

        paramsDict = {"inputLayer": {"count": Input.count, "shapeType": Input.shapeType},
                      "dissolveFields": DissolveFields,
                      "summaryFields": SummaryFields}
        # check credits balance
        aolutils.checkForCredits(TASK_NAME, paramsDict)

        # Output parameter (will be set later when the tool is successful)
        arcpy.SetParameterAsText(6, "")

        cost = InputLayerCount * costFactor

        if len(InputLayerName) == 0:
            InputLayerName = "Input Features"

        # Add toolboxes
        aolutils.addRemoveToolboxes(True, REQD_TOOLBOXES)

        # Get cloud output paths
        wkspc = aolutils.getOutputWkspc(InputLayerCount)
        DissolvedOutput = os.path.join(wkspc, "DissolvedOutput")

        arcpy.AddMessage(u"Output features: {}".format(DissolvedOutput))

        # Execute tool
        startTime = time.time()
        partFeatures = arcpy.GetParameter(3)
        arcpy.gp.DissolveBoundaries_workflows(InputLayer, DissolveFields, SummaryFields, partFeatures, DissolvedOutput)
        # debugUtils.debugToolMessages(result)

        startTime = aolutils.AddTimerMessage(startTime, "Run dissolve tool")


        # Get cloud output paths
        lyrname = "DissolvedFeatures"
        drawingInfo = rendererUtils.getSimpleRendererInfo(InputShapeType)
        res = aolutils.HostedToolResult(outputName)
        outDesc = aolutils.getOutDescription(lyrname, 0, drawingInfo)
        # create analysisarea field
        units = aolutils.getUnits(hostedgp)
        aolutils.createShapeAreaField(DissolvedOutput, units)
        descOutput = arcpy.Describe(DissolvedOutput)
        res.addHostedOutput(descOutput, outDesc, 6)
        startTime = res.generateHostedResult(hostedgp, startTime)

        values = [
            InputLayerCount,
            len(DissolveFields.split(';')),
            len(SummaryFields.split(';')),
            return_type
        ]

        aolutils.LogUsageMetering(TASK_NAME, InputLayerCount, cost, beginTime, values)

        aolutils.reportParamsForCost(hostedgp, TASK_NAME, paramsDict)
        aolutils.addRemoveToolboxes(False, REQD_TOOLBOXES)

    except arcpy.ExecuteError as err:
        aolutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        aolutils.AddExceptionError(TASK_NAME, err)

    finally:
        if hostedgp:
            hostedgp.Cleanup()

# End DissolveBoundaries.py
