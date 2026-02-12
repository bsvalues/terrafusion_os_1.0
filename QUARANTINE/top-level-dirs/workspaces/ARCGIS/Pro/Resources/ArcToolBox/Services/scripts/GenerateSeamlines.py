"""-----------------------------------------------------------------------------
Name:              ComputeSeamlines.py
Purpose:           Compute color correction for adjusted image collection
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


TASK_NAME = 'GenerateSeamlines'


if __name__ == '__main__':

    inic = arcpy.GetParameterAsText(0)
    smethod = arcpy.GetParameterAsText(1)
    context = arcpy.GetParameterAsText(2)

    try:
        loggingEnabled = rasterutils.GPMessagesLogger(context)
    except:
        arcpy.AddMessage("Logging is not enabled")
        pass

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # 1. Set GP environment settings
        moreags = rasterutils._parsecontext(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        arcpy.env.overwriteOutput = 1

        # 2. Get input image collection path
        inic = rasterutils.getInDataPath(inic)
        icpath = rasterutils.getImageServiceDatasource(inic)
        aisurl = rasterutils.getISAdminUrl(inic)

        seamlinesparams = rasterutils._parseSeamlines(context)

        if icpath:
            if not rasterutils.RUN_ON_AGOL:
                # 3. Stop service before color correction
                token, referer = rasterutils.getToken(inic, 5)
                rasterutils.stopService(aisurl, token)

            # 6. Display enhancement - Compute mosaic candidate
            rasterutils._computeMosaicCandidate(icpath, context)

            arcpy.AddMessage("Computing seamlines with {} method...".format(smethod))
            arcpy.BuildSeamlines_management(
                icpath, cell_size=seamlinesparams["pixelSize"], computation_method=smethod.upper(),
                blend_width=seamlinesparams["blendWidth"], blend_type=seamlinesparams["blendType"].upper(),
                request_size=seamlinesparams["requestSize"], request_size_type=seamlinesparams["requestSizeType"].upper(),
                blend_width_units=seamlinesparams["blendUnit"].upper(), update_existing="UPDATE_EXISTING",
                min_region_size=seamlinesparams["minRegionSize"], min_thinness_ratio=seamlinesparams["minThinnessRatio"],
                max_sliver_size=seamlinesparams["maxSliverSize"]
            )
            arcpy.AddMessage("Finished computing seamlines with {} method.".format(smethod))

            slstate = {
                "seamlines": {
                    "computation_method": smethod.upper(),
                    "blend_width": seamlinesparams["blendWidth"],
                    "blend_type": seamlinesparams["blendType"].upper(),
                    "request_size": seamlinesparams["requestSize"],
                    "request_size_type": seamlinesparams["requestSizeType"].upper(),
                    "blend_width_units": seamlinesparams["blendUnit"].upper(),
                    "min_region_size": seamlinesparams["minRegionSize"],
                    "min_thinness_ratio": seamlinesparams["minThinnessRatio"],
                    "max_sliver_size": seamlinesparams["maxSliverSize"]
                }
            }
            rasterutils._setOrthomappingStates(icpath, slstate)
        else:
            arcpy.AddError("Cannot get the image collection path.")

        # Now set the default mosaic method to Seamline only when allowedMosaicMethods
        # exists and Seamline is not default
        token, referer = rasterutils.getToken(inic, 5)
        sinfo = rasterutils.getServiceInfo(aisurl, token, referer)
        if "properties" in sinfo:
            if "allowedMosaicMethods" in sinfo["properties"]:
                amm = sinfo["properties"]["allowedMosaicMethods"]
                if amm and isinstance(amm, str):
                    smind = amm.lower().find("seamline")
                    if smind != 0:
                        if smind > 0:
                            # Remove Seamline method from the list first, if it is not the first one
                            amm = (amm[:smind] + ",".join(amm[smind:].split(",")[1:])).strip(",")
                        amm = "Seamline," + amm
                        newinfo = {
                            "properties": {
                                "allowedMosaicMethods": amm
                            }
                        }
                        if sinfo != {}:
                            msg = rasterutils.updateService(aisurl, sinfo, newinfo, token, referer)
                            arcpy.AddMessage(msg)
                        else:
                            arcpy.AddWarning("Failed to update the default Mosaic Method to use Seamlines.")

        if not rasterutils.RUN_ON_AGOL:
            rasterutils.startService(aisurl, token)
        outval = {"url": inic}
        arcpy.SetParameterAsText(3, json.dumps(outval))

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        arcpy.AddError(err)
