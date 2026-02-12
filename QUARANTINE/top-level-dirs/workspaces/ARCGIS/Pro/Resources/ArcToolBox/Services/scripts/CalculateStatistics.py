"""-----------------------------------------------------------------------------
Name:              CalculateStatistics.py
Purpose:           Calculate Statistics for Image Collection
Author:            Esri Inc.
Created:           8/21/2018
Copyright:   (c)   Esri, Inc. 2018
ArcGIS Version:    10.7
-----------------------------------------------------------------------------"""
# core libraries
import json

# internal libraries
import arcpy
import rasterutils


if __name__ == '__main__':

    inic = arcpy.GetParameterAsText(0)
    skipfactors = arcpy.GetParameterAsText(1)
    context = arcpy.GetParameterAsText(2)

    try:
        # 0. Set GP environment settings
        moreags = rasterutils._parsecontext(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        arcpy.env.overwriteOutput = 1

        # 1. Get input image collection path
        inic = rasterutils.getInDataPath(inic)
        icpath = rasterutils.getImageServiceDatasource(inic)
        aisurl = rasterutils.getISAdminUrl(inic)

        statsparams = rasterutils._parseStatistics(context)
        skipf = rasterutils._parsecontext(skipfactors)
        # Read skip factor, default is 10 x 10
        if "x" in skipf:
            skipx = skipf["x"]
        else:
            skipx = 10
        if "y" in skipf:
            skipy = skipf["y"]
        else:
            skipy = 10

        if icpath:
            if not rasterutils.RUN_ON_AGOL:
                # 3. Stop service before color correction
                token, referer = rasterutils.getToken(inic, 5)
                rasterutils.stopService(aisurl, token)

            arcpy.AddMessage("Compute statistics with skip factor: {0} x {1}".format(skipx, skipy))
            arcpy.CalculateStatistics_management(
                icpath, x_skip_factor=skipx, y_skip_factor=skipy, ignore_values=statsparams["ignoreValues"],
                skip_existing=statsparams["skipExisting"], area_of_interest=statsparams["areaOfInterest"]
            )
            arcpy.AddMessage("Finished computing statistics with skip factor: {0} x {1}".format(skipx, skipy))
        else:
            arcpy.AddError("Cannot get the image collection path.")

        if not rasterutils.RUN_ON_AGOL:
            token, referer = rasterutils.getToken(inic, 5)
            rasterutils.startService(aisurl, token)
        outval = {"url": inic}
        arcpy.SetParameterAsText(3, json.dumps(outval))

    except arcpy.ExecuteError:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        arcpy.AddError(err)
