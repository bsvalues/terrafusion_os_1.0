"""-----------------------------------------------------------------------------
Name:              ComputeControlPoints.py
Purpose:           Compute control points for image collection based on
                   reference image layer
Author:            Esri Inc.
Created:           1/7/2015
Copyright:   (c)   Esri, Inc. 2015
ArcGIS Version:    10.5
-----------------------------------------------------------------------------"""
# core libraries
from datetime import datetime
import os

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'ComputeControlPoints'


class LicenseError(Exception):
    pass


if __name__ == '__main__':

    inic = arcpy.GetParameterAsText(0)
    reflyr = arcpy.GetParameterAsText(1)
    accuracy = arcpy.GetParameterAsText(2)
    context = arcpy.GetParameterAsText(3)

    try:
        loggingEnabled = rasterutils.GPMessagesLogger(context)
    except:
        arcpy.AddMessage("Logging is not enabled")
        pass

    try:
        # 0. Check Image Server extension license
        # if arcpy.CheckExtension("Image") != "Available":
        #     raise LicenseError

        inic = rasterutils.getInDataPath(inic)
        reflyr = rasterutils.getInDataPath(reflyr)

        # 1. Parse input parameter: image location accuracy
        if accuracy == "High":
            accuracy = "HIGH"
        elif accuracy == "Medium":
            accuracy = "MEDIUM"
        elif accuracy == "Low":
            accuracy = "LOW"
        else:
            accuracy = "HIGH"

        # Parse additional parameters from context
        ccpparams = rasterutils._parseAdjArgs(context)

        # Get image collection catalog path
        icpath = rasterutils.getImageServiceDatasource(inic)
        if icpath.startswith("/enterpriseDatabases"):
            icpath = rasterutils._lookupdatastorepath(icpath)
            # arcpy.AddMessage("Temporary EGDB mosaic dataset path: {}".format(icpath))

        if icpath:
            # 2. Find initial tie point path
            adjind = rasterutils._getAdjustIndex(icpath)
            tiepnt = icpath + "_p"

            scratchWS = arcpy.env.scratchGDB
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            gcpname = "autogcp_" + timestamp
            autogcp = os.path.join(scratchWS, gcpname)

            # Run Compute Control Point tool
            moreags = rasterutils._parsecontext(context)
            arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags, "om")
            arcpy.env.overwriteOutput = 1
            arcpy.AddMessage("Computing control points for image collection based on reference layer URL: {}".format(reflyr))
            arcpy.ComputeControlPoints_management(
                icpath, in_reference_images=reflyr, out_control_points=autogcp,
                similarity=ccpparams["pointSimilarity"], density=ccpparams["pointDensity"],
                distribution=ccpparams["pointDistribution"], location_accuracy=accuracy)
            arcpy.AddMessage("New ground control points and tie points computed.")

            if arcpy.Exists(tiepnt):
                arcpy.AddMessage("Adding new ground control points sets.")
                arcpy.AppendControlPoints_management(tiepnt, autogcp)
                arcpy.AddMessage("Added new ground control points sets.")
            else:
                arcpy.AddMessage("Creating new ground control points sets.")
                arcpy.Copy_management(autogcp, tiepnt)
                arcpy.AddMessage("New ground control points sets created.")

        else:
            arcpy.AddError("Cannot get the image collection path.")

        # Set output parameter value
        # TODO: return newly added GCP set
        arcpy.SetParameterAsText(4, inic)

    except arcpy.ExecuteError:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        arcpy.AddError(err)
