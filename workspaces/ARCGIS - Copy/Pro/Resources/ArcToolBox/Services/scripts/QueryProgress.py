"""-----------------------------------------------------------------------------
Name:              QueryProgress.py
Purpose:           This utility service tool is used to query the progress message
                   of ReconstructSurface service tool.
Author:            Esri Inc.
Created:           02/12/2023
Copyright:   (c)   Esri, Inc. 2023
ArcGIS Version:    11.3
Note:              This is a sync service tool that will return the accumulated
                   progress message of the SURE engine.
-----------------------------------------------------------------------------"""
# internal libraries
import arcpy

TASK_NAME = 'QueryProgress'


if __name__ == '__main__':
    # Read input parameters
    # job ID is the ReconstructSurface service tool job that is either in progress
    # or accumulated progress info of completed job
    jobid = arcpy.GetParameterAsText(0)

    # Progress message
    progress_info = ""

    try:
        if jobid:
            progress_info = arcpy.gp.command("QueryReconProgress " + jobid)
        else:
            arcpy.AddError("Job ID is required to query the reconstruct progress message.")
        # Update output ========================================================
        arcpy.SetParameterAsText(1, progress_info)
    except:
        arcpy.AddError("Cannot retrieve the reconstruct progress message.")
