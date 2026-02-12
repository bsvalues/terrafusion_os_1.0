"""-----------------------------------------------------------------------------
Name:              FlowDirection.py
Purpose:           This is the service tool that performs hydrology flowdirection analysis
Author:            Esri Inc.
Created:           7/27/2017
Copyright:   (c)   Esri, Inc. 2017
ArcGIS Version:    10.6
-----------------------------------------------------------------------------"""
# core libraries
import json

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'FlowDirection'
ERROR_CODES = []
errorMsgs = {}

# Define default rendering for output
outputItemPropertyTemplate = {
    "itemProperties": {
        "itemText": {
            "visibility": True,
            "interpolation": "RSP_NearestNeighbor",
            "popupInfo": {"title": "ImageLayer", "fieldInfos": [
                {"fieldName": "Raster.ServicePixelValue",
                 "label": "Service Pixel Value",
                 "isEditable": False, "isEditableOnLayer": False,
                 "visible": True,
                 "format": {"places": 2, "digitSeparator": True}}],
                          "description": None,
                          "showAttachments": False,
                          "layerOptions": {
                              "showNoDataRecords": True},
                          "mediaInfos": []}
        }
    }
}


if __name__ == '__main__':

    insurf = arcpy.GetParameterAsText(0)
    outsurf = arcpy.GetParameterAsText(1)
    forceflow = arcpy.GetParameterAsText(2)
    flowtype = arcpy.GetParameterAsText(3)
    outdrop = arcpy.GetParameterAsText(4)
    context = arcpy.GetParameterAsText(5)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # 1. Parse input raster parameters
        insurf = rasterutils.getInDataPath(insurf)
        if isinstance(insurf, dict):
            insurf = json.dumps(insurf)
        
        # 2. Parse output raster parameters
        iid, isurl, aisurl, outsurf = rasterutils.getOutRasterPath(outsurf)
        if rasterutils.RUN_ON_AGOL:
            filename = outsurf.split('/')[-1]
        else:
            filename = outsurf
        outsurf = rasterutils.appendcrf(outsurf)
        arcpy.AddMessage("Output surface item id is: {0}".format(iid))
        arcpy.AddMessage("Output surface image service url is: {0}".format(isurl))
        arcpy.AddMessage("Output surface cloud raster name is: {0}".format(outsurf))

        if outdrop:
            iid2, isurl2, aisurl2, outdrop = rasterutils.getOutRasterPath(outdrop)
            outdrop = rasterutils.appendcrf(outdrop)

        # TODO: add some more validation logic here, and ERROR code

        # 3. Parse environment settings:
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

        # 4. Execute tool
        arcpy.gp.FlowDirection_sa(insurf, outsurf, forceflow, outdrop, flowtype)
        
        # Update output ========================================================
        # Check if output contains URI
        # 1. If no URI found, return output as is
        # 2. If URI found, update service

        # Use output path as is for AGOL
        if rasterutils.RUN_ON_AGOL:
            uris = [outsurf, outdrop]
        else:
            uris = []
            msgcount = arcpy.GetMessageCount()
            for n in range(msgcount):
                uri = rasterutils.getURI(arcpy.GetMessage(n))
                arcpy.AddMessage("GP message: {0}".format(arcpy.GetMessage(n)))
                if uri == "":
                    continue
                else:
                    uris.append(uri)

        if not uris:
            arcpy.AddMessage("No Data store URI found.")
        else:
            uri = uris[0]
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
                outputItemPropertyTemplate["itemProperties"]["itemText"]["popupInfo"]["title"] = filename
                imsg = rasterutils.updateItemProperties(iid, json.dumps(outputItemPropertyTemplate))
                arcpy.AddMessage(imsg)
                rasterutils.refreshPortalItem(iid)
                arcpy.AddMessage(msg)
            else:
                arcpy.AddWarning("No service updated although data store URI generated.")

        if outdrop:
            if len(uris) < 2:
                arcpy.AddMessage("No Data store URI found for drop surface output.")
            else:
                # This service tool only has one raster output
                uri2 = uris[1]
                if not pyramids:
                    if rasterutils.checkPyramids(uri2):
                        arcpy.AddMessage("Pyramids are existing.")
                    else:
                        arcpy.BuildPyramids_management(uri2, "-1", "NONE", "NEAREST", "DEFAULT", "", "OVERWRITE")
                        arcpy.AddMessage("Pyramids settings were not specified. Building pyramids by default.")
                else:
                    if pyramids['pyramid_option']:
                        if pyramids['pyramid_option'] == "PYRAMIDS":
                            arcpy.BuildPyramids_management(uri2, pyramids['levels'], pyramids['skip_first'],
                                                           pyramids['interpolation_type'],
                                                           pyramids['pyramid_compression'],
                                                           pyramids['compression_quality'],
                                                           pyramids['skip_existing'])
                            arcpy.AddMessage("Building pyramids based on specified environment settings from context.")
                        else:
                            arcpy.AddMessage("No pyramids built because pyramid_option is None or an incorrect word")
                    else:
                        arcpy.AddMessage("No pyramids built because pyramid_option is undefined")

                arcpy.AddMessage("Data store URI for drop surface: {0}".format(uri2))
                # Get federated token to update image service
                token, referer = rasterutils.getToken(isurl2)
                # Read and update image service info
                sinfo2 = rasterutils.getServiceInfo(aisurl2, token, referer)
                if sinfo != {}:
                    msg = rasterutils.updateSource(aisurl2, sinfo2, uri2, token, referer)
                    rasterutils.refreshPortalItem(iid2)
                    arcpy.AddMessage(msg)
                else:
                    arcpy.AddWarning("No service updated although data store URI generated.")

        # Set the output with item and image service url
        if outdrop:
            surfval = {"itemId": iid, "url": isurl}
            dropval = {"itemId": iid2, "url": isurl2}
            arcpy.SetParameterAsText(6, json.dumps(surfval))
            arcpy.SetParameterAsText(7, json.dumps(dropval))
        else:
            surfval = {"itemId": iid, "url": isurl}
            arcpy.SetParameterAsText(6, json.dumps(surfval))

    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME,err)

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))
