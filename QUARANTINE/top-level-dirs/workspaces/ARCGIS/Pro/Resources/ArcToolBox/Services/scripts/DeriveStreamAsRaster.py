"""-----------------------------------------------------------------------------
Name:              DeriveStreamAsRaster.py
Purpose:           This is the service tool that performs hydrology Derive stream as raster analysis
Author:            Esri Inc.
Created:           4/20/2023
Copyright:   (c)   Esri, Inc. 2023
ArcGIS Version:    11.2
-----------------------------------------------------------------------------"""
# core libraries
import json

# internal libraries
import arcpy
import hostedgp as agolgp
import aolutils
import rasterutils
import rendererUtils
import popup

TASK_NAME = 'DeriveStreamAsRaster'
ERROR_CODES = []
errorMsgs = {}

if __name__ == '__main__':

    insurf = arcpy.GetParameterAsText(0)
    outstream = arcpy.GetParameterAsText(1)
    inputdepressions = arcpy.GetParameterAsText(2)
    inputweight = arcpy.GetParameterAsText(3)
    accumulationthreshold = arcpy.GetParameterAsText(4)
    streamdesignationmethod = arcpy.GetParameterAsText(5)
    forceflow = arcpy.GetParameterAsText(6)
    context = arcpy.GetParameterAsText(7)

    try:
        # Added logic for json input in Accumulation threshold parameter
        try: 
            acc_thres_json = json.loads(accumulationthreshold)
            if isinstance(acc_thres_json, dict):
                acc_thres_json = {k.lower(): v for k, v in acc_thres_json.items()}
                accumulationthreshold = str(acc_thres_json["distance"]) + " " + acc_thres_json["units"]
        except: pass
        
        # 0. Check Image Server extension license
        if arcpy.CheckExtension("Image") != "Available":
            raise rasterutils.LicenseError

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # 1. Parse input raster parameters
        hostedgp = agolgp.HostedGP(7, 1)
        insurf = rasterutils.getInDataPath(insurf)
        if isinstance(insurf, dict):
            insurf = json.dumps(insurf)

        if rasterutils.checkIfFeatureCollection(inputdepressions):
            Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputdepressions", 2)
            inputdepressions = Input.name
        else:
            # inputdepressions = rasterutils.getInDataPath(inputdepressions)
            # if isinstance(inputdepressions, dict):
            #     inputdepressions = json.dumps(inputdepressions)
            inputdepressions = rasterutils.getInDataPath(inputdepressions)
            if inputdepressions.find("/FeatureServer/") > -1 \
                    or inputdepressions.find("/MapServer/") > -1:
                Input, InputLayerCount = aolutils.getHostedLayerX(hostedgp, "inputdepressions", 2)
                inputdepressions = Input.name
                layerPath = arcpy.Describe(inputdepressions).catalogPath
            else:
                if isinstance(inputdepressions, dict):
                    inputdepressions = json.dumps(inputdepressions)

        inputweight = rasterutils.getInDataPath(inputweight)
        if isinstance(inputweight, dict):
            inputweight = json.dumps(inputweight)

        # 2. Parse output raster parameters
        iid, isurl, aisurl, outstream = rasterutils.getOutRasterPath(outstream)
        outstream = rasterutils.appendcrf(outstream)
        arcpy.AddMessage("Output item id is: {0}".format(iid))
        arcpy.AddMessage("Output image service url is: {0}".format(isurl))
        arcpy.AddMessage("Output cloud raster name is: {0}".format(outstream))


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
        arcpy.gp.DeriveStreamAsRaster_sa(insurf, outstream, inputdepressions, inputweight, accumulationthreshold,
                                         streamdesignationmethod, forceflow)

        msgcount = arcpy.GetMessageCount()
        for n in range(msgcount):
            arcpy.AddMessage("GP message: {0}".format(arcpy.GetMessage(n)))

        # Update output ========================================================
        # Check if output contains URI
        # 1. If no URI found, return output as is
        # 2. If URI found, update service
        uri = rasterutils.getURI(arcpy.GetMessages(), outstream)

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
        arcpy.SetParameterAsText(8, json.dumps(outval))

    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, err)
