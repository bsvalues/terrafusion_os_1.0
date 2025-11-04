"""-----------------------------------------------------------------------------
Name:              BatchPublishRaster.py
Purpose:           Batch publish multiple images as hosted image layers. The image
                   could be uploaded.
Author:            Esri Inc.
Created:           9/18/2019
Copyright:   (c)   Esri, Inc. 2019
ArcGIS Version:    10.8
-----------------------------------------------------------------------------"""
# core libraries
import json
import sys
import os
from datetime import datetime

# internal libraries
import arcpy
import rasterutils
# TODO: Support different raster types
import rastertypes

TASK_NAME = 'BatchPublishRaster'


def validateSource(serviceconf, imgpaths):
    """
    This method is update the hosted image source path in service configuration
    and also validate if the data was already transferred to the target raster store.
    If the service configuration JSON input contains a relative path, check if
    the relative path exists in then transferred image file path.
    :param serviceconf: service configuration JSON dictionary
    :param imgpaths: the list of file paths that is transferred to raster store
    :return: the updated service configuration with the updated source data path
    """
    try:
        sourcepath = serviceconf["properties"]["path"]
        arcpy.AddMessage("Image service source data path: {}".format(sourcepath))
        if sourcepath in imgpaths:
            return serviceconf
        else:
            # TODO: Has to go through every image in the list to search,
            #  better to update service conf if upload success.
            # Hosted image could be transfer to raster store, search the
            # uploaded file list to find whether image service configuration
            # has a match.
            for path in imgpaths:
                # Prepare index for case no.3
                srcind = path.rfind(sourcepath)
                # Search every path in the uploaded file list
                if path.endswith(sourcepath):
                    serviceconf["properties"]["path"] = path
                    return serviceconf
                # Hosted image could be converted to crf
                elif path.endswith(os.path.basename(os.path.splitext(sourcepath)[0]) + ".crf"):
                    serviceconf["properties"]["path"] = path
                    return serviceconf
                # Also needs to consider the case when the uploaded files belongs to
                # a CRF raster dataset folder
                # e.g. path = /cloudStores/s3cloudstore/abc.crf/alllayers/L01
                # TODO: there is no gaurantee all the files of CRF would be uploaded successfully.
                elif srcind > -1 and path.endswith("conf.json"):
                    # Make sure conf.json file is under the new dataset path
                    # Handle case like this: /cloudStores/dem/dem/conf.json
                    newpath = path[:srcind + len(sourcepath)]
                    if newpath == os.path.dirname(path):
                        serviceconf["properties"]["path"] = newpath
                        return serviceconf

        arcpy.AddWarning("Hosted source image is not in the hosted raster store.")
        return {}
    except KeyError as err:
        arcpy.AddWarning("Image service configuration does not contain valid data path.")
        return {}
    except Exception as err:
        arcpy.AddMessage("Failed to validate hosted data source.")
        return {}


def publishHostedImageLayers(servicesconflist, imgpaths, context=None):
    """
    :param servicesconflist: list of image service configuration to be published
    :param imgpaths: source image path used to validate the service configuration
    :return: list of successfully published image service URLs
    """
    serviceurls = []
    folderid = None
    try:
        if isinstance(servicesconflist, list) and imgpaths:
            for service in servicesconflist:
                if "serviceConfig" in service and "serviceName" in service["serviceConfig"]:
                    serviceconf = service["serviceConfig"]
                    newconf = validateSource(serviceconf, imgpaths)
                    if not newconf:
                        arcpy.AddWarning("Invalid source data path in service configuration.")
                        continue
                    if "itemProperties" in service and "folderId" in service["itemProperties"]:
                        folderid = service["itemProperties"]["folderId"]
                    sname = {"name": service["serviceConfig"]["serviceName"]}
                    iid = rasterutils._createService(sname, folderid)
                    if iid:
                        arcpy.AddMessage("Successfully published hosted image layer: {}".format(service["serviceConfig"]["serviceName"]))
                        arcpy.AddMessage('Items: [{"serviceName": "' + service["serviceConfig"]["serviceName"] + '", "itemID": "' + iid + '"}]')
                        isurl, aisurl = rasterutils.getISUrlFromItemID(iid)
                        token, referer = rasterutils.getToken(isurl, 5)

                        # Set raster properties if needed
                        if context and "properties" in newconf and "path" in newconf["properties"]:
                            srcpath = newconf["properties"]["path"]
                            # Set raster data properties if there is any.
                            rasterutils.setRasterProperties(srcpath, context)

                        # Read and update image service info
                        sinfo = rasterutils.getServiceInfo(aisurl, token, referer)
                        msg = rasterutils.updateService(aisurl, sinfo, newconf, token, referer)
                        arcpy.AddMessage("Successfully update image service: {}".format(msg))
                        serviceurls.append(isurl)
                    else:
                        arcpy.AddMessage("Failed to publish image service: {}".format(service["serviceConfig"]["serviceName"]))
        else:
            arcpy.AddMessage("No Hosted Image service to publish")
        return serviceurls
    except Exception as err:
        arcpy.AddMessage("Failed to publish multiple hosted image layers.")
        arcpy.AddMessage(err)
        return serviceurls


# TODO: Need to validate whether the source data path is valid
def publishNonHostedImageLayers(servicesconflist):
    """
    :param servicesconflist: list of image service configuration to be published
    :param imgpaths: source image path used to validate the service configuration
    :return: list of successfully published image service URLs
    """
    serviceurls = []
    folderid = None
    try:
        # 3. Construct admin call to create service,
        if isinstance(servicesconflist, list):
            for service in servicesconflist:
                if "serviceConfig" in service and "serviceName" in service["serviceConfig"]:
                    if "itemProperties" in service and "folderId" in service["itemProperties"]:
                        folderid = service["itemProperties"]["folderId"]
                    # Portal sharing API support creating non-hosted image layer
                    sname = {"name": service["serviceConfig"]["serviceName"], "copyData": False}
                    iid = rasterutils._createService(sname, folderid)
                    if iid:
                        arcpy.AddMessage("Successfully published image layer: {}".format(service["serviceConfig"]["serviceName"]))
                        arcpy.AddMessage('Items: [{"serviceName": "' + service["serviceConfig"]["serviceName"] + '", "itemID": "' + iid + '"}]')
                        isurl, aisurl = rasterutils.getISUrlFromItemID(iid)
                        token, referer = rasterutils.getToken(isurl, 5)
                        # Read and update image service info
                        sinfo = rasterutils.getServiceInfo(aisurl, token, referer)
                        msg = rasterutils.updateService(aisurl, sinfo, service["serviceConfig"], token, referer)
                        arcpy.AddMessage("Successfully update image service: {}".format(msg))
                        serviceurls.append(isurl)
                    else:
                        arcpy.AddMessage("Failed to publish image service: {}".format(service["serviceConfig"]["serviceName"]))
        else:
            arcpy.AddMessage("No image layer to publish")
        return serviceurls
    except Exception as err:
        arcpy.AddMessage("Failed to publish multiple image layers.")
        arcpy.AddMessage(err)
        return serviceurls


def publishServices(servicesconf, imgpaths=None, context=None):
    """
    Batch publish multiple image layers
    :param servicesconf: services configurations, a dictionary with "services" key
    :param imgpaths: optional image paths list, can be used to validate the service configuration
    :return: successfully published service list
    """
    servicesurls = []
    try:
        servicesconflist = []
        if "services" in servicesconf:
            conflist = servicesconf["services"]
            if conflist and isinstance(conflist, list):
                for service in conflist:
                    if isinstance(service, dict):
                        if "serviceConfig" in service:
                            conf = service["serviceConfig"]
                            if isinstance(conf, dict) and "serviceName" in conf and "properties" in conf:
                                if "path" in conf["properties"]:
                                    servicesconflist.append(service)

                if servicesconflist:
                    if imgpaths:
                        servicesurls = publishHostedImageLayers(servicesconflist, imgpaths, context)
                    else:
                        # TODO: Support publish non-hosted image layer
                        servicesurls = publishNonHostedImageLayers(servicesconflist)
                    return servicesurls

        arcpy.AddError("Missing service configuration")
        return servicesurls
    except Exception as err:
        arcpy.AddWarning(err)
        return servicesurls


def publishEmptyServices(serviceconfs):
    """
    Batch publish multiple image service with list of service configuration.
    :param serviceconfs: list of services configuration JSONs
    :param imgpaths: optional image paths list, can be used to validate the service configuration
    :return: successfully published service url and item id list.
    """
    itemdict = {}
    try:
        newconflist = []
        if serviceconfs and isinstance(serviceconfs, list):
            for service in serviceconfs:
                if isinstance(service, dict):
                    if "serviceConfig" in service:
                        conf = service["serviceConfig"]
                        if isinstance(conf, dict) and "serviceName" in conf and "properties" in conf:
                            if "path" in conf["properties"]:
                                newconflist.append(service)

            arcpy.AddMessage("Services to be published: {}".format(str(newconflist)))
            if newconflist:
                for service in newconflist:
                    folderid = None
                    if "serviceConfig" in service and "serviceName" in service["serviceConfig"]:
                        if "itemProperties" in service and "folderId" in service["itemProperties"]:
                            folderid = service["itemProperties"]["folderId"]
                        sname = {"name": service["serviceConfig"]["serviceName"]}
                        if "capabilities" in service["serviceConfig"]:
                            sname["capabilities"] = service["serviceConfig"]["capabilities"]
                        iid = rasterutils._createService(sname, folderid)
                        if iid:
                            itemdict[iid] = service
                            arcpy.AddMessage("Successfully published hosted image layer: {}".format(service["serviceConfig"]["serviceName"]))
                            arcpy.AddMessage('Items: [{"serviceName": "' + service["serviceConfig"]["serviceName"] + '", "itemID": "' + iid + '"}]')
                        else:
                            arcpy.AddWarning("Failed to create image service: {}".format(str(sname)))
                if not itemdict:
                    arcpy.AddError("Failed to publish all image service.")
        else:
            arcpy.AddError("Missing service configuration")

        return itemdict
    except Exception as err:
        arcpy.AddWarning(err)
        return itemdict


def matchSource(serviceconfs, filelist):
    """
    This is the method to mactch the raster data in service configuration and the
    uploaded file list.
    :param serviceconfs: all service configuration to be published
    :param filelist: all uploaded file list
    :return: matched file list.
    """
    matchlist = []
    if not isinstance(serviceconfs, dict) and not isinstance(filelist, list):
        return []

    # Check each service configuration, find matched data for publishing from uploaded file list
    for serviceconf in serviceconfs:
        try:
            # Match the source data referenced by image service with uploaded file list
            srcname = serviceconf["serviceConfig"]["properties"]["path"]
            arcpy.AddMessage("Image service source data path: {}".format(srcname))

            # Use the first appearance is enough, if there are duplication, then the
            # uploaded image would be overwritten too.
            # matchpath = [fname for fname in filelist if fname.endswith(srcname)]
            matchpath = []
            for fname in filelist:
                if fname.endswith("conf.json"):
                    crfpath = os.path.dirname(fname)
                    if crfpath.endwith(srcname):
                        matchpath.append(crfpath)
                elif fname.endswith(srcname):
                    matchpath.append(fname)

            if matchpath:
                matchlist.append(matchpath[0])
                filelist = list(set(filelist) - set(matchpath))
            else:
                arcpy.AddMessage("No matched upload data in service configuration {}".format(serviceconf))
        except:
            arcpy.AddMessage("No data path in service configuration {}".format(serviceconf))
            continue

    arcpy.AddMessage("Publishing data {}".format(str(matchlist)))
    return matchlist


def matchSourceEx(serviceconfs, filelist):
    """
    This is the method to mactch the raster data in service configuration and the
    uploaded file list.
    :param serviceconfs: all service configuration to be published
    :param filelist: all uploaded file list
    :return: a dictionary that matches the file path and service configuration.
             e.g. {".../abc.crf": {"serviceName":. ...}, "}}
    """
    if not isinstance(serviceconfs, dict) and not isinstance(filelist, list):
        return None

    # Check each service configuration, find matched data for publishing from uploaded file list
    matchdict = {}
    for serviceconf in serviceconfs:
        try:
            # Match the source data referenced by image service with uploaded file list
            srcname = serviceconf["serviceConfig"]["properties"]["path"]
            arcpy.AddMessage("Image service source data path: {}".format(srcname))

            # Use the first appearance is enough, if there are duplication, then the
            # uploaded image would be overwritten too.
            # matchpath = [fname for fname in filelist if fname.endswith(srcname)]
            matchpath = []
            for fname in filelist:
                if fname.endswith("conf.json"):
                    crfpath = os.path.dirname(fname)
                    if crfpath.endswith(srcname):
                        matchpath.append(crfpath)
                elif fname.endswith(srcname):
                    matchpath.append(fname)

            if matchpath:
                matchdict[matchpath[0]] = serviceconf
                filelist = list(set(filelist) - set(matchpath))
            else:
                arcpy.AddMessage("No matched upload data in service configuration {}".format(serviceconf))
        except:
            arcpy.AddMessage("No data path in service configuration {}".format(serviceconf))
            continue

    if matchdict:
        arcpy.AddMessage("Publishing data {}".format(str(matchdict)))
        return matchdict
    else:
        arcpy.AddError("Uploaded data does not match with service configuration.")
        return None


if __name__ == '__main__':
    # Read input parameter of BatchPublishRaster service tool
    inrasters = arcpy.GetParameterAsText(0)
    convert2CRF = arcpy.GetParameter(1)
    context = arcpy.GetParameterAsText(3)

    outurls = []
    imglist = []
    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkHostedImageryPrivilge()

        # Input syntax:
        # e.g. from publishing tool
        # {
        #     "services": [
        #         {
        #             "serviceConfig": {
        #                 "serviceName": "bned_1b",
        #                 "type": "ImageServer",
        #                 "capabilities": "Image, Metadata, Mensuration",
        #                 "provider": "ArcObjectsRasterRendering",
        #                 "properties": {
        #                     "path": "/rasterStores/rs/Hosted_batch1569281433744/data/ned_1.tif",
        #                     "isManaged": true
        #                 }
        #             },
        #             "itemProperties": {"folderId":""}
        #         },
        #         {
        #             "serviceConfig": {
        #                 "serviceName": "bned_2b",
        #                 "type": "ImageServer",
        #                 "capabilities": "Image, Metadata, Mensuration",
        #                 "provider": "ArcObjectsRasterRendering",
        #                 "properties": {
        #                     "path": "/rasterStores/rs/Hosted_batch1569281433744/data/ned_2.tif",
        #                     "isManaged": true
        #                 }
        #             }
        #         }
        #     ],
        #     // Note:
        #     // uri refers to actual image file UNC paths or data store relative paths
        #     // url refers specifically to portal uploaded file item urls
        #     // itemId refers to either server uploaded items or portal uploaded items
        #     "itemIds": ["", ""],
        #     "itemOnServer": True
        # }
        # Note: Get all image files item paths, note all image files includes .ovr/.xml/aux.xml etc. files

        # 1. Check if service configuration exists in the input JSON
        inrasdict = rasterutils._parsecontext(inrasters)
        if "services" not in inrasdict:
            arcpy.AddError("Missing service configuration")
            arcpy.SetParameterAsText(2, json.dumps(outurls))
            sys.exit(0)

        # 2. Check if there is image files need to be uploaded from input JSON.
        # Only if the input JSON contains the following keys, we assume there is hosted data to be uploaded.
        arcpy.AddMessage("Input Rasters are: {}".format(str(inrasdict)))
        if any(key in inrasdict for key in ["itemId", "itemIds", "url", "urls", "uri", "uris"]):
            # Parse input raster paths
            inras = rasterutils.getInDataPath(inrasdict)
            arcpy.AddMessage("Parsed Input Rasters are: {}".format(str(inras)))
            if inras:
                # Get the input image list
                if isinstance(inras, list):
                    imglist = inras
                elif isinstance(inras, str):
                    imglist = inras.split(",")
                else:
                    imglist = str(inras).split(",")

            # Check if there is valid raster first.
            if not imglist:
                arcpy.AddError("No valid hosted raster to be published.")
                arcpy.SetParameterAsText(2, json.dumps(outurls))
                sys.exit(0)

            arcpy.AddMessage("Image file items to be uploaded are: {}".format(imglist))
            # Get Raster store location for data upload first
            raurl = rasterutils.RASTER_ANALYTIC_HELPER
            token, referer = rasterutils.getToken(raurl, 5)
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            foldername = "hosted_batch_" + timestamp
            adminurl = raurl + "/admin/"
            # Get workspace for uploading hosted imagery data
            prjfolder = rasterutils.getHostedDataFolder(adminurl, foldername, token)
            # arcpy.AddMessage("Hosted folder: {}".format(prjfolder))

            # Get file path to download or convert
            imgpaths = []
            """For Enterprise:
            Imagery data will be downloaded to the raster store first, then decide
            whether we need to convert the format.
            """
            # arcpy.AddMessage(str(rasterutils.RUN_ON_AGOL))
            if not rasterutils.RUN_ON_AGOL:
                # Upload hosted images then publish hosted image layers
                serverDownload = rasterutils._checkServerUpload(inrasdict)
                arcpy.AddMessage("Data upload mode: {}".format(str(serverDownload)))
                # Upload image files to hosted raster store
                datafolder, imgpaths = rasterutils.downloadUploadedImagestoDataStore(
                    imglist, prjfolder, serverDownload)
                # arcpy.AddMessage("Hosted data folder: {}".format(datafolder))
                # arcpy.AddMessage("Hosted data paths: {}".format(str(imgpaths)))

                # Note: The uploaded files may be more than the service definition defined
                # e.g. uploaded ned_1.tif/ned_1.tif.ovr/ned_1.aux.xml, but data referenced
                #      by the service is only ned_1.tif
                # Convert raster dataset to CRF if the uploaded hosted data is not CRF.
                # Note: if the hosted raster data cannot be converted, we will still publish as is.
                if convert2CRF:
                    # First find the matched data source in the service configuration property
                    imgpaths = matchSource(inrasdict["services"], imgpaths)
                    # Only convert the match raster data set. i.e. no need to try to convert aux.xml
                    for imgpath in imgpaths:
                        # Check if the uploaded data is CRF, if not, convert
                        filename, file_extension = os.path.splitext(imgpath)
                        if file_extension.lower() != ".crf":
                            crfpath = filename + ".crf"
                            arcpy.AddMessage(
                                "Converting image {} to Raster Store.".format(os.path.basename(imgpath)))
                            crfpath = rasterutils.saveas(imgpath, crfpath, context)
                            # If cannot convert hosted image to CRF, leave it as is
                            # TODO: need to delete the original uploaded hosted image
                            if crfpath:
                                imgpaths[imgpaths.index(imgpath)] = crfpath
                            else:
                                arcpy.AddWarning(
                                    "Moving data to Hosted Raster Store failed: {}.".format(os.path.basename(imgpath)))

                # Check if the data is uploaded successfully.
                if not imgpaths:
                    arcpy.AddError("Cannot upload hosted raster to Raster Store.")
                    arcpy.SetParameterAsText(2, json.dumps(outurls))
                    sys.exit(0)

                # Report failure if image upload failed.
                outurls = publishServices(inrasdict, imgpaths, context)
            else:
                """For ArcGIS Online:
                We always convert uploaded image to CRF. 
                """
                # First match the uploaded imagery data name with service configuration.
                imgdicts = matchSourceEx(inrasdict["services"], imglist)
                arcpy.AddMessage("Matching image paths for services to be published {}".format(str(imgdicts)))

                if imgdicts and isinstance(imgdicts, dict):
                    matchedconfs = list(imgdicts.values())
                    # Only convert the match raster data set. i.e. no need to try to convert aux.xml
                    # For the case of CRF, it could be:
                    # {"services": [{"service":...}], "uris": ["/cloudStores/...../a.crf",..]}
                    # It should be copied, not convert.

                    # On AGOL, we have to publish the service first to get the portal item id.
                    # Then we will be converting the CRF in the item id folder.
                    iddicts = publishEmptyServices(matchedconfs)

                    # Check if services created successfully
                    if not iddicts:
                        sys.exit(0)

                    # If the service was published successfully, now convert the data CRF
                    for imgpath in imgdicts:
                        # For ArcGIS Online, we need to publish the service first
                        # then move the data to the itemID folder
                        # Always have to copy to org raster store even when the input is already CRF
                        filename, file_extension = os.path.splitext(imgpath)
                        if filename:
                            # Use image service info to search corresponding item id.
                            # If item id was not found, should remove this image from the list.
                            itemid = ""
                            serviceinfo = imgdicts[imgpath]
                            for iid in iddicts:
                                if serviceinfo == iddicts[iid]:
                                    itemid = iid
                                    break

                            # If no corresponding item id found, skip to next image
                            if not itemid:
                                arcpy.AddWarning("No image service created for image file: {}".format(os.path.basename(imgpath)))
                                break

                            # Convert CRF image to the item id folder
                            crfpath = prjfolder + "/" + itemid + "/" + os.path.basename(filename) + ".crf"
                            arcpy.AddMessage("Moving image {} to Hosted Raster Store.".format(os.path.basename(imgpath)))
                            crfpath = rasterutils.saveas(imgpath, crfpath, context)

                            if crfpath:
                                # If the image was converted successfully, update service definition
                                isurl, aisurl = rasterutils.getISUrlFromItemID(itemid)
                                # Get federated token to update image service
                                token, referer = rasterutils.getToken(isurl, 5)
                                # Read and update image service info
                                sinfo = rasterutils.getServiceInfo(aisurl, token, referer)
                                newinfo = {
                                    "properties": {
                                        "path": crfpath,
                                    }
                                }
                                msg = rasterutils.updateService(aisurl, sinfo, newinfo, token, referer)
                            else:
                                arcpy.AddWarning(
                                    "Moving data to Hosted Raster Store failed: {}.".format(os.path.basename(imgpath)))
                                rasterutils.deleteItem(itemid)
                        else:
                            arcpy.AddWarning("No image file name for uploaded image: {}".format(os.path.basename(imgpath)))

                else:
                    arcpy.AddError("All Uploaded data do not match image service configuration.")
                    sys.exit(0)

        else:
            # If the uploaded data link was not sent separately from the service configuration JSON,
            # the data path should be embedded in the service configuration, and it is publish
            # by reference case.
            # There could be two cases:
            # 1. convert CRF or it is running on AGOL, convert is always on.
            # 2. no convert CRF setting
            if convert2CRF or rasterutils.RUN_ON_AGOL:
                imgpaths = []
                # Get Raster store location for data conversion
                raurl = rasterutils.RASTER_ANALYTIC_HELPER
                token, referer = rasterutils.getToken(raurl, 5)
                timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
                foldername = "hosted_batch_" + timestamp
                adminurl = raurl + "/admin/"
                # Get workspace for uploading hosted imagery data
                datafolder = rasterutils.getHostedDataFolder(adminurl, foldername, token)

                # Convert the by reference image in service configuration to CRF
                for ras in inrasdict["services"]:
                    # Find the source data path in the service configuration
                    try:
                        imgpath = ras["serviceConfig"]["properties"]["path"]
                        filename, file_extension = os.path.splitext(imgpath)
                        if filename:
                            crfpath = datafolder + "/" + os.path.basename(filename) + ".crf"
                            arcpy.AddMessage(
                                "Converting image {} to Cloud Raster Format.".format(os.path.basename(filename)))
                            crfpath = rasterutils.saveas(imgpath, crfpath, context)
                            if crfpath:
                                imgpaths.append(crfpath)
                        else:
                            arcpy.AddMessage("Service configuration does not contain image path for conversion.")
                            arcpy.AddMessage("Service configuration: {}".format(ras))
                    except Exception as err:
                        arcpy.AddMessage("Service configuration does not contain image path for conversion.")
                        arcpy.AddMessage("Service configuration: {}".format(ras))

                outurls = publishServices(inrasdict, imgpaths, context)
            else:
                # If no image files need to be uploaded or converted, switch to publish by reference mode
                outurls = publishServices(inrasdict)

        # Set output image service urls
        arcpy.SetParameterAsText(2, json.dumps(outurls))

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))

