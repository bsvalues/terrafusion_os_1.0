"""-----------------------------------------------------------------------------
Name:           SegmentMeanShift.py
Purpose:        Run segmentation in parallel
Author:         Esri Inc.
Created:        07/15/2016
Copyright:      (c)   Esri, Inc. 2014
ArcGIS Version: 10.5
-----------------------------------------------------------------------------"""
# core libraries
import json
import os

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'Segment'


if __name__ == '__main__':

    inData = arcpy.GetParameterAsText(0)  # Input raster or raster function template to be segmented
    outras = arcpy.GetParameterAsText(1)  # Output raster (required): item id, url, uri
    specDtl = arcpy.GetParameterAsText(2)  # Spectral detail (optional): double e.g. 15.5
    spaDtl = arcpy.GetParameterAsText(3)  # Spatial detail (optional): integer e.g. 15
    minSegSz = arcpy.GetParameterAsText(4)  # Minimum segment size (optional): integer e.g. 20
    bndIdx = arcpy.GetParameterAsText(5)  # Band index (optional): string, e.g. 1,2,3
    rmvTiling = arcpy.GetParameter(6)  # If set to 'false' or '0', will not run remove tiling artifact tool. Otherwise, run the tool.
    context = arcpy.GetParameterAsText(7)  # Number of instances: integer e.g. 10

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # 1. Parase output segmented raster
        iid, isurl, aisurl, outras = rasterutils.getOutRasterPath(outras)
        outras = rasterutils.appendcrf(outras)
        # arcpy.AddMessage(outras)

        # 2. Parse input raster into Segment Mean Shift raster function

        inRas = rasterutils.getInDataPath(inData)
        arcpy.AddMessage(str(inRas))
        # Need to check whether the input Raster is already a raster function template
        # If nothing is returned from getInDataPath, then we will need to pass down as is.
        # Because it could be a complete function chain.
        if not inRas:
            inRft = inData
        else:
            # If input has renderingRule and mosaicRule, it will be a dictionary
            if isinstance(inRas, dict):
                inRas = json.dumps(inRas)

            # Parse band index
            bndIdx = bndIdx.split(",")
            # Define segment mean shift function
            inRft = {
                "rasterFunction": "SegmentMeanShift",
                "rasterFunctionArguments": {
                    "SpectralDetail": specDtl,
                    "SpatialDetail": spaDtl,
                    "MinNumPixelsPerSegment": minSegSz,
                    "Raster": {
                        "rasterFunction": "ExtractBand",
                        "rasterFunctionArguments": {
                            "BandIDs": bndIdx,
                            "Raster": inRas
                        }
                    }
                }
            }
            inRft = json.dumps(inRft)
        # Define additional keymetadata
        rasprops = '{"Segmented": 1}'

        # 3. Parse supported GP environment settings
        # Parse extent and spatial reference
        outsr = rasterutils.getOutSR(context)
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.extent = outext

        # Set resampling method, cell size, snap raster
        arcpy.env.resamplingMethod = rasterutils.getResamplingMethod(context)
        arcpy.env.cellSize = rasterutils.getCellsize(context)
        arcpy.env.snapRaster = rasterutils.getSnapRaster(context)

        # Set parallel processing environment
        moreags = rasterutils._parsecontext(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        arcpy.env.recycleProcessingWorkers = rasterutils.getRecycleProcessingWorkers(moreags)
        arcpy.env.retryOnFailures = rasterutils.getRetryOnRandomFailures(moreags)

        # 4. Generate segment raster
        uri = ""
        # Use Generate Raster tool with Segment Mean Shift function ============
        arcpy.AddMessage("Segmenting image...")
        if not rmvTiling:
            # No requirement to remove tiling effect
            arcpy.management.GenerateRasterFromRasterFunction(
                inRft, outras, raster_properties=rasprops, format="CRF")
            uri = rasterutils.getURI(arcpy.GetMessages(), outras)
            arcpy.AddMessage(uri)
        else:
            # Remvoe tiling artifacts
            tiledras = os.path.splitext(outras)[0] + "_tiled.crf"
            result = arcpy.management.GenerateRasterFromRasterFunction(
                inRft, tiledras, raster_properties=rasprops, format="CRF")
            tileduri = rasterutils.getURI(arcpy.GetMessages(), tiledras)
            # arcpy.AddMessage(result.getOutput(0))
            if tileduri:
                arcpy.AddMessage("Removing tiling artifacts...")
                arcpy.gp.RemoveRasterSegmentTilingArtifacts_ia(
                    tileduri, outras, "512", "512")
                uri = rasterutils.getURI(arcpy.GetMessages(), outras)
                # Note: Delete tool should be able to delete raster dataset from cloud storage
                arcpy.Delete_management(tileduri)
            else:
                arcpy.AddError("Cannot generate segmented raster output.")

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
                rasterutils.refreshPortalItem(iid)
            else:
                arcpy.AddWarning("No service updated although data store URI generated.")

        outval = {"itemId": iid, "url": isurl}
        arcpy.SetParameterAsText(8, json.dumps(outval))

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, "Image Analyst license is unavailable.")

    except arcpy.ExecuteError as err:
        rasterutils.AddExceptionError(TASK_NAME, arcpy.GetMessages())

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
