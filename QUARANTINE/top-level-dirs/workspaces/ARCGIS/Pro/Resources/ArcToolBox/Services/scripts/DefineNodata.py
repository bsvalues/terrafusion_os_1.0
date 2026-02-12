"""-----------------------------------------------------------------------------
Name:              DefineNodata.py
Purpose:           Define nodata value for dynamic image service
Author:            Esri Inc.
Created:           9/21/2019
Copyright:   (c)   Esri, Inc. 2019
ArcGIS Version:    10.8
-----------------------------------------------------------------------------"""
# core libraries
import json
import sys

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'DefineNodata'

if __name__ == '__main__':

    inraster = arcpy.GetParameterAsText(0)
    # Nodata syntax should follow:
    # e.g. {"noDataValues": [0]}
    #      {"noDataValues": [0, 255, 0]}
    #      {"includedRanges": [0, 255]}
    #      {"includedRanges": [0, 255, 1, 255, 4, 250]}
    nodata = arcpy.GetParameterAsText(1)
    query = arcpy.GetParameterAsText(2)
    nband = arcpy.GetParameter(3)  # Parameter type is Long
    compositeval = arcpy.GetParameter(4)  # Parameter type is Boolean

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # 1. Get source data path
        inras = rasterutils.getInDataPath(inraster)
        srcpath = rasterutils.getImageServiceDatasource(inras)
        aisurl = rasterutils.getISAdminUrl(inras)

        if srcpath:
            # Check nodata values:
            nddict = list(rasterutils.getJSON(nodata))
            if nddict:
                nodata = nddict[0]
                nodata["where"] = query
                nodata["compositeValue"] = compositeval
                nodata["numberOfBand"] = nband

                if not rasterutils.RUN_ON_AGOL:
                    # 3. Stop service before color correction
                    token, referer = rasterutils.getToken(inras, 5)
                    rasterutils.stopService(aisurl, token)

                rasterutils._definenodata(srcpath, nodata)
            else:
                arcpy.AddError("No valid nodata arguments.")
                sys.exit(0)
        else:
            arcpy.AddError("Cannot obtain the image data path")

        if not rasterutils.RUN_ON_AGOL:
            token, referer = rasterutils.getToken(inras, 5)
            rasterutils.startService(aisurl, token)
        outval = {"url": inras}
        arcpy.SetParameterAsText(5, json.dumps(outval))

    except arcpy.ExecuteError:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        arcpy.AddError(err)
