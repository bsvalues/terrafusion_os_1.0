"""-----------------------------------------------------------------------------
Name:              GenerateDOM.py
Purpose:           Generate Digital Ortho Map from adjusted image collection
Author:            Esri Inc.
Created:           1/7/2015
Copyright:   (c)   Esri, Inc. 2015
ArcGIS Version:    10.5
-----------------------------------------------------------------------------"""
# core libraries
import json
import os

# internal libraries
import arcpy
import rasterutils
import realityutils

TASK_NAME = 'GenerateDOM'


# Raster processing templates for ortho mosaic generation
clip_json = """{
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
                }
            }"""

clip_usedem_json = """{
                            "rasterFunction" : "Clip",
                            "rasterFunctionArguments" :
                            {
                                "Raster":
                                {
                                    "rasterFunction" : "Geometric",
                                    "rasterFunctionArguments" :
                                    {
                                        "ZFactor": 1, 
                                        "ZOffset": 0
                                    }
                                }
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
                        }
                    }"""

usedem_json = """{
                    "rasterFunction" : "Geometric",
                    "rasterFunctionArguments" :
                    {
                        "ZFactor": 1, 
                        "ZOffset": 0
                    }
               }"""



def __parseAddOM(context):
    """
    :param context: additional settings for generating ortho mosaic
    :return: dictionaries of additional parameters
    """
    omparams = {
        "orthoMosaicAsOvr": False,
        "clippingGeometry": {}
    }

    try:
        if context == "" or context == "#":
            return omparams
        context = json.loads(context)
        contextdict = dict((k, v) for k, v in list(context.items()))

        if "orthoMosaicAsOvr" in contextdict:
            if contextdict["orthoMosaicAsOvr"]:
                omparams["orthoMosaicAsOvr"] = contextdict["orthoMosaicAsOvr"]

        if "clippingGeometry" in contextdict:
            omparams["clippingGeometry"] = contextdict["clippingGeometry"]

        return omparams
    except Exception as err:
        return omparams


def _disable_cc(context):
    """
    Method to check whether the image collection with have color correction
    applied or not
    :param context: addtional settings for this service tool
    :return: boolean to determine whether or not to apply color correction
    """
    try:
        if context == "" or context == "#":
            return omparams
        context = json.loads(context)
        contextdict = dict((k, v) for k, v in iter(list(context.items())))

        if "applyColorCorrection" in contextdict:
            if contextdict["applyColorCorrection"]:
                return False
        return True
    except Exception:
        return True


if __name__ == '__main__':

    inic = arcpy.GetParameterAsText(0)
    outortho = arcpy.GetParameterAsText(1)
    seamline = arcpy.GetParameter(2)
    cc = arcpy.GetParameter(3)
    context = arcpy.GetParameterAsText(4)

    try:
        loggingEnabled = rasterutils.GPMessagesLogger(context)
    except:
        arcpy.AddMessage("Logging is not enabled")
        pass

    try:
        # 0. Check Image Server extension license
        if arcpy.CheckExtension("Image") != "Available":
            raise rasterutils.LicenseError

        # 0. Set environment settings
        moreags = rasterutils._parsecontext(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        arcpy.env.overwriteOutput = 1

        inic = rasterutils.getInDataPath(inic)
        iid, isurl, aisurl, outras = rasterutils.getOutRasterPath(outortho)
        outras = rasterutils.appendcrf(outras)

        # Get image collection catalog path
        icpath = rasterutils.getImageServiceDatasource(inic)
        if icpath.startswith("/enterpriseDatabases"):
            icpath = rasterutils._lookupdatastorepath(icpath)
            # arcpy.AddMessage("Temporary EGDB mosaic dataset path: {}".format(icpath))
        icaurl = rasterutils.getISAdminUrl(inic)

        # Construct product folder for ortho mosaic output
        # Look for matching workspace folder first
        ic_folder = realityutils.get_store_property(icpath)
        ws_folder = ""
        prod_folder = ""
        if ic_folder:
            # Need to watch out legacy case where the imagery collection folder is the root
            if ic_folder.lower().endswith("/imagery"):
                ws_folder = os.path.dirname(ic_folder)
            else:
                ws_folder = ic_folder
        else:
            ws_folder = os.path.dirname(os.path.dirname(icpath))
        prod_folder = ws_folder + "/products"
        reality_ws = realityutils.get_reality_workspace(context)
        # Need make sure the product folder matches the found workspace
        if reality_ws:
            if ws_folder and ws_folder.find(reality_ws) > -1:
                prod_folder = ws_folder[0:ws_folder.find(reality_ws) + len(reality_ws)] + "/products"
        if not prod_folder:
            prod_folder = ws_folder + "/" + reality_ws + "/products"
        # Make sure product folder is generated if in file share
        if prod_folder:
            prod_folder = rasterutils.generate_directory(prod_folder)

        # arcpy.AddMessage(prod_folder)
        # Make sure ortho mosaic is generated in the product folder
        outras = prod_folder + "/ortho.crf"

        # Parse additional parameters:
        omparams = __parseAddOM(context)

        # Parse environment setting
        arcpy.env.overwriteOutput = 1

        # Start generating ortho mosaic
        if icpath:
            if seamline or cc:
                # 3. Stop service before color correction
                token, referer = rasterutils.getToken(inic, 5)
                rasterutils.stopService(icaurl, token)

                # 6. Display enhancement - Compute mosaic candidate
                # Comment out compute candidates since it is not generating optimal result
                # rasterutils._computeMosaicCandidate(icpath, context)

                if cc:
                    ccparams = rasterutils._parseColorCorrection(context)
                    refurl = rasterutils.getInDataPath(ccparams["targetImage"])

                    # Has to compute stats and histogram first
                    arcpy.AddMessage("Calculate statistics for image collection.")
                    arcpy.BuildPyramidsandStatistics_management(
                        icpath, build_pyramids="NONE", calculate_statistics="CALCULATE_STATISTICS",
                        skip_existing=ccparams["overwriteStats"],
                        x_skip_factor=ccparams["skipX"], y_skip_factor=ccparams["skipY"])

                    if refurl:
                        arcpy.AddMessage("Computing color correction with reference image...")
                        arcpy.ColorBalanceMosaicDataset_management(
                            icpath, balancing_method=ccparams["colorCorrectionMethod"].upper(),
                            color_surface_type=ccparams["dodgingSurface"],
                            target_raster=refurl)
                    else:
                        arcpy.AddMessage("Computing color correction...")
                        arcpy.ColorBalanceMosaicDataset_management(
                            icpath, balancing_method=ccparams["colorCorrectionMethod"].upper(),
                            color_surface_type=ccparams["dodgingSurface"])

                    # Set color balancing metadata to image collection
                    ccstate = {
                        "colorcorrection": {
                            "balancing_method": ccparams["colorCorrectionMethod"].upper(),
                            "surface_type": ccparams["dodgingSurface"]
                        }
                    }
                    rasterutils._setOrthomappingStates(icpath, ccstate)

                if seamline:
                    seamlinesparams =rasterutils._parseSeamlines(context)

                    smethod = seamlinesparams["seamlinesMethod"]

                    arcpy.AddMessage("Computing seamlines with {} method...".format(smethod))
                    arcpy.BuildSeamlines_management(
                        icpath, cell_size=seamlinesparams["pixelSize"], computation_method=smethod.upper(),
                        blend_width=seamlinesparams["blendWidth"], blend_type=seamlinesparams["blendType"].upper(),
                        request_size=seamlinesparams["requestSize"],
                        request_size_type=seamlinesparams["requestSizeType"].upper(),
                        blend_width_units=seamlinesparams["blendUnit"].upper(), update_existing="UPDATE_EXISTING",
                        min_region_size=seamlinesparams["minRegionSize"],
                        min_thinness_ratio=seamlinesparams["minThinnessRatio"],
                        max_sliver_size=seamlinesparams["maxSliverSize"]
                    )
                    arcpy.AddMessage("Finished computing seamlines with {} method.".format(smethod))
                    # Update processing state keymetadata for seamlines
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

                    # Now set the default mosaic method to Seamline only when allowedMosaicMethods
                    # exists and Seamline is not default
                    token, referer = rasterutils.getToken(inic, 5)
                    sinfo = rasterutils.getServiceInfo(icaurl, token, referer)
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
                                        msg = rasterutils.updateService(icaurl, sinfo, newinfo, token, referer)
                                        arcpy.AddMessage(msg)
                                    else:
                                        arcpy.AddWarning("Failed to update the default Mosaic Method to use Seamline.")

                # Restart hosted image collection service
                token, referer = rasterutils.getToken(inic, 5)
                rasterutils.startService(icaurl, token)

            elif _disable_cc(context) and not cc:
                # Stop service before updating mosaic dataset properties
                token, referer = rasterutils.getToken(inic, 5)
                rasterutils.stopService(icaurl, token)

                arcpy.SetMosaicDatasetProperties_management(
                    icpath, color_correction="NOT_APPLY",
                    allowed_mensuration_capabilities="#", default_mensuration_capabilities="#")

                # Restart hosted image collection service after modifying properties
                token, referer = rasterutils.getToken(inic, 5)
                rasterutils.startService(icaurl, token)

            # 4. Generate Orthomosaic image
            # Parse cell size and geometry
            outcellsize = rasterutils.getCellsize(context)
            rmethod = rasterutils.getResamplingMethod(context)
            outSR = rasterutils.getOutSR(context)
            clipgeometry = omparams["clippingGeometry"]

            # Check image collection cell size
            icdesc = arcpy.Describe(icpath)
            iccs = icdesc.children[0].meanCellHeight
            if outcellsize:
                outcellsize = rasterutils.validatecellsize(iccs, outcellsize)
            arcpy.AddMessage("Orthomosaic cell size is: {}".format(str(outcellsize)))

            # Support orthorectification with DEM given in context
            # e.g. context: {"DEM": {"url": <image service url>"}} - use given DEM service
            # {"DEM": "DEFAULT"} - use project's DSM dataset
            # if not set, we will convert the mosaic dataset as is
            usedem = realityutils.getDEM(context)
            if usedem == "DEFAULT":
                usedem = ""
                prod_folder = ""
                img_folder = realityutils.get_store_property(icpath)
                if img_folder.endswith("/imagery"):
                    prod_folder = os.path.dirname(img_folder) + "/products"
                if prod_folder:
                    usedem = prod_folder + "/dem.crf"
                    usedem = realityutils.check_product_exists(usedem)

            # Set environment setting:
            arcpy.env.resamplingMethod = rmethod
            arcpy.env.cellSize = outcellsize
            arcpy.env.outputCoordinateSystem = outSR
            arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)

            # Create orthomosaic with either Copy Raster or Generate Raster
            if clipgeometry and usedem:
                rftdict = json.loads(clip_usedem_json)

                # Set clipping geometry and extent
                if clipgeometry == "":
                    rftdict["rasterFunctionArguments"].pop("Raster")
                else:
                    rftdict = rasterutils.getClipargs(rftdict, clipgeometry)

                # Set DEM and Raster
                inrft = json.dumps(rftdict)
                rasargs = "Raster " + icpath + ";DEM " + usedem
                result = arcpy.GenerateRasterFromRasterFunction_management(
                    inrft, outras, rasargs, format="CRF")
            elif clipgeometry:
                rftdict = json.loads(clip_json)

                # Set clipping geometry and extent
                if clipgeometry == "":
                    rftdict["rasterFunctionArguments"].pop("Raster")
                else:
                    rftdict = rasterutils.getClipargs(rftdict, clipgeometry)

                # Set DEM and Raster
                inrft = json.dumps(rftdict)
                rasargs = "Raster " + icpath
                result = arcpy.GenerateRasterFromRasterFunction_management(
                    inrft, outras, rasargs, format="CRF")
            elif usedem:
                rasargs = "Raster " + icpath + ";DEM " + usedem
                result = arcpy.GenerateRasterFromRasterFunction_management(
                    usedem_json, outras, rasargs, format="CRF")
            else:
                result = arcpy.CopyRaster_management(icpath, outras, format="CRF")

            # 5. Update ortho mosaic hosted image service
            uri = rasterutils.getURI(arcpy.GetMessages(), outras)

            if uri == "":
                arcpy.AddMessage("No orthomosaic path returned.")
            else:
                arcpy.AddMessage("Updating service with orthomosaic dataset path...")
                # Get federated token to update image service
                token, referer = rasterutils.getToken(isurl)
                # Read and update image service info
                sinfo = rasterutils.getServiceInfo(aisurl, token, referer)
                if sinfo != {}:
                    msg = rasterutils.updateSource(aisurl, sinfo, uri, token, referer)
                    # arcpy.AddMessage(msg)
                    rasterutils.refreshPortalItem(iid)

                    # 6. Update image collection with ortho mosaic if needed
                    if omparams["orthoMosaicAsOvr"]:
                        # Stop service before adding ortho mosaic to mosaic dataset
                        token, referer = rasterutils.getToken(inic, 5)
                        rasterutils.stopService(icaurl, token)

                        rasterutils._addOM2MD(uri, icpath)

                        # Restart hosted image collection service
                        token, referer = rasterutils.getToken(inic, 10)
                        rasterutils.startService(icaurl, token)
                else:
                    arcpy.AddWarning("No service updated although orthomosaic raster dataset generated.")

        else:
            arcpy.AddError("Cannot get the image collection path.")

        outval = {"itemId": iid, "url": isurl}
        arcpy.SetParameterAsText(5, json.dumps(outval))

    except arcpy.ExecuteError:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        arcpy.AddError(err)