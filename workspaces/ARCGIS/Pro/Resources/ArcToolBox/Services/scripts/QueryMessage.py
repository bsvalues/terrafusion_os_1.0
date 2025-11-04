"""-----------------------------------------------------------------------------
Name:              QueryMessage.py
Purpose:           This utility service tool is used to query the progress message
                   of Raster Analysis and Reality service tool.
Author:            Esri Inc.
Created:           02/12/2023
Copyright:   (c)   Esri, Inc. 2023
ArcGIS Version:    11.3
Note:              This is a sync service tool that will return the accumulated
                   progress message of the SURE engine.
-----------------------------------------------------------------------------"""
import os
import time

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'QueryMessage'


if __name__ == '__main__':
    # Read input parameters
    # job ID is the ReconstructSurface service tool job that is either in progress
    # or accumulated progress info of completed job
    jobid = arcpy.GetParameterAsText(0)

    # Progress message
    progress_msg = ""

    try:
        if jobid:
            # Query the progress message
            jobDir = rasterutils._getServerDirectoriesPath("arcgisjobs")
            if jobDir:
                retryCount = 3
                sleepTime = 5
                while retryCount > 0:
                    fileFound = False
                    for gpserver in ["rasteranalysistools_gpserver", "orthomappingtools_gpserver","realitymappingtools_gpserver"]:
                        GPMessagesFile = jobDir+"/system/"+gpserver+"/"+jobid+ "/GPMessagesLog.txt"
                        if os.path.exists(GPMessagesFile):
                            fileFound = True
                            break
                    if not fileFound:
                        retryCount = retryCount - 1
                        time.sleep(sleepTime)
                        continue
                    else:
                        break


            #scratchFolder = arcpy.env.scratchFolder
            #GPMessagesFile = scratchFolder[0:scratchFolder.find("arcgisjobs") + len("arcgisjobs")] +"/system/rasteranalysistools_gpserver/"+jobid+ "/scratch/GPMessagesLog.txt"

            if os.path.exists(GPMessagesFile):
                with open(GPMessagesFile, 'r') as f:
                    progress_msg = f.read()
            else:
                arcpy.AddError("Cannot find the log file.")
        else:
            arcpy.AddError("Job ID is required to query the progress message.")
        # Update output ========================================================
        arcpy.SetParameterAsText(1, progress_msg)
    except:
        arcpy.AddError("Cannot retrieve the progress message.")
