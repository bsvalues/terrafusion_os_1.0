"""-----------------------------------------------------------------------------
Name:              DistanceAllocation.py
Purpose:           Calculates distance allocation for each cell to the provided 
                   sources based on straight-line distance, cost distance, true 
                   surface distance, as well as vertical and horizontal cost 
                   factors. 
Author:            Esri Inc.
Created:           2/24/2020
Copyright:   (c)   Esri, Inc. 2020
ArcGIS Version:    10.8.1
-----------------------------------------------------------------------------"""
# core libraries
import json
import os
import time

# internal libraries
import arcpy
import hostedgp as agolgp
import aolutils
import rasterutils
import rendererUtils
import popup

TASK_NAME = 'DistanceAllocation'
ERROR_CODES = []
errorMsgs = {}
startTime = time.time()

if __name__ == '__main__':
    inputSourceRasterOrFeatures = arcpy.GetParameterAsText(0)
    sourceField = arcpy.GetParameterAsText(1)
    outputDistanceAllocationRasterName = arcpy.GetParameterAsText(2)
    inputBarrierRasterOrFeatures = arcpy.GetParameterAsText(3)
    inputSurfaceRaster = arcpy.GetParameterAsText(4)
    inputCostRaster = arcpy.GetParameterAsText(5)
    inputVerticalRaster = arcpy.GetParameterAsText(6)
    verticalFactor = arcpy.GetParameterAsText(7)
    inputHorizontalRaster = arcpy.GetParameterAsText(8)
    horizontalFactor = arcpy.GetParameterAsText(9)
    outputDistanceAccumulationRasterName = arcpy.GetParameterAsText(10)
    outputBackDirectionRasterName = arcpy.GetParameterAsText(11)
    outputSourceDirectionRasterName = arcpy.GetParameterAsText(12)
    outputSourceLocationRasterName = arcpy.GetParameterAsText(13)
    sourceInitialAccumulation = arcpy.GetParameterAsText(14)
    sourceMaximumAccumulation = arcpy.GetParameterAsText(15)
    sourceCostMultiplier = arcpy.GetParameterAsText(16)
    sourceDirection = arcpy.GetParameterAsText(17)
    distanceMethod = arcpy.GetParameterAsText(18)

    # Environment setting
    context = arcpy.GetParameterAsText(19)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # 1. Parse the input parameters
        hostedgp = agolgp.HostedGP(19, 2)
        if rasterutils.checkIfFeatureCollection(inputSourceRasterOrFeatures):
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputSourceRasterOrFeatures", 0)
            inputSourceRasterOrFeatures = Input.name
        else:
            # inputSourceRasterOrFeatures = rasterutils.getInDataPath(inputSourceRasterOrFeatures)
            # if isinstance(inputSourceRasterOrFeatures, dict):
            #     inputSourceRasterOrFeatures = json.dumps(inputSourceRasterOrFeatures)
            inputSourceRasterOrFeatures = rasterutils.getInDataPath(inputSourceRasterOrFeatures)
            if inputSourceRasterOrFeatures.find("/FeatureServer/") > -1 \
                    or inputSourceRasterOrFeatures.find("/MapServer/") > -1:
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputSourceRasterOrFeatures", 0)
                inputSourceRasterOrFeatures = Input.name
                InputLayerName = Input.layername
            else:
                if isinstance(inputSourceRasterOrFeatures, dict):
                    inputSourceRasterOrFeatures = json.dumps(inputSourceRasterOrFeatures)
            
        if rasterutils.checkIfFeatureCollection(inputBarrierRasterOrFeatures):
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputBarrierRasterOrFeatures", 3)
            inputBarrierRasterOrFeatures = Input.name
        else:
            # inputBarrierRasterOrFeatures = rasterutils.getInDataPath(inputBarrierRasterOrFeatures)
            # if isinstance(inputBarrierRasterOrFeatures, dict):
            #     inputBarrierRasterOrFeatures = json.dumps(inputBarrierRasterOrFeatures)
            inputBarrierRasterOrFeatures = rasterutils.getInDataPath(inputBarrierRasterOrFeatures)
            if inputBarrierRasterOrFeatures.find("/FeatureServer/") > -1 \
                    or inputBarrierRasterOrFeatures.find("/MapServer/") > -1:
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputBarrierRasterOrFeatures", 3)
                inputBarrierRasterOrFeatures = Input.name
                startTime = aolutils.AddTimerMessage(startTime, "Get Input Layer")
                layerPath = arcpy.Describe(inputBarrierRasterOrFeatures).catalogPath
            else:
                if isinstance(inputBarrierRasterOrFeatures, dict):
                    inputBarrierRasterOrFeatures = json.dumps(inputBarrierRasterOrFeatures)

        inputSurfaceRaster = rasterutils.getInDataPath(inputSurfaceRaster)
        if isinstance(inputSurfaceRaster, dict):
            inputSurfaceRaster = json.dumps(inputSurfaceRaster)

        inputCostRaster = rasterutils.getInDataPath(inputCostRaster)
        if isinstance(inputCostRaster, dict):
            inputCostRaster = json.dumps(inputCostRaster)

        inputVerticalRaster = rasterutils.getInDataPath(inputVerticalRaster)
        if isinstance(inputVerticalRaster, dict):
            inputVerticalRaster = json.dumps(inputVerticalRaster)

        inputHorizontalRaster = rasterutils.getInDataPath(inputHorizontalRaster)
        if isinstance(inputHorizontalRaster, dict):
            inputHorizontalRaster = json.dumps(inputHorizontalRaster)

        # 2. Parse the output raster (multiple output)
        iid_list, isurl_list, aisurl_list, outputpath_list = [], [], [], []
        output_list = [outputDistanceAllocationRasterName, outputDistanceAccumulationRasterName, 
                       outputBackDirectionRasterName, outputSourceDirectionRasterName, outputSourceLocationRasterName]

        for output in output_list:

            if output != "" and output != None and output != "#":
                iid, isurl, aisurl, outputpath = rasterutils.getOutRasterPath(output)
                outputpath = rasterutils.appendcrf(outputpath)
                arcpy.AddMessage("Output item id is: {0}".format(iid))
                arcpy.AddMessage("Output image service url is: {0}".format(isurl))
                arcpy.AddMessage("Output cloud raster name is: {0}".format(outputpath))
            else:
                iid, isurl, aisurl, outputpath = None, None, None, None

            iid_list.append(iid)
            isurl_list.append(isurl)
            aisurl_list.append(aisurl)
            outputpath_list.append(outputpath)

        # 3. Set GP environment settings
        moreags = rasterutils._parsecontext(context)
        outsr = rasterutils.getOutSR(context)
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.extent = outext
        arcpy.AddMessage("Output coordinate system: {}".format(outsr))
        arcpy.AddMessage("Output extent: {}".format(outext))
        arcpy.env.cellSize = rasterutils.getCellsize(context)
        arcpy.env.mask = rasterutils.getMask(context)
        arcpy.env.snapRaster = rasterutils.getSnapRaster(context)
        # Set parallel processing environment
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        arcpy.env.overwriteOutput = 1
        pyramids = rasterutils.getPyramids(context)

        # 4. Execute tool
        arcpy.AddMessage("Running Distance Allocation Raster analysis...")
        arcpy.gp.DistanceAllocation_sa(inputSourceRasterOrFeatures, outputpath_list[0],
                                       inputBarrierRasterOrFeatures, inputSurfaceRaster, inputCostRaster,
                                       inputVerticalRaster, verticalFactor, inputHorizontalRaster, horizontalFactor,
                                       outputpath_list[1], outputpath_list[2], outputpath_list[3], outputpath_list[4],
                                       sourceField, sourceInitialAccumulation,
                                       sourceMaximumAccumulation, sourceCostMultiplier, sourceDirection, distanceMethod)
        
        # 5. Update output
        # Check if output contains URI
        # 1. If no URI found, return output as is
        # 2. If URI found, update service
        
        # Handle multiple output
        uris = []
        msgcount = arcpy.GetMessageCount()
        for n in range(msgcount):
            uri = rasterutils.getURI(arcpy.GetMessage(n))
            arcpy.AddMessage("GP message: {0}".format(arcpy.GetMessage(n)))
            if uri == "":
                continue
            else:
                uris.append(uri)
        # Use output path as is for AGOL
        if rasterutils.RUN_ON_AGOL:
            uri_list = outputpath_list
        else:
            # Format uris based on output availability
            uri_list = []
            for output in output_list:
                if output != "" and output != None and output != "#":
                    uri_list.append(uris.pop(0))
                else:
                    uri_list.append("")
        output_names = ["Output Distance Allocation", "Output Distance Accumulation", "Output Back Direction", 
                        "Output Source Direction", "Output Source Location"]
        output_indices = [20, 21, 22, 23, 24]
        for idx, uri in enumerate(uri_list):
            if uri == "" or uri is None:
                arcpy.AddMessage("No data store URI returned.")
            else:
                if not pyramids:
                    if rasterutils.checkPyramids(uri):
                        arcpy.AddMessage("Pyramids are existing.")
                    else:
                        arcpy.BuildPyramids_management(uri, "-1", "NONE", "NEAREST", "DEFAULT", "", "OVERWRITE")
                        arcpy.AddMessage("Pyramids settings were not specified. Building pyramids by default.")
                else:
                    if pyramids['pyramid_option']:
                        if pyramids['pyramid_option'] == "PYRAMIDS":
                            arcpy.BuildPyramids_management(uri, pyramids['levels'], pyramids['skip_first'],
                                                           pyramids['interpolation_type'],
                                                           pyramids['pyramid_compression'],
                                                           pyramids['compression_quality'],
                                                           pyramids['skip_existing'])
                            arcpy.AddMessage("Building pyramids based on specified environment settings from context.")
                        else:
                            arcpy.AddMessage("No pyramids built because pyramid_option is None or an incorrect word")
                    else:
                        arcpy.AddMessage("No pyramids built because pyramid_option is undefined")

                arcpy.AddMessage("Updating service with data store URI for {}.".format(output_names[idx]))
                # Get federated token to update image service
                token, referer = rasterutils.getToken(isurl_list[idx])
                # Read and update image service info
                sinfo = rasterutils.getServiceInfo(aisurl_list[idx], token, referer)
                newinfo = {
                    "properties": {
                        "path": uri
                    }
                }
                # Use nearest resampling as default for Distance Allocation and Source Location output
                if output_names[idx] in ["Output Distance Allocation", "Output Source Location"]:
                    newinfo["properties"]["defaultResamplingMethod"] = 0
                    
                if sinfo != {}:
                    # msg = rasterutils.updateSource(aisurl_list[idx], sinfo, uri, token, referer)
                    msg = rasterutils.updateService(aisurl_list[idx], sinfo, newinfo, token, referer)
                    arcpy.AddMessage(msg)
                    rasterutils.refreshPortalItem(iid_list[idx])
                else:
                    arcpy.AddWarning("No service updated although data store URI generated.")

                # Set the output with item and image service url
                outval = {"itemId": iid_list[idx], "url": isurl_list[idx]}
                arcpy.SetParameterAsText(output_indices[idx], json.dumps(outval))

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, err)
