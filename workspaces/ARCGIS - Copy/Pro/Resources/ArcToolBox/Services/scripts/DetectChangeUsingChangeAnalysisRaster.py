
"""-----------------------------------------------------------------------------
Name:           DetectChangeUsingChangeAnalysisRaster.py
Purpose:        Run DetectChangeUsingChangeAnalysisRaster
Author:         Esri Inc.
Created:        31/03/2020
Copyright:      (c)   Esri, Inc. 2018
ArcGIS Version: 10.81
-----------------------------------------------------------------------------"""
# core libraries
import json

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'DetectChangeUsingChangeAnalysisRaster'

if __name__ == '__main__':

    # Input raster can only be:
    # '{"url":"http://a/a/b/imageserver"}',
    # or '{"uri":"http://a/a/b/c"}',
    # or '{"itemId":"abcdefghijklmnopqrstuvwxyz"}'
    # for all other input types, call genRas tool directly
    inRas = arcpy.GetParameterAsText(0)
    outRas = arcpy.GetParameterAsText(1)  # Output raster (optional): item id, url, uri
    changeType = arcpy.GetParameter(2)  #
    maxNumberChanges  = arcpy.GetParameter(3)
    segmentDate = arcpy.GetParameter(4)
    changeDirection = arcpy.GetParameter(5)
    filterByYear = arcpy.GetParameter(6)
    minYear = arcpy.GetParameterAsText(7)
    maxYear = arcpy.GetParameterAsText(8)
    filterByDuration = arcpy.GetParameter(9)
    minDuration = arcpy.GetParameterAsText(10)
    maxDuration = arcpy.GetParameterAsText(11)
    filterByMagnitude = arcpy.GetParameter(12)
    minMagnitude = arcpy.GetParameterAsText(13)
    maxMagnitude = arcpy.GetParameterAsText(14)
    filterByStartValue = arcpy.GetParameter(15)
    minStartValue = arcpy.GetParameterAsText(16)
    maxStartValue = arcpy.GetParameterAsText(17)
    filterByEndValue = arcpy.GetParameter(18)
    minEndValue = arcpy.GetParameterAsText(19)
    maxEndValue = arcpy.GetParameterAsText(20)
    context = arcpy.GetParameterAsText(21) # 

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # Get the output raster from JSON object that may contains ItemID, image service url or CRF
        # Example:
        # {"itemId": "no213u0uiif8924989h98h0123",
        #  "url": "http://rdvmags02.esri.com/arcgis/rest/services/Hosted/testis",
        #  "uri": "http://pds31:29080/suitabilityanalysis_1230414"}
        iid = ""  # Portal item ID
        isurl = ""  # Image Service URL
        aisurl = ""  # Image Service admin URL
        iid, isurl, aisurl, outRas = rasterutils.getOutRasterPath(outRas)
        outRas = rasterutils.appendcrf(outRas)

        arcpy.AddMessage("Output item id is: {0}".format(iid))
        arcpy.AddMessage("Output image service url is: {0}".format(isurl))
        # arcpy.AddMessage("Output image service admin url is: {0}".format(aisurl))
        arcpy.AddMessage("Output cloud raster name is: {0}".format(outRas))

        inRas = rasterutils.getInDataPath(inRas)
        if isinstance(inRas, dict):
            inRas = json.dumps(inRas)

        moreags = rasterutils._parsecontext(context)
        # Set parallel processing environment
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        arcpy.env.recycleProcessingWorkers = rasterutils.getRecycleProcessingWorkers(moreags)
        arcpy.env.retryOnFailures = rasterutils.getRetryOnRandomFailures(moreags)

        # Set other GP environment settings
        # Note: the spatial reference defined in the extent will be output spatial reference used
        outsr = rasterutils.getOutSR(context)
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.extent = outext
        arcpy.env.snapRaster = rasterutils.getSnapRaster(context)
        arcpy.env.cellSize = rasterutils.getCellsize(context)
        # Set resampling method
        arcpy.env.resamplingMethod = rasterutils.getResamplingMethod(context)

        # Execute the tool =====================================
        # if len(funcArgs) > 0:
        arcpy.AddMessage("Executing...")
        arcpy.gp.DetectChangeUsingChangeAnalysisRaster_ia(inRas,
                                                          outRas,
                                                          changeType,
                                                          maxNumberChanges,
                                                          segmentDate,
                                                          changeDirection,
                                                          filterByYear,
                                                          minYear,
                                                          maxYear,
                                                          filterByDuration,
                                                          minDuration,
                                                          maxDuration,
                                                          filterByMagnitude,
                                                          minMagnitude,
                                                          maxMagnitude,
                                                          filterByStartValue,
                                                          minStartValue,
                                                          maxStartValue,
                                                          filterByEndValue,
                                                          minEndValue,
                                                          maxEndValue)


        arcpy.AddMessage("Finished")
        uri = rasterutils.getURI(arcpy.GetMessages(), outRas)
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
        arcpy.SetParameterAsText(22, json.dumps(outval))


    except rasterutils.LicenseError as err:
        rasterutils.AddExceptionError(
            TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
