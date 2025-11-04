"""-----------------------------------------------------------------------------
Name:              MosaicRaster.py
Purpose:           This scripting service tool is created to support mosaicking
                   from one input image to a target existing image service
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
import time
import sys

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'MosaicImage'


if __name__ == '__main__':
    # Read input parameters
    # Note: input raster support Portal itemId or Image Service URL.
    #       output name can be specified in the list
    # e.g. {"itemId": "xnoreniojiodsjioanewiorjioew", "downloadName": ""}
    #      {"itemIds": ["itemId": "dnosfnaiewjroejwaoijr", "dsiofjiewjrioew"]}
    #      {"url": "https:/...", "downloadName": ""}
    #      {"urls": [{"url": "https://.....", "downloadName": ""}, ""]}
    inras = arcpy.GetParameterAsText(0)
    targetras = arcpy.GetParameterAsText(1)
    # Support clipping of the image service
    mosaicop = arcpy.GetParameterAsText(2)
    mosaiccolor = arcpy.GetParameterAsText(3)
    nodata = arcpy.GetParameterAsText(4)
    context = arcpy.GetParameterAsText(5)

    # Parse input images
    inras = rasterutils.getInDataPath(inras)
    targetras = rasterutils.getInDataPath(targetras)
    # arcpy.AddMessage(inras)
    # arcpy.AddMessage(targetras)
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

    try:
        # Prepare input image paths
        for i, img in enumerate(imglist):
            if img.startswith("http"):
                aisurl = rasterutils.getISAdminUrl(img)
                token, referer = rasterutils.getToken(img)
                # Read and update image service info
                isconf = rasterutils.getServiceInfo(aisurl, token, referer)
                imgpath = rasterutils.getImageServiceCatalogPath(isconf)
                if imgpath:
                    imglist[i] = imgpath
                else:
                    imglist[i] = img

        inras = ";".join(imglist)
        # arcpy.AddMessage(inras)

        # Prepare target image paths
        targetpath = targetras
        if targetras.startswith("http"):
            aisurl = rasterutils.getISAdminUrl(targetras)
            token, referer = rasterutils.getToken(targetras)
            # Read and update image service info
            isconf = rasterutils.getServiceInfo(aisurl, token, referer)
            # arcpy.AddMessage(isconf)
            imgpath = rasterutils.getImageServiceCatalogPath(isconf)
            if imgpath:
                if imgpath.lower().endswith(".crf"):
                    targetpath = imgpath
                else:
                    rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120306))
                    sys.exit(0)
            else:
                rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120306))
                sys.exit(0)
        elif not targetras.lower().endswith(".crf"):
            rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120306))
            sys.exit(0)

        # Mosaic crf
        # Parse and set environment settings
        # Parse addtional environment variables
        moreags = rasterutils._parsecontext(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        rmethod = rasterutils.getResamplingMethod(context)
        arcpy.env.resamplingMethod = rmethod
        # arcpy.AddMessage(targetpath)
        arcpy.AddMessage("Mosaicking input raster to target...")
        arcpy.management.Mosaic(
            inras, targetpath, mosaic_type=mosaicop, colormap=mosaiccolor,
            nodata_value=nodata
        )
        # Update output ========================================================
        outval = targetras
        if outval:
            # arcpy.AddMessage(str(outval))
            arcpy.SetParameter(6, outval)
        else:
            arcpy.SetParameterAsText(6, "")

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages())

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
