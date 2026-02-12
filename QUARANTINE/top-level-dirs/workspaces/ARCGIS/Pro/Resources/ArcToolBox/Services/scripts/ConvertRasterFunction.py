"""-----------------------------------------------------------------------------
Name:              ConvertRasterFunction.py
Purpose:           Convert Raster Function or Function Templates between 3
                   formats: JSON/XML/BINARY
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

TASK_NAME = 'ConvertRasterFunctionTemplate'

def parseRFTitem(rft):
    """
    :param rft: either the uploaded itemId of the raster function template or the JSON/XML string
    :return: path string or xml/json string
    """
    try:
        rftitem = json.loads(rft)
        if "itemId" in rftitem:
            return rasterutils.getDataFromItem(rft, True)
        else:
            return rft
    except ValueError:
        # Not a JSON
        return rft
    except Exception:
        return rft

if __name__ == '__main__':

    inrft = arcpy.GetParameterAsText(0)
    oformat = arcpy.GetParameterAsText(1)

    try:
        # Support two types of input:
        # 1. Uploaded function template file, given by {"itemId": "....."}
        # 2. JSON/XML string (pass down directly)
        inrft = parseRFTitem(inrft)

        # Store output function template to temporary location
        scratchFolder = arcpy.env.scratchFolder
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")

        # Add output function template file extension
        if oformat == "JSON":
            fname = "outrft_" + timestamp + ".rft.json"
        elif oformat == "XML":
            fname = "outrft_" + timestamp + ".rft.xml"
        else:
            fname = "outrft_" + timestamp + ".rft.json"

        outrft = os.path.join(scratchFolder, fname)
        arcpy.AddMessage("input function template: {}".format(inrft))
        arcpy.AddMessage("output function template: {}".format(outrft))
        result = arcpy.ConvertRasterFunctionTemplate_management(
            inrft, outrft, format=oformat)

        # Set the output with file path
        if os.path.exists(outrft):
            arcpy.SetParameterAsText(2, outrft)
        else:
            arcpy.SetParameterAsText(2, None)
            arcpy.AddError("No output function template generated.")

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
