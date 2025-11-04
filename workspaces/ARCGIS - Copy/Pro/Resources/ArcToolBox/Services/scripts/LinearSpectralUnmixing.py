
"""-----------------------------------------------------------------------------
Name:           LinearSpectralUnmixing.py
Purpose:        Run Linear Spectral Unmixing
Author:         Esri Inc.
Created:        07/31/2019
Copyright:      (c)   Esri, Inc. 2019
ArcGIS Version: 10.8
-----------------------------------------------------------------------------"""
# core libraries
import json

# internal libraries
import arcpy
import hostedgp as hgp
import rasterutils

TASK_NAME = 'LinearSpectralUnmixing'


def _parsevalueOption(valueOption):
    return_list = []
    valueOptionAllowedValues = ['SUM_TO_ONE', 'NON_NEGATIVE']
    for element in valueOptionAllowedValues:
        for ele in valueOption:
            if ele.upper() == element:
                return_list.append(element)
    return return_list


if __name__ == '__main__':

    # Input raster can only be:
    # '{"url":"http://a/a/b/imageserver"}',
    # or '{"uri":"http://a/a/b/c"}',
    # or '{"itemId":"abcdefghijklmnopqrstuvwxyz"}'
    # for all other input types, call genRas tool directly
    inRas = arcpy.GetParameterAsText(0)
    outras = arcpy.GetParameterAsText(1)  # Output raster (optional): item id, url, uri
    ecd = arcpy.GetParameterAsText(2)  #
    valueOption = arcpy.GetParameterAsText(3)  # input raster 2, same format as input raster, but assumed to be segmented
    context = arcpy.GetParameterAsText(4) # Number of instances: integer e.g. 10

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


        inRas = rasterutils.getInDataPath(inRas)
        if isinstance(inRas, dict):
            inRas = json.dumps(inRas)

        hosted_gp = hgp.HostedGP(4, None)
        out_dict = rasterutils._parsecontext(ecd)
        if "itemId" in out_dict:
            item_details = hosted_gp.GetItem(out_dict["itemId"])
            if item_details["type"].lower() == "esri classifier definition":
                ecd = rasterutils.getDataFromItem(out_dict)
        else:
            ecd = rasterutils.getInDataPath(ecd)

        # Parse valueOption 
        valueOpt= ""
        try:
            valueOption=eval(valueOption)
        except:
            pass
        if isinstance(valueOption, list):
            valueOpt = ";".join(_parsevalueOption(valueOption))
        elif isinstance(valueOption, str):
            valueOpt = ";".join(_parsevalueOption(valueOption.split(",")))

        # Set resampling method
        arcpy.env.resamplingMethod = rasterutils.getResamplingMethod(context)

        # Set parallel processing environment
        moreags = rasterutils._parsecontext(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        arcpy.env.recycleProcessingWorkers = rasterutils.getRecycleProcessingWorkers(moreags)
        arcpy.env.retryOnFailures = rasterutils.getRetryOnRandomFailures(moreags)

        uri = ""
        # Execute the Linear Spectral Unmixing tool =====================================
        # if len(funcArgs) > 0:
        arcpy.AddMessage("Executing...")
        arcpy.gp.LinearSpectralUnmixing_ia(inRas, outras, ecd,valueOption)
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
        arcpy.SetParameterAsText(5, json.dumps(outval))

    except rasterutils.LicenseError as err:
        rasterutils.AddExceptionError(
            TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
