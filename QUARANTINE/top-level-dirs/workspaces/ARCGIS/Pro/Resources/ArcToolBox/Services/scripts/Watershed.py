"""-----------------------------------------------------------------------------
Name:              Watershed.py
Purpose:           This is the service tool that performs hydrology Watershed analysis
Author:            Esri Inc.
Created:           8/1/2017
Copyright:   (c)   Esri, Inc. 2017
ArcGIS Version:    10.6
-----------------------------------------------------------------------------"""
# core libraries
import json
import os
import time
# internal libraries
import arcpy
import hostedgp as agolgp
import aolutils
import rasterutils

TASK_NAME = 'Watershed'
ERROR_CODES = []
errorMsgs = {}
startTime = time.time()

if __name__ == '__main__':

    inputflowdirection = arcpy.GetParameterAsText(0)
    inpourpoint = arcpy.GetParameterAsText(1)
    outputname = arcpy.GetParameterAsText(2)
    pourpointfield = arcpy.GetParameterAsText(3)
    context = arcpy.GetParameterAsText(4)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # 1. Parse input raster parameters
        inputflowdirection = rasterutils.getInDataPath(inputflowdirection)
        if isinstance(inputflowdirection, dict):
            inputflowdirection = json.dumps(inputflowdirection)

        # For feature collection, use hostedgp
        hostedgp = agolgp.HostedGP(4, 2)
        if rasterutils.checkIfFeatureCollection(inpourpoint):
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inpourpoint", 1)
            inpourpoint = Input.name
        # Now parsing the input raster
        else:
            # inpourpoint = rasterutils.getInDataPath(inpourpoint)
            # if isinstance(inpourpoint, dict):
            #     inpourpoint = json.dumps(inpourpoint)
            inpourpoint = rasterutils.getInDataPath(inpourpoint)
            if inpourpoint.find("/FeatureServer/") > -1 \
                    or inpourpoint.find("/MapServer/") > -1:
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inpourpoint", 1)
                inpourpoint = Input.name
                InputLayerName = Input.layername
            else:
                if isinstance(inpourpoint, dict):
                    inpourpoint = json.dumps(inpourpoint)

        # 2. Parse output raster parameters
        iid, isurl, aisurl, outputname = rasterutils.getOutRasterPath(outputname)
        outputname = rasterutils.appendcrf(outputname)
        arcpy.AddMessage("Output item id is: {0}".format(iid))
        arcpy.AddMessage("Output image service url is: {0}".format(isurl))
        arcpy.AddMessage("Output cloud raster name is: {0}".format(outputname))

        # TODO: add some more validation logic here, and ERROR code

        # 3. Parse environment settings:
        moreags = rasterutils._parsecontext(context)
        outsr = rasterutils.getOutSR(context)
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.extent = outext
        arcpy.env.snapRaster = rasterutils.getSnapRaster(context)
        arcpy.env.mask = rasterutils.getMask(context)
        arcpy.env.cellSize = rasterutils.getCellsize(context)
        # Set parallel processing environment
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        arcpy.env.overwriteOutput = 1

        pyramids = rasterutils.getPyramids(context)

        # 4. Execute tool
        arcpy.gp.Watershed_sa(inputflowdirection, inpourpoint, outputname, pourpointfield)

        msgcount = arcpy.GetMessageCount()
        for n in range(msgcount):
            arcpy.AddMessage("GP message: {0}".format(arcpy.GetMessage(n)))

        # Update output ========================================================
        # Check if output contains URI
        # 1. If no URI found, return output as is
        # 2. If URI found, update service
        uri = rasterutils.getURI(arcpy.GetMessages(), outputname)

        if uri == "":
            arcpy.AddMessage("No data store URI returned.")
        else:
            if not pyramids:
                if rasterutils.checkPyramids(uri):
                    arcpy.AddMessage("Pyramids are existing.")
                else:
                    arcpy.BuildPyramids_management(uri, "-1", "NONE", "NEAREST", "DEFAULT", "", "OVERWRITE")
                    arcpy.AddMessage("Pyramids settings were not specified. Building pyramids by default.")
            else:
                if pyramids['pyramid_option']:
                    if pyramids['pyramid_option'] == "PYRAMIDS":
                        arcpy.BuildPyramids_management(uri, pyramids['levels'], pyramids['skip_first'],
                                                       pyramids['interpolation_type'],
                                                       pyramids['pyramid_compression'],
                                                       pyramids['compression_quality'],
                                                       pyramids['skip_existing'])
                        arcpy.AddMessage("Building pyramids based on specified environment settings from context.")
                    else:
                        arcpy.AddMessage("No pyramids built because pyramid_option is None or an incorrect word")
                else:
                    arcpy.AddMessage("No pyramids built because pyramid_option is undefined")

            arcpy.AddMessage("Data store URI: {0}".format(uri))
            # Get federated token to update image service
            token, referer = rasterutils.getToken(isurl)
            # Read and update image service info
            sinfo = rasterutils.getServiceInfo(aisurl, token, referer)
            if sinfo != {}:
                msg = rasterutils.updateSource(aisurl, sinfo, uri, token, referer)
                arcpy.AddMessage(msg)
                # # Update Portal Item properties if necessary
                # imsg = rasterutils.updateItemProperties(iid, outrasjson)
                # arcpy.AddMessage(imsg)
                rasterutils.refreshPortalItem(iid)
            else:
                arcpy.AddWarning("No service updated although data store URI generated.")

        # Set the output with item and image service url
        outval = {"itemId": iid, "url": isurl}
        arcpy.SetParameterAsText(5, json.dumps(outval))

    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, err)

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))
