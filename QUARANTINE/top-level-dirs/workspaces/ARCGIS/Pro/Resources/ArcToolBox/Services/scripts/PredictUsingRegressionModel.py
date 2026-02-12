"""-----------------------------------------------------------------------------
Name:           PredictUsingRegressionModel.py
Purpose:        Predict raster using regression model
Author:         Esri Inc.
Created:        05/25/2021
Copyright:      (c)   Esri, Inc. 2021
ArcGIS Version: 10.9.1
-----------------------------------------------------------------------------"""
# core libraries
from datetime import datetime
import json
import os
import sys
import zipfile

# internal libraries
import arcpy
import hostedgp as hgp
import rasterutils

TASK_NAME = 'PredictUsingRegressionModel'

if __name__ == '__main__':
    
    inputRasters              = arcpy.GetParameterAsText(0)  # Input image service(s) to be trained on.
                                                             # e.g. {"url": "http://a/a/b/imageserver"}; 
                                                             #      {"urls": ["http://a/a/b/imageserver", "http://a/a/c/imageserver"]} 
                                                             # or   {"uri": "http://a/a/b/imageserver"};
                                                             #      {"uris": ["http://a/a/b/imageserver", "http://a/a/c/imageserver"]}
                                                             # or   {"itemId": "abcdefghijklmnopqrstuvwxyz"}
                                                             #      {"itemIds": ["abcdefghijklmnopqrstuvwxyz", "zyxwvutsrqponmlkjihgfedcba"]}
    inputRegressionDefinition = arcpy.GetParameterAsText(1)  # ecd regression definition JSON or file.
    outputPredictedRaster     = arcpy.GetParameterAsText(2)
    context                   = arcpy.GetParameterAsText(3)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # 1. Get the output raster from JSON object that may contains ItemId, image service url or CRF
        iid, isurl, aisurl, outputPredictedRaster = rasterutils.getOutRasterPath(outputPredictedRaster)
        outputPredictedRaster = rasterutils.appendcrf(outputPredictedRaster)

        # 2. Parse the input parameters
        byref, ismosaic, inputRasters, allbyref = rasterutils.getHostedDataPath(inputRasters)
        if inputRasters:
            arcpy.AddMessage(f"Input rasters are: {inputRasters}")
        else:
            arcpy.AddError("Could not get input rasters.")

        hosted_gp = hgp.HostedGP(3, None)

        # Get path to the temp file which will contain the regression model.
        ecd_file = ""
        out_dict = rasterutils._parsecontext(inputRegressionDefinition)
        if "uri" in out_dict:
            datastore_path = out_dict["uri"]
            file_name = os.path.basename(datastore_path)
            file_extension = os.path.splitext(file_name)[1]
            if file_extension != ".ecd":
                arcpy.AddError("Incorrect file type. Please provide an ECD file.")
                sys.exit(1)
            if datastore_path.startswith(("/fileShares", "/rasterStores")):
                ecd_file = rasterutils._lookupdatastorepath(datastore_path)
            elif datastore_path.startswith("/cloudStores"):
                temp_folder = arcpy.env.scratchFolder
                arcpy.management.TransferFiles(datastore_path, temp_folder, '')
                ecd_file = os.path.join(temp_folder, file_name)
            else:
                arcpy.AddError("Invalid data store path.")
                sys.exit(1)
        elif "itemId" in out_dict:
            item_details = hosted_gp.GetItem(out_dict["itemId"])
            if item_details["type"].lower() == "code sample":
                ecd_zip_file = rasterutils.getDataFromItem(out_dict, True)
                temp_folder = arcpy.env.scratchFolder
                try:
                    with zipfile.ZipFile(ecd_zip_file, 'r') as zip_file:
                        zip_file.extractall(temp_folder)
                except Exception:
                    arcpy.AddError("Could not extract file.")
                for file in os.listdir(temp_folder):
                    if file.endswith(".ecd"):
                        ecd_file = os.path.join(temp_folder, file)
            elif item_details["type"].lower() == "esri classifier definition":
                ecd_file = rasterutils.getDataFromItem(out_dict, True)
            # Raise an error if incorrect type supplied.
            else:
                arcpy.AddError("Incorrect portal item specified. Please pass either an item of type ECD or Code Sample.")
                sys.exit(1)
        else:
            inputRegressionDefinition = json.loads(inputRegressionDefinition)
            temp_folder = arcpy.env.scratchFolder
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            ecd_file = os.path.join(temp_folder, "input_regression_definition_" + timestamp + ".ecd")
            with open(ecd_file, 'w') as file:
                json.dump(inputRegressionDefinition, file)

        # 3. Parse GP environment setting honored by this tool
        outsr = rasterutils.getOutSR(context)
        # Note: the extent must always be in input raster's projection
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.extent = outext

        # Set output pixel size, resampling method and snap raster
        arcpy.env.resamplingMethod = rasterutils.getResamplingMethod(context)
        arcpy.env.cellSize = rasterutils.getCellsize(context)
        arcpy.env.cellAlignment = rasterutils.getCellAlignment(context)
        arcpy.env.snapRaster = rasterutils.getSnapRaster(context)

        # Set parallel processing environment
        moreags = rasterutils._parsecontext(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        arcpy.env.recycleProcessingWorkers = rasterutils.getRecycleProcessingWorkers(moreags)
        arcpy.env.retryOnFailures = rasterutils.getRetryOnRandomFailures(moreags)

        # Execute the Predict tool ===========================================================
        arcpy.AddMessage("Predicting...")
        arcpy.gp.PredictUsingRegressionModel_ia(inputRasters,
                                            ecd_file,
                                            outputPredictedRaster)
        arcpy.AddMessage("Finished.")
        uri = rasterutils.getURI(arcpy.GetMessages(), outputPredictedRaster)

        # Update output ======================================================================
        # Check if output contains URI
        # 1. If no URI found, return output as is
        # 2. If URI found, update service
        if not uri:
            arcpy.AddMessage("No data store URI returned.")
        else:
            arcpy.AddMessage("Updating service with data store URI.")
            # Get federated token to update image service
            token, referrer = rasterutils.getToken(isurl)
            #  Read and update image service info
            sinfo = rasterutils.getServiceInfo(aisurl, token, referrer)
            if sinfo != {}:
                msg = rasterutils.updateSource(aisurl, sinfo, uri, token, referrer)
                arcpy.AddMessage(msg)
                rasterutils.refreshPortalItem(iid)
            else:
                arcpy.AddWarning("No service updated although data store URI generated.")

        outval = {"itemId": iid, "url": isurl}
        arcpy.SetParameterAsText(4, json.dumps(outval))

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, "Image Analyst license is unavailable.")

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
