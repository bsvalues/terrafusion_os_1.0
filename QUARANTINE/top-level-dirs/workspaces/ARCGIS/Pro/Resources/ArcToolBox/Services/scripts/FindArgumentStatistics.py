
"""-----------------------------------------------------------------------------
Name:           FindArgumentStatistics.py
Purpose:        Run FindArgumentStatistics
Author:         Esri Inc.
Created:        07/22/2019
Copyright:      (c)   Esri, Inc. 2019
ArcGIS Version: 10.8
-----------------------------------------------------------------------------"""
# core libraries
import json
import sys

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'FindArgumentStatistics'
ERROR_CODES = []

def _parsestatisticsType(statisticsType):
    statisticsTypeAllowedValues = ['ARGUMENT_MIN', 'ARGUMENT_MAX', 'ARGUMENT_MEDIAN', 'DURATION', 'ARGUMENT_VALUE']
    for element in statisticsTypeAllowedValues:
        if statisticsType.upper() == element:
            return element
    element = 'ARGUMENT_MIN'
    return element

def _parseIntervalKeyword(intervalKeyword):
    intervalKeywordAllowedValues = ['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'RECURRING_DAILY', 'RECURRING_WEEKLY', 'RECURRING_MONTHLY', 'RECURRING_QUATERLY']
    for element in intervalKeywordAllowedValues:
        if intervalKeyword.upper() == element:
            return element

def _parseDimensionDefinition(method):
    methodAllowedValues = ['ALL', 'INTERVAL_KEYWORD']
    for element in methodAllowedValues:
        if method.upper() == element:
            return element
    element = 'ALL'
    return element

def _parseComparison(comparison):
    comparisonAllowedValues = ['EQUAL_TO', 'GREATER_THAN', 'SMALLER_THAN']
    for element in comparisonAllowedValues:
        if comparison.upper() == element:
            return element
    element = 'EQUAL_TO'
    return element

def _parseOccurrence(occurrence):
    occurrenceAllowedValues = ['FIRST_OCCURRENCE', 'LAST_OCCURRENCE']
    for element in occurrenceAllowedValues:
        if occurrence.upper() == element:
            return element
    element = 'FIRST_OCCURRENCE'
    return element

if __name__ == '__main__':

    # Input raster can only be:
    # '{"url":"http://a/a/b/imageserver"}',
    # or '{"uri":"http://a/a/b/c"}',
    # or '{"itemId":"abcdefghijklmnopqrstuvwxyz"}'
    # for all other input types, call genRas tool directly
    inRas = arcpy.GetParameterAsText(0)
    outRas = arcpy.GetParameterAsText(1)  # Output raster (optional): item id, url, uri
    dimension = arcpy.GetParameterAsText(2)
    dimensionDef = arcpy.GetParameterAsText(3)
    intervalKeyword = arcpy.GetParameterAsText(4)
    variables = arcpy.GetParameterAsText(5)  
    statisticsType = arcpy.GetParameterAsText(6)
    minVal = arcpy.GetParameter(7)
    maxVal= arcpy.GetParameter(8)
    multipleOccurrenceValue = arcpy.GetParameterAsText(9)
    ignoreNodata = arcpy.GetParameterAsText(10)
    argumentValue = arcpy.GetParameterAsText(11)
    comparison = arcpy.GetParameterAsText(12)
    occurrence = arcpy.GetParameterAsText(13)
    context = arcpy.GetParameterAsText(14) 

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

        statisticsType = _parsestatisticsType(statisticsType)
        if statisticsType.lower() == "argument_value" and argumentValue == "":
            arcpy.AddError("argumentValue must be specified when statisticsType is set to 'ARGUMENT_VALUE'")
            sys.exit(0)

        intervalKeyword = _parseIntervalKeyword(intervalKeyword)
        dimensionDef = _parseDimensionDefinition(dimensionDef)
        comparison = _parseComparison(comparison)
        occurrence = _parseOccurrence(occurrence)

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

        # Execute the Generate Multidimensional Anomaly tool =====================================
        # if len(funcArgs) > 0:
        arcpy.AddMessage("Executing...")
        arcpy.gp.FindArgumentStatistics_ia(inRas,
                                           outRas,
                                           dimension,
                                           dimensionDef,
                                           intervalKeyword,
                                           var,
                                           statisticsType,
                                           minVal,
                                           maxVal,
                                           multipleOccurrenceValue,
                                           ignoreNodata,
                                           argumentValue,
                                           comparison,
                                           occurrence)

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
        arcpy.SetParameterAsText(15, json.dumps(outval))

    except rasterutils.LicenseError as err:
        rasterutils.AddExceptionError(
            TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
