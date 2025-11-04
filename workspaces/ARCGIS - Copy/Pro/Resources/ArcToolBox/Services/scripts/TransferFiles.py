"""-----------------------------------------------------------------------------
Name:              TransferFiles.py
Purpose:           Transfer local files to data store or transfer files between
                   different datastore.
Author:            Esri Inc.
Created:           10/24/2018
Copyright:   (c)   Esri, Inc. 2018
ArcGIS Version:    10.7
Description:       This service tool supports the following workflows:
                   1. copy files from one data store to another
                   2. copy uploaded items from Portal configure store to raster
                      store.
                   3. copy uploaded items from server directory to raster
                      store.
                   The input syntax could be a simple path:
                   /cloudStore/bucket/folder
                   or itemId/itemIds
                   {"itemId": ...}
                   {"itemIds": [{"itemId": ...,},]}
                   4. download files directly to the client
-----------------------------------------------------------------------------"""
# core libraries
import os

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'TransferFiles'


if __name__ == '__main__':
    infiles = arcpy.GetParameterAsText(0)
    # Note: output location is either the full path of the output directory
    #       e.g. /rasterStores/s3cloudstore/datafolder
    #       or just the folder name.
    outlocation = arcpy.GetParameterAsText(1).strip('\"')
    filter = arcpy.GetParameterAsText(2)
    returnFile = arcpy.GetParameter(3)
    context = arcpy.GetParameterAsText(4)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # 1. Parse the input, convert it to dictionary first
        indict = rasterutils._parsecontext(infiles)
        # Parse input to list of rasters
        inras = rasterutils.getInDataPath(indict)

        if inras:
            arcpy.AddMessage("Input file is: {}".format(str(inras)))
        else:
            arcpy.AddError("Cannot get input files.")

        # arcpy.AddMessage(str(inras))
        # arcpy.AddMessage(outlocation)
        # Setting GP environment
        arcpy.env.overwriteOutput = 1
        # 1.x Support return a single file mode
        # arcpy.AddMessage(returnFile)
        if returnFile:
            arcpy.AddMessage("Download remote file...")
            # Only return single file to the output
            if isinstance(inras, list):
                infile = inras[0]
            elif isinstance(inras, str):
                infile = inras.split(",")[0]
            else:
                infile = str(inras)
            # Get the file name
            filename = os.path.basename(infile)
            outfile = ""
            if os.path.isabs(infile) or infile.startswith("/fileShares") or infile.startswith("/cloudStores") or infile.startswith("/rasterStores"):
                infile = rasterutils._lookupdatastorepath(infile)
                tempout = arcpy.env.scratchFolder
                # arcpy.AddMessage(infile)
                # arcpy.AddMessage(tempout)
                # arcpy.AddMessage(filter)
                arcpy.gp.command(
                    "TransferFiles '" + infile + "' " + tempout + " " + filter)
                # arcpy.TransferFiles_management(infile, tempout, filter)
                outfile = os.path.join(tempout, filename)
            else:
                arcpy.AddError("Cannot download the input file to client. {}".format(infile))

            # Set output file for client download
            arcpy.SetParameterAsText(6, outfile)
        else:
            # Check the input data type
            if isinstance(inras, list):
                inraslist = inras
            elif isinstance(inras, str):
                inraslist = inras.split(",")
            else:
                inraslist = str(inras)

            # Start thread to log progress
            # progress = rasterutils.logprogress()
            # 2. If the input contains itemId, switch to transfer uploaded items.
            # Otherwise, try to transfer files right away.
            if "itemId" in indict or "itemIds" in indict:
                # 2.1 Construct the output raster store path with server admin API
                raurl = rasterutils.RASTER_ANALYTIC_HELPER

                # If cannot get Raster Analytics URL, fail right away
                if not raurl:
                    arcpy.AddError("No Raster Analytics Image Server found.")
                raurl += "/admin/services"

                # Get raster store path using admin URL
                token, referer = rasterutils.getToken(raurl, 5)
                # arcpy.AddMessage(raurl)
                # Cloud store takes higher priority over file share for output data location
                cloudstore = rasterutils._getRasterStore(raurl, token, type="cloud")
                if len(cloudstore) > 1 and cloudstore[1]:
                    rasstore = cloudstore[0]
                else:
                    rasstore = rasterutils._getRasterStore(raurl, token, type="fileshare")[0]
                # arcpy.AddMessage(rasstore)

                # Note: only if the output location is raster store path and it is
                # not the same as the default raster store we will use it as is.
                if os.path.isabs(outlocation) and outlocation.startswith("/rasterStores") and outlocation != rasstore:
                    prjfolder = outlocation
                else:
                    prjfolder = rasstore + "/" + os.path.basename(outlocation)
                # arcpy.AddMessage(prjfolder)

                # Check flag to see if server upload API is used flag
                serverDownload = rasterutils._checkServerUpload(indict)
                # Get input file lists
                imglist = []
                moreags = rasterutils._parsecontext(context)
                arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
                arcpy.AddMessage("Transferring uploaded images to raster store...")
                outloc = rasterutils.downloadUploadedImagestoDataStore(inraslist, prjfolder, serverDownload)[0]

            else:
                # Copy to the output location if output path was specified.
                if os.path.isabs(outlocation) or outlocation.startswith("/rasterStores") or outlocation.startswith("/fileShares") or outlocation.startswith("/cloudStores"):
                    arcpy.AddMessage("Copy to specified location: {}".format(outlocation))
                    # Set parallel processing factor
                    moreags = rasterutils._parsecontext(context)
                    arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
                    # arcpy.AddMessage(str(inras))
                    # arcpy.AddMessage(str(outlocation))
                    arcpy.gp.command(
                        "TransferFiles '" + inras + "' " + outlocation + " " + filter)
                    # arcpy.TransferFiles_management(inras, outlocation, filter)
                    outloc = outlocation
                else:
                    # If output location was not specified, default to transfer to raster store.
                    # Find RA helper server URL to retrieve output raster store path
                    # Find Raster Analytic server url
                    raurl = rasterutils.RASTER_ANALYTIC_HELPER + "/admin/services"

                    # Get raster store path using admin URL
                    token, referer = rasterutils.getToken(raurl, 5)
                    # arcpy.AddMessage(raurl)
                    # Cloud store takes higher priority over file share for output data location
                    cloudstore = rasterutils._getRasterStore(raurl, token, type="cloud")
                    if len(cloudstore) > 1 and cloudstore[1]:
                        rasstore = cloudstore[1]
                    else:
                        rasstore = rasterutils._getRasterStore(raurl, token, type="fileshare")[0]
                    # arcpy.AddMessage(rasstore)

                    outloc = rasstore + "/" + os.path.basename(outlocation)
                    # Set parallel processing factor
                    moreags = rasterutils._parsecontext(context)
                    arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
                    # arcpy.AddMessage(str(inras))
                    # arcpy.AddMessage(str(outloc))
                    arcpy.gp.command(
                        "TransferFiles '" + inras + "' " + outloc + " " + filter)
                    # arcpy.TransferFiles_management(inras, outloc, filter)

            # logging progress
            # rasterutils.stopprogress(progress)
            # Set output raster parameter
            arcpy.SetParameterAsText(5, outloc)

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages())

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
