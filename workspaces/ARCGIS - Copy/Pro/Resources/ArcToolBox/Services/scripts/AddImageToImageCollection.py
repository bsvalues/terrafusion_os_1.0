"""-----------------------------------------------------------------------------
Name:              AddImageToImageCollection.py
Purpose:           Add more images to the existing Image Layer.
Author:            Esri Inc.
Created:           1/2/2016
Copyright:   (c)   Esri, Inc. 2016
ArcGIS Version:    10.6
-----------------------------------------------------------------------------"""
# core libraries
import os
import json

# internal libraries
import arcpy
import rasterutils
import rastertypes
import realityutils

TASK_NAME = 'AddImageToImageCollection'


# Function to either get new raster type settings or find existing one
def getRasterTypeSettings(rastype):
    """
    :param rastype: raster type settings from the tool parameter
    :return: raster type settings name keyword and aux inputs
    """
    try:
        rtJSON = list(rasterutils.getJSON(rastype))
        if len(rtJSON) > 0:
            rtJSON = rtJSON[0]
            arcpy.AddMessage("Raster type JSON is: {}".format(str(rtJSON)))
            rtname, rtPara, rtProp = rastertypes.getRasterType(rtJSON)
            arcpy.AddMessage("Raster type name is: {}".format(rtname))
            arcpy.AddMessage("Raster type parameters are: {}".format(str(rtPara)))

            if rtPara and isinstance(rtPara, dict):
                auxin = ";".join([" ".join([key, json.dumps(rtPara[key])]) for key in rtPara])
            else:
                auxin = ""

            return rtname, auxin
        # If no raster type setting provided, query existing records in raster type table
        else:
            icname = os.path.basename(icpath)
            rttbl = "AMD_" + icname + "_ART"
            rtpath = os.path.join(os.path.dirname(icpath), rttbl)
            with arcpy.da.SearchCursor(rtpath, ["OBJECTID"], sql_clause="ORDER BY OBJECTID") as cur:
                rtid = str(next(cur))
            if rtid:
                rtname = os.path.join(rtpath, "OBJECTID=" + rtid)
            else:
                rtname = ""
                arcpy.AddError("Cannot find any raster type settings.")

            return rtname, ""
    except Exception as err:
        return "", ""


# Keep a record of the last OBJECTID before add
def getlastoid(icpath):
    """
    This function is used to find the last object ID of the mosaic dataset before add item
    :param icpath: the mosaic dataset path
    :return: the last object ID before add new item
    """
    try:
        with arcpy.da.SearchCursor(icpath, ["OBJECTID"], sql_clause=(None, 'ORDER BY OBJECTID DESC')) as cur:
            return cur.next()[0]
    except Exception as err:
        return 0


if __name__ == '__main__':

    initems = arcpy.GetParameterAsText(0)
    inic = arcpy.GetParameterAsText(1)
    rastype = arcpy.GetParameterAsText(2)
    context = arcpy.GetParameterAsText(3)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkHostedImageryPrivilge()

        # 1. Get the list of input rasters
        # Check if the input item is from server or portal
        serverDownload = rasterutils._checkServerUpload(initems)
        byref, cpmosaic, inras, allbyref = rasterutils.getHostedDataPath(initems)
        if inras:
            arcpy.AddMessage("Input raster is: {}".format(inras))
        else:
            arcpy.AddError("Cannot get input Raster.")

        # 2. Get the mosaic dataset path from the image service
        isurl = rasterutils.getInDataPath(inic)
        # Note: inic will always be a service url, we do not support URL
        # Have to use the admin URL for service update operation
        aisurl = rasterutils.getISAdminUrl(isurl)
        icpath = rasterutils.getImageServiceDatasource(isurl)
        # arcpy.AddMessage(icpath)

        # 3. Get raster type and its settings
        rtname, auxin = getRasterTypeSettings(rastype)

        # Set parallel processing environment
        moreags = rasterutils._parsecontext(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)

        # 4. Get Mosaic dataset workspace and upload data folder
        if rasterutils.RUN_ON_AGOL:
            # In AGOL, the mosaic dataset workspace is always EGDB
            # need to create a SDE connection file locally to contruct mosaic dataset path
            # The mosaic dataset path updated to the image service would be:
            # e.g. /enterpriseDatabases/<org id>/<mosaic dataset name>
            token, referer = rasterutils.getToken(isurl, 5)
            mdname = os.path.basename(icpath)
            # arcpy.AddMessage(mdname)
            # arcpy.AddMessage(aisurl)
            # arcpy.AddMessage(token)
            mdws, managedrs = rasterutils.getMosaicWorkspace(aisurl, mdname, token)
            if mdws:
                icpath = os.path.join(mdws, mdname)
        else:
            mdws = os.path.dirname(icpath)
            mdname = os.path.basename(icpath)

        # arcpy.AddMessage("mosaic dataset workspace: {}".format(mdws))
        # arcpy.AddMessage("mosaic dataset path: {}".format(icpath))

        # Now look up or construct the imagery data folder path
        # 1) if the imagery folder is stored in mosaic dataset property, use it
        # 2) otherwise, construct one
        iid = rasterutils.getItemID(aisurl)
        # arcpy.AddMessage("item id: {}".format(iid))
        token, referer = rasterutils.getToken(isurl, 5)

        # read property for imagery folder
        imgfolder = arcpy.GetRasterKeyMetadata(icpath, "_store")
        if not imgfolder:
            reality_ws = realityutils.get_reality_workspace(context)
            if reality_ws:
                fld_name = reality_ws + "/imagery"
                imgfolder = rasterutils.getHostedDataFolder(aisurl, fld_name, token)
            elif iid:
                imgfolder = rasterutils.getHostedDataFolder(aisurl, iid, token) + "/imagery"
            else:
                imgfolder = rasterutils.getHostedDataFolder(aisurl, mdname, token) + "/imagery"

        # Validation
        if not mdws:
            arcpy.AddError("Cannot find workspace for mosaic dataset.")
        if not imgfolder:
            arcpy.AddError("Cannot find imagery data folder.")

        # 5. Add rasters byref/byvalue
        indata = ""
        if icpath:
            if byref:
                # Source image data is by reference
                if isinstance(inras, list):
                    indata = ";".join(inras)
                elif isinstance(inras, str):
                    indata = ";".join(inras.split(","))
                else:
                    indata = str(inras)
            else:
                # Note: handle the case where the input is a mosaic dataset to be
                # added as a Table with "byref" flag.
                # Download source data from portal folder to raster store
                if isinstance(inras, list):
                    inraslist = inras
                elif isinstance(inras, str):
                    inraslist = inras.split(",")
                else:
                    inraslist = str(inras)

                # arcpy.AddMessage('Images to be moved: {}'.format(str(inraslist)))
                datafolder, imglist = rasterutils.downloadUploadedImagestoDataStore(
                    inraslist, imgfolder, serverDownload)
                arcpy.AddMessage("New image list: {}".format(str(imglist)))
                indata = datafolder
                # if len(imglist) > 0:
                #     indata = ";".join(imglist)
                # else:
                #     arcpy.AddWarning("No new images to be add.")

            # Add images or mosaic dataset (as table) to existing image collection
            if indata:
                if not rasterutils.RUN_ON_AGOL:
                    # Stop the service before update
                    token, referer = rasterutils.getToken(isurl, 5)
                    rasterutils.stopService(aisurl, token)
                
                # Get the last OID of the mosaic dataset
                lastoid = getlastoid(icpath)

                arcpy.AddMessage("Ingesting new data to image collection...")
                # arcpy.AddMessage(rtname)
                # arcpy.AddMessage(indata)
                result = arcpy.AddRastersToMosaicDataset_management(
                    icpath, rtname, indata, aux_inputs=auxin,
                    duplicate_items_action="OVERWRITE_DUPLICATES")
                arcpy.AddMessage("Finished adding new data to image collection.")

                # Optionally rebuild footprints and generate single overview
                # Build footprints
                footprintsparams = rasterutils._checkbuildfootprints(context)
                if footprintsparams:
                    arcpy.AddMessage("Build footprints with {} method...".format(footprintsparams["footprintsMethod"]))
                    arcpy.BuildFootprints_management(
                        icpath, where_clause="OBJECTID > " + str(lastoid),
                        reset_footprint=footprintsparams["footprintsMethod"],
                        min_data_value=footprintsparams["minValue"], max_data_value=footprintsparams["maxValue"],
                        approx_num_vertices=footprintsparams["numVertices"],
                        shrink_distance=footprintsparams["shrinkDistance"],
                        maintain_edges=footprintsparams["maintainEdge"],
                        skip_derived_images=footprintsparams["skipDerivedImages"],
                        update_boundary=footprintsparams["updateBoundary"],
                        request_size=footprintsparams["requestSize"],
                        min_region_size=footprintsparams["minRegionSize"],
                        simplification_method=footprintsparams["simplification"],
                        edge_tolerance=footprintsparams["edgeTorelance"],
                        max_sliver_size=footprintsparams["maxSliverSize"],
                        min_thinness_ratio=footprintsparams["minThinnessRatio"]
                    )
                    arcpy.AddMessage("Finished Build Footprints with {} method.".format(footprintsparams["footprintsMethod"]))

                # Build Overview
                ovrags = rasterutils._checkbuildoverview(context)
                if ovrags:
                    rasterutils._buildoverview(icpath, ovrags)

                if not rasterutils.RUN_ON_AGOL:
                    # Get serer token to restart service
                    token, referer = rasterutils.getToken(isurl, 5)
                    rasterutils.startService(aisurl, token)
            else:
                arcpy.AddMessage("No image input, nothing added to mosaic dataset. ")

        else:
            arcpy.AddError("Cannot find correct image service source for update.")

        outval = {"url": isurl}
        arcpy.SetParameterAsText(4, json.dumps(outval))

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, arcpy.AddMessage(2))

    except Exception as err:
        arcpy.AddError(err)
