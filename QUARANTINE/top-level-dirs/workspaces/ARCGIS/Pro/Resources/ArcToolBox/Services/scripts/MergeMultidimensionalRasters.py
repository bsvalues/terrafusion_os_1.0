
"""-----------------------------------------------------------------------------
Name:           MergeMultidimensionalRasters.py
Purpose:        Run MergeMultidimensionalRasters
Author:         Esri Inc.
Created:        07/07/2020
Copyright:      (c)   Esri, Inc. 2020
ArcGIS Version: 10.9
-----------------------------------------------------------------------------"""
# core libraries
import json

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'MergeMultidimensionalRasters'

if __name__ == '__main__':

    # Input raster can only be:
    # '{"url":"http://a/a/b/imageserver"}',
    # '{"uri": "\\\\servername\\folder..."}'
    # '{"uri": "/cloudStores/..."}'
    # or '{"itemId":"abcdefghijklmnopqrstuvwxyz"}'
    inMdimRasters = arcpy.GetParameter(0)
    outMdimRas = arcpy.GetParameterAsText(1)  #
    resolveOverlapMethod = arcpy.GetParameterAsText(2)
    context = arcpy.GetParameterAsText(3)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        inputMdimRasters = ""
        if inMdimRasters != "":
            byref, ismosaic, inputMdimRasters, allbyref = rasterutils.getHostedDataPath(inMdimRasters)

        iid = ""  # Portal item ID
        isurl = ""  # Image Service URL
        aisurl = ""  # Image Service admin URL
        iid, isurl, aisurl, outMdimRas = rasterutils.getOutRasterPath(outMdimRas)
        outMdimRas = rasterutils.appendcrf(outMdimRas)

        arcpy.AddMessage("Output item id is: {0}".format(iid))
        arcpy.AddMessage("Output image service url is: {0}".format(isurl))
        # arcpy.AddMessage("Output image service admin url is: {0}".format(aisurl))
        arcpy.AddMessage("Output cloud raster name is: {0}".format(outMdimRas))


        moreags = rasterutils._parsecontext(context)
        outsr = rasterutils.getOutSR(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        # Set parallel processing environment
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        arcpy.env.recycleProcessingWorkers = rasterutils.getRecycleProcessingWorkers(moreags)
        arcpy.env.retryOnFailures = rasterutils.getRetryOnRandomFailures(moreags)

        # Set other GP environment settings
        # Note: the spatial reference defined in the extent will be output spatial reference used
        outsr = rasterutils.getOutSR(context)
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.extent = outext
        arcpy.env.snapRaster = rasterutils.getSnapRaster(context)
        arcpy.env.cellSize = rasterutils.getCellsize(context)
        # Set resampling method
        arcpy.env.resamplingMethod = rasterutils.getResamplingMethod(context)


        # Execute the tool =====================================
        # if len(funcArgs) > 0:

        arcpy.AddMessage("Executing...")
        arcpy.md.MergeMultidimensionalRasters(inputMdimRasters,
                                              outMdimRas,
                                              resolveOverlapMethod)


        arcpy.AddMessage("Finished")
        uri = rasterutils.getURI(arcpy.GetMessages())
        # Update output ========================================================
        # Check if output contains URI
        # 1. If no URI found, return output as is
        # 2. If URI found, update service
        token = ""  # Portal token
        referer = ""  # Portal referer

        if uri == "":
            arcpy.AddMessage("No data store URI returned.")
        else:
            arcpy.AddMessage("Updating service with data store URI.")
            # Get federated token to update image service
            if token == "" or token == "#":
                token, referer = rasterutils.getToken(isurl)
            # Read and update image service info
            sinfo = rasterutils.getServiceInfo(aisurl, token, referer)
            if sinfo != {}:
                msg = rasterutils.updateSource(aisurl, sinfo, uri, token, referer)
                arcpy.AddMessage(msg)
                rasterutils.refreshPortalItem(iid)
            else:
                arcpy.AddWarning("No service updated although data store URI generated.")

        outval = {"itemId": iid, "url": isurl}
        arcpy.SetParameterAsText(4, json.dumps(outval))


    except rasterutils.LicenseError as err:
        rasterutils.AddExceptionError(
            TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))

