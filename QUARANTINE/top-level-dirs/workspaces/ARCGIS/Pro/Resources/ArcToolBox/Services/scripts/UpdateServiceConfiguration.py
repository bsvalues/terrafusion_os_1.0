"""-----------------------------------------------------------------------------
Name:              UpdateServiceConfiguration.py
Purpose:           This is the system Geoprocessing service to update image
                   service configuration. It also support adding raster function
                   templates as image service built-in renderingRule
Author:            Esri Inc.
Created:           3/25/2020
Copyright:   (c)   Esri, Inc. 2020
ArcGIS Version:    10.8.1
-----------------------------------------------------------------------------"""
# core libraries
import sys
import os
import requests

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'UpdateServiceConfiguration'
# Check if new configuration contains mosaic dataset properties
mdprops = ["maxImageWidth", "maxImageHeight", "maxRecordCount",
           "maxMosaicImageCount", "allowedMosaicMethods"]


def getServiceItemIds(sconf):
    """
    Return list of Portal Item the service is linked to:
    :param sconf: service configuration JSON
    :return: list of itemIds
    """
    try:
        itemslist = []
        # Check the service portal item ID - for use to look up folder in AGOL
        if "portalProperties"  in sconf:
            if "portalItems" in sconf["portalProperties"]:
                items = sconf["portalProperties"]["portalItems"]
                if isinstance(items, list):
                    for item in items:
                        if isinstance(item, dict):
                            if "itemID" in item and "type" in item:
                                itemslist.append(item)
        return itemslist
    except Exception as err:
        return []


def readDatasetProperties(desc, mdprops):
    """
    Read a list of properties from dataset describe object
    :param desc: describe object of the mosaic dataset
    :param proplist: list of mosaic dataset properties
    :return: list of properties values, if not found, return None
    """
    if mdprops and isinstance(mdprops, list):
        outprop = dict((prop, "#") for prop in mdprops)
        for prop in mdprops:
            try:
                if prop == "maxImageWidth":
                    outprop[prop] = desc.maxRequestSizeX
                elif prop == "maxImageHeight":
                    outprop[prop] = desc.maxRequestSizeY
                elif prop == "maxRecordCount":
                    outprop[prop] = desc.maxDownloadImageCount
                elif prop == "maxMosaicImageCount":
                    outprop[prop] = desc.maxRastersPerMosaic
                elif prop == "allowedFields":
                    outprop[prop] = desc.allowedFields
                elif prop == "allowedMosaicMethods":
                    outprop[prop] = desc.allowedMosaicMethods
                else:
                    continue
            except:
                continue
        return outprop
    else:
        return None


def validateDatasetProperties(serviceconf, dspropdict):
    """
    This method is used to compare the dataset properties against the definition
    in the service configuration.
    :param serviceconf: the full service configuration JSON
    :param propdict: dataset's properties dictionary
    :return: new dataset properties dictionary to update the dataset
    """
    outprop = {}
    try:
        if not isinstance(dspropdict, dict):
            return None

        for prop in dspropdict:
            if prop == "maxImageWidth" and "maxImageWidth" in serviceconf:
                dsprop = rasterutils.safe_case(dspropdict[prop], int)
                serviceprop = rasterutils.safe_case(dspropdict[prop], int)
                if dsprop and serviceprop and serviceprop > dsprop:
                    outprop[prop] = serviceprop
            elif prop == "maxImageHeight" and "maxImageHeight" in serviceconf:
                dsprop = rasterutils.safe_case(dspropdict[prop], int)
                serviceprop = rasterutils.safe_case(dspropdict[prop], int)
                if dsprop and serviceprop and serviceprop > dsprop:
                    outprop[prop] = serviceprop
            elif prop == "maxRecordCount" and "maxRecordCount" in serviceconf:
                dsprop = rasterutils.safe_case(dspropdict[prop], int)
                serviceprop = rasterutils.safe_case(dspropdict[prop], int)
                if dsprop and serviceprop and serviceprop > dsprop:
                    outprop[prop] = serviceprop
            elif prop == "maxMosaicImageCount" and "maxMosaicImageCount" in serviceconf:
                dsprop = rasterutils.safe_case(dspropdict[prop], int)
                serviceprop = rasterutils.safe_case(dspropdict[prop], int)
                if dsprop and serviceprop and serviceprop > dsprop:
                    outprop[prop] = serviceprop
            elif prop == "allowedFields" and "allowedFields" in serviceconf:
                dsprop = rasterutils.safe_case(dspropdict[prop], str)
                serviceprop = rasterutils.safe_case(dspropdict[prop], str)
                if dsprop and serviceprop:
                    ldsprop = dsprop.split(",")
                    lserviceprop = serviceprop.split(",")
                    morefield = list(set(ldsprop) & set(lserviceprop))
                    if len(morefield) > 1:
                        outprop[prop] = serviceprop
            elif prop == "allowedMosaicMethods" and "allowedMosaicMethods" in serviceconf:
                dsprop = rasterutils.safe_case(dspropdict[prop], str)
                serviceprop = rasterutils.safe_case(dspropdict[prop], str)
                if dsprop and serviceprop:
                    ldsprop = dsprop.split(",")
                    lserviceprop = serviceprop.split(",")
                    morefield = list(set(ldsprop) & set(lserviceprop))
                    if len(morefield) > 1:
                        outprop[prop] = serviceprop
            else:
                continue

        return outprop
    except:
        return None


def updateMosaicDatasetProperties(sconf, newconf):
    """
    Based on the service configuration, check and update mosaic dataset default
    properties.
    :param sconf: service configuration JSON of the existing service
    :param newconf: new service configuration settings
    :return: list of updated properties.
    """
    try:
        # if any new properties are present, need to open and check the source data
        if set(newconf.keys()) & set(mdprops):
            datapath = rasterutils.getImageServiceCatalogPath(sconf)
            if rasterutils.isMosaic(datapath):
                # Check mosaic dataset properties first
                desc = arcpy.Describe(datapath)
                dsprops = readDatasetProperties(desc)
                # Check if the properties defined in the service configuration
                # is the same as defined in the mosaic dataset.
                # Generate a list of properties that needs to be updated.
                newprops = validateDatasetProperties(newconf, dsprops)

                if newprops and isinstance(newprops, dict):
                    # Set mosaic dataset properties
                    maxheight = newprops["maxImageHeight"] if "maxImageHeight" in newprops else "#"
                    maxwidth = newprops["maxImageWidth"] if "maxImageWidth" in newprops else "#"
                    maxrecord = newprops["maxRecordCount"] if "maxRecordCount" in newprops else "#"
                    maximage = newprops["maxMosaicImageCount"] if "maxMosaicImageCount" in newprops else "#"
                    allowedmmethod = newprops["maxImageHeight"] if "maxImageHeight" in newprops else "#"
                    arcpy.management.SetMosaicDatasetProperties(
                        datapath, rows_maximum_imagesize=maxheight,
                        columns_maximum_imagesize=maxwidth, allowed_mensuration_capabilities="#",
                        default_mensuration_capabilities="#",
                        allowed_mosaic_methods=allowedmmethod,
                        max_num_per_mosaic=maximage,
                        max_num_of_records_returned=maxrecord)

                    return True
    except Exception as err:
        arcpy.AddMessage("Failed to configure mosaic dataset properties.")
        return False


def getRasterFunction(aisurl, afritemids, itemid=None):
    """
    Add raster function template to the image service
    :param aisurl: Image service admin API
    :param afritem: the raster function template portal item
    :return: succeed for setting the function template, failed if not.
    """
    try:
        # arcpy.AddMessage(afritemids)
        afrpaths = ""
        # Step 1: Parse raster function template item Ids
        rftlists = []
        rftitems = list(rasterutils.getJSON(afritemids))
        # arcpy.AddMessage(rftitems)
        if len(rftitems) > 0:
            rftitemsjson = rftitems[0]
            # arcpy.AddMessage(str(rftitemsjson))
            if rftitemsjson.keys() & {"itemId", "itemIds"}:
                if "itemId" in rftitemsjson:
                    rftlists.append(rftitemsjson["itemId"])
                elif "itemIds" in rftitemsjson and isinstance(rftitemsjson["itemIds"], list):
                    # arcpy.AddMessage(rftitemsjson["itemIds"])
                    rftlists = rftitemsjson["itemIds"]

        if rftlists:
            # Running on AGOL, itemid must be given.
            if rasterutils.RUN_ON_AGOL and not itemid:
                arcpy.AddError("Cannot find corresponding item for ArcGIS Online Hosted Image Layer.")

            if rasterutils.RUN_ON_K8S and not itemid:
                arcpy.AddError("Cannot find corresponding item for ArcGIS Enteprise for Kubernetes Hosted Image Layer.")

            rftpathlist = []
            arcpy.AddMessage("Adding Raster Function Template items to service: {}".format(str(rftlists)))
            # Download raster function template files from Portal
            isfolder = arcpy.env.scratchFolder
            arcpy.AddMessage("Downloading raster function template items.")
            rftpathlist = rasterutils._downloadRasterFunctions(rftlists, isfolder)
            # arcpy.AddMessage(str(afrpathlist))

            # upload to image server
            if rasterutils.RUN_ON_AGOL or rasterutils.RUN_ON_K8S:
                rftpathlist = uploadRasterFunctionsAGOL(aisurl, rftpathlist, itemid)
            else:
                rftpathlist = uploadRasterFunctions(aisurl, rftpathlist)

            if rftpathlist:
                afrpaths = ",".join(rftpathlist)
        else:
            arcpy.AddWarning("Invalid raster function template item.")

        return afrpaths
    except Exception as err:
        arcpy.AddWarning("Failed to configure raster function template to image serivce.")
        return ""


def uploadRasterFunctions(aisurl, rftpaths):
    """
    This method is used to upload raster function template files to image server.
    Note: the UpdateServiceConfiguration service tool is running on RA server.
    Function template files need to be uploaded to the server where the service is published.
    :param aisurl: image service admin URL
    :param rftpaths: raster function template path list
    :return: final list of raster function template that has been uploaded.
    e.g. c:\arcgisserver\config-store\services\GreatBeijing2016_Pansharpen.ImageServer\esriinfo\afr\Slopejson.rft.json
    """
    rftlist = []
    try:
        adminidx = aisurl.find("/admin/services")
        if adminidx > -1:
            # Query the service configuration arcgissystem folder with admin API
            # 15 mins token time out for upload rft
            token, referer = rasterutils.getToken(aisurl, 15)
            sysurl = aisurl[:adminidx] + "/admin/system/configstore"
            data = {"f": "json", "token": token, "referer": referer}
            r = requests.post(sysurl, params=data, verify=False)
            msg = r.json()
            # arcpy.AddMessage(str(msg))
            if msg and "connectionString" in msg and "type" in msg:
                # TODO: Support other type of configure store
                if msg["type"] != "FILESYSTEM":
                    arcpy.AddWarning("Server config-store needs to be FILESYSTEM to support raster function template.")
                else:
                    configpath = msg["connectionString"]
                    if configpath:
                        winpath = configpath.find("\\") > -1
                        nixpath = configpath.find("/") > -1
                        # Construct iteminfo upload URL
                        upurl = aisurl + "/iteminfo/upload"
                        isidx = aisurl.find("/services/")
                        for rftpath in rftpaths:
                            arcpy.AddMessage("Upload raster function template: {}".format(os.path.basename(rftpath)))
                            multipart_form_data = {
                                "file": (os.path.basename(rftpath), open(rftpath, "rb")),
                            }
                            data = {"f": "json", "folder": "afr", "token": token, "referer": referer}
                            r = requests.post(upurl, data=data, files=multipart_form_data, verify=False)
                            msg = r.json()
                            # arcpy.AddMessage(msg)
                            if msg and "status" in msg:
                                if msg["status"] == "success":
                                    if winpath and isidx > -1:
                                        rftlist.append(configpath + aisurl[isidx:].replace("/", "\\") + "\\esriinfo\\afr\\" + os.path.basename(rftpath))
                                    elif nixpath and isidx > -1:
                                        rftlist.append(configpath + aisurl[isidx:] + "/esriinfo/afr/" + os.path.basename(rftpath))
                                    arcpy.AddMessage(str(rftlist))
                    else:
                        arcpy.AddWarning("Image Server does not have valid config-store.")

        return rftlist
    except Exception as err:
        return rftlist


def uploadRasterFunctionsAGOL(aisurl, rftpaths, itemid):
    """
    This method is used to upload raster function template files to ArcGIS Online
    cloud store. Function template file should be uploaded to the corresponding
    itemid folder of the image service.
    :param aisurl: image service admin URL
    :param rftpaths: raster function template path list
    :param itemid: image service portal item id
    :return: final list of raster function template that has been uploaded.
    """
    rftlist = []
    try:
        # Get hosted data folder
        token, referer = rasterutils.getToken(aisurl, 5)
        itemfolder = rasterutils.getHostedDataFolder(aisurl, itemid, token)

        # Use transfer files to move raster function template file to the cloud store
        inrftpaths = ";".join(rftpaths)
        arcpy.gp.command(
            "TransferFiles " + inrftpaths + " " + itemfolder + " -overwrite 1")

        # If transfer succeeded, construct file path
        for rftpath in rftpaths:
            rftlist.append(itemfolder + "/" + os.path.basename(rftpath))

        return rftlist
    except Exception as err:
        arcpy.AddError("Failed to transfer raster function template file to hosted data store.")
        return ""


if __name__ == '__main__':
    # Parsing Input Parameters
    inservice = arcpy.GetParameterAsText(0)
    newconf = arcpy.GetParameterAsText(1)
    afritem = arcpy.GetParameterAsText(2)

    try:
        # 1. Read the input image service configuration
        # Get service URL and construct service admin API
        isurl = rasterutils.getInDataPath(inservice)
        aisurl = rasterutils.getISAdminUrl(isurl)

        token, referer = rasterutils.getToken(isurl)
        # Read and update image service info
        sconf = rasterutils.getServiceInfo(aisurl, token, referer)
        # Validate service info
        if not sconf:
            arcpy.AddError("Error getting service definition: {}".format(isurl))
            arcpy.SetParameterAsText(3, "")
            sys.exit(0)

        # 2. Now merge the new service configuration with the exsiting
        newconfdict = list(rasterutils.getJSON(newconf))
        if not newconfdict:
            arcpy.AddError("Invalid new service configuration: {}".format(newconf))
            arcpy.SetParameterAsText(3, "")
            sys.exit(0)
        else:
            newconf = newconfdict[0]
            # Now validation the service name
            if "serviceName" in sconf and "serviceName" in newconf:
                if not sconf["serviceName"] == newconf["serviceName"]:
                    arcpy.AddError("Invalid new service configuration. serviceName value is different to the service to be updated.")
                    arcpy.SetParameterAsText(3, "")
                    sys.exit(0)
            # else:
            #     arcpy.AddError("Invalid new service configuration. No 'serviceName' value.")
            #     arcpy.SetParameterAsText(3, "")
            #     sys.exit(0)

        # 4. Update raster function template if needed
        if afritem:
            # For AGOL, we need service's item ID to move raster function template file
            if rasterutils.RUN_ON_AGOL or rasterutils.RUN_ON_K8S:
                itemid = ""
                itemslist = getServiceItemIds(sconf)
                if itemslist:
                    primaryitem = itemslist[0]
                    if "itemID" in primaryitem:
                        itemid = primaryitem["itemID"]
                afrpath = getRasterFunction(aisurl, afritem, itemid)
            else:
                afrpath = getRasterFunction(aisurl, afritem)

            # arcpy.AddMessage(afrpath)
            if afrpath:
                if "properties" in newconf:
                    if "rasterFunctions" in newconf["properties"]:
                        rft = newconf["properties"]["rasterFunctions"]
                        if rft:
                            newconf["properties"]["rasterFunctions"] = rft + "," + afrpath
                        else:
                            newconf["properties"]["rasterFunctions"] = afrpath
                    else:
                        newconf["properties"]["rasterFunctions"] = afrpath
                else:
                    newconf["properties"] = {"rasterFunctions": afrpath}

        # 5. Special handling for the default raster function template.
        if "properties" in newconf:
            if "defaultTemplate" in newconf["properties"] and "rasterFunctions" in newconf["properties"]:
                drft = newconf["properties"]["defaultTemplate"]
                existingrfts = newconf["properties"]["rasterFunctions"]
                if isinstance(drft, str) and drft.lower() != "none" and isinstance(existingrfts, str):
                    # Need to match the setting value with existing template
                    existingrfts = existingrfts.split(",")
                    matchrft = ""
                    for rft in existingrfts:
                        if drft.lower() == os.path.basename(rft).lower():
                            matchrft = rft
                    if matchrft:
                        newconf["properties"]["defaultTemplate"] = matchrft
                    else:
                        arcpy.AddWarning("defaultTemplate is not one of the existing raster functions defined in Image Service.")


        # Merge the service definition after passed the validation
        msg = rasterutils.updateService(aisurl, sconf, newconf, token, referer)

        # 3. Update mosaic dataset if needed
        updateMosaicDatasetProperties(sconf, newconf)

        # Set output raster parameter
        if not msg.endswith("successfully."):
            arcpy.AddError(msg)
            arcpy.SetParameterAsText(3, "failed")
        else:
            arcpy.AddMessage(msg)
            arcpy.SetParameterAsText(3, "succeeded")

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
        arcpy.SetParameterAsText(3, "failed")
