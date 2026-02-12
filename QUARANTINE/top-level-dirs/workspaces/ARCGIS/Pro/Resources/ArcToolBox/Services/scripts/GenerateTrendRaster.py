
"""-----------------------------------------------------------------------------
Name:           GenerateTrendRaster.py
Purpose:        Run GenerateTrendRaster
Author:         Esri Inc.
Created:        07/22/2019
Copyright:      (c)   Esri, Inc. 2019
ArcGIS Version: 10.8
-----------------------------------------------------------------------------"""
# core libraries
import json

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'GenerateTrendRaster'
ERROR_CODES = []
errorMsgs = {}

def _parselineType(lineType):
    lineTypeAllowedValues = ['LINEAR', 'HARMONIC', 'POLYNOMIAL','MANN-KENDALL', 'SEASONAL-KENDALL']
    for element in lineTypeAllowedValues:
        if lineType.upper() == element:
            return element
    element = 'LINEAR'
    return element


if __name__ == '__main__':

    # Input raster can only be:
    # '{"url":"http://a/a/b/imageserver"}',
    # or '{"uri":"http://a/a/b/c"}',
    # or '{"itemId":"abcdefghijklmnopqrstuvwxyz"}'
    # for all other input types, call genRas tool directly
    inMdimRas = arcpy.GetParameterAsText(0)
    outMdimRas = arcpy.GetParameterAsText(1)  # Output raster (optional): item id, url, uri
    dimension = arcpy.GetParameterAsText(2)
    variables = arcpy.GetParameterAsText(3)  #
    lineType = arcpy.GetParameterAsText(4)
    cycleLength = arcpy.GetParameterAsText(5)
    cycleUnit = arcpy.GetParameterAsText(6)
    frequency = arcpy.GetParameter(7)
    ignoreNodata = arcpy.GetParameterAsText(8)
    rmse = arcpy.GetParameterAsText(9)
    r2 = arcpy.GetParameterAsText(10)
    slope_p_value = arcpy.GetParameterAsText(11)
    seasonalPeriod = arcpy.GetParameterAsText(12)
    context = arcpy.GetParameterAsText(13) # 

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

        # Parse variables 
        var = ""
        try:
            variables=eval(variables)
        except:
            pass
        if isinstance(variables, list):
            var = ";".join(variables)
        elif isinstance(variables, str):
            var = ";".join(variables.split(","))

        lineType = _parselineType(lineType)
        if frequency == 0:
            if lineType == "LINEAR":
                frequency = None

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

        if rmse.lower() == "true":
            rmse = "RMSE"
        else:
            rmse = "NO_RMSE"

        if r2.lower() == "true":
            r2 = "R2"
        else:
            r2 = "NO_R2"

        if slope_p_value.lower() == "true":
            slope_p_value = "SLOPEPVALUE"
        else:
            slope_p_value = "NO_SLOPEPVALUE"

        # Execute the Generate Multidimensional Anomaly tool =====================================
        # if len(funcArgs) > 0:
        arcpy.AddMessage("Executing...")
        arcpy.gp.GenerateTrendRaster_ia(inMdimRas,
                                        outMdimRas,
                                        dimension,
                                        var,
                                        lineType,
                                        frequency,
                                        ignoreNodata,
                                        cycleLength,
                                        cycleUnit,
                                        rmse,
                                        r2,
                                        slope_p_value,
                                        seasonalPeriod)

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
        arcpy.SetParameterAsText(14, json.dumps(outval))

    except rasterutils.LicenseError as err:
        rasterutils.AddExceptionError(
            TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
