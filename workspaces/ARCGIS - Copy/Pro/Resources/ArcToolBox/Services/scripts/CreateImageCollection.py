"""-----------------------------------------------------------------------------
Name:              CreateImageCollection.py
Purpose:           Create mosaic dataset from a uploaded image collection. This
                   scripting tool supports portal item or data store sharing
                   folder as input data. The output is a mosaic dataset, which
                   will be created if not existed.
Author:            Esri Inc.
Created:           12/21/2015
Copyright:   (c)   Esri, Inc. 2015
ArcGIS Version:    10.6
-----------------------------------------------------------------------------"""
# core libraries
import json
import os

# internal libraries
import arcpy
import rasterutils
import rastertypes
import realityutils

TASK_NAME = 'CreateImageCollection'
# Support resampling method list
rmethodlist = ["NEAREST", "BILINEAR", "CUBIC", "MAJORITY"]
# rmethodlist = ["NEAREST", "BILINEAR", "CUBIC", "MAJORITY", "BILINEAR_PLUS",
#                "BILINEAR_GAUSSBLUR", "BILINEAR_GAUSSBLUR_PLUS",
#                "AVERAGE", "MINIMUM", "MAXIMUM", "VECTOR_AVERAGE"]


def configureProps(mdpath, newinfo):
    """
    Method to configure the initial image service properties
    :param mdpath: the mosaic dataset path the image collection
    :param newinfo: the initial service configuration
    :return: updated image service configuration
    """
    try:
        # Make sure new service configuration is valid
        if isinstance(newinfo, dict) and "properties" in newinfo:
            props = newinfo["properties"]
        else:
            return newinfo

        # Setting image serivice default properties read from mosaic dataset
        desc = arcpy.Describe(mdpath)
        # Parsing allowedField to JSON
        allowedFields = desc.allowedFields
        allowedFields = ",".join(allowedFields.split(";"))
        if allowedFields:
            props["allowedFields"] = allowedFields
            props["availableFields"] = allowedFields
            # Now only pick the
            sortablefield = []
            fields = arcpy.ListFields(mdpath)
            for field in fields:
                if field.name in allowedFields.split(","):
                    if field.type in ["Double", "Integer", "Single", "Date", "OID", "SmallInteger"]:
                        sortablefield.append(field.name)
            if sortablefield:
                sortablefield = ",".join(sortablefield)
            props["sortableFields"] = sortablefield
            props["sortValue"] = 0
        # Parsing allowedMosaicMethods
        allowedMosaicMethods = desc.allowedMosaicMethods
        allowedMosaicMethods = ",".join(allowedMosaicMethods.split(";"))
        if allowedMosaicMethods:
            props["allowedMosaicMethods"] = allowedMosaicMethods
            props["availableMosaicMethods"] = allowedMosaicMethods
        # Parsing availableMensurationCapabilities/allowedMensurationCapabilities
        availableMensurationCapabilities = desc.availableMensurationCapabilities
        availableMensurationCapabilities = ",".join(availableMensurationCapabilities.split(";"))
        allowedMensurationCapabilities = desc.allowedMensurationCapabilities
        allowedMensurationCapabilities = ",".join(allowedMensurationCapabilities.split(";"))
        if availableMensurationCapabilities:
            props["availableMensurationCapabilities"] = availableMensurationCapabilities
        if allowedMensurationCapabilities:
            props["allowedMensurationCapabilities"] = allowedMensurationCapabilities
        # Parsing maxImageHeight
        maxImageHeight = desc.maxImageHeight
        if maxImageHeight:
            props["maxImageHeight"] = maxImageHeight
        # Parsing maxImageWidth
        maxImageWidth = desc.maxImageWidth
        if maxImageWidth:
            props["maxImageWidth"] = maxImageWidth
        # Parsing maxRecordCount
        maxRecordCount = desc.maxRecordCount
        if maxRecordCount:
            props["maxRecordCount"] = maxRecordCount
        # Parsing maxMosaicImageCount
        maxMosaicImageCount = desc.maxMosaicImageCount
        if maxMosaicImageCount:
            props["maxMosaicImageCount"] = maxMosaicImageCount
        # Parsing maxDownloadImageCount
        maxDownloadImageCount = desc.maxDownloadImageCount
        if maxDownloadImageCount:
            props["maxDownloadImageCount"] = maxDownloadImageCount
        # Parsing maxDownloadSizeLimit
        maxDownloadSizeLimit = desc.maxDownloadSizeLimit
        if maxDownloadSizeLimit:
            props["maxDownloadSizeLimit"] = maxDownloadSizeLimit
        # Parsing defaultResamplingMethod
        defaultResamplingMethod = desc.defaultResamplingMethod
        if defaultResamplingMethod:
            rproplist = ["Nearest Neighbor", "Bilinear Interpolation", "Cubic Convolution", "Majority"]
            renum = rproplist.index(defaultResamplingMethod)
            props["defaultResamplingMethod"] = renum
        # Setting defaults
        props["availableCompressions"] = "None,JPEG,LZ77,LERC"
        props["allowedCompressions"] = "None,JPEG,LZ77,LERC"
        props["defaultCompressionTolerance"] = 0.01
        props["defaultCompressionQuality"] = 75
        props["maxSampleCount"] = 1000
        props["colormapToRGB"] = False
        props["exportTilesAllowed"] = False
        props["allowFunction"] = True
        #props["defaultTemplate"] = "None"
        props["allowCopy"] = False
        props["allowAnalysis"] = True

        return newinfo
    except Exception as err:
        return newinfo


def check_is_managed(service_json):
    """
    Method to check if "isManaged" is set in the output service JSON
    :param service_json: JSON object defines the output
    :return: True if isManaged is missing or set to True, otherwise return False
    """
    is_managed = "true"
    service_json_dict = {}
    try:
        if isinstance(service_json, str):
            service_json_dict = list(rasterutils.getJSON(service_json))[0]
        elif isinstance(service_json, dict):
            service_json_dict = service_json
        
        if "isManaged" in service_json_dict:
            is_managed = service_json_dict["isManaged"]
            if not is_managed or is_managed == "false":
                is_managed = "false"
        return is_managed
    except Exception as err:
        return is_managed
    

if __name__ == '__main__':
    initems = arcpy.GetParameterAsText(0)
    """
    image service referencing output collection (mosaic dataset)
    e.g. {"itemId": "no213u0uiif8924989h98h0123",
          "url": "http://rdvmags02.esri.com/arcgis/rest/services/Hosted/testis",
          "uri": "mdname"}
    """
    outcol = arcpy.GetParameterAsText(1)
    # rastype is the raster type keyword + setting
    rastype = arcpy.GetParameterAsText(2)
    context = arcpy.GetParameterAsText(3)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkHostedImageryPrivilge()

        # 1. Validating input parameters
        # Get the list of input rasters
        # If the service is running on AGOL, source data must be coming from data store
        # Check if the input item is from server or portal or datastore
        origin = rasterutils._checkServerUpload(initems)
        byref, cpmosaic, inras, allbyref = rasterutils.getHostedDataPath(initems)
        if inras:
            arcpy.AddMessage("Input raster is: {}".format(inras))
        else:
            arcpy.AddError("Cannot get input Raster.")

        iid, isurl, aisurl, mdname = rasterutils.getOutRasterPath(outcol)
        # Note: on AGOL, mdname returned will have "<item id>/<dataset name>".
        # Only use the base name to avoid dataset name being too long.
        if rasterutils.RUN_ON_AGOL:
            mdname = os.path.basename(mdname)
        arcpy.AddMessage("Output item id is: {0}".format(iid))
        arcpy.AddMessage("Output image service url is: {0}".format(isurl))
        # arcpy.AddMessage("Output image service admin url is: {0}".format(aisurl))

        # 2. Parse settings
        # Parse raster type settings
        # Note: raster type setting may also contains spatial reference
        rtJSON = list(rasterutils.getJSON(rastype))
        rtname = ""
        rtPara = {}
        rtProp = {}

        if len(rtJSON) > 0:
            rtJSON = rtJSON[0]
            arcpy.AddMessage("Raster type JSON is: {}".format(str(rtJSON)))
            rtname, rtPara, rtProp = rastertypes.getRasterType(rtJSON)
            arcpy.AddMessage("Raster type name is: {}".format(rtname))
            arcpy.AddMessage("Raster type parameters are: {}".format(str(rtPara)))
            arcpy.AddMessage("Image collection properties are: {}".format(str(rtProp)))

        # Parse raster type parameter setting
        if rtPara and isinstance(rtPara, dict):
            para_list = []
            for key in rtPara:
                if isinstance(rtPara[key], dict):
                    para_list.append(key + " " + json.dumps(rtPara[key]))
                elif not isinstance(rtPara[key], str):
                    para_list.append(key + " '" + str(rtPara[key]) + "'")
                else:
                    para_list.append(key + " '" + rtPara[key] + "'")
            auxin = ";".join(para_list)
        else:
            auxin = ""

        # Parse image collection key properties setting
        if rtProp and isinstance(rtProp, dict):
            prop_list = []
            for key in rtProp:
                if isinstance(rtProp[key], dict):
                    para_list.append(key + " " + json.dumps(rtProp[key]))
                elif not isinstance(rtProp[key], str):
                    prop_list.append(key + " '" + str(rtProp[key]) + "'")
                else:
                    prop_list.append(key + " '" + rtProp[key] + "'")
            keyprop = ";".join(prop_list)
        else:
            keyprop = ""

        # 3. Creating image collection
        # Turn on overwrite
        arcpy.env.overwriteOutput = 1
        # parse addtional settings from context
        moreags = rasterutils._parsecontext(context)
        # Set parallel processing environment
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        # Read resampling method
        rmethod = rasterutils.getResamplingMethod(context)
        arcpy.env.resamplingMethod = rmethod
        # Set Geographic Transformation setting
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        # Branch out by value vs by ref
        datafolder = ""
        mdpath = ""
        mdws = ""
        managedrs = []

        # As release 10.8.1, we will always create hosted data folder
        # Find the project workspace for hosted source images
        # Find the output mosaic dataset workspace for creating mosaic dataset
        token, referer = rasterutils.getToken(isurl, 5)
        # arcpy.AddMessage("Server admin token: {0}".format(token))
        # Get workspace for uploading hosted imagery data
        # Updated logic:
        # 1) if unique workspace specified, use the workspace name + "imagery" as the served folder name
        # 2) if unique workspace not specified, use item ID as the name of the folder
        # 3) if item ID is not available (stand-alone server), use the unique mosaic dataset/service name
        reality_ws = realityutils.get_reality_workspace(context)
        if reality_ws:
            fld_name = reality_ws + "/imagery"
            imgfolder = rasterutils.getHostedDataFolder(aisurl, fld_name, token)
        elif iid:
            imgfolder = rasterutils.getHostedDataFolder(aisurl, iid, token) + "/imagery"
            reality_ws = iid
        else:
            imgfolder = rasterutils.getHostedDataFolder(aisurl, mdname, token) + "/imagery"
            reality_ws = mdname

        # Make sure file folder directory is created before moving forward
        if imgfolder:
            imgfolder = rasterutils.generate_directory(imgfolder)

        # arcpy.AddMessage(imgfolder)
        # AGOL v9.2: support publishing existing mosaic dataset from upload and
        # repair source data path.
        # sample syntax from input data is:
        # {"mosaic_dataset": "https://..../uploadedgdb.gdb/mosaicdataset", "data_path":
        # "/vsiaz/orgid/blobcontainer/newdata"}
        # Applies to ArcGIS Online Only for now
        uploadedmd = ""
        oldpath = ""
        #if rasterutils.RUN_ON_AGOL:
        uploadedmd, oldpath = rasterutils.get_uploaded_mosaic_dataset(initems)
        
        # arcpy.AddMessage(uploadedmd)
        # Step 1: Prepare input data paths to ingest to mosaic dataset.
        #         Or if the input is a mosaic dataset, use it as is.
        # Lookup workspace for hosted mosaic dataset
        if allbyref:
            # If publishing by reference and raster type is not "Table",
            # we want to publish the mosaic dataset as is.
            # we also want to prevent people from adding mosaic dataset as single raster
            # to another mosaic dataset.
            arcpy.AddMessage("Publishing all by ref.")
            datafolder = imgfolder + "/data"
            mdpath = inras
            mdws = os.path.dirname(mdpath)
        elif not byref:
            # Note: in the case of publishing mosaic dataset itself by reference, the
            #       hosted workspace is not used.
            mdws, managedrs = rasterutils.getMosaicWorkspace(aisurl, mdname, token, imgfolder, reality_ws)
            # arcpy.AddMessage(mdws)
            # This is by value image collection creation
            # If input is mosaic dataset -
            # If they are images - copy to hosted data folder, then create mosaic dataset in database raster store
            if cpmosaic:
                resetops = rasterutils._parseResetOptions(context)
                arcpy.AddMessage("Copying mosaic dataset to data store...")
                mdpath = os.path.join(mdws, mdname)
                arcpy.Copy_management(inras, mdpath)
                if resetops:
                    if rasterutils._resetMosaicDataset(mdpath, resetops):
                        arcpy.AddMessage("Successfully reset the image collection.")
                    else:
                        arcpy.AddMessage("Reset image collection failed.")

                # TODO: If user uploaded only mosaic dataset, shouldn't store data referenced by mosaic dataset
                # datafolder = os.path.join(os.path.dirname(os.path.dirname(mdpath)), "data")
            elif uploadedmd:
                # Download source data from portal folder to raster store
                if isinstance(inras, list):
                    inraslist = inras
                elif isinstance(inras, str):
                    inraslist = inras.split(",")
                else:
                    inraslist = str(inras)

                arcpy.AddMessage("Transferring uploaded images to raster store...")
                datafolder, imglist = rasterutils.downloadUploadedImagestoDataStore(
                    inraslist, imgfolder, origin)

                # Transfer mosaic dataset to raster store
                mdpath = rasterutils.transfer_mosaic_dataset(uploadedmd, mdws, mdname)
                # Repair mosaic dataset path
                if oldpath:
                    # arcpy.AddMessage("Old paths to repair: " + str(oldpath))
                    # arcpy.AddMessage("Target path: " + str(datafolder))
                    rasterutils.repair_mosaic_dataset_paths(mdpath, oldpath, datafolder)
            else:
                # Download source data from portal folder to raster store
                if isinstance(inras, list):
                    inraslist = inras
                elif isinstance(inras, str):
                    inraslist = inras.split(",")
                else:
                    inraslist = str(inras)

                arcpy.AddMessage("Transferring uploaded images to raster store...")
                datafolder, imglist = rasterutils.downloadUploadedImagestoDataStore(
                    inraslist, imgfolder, origin)

                # Prioritize the output coordinate system from the context parameter first.
                srs = rasterutils.getOutSR(context)

                # Note: the mosaic dataset is created in data store; also check first
                # source image for valid EXIF header GPS coordinate. If no GPS,
                # we use Mercator.
                # TODO: to get UTM zone from drone images in cloud store not supported yet
                if not srs:
                    srs = rasterutils.getUTMZoneSR(datafolder)
                if srs:
                    arcpy.AddMessage("Found UTM coordinate system from images' GPS coordinates.")

                # Creating the empty image collection first
                if not srs:
                    mdpath = rasterutils.createMD(mdws, mdname, props=moreags)
                else:
                    mdpath = rasterutils.createMD(mdws, mdname, srs, props=moreags)

        else:
            # Note: in the case of publishing mosaic dataset itself by reference, the
            #       hosted workspace is not used.
            mdws, managedrs = rasterutils.getMosaicWorkspace(aisurl, mdname, token, workspace=reality_ws)
            # arcpy.AddMessage(mdws)
            # Creating image collection by reference
            # mosaic dataset - Create hosted image service by referencing mosaic dataset directly
            if cpmosaic:
                resetops = rasterutils._parseResetOptions(context)
                arcpy.AddMessage("Copying mosaic dataset to data store...")
                mdpath = os.path.join(mdws, mdname)
                arcpy.Copy_management(inras, mdpath)
                if resetops:
                    if rasterutils._resetMosaicDataset(mdpath, resetops):
                        arcpy.AddMessage("Successfully reset the image collection.")
                    else:
                        arcpy.AddMessage("Reset image collection failed.")

                # Note: geodatabase storing the mosaic dataset must be in a writable folder
                # datafolder = os.path.dirname(os.path.dirname(mdpath))
            elif uploadedmd:
                # TODO: how to set the data folder for collection when the mosaic dataset is transferred
                # and data is by reference. 
                datafolder = imgfolder + "/data"
                # Transfer mosaic dataset to raster store
                mdpath = rasterutils.transfer_mosaic_dataset(uploadedmd, mdws, mdname)
                # Repair mosaic dataset path
                if oldpath:
                    # arcpy.AddMessage("Old paths to repair: " + str(oldpath))
                    # arcpy.AddMessage("Target path: " + str(datafolder))
                    rasterutils.repair_mosaic_dataset_paths(mdpath, oldpath, datafolder)
            else:
                # Source image data is by reference
                if isinstance(inras, list):
                    datafolder = ";".join(inras)
                elif isinstance(inras, str):
                    datafolder = ";".join(inras.split(","))
                else:
                    datafolder = str(inras)

                # Prioritize the output coordinate system from the context parameter first.
                srs = rasterutils.getOutSR(context)

                # Note: the mosaic dataset is created in data store; also check first
                # source image for valid EXIF header GPS coordinate. If no GPS,
                # we use Mercator.
                if not srs:
                    srs = rasterutils.getUTMZoneSR(datafolder)

                # Creating the "raw" image collection first
                if not srs:
                    mdpath = rasterutils.createMD(mdws, mdname, props=moreags)
                else:
                    mdpath = rasterutils.createMD(mdws, mdname, srs, props=moreags)

        # Step 2: After getting the data path, now move on to add the data
        #         and configuring mosaic dataset.
        # arcpy.AddMessage(datafolder)
        # arcpy.AddMessage(mdpath)
        # Check if raster function template exists in the context parameter
        rasfunction = rasterutils.get_rasterfunc(context)
        # If there is a input data folder or the image collection is existing mosaic dataset
        if datafolder or cpmosaic:
            # Add Raster Data to Collection =====================================
            if mdpath:
                if inras:
                    # Add additional fields to the mosaic dataset
                    fieldslist = rasterutils._parseFields(context)
                    if fieldslist:
                        rasterutils.createFields(mdpath, fieldslist)
                        
                    # Need to prepare schema for future processing
                    arcpy.AddMessage("Preparing image collection table schema.")
                    arcpy.AlterMosaicDatasetSchema_management(
                        mdpath,
                        "ANALYSIS;BOUNDARY;CACHE;COLOR_CORRECTION;DEFINITION;LEVELS;LOG;OVERVIEW;SEAMLINE;STEREO")

                    # Only add rasters if
                    # 1) Input data is not mosaic dataset already
                    # 2) mosaic dataset is uploaded, need to repair data path
                    # 3) mosaic dataset is not all published by ref
                    if not cpmosaic and not uploadedmd and not allbyref:
                        arcpy.AddMessage("Ingesting data to image collection.")
                        # arcpy.AddMessage(mdpath)
                        # arcpy.AddMessage(datafolder)
                        # arcpy.AddMessage(rtname)
                        if (isinstance(rtProp, dict)) and "imageCollectionType" in rtProp and rtProp["imageCollectionType"]=="Aerial" and not byref:
                            result = arcpy.AddRastersToMosaicDataset_management(
                                mdpath, rtname, imglist, estimate_statistics="ESTIMATE_STATISTICS", aux_inputs=auxin)
                        else:
                            result = arcpy.AddRastersToMosaicDataset_management(
                                mdpath, rtname, datafolder, estimate_statistics="ESTIMATE_STATISTICS", aux_inputs=auxin)
                        arcpy.AddMessage("Finished ingesting data to image collection.")
                    
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
                            mdpath, where_clause=footprintsparams["whereClause"], reset_footprint=footprintsparams["footprintsMethod"],
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
                    arcpy.AddMessage("Set mosaic dataset default properties.")

                    # Set image collection properties
                    arcpy.AddMessage("Adding key metadata to image collection...")
                    keymetadata = {
                        "blockadjustment": "raw",
                        "dem": "",
                        "seamlines": "",
                        "colorcorrection": "",
                        "adjust_index": 0,
                        "imagetype": "Unknown"
                    }
                    # Image collection type determines which adjustment tool is used
                    if "imageCollectionType" in rtProp:
                        if rtProp["imageCollectionType"]:
                            keymetadata["imagetype"] = rtProp["imageCollectionType"]

                    # Add hosted folder path to the mosaic dataset keymetadata
                    # disregard of by ref/by value input data, we will always
                    # create hosted data folder.
                    # Note: even in the case of creating imagery layer from
                    # mosaic dataset by reference, we could still build hosted
                    # overviews.
                    arcpy.SetRasterKeyMetadata(mdpath, "_store", imgfolder)
                    arcpy.SetRasterKeyMetadata(
                        mdpath, "orthomapping", json.dumps(keymetadata))
                    # Set raster data properties if there is any.
                    rasterutils.setRasterProperties(mdpath, context)

                    # Build Overview
                    ovrprefix = ""
                    ovrags = rasterutils._checkbuildoverview(moreags)
                    if ovrags:
                        # On ArcGIS Online, the overview path is always in cloud store
                        # raster store. And in the item id folder of the image service.
                        if rasterutils.RUN_ON_AGOL:
                            token, referer = rasterutils.getToken(isurl, 5)
                            rstore = rasterutils._getRasterStore(aisurl, token, "cloud")
                            ovrprefix = rstore[0] + "/" + iid
                        rasterutils._buildoverview(mdpath, ovrags, ovrprefix)

                    # Insert function to mosaic dataset.
                    # Note: the function may manipulate the raster dataset properties
                    # of mosaic dataset, hence it should happen after the overview
                    # generation. Otherwise, the overview may not be able to add back
                    # to the mosaic dataset.
                    rasterutils.insertFunction(mdpath, rasfunction)

                    # Step 3: Update result image service
                    # Set new service info
                    # Default is to add the mosaic dataset path to the "path" property
                    newinfo = {
                        "capabilities": "Image,Catalog,Mensuration,Metadata",
                        "properties": {
                            "path": mdpath,
                        }
                    }
                    # If the mosaic dataset path is pointing to local SDE connection file,
                    # we will switch to use the EGDB data store path.
                    if os.path.dirname(mdpath).endswith(".sde"):
                        if len(managedrs) > 1 and managedrs[1]:
                            newinfo["properties"]["path"] = managedrs[1] + "/" + os.path.basename(mdpath)

                    # Configuring the image service configuration
                    newinfo = configureProps(mdpath, newinfo)

                    # Only in the unique case where mosaic dataset is published as is by reference,
                    # we will not set the "isManaged" flag.
                    newinfo["properties"]["isManaged"] = check_is_managed(initems)

                    # Set service default resampling method if resampling method for processing is given.
                    try:
                        rindex = rmethodlist.index(rmethod)
                        # Only set service property if resampling method is set.
                        newinfo["properties"]["defaultResamplingMethod"] = rmethod
                    except:
                        pass

                    if "sourceType" in moreags:
                        if str(moreags["sourceType"]).lower() == "thematic":
                            newinfo["properties"]["defaultResamplingMethod"] = 0

                    # Update output service and item with the path
                    #arcpy.AddMessage("Output Image Collection path: {0}".format(mdpath))
                    # Get federated token to update image service
                    token, referer = rasterutils.getToken(isurl, 5)
                    # Read and update image service info
                    sinfo = rasterutils.getServiceInfo(aisurl, token, referer)
                    if sinfo and isinstance(sinfo, dict):
                        msg = rasterutils.updateService(aisurl, sinfo, newinfo, token, referer)
                        # get and update iteminfo to make sure it has correct type keyword
                        iteminfo = rasterutils.getItemInfo(iid)
                        if iteminfo and isinstance(iteminfo, dict):
                            if "typeKeywords" in iteminfo and isinstance(iteminfo["typeKeywords"], list):
                                hasImageCollectionKey = False
                                for i in range(len(iteminfo["typeKeywords"])):
                                    if iteminfo["typeKeywords"][i] == "Managed Image Collection":
                                        hasImageCollectionKey = True
                                if not hasImageCollectionKey:
                                    iteminfo["typeKeywords"].append("Managed Image Collection")
                                    rasterutils.updateItemProperties(iid, iteminfo)

                        rasterutils.refreshPortalItem(iid)
                        arcpy.AddMessage(msg)
                    else:
                        arcpy.AddWarning("No service updated although image collection generated.")
                else:
                    arcpy.AddMessage("No image input, empty mosaic dataset created. ")
            else:
                arcpy.AddError("Create new image collection failed.")
        else:
            arcpy.AddError("Cannot locate data store for image files")

        outval = {"itemId": iid, "url": isurl}
        arcpy.SetParameterAsText(4, json.dumps(outval))

        # Clear the workspace connection cache
        if arcpy.Exists(mdws):
            arcpy.management.ClearWorkspaceCache(mdws)

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages())

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except Exception as err:
        arcpy.AddError(err)
