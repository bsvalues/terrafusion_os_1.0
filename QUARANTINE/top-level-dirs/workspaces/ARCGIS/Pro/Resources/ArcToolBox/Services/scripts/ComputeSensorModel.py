"""-----------------------------------------------------------------------------
Name:              ComputeSensorModel.py
Purpose:           Perform image triangulation and block adjustment for
                   image collections.
Author:            Esri Inc.
Created:           1/7/2015
Copyright:   (c)   Esri, Inc. 2015
ArcGIS Version:    10.5
-----------------------------------------------------------------------------"""
# core libraries
import os
import json
import sys

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'ComputeSensorModel'

# Define global variables
inic = ""
aisurl = ""


def _parseAdjmode(mode):
    # Parsing adjustment mode
    if mode == "Quick":
        estimate = "ESTIMATE"
        refine = "NO_REFINE"
    elif mode == "Full":
        estimate = "ESTIMATE"
        refine = "REFINE"
    elif mode == "Refine":
        estimate = "NO_ESTIMATE"
        refine = "REFINE"
    else:
        estimate = "ESTIMATE"
        refine = "NO_REFINE"

    return estimate, refine


def _parseAccuracy(accuracy):
    # Parsing GPS accuracy
    if accuracy == "High":
        accuracy = "HIGH"
    elif accuracy == "Medium":
        accuracy = "MEDIUM"
    elif accuracy == "Low":
        accuracy = "LOW"
    elif accuracy == "VeryLow":
        accuracy = "VERY_LOW"
    elif accuracy == "VeryHigh":
        accuracy = "VERY_HIGH"
    else:
        accuracy = "HIGH"

    return accuracy


def _find_gcp(tie_point):
    try:
        where = "Type = 2"
        with arcpy.da.SearchCursor(tie_point, "PointID", where_clause=where) as tcur:
            if any(tcur):
                gcpsets_json = arcpy.env.scratchFolder + "/_gcpsets.json"
                arcpy.gp.command(
                    "ConvertGCPToJSON '" + tie_point + "' '" + gcpsets_json + "'")
                if os.path.exists(gcpsets_json):
                    return gcpsets_json
        return None
    except Exception as err:
        return None


if __name__ == '__main__':
    """
    Note: the image collection input should only support portal itemId and image
    service url.
    """
    inic = arcpy.GetParameterAsText(0)
    mode = arcpy.GetParameterAsText(1)
    accuracy = arcpy.GetParameterAsText(2)
    context = arcpy.GetParameterAsText(3)

    try:
        loggingEnabled = rasterutils.GPMessagesLogger(context)
    except:
        arcpy.AddMessage("Logging is not enabled")
        pass

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # 0. Set up environment
        moreags = rasterutils._parsecontext(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags, "om")

        arcpy.env.overwriteOutput = 1
        # 1. Get input image collection URL
        inic = rasterutils.getInDataPath(inic)
        aisurl = rasterutils.getISAdminUrl(inic)

        # 2. Parameter parsing
        estimate, refine = _parseAdjmode(mode)
        accuracy = _parseAccuracy(accuracy)
        adjparams = rasterutils._parseAdjArgs(context)

        # 3. Determine adjustment output path
        # Get image collection catalog path
        # arcpy.AddMessage("Getting image collection catalog path from URL: {}".format(inic))
        icpath = rasterutils.getImageServiceDatasource(inic)
        if icpath.startswith("/enterpriseDatabases"):
            icpath = rasterutils._lookupdatastorepath(icpath)
            # arcpy.AddMessage("Temporary EGDB mosaic dataset path: {}".format(icpath))

        # Halt the tool when the image collection source path cannot be found.
        if not icpath:
            arcpy.AddError("Failed to get image collection path.")
        # else:
        #     arcpy.AddMessage("The image collection path is {}".format(icpath))

        # Find project folder
        # Note: the path construction is based on the assumption the image collection
        # is in file geodatabase
        icgdb = os.path.dirname(icpath)
        if icgdb.endswith(".gdb"):
            icfolder = os.path.dirname(icgdb)
        else:
            # TODO find the data store location for estimated dsm when image collection is in enterprise database
            # Option 1: add the project folder in portal item description or image service description
            icfolder = ""

        # Swap image collection path.
        icpaths = rasterutils.swapMDPath(icpath, icfolder)

        # Based on image collection path, determine the location to generate
        # estimated DSM and other affiliated tables.
        if icpaths == []:
            icpath = ""
            tiepnt = ""
            solution = ""
            solutionpnt = ""
            flightpath = ""
            dsmpath = ""
            arcpy.AddError("Cannot find image collection catalog path.")
        else:
            # Workaround to fix linux path issue
            icpath = icpaths[0]
            tiepnt = icpaths[1]
            solution = icpaths[2]
            solutionpnt = icpaths[3]
            flightpath = icpaths[4]
            dsmpath = ""

        # 3.1 Checking orthomapping states to determine which tools to run
        orthostates = rasterutils._getOrthomappingStates(icpath)
        # arcpy.AddMessage("The image data type is: {}".format(str(orthostates)))
        if "blockadjustment" in orthostates:
            arcpy.AddMessage("Check Orthomapping adjustment status.")
            adjstate = orthostates["blockadjustment"]
        else:
            arcpy.AddMessage("Didn't get Orthomapping adjustment status, revert to default")
            adjstate = "raw"
            orthostates["blockadjustment"] = adjstate

        # 3.2 Find image collection type
        if "imagetype" in orthostates:
            if isinstance(orthostates["imagetype"], str):
                imagetype = orthostates["imagetype"].upper()
            else:
                imagetype = "UAV/UAS"
        else:
            imagetype = "UAV/UAS"

        # arcpy.AddMessage("The image data type is: {}".format(imagetype))
        # 4. Stop service before adjustment
        token, referer = rasterutils.getToken(inic, 5)
        rasterutils.stopService(aisurl, token)

        # 5. Adjust image collection based on image type
        if imagetype == "UAV/UAS" or imagetype.lower() == "unknown":
            if adjstate == "raw" or adjstate == "quick":
                # Run compute camera model
                arcpy.AddMessage("Computing camera model and adjustment in \"{}\" Mode for image collections...".format(mode))
                arcpy.ComputeCameraModel_management(
                    icpath, out_dsm=dsmpath, gps_accuracy=accuracy, estimate=estimate, refine=refine,
                    maximum_residual=adjparams["maxResidual"],
                    initial_tiepoint_resolution=adjparams["initPointResolution"],
                    out_control_points=tiepnt, out_solution_table=solution,
                    out_solution_point_table=solutionpnt, out_flight_path=flightpath,
                    options=adjparams["adjustOptions"]
                )
                arcpy.AddMessage("Image collections adjusted.")

                # Set maximum number per mosaic after adjust UAV image
                arcpy.SetMosaicDatasetProperties_management(
                    icpath, max_num_per_mosaic=80)

                # Set adjustment states
                if refine == "REFINE":
                    orthostates["blockadjustment"] = "full"
                else:
                    orthostates["blockadjustment"] = "quick"

            else:
                if accuracy == "VERY_LOW":
                    accuracy = "LOW"
                # Run compute adjustment
                arcpy.AddMessage("Computing adjustment for image collections...")
                arcpy.ComputeBlockAdjustment_management(
                    icpath, in_control_points=tiepnt, transformation_type="Frame",
                    maximum_residual_value=adjparams["maxResidual"],
                    out_solution_table=solution,
                    out_solution_point_table=solutionpnt,
                    adjustment_options=adjparams["adjustOptions"],
                    location_accuracy=accuracy
                )

                # Apply block adjustment
                arcpy.ApplyBlockAdjustment_management(
                    icpath, adjustment_operation="ADJUST", input_solution_table=solution,
                    control_point_table=tiepnt, adjust_footprints="ADJUST_FOOTPRINTS")
                arcpy.AddMessage("Image collections adjusted.")

                # Set adjustment states
                orthostates["blockadjustment"] = "full"
                arcpy.SetRasterKeyMetadata(
                    icpath, "orthomapping", json.dumps(orthostates))

        elif imagetype == "SATELLITE" or imagetype == "AERIAL":
            if accuracy == "VERY_LOW":
                accuracy = "LOW"
            if imagetype == "SATELLITE":
                t_type = "RPC"
            elif imagetype == "AERIAL":
                t_type = "Frame"
            else:
                t_type = ""
                arcpy.AddError("Cannot decide the transformation type.")

            # Check if gcp point sets already existed
            gcp = _find_gcp(tiepnt)
            arcpy.AddMessage(str(gcp))
            arcpy.AddMessage(adjstate)
            # Compute tie points if it does not exist or asked to be regenerated
            if not arcpy.Exists(tiepnt) or adjstate == "raw" or adjparams["regenTiepoints"]:
                arcpy.AddMessage("Computing tie points for image collection...")
                arcpy.ComputeTiePoints_management(
                    icpath, out_control_points=tiepnt, similarity=adjparams["pointSimilarity"],
                    in_mask_dataset=adjparams["polygonMask"], density=adjparams["pointDensity"],
                    distribution=adjparams["pointDistribution"], location_accuracy=accuracy)
                if gcp:
                    arcpy.management.AppendControlPoints(tiepnt, gcp, append_option="GCPSET")

            # Run compute adjustment
            arcpy.AddMessage("Computing adjustment for image collections...")
            arcpy.ComputeBlockAdjustment_management(
                icpath, in_control_points=tiepnt, transformation_type=t_type,
                maximum_residual_value=adjparams["maxResidual"],
                out_solution_table=solution, out_solution_point_table=solutionpnt,
                adjustment_options=adjparams["adjustOptions"], location_accuracy=accuracy
            )

            # Apply block adjustment
            arcpy.AddMessage("Applying adjustment to image collections...")
            arcpy.ApplyBlockAdjustment_management(
                icpath, adjustment_operation="ADJUST", input_solution_table=solution,
                control_point_table=tiepnt, adjust_footprints="ADJUST_FOOTPRINTS")
            arcpy.AddMessage("Image collections adjusted.")

            # Set adjustment states
            orthostates["blockadjustment"] = "full"
            arcpy.SetRasterKeyMetadata(
                icpath, "orthomapping", json.dumps(orthostates))

        elif imagetype == "SCANNEDAERIAL":
            if accuracy == "VERY_LOW":
                accuracy = "LOW"

            # Check if gcp point sets already existed
            gcp = _find_gcp(tiepnt)
            # Compute tie points if it does not exist or asked to be regenerated
            if not arcpy.Exists(tiepnt) or adjstate == "raw" or adjparams["regenTiepoints"]:
                arcpy.AddMessage("Computing tie points for ScannedAerial image collection...")
                arcpy.ComputeTiePoints_management(
                    icpath, out_control_points=tiepnt, similarity=adjparams["pointSimilarity"],
                    in_mask_dataset=adjparams["polygonMask"], density=adjparams["pointDensity"],
                    distribution=adjparams["pointDistribution"], location_accuracy=accuracy)
                if gcp:
                    arcpy.management.AppendControlPoints(tiepnt, gcp, append_option="GCPSET")

            # Run compute adjustment
            arcpy.AddMessage("Computing adjustment for image collections...")
            arcpy.ComputeBlockAdjustment_management(
                icpath, in_control_points=tiepnt, transformation_type="Frame",
                maximum_residual_value=adjparams["maxResidual"],
                out_solution_table=solution, out_solution_point_table=solutionpnt,
                adjustment_options=adjparams["adjustOptions"], location_accuracy=accuracy
            )

            # Apply block adjustment
            arcpy.AddMessage("Applying adjustment to image collections...")
            arcpy.ApplyBlockAdjustment_management(
                icpath, adjustment_operation="ADJUST", input_solution_table=solution,
                control_point_table=tiepnt, adjust_footprints="ADJUST_FOOTPRINTS")
            arcpy.AddMessage("Image collections adjusted.")

            # Set adjustment states
            orthostates["blockadjustment"] = "full"
            arcpy.SetRasterKeyMetadata(
                icpath, "orthomapping", json.dumps(orthostates))

        elif imagetype == "ADS":
            pass
        elif imagetype == "CUSTOM":
            pass
        else:
            arcpy.AddError("Image type not supported, no adjustment.")
            sys.exit(0)

        # Set orthomapping states
        orthostates["adjust_index"] = icpaths[6]

        arcpy.SetRasterKeyMetadata(
            icpath, "orthomapping", json.dumps(orthostates))

        # 6. Display enhancement - Compute mosaic candidate
        rasterutils._computeMosaicCandidate(icpath, context)

        # Note: Compute Sensor Model should not update source data path,
        #       swapMDPath no longer changes it.
        # # Update output ================================================
        # # Update output service and item with the new path
        # # Get federated token to update image service
        # token, referer = rasterutils.getToken(inic, 5)
        # # Read and update image service info
        # sinfo = rasterutils.getServiceInfo(aisurl, token, referer)
        # if sinfo != {}:
        #     msg = rasterutils.updateSource(aisurl, sinfo, icpath, token, referer)
        #     arcpy.AddMessage(msg)
        # else:
        #     arcpy.AddWarning("Image service is not updated after the adjustment.")

        outval = {"url": inic}
        arcpy.SetParameterAsText(4, json.dumps(outval))

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        arcpy.AddError(err)

    finally:
        if inic and aisurl:
            token, referer = rasterutils.getToken(inic, 5)
            rasterutils.startService(aisurl, token)
