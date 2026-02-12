"""-----------------------------------------------------------------------------
Name:              DeriveContinuousFlow.py
Purpose:           This is the service tool that generates a raster of flow direction from
                   each cell and accumulated flow into each cell from an input surface raster
                   with no prior sink or depressions filling required.
Author:            Esri Inc.
Created:           3/22/2022
Copyright:   (c)   Esri, Inc. 2022
ArcGIS Version:    11
-----------------------------------------------------------------------------"""
# core libraries
import json

# internal libraries
import arcpy
import rasterutils
import hostedgp as agolgp
import aolutils

TASK_NAME = 'DeriveContinuousFlow'
ERROR_CODES = []
errorMsgs = {}


if __name__ == '__main__':

    insurf = arcpy.GetParameterAsText(0)
    outflowaccu = arcpy.GetParameterAsText(1)
    indepr = arcpy.GetParameterAsText(2)
    inweight = arcpy.GetParameterAsText(3)
    outflowdir = arcpy.GetParameterAsText(4)
    flowdir = arcpy.GetParameterAsText(5)
    forceflow = arcpy.GetParameterAsText(6)
    context = arcpy.GetParameterAsText(7)

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

        hostedgp = agolgp.HostedGP(7, 1)
        if rasterutils.checkIfFeatureCollection(indepr):
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputDepressionsData", 2)
            indepr = Input.name
        else:
            # Now parsing the input raster or feature
            indepr = rasterutils.getInDataPath(indepr)
            if indepr.find("/FeatureServer/") > -1 \
                    or indepr.find("/MapServer/") > -1:
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputDepressionsData", 2)
                indepr = Input.name
            else:
                if isinstance(indepr, dict):
                    indepr = json.dumps(indepr)

        inweight = rasterutils.getInDataPath(inweight)
        if isinstance(inweight, dict):
            inweight = json.dumps(inweight)

        # 2. Parse output raster parameters
        iid = ""  # Output Portal item ID
        isurl = ""  # Output Image Service URL
        aisurl = ""  # Output Image Service admin URL
        token = ""
        referer = ""

        iid, isurl, aisurl, outflowaccu = rasterutils.getOutRasterPath(outflowaccu)
        outflowaccu = rasterutils.appendcrf(outflowaccu)
        arcpy.AddMessage("Output item id is: {0}".format(iid))
        arcpy.AddMessage("Output image service url is: {0}".format(isurl))
        # arcpy.AddMessage("Output image service admin url is: {0}".format(aisurl))
        arcpy.AddMessage("Output cloud raster name is: {0}".format(outflowaccu))

        # For Output raster
        if outflowdir != "" and outflowdir != None and outflowdir != "#":
            iid2 = ""  # Output Portal item ID
            isurl2 = ""  # Output Image Service URL
            aisurl2 = ""  # Output Image Service admin URL

            iid2, isurl2, aisurl2, outflowdir = rasterutils.getOutRasterPath(outflowdir)
            outflowdir = rasterutils.appendcrf(outflowdir)
            arcpy.AddMessage("Output item id is: {0}".format(iid))
            arcpy.AddMessage("Output image service url is: {0}".format(isurl))
            arcpy.AddMessage("Output cloud raster name is: {0}".format(outflowdir))
        else:
            outflowdir = ""

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
        arcpy.gp.DeriveContinuousFlow_sa(insurf, outflowaccu, indepr, inweight, outflowdir, flowdir, forceflow)

        # Update output ========================================================
        # Check if output contains URI
        # 1. If no URI found, return output as is
        # 2. If URI found, update service

        # Use output path as is for AGOL
        if rasterutils.RUN_ON_AGOL:
            uris = [outflowaccu, outflowdir]
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

        if uris == []:
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

                arcpy.AddMessage("Built the pyramids for the first raster.")

            arcpy.AddMessage("Data store URI: {0}".format(uri))
            # Get federated token to update image service
            if token == "" or token == "#":
                token, referer = rasterutils.getToken(isurl)
            # Read and update image service info
            sinfo = rasterutils.getServiceInfo(aisurl, token, referer)
            if sinfo != {}:
                msg = rasterutils.updateSource(aisurl, sinfo, uri, token, referer)
                rasterutils.refreshPortalItem(iid)
                arcpy.AddMessage(msg)
            else:
                arcpy.AddWarning("No service updated although data store URI generated.")

        if outflowdir != "":
            if len(uris) < 2:
                arcpy.AddMessage("No Data store URI found for flowdir output.")
            else:
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

                arcpy.AddMessage("Data store URI for flowdir output: {0}".format(uri2))
                # Get federated token to update image service
                if token == "" or token == "#":
                    token, referer = rasterutils.getToken(isurl2)
                # Read and update image service info
                sinfo2 = rasterutils.getServiceInfo(aisurl2, token, referer)
                if sinfo != {}:
                    msg = rasterutils.updateSource(aisurl2, sinfo2, uri2, token, referer)
                    rasterutils.refreshPortalItem(iid2)
                    arcpy.AddMessage(msg)
                else:
                    arcpy.AddWarning("No service updated although data store URI generated.")

        outflowaccu = {"itemId": iid, "url": isurl}
        arcpy.SetParameterAsText(8, json.dumps(outflowaccu))

        if outflowdir != "":
            outflowdir = {"itemId": iid2, "url": isurl2}
            arcpy.SetParameterAsText(9, json.dumps(outflowdir))


    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME,err)
