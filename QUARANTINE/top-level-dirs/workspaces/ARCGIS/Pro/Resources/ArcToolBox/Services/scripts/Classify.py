
"""-----------------------------------------------------------------------------
Name:           Classify.py
Purpose:        Run classification in parallel
Author:         Esri Inc.
Created:        07/15/2016
Copyright:      (c)   Esri, Inc. 2014
ArcGIS Version: 10.5
-----------------------------------------------------------------------------"""
# core libraries
import json

# internal libraries
import arcpy
import hostedgp as hgp
import rasterutils

TASK_NAME = 'Classify'


if __name__ == '__main__':

    inData = arcpy.GetParameterAsText(0)
    ecd = arcpy.GetParameterAsText(1)  # ecd training signature JSON
    outras = arcpy.GetParameterAsText(2)  # output raster
    inRas2 = arcpy.GetParameterAsText(3)  # input raster 2, same format as input raster, but assumed to be segmented
    context = arcpy.GetParameterAsText(4)  # additional environment settings honored by the tool

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # 1. Get the output raster from JSON object that may contains ItemId, image service url or CRF
        iid, isurl, aisurl, outras = rasterutils.getOutRasterPath(outras)
        outras = rasterutils.appendcrf(outras)
        # arcpy.AddMessage("Output item id is: {0}".format(iid))
        # arcpy.AddMessage("Output image service url is: {0}".format(isurl))
        # arcpy.AddMessage("Output cloud raster name is: {0}".format(outras))

        # 2. Parse input raster
        inRas = rasterutils.getInDataPath(inData)
        inRas2 = rasterutils.getInDataPath(inRas2)
        # If input has renderingRule and mosaicRule, it will be a dictionary
        if isinstance(inRas, dict):
            inRas = json.dumps(inRas)
        if isinstance(inRas2, dict):
            inRas2 = json.dumps(inRas2)

        hosted_gp = hgp.HostedGP(4, None)
        try:
            out_dict = rasterutils._parsecontext(ecd)
            if "itemId" in out_dict:
                item_details = hosted_gp.GetItem(out_dict["itemId"])
                if item_details["type"].lower() == "esri classifier definition":
                    ecd = rasterutils.getDataFromItem(out_dict)
            ecd = json.loads(ecd)
        except:
            pass


        # 3. Define classify raster function for distributed processing
        if not inRas:
            classifyrft = inData
        else:
            classifyrft = {
                "rasterFunction": "Classify",
                "rasterFunctionArguments": {
                    "ClassifierDefinition": ecd,
                    "Raster": inRas,
                    "Raster2": inRas2
                }
            }
            classifyrft = json.dumps(classifyrft)
        rasprops = '{"DataType": "Thematic"}'

        # 4. Parse GP environment setting honored by this tool
        outsr = rasterutils.getOutSR(context)
        # Note: the extent must always be in input raster's projection
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.extent = outext
        # arcpy.AddMessage("Output coordinate system: {}".format(outsr))
        # arcpy.AddMessage("Output extent: {}".format(outext))

        # Set output pixel size, resampling method and snap raster
        arcpy.env.resamplingMethod = rasterutils.getResamplingMethod(context)
        arcpy.env.cellSize = rasterutils.getCellsize(context)
        arcpy.env.snapRaster = rasterutils.getSnapRaster(context)
        # Set parallel processing environment
        moreags = rasterutils._parsecontext(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        arcpy.env.recycleProcessingWorkers = rasterutils.getRecycleProcessingWorkers(moreags)
        arcpy.env.retryOnFailures = rasterutils.getRetryOnRandomFailures(moreags)

        # Set process as multidimensional option
        asmd = "ALL_SLICES"
        if "processAsMultidimensional" in moreags:
            asmd = moreags["processAsMultidimensional"]
            if type(asmd) == bool and not asmd:
                asmd = "CURRENT_SLICE"
            else:
                asmd = "ALL_SLICES"

        # Execute the Generate Raster tool =====================================
        arcpy.AddMessage("Classifying...")
        arcpy.management.GenerateRasterFromRasterFunction(
            classifyrft, outras, raster_properties=rasprops, format="CRF", process_as_multidimensional=asmd)
        arcpy.AddMessage("Finished")
        uri = rasterutils.getURI(arcpy.GetMessages(), outras)

        # Update output ========================================================
        # Check if output contains URI
        # 1. If no URI found, return output as is
        # 2. If URI found, update service
        if not uri:
            arcpy.AddMessage("No data store URI returned.")
        else:
            arcpy.AddMessage("Updating service with data store URI.")
            # Get federated token to update image service
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
        arcpy.SetParameterAsText(5, json.dumps(outval))

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, "Image Analyst license is unavailable.")

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
