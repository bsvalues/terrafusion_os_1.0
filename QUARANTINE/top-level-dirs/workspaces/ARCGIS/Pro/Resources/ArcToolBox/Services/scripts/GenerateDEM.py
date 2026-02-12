"""-----------------------------------------------------------------------------
Name:              GenerateDEM.py
Purpose:           Generate DEM from adjusted mosaic dataset
Author:            Esri Inc.
Created:           1/7/2017
Copyright:   (c)   Esri, Inc. 2017
ArcGIS Version:    10.6
-----------------------------------------------------------------------------"""
# core libraries
import os
import json
import sys

# internal libraries
import arcpy
from arcpy import AIO
import rasterutils
import realityutils

TASK_NAME = 'GenerateDEM'


def _parsePointCloudparams(context):
    """
    :param context: additional parameter values for generate point cloud
    :return: dictionaries of additional parameters
    """
    pcparams = {
        "maxObjectSize": 50,
        "groundSpacing": None,
        "minAngle": 10,
        "maxAngle": 70,
        "minOverlap": 0.6,
        "maxOmegaPhiDif": 8,
        "maxGSDDif": 2,
        "numImagePairs": 2,
        "adjQualityThreshold": 0.2,
        "regenPointCloud": False
    }

    try:
        # Generate point cloud syntax
        # GeneratePointCloud_management(in_mosaic_dataset, ETM | SGM | ESGM, out_folder, out_base_name, {object_size},
        #                              {ground_spacing}, {minimum_pairs}, {minimum_area}, {minimum_adjustment_quality},
        #                              {maximum_diff_gsd}, {maximum_diff_OP})
        if context == "" or context == "#":
            return pcparams
        context = json.loads(context)
        contextdict = dict((k, v) for k, v in list(context.items()))

        if "maxObjectSize" in contextdict:
            pcparams["maxObjectSize"] = contextdict["maxObjectSize"]

        if "groundSpacing" in contextdict:
            pcparams["groundSpacing"] = contextdict["groundSpacing"]

        if "minAngle" in contextdict:
            pcparams["minAngle"] = contextdict["minAngle"]

        if "maxAngle" in contextdict:
            pcparams["maxAngle"] = contextdict["maxAngle"]

        if "minOverlap" in contextdict:
            pcparams["minOverlap"] = contextdict["minOverlap"]

        if "maxOmegaPhiDif" in contextdict:
            pcparams["maxOmegaPhiDif"] = contextdict["maxOmegaPhiDif"]

        if "maxGSDDif" in contextdict:
            pcparams["maxGSDDif"] = contextdict["maxGSDDif"]

        if "numImagePairs" in contextdict:
            pcparams["numImagePairs"] = contextdict["numImagePairs"]

        if "adjQualityThreshold" in contextdict:
            pcparams["adjQualityThreshold"] = contextdict["adjQualityThreshold"]

        if "regenPointCloud" in contextdict:
            pcparams["regenPointCloud"] = contextdict["regenPointCloud"]

        return pcparams

    except Exception as err:
        return pcparams


def _parseDEMparams(context):
    """
    :param context: additional parameter values for generate DEM
    :return: dictionaries of additional parameters
    """
    demparams = {
        # "pixelSizeUnit": "GSD",
        "method": "TRIANGULATION",
        "smoothingMethod": "GAUSS5x5",
        "applyToOrtho": True,
        "fillDEM": ""
    }
    try:
        # Interpolate point clouds parameters
        # InterpolateFromPointCloud_management(
        #       in_container, out_raster, cell_size, TRIANGULATION |
        #       NATURAL_NEIGHBOR | IDW, GAUSS5x5 | GAUSS3x3 | GAUSS7x7 |
        #       GAUSS9x9 | NONE, {DTM | DSM}, {fill_dem})
        if context == "" or context == "#":
            return demparams
        context = json.loads(context)
        contextdict = dict((k, v) for k, v in list(context.items()))

        # if "pixelSizeUnit" in contextdict:
        #     demparams["pixelSizeUnit"] = contextdict["pixelSizeUnit"]

        if "method" in contextdict:
            demparams["method"] = contextdict["method"].upper()

        if "smoothingMethod" in contextdict:
            demparams["smoothingMethod"] = contextdict["smoothingMethod"].upper()

        if "applyToOrtho" in contextdict:
            demparams["applyToOrtho"] = contextdict["applyToOrtho"]

        if "fillDEM" in contextdict:
            if contextdict["fillDEM"]:
                demparams["fillDEM"] = rasterutils.getInDataPath(contextdict["fillDEM"])
        
        if "pointCloudFolder" in contextdict:
            demparams["pointCloudFolder"] = contextdict["pointCloudFolder"]

        return demparams
    except Exception as err:
        return demparams


def _parseClassifyGroundOpts(gnd_opts):
    """
    :param gnd_opts: additional parameter values for interpolate point clouds
    :return: strings of classify ground options
    """
    gnd_opts_str = ""
    try:
        if gnd_opts == "" or gnd_opts == "#":
            return gnd_opts_str
        opt_json = json.loads(gnd_opts)
        opt_dict = dict((k, v) for k, v in list(opt_json.items()))

        if opt_dict and isinstance(opt_dict, dict):
            opt_list = []
            for key in opt_dict:
                if not isinstance(opt_dict[key], str):
                    opt_list.append(key + " " + str(opt_dict[key]))
                else:
                    opt_list.append(key + " " + opt_dict[key])
            if opt_list:
                gnd_opts_str = ";".join(opt_list)

        return gnd_opts_str
    except Exception as err:
        return gnd_opts_str


def _applyDEM(icpath, dem):
    """
    Apply the DEM back to the mosaic dataset, return warning if failed
    :param icpath: image collection path
    :param dem: the dem dataset path or cloud url
    :return:
    """
    try:
        arcpy.AddMessage("Applying DEM back to image collection.")
        arcpy.ApplyBlockAdjustment_management(icpath, DEM=dem)
        arcpy.AddMessage("Done applying DEM back to image collection.")
        return True
    except Exception as err:
        arcpy.AddWarning(arcpy.GetMessages(2))
        return False


if __name__ == '__main__':

    inic = arcpy.GetParameterAsText(0)
    outdem = arcpy.GetParameterAsText(1)
    cellsize = arcpy.GetParameterAsText(2)
    surftype = arcpy.GetParameterAsText(3)
    matchmode = arcpy.GetParameterAsText(4)
    context = arcpy.GetParameterAsText(5)
    classify_gnd_opts = arcpy.GetParameterAsText(7)

    try:
        loggingEnabled = rasterutils.GPMessagesLogger(context)
    except:
        arcpy.AddMessage("Logging is not enabled")
        pass

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # 0. Set environment settings
        moreags = rasterutils._parsecontext(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags, "om")
        arcpy.env.overwriteOutput = 1

        # 1. Get output DEM URL path
        iid, isurl, aisurl, outras = rasterutils.getOutRasterPath(outdem)
        outras = rasterutils.appendcrf(outras)

        # 2. Get input image collection path
        inic = rasterutils.getInDataPath(inic)
        # Get image collection catalog path
        icpath = rasterutils.getImageServiceDatasource(inic)
        if icpath.startswith("/enterpriseDatabases"):
            icpath = rasterutils._lookupdatastorepath(icpath)
            # arcpy.AddMessage("Temporary EGDB mosaic dataset path: {}".format(icpath))

        # Get mosaic dataset cell size
        envcs = rasterutils.getCellsize(context)
        if envcs:
            icdesc = arcpy.Describe(icpath)
            iccs = icdesc.children[0].meanCellHeight
            arcpy.AddMessage("Mosaic dataset cell size: {}".format(str(iccs)))
            cellsize = rasterutils.validatecellsize(iccs, envcs)

        arcpy.AddMessage("DEM cell size: {}".format(str(cellsize)))

        # Parse generate point cloud parameters
        pcparams = _parsePointCloudparams(context)
        # arcpy.AddMessage(pcparams)
        # Parse parameters
        demparams = _parseDEMparams(context)
        # arcpy.AddMessage(demparams)

        # Construct the product folder and point cloud folder
        # Look for matching workspace folder first
        ic_folder = realityutils.get_store_property(icpath)
        ws_folder = ""
        prod_folder = ""
        pc_folder = ""
        # arcpy.AddMessage(ic_folder)
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
        # Make sure product folder is generated if in file share
        prod_folder = rasterutils.generate_directory(prod_folder)
        # Put all point clouds folder into one folder:
        pc_folder = prod_folder + "/" + "point_clouds"
        # Make sure point clouds folder is generated if in file share
        pc_folder = rasterutils.generate_directory(pc_folder)

        # arcpy.AddMessage("Point Cloud Folder: " + pc_folder)

        # 4. Generate point clouds in the adjacent folder
        # Generate point cloud folder name based on settings
        # Creates up to two point clouds folder per workspace, one for DTM, one for DSM
        pcfld = "point_clouds"
        # for i in pcparams:
        #     if i != "regenPointCloud":
        #         pcfld += "" + str(pcparams[i])
        # pcfld = "pc" + "".join([c for c in pcfld if c.isalpha() or c.isdigit() or c == ' ']).rstrip()
        lasfolder = pc_folder + "/" + pcfld + "_" + surftype.lower()

        # arcpy.AddMessage("folder name constructed from parameters: " + lasfolder)
        # Now check if reuse point cloud folder was given in the parameter
        # We only reuse the point cloud folder if regenPointCloud is set to false, or
        # the designated point cloud folder doesn't exist.
        # Check "regenPointCloud" flag first
        regenPointCloud = False
        if "regenPointCloud" in pcparams:
            regenPointCloud = pcparams["regenPointCloud"]

        # Support reuse of existing point cloud folder in 3 modes.
        pointCloudFolder = ""
        if not regenPointCloud:
            if "pointCloudFolder" in demparams:
                pointCloudFolder = demparams["pointCloudFolder"]
                if pointCloudFolder == "DSM":
                    lasfolder = pc_folder + "/" + pcfld + "_dsm"
                elif pointCloudFolder == "DTM":
                    lasfolder = pc_folder + "/" + pcfld + "_dtm"
                # When the point cloud folder is "LAS", we are looking for Reality engine's point cloud output
                elif pointCloudFolder == "LAS":
                    lasfolder = ws_folder + "/recon/Results/Point_Cloud"

        # Prepare file check of point cloud folder.
        pc_folder_aio = AIO(pc_folder)
        # Need to check the lasfolder existence if above is the first time run.
        try:
            # Clear the stale GDAL cache for consistency, as GenerateDEM happens in a different process
            pc_folder_aio.cloud.clearcache(lasfolder)
        except:
            pass
        lasfolder_exists = pc_folder_aio.exists(lasfolder)

        # Set output DEM dataset path with project folder path
        lasbasename = os.path.basename(icpath)
        # lasfile_exists = pc_folder_aio.exists(lasbasename)

        # Always regenerate point cloud
        if pcparams["regenPointCloud"]:
            # 4.1 Create stereo pair
            arcpy.AddMessage("Generating stereo pairs...")
            arcpy.BuildStereoModel_management(
                icpath, minimum_angle=pcparams["minAngle"], maximum_angle=pcparams["maxAngle"],
                minimum_overlap=pcparams["minOverlap"], maximum_diff_OP=pcparams["maxOmegaPhiDif"],
                maximum_diff_GSD=pcparams["maxGSDDif"]
            )
            arcpy.AddMessage("Stereo pairs generated.")

            arcpy.AddMessage("Generating point clouds...")
            # Try to remove the existing folder
            if lasfolder_exists:
                try:
                    pc_folder_aio.rmtree(lasfolder)
                except:
                    pass
            arcpy.GeneratePointCloud_management(
                icpath, matchmode, out_folder=lasfolder, out_base_name=lasbasename,
                object_size=pcparams["maxObjectSize"],
                ground_spacing=pcparams["groundSpacing"], minimum_pairs=pcparams["numImagePairs"],
                minimum_adjustment_quality=pcparams["adjQualityThreshold"], maximum_diff_gsd=pcparams["maxGSDDif"],
                maximum_diff_OP=pcparams["maxOmegaPhiDif"]
            )
            arcpy.AddMessage("Point clouds generated.")
        elif not lasfolder_exists or not pc_folder_aio.listdir(lasfolder):
            if pointCloudFolder == "LAS":
                arcpy.AddError("SURE point cloud does not exist. Please run ReconstructSurface tool first.")
                sys.exit(1)
            # 4.1 Create stereo pair
            arcpy.AddMessage("Generating stereo pairs...")
            arcpy.BuildStereoModel_management(
                icpath, minimum_angle=pcparams["minAngle"], maximum_angle=pcparams["maxAngle"],
                minimum_overlap=pcparams["minOverlap"], maximum_diff_OP=pcparams["maxOmegaPhiDif"],
                maximum_diff_GSD=pcparams["maxGSDDif"]
            )
            arcpy.AddMessage("Stereo pairs generated.")

            arcpy.AddMessage("Generating point clouds...")
            arcpy.GeneratePointCloud_management(
                icpath, matchmode, out_folder=lasfolder, out_base_name=lasbasename,
                object_size=pcparams["maxObjectSize"],
                ground_spacing=pcparams["groundSpacing"], minimum_pairs=pcparams["numImagePairs"],
                minimum_adjustment_quality=pcparams["adjQualityThreshold"], maximum_diff_gsd=pcparams["maxGSDDif"],
                maximum_diff_OP=pcparams["maxOmegaPhiDif"]
            )
            arcpy.AddMessage("Point clouds generated.")
        else:
            arcpy.AddMessage("Use existing point cloud.")

        # 5. Interpolate point cloud to DEM
        # Parse classify ground options parameters
        classify_gnd_opts = _parseClassifyGroundOpts(classify_gnd_opts)

        # Only give name string to the interpolate tool, DEM will be generated in raster data store
        # Make sure DEM is generated with reserved names in product folder
        outras = prod_folder + "/" + surftype.lower() + ".crf"

        # Need to check the lasfolder existence if above is the first time run.
        # arcpy.AddMessage("folder name used to interpolate: " + lasfolder)
        try:
            # Clear the stale GDAL cache for consistency, as GenerateDEM happens in a different process
            pc_folder_aio.cloud.clearcache(lasfolder)
        except:
            pass
        lasfolder_exists = pc_folder_aio.exists(lasfolder)
        # Proceed to generate DEM/DTM when point cloud exists.
        if lasfolder_exists:
            # Disable parallel generation of DEM CRF because of known issue
            # ppf = arcpy.env.parallelProcessingFactor
            # arcpy.env.parallelProcessingFactor = 0
            if demparams["fillDEM"]:
                arcpy.AddMessage("Generating DEM with fill DEM...")
                arcpy.InterpolateFromPointCloud_management(
                    lasfolder, out_raster=outras, cell_size=cellsize,
                    interpolation_method=demparams["method"],
                    smooth_method=demparams["smoothingMethod"], surface_type=surftype,
                    fill_dem=demparams["fillDEM"], options=classify_gnd_opts
                )
                arcpy.AddMessage("DEM generated.")
            else:
                arcpy.AddMessage("Generating DEM...")
                arcpy.InterpolateFromPointCloud_management(
                    lasfolder, out_raster=outras, cell_size=cellsize,
                    interpolation_method=demparams["method"],
                    smooth_method=demparams["smoothingMethod"], surface_type=surftype,
                    options=classify_gnd_opts
                )
                arcpy.AddMessage("DEM generated.")

            # arcpy.env.parallelProcessingFactor = ppf
            # Update output ========================================================
            # Check if output contains URI
            # 1. If no URI found, return output as is
            # 2. If URI found, update service
            uri = rasterutils.getURI(arcpy.GetMessages(), outras)

            if uri == "":
                arcpy.AddMessage("No DEM path returned.")
            else:
                # Set output source type as "Elevation"
                try:
                    arcpy.SetRasterProperties_management(
                        uri, data_type="ELEVATION")
                except:
                    arcpy.AddWarning("Cannot set the DEM source type.")

                arcpy.AddMessage("Updating service with DEM path...")
                # Get federated token to update image service
                token, referer = rasterutils.getToken(isurl)
                # Read and update image service info
                sinfo = rasterutils.getServiceInfo(aisurl, token, referer)
                if sinfo != {}:
                    msg = rasterutils.updateSource(aisurl, sinfo, uri, token, referer)
                    # arcpy.AddMessage(msg)
                    rasterutils.refreshPortalItem(iid)
                else:
                    arcpy.AddWarning("No service updated although DEM generated.")

                # Apply the DEM back to the mosaic dataset
                if demparams["applyToOrtho"]:
                    icaurl = rasterutils.getISAdminUrl(inic)
                    # Stop service before applying DEM
                    token, referer = rasterutils.getToken(inic, 5)
                    rasterutils.stopService(icaurl, token)

                    if _applyDEM(icpath, uri):
                        demstate = {
                            "dem": {
                                "match_mode": matchmode,
                                "object_size": pcparams["maxObjectSize"],
                                "ground_spacing":  pcparams["groundSpacing"],
                                "minimum_pairs": pcparams["numImagePairs"],
                                "minimum_adjustment_quality": pcparams["adjQualityThreshold"],
                                "maximum_diff_gsd": pcparams["maxGSDDif"],
                                "maximum_diff_OP": pcparams["maxOmegaPhiDif"],
                                "interpolation_method": demparams["method"],
                                "smooth_method": demparams["smoothingMethod"],
                                "surface_type": surftype
                            }
                        }
                        rasterutils._setOrthomappingStates(icpath, demstate)

                    # Restart service after applying DEM
                    token, referer = rasterutils.getToken(inic, 5)
                    rasterutils.startService(icaurl, token)
        else:
            arcpy.AddError("Generating DEM failed, point cloud folder not found.")

        outval = {"itemId": iid, "url": isurl}
        arcpy.SetParameterAsText(6, json.dumps(outval))

    except arcpy.ExecuteError:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        arcpy.AddError(err)