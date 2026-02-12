"""-----------------------------------------------------------------------------
Name:              ListDatastore.py
Purpose:           This Raster Analysis tool list all the folders and supported
                   raster dataset under a registered server data store (cloud
                   store in most of the cases)
Author:            Esri Inc.
Created:           03/13/2018
Copyright:   (c)   Esri, Inc. 2018
ArcGIS Version:    10.6.1
-----------------------------------------------------------------------------"""
# core libraries
import json
import requests
import os

# internal libraries
import arcpy
import rasterutils
import aiutils

TASK_NAME = 'ListDatastoreContent'


def filterdatastore(filter):
    """
    Use the filter to list registered data store item pr
    :param filter: list of keyword string to determine specific data store type to search, separated by comma
      e.g. "folder,cloudStore,rasterStore"
    :return: list of data store items
    """
    try:
        dslist = []
        # parse filter setting first
        if type(filter) == str:
            dskeys = [dskey.strip() for dskey in filter.strip().split(",")]
        else:
            return dslist

        # arcpy.AddMessage(str(dskeys))
        raurl = rasterutils.RASTER_ANALYTIC_HELPER
        token, referer = rasterutils.getToken(raurl, 10)
        if raurl and dskeys:
            adminurl = raurl + "/admin/data/findItems"
            # arcpy.AddMessage(u"Raster Analytics server admin url data store items: {}".format(adminurl))
            # parse keywords to find out what to search for.
            supportedtypes = ["folder", "cloudStore", "rasterStore"]
            dstypes = ",".join(list(set(dskeys) & set(supportedtypes)))
            data = {"f": "json", "types": dstypes, "token": token}

            r = requests.post(adminurl, params=data, verify=False)
            # arcpy.AddMessage(u"No exception at sending post request.")
            msgjson = r.json()
            # arcpy.AddMessage(str(msgjson))
            if "items" in msgjson:
                fsds = msgjson["items"]
                if fsds:
                    for ds in fsds:
                        if "info" in ds and "path" in ds:
                            dslist.append(ds["path"])

        return dslist
    except Exception as err:
        return []


def filter_chips_folder(all_content):
    """
    Filter listed files and find deep learning chips folder
    What defines a deep learning image chips folder is the present of map.txt/stats.txt/image(folder)/

    :param all_content (Union[list, dict]): Content list from ListDatastore GP command
    :return: all_content with qualified deep_learning_chips folders added in each listed folder
    """
    try:
        if not isinstance(all_content, dict):
            return all_content
    
        for ds in all_content:  # ds: datastore or datastore folders
            image_chips_folders = {}
            for fpath in all_content[ds]:
                # We only check "folder" as files cannot be valid image
                # chips folder.
                # Use file extension to determine if the path is a file or
                # folder
                ext = os.path.splitext(fpath)[1]
                if ext:
                    continue

                folder_structure = aiutils.check_image_chips_folder_structure(fpath)
                image_chips_folder_path = fpath
                if folder_structure == aiutils.CYCLEGAN:
                    image_chips_folder_path += "A"
                elif folder_structure == aiutils.CHANGE_DETECTION:
                    image_chips_folder_path += "images_after"
                if not aiutils.check_image_chips_files(image_chips_folder_path):
                    continue
                metadata = aiutils.get_image_chips_metadata(image_chips_folder_path)

                # If get_image_chips_metadata error out, it returns an empty
                # dictionary. Don't add empty dcit to the result list.
                if metadata:
                    image_chips_folders[fpath] = metadata

            # If any image chips folder found, return the chips folder list
            if image_chips_folders:
                arcpy.AddMessage(f"Adding image chips folder to the content list for {ds}.")
                all_content[ds].append({"deep_learning_chips": image_chips_folders})

        return all_content
    except Exception as err:
        return all_content


if __name__ == '__main__':
    """
    Support a single data store entry or a list of data store entries
    e.g. /cloudStores/somecloudstore/....
    ["/cloudStores/somecloudstore1/....", "/cloudStores/somecloudstore2/..."]
    [{"itemId": ""}, {"itemId": ""}]
    More search keywords:
    no datastore name input - list all registered data store items
    "cloudStores,fileShares,rasterStores" list all data store items of that type
    """
    inds = arcpy.GetParameterAsText(0)  # registered server data store name
    ffilter = arcpy.GetParameterAsText(1)  # data filter

    try:
        # Check Image Server extension license
        # if arcpy.CheckExtension("Image") != "Available":
        #     raise rasterutils.LicenseError

        # Check special case for deep learning chips
        finddlchips = False
        if "Deep_Learning_Chips" in ffilter:
            ffilter = ffilter.replace("Deep_Learning_Chips", "")
            finddlchips = True

        # Parse input data store string
        outContent = {}
        dslist = rasterutils.eval_data_list(inds)
        # arcpy.AddMessage(str(dslist))
        if isinstance(dslist, list):
            for ds in dslist:
                if isinstance(ds, str):
                    if ffilter:
                       outval = arcpy.gp.command(
                           "ListDatastore '" + ds + "' " + ffilter)
                    else:
                       outval = arcpy.gp.command(
                           "ListDatastore '" + ds + "' ")

                    imglist = rasterutils.eval_data_list(outval)
                    if imglist and isinstance(imglist, list):
                        outContent[ds] = imglist

        elif isinstance(dslist, str):
            if dslist == "":
                dslist = "folder,cloudStore,rasterStore"
            dsitems = filterdatastore(dslist)
            if dsitems:
                outContent = dsitems    # outContent become list
            else:
                if ffilter:
                    outval = arcpy.gp.command(
                        "ListDatastore '" + dslist + "' " + ffilter)
                else:
                    outval = arcpy.gp.command(
                        "ListDatastore '" + dslist + "' ")

                imglist = rasterutils.eval_data_list(outval)
                if imglist and isinstance(imglist, list):
                    outContent[dslist] = imglist

        if outContent:
            # further filtering on specific item type
            if finddlchips:
                arcpy.AddMessage("Searching for image chips folder...")
                outContent = filter_chips_folder(outContent)

            # Set output datastore list
            outval = {"contentList": outContent}
            arcpy.SetParameterAsText(2, json.dumps(outval))
        else:
            arcpy.SetParameterAsText(2, "No image content found in data store.")

    except rasterutils.LicenseError as err:
        rasterutils.AddExceptionError(
            TASK_NAME, rasterutils.errorMsgs.get(120302))
    except Exception as err:
        rasterutils.AddExceptionError(
            TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
