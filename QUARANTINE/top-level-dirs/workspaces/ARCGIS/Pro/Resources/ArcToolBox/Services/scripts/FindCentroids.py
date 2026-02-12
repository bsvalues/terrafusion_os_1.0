"""
Name:           FindCentroids.py
Purpose:        Generate centroids
Author:         Esri Inc.
Created:        10/27/2017
Copyright:      Esri, Inc. 2017
ArcGIS Version: 10.6

Based off of the core GP Tool "Features to Point".

Input: layers of geometry type:
    * Polygon
    * Line
    * MultiPoint (Point-type layers not supported)
"""

import os
from time import time

import aolutils
import arcpy
import debugUtils
import hostedgp
import rendererUtils

import sys, traceback

arcpy.env.overwriteOutput = True
arcpy.env.extent = None

ERROR_CODES = [100254]
TASK_NAME = u'FindCentroids'


if __name__ == '__main__':
    hgp = None
    start_time = time()

    try:
        # Create context and outputName params
        hgp = hostedgp.HostedGP(3, 2)  # indices of the "context" and "outputName" params.

        # Get input parameters
        input_layer, input_count = aolutils.getHostedLayerX(hgp, "input layer", 0)
        point_location = arcpy.GetParameterAsText(1)
        output_name = hgp.GetOutputName(2)
        paramsDict = {"inputLayer": {"count": input_count,
                                     "shapeType": input_layer.shapeType}}
        # check credits balance
        aolutils.checkForCredits(TASK_NAME, paramsDict)
        aolutils.checkPublishingPrivilege(hgp, output_name)

        # Set output workspace and run Feature to Point GP tool
        workspace = aolutils.getOutputWkspc(input_count)
        result_layer = os.path.join(workspace, "resultLayer")
        result = arcpy.FeatureToPoint_management(input_layer.name, result_layer, point_location)
        # debugUtils.debugToolMessages(result)
        aolutils.AddTimerMessage(time(), "Run Find Centroids")

        # Create output-service
        desc_output = arcpy.Describe(result_layer)
        arcpy.AddMessage(desc_output.shapeType)
        drawing_info = rendererUtils.getSimpleRendererInfo(desc_output.shapeType)
        out_desc = aolutils.getOutDescription("CentroidOutput", 0, drawing_info)

        # Publish output to server
        result_service = aolutils.HostedToolResult(output_name)
        result_service.addHostedOutput(desc_output, out_desc, 4)
        result_service.generateHostedResult(hgp, time())
        aolutils.AddTimerMessage(time(), "Generate output")

        # Logging info and credit usage
        values = [
            input_layer.shapeType,
            input_count,
            2 if output_name.createService else 1
        ]
        aolutils.LogUsageMetering(TASK_NAME, input_count, input_count * 0.001, start_time, values)

        aolutils.reportParamsForCost(hgp, TASK_NAME, paramsDict)

    except arcpy.ExecuteError as err:
        aolutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        aolutils.AddExceptionError(TASK_NAME, err)

    finally:
        if hgp:
            hgp.Cleanup()
            aolutils.AddTimerMessage(time(), "Cleanup")
