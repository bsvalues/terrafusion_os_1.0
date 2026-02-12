
"""-----------------------------------------------------------------------------
Name:           ComputeChangeRaster.py
Purpose:        Run ComputeChangeRaster
Author:         Esri Inc.
Created:        08/16/2020
Copyright:      (c)   Esri, Inc. 2020
ArcGIS Version: 10.9
-----------------------------------------------------------------------------"""
# core libraries
import json

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'ComputeChangeRaster'


if __name__ == '__main__':

    # Input raster can only be:
    # '{"url":"http://a/a/b/imageserver"}',
    # or '{"uri":"http://a/a/b/c"}',
    # or '{"itemId":"abcdefghijklmnopqrstuvwxyz"}'
    # for all other input types, call genRas tool directly
    inputFromRaster = arcpy.GetParameterAsText(0)
    inputToRaster = arcpy.GetParameterAsText(1)
    outras = arcpy.GetParameterAsText(2)  
    computeChangeMethod  = arcpy.GetParameterAsText(3)  #
    fromClassValues = arcpy.GetParameterAsText(4) 
    toClassValues = arcpy.GetParameterAsText(5) 
    filterMethod = arcpy.GetParameterAsText(6)
    defineTransitionColors = arcpy.GetParameterAsText(7)
    fromClassnameField = arcpy.GetParameterAsText(8)
    toClassnameField = arcpy.GetParameterAsText(9)
    context = arcpy.GetParameterAsText(10) # Number of instances: integer e.g. 10

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
        iid, isurl, aisurl, outras = rasterutils.getOutRasterPath(outras)
        outras = rasterutils.appendcrf(outras)

        arcpy.AddMessage("Output item id is: {0}".format(iid))
        arcpy.AddMessage("Output image service url is: {0}".format(isurl))
        # arcpy.AddMessage("Output image service admin url is: {0}".format(aisurl))
        arcpy.AddMessage("Output cloud raster name is: {0}".format(outras))


        inputFromRaster = rasterutils.getInDataPath(inputFromRaster)
        if isinstance(inputFromRaster, dict):
            inputFromRaster = json.dumps(inputFromRaster)

        inputToRaster = rasterutils.getInDataPath(inputToRaster)
        if isinstance(inputToRaster, dict):
            inputToRaster = json.dumps(inputToRaster)

        # Parse fromClassValues and toClassValues 
        fromValues= ""
        try:
            fromClassValues=eval(fromClassValues)
        except:
            pass
        if isinstance(fromClassValues, list):
            fromValues = ";".join(fromClassValues)
        elif isinstance(fromClassValues, str):
            fromValues = ";".join(fromClassValues.split(","))

        toValues= ""
        try:
            toClassValues=eval(toClassValues)
        except:
            pass
        if isinstance(toClassValues, list):
            toValues = ";".join(toClassValues)
        elif isinstance(toClassValues, str):
            toValues = ";".join(toClassValues.split(","))

        # Set resampling method
        arcpy.env.resamplingMethod = rasterutils.getResamplingMethod(context)

        # Set parallel processing environment
        moreags = rasterutils._parsecontext(context)
        outsr = rasterutils.getOutSR(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        arcpy.env.recycleProcessingWorkers = rasterutils.getRecycleProcessingWorkers(moreags)
        arcpy.env.retryOnFailures = rasterutils.getRetryOnRandomFailures(moreags)

        uri = ""
        # Execute the Linear Spectral Unmixing tool =====================================
        # if len(funcArgs) > 0:
        arcpy.AddMessage("Executing...")
        arcpy.gp.ComputeChangeRaster_ia(inputFromRaster,
                                        inputToRaster,
                                        outras,
                                        computeChangeMethod,
                                        fromValues,
                                        toValues,
                                        filterMethod,
                                        defineTransitionColors,
                                        fromClassnameField,
                                        toClassnameField)
        arcpy.AddMessage("Finished")
        uri = rasterutils.getURI(arcpy.GetMessages(), outras)
        # else:
        #     arcpy.AddMessage("Invalid input")

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
        arcpy.SetParameterAsText(11, json.dumps(outval))

    except rasterutils.LicenseError as err:
        rasterutils.AddExceptionError(
            TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
