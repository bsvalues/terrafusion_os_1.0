"""-----------------------------------------------------------------------------
Name:              UploadRaster.py
Purpose:           Upload local raster datasets to the Cloud, with options to
                   resample, clip the image. This is implemented through raster
                   function.
Author:            Esri Inc.
Created:           11/22/2014
Copyright:   (c)   Esri, Inc. 2014
ArcGIS Version:    10.3
Note:              This system service tool could potentially require
                   configuration of larger volume of server configure store if
                   large volume of input images are being uploaded.
-----------------------------------------------------------------------------"""
# core libraries
import os
import json
import sys
import shutil
import time
from datetime import datetime
from urllib.parse import urlparse
from math import log2

# internal libraries
import arcpy
from arcpy import AIO
import rasterutils
import rastertypes

TASK_NAME = 'CopyRaster'


# Single format check list:
rasterFormatsEx = ['.img', '.toc', '.bil', '.bip', '.bsq', '.bmp', '.dt0', '.dt1', '.dt2', '.lan', '.gis', '.gif', '.img', '.jpg', '.jp2', '.sid', '.view', '.png', '.raw', '.ntf', '.nsf', '.tiff', '.tif', '.stk', '.dem', '.xpm', '.map', '.memory', '.pix', '.jpc', '.j2k', '.j2c', '.dat', '.nes', '.elas', '.fit', '.gtx', '.gxf', '.hf2', '.mpr', '.mpl', '.n1', '.1b', '.sv', '.gc', '.paux', '.ppm', '.pbm', '.pgm', '.sdat', '.raw', '.jpx', '.hdf', '.h5', '.kap', '.rst', '.ddf', '.vrt', '.asc', '.ers', '.cit', '.cot', '.ctb', '.ctc', '.hgt', '.gff', '.lbl', '.grd', '.ter', '.bt', '.flt', '.blx', '.cub', '.h1', '.fst', '.5gud', '.cos', '.afr', '.psi', '.til', '.bag', '.r0', '.xyz', '.gn1', '.gn2', '.gn3', '.gn4', '.gn7', '.gn9', '.gna', '.gnb', '.gnc', '.gnd', '.gng', '.gnj', '.jn1', '.jn2', '.jn3', '.jn4', '.jn5']
scientific = ['.hdf', '.hdf5', '.h5', '.he5', '.hdf4', '.h4', '.he4', '.grib', '.grb', '.grib2', '.grb2', '.bin', '.dat', '.nc', '.nc4']
exlist = rasterFormatsEx + scientific


def cleanup(mdpath, prjfolder):
    # Delete temporary data, note deletion must happen in the following order
    # Delete mosaic dataset
    try:
        # Clear the workspace connection cache
        mdws = os.path.dirname(mdpath)
        arcpy.management.ClearWorkspaceCache(mdws)
        if mdws.endswith(".gdb"):
            arcpy.Delete_management(mdws)
        elif arcpy.Exists(mdpath):
            arcpy.Delete_management(mdpath)
    except Exception as err:
        arcpy.AddMessage(arcpy.GetMessage(2))

    # Delete file system temp data folder
    try:
        # TODO: support deletion in cloud store
        if arcpy.Exists(prjfolder):
            shutil.rmtree(prjfolder, ignore_errors=True)
    except Exception as err:
        arcpy.AddMessage(err)

    # Delete mosaic dataset workspace folder if it is empty.
    try:
        mdws = os.path.dirname(mdpath)
        if mdws.endswith(".gdb"):
            mdfolder = os.path.dirname(mdws)
            if not os.listdir(mdfolder):
                arcpy.Delete_management(mdfolder)
    except Exception as err:
        arcpy.AddMessage(err)


def _get_first_raster(mdpath):
    try:
        with arcpy.da.SearchCursor(mdpath, ["OBJECTID"]) as cur:
            firstraster = mdpath + os.sep + "Raster.OBJECTID=" + str(cur.next()[0])
        return firstraster
    except Exception as err:
        return ""


def getSingleRaster(imglist):
    try:
        imgcount = 0
        singleras = ""
        # arcpy.AddMessage("image path list to check: "+str(imglist))
        # check if the imglist contains only one raster
        if isinstance(imglist, list):
            if len(imglist) == 1:
                imgcount = 1
                singleras = imglist[0]
            else:
                for imgpath in imglist:
                    root, ext = os.path.splitext(imgpath.lower())
                    # check if image path is only CRF
                    if imgpath.lower().endswith(".crf/conf.json") or imgpath.lower().endswith(".crf\\conf.json"):
                        imgcount += 1
                        singleras = imgpath[:-10]
                    elif ext in exlist:
                        imgcount += 1
                        singleras = imgpath
                    if imgcount > 1:
                        return None
            # if only one image found, return the path
            if imgcount == 1:
                return singleras
        else:
            return None
    except Exception as err:
        return None


if __name__ == '__main__':

    inras = arcpy.GetParameterAsText(0)
    outras = arcpy.GetParameterAsText(1)
    outcellsize = arcpy.GetParameterAsText(2)
    rmethod = arcpy.GetParameterAsText(3)
    clipgeometry = arcpy.GetParameterAsText(4)
    context = arcpy.GetParameterAsText(5)

    mdpath = ""
    prjfolder = ""
    tempfolder = ""
    # Check to see if need to use direct transfer, default is False
    useDirectTransfer = False
    # If data is already downloaded to the hosted raster store and format is CRF, then no need to copy.
    skipCopy = False
    # Need a flag to determine whether uploaded data is a single raster
    singleras = ""
    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Imagery Layer creation privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkHostedImageryPrivilge()

        # AGOL v9.3: support publishing existing mosaic dataset from upload and convert to CRF
        # sample syntax from input data is:
        # {"mosaic_dataset": "https://..../uploadedgdb.gdb/mosaicdataset", "data_path":
        # "/vsiaz/orgid/blobcontainer/newdata"}
        # Applies to ArcGIS Online Only for now
        uploadedmd = ""
        oldpath = ""
        if rasterutils.RUN_ON_AGOL:
            uploadedmd, oldpath = rasterutils.get_uploaded_mosaic_dataset(inras)

        # Get the output raster from JSON object that may contains ItemID, image service url or CRF
        # Example:
        # {"itemId": "no213u0uiif8924989h98h0123",
        #  "url": "http://rdvmags02.esri.com/arcgis/rest/services/Hosted/testis",
        #  "uri": "http://pds31:29080/suitabilityanalysis_1230414"}
        # {"images": [{"uri": }, {"url": }, {"itemId":}], "rasterType":{"rasterTypeName":...}
        outrasjson = outras
        iid, isurl, aisurl, outras = rasterutils.getOutRasterPath(outras)
        outrasname = os.path.basename(outras)
        arcpy.AddMessage("Output item id is: {0}".format(iid))
        arcpy.AddMessage("Output image service url is: {0}".format(isurl))
        #arcpy.AddMessage("Output image service admin url is: {0}".format(aisurl))
        arcpy.AddMessage("Output cloud raster name is: {0}".format(outrasname))

        # Now parsing the input raster
        # Parse input raster JSON to see if raster type setting is given
        # e.g. {"rasterType":{"rasterTypeName": "UAV/UAS", "rasterTypeParameters": {"GPS": "c:/temp/gpsfile.txt"}}}
        rtJSON = list(rasterutils.getJSON(inras))
        if rtJSON:
            rtJSON = rtJSON[0]
            if "rasterType" in rtJSON:
                rtJSON = rtJSON["rasterType"]
            else:
                rtJSON = {}

        # Parse input raster string to dictionary
        indict = rasterutils._parsecontext(inras)
        byref, ismosaic, inras, allbyref = rasterutils.getHostedDataPath(indict)
        if inras:
            arcpy.AddMessage("Input raster is: {}".format(inras))
        else:
            arcpy.AddError("Cannot get input Raster.")

        # The rendering rules and mosaic rules can be read from item properties
        if isinstance(inras, list):
            imglist = inras
        elif isinstance(inras, str):
            imglist = inras.split(",")
        elif isinstance(inras, dict):
            # Note input string could still be JSON. If JSON, then it is single item.
            imglist = []
            inras = json.dumps(inras)
            imglist.append(inras)
        else:
            imglist = str(inras).split(",")

        # Let create mosaic dataset tool handle the long table name
        # Parse addtional environment variables
        moreags = rasterutils._parsecontext(context)
        rasfunction = rasterutils.get_rasterfunc(context)
        # arcpy.AddMessage(rasfunction)

        # Mosaic dataset upload is only supported in AGOL for now
        # TODO: need new upload API to support mosaic dataset upload workflow in Enterprise
        if uploadedmd and oldpath:
            mdws = arcpy.env.scratchGDB
            managedrs = ""

            # Transfer mosaic dataset to raster store
            mdpath = rasterutils.transfer_mosaic_dataset(uploadedmd, mdws, outrasname)
            # Repair mosaic dataset path
            if oldpath:
                # arcpy.AddMessage("Old paths to repair: " + str(oldpath))
                # arcpy.AddMessage("Target path: " + str(oldpath))
                rasterutils.repair_mosaic_dataset_paths(mdpath, oldpath, "")
            # TODO: support more post processing options
            inras = mdpath

        # If there are multiple uploaded files or raster type settings, we need to
        # check if temporary mosaic dataset is needed.
        elif len(imglist) >= 1 or rtJSON:
            datafolder = ""
            # Use raster store to store temporary data. Because in server cluster,
            # the scratch folder or scratch GDB is stored on server node, not in
            # configure store.
            token, referer = rasterutils.getToken(aisurl, 5)
            # Get workspace for uploading hosted imagery data
            if iid:
                prjfolder = rasterutils.getHostedDataFolder(aisurl, iid, token)
            else:
                prjfolder = rasterutils.getHostedDataFolder(aisurl, outrasname, token)
            arcpy.AddMessage("Hosted data folder is: {}".format(prjfolder))

            # Get workspace for mosaic dataset creation
            # Special case for AGOL silo server
            if rasterutils.RUN_ON_AGOL:
                mdws = arcpy.env.scratchGDB
                managedrs = ""
            else:
                mdws, managedrs = rasterutils.getMosaicWorkspace(
                    aisurl, outrasname, token, workspace=os.path.basename(prjfolder))

            # Note for AGOL, we do not need to move the data from user bucket to org bucket.
            # We will only use the original data during conversion.
            if not byref and not rasterutils.RUN_ON_AGOL:
                # Check flag to see if server upload API is used flag
                serverDownload = rasterutils._checkServerUpload(indict)
                arcpy.AddMessage("Download mode: {}".format(serverDownload))
                # images - copy to data store project folder, then create mosaic dataset
                # Download source data from portal folder to raster store
                arcpy.AddMessage("Transferring uploaded images to raster store...")
                datafolder, downloadedlist = rasterutils.downloadUploadedImagestoDataStore(imglist, prjfolder, serverDownload)
                # Need download image list to check number of raster
                if downloadedlist:
                    imglist = downloadedlist

                # Temp folder is used for temporary uploaded hosted data
                # for Enterprise, temp folder is the project folder
                # for AGOL, the result CRF is also in project (item id) folder
                if rasterutils.RUN_ON_AGOL:
                    tempfolder = datafolder
                else:
                    tempfolder = prjfolder
            else:
                datafolder = ";".join(imglist)

            # Determine whether to create mosaic dataset or not.
            # 1) single raster with raster type setting -> create mosaic dataset
            # 1) single raster without raster type setting -> no mosaic dastaset
            # Check if image file list is actually only one raster
            singleras = getSingleRaster(imglist)
            if singleras and not rtJSON:
                arcpy.AddMessage("Single image: "+singleras)
                # If input is a single CRF
                # by ref: still need to call transfer files or copy raster later
                # by value: 1) directTransfer = True, update service and exist
                #           2) not directTransfer, still need to copy
                if singleras.endswith(".crf"):
                    # check if no change is needed for CRF
                    useDirectTransfer = rasterutils.useDirectTransfer(singleras)
                    # skip copy is only possible when by value, CRF is already uploaded to hosted raster store
                    # and not running on AGOL.
                    if useDirectTransfer and not byref and not rasterutils.RUN_ON_AGOL:
                        skipCopy = True

                # input raster is a single file path
                inras = singleras
            elif datafolder:
                srs = rasterutils.getOutSR(context)
                # Creating empty image collection first
                if not srs:
                    mdpath = rasterutils.createMD(mdws, outrasname, props=moreags)
                else:
                    mdpath = rasterutils.createMD(mdws, outrasname, srs, props=moreags)

                if mdpath:
                    rtname, rtPara, rtProp = rastertypes.getRasterType(rtJSON)
                    # Parse raster type parameter setting
                    if rtPara != {}:
                        auxin = ";".join([" ".join([key, json.dumps(rtPara[key])]) for key in rtPara])
                    else:
                        auxin = ""
                    
                    # Set Geographic Transformation setting
                    arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
                    arcpy.AddMessage("Add image data to mosaic dataset.")
                    arcpy.AddRastersToMosaicDataset_management(
                        mdpath, rtname, datafolder, aux_inputs=auxin)
                    inras = mdpath

                # Need to validate, do not continue if no item is added to the mosaic
                itemcount = int(arcpy.GetCount_management(mdpath).getOutput(0))
                if itemcount < 1:
                    arcpy.AddError("No image in collection to copy.")
                    # Clean up data and mosaic dataset
                    cleanup(mdpath, prjfolder)
                    sys.exit(1)
                # Note: for Raster Product, if there is only one raster item, copy using that item.
                elif itemcount == 1:
                    firsraster = _get_first_raster(mdpath)
                    if firsraster:
                        inras = firsraster
                        singleras = inras

                """
                Post processing after create mosaic dataset
                """
                # Define Nodata
                nodataparams = rasterutils._checkdefinenodata(moreags)
                if nodataparams:
                    rasterutils._definenodata(mdpath, nodataparams)
                # Build Footprints
                footprintsparams = rasterutils._checkbuildfootprints(moreags)
                if footprintsparams:
                    arcpy.AddMessage("Build footprints with {} method...".format(footprintsparams["footprintsMethod"]))
                    arcpy.BuildFootprints_management(
                        mdpath, where_clause=footprintsparams["whereClause"],
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

                # Set additional image collection properties
                rasterutils.setMosaicProperties(mdpath, moreags)
                rasterutils.insertFunction(mdpath, rasfunction)
                arcpy.AddMessage("Set mosaic dataset default properties.")
            else:
                arcpy.AddError("Not a valid image data list.")
        else:
            arcpy.AddError("Not a valid image data list.")
            sys.exit(0)

        # Define new service info to update
        newinfo = {
            "properties": {
                "path": "",
                "isManaged": "true"
            }
        }


        # Execute the Generate Raster tool =====================================
        # Set output extent and spatial reference
        outsr = rasterutils.getOutSR(context)
        outext, extsr = rasterutils.getExtent(context)
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.snapRaster = rasterutils.getSnapRaster(context)
        arcpy.env.compression = rasterutils.getcompression(context)
        # Set parallel processing environment
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        arcpy.env.resamplingMethod = rmethod
        rmethodlist = ["NEAREST", "BILINEAR", "CUBIC", "MAJORITY"]
        # rmethodlist = ["NEAREST", "BILINEAR", "CUBIC", "MAJORITY", "BILINEAR_PLUS",
        #                "BILINEAR_GAUSSBLUR", "BILINEAR_GAUSSBLUR_PLUS",
        #                "AVERAGE", "MINIMUM", "MAXIMUM", "VECTOR_AVERAGE"]
        try:
            rindex = rmethodlist.index(rmethod)
        except:
            rindex = 0

        # Start logging progress
        # progress = rasterutils.logprogress()
        # Set process as multidimensional option
        asmd = ""
        if "processAsMultidimensional" in moreags:
            asmd = moreags["processAsMultidimensional"]
            if type(asmd) == bool and not asmd:
                asmd = "CURRENT_SLICE"
            else:
                asmd = "ALL_SLICES"
        
        transpose = "NO_TRANSPOSE"
        if "buildTranspose" in moreags:
            transpose = moreags["buildTranspose"]
            if transpose and type(transpose) == bool:
                transpose = "TRANSPOSE"
            else:
                transpose = "NO_TRANSPOSE"

        # Branch out: use Copy Raster core tool if no resampling and clipping,
        # otherwise use the Generate Raster from Raster Function tool.
        uri = ""
        # Directly accessing service datasource if we can find it.
        # Note: temporary workaround since colocated logic not working on AGOL if URL is given
        arcpy.AddMessage("Publishing Raster...")
        if rasterutils.RUN_ON_AGOL:
            o = urlparse(inras)
            if o.scheme in ["http", "https"] and o.netloc and o.path.endswith("/ImageServer"):
                rastersrc = rasterutils.getImageServiceDatasource(inras)
                if rastersrc:
                    inras = rastersrc

        if singleras and rasfunction:
            arcpy.AddMessage("Single imager upload with raster function template...")
            rasargs = "Raster \'" + inras + "\'"
            # If raster function is given, use generate raster to produce output
            outras = rasterutils.appendcrf(outras)
            result = arcpy.GenerateRasterFromRasterFunction_management(
                rasfunction, outras, rasargs, format="CRF", process_as_multidimensional=asmd)
            uri = rasterutils.getURI(arcpy.GetMessages(), outras)
            # If output CRF is multidimensional CRF, may need to build transpose
            if uri and asmd == "ALL_SLICES" and transpose == "TRANSPOSE":
                arcpy.AddMessage("Building transpose for multidimensional raster...")
                arcpy.management.BuildMultidimensionalTranspose(uri)
        elif outcellsize == "" and clipgeometry == "":
            # If no resample/clip parameter set, use Copy Raster right away.
            outras = rasterutils.appendcrf(outras)
            # arcpy.AddMessage(inras)
            # arcpy.AddMessage(outras)

            # Skip copy is only possible when input is CRF and is already uploaded to hosted raster store.
            if skipCopy:
                uri = inras
            else:
                # Only if the input is a single CRF and no need for geotransformation persisting,
                # and data was by ref, we need to transfer again to hosted data store.
                if useDirectTransfer:
                    outdir = os.path.dirname(outras)
                    outras = os.path.basename(inras)
                    # On AGOL, output raster path is given as full path
                    if not outdir:
                        outdir = prjfolder
                        if not outdir:
                            arcpy.AddError("Cannot transfer input CRF. Missing hosted raster store.")
                        else:
                            arcpy.gp.command("TransferFiles " + inras + " " + outdir)
                    else:
                        arcpy.gp.command("TransferFiles " + inras + " " + outdir)
                    arcpy.AddMessage("Direct transfer single CRF.")
                    uri = outdir + "/" + outras
                    rasterutils.getURI("", uri)
                    # arcpy.AddMessage(uri)
                else:
                    use_copy_raster = False
                    # Special check to skip expandable CRF creation input is a single raster
                    # or has raster function template.
                    if singleras or rasfunction:
                        use_copy_raster = True

                    # Prepare output raster path
                    wspath = os.path.dirname(outras)
                    # Pick a raster store path if the output raster is only a name
                    if not wspath:
                        token, referer = rasterutils.getToken(aisurl, 5)
                        rs_conn_path = rasterutils._getRasterStore(aisurl, token, "cloud")[0]
                        # If still cannot find cloud raster store, search for file share type
                        arcpy.AddMessage(rs_conn_path)
                        if not rs_conn_path:
                            token, referer = rasterutils.getToken(aisurl, 5)
                            rs_conn_path = rasterutils._getRasterStore(aisurl, token, "fileshare")[0]
                            if rs_conn_path:
                                wspath = rs_conn_path
                        else:
                            wspath = rs_conn_path

                        # Construct full path for output raster
                        if wspath:
                            outras = wspath + "/" + outras

                    # arcpy.AddMessage(wspath)
                    # If we can retrieve an output workspace path, we will create expandable CRF by default.
                    # Otherwise rely on the core Copy Raster to lookup the output path, output raster will not be expandable.
                    # Note: Workspace path needs to be preserved for image service update.
                    if wspath and not use_copy_raster:
                        arcpy.AddMessage("Creating expandable CRF.")
                        # Read the input raster's property
                        # The properties need to populated are:
                        # 1) Cell size 2) Pixel Type 3) Spatial Reference 4) Number of band
                        # 5) Compression 6) Pyramids 7) Origin
                        # Note: we will always build pyramids
                        input_raster = arcpy.Raster(inras)
                        cell_size = input_raster.meanCellHeight
                        width = input_raster.width
                        height = input_raster.height
                        pyramids_levels = "PYRAMIDS " + str(int(log2(min((width, height))/200)))
                        pixel_options = {"U1": "1_BIT",
                                         "U2": "2_BIT",
                                         "U4": "4_BIT",
                                         "U8": "8_BIT_UNSIGNED",
                                         "S8": "8_BIT_SIGNED",
                                         "U16": "16_BIT_UNSIGNED",
                                         "S16": "16_BIT_SIGNED",
                                         "U32": "32_BIT_UNSIGNED",
                                         "S32": "32_BIT_SIGNED",
                                         "F32": "32_BIT_FLOAT",
                                         "F64": "64_BIT"
                        }
                        pixel_type = pixel_options[input_raster.pixelType]
                        input_sr = input_raster.spatialReference
                        band_count = input_raster.bandCount
                        compression = arcpy.env.compression
                        sr_origin = rasterutils.getOrigin(context)
                        # arcpy.AddMessage(str([str(cell_size), pixel_type, str(band_count), str(pyramids_levels), str(compression), sr_origin]))

                        # Create expandable CRF in scratch folder first
                        scratch_folder = arcpy.env.scratchFolder
                        arcpy.management.CreateRasterDataset(
                            scratch_folder, os.path.basename(outras),
                            cellsize=cell_size, pixel_type=pixel_type,
                            raster_spatial_reference=input_sr, number_of_bands=band_count,
                            pyramids=pyramids_levels, compression=compression, pyramid_origin=sr_origin
                        )

                        # Transfer the expandable CRF to output workspace
                        # Note: Transfering the content of the scratch folder which is only the CRF
                        arcpy.gp.command("TransferFiles " + scratch_folder + " " + wspath)
                        # Note: Confirming the creation of empty bundles folder "_alllayers" within the CRF
                        if os.path.isdir(outras):
                            os.makedirs(os.path.join(outras, "_alllayers"), exist_ok=True)

                        # arcpy.AddMessage(outras)
                        # Mosaic input raster to the expandable CRF
                        arcpy.management.Mosaic(inras, outras)
                        uri = wspath + "/" + os.path.basename(outras)
                        arcpy.management.CalculateStatistics(outras)
                    else:
                        # arcpy.AddMessage(inras)
                        # arcpy.AddMessage(outras)
                        result = arcpy.management.CopyRaster(
                            inras, outras, format="CRF", transform="Transform",
                            process_as_multidimensional=asmd,
                            build_multidimensional_transpose=transpose)
                        uri = rasterutils.getURI(arcpy.GetMessages(), outras)
        else:
            """Now translate input clipping/resampling to JSON function
            template."""
            rftjson = """{
                            "rasterFunction" : "Resample",
                            "rasterFunctionArguments" :
                            {
                                "ResamplingType" : 1,
                                "OutputCellsize" : {"x" : 15, "y" : 15},
                                "Raster" :
                                {
                                    "rasterFunction" : "Clip",
                                    "rasterFunctionArguments" :
                                    {
                                        "ClippingGeometry" :
                                        {
                                            "rings" : [[[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]],
                                            "spatialReference" : {"wkid" : 32628}
                                        },
                                        "extent" : {"xmin" : 0,
                                                    "ymin" : 0,
                                                    "xmax" : 0,
                                                    "ymax" : 0,
                                                    "spatialReference" : {"wkid" : 32628}},
                                        "ClippingType" : 1
                                    }
                                }
                            }
                       }"""

            # Remember to update new service info with the resampling method
            newinfo["properties"]["defaultResamplingMethod"] = rindex

            rftdict = json.loads(rftjson)
            # Set Input cell size
            try:
                rftdict["rasterFunctionArguments"]["OutputCellsize"] = json.loads(outcellsize)
                arcpy.AddMessage("Output cell size specified, resampling the image...")
            except:
                rftdict["rasterFunctionArguments"]["OutputCellsize"] = json.loads('{"x" : "", "y" : ""}')

            # Set resampling type
            rftdict["rasterFunctionArguments"]["ResamplingType"] = rindex

            # Set clipping geometry and extent
            if clipgeometry == "":
                rftdict["rasterFunctionArguments"].pop("Raster")
            else:
                rftdict = rasterutils.getClipargs(rftdict, clipgeometry)

            inrft = json.dumps(rftdict)
            #arcpy.AddMessage(inrft)
            rasargs = "Raster \'" + inras + "\'"
            # If no resample/clip parameter set, use Copy Raster right away.
            outras = rasterutils.appendcrf(outras)
            result = arcpy.GenerateRasterFromRasterFunction_management(
                inrft, outras, rasargs, format="CRF", process_as_multidimensional=asmd)
            uri = rasterutils.getURI(arcpy.GetMessages(), outras)
            if uri and asmd == "ALL_SLICES" and transpose == "TRANSPOSE":
                arcpy.AddMessage("Building transpose for multidimensional raster...")
                arcpy.management.BuildMultidimensionalTranspose(uri)

        # Stop logging progress
        # rasterutils.stopprogress(progress)
        arcpy.AddMessage("Updating image service...")
        # Update output ========================================================
        # Check if output contains URI
        # 1. If no URI found, return output as is
        # 2. If URI found, update service
        if uri == "":
            arcpy.AddMessage("No data store URI returned.")
        else:
            arcpy.AddMessage("Updating service with data store URI.")
            # arcpy.AddMessage(uri)
            newinfo["properties"]["path"] = uri
            # Get federated token to update image service
            token, referer = rasterutils.getToken(isurl)
            # Read and update image service info
            sinfo = rasterutils.getServiceInfo(aisurl, token, referer)

            # Set raster data properties if there is any.
            rasterutils.setRasterProperties(uri, context)
            # Set service properties if there is any.
            if "sourceType" in moreags:
                if str(moreags["sourceType"]).lower() == "thematic":
                    newinfo["properties"]["defaultResamplingMethod"] = 0

            if sinfo != {}:
                token, referer = rasterutils.getToken(aisurl, 5)
                # arcpy.AddMessage(token)
                # arcpy.AddMessage(str(newinfo))
                # arcpy.AddMessage(str(sinfo))
                msg = rasterutils.updateService(aisurl, sinfo, newinfo, token, referer)
                arcpy.AddMessage(msg)
                # # Update Portal Item properties if necessary
                # imsg = rasterutils.updateItemProperties(iid, outrasjson)
                # arcpy.AddMessage(imsg)
                rasterutils.refreshPortalItem(iid)
            else:
                arcpy.AddWarning("No service updated although data store URI generated.")

        # Set output raster parameter
        outval = {"itemId": iid, "url": isurl}
        arcpy.SetParameterAsText(6, json.dumps(outval))

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages())

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))

    finally:
        #if skipCopy is True, then the tempfolder has the final data
        if not skipCopy:
            time.sleep(10)
            cleanup(mdpath, tempfolder)
