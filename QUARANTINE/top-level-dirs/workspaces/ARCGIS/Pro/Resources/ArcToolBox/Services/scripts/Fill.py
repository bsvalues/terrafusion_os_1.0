"""-----------------------------------------------------------------------------
Name:              Fill.py
Purpose:           This is the service tool that performs hydrology fill analysis
Author:            Esri Inc.
Created:           7/20/2017
Copyright:   (c)   Esri, Inc. 2017
ArcGIS Version:    10.6
-----------------------------------------------------------------------------"""
# core libraries
import json

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'Fill'
ERROR_CODES = []
errorMsgs = {}


if __name__ == '__main__':

    insurf = arcpy.GetParameterAsText(0)
    outsurf = arcpy.GetParameterAsText(1)
    zlimit = arcpy.GetParameterAsText(2)
    context = arcpy.GetParameterAsText(3)

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
        outsurf = rasterutils.appendcrf(outsurf)
        arcpy.AddMessage("Output item id is: {0}".format(iid))
        arcpy.AddMessage("Output image service url is: {0}".format(isurl))
        # arcpy.AddMessage("Output image service admin url is: {0}".format(aisurl))
        arcpy.AddMessage("Output cloud raster name is: {0}".format(outsurf))

        # TODO: add some more validation logic here, and ERROR code
        if zlimit:
            zlimit = float(zlimit)
            if zlimit < 0:
                arcpy.AddError("Z limit value must be large than 0.")
        else:
            zlimit = "#"

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
        arcpy.gp.Fill_sa(insurf, outsurf, zlimit)

        msgcount = arcpy.GetMessageCount()
        for n in range(msgcount):
            arcpy.AddMessage("GP message: {0}".format(arcpy.GetMessage(n)))

        # Update output ========================================================
        # Check if output contains URI
        # 1. If no URI found, return output as is
        # 2. If URI found, update service
        uri = rasterutils.getURI(arcpy.GetMessages(), outsurf)

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
        arcpy.SetParameterAsText(4, json.dumps(outval))

    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME,err)
