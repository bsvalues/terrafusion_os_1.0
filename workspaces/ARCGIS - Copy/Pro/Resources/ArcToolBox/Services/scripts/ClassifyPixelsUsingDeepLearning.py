
"""-----------------------------------------------------------------------------
Name:           ClassifyPixelsUsingDeepLearning.py
Purpose:        Run ClassifyPixelsUsingDeepLearning
Author:         Esri Inc.
Created:        08/08/2018
Copyright:      (c)   Esri, Inc. 2018
ArcGIS Version: 10.7
-----------------------------------------------------------------------------"""
# core libraries
import json
import os
# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'ClassifyPixelsUsingDeepLearning'
ERROR_CODES = []
errorMsgs = {}

if __name__ == '__main__':

    # Input raster can only be:
    # '{"url":"http://a/a/b/imageserver"}',
    # or '{"uri":"http://a/a/b/c"}', 
    # or '{"uri":"/rasterStores/rasterstorename/a/b/c"}', 
    # or '{"uri":"/fileShares/datastorename/a/b/c}', 
    # or '{"uri":"/cloudStores/cloudstorename/a/b/c"}'
    # or '{"itemId":"abcdefghijklmnopqrstuvwxyz"}'
    # for all other input types, call genRas tool directly
    arcpy.CheckOutExtension("Spatial")
    inRas = arcpy.GetParameterAsText(0)
    outras = arcpy.GetParameterAsText(1)
    model = arcpy.GetParameterAsText(2)  
    modelArguments = arcpy.GetParameterAsText(3)  
    processAllRasterItems = arcpy.GetParameter(4)
    context = arcpy.GetParameterAsText(5) 

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # If cannot get Raster Analytics URL, fail right away
        if not rasterutils.RASTER_ANALYTIC_HELPER:
            arcpy.AddError("No Raster Analytics Image Server found.")

        # Get input raster path 
        inras = rasterutils.getInDataPath(inRas)
        if isinstance(inras, dict):
            inras = json.dumps(inras)
        ext = os.path.splitext(inras)[1]

        # Get the output raster from JSON object that may contains ItemID, image service url or CRF
        # Example:
        # {"itemId": "no213u0uiif8924989h98h0123"}
        # {"url": "http://rdvmags02.esri.com/arcgis/rest/services/Hosted/testis"}
        # {"uri": "\\\\rasterqadl\\rasterstore\\a\\b\\c\testis.crf"}
        # {"serviceProperties":{"name":"servicename"}} 
        iid = ""  # Portal item ID
        isurl = ""  # Image Service URL
        aisurl = ""  # Image Service admin URL
        iid, isurl, aisurl, outras = rasterutils.getOutRasterPath(outras)
        if isurl and aisurl:
            token, referer = rasterutils.getToken(isurl)
        else:
            token, referer = rasterutils.getToken(rasterutils.RASTER_ANALYTIC_HELPER)
            aisurl = rasterutils.RASTER_ANALYTIC_HELPER + "/admin/services"

        # Checks for image collection input -- checks begin 
        # Check 1: Check if process mode is set to image collection. If true, output Raster is a mosaic dataset. 
        outIsMD = False
        mdws = ""
        managedrs = ["", ""]
        if processAllRasterItems is True:
            mdws, managedrs = rasterutils.getMosaicWorkspace(aisurl, outras, token)
            outras = os.path.join(mdws, outras)
            outIsMD = True

        # Check 2: Check if input is a folder. If true, output Raster is a mosaic dataset. 
        # Check 2-1: Check if input start with "http" or has file extension. 
        # If true, output raster will be a single raster. 
        elif inras.startswith("http") or ext != "":
            pass

        # Check 2-2: Check if input starts with "/enterpriseDatabases", or the parent path ends with ".gdb". 
        # If true, output Raster is a single raster.
        elif inras.startswith("/enterpriseDatabases") or os.path.dirname(inras).endswith(".gdb"):
            pass

        # Check 2-3: Check if input path is a directory and it does exist. 
        # If true, output raster is a mosaic dataset.     
        elif os.path.isdir(inras) and os.path.exists(inras):
            mdws, managedrs = rasterutils.getMosaicWorkspace(aisurl, outras, token)
            outras = os.path.join(mdws, outras)
            outIsMD = True
        
        # Check 2-4: Check if input is image collection in data store path. 
        # If true, output raster is a mosaic dataset. 
        elif inras.startswith(("/fileShares", "/rasterStores","/cloudStores")):
            dsimgs = arcpy.gp.command("ListDatastore " + inras)
            if isinstance(dsimgs, str):
                dsimgs = eval(dsimgs)

            if dsimgs == "" or len(dsimgs) == 0:
                pass
            elif isinstance(dsimgs, dict):
                contentlist = dsimgs["contentList"]
                if "conf.json" in contentlist:
                    pass
                else:
                    if not outras.startswith("\\"):
                        mdws, managedrs = rasterutils.getMosaicWorkspace(aisurl, outras, token)
                        outras = os.path.join(mdws, outras)
                        outIsMD = True
                    else:
                        pass
            elif isinstance(dsimgs, list):
                if "conf.json" in dsimgs:
                    pass
                else:
                    if not outras.startswith("\\"):
                        mdws, managedrs = rasterutils.getMosaicWorkspace(aisurl, outras, token)
                        outras = os.path.join(mdws, outras)
                        outIsMD = True
                    else:
                        pass
        else:
            pass

        # Parse model input to support the following cases:
        # {"itemId": "<portal item id>"}
        # {"url": "<item url>"}
        # {"uri": "<model definition file path>"}
        # {"<entire JSON of the model definition>"}
        model = rasterutils.getInDataPath(model)

        # Parse model arguments
        modelArgs = ""
        if modelArguments!="":
            try:
                argsdict = json.loads(modelArguments)
                argslist = []
                for arg in argsdict:
                    argslist.append(arg + " " + str(argsdict[arg]))
                    modelArgs = ";".join(argslist)
            except:
                arcpy.AddWarning("Invalid model arguments: {}".format(modelArguments))
                modelArgs = "#"

        if processAllRasterItems is True:
            processAllRasterItems = "PROCESS_ITEMS_SEPARATELY"
        else:
            processAllRasterItems = "PROCESS_AS_MOSAICKED_IMAGE"

        # Add Output Folder parameter internally. It is an optional parameter specifically for image collection input. 
        # It directs to a rasterstore path to hold output classified rasters. 

        if outIsMD and mdws:
            # Construct the output raster store path with image service admin URL.
            # Cloud store takes higher priority over file share for output data location
            cloudstore = rasterutils._getRasterStore(aisurl, token, type="cloud")
            if len(cloudstore) > 1 and cloudstore[1]:
                rasstore = cloudstore[1]
            else:
                rasstore = rasterutils._getRasterStore(aisurl, token, type="fileshare")[0]
            outFolder = rasstore + "/" + os.path.basename(outras)
        else:
            outFolder = ""
            outras = rasterutils.appendcrf(outras)

        moreags = rasterutils._parsecontext(context)
        # Set parallel processing environment
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        arcpy.env.recycleProcessingWorkers = rasterutils.getRecycleProcessingWorkers(moreags)
        arcpy.env.retryOnFailures = rasterutils.getRetryOnRandomFailures(moreags)
        # Set processor type
        if rasterutils.RUN_ON_AGOL:
            arcpy.env.processorType = "GPU"
        else:
            arcpy.env.processorType = rasterutils.getProcessorType(moreags)
        if arcpy.env.processorType == 'GPU':
            arcpy.env.gpuId = -2

        # Set other GP environment settings
        # Note: the spatial reference defined in the extent will be output spatial reference used
        outsr = rasterutils.getOutSR(context)
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.extent = outext
        arcpy.env.snapRaster = rasterutils.getSnapRaster(context)
        arcpy.env.cellSize = rasterutils.getCellsize(context)

        # Execute the Classify Pixels Using Deep Learning tool =====================================
        arcpy.AddMessage("Classifying...")
        result = arcpy.gp.ClassifyPixelsUsingDeepLearning_ia(
            inras, outras, model, modelArgs, processAllRasterItems, outFolder)
        arcpy.AddMessage("Finished")

        # If output is mosaic dataset, the full output path is returned by the tool. 
        if outIsMD and result:
            uri = result.getOutput(0)
        # else the output path is returned by gp messages.
        else:
            uri = rasterutils.getURI(arcpy.GetMessages(), outras)

        # Set the source type of the output classified image to thermatic
        rasterutils.setRasterProperties(uri, {"sourceType": "THEMATIC"})

        # Retrieve the mosaic dataset path when the output mosaick dataset is
        # saved to EGDB raster store
        if outIsMD and os.path.dirname(outras).endswith(".sde"):
            uri = managedrs[1] + "/" + os.path.basename(outras)

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
            # arcpy.AddMessage("sinfo is: {0}".format(sinfo))

            if sinfo:
                # If output is MD, the "Catalog" capability needs to be added. 
                if outIsMD:
                    if "capabilities" in sinfo:
                        cap = sinfo["capabilities"]
                        if cap.lower().find("catalog") < 0:
                            sinfo["capabilities"] = cap + ",Catalog"
                    else:
                        sinfo["capabilities"] = "Image,Catalog"

                # Set default resampling method to NEAREST
                sinfo["defaultResamplingMethod"] = 0

                msg = rasterutils.updateSource(aisurl, sinfo, uri, token, referer)
                arcpy.AddMessage(msg)
                rasterutils.refreshPortalItem(iid)
            else:
                arcpy.AddWarning("The data store URI was generated, but the service was not updated. "
                                 "Either the reference image service does not exist, "
                                 "or there is an error when retrieving the image service information.")

        outval = {"itemId": iid, "url": isurl}
        arcpy.SetParameterAsText(6, json.dumps(outval))

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, "Image Server extension license is required to run this tool.")

    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occurred during service Execution. " + str(err))
