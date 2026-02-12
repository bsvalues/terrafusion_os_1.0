"""-----------------------------------------------------------------------------
Name:              ComputeColorCorrection.py
Purpose:           Compute color correction for mosaic dataset
Author:            Esri Inc.
Created:           1/7/2017
Copyright:   (c)   Esri, Inc. 2017
ArcGIS Version:    10.6
-----------------------------------------------------------------------------"""
# core libraries
import json

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'ComputeColorCorrection'


class LicenseError(Exception):
    pass


def _parseSkipFactors(context):
    """
    :param context: context input that may contains skipFactor values
    :return: skip factor x and y for build pyramids and statistics tool
    """
    sx = 1
    sy = 1
    try:
        context = json.loads(context)
        contextdict = dict((k, v) for k, v in list(context.items()))
        if "skipY" in contextdict:
            sy = contextdict["skipY"]

        if "skipX" in contextdict:
            sx = contextdict["skipX"]

        return sx, sy
    except Exception as err:
        return sx, sy


def _parseReCalculate(context):
    """
    :param context: context input that may contains skipFactor values
    :return: True to reclculate statistics, false to skip existing
    """
    try:
        context = json.loads(context)
        contextdict = dict((k, v) for k, v in list(context.items()))
        if "overwriteStats" in contextdict:
            if contextdict["overwriteStats"]:
                return "OVERWRITE"

        return "SKIP_EXISTING"
    except Exception as err:
        return "SKIP_EXISTING"


if __name__ == '__main__':

    inic = arcpy.GetParameterAsText(0)
    ccmethod = arcpy.GetParameterAsText(1)
    ccsurface = arcpy.GetParameterAsText(2)
    ref = arcpy.GetParameterAsText(3)
    context = arcpy.GetParameterAsText(4)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # 0.1 Set GP environment settings
        moreags = rasterutils._parsecontext(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags, "om")
        arcpy.env.overwriteOutput = 1

        # 1. Get reference url if there is any:
        refurl = rasterutils.getInDataPath(ref)

        # 2. Get input image collection path
        inic = rasterutils.getInDataPath(inic)
        icpath = rasterutils.getImageServiceDatasource(inic)
        aisurl = rasterutils.getISAdminUrl(inic)

        if icpath:
            if not rasterutils.RUN_ON_AGOL:
                # 3. Stop service before color correction
                token, referer = rasterutils.getToken(inic, 5)
                rasterutils.stopService(aisurl, token)

            # 6. Display enhancement - Compute mosaic candidate
            rasterutils._computeMosaicCandidate(icpath, context)

            # Parse skipFactor parameters
            sx, sy = _parseSkipFactors(context)
            reCalStats = _parseReCalculate(context)

            # Has to compute stats and histogram first
            arcpy.AddMessage("Calculate statistics for image collection.")
            arcpy.BuildPyramidsandStatistics_management(
                icpath, build_pyramids="NONE", calculate_statistics="CALCULATE_STATISTICS",
                skip_existing=reCalStats,
                x_skip_factor=sx, y_skip_factor=sy)

            if refurl:
                arcpy.AddMessage("Computing color correction with reference image...")
                arcpy.ColorBalanceMosaicDataset_management(
                    icpath, balancing_method=ccmethod.upper(), color_surface_type=ccsurface.upper(),
                    target_raster=refurl)

                ccstate = {
                    "colorcorrection": {
                        "balancing_method": ccmethod.upper(),
                        "surface_type": ccsurface.upper(),
                        "target_raster": refurl
                    }
                }
                rasterutils._setOrthomappingStates(icpath, ccstate)
            else:
                arcpy.AddMessage("Computing color correction...")
                arcpy.ColorBalanceMosaicDataset_management(
                    icpath, balancing_method=ccmethod.upper(), color_surface_type=ccsurface.upper())

                ccstate = {
                    "colorcorrection": {
                        "balancing_method": ccmethod.upper(),
                        "surface_type": ccsurface.upper()
                    }
                }
                rasterutils._setOrthomappingStates(icpath, ccstate)
        else:
            arcpy.AddError("Cannot get the image collection path.")

        if not rasterutils.RUN_ON_AGOL:
            token, referer = rasterutils.getToken(inic, 5)
            rasterutils.startService(aisurl, token)
        outval = {"url": inic}
        arcpy.SetParameterAsText(5, json.dumps(outval))

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        arcpy.AddError(err)