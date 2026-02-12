"""-----------------------------------------------------------------------------
Name:              MatchControlPoints.py
Purpose:           Automatically match and find image tie points to a gound
                   control point and its initial image tie point
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
import hostedgp as hgp
import arcpy
import rasterutils

TASK_NAME = 'MatchControlPoints'

class LicenseError(Exception):
    pass

def parseCPSR(cpnt, context):
    """
    This method parse the output coordinate information from the request if given
    :param context: extra settings in JSON that may contains output GCP and/or image point spatial reference
    :return: Ground control point spatial reference and image point spatial reference
    """
    gcpsr = ""
    ipsr = ""

    # Check if environment settings overrides SR
    context = list(rasterutils.getJSON(context))
    if len(context) > 0:
        contextdict = dict((k, v) for k, v in context[0].items())
        if "groundControlPointsSpatialReference" in contextdict:
            gcpsr = contextdict["groundControlPointsSpatialReference"]
            if "wkid" in gcpsr:
                gcpsr = gcpsr["wkid"]
        if "imagePointSpatialReference" in contextdict:
            ipsr = contextdict["imagePointSpatialReference"]

    if not gcpsr or not ipsr:
        # Check if the control point set is already list
        if isinstance(cpnt, list):
            cpntjson = cpnt
        elif isinstance(cpnt, dict):
            cpntjson = list(cpnt)
        else:
            cpntjson = list(rasterutils.getJSON(cpnt))
        # Parse the point set
        if len(cpntjson) > 0:
            cpntdict = dict((k, v) for k, v in cpntjson[0].items())
            if "spatialReference" in cpntdict and not gcpsr:
                if cpntdict["spatialReference"]:
                    gcpsr = cpntdict["spatialReference"]
                    if "wkid" in gcpsr:
                        gcpsr = gcpsr["wkid"]
            if "imagePointSpatialReference" in cpntdict and not ipsr:
                ipsr = cpntdict["imagePointSpatialReference"]
                if "wkid" in ipsr:
                    ipsr = ipsr["wkid"]

    # Set the default to ICS when no image point spatial reference
    # specified.
    if not ipsr:
        ipsr = "ICS"

    return gcpsr, ipsr


if __name__ == '__main__':

    inic = arcpy.GetParameterAsText(0)
    cpnt = arcpy.GetParameterAsText(1)
    similarity = arcpy.GetParameterAsText(2).upper()
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

        # 1. Get the input image collection
        inic = rasterutils.getInDataPath(inic)

        # Get image collection catalog path
        icpath = rasterutils.getImageServiceDatasource(inic)
        if icpath.startswith("/enterpriseDatabases"):
            icpath = rasterutils._lookupdatastorepath(icpath)
            # arcpy.AddMessage("Temporary EGDB mosaic dataset path: {}".format(icpath))

        if icpath:

            # 2. Storage temporary control point sets JSON file
            # Store output control points sets JSON to temporary folder location
            scratchFolder = arcpy.env.scratchFolder
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            gcpname = "gcpjson_" + timestamp + ".json"
            gcpjson = os.path.join(scratchFolder, gcpname)

            # 3. Determine output control point feature class path
            # Store output control point feature class to temporary location
            scratchGDB = arcpy.env.scratchGDB
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            fname = "outgcpfeat_" + timestamp
            outgcpfeat = os.path.join(scratchGDB, fname)

            cpnt = rasterutils._validateControlPoints(cpnt)
            arcpy.AddMessage("control points JSON: {}".format(str(cpnt)))

            # 4. Get output spatial reference
            gcpsr, ipsr = parseCPSR(cpnt, context)
            arcpy.AddMessage("GCP spatial reference from context: {}".format(gcpsr))
            arcpy.AddMessage("Image point spatial reference from context: {}".format(ipsr))

            if cpnt:
                arcpy.env.overwriteOutput = 1
                # TODO: support query from context parameter
                # How to filter JSON or feature service
                # 4. Match control points, the input control points is JSON
                if not isinstance(cpnt, str):
                    cpnt = json.dumps(cpnt)
                result = arcpy.MatchControlPoints_management(
                    icpath, cpnt, outgcpfeat, similarity)

                # Set default ground control point SR
                if gcpsr == "":
                    desc = arcpy.Describe(outgcpfeat)
                    gcpsr = "\"" + desc.spatialReference.exporttostring() + "\""

                # Convert the output GCP feature class to JSON
                # Watch out for path string here
                arcpy.AddMessage("GCP spatial reference used: {} ".format(gcpsr))
                arcpy.AddMessage("Image point spatial reference used: {}".format(ipsr))
                arcpy.gp.command(
                    "ConvertGCPToJSON " + outgcpfeat + " " + gcpjson + " " + str(gcpsr) + " " + str(ipsr) + " " + icpath)
                # Now stream the the content of the output raster function template as string
                # f = open(gcpjson, "r")
                # outval = f.read()

                if os.path.exists(gcpjson):
                    arcpy.SetParameterAsText(4, gcpjson)
                else:
                    arcpy.AddError("Cannot match any new control points.")
            else:
                arcpy.AddError("No valid initial Ground Control Point sets.")
        else:
            arcpy.AddError("Cannot get the image collection path.")

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
