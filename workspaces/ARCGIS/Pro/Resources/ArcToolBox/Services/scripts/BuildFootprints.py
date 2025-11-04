"""-----------------------------------------------------------------------------
Name:              BuildFootprints.py
Purpose:           Build Footprints for image collection
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

TASK_NAME = 'BuildFootprints'

if __name__ == '__main__':

    inic = arcpy.GetParameterAsText(0)
    method = arcpy.GetParameterAsText(1)
    valuerange = arcpy.GetParameterAsText(2)
    context = arcpy.GetParameterAsText(3)

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

        footprintsparams = rasterutils._parseFootprints(context)

        if icpath:
            if not rasterutils.RUN_ON_AGOL:
                # 3. Stop service before color correction
                token, referer = rasterutils.getToken(inic, 5)
                rasterutils.stopService(aisurl, token)

            arcpy.AddMessage("Build footprints with {} method...".format(method))
            arcpy.BuildFootprints_management(
                icpath, where_clause=footprintsparams["whereClause"], reset_footprint=method,
                min_data_value=footprintsparams["minValue"], max_data_value=footprintsparams["maxValue"],
                approx_num_vertices=footprintsparams["numVertices"], shrink_distance=footprintsparams["shrinkDistance"],
                maintain_edges=footprintsparams["maintainEdge"], skip_derived_images=footprintsparams["skipDerivedImages"],
                update_boundary=footprintsparams["updateBoundary"], request_size=footprintsparams["requestSize"],
                min_region_size=footprintsparams["minRegionSize"], simplification_method=footprintsparams["simplification"],
                edge_tolerance=footprintsparams["edgeTorelance"], max_sliver_size=footprintsparams["maxSliverSize"],
                min_thinness_ratio=footprintsparams["minThinnessRatio"]
            )
            arcpy.AddMessage("Finished Build Footprints with {} method.".format(method))
        else:
            arcpy.AddError("Cannot get the image collection path.")

        if not rasterutils.RUN_ON_AGOL:
            token, referer = rasterutils.getToken(inic, 5)
            rasterutils.startService(aisurl, token)
        outval = {"url": inic}
        arcpy.SetParameterAsText(4, json.dumps(outval))

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        arcpy.AddError(err)
