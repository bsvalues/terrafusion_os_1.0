"""-----------------------------------------------------------------------------
Name:              DownloadRaster.py
Purpose:           This service tool is used to download raster from image service
                   for offline use.
Author:            Esri Inc.
Created:           02/15/2020
Copyright:   (c)   Esri, Inc. 2020
ArcGIS Version:    10.8.1
Note:              This system service tool could potentially require
                   configuration of larger volume of server configure store if
                   a large size raster is being download.
-----------------------------------------------------------------------------"""
# core libraries
import os
import json
from datetime import datetime

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'DownloadRaster'


def setClipGeometry(clipgeo):
    """
    This utility function will set the clipping geometry for JSON function
    template that only contains a single Clip raster function.
    :param rftdict: this is the function template JSON dictionary
    :param clipgeo: The clipping geometry could have either geometry, extent, or both
    :return: Clip raster function JSON if clipping geometry is valid, otherwise empty
             string.
    """
    try:
        """Construct Clip raster function template"""
        rftjson = """{
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
                   }"""

        # Load the Clip raster function template
        rftdict = json.loads(rftjson)
        # Read the clipping geometry JSON presentation
        jsongeo = json.loads(clipgeo.lower())
        arcpy.AddMessage("Clip geometry setting found, clipping the image...")

        # Looking for two types of keys:
        # 1. ClippingGeometry
        # 2. extent
        if "clippinggeometry" in jsongeo and jsongeo["clippinggeometry"]:
            rftdict["rasterFunctionArguments"]["ClippingGeometry"] = jsongeo["clippinggeometry"]
            if "extent" in jsongeo:
                rftdict["rasterFunctionArguments"]["extent"] = jsongeo["extent"]
            else:
                jsonext = rasterutils.getClipextent(jsongeo["clippinggeometry"])
                # If valid extent returned, set the value
                if jsonext:
                    rftdict["rasterFunctionArguments"]["extent"] = jsonext
                else:
                    arcpy.AddWarning("Invalid geometry setting, image will not be clipped.")
                    return ""
            return rftdict
        elif "extent" in jsongeo and jsongeo["extent"]:
            rftdict["rasterFunctionArguments"]["extent"] = jsongeo["extent"]
            jsongeoobj = rasterutils.getClipgeo(jsongeo["extent"])
            # If valid geometry returned, set the value
            if jsongeoobj:
                rftdict["rasterFunctionArguments"]["ClippingGeometry"] = jsongeoobj
            else:
                arcpy.AddWarning("Invalid extent setting, image will not be clipped.")
                return ""
            return rftdict
        else:
            arcpy.AddWarning("No clip geometry or extent setting, image will not be clipped.")
            return ""
    except:
        arcpy.AddWarning("Invalid clip geometry or extent setting, image will not be clipped.")
        return ""


def check_download_permission(isurl):
    """
    Method to check if the image service has allowDownload enabled
    :param img: JSON dictionary of input images
    :return: True if yes, False if no
    """
    try:
        if isinstance(isurl, dict):
            if "url" in isurl:
                isurl = isurl["url"]

        if isinstance(isurl, str):
            # If the input is not image service, simply return True
            aisurl = rasterutils.getISAdminUrl(isurl)
            # Get federated token to update image service
            token, referer = rasterutils.getToken(isurl)
            if not token:
                return True
            # Read and update image service info
            sinfo = rasterutils.getServiceInfo(aisurl, token, referer)
            if sinfo:
                if "properties" in sinfo:
                    if "allowCopy" in sinfo["properties"]:
                        # Have to explicitly check for boolean value, empty means yes
                        if sinfo["properties"]["allowCopy"] is False or sinfo["properties"]["allowCopy"] == "false":
                            return False
        return True
    except Exception as err:
        return True


def downloadImage(imgobj, clipgeometry=None):
    """
    Copy single image to Cloud Optimized Tiff (COG)
    :param imgobj: the input image path or JSON
    :param clipsetting: clippting setting
    :return: output image path
    """
    try:
        # Use scratch folder to store temporarily output for Enterprise output.
        # Use user blob container to store output for AGOL output.
        # In order for user to get the downloaded raster, they need to generate_direct_access_url to generate 
        # access token to the blob container.
        if rasterutils.RUN_ON_AGOL:
            scratchws = "/cloudStores/" + rasterutils.ORG_ID + "-" + rasterutils.USER_ID + "/_image_download"
        else:
            scratchws = arcpy.env.scratchFolder

        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        imgname = "downloadimage_" + timestamp + ".tif"
        # Override output name if specified in the input JSON
        img = ""
        if isinstance(imgobj, str):
            img = imgobj
        elif isinstance(imgobj, dict):
            if "downloadName" in imgobj:
                imgname = str(imgobj["downloadName"]) + ".tif"
            if "url" in imgobj:
                img = str(imgobj["url"])
            else:
                arcpy.AddWarning("Invalid download image: {}".format(str(imgobj)))
        else:
            img = str(imgobj)

        outras = os.path.join(scratchws, imgname)
        # Make sure output raster file is unique
        outras = rasterutils.generate_filename(outras)
        arcpy.AddMessage("Downloading image: {}".format(img))
        if not clipgeometry:
            # arcpy.AddMessage(outras)
            arcpy.CopyRaster_management(img, outras, format="COG")
            arcpy.AddMessage("Downloaded image: {}".format(imgname))
            return outras
        else:
            arcpy.AddMessage("Clipping image: {}".format(img))
            # Set clipping geometry and extent
            rftdict = setClipGeometry(clipgeometry)

            if rftdict:
                # Set Raster input
                inrft = json.dumps(rftdict)
                # arcpy.AddMessage(inrft)
                rasargs = "Raster \'" + img + "\'"

                arcpy.AddMessage(rasargs)
                # Read and set resampling method
                rmethod = rasterutils.getResamplingMethod(context)
                arcpy.env.resamplingMethod = rmethod

                arcpy.GenerateRasterFromRasterFunction_management(
                    inrft, outras, rasargs, format="COG")
                return outras
            else:
                arcpy.CopyRaster_management(img, outras, format="COG")
                arcpy.AddMessage("Downloaded image: {}".format(imgname))
                return outras

    except arcpy.ExecuteError as err:
        arcpy.AddWarning("Download image failed: {}".format(str(img)))
        arcpy.AddWarning(arcpy.GetMessages())
        return ""
    except Exception as err:
        arcpy.AddWarning("Unexpected error: {}".format(str(err)))
        return ""


if __name__ == '__main__':
    # Read input parameters
    # Note: input raster support Portal itemId or Image Service URL.
    #       output name can be specified in the list
    # e.g. {"itemId": "xnoreniojiodsjioanewiorjioew", "downloadName": ""}
    #      {"itemIds": ["itemId": "dnosfnaiewjroejwaoijr", "dsiofjiewjrioew"]}
    #      {"url": "https:/...", "downloadName": ""}
    #      {"urls": [{"url": "https://.....", "downloadName": ""}, ""]}
    inras = arcpy.GetParameterAsText(0)
    # Support clipping of the image service
    clipgeometry = arcpy.GetParameterAsText(1)
    context = arcpy.GetParameterAsText(2)

    # Parse input images
    inras = rasterutils.getInDataPath(inras)
    # arcpy.AddMessage(inras)
    if inras:
        arcpy.AddMessage("Input Image Layer(s) are: {}".format(inras))
    else:
        arcpy.AddError("No valid input image layer(s).")

    if isinstance(inras, list):
        imglist = inras
    elif isinstance(inras, str):
        imglist = inras.split(",")
    elif isinstance(inras, dict):
        # Note input string could still be JSON. If JSON, then it is single item.
        imglist = [inras]
    else:
        imglist = str(inras).split(",")

    # TODO: parallel copy multiple images at the same time.
    outimages = []
    for image in imglist:
        # Check if download permission is turned off
        if not check_download_permission(image):
            arcpy.AddWarning("Download permission of {} is set to False.".format(image))
            continue
        # Use Copy raster tool if there is no clip setting
        # Otherwise use Generate Raster from Raster Function tool with clip function
        outras = downloadImage(image, clipgeometry)
        if outras:
            outimages.append(outras)
        else:
            continue

    # Update output ========================================================
    outval = outimages
    if outval:
        # arcpy.AddMessage(str(outval))
        arcpy.SetParameter(3, outval)
    else:
        arcpy.SetParameterAsText(3, "")
