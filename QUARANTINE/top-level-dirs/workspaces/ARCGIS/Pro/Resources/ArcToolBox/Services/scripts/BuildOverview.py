"""-----------------------------------------------------------------------------
Name:              BuildOverview.py
Purpose:           Build Overview for image collection
Author:            Esri Inc.
Created:           8/21/2018
Copyright:   (c)   Esri, Inc. 2018
ArcGIS Version:    10.7
-----------------------------------------------------------------------------"""
# core libraries
import json
import os

# internal libraries
import arcpy
import rasterutils


TASK_NAME = 'BuildOverview'


if __name__ == '__main__':

    inic = arcpy.GetParameterAsText(0)
    ovrcs = arcpy.GetParameter(1)
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
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags, "om")
        arcpy.env.overwriteOutput = 1

        # 2. Get input image collection path
        inic = rasterutils.getInDataPath(inic)
        icpath = rasterutils.getImageServiceDatasource(inic)
        aisurl = rasterutils.getISAdminUrl(inic)

        if icpath:
            if not ovrcs:
                # 2. Get the proper cell size for the overview tile
                with arcpy.da.SearchCursor(icpath, ["HighPS", "MaxPS"], sql_clause=(None, 'ORDER BY HighPS DESC')) as cur:
                    row = cur.next()
                    highps = row[0]
                    maxps = row[1]
            else:
                highps = float(ovrcs)
                maxps = highps * 10

            if highps:
                # Default to 20 times of the lowest resolution image in the collection
                ovrlowcs = highps * 4
                ovrmaxcs = ovrlowcs * 1000
                # Look up hosted data location in the mosaic dataset key metadata
                # The hosted data location keymeta data could be like this:
                # e.g. "_store"  "/cloudStores/<item id>/....,/cloudStores/abc..."
                hostedflder = arcpy.GetRasterKeyMetadata(icpath, "_store")
                if hostedflder and isinstance(hostedflder, str):
                    hostedflder = hostedflder.split(",")[0]
                    ovrpath = rasterutils.appendcrf(hostedflder + "/ovr")
                else:
                    ovrpath = rasterutils.appendcrf(os.path.basename(icpath) + "ovr")

                # For ArcGIS Online, the overview crf will always be in
                # <item id> "folder" in the cloud store
                if rasterutils.RUN_ON_AGOL:
                    itemid = rasterutils.getItemID(aisurl)
                    ovrpath = rasterutils.appendcrf(itemid + "/ovr")

                # Generating single overview tile
                # Note: Copy Raster should be able to create folder if not yet existed
                arcpy.env.cellSize = ovrlowcs
                # arcpy.AddMessage(icpath)
                # arcpy.AddMessage(ovrpath)
                arcpy.CopyRaster_management(icpath, ovrpath, format="CRF")

                # 3. Update ortho mosaic hosted image service
                uri = rasterutils.getURI(arcpy.GetMessages(), ovrpath)
                # Note: if the ovrpath is a complete path, the tool will not return uri.
                if uri:
                    ovrpath = uri

                arcpy.AddMessage("Updating service with overview...")
                if not rasterutils.RUN_ON_AGOL:
                    # Stop service before adding ortho mosaic to mosaic dataset
                    token, referer = rasterutils.getToken(inic, 5)
                    rasterutils.stopService(aisurl, token)

                rasterutils._addOM2MD(ovrpath, icpath, minps=min(ovrlowcs, maxps))

                if not rasterutils.RUN_ON_AGOL:
                    # Restart hosted image collection service
                    token, referer = rasterutils.getToken(inic, 10)
                    rasterutils.startService(aisurl, token)
            else:
                arcpy.AddError("Cannot get the cell size from image collection for overview generation.")
        else:
            arcpy.AddError("Cannot get the image collection path.")

        outval = {"url": inic}
        arcpy.SetParameterAsText(3, json.dumps(outval))

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        arcpy.AddError(err)
