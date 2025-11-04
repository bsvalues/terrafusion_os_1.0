
"""-----------------------------------------------------------------------------
Name:           GenerateMultidimensionalAnomaly.py
Purpose:        Run GenerateMultidimensionalAnomaly
Author:         Esri Inc.
Created:        05/01/2019
Copyright:      (c)   Esri, Inc. 2018
ArcGIS Version: 10.8
-----------------------------------------------------------------------------"""
# core libraries
import json

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'GenerateMultidimensionalAnomaly'
ERROR_CODES = []
errorMsgs = {}

def _parseMethod(method):
    methodAllowedValues = ['DIFFERENCE_FROM_MEAN', 'PERCENT_DIFFERENCE_FROM_MEAN', 'PERCENT_OF_MEAN', 'Z_SCORE', 'DIFFERENCE_FROM_MEDIAN', 'PERCENT_DIFFERENCE_FROM_MEDIAN', 'PERCENT_OF_MEDIAN']
    for element in methodAllowedValues:
        if method.upper() == element:
            return element
    element = 'DIFFERENCE_FROM_MEAN'
    return element

def _parseInterval(interval):
    intervalKeywordAllowedValues = ['ALL','HOURLY', 'RECURRING_DAILY', 'RECURRING_WEEKLY', 'RECURRING_MONTHLY', 'YEARLY', 'EXTERNAL_RASTER']
    for element in intervalKeywordAllowedValues:
        if interval.upper() == element:
            return element


if __name__ == '__main__':

    # Input raster can only be:
    # '{"url":"http://a/a/b/imageserver"}',
    # or '{"uri":"http://a/a/b/c"}',
    # or '{"itemId":"abcdefghijklmnopqrstuvwxyz"}'
    # for all other input types, call genRas tool directly
    inMdimRas = arcpy.GetParameterAsText(0)
    outMdimRas = arcpy.GetParameterAsText(1)  # Output raster (optional): item id, url, uri
    variables = arcpy.GetParameterAsText(2)  #
    method = arcpy.GetParameterAsText(3)
    calculationInterval = arcpy.GetParameterAsText(4)
    ignoreNodata = arcpy.GetParameterAsText(5)
    referenceMeanRaster = arcpy.GetParameterAsText(6)
    context = arcpy.GetParameterAsText(7) # 

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
        iid, isurl, aisurl, outMdimRas = rasterutils.getOutRasterPath(outMdimRas)
        outMdimRas = rasterutils.appendcrf(outMdimRas)

        arcpy.AddMessage("Output item id is: {0}".format(iid))
        arcpy.AddMessage("Output image service url is: {0}".format(isurl))
        # arcpy.AddMessage("Output image service admin url is: {0}".format(aisurl))
        arcpy.AddMessage("Output cloud raster name is: {0}".format(outMdimRas))

        inMdimRas = rasterutils.getInDataPath(inMdimRas)
        if isinstance(inMdimRas, dict):
            inMdimRas = json.dumps(inMdimRas)

        method = _parseMethod(method)

        # Parse variables 
        try:
            variables=eval(variables)
        except:
            pass
        var = ""
        if isinstance(variables, list):
            var = ";".join(variables)
        elif isinstance(variables, str):
            var = ";".join(variables.split(","))

        calculationInterval = _parseInterval(calculationInterval)

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

        # Converting boolean parameter to keyword
        if ignoreNodata.lower() == "true":
            ignoreNodata = "DATA"
        else:
            ignoreNodata = "NODATA"

        referenceMeanRaster = rasterutils.getInDataPath(referenceMeanRaster)
        if isinstance(referenceMeanRaster, dict):
            referenceMeanRaster = json.dumps(referenceMeanRaster)

        # Execute the Generate Multidimensional Anomaly tool =====================================
        # if len(funcArgs) > 0:
        arcpy.AddMessage("Executing...")
        arcpy.gp.GenerateMultidimensionalAnomaly_ia(inMdimRas,
                                                    outMdimRas,
                                                    var,
                                                    method,
                                                    calculationInterval,
                                                    ignoreNodata,
                                                    referenceMeanRaster)

        arcpy.AddMessage("Finished")
        uri = rasterutils.getURI(arcpy.GetMessages(), outMdimRas)
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
        arcpy.SetParameterAsText(8, json.dumps(outval))

    except rasterutils.LicenseError as err:
        rasterutils.AddExceptionError(
            TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
