"""-----------------------------------------------------------------------------
Name:              AnalyzeRasterAnalysisDataLocation.py
Purpose:           This is the system Geoprocessing service to analyze the input
                   imagery and feature data input used in the Raster Analytic job.
Author:            Esri Inc.
Created:           7/6/2022
Copyright:   (c)   Esri, Inc. 2020
ArcGIS Version:    11.1
-----------------------------------------------------------------------------"""
# core libraries
import json
import sys

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'AnalyzeRasterAnalysisDataLocation'


if __name__ == '__main__':
    # Parsing Input Parameters
    taskjson = arcpy.GetParameterAsText(0)

    try:
        # 1. Read and validate input task JSON
        taskjsondict = list(rasterutils.getJSON(taskjson))

        if not taskjsondict:
            arcpy.AddError("Input is not a valid JSON.")
            arcpy.SetParameterAsText(1, "")
            sys.exit(0)
        elif "name" not in taskjsondict[0].keys() and "parameters" not in taskjsondict[0].keys():
            arcpy.AddError(
                "Input is not a valid Raster Analysis task JSON. JSON must contain analysis tool name and parameters.")
            arcpy.SetParameterAsText(1, "")
            sys.exit(0)

        # 2. Run analyze raster analysis data location tool
        result = arcpy.gp.AnalyzeRasterAnalysisDataLocation_server(taskjson)

        # 3. Return all the data location paths or uris used in the task
        outdatalocation = result.getOutput(0)

        # Set output raster parameter
        arcpy.SetParameterAsText(1, outdatalocation)

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages())

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
