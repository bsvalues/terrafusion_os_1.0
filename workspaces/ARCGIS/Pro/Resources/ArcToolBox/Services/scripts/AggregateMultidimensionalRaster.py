
"""-----------------------------------------------------------------------------
Name:           AggregateMultidimensionalRaster.py
Purpose:        Run AggregateMultidimensionalRaster
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

TASK_NAME = 'AggregateMultidimensionalRaster'
ERROR_CODES = []
errorMsgs = {}

def _parseAggregationMethod(aggregationMethod):
    aggregationMethodAllowedValues = ['MEAN', 'MAXIMUM', 'MAJORITY', 'MINIMUM', 'MINORITY', 
                                     'MEDIAN', 'RANGE', 'STD', 'SUM', 'VARIETY', 'CUSTOM', 'PERCENTILE']
    for element in aggregationMethodAllowedValues:
        if aggregationMethod.upper() == element:
            return element
    element = 'MEAN'
    return element

def _parseAggregationDef(aggregationDef):
    aggregationDefAllowedValues = ['ALL', 'INTERVAL_KEYWORD', 'INTERVAL_VALUE', 'INTERVAL_RANGES']
    for element in aggregationDefAllowedValues:
        if aggregationDef.upper() == element:
            return element
    element = 'ALL'
    return element

def _parseIntervalKeyword(intervalKeyword):
    intervalKeywordAllowedValues = ['HOURLY', 'DAILY', 'WEEKLY', 'DEKADLY', 'PENTADLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'RECURRING_DAILY', 'RECURRING_WEEKLY', 'RECURRING_MONTHLY', 'RECURRING_QUARTERLY']
    for element in intervalKeywordAllowedValues:
        if intervalKeyword.upper() == element:
            return element

def _parseRFTitem(rft):
    """
    :param rft: either the uploaded itemId of the raster function template or the JSON/XML string
    :return: path string or xml/json string
    """
    try:
        rftitem = json.loads(rft)
        if "itemId" in rftitem:
            return rasterutils.getDataFromItem(rft, False)
        else:
            return rft
    except ValueError:
        # Not a JSON
        return rft
    except Exception:
        return rft


if __name__ == '__main__':

    # Input raster can only be:
    # '{"url":"http://a/a/b/imageserver"}',
    # or '{"uri":"http://a/a/b/c"}',
    # or '{"itemId":"abcdefghijklmnopqrstuvwxyz"}'
    # for all other input types, call genRas tool directly
    inMdimRas = arcpy.GetParameterAsText(0)
    outMdimRas = arcpy.GetParameterAsText(1)  # Output raster (optional): item id, url, uri
    dimension = arcpy.GetParameterAsText(2)  #
    aggregationMethod = arcpy.GetParameterAsText(3)
    variables = arcpy.GetParameterAsText(4)  #
    aggregationDef = arcpy.GetParameterAsText(5)
    intervalKeyword = arcpy.GetParameterAsText(6)
    intervalValue = arcpy.GetParameterAsText(7)
    intervalUnit = arcpy.GetParameterAsText(8)
    intervalRanges = arcpy.GetParameterAsText(9)
    aggregationFunction = arcpy.GetParameterAsText(10)
    ignoreNodata = arcpy.GetParameterAsText(11)
    dimensionless = arcpy.GetParameterAsText(12) # 
    percentileValue = arcpy.GetParameterAsText(13)
    percentileInterpolationType = arcpy.GetParameterAsText(14)
    context = arcpy.GetParameterAsText(15) # 

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

        aggregationMethod = _parseAggregationMethod(aggregationMethod)

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

        intervalRangesValues = intervalRanges
        try:
            intervalRanges=eval(intervalRanges)
        except:
            pass
        intervalRangesValuesList = []
        if isinstance(intervalRanges, list):
            for ele in intervalRanges:
                if isinstance(ele,dict):
                    intervalRangesValuesList.append(str(ele["minValue"])+" "+str(ele["maxValue"]))
            intervalRangesValues = ";".join(intervalRangesValuesList)
        if isinstance(intervalRanges, dict):
            intervalRangesValuesList.append(str(intervalRanges["minValue"])+" "+str(intervalRanges["maxValue"]))
            intervalRangesValues = ";".join(intervalRangesValuesList)

        aggregationDef = _parseAggregationDef(aggregationDef)

        intervalKeyword = _parseIntervalKeyword(intervalKeyword)

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

        aggregationFunction = _parseRFTitem(aggregationFunction)
        try:
            aggregationFunction = aggregationFunction.replace("\\n", "")
        except:
            pass
        # Execute the Aggregate Multidimensional Raster tool =====================================
        # if len(funcArgs) > 0:
        arcpy.AddMessage("Executing...")
        arcpy.gp.AggregateMultidimensionalRaster_ia(inMdimRas,
                                                    dimension,
                                                    outMdimRas,
                                                    aggregationMethod,
                                                    var,
                                                    aggregationDef,
                                                    intervalKeyword,
                                                    intervalValue,
                                                    intervalUnit,
                                                    intervalRangesValues,
                                                    aggregationFunction,
                                                    ignoreNodata,
                                                    dimensionless,
                                                    percentileValue,
                                                    percentileInterpolationType)

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
        arcpy.SetParameterAsText(16, json.dumps(outval))


    except rasterutils.LicenseError as err:
        rasterutils.AddExceptionError(
            TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
