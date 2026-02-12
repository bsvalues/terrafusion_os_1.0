"""---------------------------------------------------------------------------
Name:              MergeLayers.py
Purpose:           Merge layers
Author:            Esri Inc.
Created:           5/8/2013
Copyright:   (c)   Esri, Inc. 2013
ArcGIS Version:    10.2
---------------------------------------------------------------------------"""

# core libraries
import json
import copy
import time
import os
import debugUtils

# internal libraries
import arcpy
import hostedgp as agolgp
import aolutils
import rendererUtils


# constants
REQD_TOOLBOXES = "Workflows.tbx"

TASK_NAME = u'MergeLayers'
ERROR_CODES = [468, 100024]


def err1156_handler(gp_msg):
    """An item of arcpy's message."""
    import re
    msg = gp_msg[2].split(':')[1].strip()
    oid = re.findall("Failed on input OID (\d+),", msg)
    oid = int(oid[0])
    # drop the single-quotes if there is any since the message has single-quotes already.
    field_value = re.findall("could not write value (.+?) to", msg)[0].strip("'")
    field_name = re.findall("to output field (.+?)$", msg)[0]
    msg = f"A field value was incompatible with the field type. Failed on input OID {oid}, could not write value '{field_value}' to output field {field_name}."
    aolutils.AddErrorCode(gp_msg[1], msg, params={"id": oid, "fieldValue": field_value, "fieldName": field_name})


if __name__ == '__main__':

    hostedgp = None
    # Initiate start time
    startTime = time.time()
    beginTime = startTime

    try:
        hostedgp = agolgp.HostedGP(4, 3)
        outputName = hostedgp.GetOutputName(3)
        # check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        costFactor = 0.001
        return_type = 1

        # Input parameters
        Input, InputLayer, InputLayerName, InputShapeType, InputLayerCount, InputChangedFields = aolutils.getHostedLayer(hostedgp, "input layer", 0)
        startTime = aolutils.AddTimerMessage(startTime, "Get Input Layer")

        MergeInput, MergeLayer, MergeLayerName, MeargeShapeType, MergeLayerCount, MergeChangedFields = aolutils.getHostedLayer(hostedgp, "merge layer", 1)
        startTime = aolutils.AddTimerMessage(startTime, "Get Merge Layer")

        arcpy.env.extent = None

        MergingAttributes = arcpy.GetParameterAsText(2)

        paramsDict = {"inputLayer": {"count": Input.count, "shapeType": Input.shapeType},
                      "mergeLayer": {"count": MergeInput.count, "shapeType": MergeInput.shapeType},
                      "mergingAttributes": MergingAttributes}
        # check credits balance
        aolutils.checkForCredits(TASK_NAME, paramsDict)

        # update changed field names if any
        MergingAttributes = aolutils.updateChangedFieldNames(MergingAttributes, MergeChangedFields, True, True)

        # Cloud parameters
        # Output parameter (will be set later when the tool is successful)
        arcpy.SetParameterAsText(5, "")

        numObjects = InputLayerCount + MergeLayerCount
        cost = numObjects * costFactor

        # Add toolboxes
        aolutils.addRemoveToolboxes(True, REQD_TOOLBOXES)

        # Use the scratchGDB instead of calling getOutputWkspc since in_memory data store does not support merge
        # with input layers containing attachment. (see https://devtopia.esri.com/WebGIS/arcgis-portal-app/issues/21905)
        wkspc = arcpy.env.scratchGDB
        MergedOutput = os.path.join(wkspc, "MergedOutput")

        arcpy.AddMessage(u"Output features: {}".format(MergedOutput))
        # Execute tool
        startTime = time.time()
        result = arcpy.gp.MergeLayers_workflows(InputLayer, MergeLayer, MergingAttributes, MergedOutput)

        # debugUtils.debugToolMessages(result)
        startTime = aolutils.AddTimerMessage(startTime, "Run merge tool")
        # Create feature service layer for output parameter

        lyrname = "MergedFeatures"
        drawingInfo = rendererUtils.getSimpleRendererInfo(Input.shapeType)

        res = aolutils.HostedToolResult(outputName)
        outDesc = aolutils.getOutDescription(lyrname, 0, drawingInfo)
        descOutput = arcpy.Describe(MergedOutput)
        res.addHostedOutput(descOutput, outDesc, 5)
        startTime = res.generateHostedResult(hostedgp, startTime)

        startTime = aolutils.AddTimerMessage(startTime, "Create Output Description, Renderer")

        values = [numObjects, len(MergingAttributes.split(';')), return_type]

        aolutils.LogUsageMetering(TASK_NAME, numObjects, cost, beginTime, values)

        aolutils.reportParamsForCost(hostedgp, TASK_NAME, paramsDict)
        aolutils.addRemoveToolboxes(False, REQD_TOOLBOXES)

    except arcpy.ExecuteError as err:
        aolutils.AddExecuteErrors(TASK_NAME, ERROR_CODES, {1156: err1156_handler})

    except Exception as err:
        aolutils.AddExceptionError(TASK_NAME, err)

    finally:
        if hostedgp:
            hostedgp.Cleanup()

# End MergeLayers.py
