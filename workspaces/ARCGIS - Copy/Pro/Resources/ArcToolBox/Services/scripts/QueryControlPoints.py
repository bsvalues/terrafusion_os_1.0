"""-----------------------------------------------------------------------------
Name:              QueryControlPoints.py
Purpose:           Query existing control points with SQL expression
Author:            Esri Inc.
Created:           3/2/2017
Copyright:   (c)   Esri, Inc. 2017
ArcGIS Version:    10.6
-----------------------------------------------------------------------------"""
# core libraries
import json
import os
from datetime import datetime

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'QueryControlPoints'

class LicenseError(Exception):
    pass

if __name__ == '__main__':

    inic = arcpy.GetParameterAsText(0)
    where = arcpy.GetParameterAsText(1)

    try:
        # 0. Check Image Server extension license
        # if arcpy.CheckExtension("Image") != "Available":
        #     raise LicenseError

        # 1. Get the input image collection
        inic = rasterutils.getInDataPath(inic)

        # Get image collection catalog path
        icpath = rasterutils.getImageServiceDatasource(inic)
        if icpath.startswith("/enterpriseDatabases"):
            icpath = rasterutils._lookupdatastorepath(icpath)
            # arcpy.AddMessage("Temporary EGDB mosaic dataset path: {}".format(icpath))

        if icpath:
            # Locate the project folder
            prjfolder = os.path.dirname(os.path.dirname(icpath))

            # 2. Find the adjustment index of the image collection
            adjind = rasterutils._getAdjustIndex(icpath)
            tiepnt = icpath + "_p"

            if not arcpy.Exists(tiepnt):
                arcpy.AddError("No existing control points to query from.")
            else:
                arcpy.AddMessage("Control point table is {}".format(tiepnt))

            # Store the filtered control points as temporary JSON file
            scratchFolder = arcpy.env.scratchFolder
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            gcpname = "gcpjson_" + timestamp + ".json"
            gcpjson = os.path.join(scratchFolder, gcpname)

            # Check if control point sets exist
            # arcpy.AddMessage("Check if ground control point sets exist.")
            gcpsetexists = False
            with arcpy.da.SearchCursor(tiepnt, ["pointid"], "type=2") as gcpcur:
                for row in gcpcur:
                    gcpsetexists = True
                    break
            # arcpy.AddMessage("Finish checking if ground control point sets exist.")

            if gcpsetexists:
                # Query control points table
                arcpy.env.overwriteOutput = 1
                querylyr = "gcpsubset"
                queryfeat = os.path.join(scratchFolder, "gcpsubset.shp")
                arcpy.MakeFeatureLayer_management(
                    tiepnt, querylyr, where_clause=where)

                arcpy.CopyFeatures_management(querylyr, queryfeat)
                # arcpy.AddMessage("Temporary query feature class is {}".format(queryfeat))

                if arcpy.Exists(queryfeat):
                    # Set default point set SR
                    desc = arcpy.Describe(queryfeat)
                    gcpsr = "\"" + desc.spatialReference.exporttostring() + "\""
                    # Convert the output GCP feature class to JSON
                    arcpy.gp.command(
                        "ConvertGCPToJSON " + queryfeat + " " + gcpjson + " " + str(gcpsr) + " " + str(gcpsr) + " " + icpath)
                else:
                    arcpy.AddError("Cannot create control point layer.")

                if os.path.exists(gcpjson):
                    arcpy.SetParameterAsText(2, gcpjson)
                else:
                    arcpy.AddError("Cannot find any control points fit the query.")
            else:
                arcpy.AddWarning("No ground control point sets exist for query.")

        else:
            arcpy.AddError("Cannot get the image collection path.")

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
