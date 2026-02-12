"""-----------------------------------------------------------------------------
Name:              LocateRegions.py
Purpose:           This is the service tool that performs overlay locateregions analysis
Author:            Esri Inc.
Created:           7/16/2021
Copyright:   (c)   Esri, Inc. 2021
ArcGIS Version:    10.9.1
-----------------------------------------------------------------------------"""
# core libraries
import json

# internal libraries
import arcpy
import rasterutils
import hostedgp as agolgp
import aolutils

TASK_NAME = 'LocateRegions'
ERROR_CODES = []
errorMsgs = {}

if __name__ == '__main__':

    in_raster = arcpy.GetParameterAsText(0)
    output_name = arcpy.GetParameterAsText(1)
    total_area = arcpy.GetParameterAsText(2)
    area_units = arcpy.GetParameterAsText(3)
    number_of_regions = arcpy.GetParameterAsText(4)
    region_shape = arcpy.GetParameterAsText(5)
    region_orientation = arcpy.GetParameterAsText(6)
    shape_tradeoff = arcpy.GetParameterAsText(7)
    evaluation_method = arcpy.GetParameterAsText(8)
    minimum_area = arcpy.GetParameterAsText(9)
    maximum_area = arcpy.GetParameterAsText(10)
    minimum_distance = arcpy.GetParameterAsText(11)
    maximum_distance = arcpy.GetParameterAsText(12)
    distance_units = arcpy.GetParameterAsText(13)
    in_existing_regions = arcpy.GetParameterAsText(14)
    number_of_neighbors = arcpy.GetParameterAsText(15)
    no_islands = arcpy.GetParameterAsText(16)
    region_seeds = arcpy.GetParameterAsText(17)
    region_resolution = arcpy.GetParameterAsText(18)
    selection_method = arcpy.GetParameterAsText(19)
    context = arcpy.GetParameterAsText(20)


    
    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # 1. Parse input raster parameters
        in_raster = rasterutils.getInDataPath(in_raster)
        if isinstance(in_raster, dict):
            in_raster = json.dumps(in_raster)

        # For feature collection, use hostedgp
        hostedgp = agolgp.HostedGP(20, 1)  # a description of the input / output data
        if rasterutils.checkIfFeatureCollection(in_existing_regions):
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "in_existing_regions", 14)
            in_existing_regions = Input.name
        # Now parsing the input raster
        else:
            in_existing_regions = rasterutils.getInDataPath(in_existing_regions)
            if in_existing_regions.find("/FeatureServer/") > -1 \
                    or in_existing_regions.find("/MapServer/") > -1:
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "in_existing_regions", 14)
                in_existing_regions = Input.name
            else:
                if isinstance(in_existing_regions, dict):
                    in_existing_regions = json.dumps(in_existing_regions)
        
        # Parse output raster parameters
        iid, isurl, aisurl, output_name = rasterutils.getOutRasterPath(output_name)
        output_name = rasterutils.appendcrf(output_name)
        arcpy.AddMessage("Output surface item id is: {0}".format(iid))
        arcpy.AddMessage("Output surface image service url is: {0}".format(isurl))
        arcpy.AddMessage("Output surface cloud raster name is: {0}".format(output_name))


        # 2. Parse environment settings:
        moreags = rasterutils._parsecontext(context)
        outsr = rasterutils.getOutSR(context)
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.extent = outext
        arcpy.env.cellSize = rasterutils.getCellsize(context)
        arcpy.env.snapRaster = rasterutils.getSnapRaster(context)
        arcpy.env.mask = rasterutils.getMask(context)
        # Set parallel processing environment
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        arcpy.env.overwriteOutput = 1

        pyramids = rasterutils.getPyramids(context)

        # TODO: add some more validation logic here, and ERROR code
        # 3. Run the tool
        arcpy.gp.LocateRegions_sa(in_raster, output_name, total_area, area_units, number_of_regions,
                                  region_shape, region_orientation, shape_tradeoff, evaluation_method,
                                  minimum_area, maximum_area, minimum_distance, maximum_distance,
                                  distance_units, in_existing_regions, number_of_neighbors, no_islands,
                                  region_seeds, region_resolution, selection_method)
        msgcount = arcpy.GetMessageCount()
        for n in range(msgcount):
            arcpy.AddMessage("GP message: {0}".format(arcpy.GetMessage(n)))
        # Update output ========================================================
        # Check if output contains URI
        # 1. If no URI found, return output as is
        # 2. If URI found, update service

        uri = rasterutils.getURI(arcpy.GetMessages(), output_name)
        
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
        arcpy.SetParameterAsText(21, json.dumps(outval))

    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME,err)

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))
