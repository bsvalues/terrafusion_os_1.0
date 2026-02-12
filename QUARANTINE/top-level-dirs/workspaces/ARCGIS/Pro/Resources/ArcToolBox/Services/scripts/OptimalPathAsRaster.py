"""-----------------------------------------------------------------------------
Name:              OptimalPathAsRaster.py
Purpose:           Calculates the optimal path from a source to a destination as a raster.
Author:            Esri Inc.
Created:           2/21/2020
Copyright:   (c)   Esri, Inc. 2020
ArcGIS Version:    10.8.1
-----------------------------------------------------------------------------"""
# core libraries
import json
import os
import time
# internal libraries
import arcpy
import rasterutils
import hostedgp as agolgp
import aolutils
import rendererUtils
import popup

TASK_NAME = 'OptimalPathAsRaster'
ERROR_CODES = []
errorMsgs = {}
startTime=time.time()

if __name__ == '__main__':
    inputDestinationRasterOrFeatures = arcpy.GetParameterAsText(0)
    inputDistanceAccumulationRaster = arcpy.GetParameterAsText(1)
    inputBackDirectionRaster = arcpy.GetParameterAsText(2)
    outputRasterName = arcpy.GetParameterAsText(3)
    destinationField = arcpy.GetParameterAsText(4)
    pathType = arcpy.GetParameterAsText(5)

    # Environment setting
    context = arcpy.GetParameterAsText(6)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # 1. Parse the input parameters
        hostedgp = agolgp.HostedGP(6, 3)
        if rasterutils.checkIfFeatureCollection(inputDestinationRasterOrFeatures):
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputDestinationRasterOrFeatures", 0)
            inputDestinationRasterOrFeatures = Input.name
        else:
            # inputDestinationRasterOrFeatures = rasterutils.getInDataPath(inputDestinationRasterOrFeatures)
            # if isinstance(inputDestinationRasterOrFeatures, dict):
            #     inputDestinationRasterOrFeatures = json.dumps(inputDestinationRasterOrFeatures)
            inputDestinationRasterOrFeatures = rasterutils.getInDataPath(inputDestinationRasterOrFeatures)
            if inputDestinationRasterOrFeatures.find("/FeatureServer/") > -1 \
                    or inputDestinationRasterOrFeatures.find("/MapServer/") > -1:
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputDestinationRasterOrFeatures", 0)
                inputDestinationRasterOrFeatures = Input.name
                InputLayerName = Input.layername
            else:
                if isinstance(inputDestinationRasterOrFeatures, dict):
                    inputDestinationRasterOrFeatures = json.dumps(inputDestinationRasterOrFeatures)


        inputDistanceAccumulationRaster = rasterutils.getInDataPath(inputDistanceAccumulationRaster)
        if isinstance(inputDistanceAccumulationRaster, dict):
            inputDistanceAccumulationRaster = json.dumps(inputDistanceAccumulationRaster)

        inputBackDirectionRaster = rasterutils.getInDataPath(inputBackDirectionRaster)
        if isinstance(inputBackDirectionRaster, dict):
            inputBackDirectionRaster = json.dumps(inputBackDirectionRaster)
        
        # 2. Parse the output raster
        iid, isurl, aisurl, outras = rasterutils.getOutRasterPath(outputRasterName)
        outras = rasterutils.appendcrf(outras)
        arcpy.AddMessage("Output item id is: {0}".format(iid))
        arcpy.AddMessage("Output image service url is: {0}".format(isurl))
        arcpy.AddMessage("Output cloud raster name is: {0}".format(outras))

        # 3. Set GP environment settings
        moreags = rasterutils._parsecontext(context)
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.extent = outext
        arcpy.env.cellSize = rasterutils.getCellsize(context)
        arcpy.env.snapRaster = rasterutils.getSnapRaster(context)
        arcpy.env.mask = rasterutils.getMask(context)
        # Set parallel processing environment
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        arcpy.env.overwriteOutput = 1
        pyramids = rasterutils.getPyramids(context)

        # 4. Execute tool
        arcpy.AddMessage("Running Optimal Path As Raster analysis...")
        arcpy.gp.OptimalPathAsRaster_sa(inputDestinationRasterOrFeatures, inputDistanceAccumulationRaster,
                                        inputBackDirectionRaster, outras, destinationField, pathType)
        msgcount = arcpy.GetMessageCount()
        for n in range(msgcount):
            arcpy.AddMessage("GP message: {0}".format(arcpy.GetMessage(n)))
        # 4. Update output
        # Check if output contains URI
        # 1. If no URI found, return output as is
        # 2. If URI found, update service
        uri = rasterutils.getURI(arcpy.GetMessages(), outras)

        if uri == "":
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

            arcpy.AddMessage("Data store URI: {0}".format(uri))
            # Get federated token to update image service
            token, referer = rasterutils.getToken(isurl)
            # Read and update image service info
            sinfo = rasterutils.getServiceInfo(aisurl, token, referer)
            if sinfo != {}:
                msg = rasterutils.updateSource(aisurl, sinfo, uri, token, referer)
                arcpy.AddMessage(msg)
                # # Update Portal Item properties if necessary
                # imsg = rasterutils.updateItemProperties(iid, outrasjson)
                # arcpy.AddMessage(imsg)
                rasterutils.refreshPortalItem(iid)
            else:
                arcpy.AddWarning("No service updated although data store URI generated.")

        # Set the output with item and image service url
        outval = {"itemId": iid, "url": isurl}
        arcpy.SetParameterAsText(7, json.dumps(outval))

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, err)