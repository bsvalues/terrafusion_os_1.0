"""-----------------------------------------------------------------------------
Name:           DetectChangeUsingDeepLearning.py
Purpose:        Runs a trained deep learning model to detect change between two rasters. 
Author:         Esri Inc.
Created:        05/10/2022
Copyright:      (c)   Esri, Inc. 2022
ArcGIS Version: 11
-----------------------------------------------------------------------------"""
# core libraries
import json
import os
import sys
from datetime import datetime
import time

# internal libraries
import arcpy
import rasterutils
import aolutils
import hostedgp as hgp
import popup
import rendererUtils

scriptsx = os.path.join(os.path.split(os.path.dirname(__file__))[0], "scriptsx")
sys.path.append(scriptsx)
from common import PAOutputFeatureLayer, FeatureServiceLayerPublisher

TASK_NAME = "DetectChangeUsingDeepLearning"
ERROR_CODES = [120201]
errorMsgs = {
    120201: "A service already exists with this name. Please use a different name."
}


if __name__ == '__main__':
    
    fromRaster = arcpy.GetParameterAsText(0)   # Input image service(s) to be trained on.
                                                                # e.g. {"url": "http://a/a/b/imageserver"}; 
                                                                #      {"urls": ["http://a/a/b/imageserver", "http://a/a/c/imageserver"]} 
                                                                # or   {"uri": "http://a/a/b/imageserver"};
                                                                #      {"uris": ["http://a/a/b/imageserver", "http://a/a/c/imageserver"]}
                                                                # or   {"itemId": "abcdefghijklmnopqrstuvwxyz"}
                                                                #      {"itemIds": ["abcdefghijklmnopqrstuvwxyz", "zyxwvutsrqponmlkjihgfedcba"]}
    
    toRaster = arcpy.GetParameterAsText(1)
    outputClassifiedRaster = arcpy.GetParameterAsText(2)
    modelDefinition = arcpy.GetParameterAsText(3) 
    arguments = arcpy.GetParameterAsText(4)
    context = arcpy.GetParameterAsText(5)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # 1. Get the output raster from JSON object that may contains ItemId, image service url 
        iid, isurl, aisurl, outputClassifiedRaster = rasterutils.getOutRasterPath(outputClassifiedRaster)
        
        # 2. Parse the input parameters
        fromRaster = rasterutils.getInDataPath(fromRaster)
        if isinstance(fromRaster, dict):
            fromRaster = json.dumps(fromRaster)
        arcpy.AddMessage("Got 'from' raster")
        toRaster = rasterutils.getInDataPath(toRaster)
        if isinstance(toRaster, dict):
            toRaster = json.dumps(toRaster)
        arcpy.AddMessage("Got 'to' raster")

        # Parse model input to support the following cases:
        # {"itemId": "<portal item id>"}
        # {"url": "<item url>"}
        # {"uri": "<model definition file path>"}
        # {"<entire JSON of the model definition>"}
        modelDefinition = rasterutils.getInDataPath(modelDefinition)

        modelArgs = "#"
        if arguments != "":
            try:
                argsdict = json.loads(arguments)
                argslist = []
                for arg in argsdict:
                    argslist.append(arg + " " + str(argsdict[arg]))
                    modelArgs = ";".join(argslist)
            except:
                arcpy.AddWarning("Invalid model arguments: {}".format(arguments))
                modelArgs = "#"

        hosted_gp = hgp.HostedGP(5, None)
        # 3. Parse GP environment settings honored by this tool
        outsr = rasterutils.getOutSR(context)
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.extent = outext
        arcpy.env.cellSize = rasterutils.getCellsize(context)
        moreags = rasterutils._parsecontext(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        if rasterutils.RUN_ON_AGOL:
            arcpy.env.processorType = "GPU"
        else:
            arcpy.env.processorType = rasterutils.getProcessorType(moreags)
        if arcpy.env.processorType == "GPU":
            arcpy.env.gpuId = 0

        # 4. Execute the tool =================================================================================
        arcpy.AddMessage("Detecting change...")
        arcpy.gp.DetectChangeUsingDeepLearning_ia(
            fromRaster,
            toRaster,
            outputClassifiedRaster,
            modelDefinition,
            modelArgs
        )

        arcpy.AddMessage("Tool execution complete.")
        uri = rasterutils.getURI(arcpy.GetMessages(), outputClassifiedRaster)
        # Update output ========================================================================================
        # Check if output contains URI
        # 1. If no URI found, return output as is
        # 2. If URI found, update service
        if not uri:
            arcpy.AddMessage("No data store URI returned.")
        else:
            arcpy.AddMessage("Updating service with data store URI.")
            # Get federated token to update image service
            token, referrer = rasterutils.getToken(isurl)
            #  Read and update image service info
            sinfo = rasterutils.getServiceInfo(aisurl, token, referrer)
            if sinfo != {}:
                msg = rasterutils.updateSource(aisurl, sinfo, uri, token, referrer)
                arcpy.AddMessage(msg)
                rasterutils.refreshPortalItem(iid)
            else:
                arcpy.AddWarning("No service updated although data store URI generated.")

        outval = {"itemId": iid, "url": isurl}
        arcpy.SetParameterAsText(6, json.dumps(outval))

    except rasterutils.LicenseError as err:
        rasterutils.AddExceptionError(
            TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
