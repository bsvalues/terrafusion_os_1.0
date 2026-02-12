"""-----------------------------------------------------------------------------
Name:              EditControlPoints.py
Purpose:           Update existing control points with new
Author:            Esri Inc.
Created:           3/2/2017
Copyright:   (c)   Esri, Inc. 2017
ArcGIS Version:    10.6
-----------------------------------------------------------------------------"""
# core libraries
import os
from datetime import datetime
import json

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'EditControlPoints'


def JSON2GCP(injson, cpnt, sr, icpath):
    """
    :param injson: the JSON string representation of control points set
    :param cpnt: the image collection control point catalog path
    :param sr: the image collection spatial reference string
    :param icpath: mosaic dataset path for reprojecting image point
    :return: True for succeed, False for failure
    """
    try:
        # Convert input JSON to temporary .josn text file if input is dictionary
        # or list. Otherwise, send it to tool to handle.
        if isinstance(injson, list) or isinstance(injson, dict):
            # Find scratch folder to store temporary JSON file
            scratchFolder = arcpy.env.scratchFolder
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            gcpname = "gcpjson_" + timestamp + ".json"
            gcpjson = os.path.join(scratchFolder, gcpname)

            with open(gcpjson, "w") as f:
                json.dump(injson, f)
        else:
            gcpjson = injson

        # arcpy.AddMessage(gcpjson)
        # the current GCP set to initial tie points feature class
        arcpy.gp.command(
            "ConvertJSONToGCP " + gcpjson + " " + cpnt + " " + str(sr) + " " + icpath)

        return True
    except Exception as err:
        arcpy.AddMessage("Error converting JSON to GCP points feature class.")
        return False


if __name__ == '__main__':

    inic = arcpy.GetParameterAsText(0)
    # TODO: Support input control point as JSON file, uploading to Portal
    cpnt = arcpy.GetParameterAsText(1)
    context = arcpy.GetParameterAsText(2)

    try:
        # 0. Check Reality Server extension license

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

            # 2. Validate GCP
            cpnt = rasterutils._validateControlPoints(cpnt)

            if cpnt:
                arcpy.env.overwriteOutput = 1
                # 3. Find the adjustment index of the image collection
                adjind = rasterutils._getAdjustIndex(icpath)
                tiepnt = icpath + "_p"
                # When adjind exists, the image collection ends with _adj
                # When there is adjustment index, use the same naming convention
                # When the control point feature exists
                if arcpy.Exists(tiepnt):
                    # If the tie point table already existed, we rely on the append tool to add/edit points
                    result = arcpy.AppendControlPoints_management(tiepnt, json.dumps(cpnt))
                else:
                    # Create control point table if the initial control point table does not exist
                    # Convert input control point JSON to initial control point table
                    # Get image collection spatial reference
                    desc = arcpy.Describe(icpath)
                    if not JSON2GCP(cpnt, tiepnt, desc.spatialReference.factoryCode, icpath):
                        arcpy.AddError("Cannot convert input control point sets to initial control point table.")
            else:
                arcpy.AddError("No valid Ground Control Point sets for update.")
        else:
            arcpy.AddError("Cannot get the image collection path.")

        # Still returns the image collection url as output
        outval = {"url": inic}
        arcpy.SetParameterAsText(3, json.dumps(outval))

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages())

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
